package controllers

import (
	"net/http"

	"backend/internal/database"
	"backend/internal/models"

	"github.com/gin-gonic/gin"
)

type DashboardStats struct {
	TotalUsers int64 `json:"total_users"`
	TotalRoles int64 `json:"total_roles"`
}

func GetDashboardStats(c *gin.Context) {
	var stats DashboardStats

	database.DB.Model(&models.User{}).Count(&stats.TotalUsers)
	database.DB.Model(&models.Role{}).Count(&stats.TotalRoles)

	c.JSON(http.StatusOK, gin.H{
		"stats": stats,
	})
}
