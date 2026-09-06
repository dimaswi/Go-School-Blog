package controllers

import (
	"fmt"
	"net/http"
	"strings"

	"backend/internal/database"
	"backend/internal/models"

	"github.com/gin-gonic/gin"
)

func MetaRender(c *gin.Context) {
	path := c.Query("path")
	
	// Default meta tags
	title := "Go School Blog"
	description := "Platform Blog Sekolah Terpadu"
	image := "/logo.png"

	// Determine Tenant
	var schoolName string
	isTenantVal, ok := c.Get("isTenant")
	isTenant := ok && isTenantVal.(bool)
	
	if isTenant {
		schoolID, _ := c.Get("schoolId")
		var school models.School
		if err := database.DB.First(&school, schoolID).Error; err == nil {
			schoolName = school.Name
			title = school.Name
			if school.Logo != "" {
				image = school.Logo
			}
		}
	} else {
		// Get global setting if any
		var settings []models.Setting
		database.DB.Find(&settings)
		for _, s := range settings {
			if s.Key == "school_name" && s.Value != "" {
				title = s.Value
			}
			if s.Key == "logo_url" && s.Value != "" {
				image = s.Value
			}
		}
	}

	// Check if path is a post detail page: /post/:slug
	if strings.HasPrefix(path, "/post/") {
		parts := strings.Split(path, "/")
		if len(parts) >= 3 {
			slug := parts[2]
			var post models.Post
			
			query := database.DB.Where("slug = ? AND status = ?", slug, "published")
			if isTenant {
				schoolID, _ := c.Get("schoolId")
				query = query.Where("school_id = ?", schoolID)
			} else {
				query = query.Where("school_id IS NULL OR main_domain_status = ?", "approved")
			}
			
			if err := query.First(&post).Error; err == nil {
				title = post.Title
				if schoolName != "" {
					title = title + " - " + schoolName
				}
				if post.Excerpt != "" {
					description = post.Excerpt
				} else {
					if len(post.Content) > 150 {
						description = post.Content[:150] + "..."
					} else {
						description = post.Content
					}
				}
				if post.ThumbnailURL != "" {
					image = post.ThumbnailURL
				}
			}
		}
	}

	// Ensure image is absolute
	scheme := "http"
	if c.Request.TLS != nil || c.GetHeader("X-Forwarded-Proto") == "https" {
		scheme = "https"
	}
	host := c.Request.Host

	if strings.HasPrefix(image, "/") && !strings.HasPrefix(image, "//") {
		image = fmt.Sprintf("%s://%s%s", scheme, host, image)
	}
	
	fullURL := fmt.Sprintf("%s://%s%s", scheme, host, path)

	html := fmt.Sprintf(`<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>%s</title>
    <meta name="description" content="%s" />
    <meta property="og:title" content="%s" />
    <meta property="og:description" content="%s" />
    <meta property="og:image" content="%s" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="%s" />
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="%s">
    <meta name="twitter:description" content="%s">
    <meta name="twitter:image" content="%s">
</head>
<body>
    <h1>%s</h1>
    <p>%s</p>
</body>
</html>`, 
	escapeHTML(title), escapeHTML(description), 
	escapeHTML(title), escapeHTML(description), escapeHTML(image), 
	escapeHTML(fullURL),
	escapeHTML(title), escapeHTML(description), escapeHTML(image),
	escapeHTML(title), escapeHTML(description))

	c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(html))
}

func escapeHTML(s string) string {
	s = strings.ReplaceAll(s, "&", "&amp;")
	s = strings.ReplaceAll(s, "<", "&lt;")
	s = strings.ReplaceAll(s, ">", "&gt;")
	s = strings.ReplaceAll(s, "\"", "&quot;")
	return s
}
