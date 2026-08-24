package models

import (
	"time"

	"gorm.io/gorm"
)

type Post struct {
	gorm.Model
	Title        string    `json:"title" gorm:"not null"`
	Slug         string    `json:"slug" gorm:"unique;not null"`
	Content      string    `json:"content" gorm:"type:text;not null"`
	Excerpt      string    `json:"excerpt" gorm:"type:text"`
	ThumbnailURL string    `json:"thumbnail_url"`
	Views        int       `json:"views" gorm:"default:0"`
	Status       string    `json:"status" gorm:"default:'draft'"` // 'draft' or 'published'
	CategoryID   uint      `json:"category_id"`
	Category     Category  `json:"category" gorm:"foreignKey:CategoryID"`
	AuthorID     uint      `json:"author_id"`
	Author       User      `json:"author" gorm:"foreignKey:AuthorID"`
	SchoolID     uint      `json:"school_id"`
	School       School    `json:"school" gorm:"foreignKey:SchoolID"`
	PublishedAt  *time.Time `json:"published_at"`
}
