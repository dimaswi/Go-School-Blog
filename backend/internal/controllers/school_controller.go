package controllers

import (
	"net/http"

	"backend/internal/database"
	"backend/internal/models"

	"github.com/gin-gonic/gin"
)

type CreateSchoolRequest struct {
	Name            string `json:"name"`
	Subdomain       string `json:"subdomain"`
	Address         string `json:"address"`
	Logo            string `json:"logo"`
	Phone           string `json:"phone"`
	Email           string `json:"email"`
	Facebook        string `json:"facebook"`
	Twitter         string `json:"twitter"`
	Instagram       string `json:"instagram"`
	Youtube         string `json:"youtube"`
}

func CreateSchool(c *gin.Context) {
	// Only super admin can create a school
	isTenantVal, ok := c.Get("isTenant")
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{"message": "Akses ditolak. Hanya Super Admin."})
		return
	}
	isTenant := isTenantVal.(bool)
	if isTenant {
		c.JSON(http.StatusForbidden, gin.H{"message": "Akses ditolak. Hanya Super Admin."})
		return
	}

	var req CreateSchoolRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Format data tidak valid"})
		return
	}

	// Begin transaction
	tx := database.DB.Begin()

	school := models.School{
		Name:      req.Name,
		Subdomain: req.Subdomain,
		Address:   req.Address,
		Logo:      req.Logo,
		Phone:     req.Phone,
		Email:     req.Email,
		Facebook:  req.Facebook,
		Twitter:   req.Twitter,
		Instagram: req.Instagram,
		Youtube:   req.Youtube,
	}

	if err := tx.Create(&school).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal membuat tenant sekolah", "error": err.Error()})
		return
	}

	// Commit transaction
	tx.Commit()

	c.JSON(http.StatusCreated, gin.H{
		"message": "Sekolah berhasil dibuat",
		"school":  school,
	})
}

func GetSchools(c *gin.Context) {
	isTenantVal, ok := c.Get("isTenant")
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{"message": "Akses ditolak. Hanya Super Admin."})
		return
	}
	isTenant := isTenantVal.(bool)
	if isTenant {
		c.JSON(http.StatusForbidden, gin.H{"message": "Akses ditolak. Hanya Super Admin."})
		return
	}

	var schools []models.School
	if err := database.DB.Find(&schools).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengambil data sekolah"})
		return
	}

	c.JSON(http.StatusOK, schools)
}

func GetSchool(c *gin.Context) {
	isTenantVal, ok := c.Get("isTenant")
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{"message": "Akses ditolak. Hanya Super Admin."})
		return
	}
	isTenant := isTenantVal.(bool)
	if isTenant {
		c.JSON(http.StatusForbidden, gin.H{"message": "Akses ditolak. Hanya Super Admin."})
		return
	}

	id := c.Param("id")
	var school models.School
	if err := database.DB.First(&school, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Sekolah tidak ditemukan"})
		return
	}

	type SchoolUserResponse struct {
		ID       uint   `json:"id"`
		Name     string `json:"name"`
		Username string `json:"username"`
		Role     string `json:"role"`
	}

	// Fetch all users for this school
	var users []models.User
	database.DB.Preload("Role").Where("school_id = ?", school.ID).Find(&users)

	var resUsers []SchoolUserResponse
	for _, u := range users {
		resUsers = append(resUsers, SchoolUserResponse{
			ID:       u.ID,
			Name:     u.Name,
			Username: u.Username,
			Role:     u.Role.Name,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"school": school,
		"users":  resUsers,
	})
}

func UpdateSchool(c *gin.Context) {
	isTenantVal, ok := c.Get("isTenant")
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{"message": "Akses ditolak. Hanya Super Admin."})
		return
	}
	isTenant := isTenantVal.(bool)
	if isTenant {
		c.JSON(http.StatusForbidden, gin.H{"message": "Akses ditolak. Hanya Super Admin."})
		return
	}

	id := c.Param("id")
	var school models.School
	if err := database.DB.First(&school, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Sekolah tidak ditemukan"})
		return
	}

	var req struct {
		Name      string `json:"name"`
		Subdomain string `json:"subdomain"`
		Address   string `json:"address"`
		Logo      string `json:"logo"`
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

	school.Name = req.Name
	school.Subdomain = req.Subdomain
	school.Address = req.Address
	school.Logo = req.Logo
	school.Phone = req.Phone
	school.Email = req.Email
	school.Facebook = req.Facebook
	school.Twitter = req.Twitter
	school.Instagram = req.Instagram
	school.Youtube = req.Youtube

	if err := database.DB.Save(&school).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal mengupdate sekolah"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Sekolah berhasil diupdate", "school": school})
}

func DeleteSchool(c *gin.Context) {
	isTenantVal, ok := c.Get("isTenant")
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{"message": "Akses ditolak. Hanya Super Admin."})
		return
	}
	isTenant := isTenantVal.(bool)
	if isTenant {
		c.JSON(http.StatusForbidden, gin.H{"message": "Akses ditolak. Hanya Super Admin."})
		return
	}

	id := c.Param("id")
	
	// Begin transaction to delete school and associated admin user
	tx := database.DB.Begin()

	var school models.School
	if err := tx.First(&school, id).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"message": "Sekolah tidak ditemukan"})
		return
	}

	// Soft delete associated users for this school first
	if err := tx.Where("school_id = ?", school.ID).Delete(&models.User{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menghapus user terkait sekolah"})
		return
	}

	// Soft delete the school
	if err := tx.Delete(&school).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal menghapus sekolah"})
		return
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{"message": "Sekolah berhasil dihapus"})
}

func AssignAdmin(c *gin.Context) {
	isTenantVal, ok := c.Get("isTenant")
	if !ok || isTenantVal.(bool) {
		c.JSON(http.StatusForbidden, gin.H{"message": "Akses ditolak. Hanya Super Admin."})
		return
	}

	schoolID := c.Param("id")
	var school models.School
	if err := database.DB.First(&school, schoolID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Sekolah tidak ditemukan"})
		return
	}

	var req struct {
		UserID uint `json:"user_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Format data tidak valid"})
		return
	}

	var user models.User
	if err := database.DB.First(&user, req.UserID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "User tidak ditemukan"})
		return
	}

	var adminRole models.Role
	if err := database.DB.Where("name = ?", "Admin").First(&adminRole).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Role Admin tidak ditemukan"})
		return
	}

	// Update user to be Admin for this school
	user.SchoolID = &school.ID
	user.RoleID = adminRole.ID

	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal meng-assign admin"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Admin berhasil di-assign"})
}

func UnassignAdmin(c *gin.Context) {
	isTenantVal, ok := c.Get("isTenant")
	if !ok || isTenantVal.(bool) {
		c.JSON(http.StatusForbidden, gin.H{"message": "Akses ditolak. Hanya Super Admin."})
		return
	}

	schoolID := c.Param("id")
	var school models.School
	if err := database.DB.First(&school, schoolID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Sekolah tidak ditemukan"})
		return
	}

	var req struct {
		UserID uint `json:"user_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Format data tidak valid"})
		return
	}

	var user models.User
	if err := database.DB.First(&user, req.UserID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "User tidak ditemukan"})
		return
	}

	var userRole models.Role
	if err := database.DB.Where("name = ?", "User").First(&userRole).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Role User tidak ditemukan"})
		return
	}

	// Demote to User
	user.RoleID = userRole.ID

	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Gagal meng-unassign admin"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Admin berhasil di-unassign"})
}
func GetPublicSchools(c *gin.Context) {
	var schools []models.School
	database.DB.Find(&schools)
	c.JSON(http.StatusOK, schools)
}
