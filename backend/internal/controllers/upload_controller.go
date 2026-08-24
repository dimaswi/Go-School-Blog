package controllers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
)

func UploadFile(c *gin.Context) {
	// Only logged-in users can upload files (enforced by Protected middleware)
	
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "File is required"})
		return
	}

	// Create uploads directory if it doesn't exist
	uploadDir := "uploads"
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		os.Mkdir(uploadDir, 0755)
	}

	// Generate a unique filename using timestamp
	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("upload_%d%s", time.Now().UnixNano(), ext)
	dst := filepath.Join(uploadDir, filename)

	if err := c.SaveUploadedFile(file, dst); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to save file"})
		return
	}

	// Return relative URL
	url := fmt.Sprintf("/uploads/%s", filename)
	c.JSON(http.StatusOK, gin.H{
		"message": "File uploaded successfully",
		"url":     url,
	})
}
