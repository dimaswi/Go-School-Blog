package controllers

import (
	"net/http"

	"backend/internal/database"
	"backend/internal/models"

	"github.com/gin-gonic/gin"
)

// GetPublicAds returns active ads for a school
func GetPublicAds(c *gin.Context) {
	var ads []models.Ad
	query := database.DB.Where("is_active = ?", true)

	isTenant := c.GetBool("isTenant")
	if isTenant {
		if sID, exists := c.Get("schoolId"); exists {
			query = query.Where("school_id = ?", sID)
		}
	} else {
		// Only main domain ads (school_id is null)
		query = query.Where("school_id IS NULL")
	}

	if pageTarget := c.Query("page_target"); pageTarget != "" {
		query = query.Where("page_target = ?", pageTarget)
	} else {
		// Default to home for backward compatibility if not specified
		query = query.Where("page_target = ?", "home")
	}

	if postID := c.Query("post_id"); postID != "" {
		query = query.Where("target_post_id = ?", postID)
	}

	if err := query.Find(&ads).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch ads"})
		return
	}

	c.JSON(http.StatusOK, ads)
}

// GetAds returns all ads for a tenant
func GetAds(c *gin.Context) {
	var ads []models.Ad
	query := database.DB.Model(&models.Ad{})

	isTenant := c.GetBool("isTenant")
	if isTenant {
		if sID, exists := c.Get("schoolId"); exists {
			query = query.Where("school_id = ?", sID)
		}
	} else {
		query = query.Where("school_id IS NULL")
	}

	if err := query.Find(&ads).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch ads"})
		return
	}

	c.JSON(http.StatusOK, ads)
}

// GetAd returns a single ad by ID
func GetAd(c *gin.Context) {
	id := c.Param("id")
	var ad models.Ad
	query := database.DB.Where("id = ?", id)

	isTenant := c.GetBool("isTenant")
	if isTenant {
		if sID, exists := c.Get("schoolId"); exists {
			query = query.Where("school_id = ?", sID)
		}
	} else {
		query = query.Where("school_id IS NULL")
	}

	if err := query.First(&ad).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ad not found"})
		return
	}

	c.JSON(http.StatusOK, ad)
}

// CreateAd creates a new ad
func CreateAd(c *gin.Context) {
	var ad models.Ad

	if err := c.ShouldBindJSON(&ad); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	isTenant := c.GetBool("isTenant")
	if isTenant {
		if sID, exists := c.Get("schoolId"); exists {
			parsedID := sID.(uint)
			ad.SchoolID = &parsedID
		}
	}
	// Super Admin: SchoolID stays nil

	if err := database.DB.Create(&ad).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create ad"})
		return
	}

	c.JSON(http.StatusCreated, ad)
}

// UpdateAd updates an existing ad
func UpdateAd(c *gin.Context) {
	id := c.Param("id")
	var ad models.Ad
	query := database.DB.Where("id = ?", id)

	isTenant := c.GetBool("isTenant")
	if isTenant {
		if sID, exists := c.Get("schoolId"); exists {
			query = query.Where("school_id = ?", sID)
		}
	} else {
		query = query.Where("school_id IS NULL")
	}

	if err := query.First(&ad).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ad not found"})
		return
	}

	if err := c.ShouldBindJSON(&ad); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Save(&ad).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update ad"})
		return
	}

	c.JSON(http.StatusOK, ad)
}

// DeleteAd deletes an ad
func DeleteAd(c *gin.Context) {
	id := c.Param("id")
	var ad models.Ad
	query := database.DB.Where("id = ?", id)

	isTenant := c.GetBool("isTenant")
	if isTenant {
		if sID, exists := c.Get("schoolId"); exists {
			query = query.Where("school_id = ?", sID)
		}
	} else {
		query = query.Where("school_id IS NULL")
	}

	if err := query.First(&ad).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ad not found"})
		return
	}

	if err := database.DB.Delete(&ad).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete ad"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Ad deleted successfully"})
}
