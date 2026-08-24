package controllers

import (
	"net/http"
	"os"
	"time"

	"backend/internal/database"
	"backend/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid request"})
		return
	}

	var user models.User
	// Preload role to include in response
	if err := database.DB.Preload("Role.Permissions").Where("username = ?", req.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Username atau password salah"})
		return
	}

	// Verify Tenant Isolation
	isTenantVal, ok := c.Get("isTenant")
	if ok {
		isTenant := isTenantVal.(bool)
		if isTenant {
			if user.Role.Name != "Super Admin" {
				schoolIDVal, _ := c.Get("schoolId")
				schoolID := schoolIDVal.(uint)
				if user.SchoolID == nil || *user.SchoolID != schoolID {
					c.JSON(http.StatusUnauthorized, gin.H{"message": "Akun tidak terdaftar di sekolah ini"})
					return
				}
			}
		} else {
			// Root domain login
			if user.Role.Name != "Super Admin" {
				c.JSON(http.StatusUnauthorized, gin.H{"message": "Akses ditolak. Silakan login melalui subdomain sekolah Anda."})
				return
			}
		}
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Username atau password salah"})
		return
	}

	// Generate JWT
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "supersecretkey"
	}

	var perms []string
	for _, p := range user.Role.Permissions {
		perms = append(perms, p.Name)
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":         user.ID,
		"username":    user.Username,
		"role":        user.Role.Name,
		"permissions": perms,
		"exp":         time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Could not login"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": tokenString,
		"user": gin.H{
			"id":          user.ID,
			"identifier":  user.Name, // Using Name as identifier as expected by frontend
			"username":    user.Username,
			"role":        user.Role.Name,
			"permissions": perms,
		},
	})
}
