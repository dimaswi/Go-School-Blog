package controllers

import (
	"net/http"
	"strconv"

	"backend/internal/database"
	"backend/internal/models"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type UserResponse struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	Username  string  `json:"username"`
	Role      string  `json:"role"`
	School    *string `json:"school"`
	Subdomain *string `json:"subdomain"`
}

type CreateUserRequest struct {
	Name     string `json:"name" binding:"required"`
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	RoleID   uint   `json:"role_id"` // Removed required to allow tenant override
}

func CreateUser(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Input tidak valid", "error": err.Error()})
		return
	}

	// Cek apakah username sudah ada
	var existingUser models.User
	if err := database.DB.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"message": "Username sudah digunakan"})
		return
	}

	isTenantVal, ok := c.Get("isTenant")
	isTenant := ok && isTenantVal.(bool)

	var schoolID *uint
	if isTenant {
		schoolIdVal, exists := c.Get("schoolId")
		if !exists {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Data tenant tidak ditemukan"})
			return
		}
		sID := schoolIdVal.(uint)
		schoolID = &sID

		var userRole models.Role
		if err := database.DB.Where("name = ?", "User").First(&userRole).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Role User tidak ditemukan"})
			return
		}
		req.RoleID = userRole.ID
	} else {
		// Super admin wajib mengisi RoleID
		if req.RoleID == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Role wajib dipilih"})
			return
		}
	}

	// Encrypt password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengenkripsi password"})
		return
	}

	user := models.User{
		Name:     req.Name,
		Username: req.Username,
		Password: string(hashedPassword),
		RoleID:   req.RoleID,
		SchoolID: schoolID,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menyimpan data user"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "User berhasil dibuat", "user": user})
}

func GetUsers(c *gin.Context) {
	var users []models.User
	
	query := database.DB.Preload("Role").Preload("School")
	
	isTenantVal, ok := c.Get("isTenant")
	if ok && isTenantVal.(bool) {
		schoolIdVal, _ := c.Get("schoolId")
		query = query.Where("school_id = ?", schoolIdVal)
	}
	
	if err := query.Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil data user"})
		return
	}

	// Format response sesuai kebutuhan frontend (kolom DataTable)
	var response []UserResponse
	for _, user := range users {
		var schoolName *string
		var subdomain *string
		if user.School != nil {
			schoolName = &user.School.Name
			subdomain = &user.School.Subdomain
		}

		response = append(response, UserResponse{
			ID:        strconv.Itoa(int(user.ID)), // ID perlu diubah jadi string karena frontend type User.id is string
			Name:      user.Name,
			Username:  user.Username,
			Role:      user.Role.Name,
			School:    schoolName,
			Subdomain: subdomain,
		})
	}

	c.JSON(http.StatusOK, response)
}

func UpdatePassword(c *gin.Context) {
	id := c.Param("id")
	var user models.User

	if err := database.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "User tidak ditemukan"})
		return
	}

	var req struct {
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Input tidak valid"})
		return
	}

	if len(req.Password) < 6 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Password minimal 6 karakter"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengenkripsi password"})
		return
	}

	user.Password = string(hashedPassword)
	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menyimpan password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password berhasil diperbarui"})
}

func UpdateUser(c *gin.Context) {
	id := c.Param("id")
	var user models.User

	if err := database.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "User tidak ditemukan"})
		return
	}

	var req struct {
		Name     string `json:"name"`
		Username string `json:"username"`
		RoleID   uint   `json:"role_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Input tidak valid", "error": err.Error()})
		return
	}

	// Cek username bentrok jika diubah
	if req.Username != "" && req.Username != user.Username {
		var existingUser models.User
		if err := database.DB.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"message": "Username sudah digunakan"})
			return
		}
		user.Username = req.Username
	}

	if req.Name != "" {
		user.Name = req.Name
	}
	
	if req.RoleID != 0 {
		user.RoleID = req.RoleID
	}

	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal memperbarui data user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User berhasil diperbarui", "user": user})
}

func DeleteUser(c *gin.Context) {
	id := c.Param("id")
	var user models.User

	if err := database.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "User tidak ditemukan"})
		return
	}

	// Jangan izinkan superadmin default dihapus (asumsi username "superadmin" atau ID 1)
	if user.Username == "superadmin" {
		c.JSON(http.StatusForbidden, gin.H{"message": "Tidak dapat menghapus superadmin default"})
		return
	}

	// Hapus user
	if err := database.DB.Delete(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menghapus user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User berhasil dihapus"})
}
