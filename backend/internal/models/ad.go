package models

import (
	"time"
)

type Ad struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	SchoolID  *uint     `gorm:"index" json:"school_id"`
	Title     string    `gorm:"not null" json:"title"`
	ImageURL  string    `gorm:"not null" json:"image_url"`
	LinkURL   string    `json:"link_url"`
	Position     string    `gorm:"not null" json:"position"` // e.g., "sidebar", "below_slider", "above_article", "below_article"
	PageTarget   string    `gorm:"default:'home'" json:"page_target"` // "home" or "post"
	TargetPostID *uint     `json:"target_post_id"` // null if page_target == 'home'
	IsActive     bool      `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	School School `gorm:"foreignKey:SchoolID" json:"school,omitempty"`
}
