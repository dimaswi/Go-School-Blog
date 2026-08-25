package middleware

import (
	"net/http"
	"strings"

	"backend/internal/database"
	"backend/internal/models"

	"github.com/gin-gonic/gin"
)

// TenantIdentifier extracts the subdomain and finds the school
func TenantIdentifier() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Use Origin or Referer for CORS API requests
		origin := c.GetHeader("Origin")
		if origin == "" {
			origin = c.GetHeader("Referer")
		}
		
		// Fallback to Hostname if neither is present (e.g., direct API calls)
		host := c.Request.Host
		if origin != "" {
			// Extract host from URL (e.g. http://sekolah1.localhost:5173 -> sekolah1.localhost)
			origin = strings.TrimPrefix(origin, "http://")
			origin = strings.TrimPrefix(origin, "https://")
			parts := strings.Split(origin, ":")
			host = parts[0]
			host = strings.TrimSuffix(host, "/") // in case it's from Referer
		} else {
			// Trim port from Host if exists
			parts := strings.Split(host, ":")
			host = parts[0]
		}

		// If it's the root domain (or localhost without subdomain), no tenant is set
		parts := strings.Split(host, ".")
		
		if len(parts) >= 2 && parts[0] != "www" && parts[0] != "localhost" && parts[0] != "domain" && parts[0] != "literasidigital" {
			subdomain := parts[0]
			var school models.School
			if err := database.DB.Where("subdomain = ?", subdomain).First(&school).Error; err != nil {
				c.JSON(http.StatusNotFound, gin.H{
					"message": "Tenant not found",
				})
				c.Abort()
				return
			}
			
			// Inject school ID into context
			c.Set("schoolId", school.ID)
			c.Set("schoolName", school.Name)
			c.Set("schoolLogo", school.Logo)
			c.Set("isTenant", true)
		} else {
			// It's the root domain (Super Admin access)
			c.Set("isTenant", false)
		}

		c.Next()
	}
}
