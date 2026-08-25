package controllers

import (
	"net/http"

	"backend/internal/database"
	"backend/internal/models"

	"github.com/gin-gonic/gin"
)

type PostsPerDay struct {
	Date  string `json:"date"`
	Count int64  `json:"count"`
}

type PostsPerCategory struct {
	Category string `json:"category"`
	Count    int64  `json:"count"`
}

type TopPost struct {
	Title string `json:"title"`
	Views int    `json:"views"`
}

type DashboardStats struct {
	TotalSchools    int64 `json:"total_schools"`
	TotalUsers      int64 `json:"total_users"`
	TotalPosts      int64 `json:"total_posts"`
	TotalCategories int64 `json:"total_categories"`
	UserPosts       int64 `json:"user_posts"`
	UserPublished   int64 `json:"user_published"`
	UserDrafts      int64 `json:"user_drafts"`
	TotalViews      int64 `json:"total_views"`
	
	PostsPerDay      []PostsPerDay      `json:"posts_per_day"`
	PostsPerCategory []PostsPerCategory `json:"posts_per_category"`
	TopPosts         []TopPost          `json:"top_posts"`
}

func GetDashboardStats(c *gin.Context) {
	var stats DashboardStats

	isTenant := c.GetBool("isTenant")
	userRoleVal, _ := c.Get("userRole")
	role, _ := userRoleVal.(string)
	
	userIDVal, _ := c.Get("userId")
	userID := uint(0)
	if userIDVal != nil {
		if val, ok := userIDVal.(float64); ok {
			userID = uint(val)
		}
	}

	if role == "User" || role == "user" {
		database.DB.Model(&models.Post{}).Where("author_id = ?", userID).Count(&stats.UserPosts)
		database.DB.Model(&models.Post{}).Where("author_id = ? AND status = ?", userID, "published").Count(&stats.UserPublished)
		database.DB.Model(&models.Post{}).Where("author_id = ? AND status = ?", userID, "draft").Count(&stats.UserDrafts)
		database.DB.Model(&models.Post{}).Where("author_id = ?", userID).Select("COALESCE(SUM(views), 0)").Scan(&stats.TotalViews)

		database.DB.Model(&models.Post{}).
			Select("TO_CHAR(created_at, 'YYYY-MM-DD') as date, COUNT(id) as count").
			Where("author_id = ?", userID).
			Group("TO_CHAR(created_at, 'YYYY-MM-DD')").
			Order("date ASC").
			Limit(30).
			Scan(&stats.PostsPerDay)

		database.DB.Model(&models.Post{}).Select("title, views").Where("author_id = ?", userID).Order("views desc").Limit(5).Scan(&stats.TopPosts)

	} else if isTenant {
		schoolID, _ := c.Get("schoolId")
		database.DB.Model(&models.User{}).Where("school_id = ?", schoolID).Count(&stats.TotalUsers)
		database.DB.Model(&models.Post{}).Where("school_id = ?", schoolID).Count(&stats.TotalPosts)
		database.DB.Model(&models.Category{}).Where("school_id = ?", schoolID).Count(&stats.TotalCategories)
		database.DB.Model(&models.Post{}).Where("school_id = ?", schoolID).Select("COALESCE(SUM(views), 0)").Scan(&stats.TotalViews)

		database.DB.Model(&models.Post{}).
			Select("TO_CHAR(created_at, 'YYYY-MM-DD') as date, COUNT(id) as count").
			Where("school_id = ?", schoolID).
			Group("TO_CHAR(created_at, 'YYYY-MM-DD')").
			Order("date ASC").
			Limit(30).
			Scan(&stats.PostsPerDay)

		database.DB.Model(&models.Post{}).
			Select("categories.name as category, COUNT(posts.id) as count").
			Joins("LEFT JOIN categories ON categories.id = posts.category_id").
			Where("posts.school_id = ?", schoolID).
			Group("categories.name").
			Scan(&stats.PostsPerCategory)

		database.DB.Model(&models.Post{}).Select("title, views").Where("school_id = ?", schoolID).Order("views desc").Limit(5).Scan(&stats.TopPosts)
	} else {
		database.DB.Model(&models.School{}).Count(&stats.TotalSchools)
		database.DB.Model(&models.User{}).Where("school_id IS NULL").Count(&stats.TotalUsers)
		database.DB.Model(&models.Post{}).Where("school_id IS NULL").Count(&stats.TotalPosts)
		database.DB.Model(&models.Category{}).Where("school_id IS NULL").Count(&stats.TotalCategories)
		database.DB.Model(&models.Post{}).Where("school_id IS NULL").Select("COALESCE(SUM(views), 0)").Scan(&stats.TotalViews)

		database.DB.Model(&models.Post{}).
			Select("TO_CHAR(created_at, 'YYYY-MM-DD') as date, COUNT(id) as count").
			Group("TO_CHAR(created_at, 'YYYY-MM-DD')").
			Order("date ASC").
			Limit(30).
			Scan(&stats.PostsPerDay)

		database.DB.Model(&models.Post{}).
			Select("categories.name as category, COUNT(posts.id) as count").
			Joins("LEFT JOIN categories ON categories.id = posts.category_id").
			Group("categories.name").
			Scan(&stats.PostsPerCategory)

		database.DB.Model(&models.Post{}).Select("title, views").Where("school_id IS NULL").Order("views desc").Limit(5).Scan(&stats.TopPosts)
	}

	c.JSON(http.StatusOK, gin.H{
		"stats": stats,
	})
}
