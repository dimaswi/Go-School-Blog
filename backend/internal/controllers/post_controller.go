package controllers

import (
	"net/http"
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
		// If Super Admin tries to create post without a school context...
		// In a real app, you might pass school_id in the body.
		c.JSON(http.StatusBadRequest, gin.H{"error": "Super Admins must belong to a school to post, or provide a school_id"})
		return
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
		SchoolID:     *user.SchoolID,
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
		if post.SchoolID != uint(schoolID.(float64)) {
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
		if post.SchoolID != uint(schoolID.(float64)) {
			c.JSON(http.StatusForbidden, gin.H{"error": "You do not have permission to delete this post"})
			return
		}
	}

	database.DB.Delete(&post)
	c.JSON(http.StatusOK, gin.H{"message": "Post deleted successfully"})
}
