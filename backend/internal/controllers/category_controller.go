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
	query := database.DB.Preload("Parent").Order("position asc")

	// Apply tenant filter
	isTenant := c.GetBool("isTenant")
	if isTenant {
		schoolID, exists := c.Get("schoolId")
		if exists {
			query = query.Where("school_id = ?", schoolID)
		}
	} else {
		query = query.Where("school_id IS NULL")
	}

	if err := query.Find(&categories).Error; err != nil {
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

	var schoolIDPtr *uint
	isTenant := c.GetBool("isTenant")
	if isTenant {
		if sID, exists := c.Get("schoolId"); exists {
			parsedID := sID.(uint)
			schoolIDPtr = &parsedID
		}
	}

	category := models.Category{
		Name:         input.Name,
		Slug:         input.Slug,
		ParentID:     input.ParentID,
		SchoolID:     schoolIDPtr,
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
	query := database.DB.Where("id = ?", id)

	isTenant := c.GetBool("isTenant")
	if isTenant {
		schoolID, _ := c.Get("schoolId")
		query = query.Where("school_id = ?", schoolID)
	} else {
		query = query.Where("school_id IS NULL")
	}

	if err := query.First(&category).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found or unauthorized"})
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
	query := database.DB.Where("id = ?", id)

	isTenant := c.GetBool("isTenant")
	if isTenant {
		schoolID, _ := c.Get("schoolId")
		query = query.Where("school_id = ?", schoolID)
	} else {
		query = query.Where("school_id IS NULL")
	}

	if err := query.First(&category).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found or unauthorized"})
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

	isTenant := c.GetBool("isTenant")
	var schoolIDPtr *uint
	if isTenant {
		if sID, exists := c.Get("schoolId"); exists {
			parsedID := sID.(uint)
			schoolIDPtr = &parsedID
		}
	}

	tx := database.DB.Begin()
	for _, item := range items {
		query := tx.Model(&models.Category{}).Where("id = ?", item.ID)
		
		if isTenant {
			query = query.Where("school_id = ?", schoolIDPtr)
		} else {
			query = query.Where("school_id IS NULL")
		}

		if err := query.Updates(map[string]interface{}{
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

// GetPublicCategories returns all categories for public navigation
func GetPublicCategories(c *gin.Context) {
	var categories []models.Category
	query := database.DB.Preload("Parent").Order("position asc")

	isTenant := c.GetBool("isTenant")
	if isTenant {
		schoolID, exists := c.Get("schoolId")
		if exists {
			query = query.Where("school_id = ?", schoolID)
		}
	} else {
		query = query.Where("school_id IS NULL")
	}

	if err := query.Find(&categories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch categories"})
		return
	}
	c.JSON(http.StatusOK, categories)
}
