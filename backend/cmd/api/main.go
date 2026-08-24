package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"backend/internal/controllers"
	"backend/internal/database"
	"backend/internal/middleware"
	"backend/internal/models"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	// Coba load .env dari asumsi kita menjalankan dari folder `backend/`
	// Menggunakan Overload agar menimpa variabel env global Windows yang mungkin bentrok
	err := godotenv.Overload("../.env")
	if err != nil {
		// Jika gagal, coba load dari asumsi kita menjalankan `go run main.go` dari dalam folder `backend/cmd/api/`
		err = godotenv.Overload("../../../.env")
	}
	
	if err != nil {
		log.Println("Error loading .env file, using environment variables")
	}

	// Connect to Database
	database.ConnectDB()

	// Auto Migrate
	database.DB.AutoMigrate(&models.School{}, &models.User{}, &models.Role{}, &models.Permission{}, &models.Category{}, &models.Post{})

	// Seeder: Create Roles if they don't exist
	roles := []struct {
		Name        string
		Description string
	}{
		{"Super Admin", "Super Administrator with full access to all tenants"},
		{"Admin", "Administrator of a specific school"},
		{"User", "Regular user of a specific school"},
	}

	for _, r := range roles {
		var role models.Role
		if err := database.DB.Where("name = ?", r.Name).First(&role).Error; err != nil {
			database.DB.Create(&models.Role{Name: r.Name, Description: r.Description})
		}
	}

	// Seeder: Create Super Admin User if not exists
	var superAdminRole models.Role
	database.DB.Where("name = ?", "Super Admin").First(&superAdminRole)

	var superAdminUser models.User
	if err := database.DB.Where("username = ?", "superadmin").First(&superAdminUser).Error; err != nil {
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
		superAdminUser = models.User{
			Name:     "Super Administrator",
			Username: "superadmin",
			Password: string(hashedPassword),
			RoleID:   superAdminRole.ID,
		}
		database.DB.Create(&superAdminUser)
		log.Println("Seeded default super admin user (username: superadmin, password: password123)")
	}

	// Seeder: Categories
	type subCategory struct {
		Name string
		Slug string
	}
	type mainCategory struct {
		Name     string
		Slug     string
		Children []subCategory
	}

	categories := []mainCategory{
		{Name: "TRENDING", Slug: "trending"},
		{Name: "NGALOR", Slug: "ngalor", Children: []subCategory{{Name: "Feature & cerita", Slug: "feature-cerita"}}},
		{Name: "NGEGAS", Slug: "ngegas", Children: []subCategory{{Name: "Opini Gen Z", Slug: "opini-gen-z"}}},
		{Name: "KEPOIN", Slug: "kepoin", Children: []subCategory{{Name: "Fakta & eksplorasi", Slug: "fakta-eksplorasi"}}},
		{Name: "CUAN", Slug: "cuan", Children: []subCategory{{Name: "Bisnis & karier", Slug: "bisnis-karier"}}},
		{Name: "PANGGUNG", Slug: "panggung", Children: []subCategory{{Name: "Karya & kreativitas", Slug: "karya-kreativitas"}}},
		{Name: "NGULIK", Slug: "ngulik", Children: []subCategory{{Name: "AI & teknologi", Slug: "ai-teknologi"}}},
		{Name: "SEKOLAHKU", Slug: "sekolahku"},
		{Name: "CREATOR OF THE WEEK", Slug: "creator-of-the-week"},
		{Name: "DIGITAL SMART", Slug: "digital-smart", Children: []subCategory{{Name: "Edukasi literasi digital", Slug: "edukasi-literasi-digital"}}},
	}

	for _, c := range categories {
		var cat models.Category
		if err := database.DB.Where("slug = ?", c.Slug).First(&cat).Error; err != nil {
			cat = models.Category{Name: c.Name, Slug: c.Slug}
			database.DB.Create(&cat)
		}
		
		for _, child := range c.Children {
			var childCat models.Category
			if err := database.DB.Where("slug = ?", child.Slug).First(&childCat).Error; err != nil {
				database.DB.Create(&models.Category{
					Name:     child.Name,
					Slug:     child.Slug,
					ParentID: &cat.ID,
				})
			}
		}
	}

	// Seeder: Permissions
	permissionsList := []string{
		"users.view", "users.create", "users.edit", "users.delete",
		"roles.view", "roles.create", "roles.edit", "roles.delete",
		"categories.view", "categories.create", "categories.edit", "categories.delete",
		"posts.view", "posts.create", "posts.edit", "posts.delete",
	}
	var allPerms []models.Permission
	for _, p := range permissionsList {
		var perm models.Permission
		if err := database.DB.Where("name = ?", p).First(&perm).Error; err != nil {
			perm = models.Permission{Name: p, Description: "Akses untuk " + p}
			database.DB.Create(&perm)
		}
		allPerms = append(allPerms, perm)
	}

	// Assign permissions to Super Admin role if not already assigned
	database.DB.Model(&superAdminRole).Association("Permissions").Append(allPerms)

	// Initialize Gin app
	app := gin.Default()

	app.Use(cors.New(cors.Config{
		AllowOriginFunc: func(origin string) bool {
			return true // Mengizinkan semua origin (termasuk semua subdomain localhost)
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Tenant Middleware - executes before any route
	app.Use(middleware.TenantIdentifier())

	// Public Routes
	api := app.Group("/api")
	api.POST("/auth/login", controllers.Login)
	api.GET("/site-config", func(c *gin.Context) {
		isTenantVal, ok := c.Get("isTenant")
		isTenant := ok && isTenantVal.(bool)

		if isTenant {
			schoolName, _ := c.Get("schoolName")
			schoolLogo, _ := c.Get("schoolLogo")
			c.JSON(http.StatusOK, gin.H{
				"school_name": schoolName,
				"logo_url":    schoolLogo,
			})
		} else {
			c.JSON(http.StatusOK, gin.H{
				"school_name": "SiAK",
				"logo_url":    "",
			})
		}
	})

	// Serve Static Files
	app.Static("/uploads", "./uploads")

	// Protected Routes
	protected := api.Group("/", middleware.Protected())
	
	// Upload
	protected.POST("/upload", controllers.UploadFile)
	
	// Super Admin routes
	protected.POST("/schools", controllers.CreateSchool)
	protected.GET("/schools", controllers.GetSchools)
	protected.GET("/schools/:id", controllers.GetSchool)
	protected.PUT("/schools/:id", controllers.UpdateSchool)
	protected.DELETE("/schools/:id", controllers.DeleteSchool)
	protected.POST("/schools/:id/assign-admin", controllers.AssignAdmin)
	protected.POST("/schools/:id/unassign-admin", controllers.UnassignAdmin)
	protected.GET("/me", func(c *gin.Context) {
		userIDVal, ok := c.Get("userId")
		if !ok {
			c.JSON(http.StatusNotFound, gin.H{"message": "User not found"})
			return
		}

		var user models.User
		// The ID could be float64 from JWT claims, need to convert appropriately for GORM if needed. 
		// GORM usually handles basic types gracefully.
		if err := database.DB.Preload("Role.Permissions").First(&user, userIDVal).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"message": "User not found"})
			return
		}

		var perms []string
		for _, p := range user.Role.Permissions {
			perms = append(perms, p.Name)
		}

		c.JSON(http.StatusOK, gin.H{
			"id":          user.ID,
			"identifier":  user.Name,
			"username":    user.Username,
			"role":        user.Role.Name,
			"permissions": perms,
		})
	})
	
	// API Khusus Manajemen Data
	protected.GET("/dashboard/stats", controllers.GetDashboardStats)

	protected.GET("/users", controllers.GetUsers)
	protected.POST("/users", controllers.CreateUser)
	protected.PUT("/users/:id/password", controllers.UpdatePassword)

	protected.GET("/roles", controllers.GetRoles)
	protected.POST("/roles", controllers.CreateRole)
	protected.PUT("/roles/:id", controllers.UpdateRole)
	protected.DELETE("/roles/:id", controllers.DeleteRole)

	protected.GET("/permissions", controllers.GetPermissions)

	// Categories
	protected.GET("/categories", controllers.GetCategories)
	protected.POST("/categories", controllers.CreateCategory)
	protected.PUT("/categories/reorder", controllers.ReorderCategories)
	protected.PUT("/categories/:id", controllers.UpdateCategory)
	protected.DELETE("/categories/:id", controllers.DeleteCategory)

	// Posts
	protected.GET("/posts", controllers.GetPosts)
	protected.GET("/posts/:id", controllers.GetPost)
	protected.POST("/posts", controllers.CreatePost)
	protected.PUT("/posts/:id", controllers.UpdatePost)
	protected.DELETE("/posts/:id", controllers.DeletePost)

	// Get port from env
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Start server
	log.Fatal(app.Run(":" + port))
}
