package controllers

import (
	"net/http"
	"strconv"

	"backend/internal/database"
	"backend/internal/models"

	"github.com/gin-gonic/gin"
)

// GetCategories returns all categories
func GetCategories(c *gin.Context) {
	var categories []models.Category
	if err := database.DB.Preload("Parent").Order("position asc").Find(&categories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch categories"})
		return
	}
	c.JSON(http.StatusOK, categories)
}

// CreateCategory creates a new category
func CreateCategory(c *gin.Context) {
	var input struct {
		Name         string `json:"name" binding:"required"`
		Slug         string `json:"slug" binding:"required"`
		ParentID     *uint  `json:"parent_id"`
		IsSchoolList bool   `json:"is_school_list"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	category := models.Category{
		Name:         input.Name,
		Slug:         input.Slug,
		ParentID:     input.ParentID,
		IsSchoolList: input.IsSchoolList,
	}

	if err := database.DB.Create(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create category"})
		return
	}

	c.JSON(http.StatusCreated, category)
}

// UpdateCategory updates a category
func UpdateCategory(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID"})
		return
	}

	var category models.Category

	if err := database.DB.First(&category, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}

	var input struct {
		Name         string `json:"name"`
		Slug         string `json:"slug"`
		ParentID     *uint  `json:"parent_id"`
		IsSchoolList bool   `json:"is_school_list"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	database.DB.Model(&category).Updates(map[string]interface{}{
		"name":           input.Name,
		"slug":           input.Slug,
		"parent_id":      input.ParentID,
		"is_school_list": input.IsSchoolList,
	})

	c.JSON(http.StatusOK, category)
}

// DeleteCategory deletes a category
func DeleteCategory(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID"})
		return
	}

	var category models.Category

	if err := database.DB.First(&category, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}

	database.DB.Delete(&category)
	c.JSON(http.StatusOK, gin.H{"message": "Category deleted successfully"})
}

// ReorderCategories updates the parent_id and position of multiple categories
func ReorderCategories(c *gin.Context) {
	var items []struct {
		ID       uint  `json:"id"`
		ParentID *uint `json:"parent_id"`
		Position int   `json:"position"`
	}

	if err := c.ShouldBindJSON(&items); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx := database.DB.Begin()
	for _, item := range items {
		if err := tx.Model(&models.Category{}).Where("id = ?", item.ID).Updates(map[string]interface{}{
			"parent_id": item.ParentID,
			"position":  item.Position,
		}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reorder categories"})
			return
		}
	}
	tx.Commit()

	c.JSON(http.StatusOK, gin.H{"message": "Categories reordered successfully"})
}
