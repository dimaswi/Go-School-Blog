package controllers

import (
	"backend/internal/database"
	"backend/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetPublicAnnouncement fetches the single active announcement
func GetPublicAnnouncement(c *gin.Context) {
	var announcement models.Announcement
	query := database.DB.Where("is_active = ?", true)

	isTenantVal, ok := c.Get("isTenant")
	isTenant := ok && isTenantVal.(bool)

	if isTenant {
		schoolID, _ := c.Get("schoolId")
		query = query.Where("school_id = ?", schoolID)
	} else {
		// For main domain, fetch super admin announcement (school_id is null)
		query = query.Where("school_id IS NULL")
	}

	if err := query.First(&announcement).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"data": nil})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": announcement})
}

// Admin endpoints

// GetAnnouncements gets all announcements for the current tenant/admin
func GetAnnouncements(c *gin.Context) {
	var announcements []models.Announcement
	query := database.DB.Model(&models.Announcement{})

	userRole, _ := c.Get("userRole")
	if userRole != "Super Admin" {
		schoolID, _ := c.Get("schoolId")
		query = query.Where("school_id = ?", schoolID)
	} else {
		// Super admin sees their own announcements
		query = query.Where("school_id IS NULL")
	}

	query.Order("created_at desc").Find(&announcements)
	c.JSON(http.StatusOK, gin.H{"data": announcements})
}

// CreateAnnouncement creates a new announcement
func CreateAnnouncement(c *gin.Context) {
	var input struct {
		Content string `json:"content" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	announcement := models.Announcement{
		Content: input.Content,
	}

	userRole, _ := c.Get("userRole")
	if userRole != "Super Admin" {
		schoolIDVal, _ := c.Get("schoolId")
		var schoolID uint
		if val, ok := schoolIDVal.(uint); ok {
			schoolID = val
		} else if val, ok := schoolIDVal.(float64); ok {
			schoolID = uint(val)
		}
		announcement.SchoolID = &schoolID
	}

	database.DB.Create(&announcement)
	c.JSON(http.StatusCreated, gin.H{"data": announcement, "message": "Announcement created"})
}

// UpdateAnnouncement updates an announcement's content
func UpdateAnnouncement(c *gin.Context) {
	var announcement models.Announcement
	id := c.Param("id")

	query := database.DB.Where("id = ?", id)
	userRole, _ := c.Get("userRole")
	if userRole != "Super Admin" {
		schoolID, _ := c.Get("schoolId")
		query = query.Where("school_id = ?", schoolID)
	} else {
		query = query.Where("school_id IS NULL")
	}

	if err := query.First(&announcement).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Announcement not found"})
		return
	}

	var input struct {
		Content string `json:"content" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	database.DB.Model(&announcement).Update("content", input.Content)
	c.JSON(http.StatusOK, gin.H{"data": announcement, "message": "Announcement updated"})
}

// DeleteAnnouncement deletes an announcement
func DeleteAnnouncement(c *gin.Context) {
	var announcement models.Announcement
	id := c.Param("id")

	query := database.DB.Where("id = ?", id)
	userRole, _ := c.Get("userRole")
	if userRole != "Super Admin" {
		schoolID, _ := c.Get("schoolId")
		query = query.Where("school_id = ?", schoolID)
	} else {
		query = query.Where("school_id IS NULL")
	}

	if err := query.First(&announcement).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Announcement not found"})
		return
	}

	database.DB.Delete(&announcement)
	c.JSON(http.StatusOK, gin.H{"message": "Announcement deleted"})
}

// SetActiveAnnouncement sets exactly one announcement as active for the tenant
func SetActiveAnnouncement(c *gin.Context) {
	id := c.Param("id")
	var announcement models.Announcement

	query := database.DB.Where("id = ?", id)
	var schoolID interface{}

	userRole, _ := c.Get("userRole")
	if userRole != "Super Admin" {
		schoolID, _ = c.Get("schoolId")
		query = query.Where("school_id = ?", schoolID)
	} else {
		query = query.Where("school_id IS NULL")
	}

	if err := query.First(&announcement).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Announcement not found"})
		return
	}

	// Transaction to ensure atomicity
	database.DB.Transaction(func(tx *gorm.DB) error {
		// Set all to inactive
		updateQuery := tx.Model(&models.Announcement{})
		if userRole != "Super Admin" {
			updateQuery = updateQuery.Where("school_id = ?", schoolID)
		} else {
			updateQuery = updateQuery.Where("school_id IS NULL")
		}
		
		if err := updateQuery.Update("is_active", false).Error; err != nil {
			return err
		}

		// Set the selected one to active
		if err := tx.Model(&announcement).Update("is_active", true).Error; err != nil {
			return err
		}

		return nil
	})

	c.JSON(http.StatusOK, gin.H{"message": "Announcement activated"})
}

// DeactivateAnnouncement deactivates the specified announcement
func DeactivateAnnouncement(c *gin.Context) {
	id := c.Param("id")
	var announcement models.Announcement

	query := database.DB.Where("id = ?", id)
	var schoolID interface{}

	userRole, _ := c.Get("userRole")
	if userRole != "Super Admin" {
		schoolID, _ = c.Get("schoolId")
		query = query.Where("school_id = ?", schoolID)
	} else {
		query = query.Where("school_id IS NULL")
	}

	if err := query.First(&announcement).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Announcement not found"})
		return
	}

	if err := database.DB.Model(&announcement).Update("is_active", false).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to deactivate announcement"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Announcement deactivated"})
}
