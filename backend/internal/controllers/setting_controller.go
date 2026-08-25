package controllers

import (
	"net/http"

	"backend/internal/database"
	"backend/internal/models"

	"github.com/gin-gonic/gin"
)

func GetSettings(c *gin.Context) {
	isTenantVal, ok := c.Get("isTenant")
	if !ok || isTenantVal.(bool) {
		c.JSON(http.StatusForbidden, gin.H{"message": "Akses ditolak. Hanya Super Admin."})
		return
	}

	var settings []models.Setting
	database.DB.Find(&settings)

	config := gin.H{
		"phone":       "",
		"email":       "",
		"facebook":    "",
		"twitter":     "",
		"instagram":   "",
		"youtube":     "",
	}

	for _, s := range settings {
		config[s.Key] = s.Value
	}

	c.JSON(http.StatusOK, config)
}

func UpdateSettings(c *gin.Context) {
	isTenantVal, ok := c.Get("isTenant")
	if !ok || isTenantVal.(bool) {
		c.JSON(http.StatusForbidden, gin.H{"message": "Akses ditolak. Hanya Super Admin."})
		return
	}

	var req map[string]string
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Format data tidak valid"})
		return
	}

	// Update or create each setting
	for key, value := range req {
		var setting models.Setting
		if err := database.DB.Where("key = ?", key).First(&setting).Error; err != nil {
			// Not found, create new
			setting = models.Setting{Key: key, Value: value}
			database.DB.Create(&setting)
		} else {
			// Found, update
			setting.Value = value
			database.DB.Save(&setting)
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Pengaturan berhasil disimpan"})
}

func UpdateSchoolSettings(c *gin.Context) {
	isTenantVal, ok := c.Get("isTenant")
	if !ok || !isTenantVal.(bool) {
		c.JSON(http.StatusForbidden, gin.H{"message": "Akses ditolak. Hanya Admin Sekolah."})
		return
	}

	schoolID, _ := c.Get("schoolId")
	
	var req struct {
		Phone     string `json:"phone"`
		Email     string `json:"email"`
		Facebook  string `json:"facebook"`
		Twitter   string `json:"twitter"`
		Instagram string `json:"instagram"`
		Youtube   string `json:"youtube"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Format data tidak valid"})
		return
	}

	var school models.School
	if err := database.DB.First(&school, schoolID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Sekolah tidak ditemukan"})
		return
	}

	school.Phone = req.Phone
	school.Email = req.Email
	school.Facebook = req.Facebook
	school.Twitter = req.Twitter
	school.Instagram = req.Instagram
	school.Youtube = req.Youtube

	if err := database.DB.Save(&school).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menyimpan pengaturan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Pengaturan kontak berhasil disimpan"})
}
