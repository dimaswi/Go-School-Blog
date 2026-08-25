package controllers

import (
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"backend/internal/database"
	"backend/internal/models"

	"github.com/gin-gonic/gin"
)

// GetPosts returns a list of posts
func GetPosts(c *gin.Context) {
	var posts []models.Post
	query := database.DB.Preload("Category").Preload("Author").Preload("School")

	// Filter by school if the user is a tenant admin, or if school_id is passed
	isTenantVal, ok := c.Get("isTenant")
	isTenant := ok && isTenantVal.(bool)

	if isTenant {
		schoolID, _ := c.Get("schoolId")
		query = query.Where("school_id = ?", schoolID)
		
		// If role is just 'user', only show their own posts
		userRoleVal, _ := c.Get("userRole")
		if userRole, ok := userRoleVal.(string); ok && strings.ToLower(userRole) == "user" {
			userIDVal, _ := c.Get("userId")
			userID := uint(userIDVal.(float64))
			query = query.Where("author_id = ?", userID)
		}
	} else {
		// Super Admin can filter by school_id query param
		if schoolID := c.Query("school_id"); schoolID != "" {
			query = query.Where("school_id = ?", schoolID)
		}
	}

	// Filter by category slug
	if categorySlug := c.Query("category"); categorySlug != "" {
		var category models.Category
		if err := database.DB.Where("slug = ?", categorySlug).First(&category).Error; err == nil {
			query = query.Where("category_id = ?", category.ID)
		}
	}

	// Filter by status (e.g. published)
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	
	// Filter by main_domain_status (for super admin)
	if mainDomainStatus := c.Query("main_domain_status"); mainDomainStatus != "" {
		query = query.Where("main_domain_status = ?", mainDomainStatus)
	}

	// Sort by views for "Trending"
	if sortBy := c.Query("sort"); sortBy == "views" {
		query = query.Order("views desc")
	} else {
		query = query.Order("created_at desc")
	}

	if err := query.Find(&posts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch posts"})
		return
	}
	c.JSON(http.StatusOK, posts)
}

// GetPost returns a single post by ID
func GetPost(c *gin.Context) {
	id := c.Param("id")
	var post models.Post

	query := database.DB.Preload("Category").Preload("Author").Preload("School")
	
	if err := query.First(&post, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	c.JSON(http.StatusOK, post)
}

// RequestMainDomain allows tenant to request their post to be shown on the main domain
func RequestMainDomain(c *gin.Context) {
	id := c.Param("id")
	var post models.Post

	if err := database.DB.First(&post, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	// Verify ownership
	isTenantVal, ok := c.Get("isTenant")
	isTenant := ok && isTenantVal.(bool)
	if isTenant {
		schoolID, _ := c.Get("schoolId")
		if post.SchoolID == nil || *post.SchoolID != schoolID.(uint) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized"})
			return
		}
	}

	if post.Status != "published" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only published posts can be submitted"})
		return
	}

	post.MainDomainStatus = "pending"
	if err := database.DB.Save(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to submit request"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Request submitted", "post": post})
}

// ApproveMainDomain allows super admin to approve a post for the main domain
func ApproveMainDomain(c *gin.Context) {
	id := c.Param("id")
	var post models.Post

	if err := database.DB.First(&post, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	post.MainDomainStatus = "approved"
	if err := database.DB.Save(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to approve post"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post approved for main domain", "post": post})
}

// RejectMainDomain allows super admin to reject a post for the main domain
func RejectMainDomain(c *gin.Context) {
	id := c.Param("id")
	var post models.Post

	if err := database.DB.First(&post, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	post.MainDomainStatus = "rejected"
	if err := database.DB.Save(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reject post"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post rejected for main domain", "post": post})
}

// SubmitSchoolApproval allows a user to submit their post for school admin approval
func SubmitSchoolApproval(c *gin.Context) {
	id := c.Param("id")
	var post models.Post

	if err := database.DB.First(&post, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	// Verify ownership
	userIDVal, _ := c.Get("userId")
	userID := uint(userIDVal.(float64))
	if post.AuthorID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized"})
		return
	}

	if post.Status != "draft" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only draft posts can be submitted"})
		return
	}

	post.Status = "pending"
	if err := database.DB.Save(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to submit post"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post submitted for approval", "post": post})
}

// ApproveSchoolApproval allows school admin to approve a post
func ApproveSchoolApproval(c *gin.Context) {
	id := c.Param("id")
	var post models.Post

	if err := database.DB.First(&post, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	// Verify tenant
	isTenantVal, ok := c.Get("isTenant")
	isTenant := ok && isTenantVal.(bool)
	if isTenant {
		schoolID, _ := c.Get("schoolId")
		if post.SchoolID == nil || *post.SchoolID != schoolID.(uint) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized"})
			return
		}
	}

	post.Status = "published"
	now := time.Now()
	post.PublishedAt = &now
	
	if err := database.DB.Save(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to approve post"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post approved and published", "post": post})
}

// RejectSchoolApproval allows school admin to reject a post
func RejectSchoolApproval(c *gin.Context) {
	id := c.Param("id")
	var post models.Post

	if err := database.DB.First(&post, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	// Verify tenant
	isTenantVal, ok := c.Get("isTenant")
	isTenant := ok && isTenantVal.(bool)
	if isTenant {
		schoolID, _ := c.Get("schoolId")
		if post.SchoolID == nil || *post.SchoolID != schoolID.(uint) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized"})
			return
		}
	}

	post.Status = "rejected"
	if err := database.DB.Save(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reject post"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post rejected", "post": post})
}


// CreatePost creates a new post
func CreatePost(c *gin.Context) {
	var input struct {
		Title        string `json:"title" binding:"required"`
		Slug         string `json:"slug" binding:"required"`
		Content      string `json:"content" binding:"required"`
		Excerpt      string `json:"excerpt"`
		ThumbnailURL string `json:"thumbnail_url"`
		Status       string `json:"status" binding:"required"`
		CategoryID   uint   `json:"category_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get Author from context
	authorIDVal, _ := c.Get("userId")
	authorID := uint(authorIDVal.(float64)) // JWT claims are parsed as float64

	// Get School ID from context (if tenant) or require it?
	// For now, assume posts can only be created by users belonging to a school.
	// If a super admin creates a post, they should probably select a school, but let's default to their school_id
	
	var user models.User
	if err := database.DB.First(&user, authorID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify user"})
		return
	}

	if user.SchoolID == nil {
		// Super Admin posting globally
	}

	post := models.Post{
		Title:        input.Title,
		Slug:         input.Slug,
		Content:      input.Content,
		Excerpt:      input.Excerpt,
		ThumbnailURL: input.ThumbnailURL,
		Status:       input.Status,
		CategoryID:   input.CategoryID,
		AuthorID:     authorID,
		SchoolID:     user.SchoolID,
	}

	if input.Status == "published" {
		now := time.Now()
		post.PublishedAt = &now
	}

	if err := database.DB.Create(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create post"})
		return
	}

	c.JSON(http.StatusCreated, post)
}

// UpdatePost updates a post
func UpdatePost(c *gin.Context) {
	id := c.Param("id")
	var post models.Post

	if err := database.DB.First(&post, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	// Verify ownership (tenant isolation)
	isTenantVal, ok := c.Get("isTenant")
	isTenant := ok && isTenantVal.(bool)
	if isTenant {
		schoolID, _ := c.Get("schoolId")
		tenantSchoolID := schoolID.(uint)
		if post.SchoolID == nil || *post.SchoolID != tenantSchoolID {
			c.JSON(http.StatusForbidden, gin.H{"error": "You do not have permission to edit this post"})
			return
		}
	}

	var input struct {
		Title        string `json:"title"`
		Slug         string `json:"slug"`
		Content      string `json:"content"`
		Excerpt      string `json:"excerpt"`
		ThumbnailURL string `json:"thumbnail_url"`
		Status       string `json:"status"`
		CategoryID   uint   `json:"category_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields
	updates := models.Post{
		Title:        input.Title,
		Slug:         input.Slug,
		Content:      input.Content,
		Excerpt:      input.Excerpt,
		ThumbnailURL: input.ThumbnailURL,
		Status:       input.Status,
		CategoryID:   input.CategoryID,
	}

	if input.Status == "published" && post.Status != "published" {
		now := time.Now()
		updates.PublishedAt = &now
	} else if input.Status != "published" {
		updates.PublishedAt = nil
	}

	database.DB.Model(&post).Updates(updates)

	c.JSON(http.StatusOK, post)
}

// DeletePost deletes a post
func DeletePost(c *gin.Context) {
	id := c.Param("id")
	var post models.Post

	if err := database.DB.First(&post, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	// Verify ownership (tenant isolation)
	isTenantVal, ok := c.Get("isTenant")
	isTenant := ok && isTenantVal.(bool)
	if isTenant {
		schoolID, _ := c.Get("schoolId")
		tenantSchoolID := schoolID.(uint)
		if post.SchoolID == nil || *post.SchoolID != tenantSchoolID {
			c.JSON(http.StatusForbidden, gin.H{"error": "You do not have permission to delete this post"})
			return
		}
	}

	database.DB.Delete(&post)
	c.JSON(http.StatusOK, gin.H{"message": "Post deleted successfully"})
}

// GetPublicPosts returns published posts for public facing blog
func GetPublicPosts(c *gin.Context) {
	var posts []models.Post
	query := database.DB.Model(&models.Post{}).Preload("Category").Preload("Author").Preload("School").Where("status = ?", "published")

	// Filter by time
	if timeFilter := c.Query("time"); timeFilter == "month" {
		now := time.Now()
		startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
		query = query.Where("published_at >= ?", startOfMonth)
	}

	isTenantVal, ok := c.Get("isTenant")
	isTenant := ok && isTenantVal.(bool)

	if isTenant {
		schoolID, _ := c.Get("schoolId")
		query = query.Where("school_id = ?", schoolID)
	} else {
		// Root domain: super admin posts (school_id is null) OR approved tenant posts
		query = query.Where("school_id IS NULL OR main_domain_status = ?", "approved")
	}

	// Filter by category slug
	if categorySlug := c.Query("category"); categorySlug != "" {
		var category models.Category
		catQuery := database.DB.Where("slug = ?", categorySlug)
		
		if isTenant {
			schoolID, _ := c.Get("schoolId")
			catQuery = catQuery.Where("school_id = ?", schoolID)
		} else {
			catQuery = catQuery.Where("school_id IS NULL")
		}

		if err := catQuery.First(&category).Error; err == nil {
			query = query.Where("category_id = ?", category.ID)
		} else {
			// Category not found, return empty result
			c.JSON(http.StatusOK, gin.H{
				"data":         []models.Post{},
				"total":        0,
				"current_page": 1,
				"last_page":    1,
			})
			return
		}
	}

	// Filter by search query
	if search := c.Query("search"); search != "" {
		searchPattern := "%" + search + "%"
		query = query.Where("title LIKE ? OR excerpt LIKE ? OR content LIKE ?", searchPattern, searchPattern, searchPattern)
	}

	// Count total before pagination and ordering
	var total int64
	query.Count(&total)

	// Sort by views or created_at
	if sortBy := c.Query("sort"); sortBy == "views" {
		query = query.Order("views desc")
	} else {
		query = query.Order("published_at desc")
	}

	// Pagination
	page := 1
	if pageStr := c.Query("page"); pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	limit := 10
	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	offset := (page - 1) * limit
	query = query.Limit(limit).Offset(offset)

	if err := query.Find(&posts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch posts", "details": err.Error()})
		return
	}

	lastPage := int(math.Ceil(float64(total) / float64(limit)))
	if lastPage == 0 {
		lastPage = 1
	}

	c.JSON(http.StatusOK, gin.H{
		"data":         posts,
		"total":        total,
		"current_page": page,
		"last_page":    lastPage,
	})
}

// GetPublicPost returns a single published post by slug
func GetPublicPost(c *gin.Context) {
	slug := c.Param("slug")
	var post models.Post

	query := database.DB.Preload("Category").Preload("Author").Preload("School").Where("status = ?", "published")

	isTenantVal, ok := c.Get("isTenant")
	isTenant := ok && isTenantVal.(bool)

	if isTenant {
		schoolID, _ := c.Get("schoolId")
		query = query.Where("school_id = ?", schoolID)
	} else {
		// Root domain: super admin posts (school_id is null) OR approved tenant posts
		query = query.Where("school_id IS NULL OR main_domain_status = ?", "approved")
	}

	if err := query.Where("slug = ?", slug).First(&post).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
		return
	}

	// Increment views
	database.DB.Model(&post).Update("views", post.Views+1)

	c.JSON(http.StatusOK, post)
}

