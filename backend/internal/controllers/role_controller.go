package controllers

import (
	"net/http"
	"strconv"

	"backend/internal/database"
	"backend/internal/models"

	"github.com/gin-gonic/gin"
)

type RoleRequest struct {
	Name          string `json:"name"`
	Description   string `json:"description"`
	PermissionIDs []uint `json:"permission_ids"`
}

type RoleResponse struct {
	ID          string              `json:"id"`
	Name        string              `json:"name"`
	Description string              `json:"description"`
	Permissions []models.Permission `json:"permissions"`
}

func GetRoles(c *gin.Context) {
	var roles []models.Role
	if err := database.DB.Preload("Permissions").Find(&roles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil data role"})
		return
	}

	var response []RoleResponse
	for _, role := range roles {
		response = append(response, RoleResponse{
			ID:          strconv.Itoa(int(role.ID)),
			Name:        role.Name,
			Description: role.Description,
			Permissions: role.Permissions,
		})
	}

	c.JSON(http.StatusOK, response)
}

func GetPermissions(c *gin.Context) {
	var permissions []models.Permission
	if err := database.DB.Find(&permissions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil data permission"})
		return
	}
	c.JSON(http.StatusOK, permissions)
}

func CreateRole(c *gin.Context) {
	var req RoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Input tidak valid"})
		return
	}

	var permissions []models.Permission
	if len(req.PermissionIDs) > 0 {
		database.DB.Where("id IN ?", req.PermissionIDs).Find(&permissions)
	}

	role := models.Role{
		Name:        req.Name,
		Description: req.Description,
		Permissions: permissions,
	}

	if err := database.DB.Create(&role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal membuat role"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Role berhasil dibuat",
		"id":      strconv.Itoa(int(role.ID)),
	})
}

func UpdateRole(c *gin.Context) {
	id := c.Param("id")
	var role models.Role

	if err := database.DB.First(&role, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Role tidak ditemukan"})
		return
	}

	var req RoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Input tidak valid"})
		return
	}

	var permissions []models.Permission
	if len(req.PermissionIDs) > 0 {
		database.DB.Where("id IN ?", req.PermissionIDs).Find(&permissions)
	}

	role.Name = req.Name
	role.Description = req.Description

	if err := database.DB.Save(&role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menyimpan role"})
		return
	}

	// Update permissions (many-to-many replace)
	database.DB.Model(&role).Association("Permissions").Replace(permissions)

	c.JSON(http.StatusOK, gin.H{"message": "Role berhasil diupdate"})
}

func DeleteRole(c *gin.Context) {
	id := c.Param("id")
	var role models.Role

	if err := database.DB.First(&role, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Role tidak ditemukan"})
		return
	}

	// Hapus relasi permissions terlebih dahulu
	database.DB.Model(&role).Association("Permissions").Clear()

	if err := database.DB.Delete(&role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menghapus role"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Role berhasil dihapus"})
}
