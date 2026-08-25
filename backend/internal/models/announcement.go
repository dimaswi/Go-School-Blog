package models

import (
	"gorm.io/gorm"
)

type Announcement struct {
	gorm.Model
	Content  string  `json:"content" gorm:"type:text;not null"`
	IsActive bool    `json:"is_active" gorm:"default:false"`
	SchoolID *uint   `json:"school_id"`
	School   *School `json:"school" gorm:"foreignKey:SchoolID"`
}
