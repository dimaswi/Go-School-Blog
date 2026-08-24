package models

import (
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Name     string  `json:"name"`
	Username string  `json:"username" gorm:"unique"`
	Password string  `json:"-"`
	RoleID   uint    `json:"role_id"`
	Role     Role    `json:"role" gorm:"foreignKey:RoleID"`
	SchoolID *uint   `json:"school_id"` // Nullable for Super Admin
	School   *School `json:"school" gorm:"foreignKey:SchoolID"`
}
