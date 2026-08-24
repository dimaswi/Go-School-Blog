package models

import (
	"gorm.io/gorm"
)

type Category struct {
	gorm.Model
	Name         string     `json:"name" gorm:"unique;not null"`
	Slug         string     `json:"slug" gorm:"unique;not null"`
	ParentID     *uint      `json:"parent_id"`
	Position     int        `json:"position" gorm:"default:0"`
	IsSchoolList bool       `json:"is_school_list" gorm:"default:false"`
	Parent       *Category  `json:"parent" gorm:"foreignKey:ParentID"`
	Children     []Category `json:"children" gorm:"foreignKey:ParentID"`
}
