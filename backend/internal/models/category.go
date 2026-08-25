package models

import (
	"gorm.io/gorm"
)

type Category struct {
	gorm.Model
	Name         string     `json:"name" gorm:"uniqueIndex:idx_name_school;not null"`
	Slug         string     `json:"slug" gorm:"uniqueIndex:idx_slug_school;not null"`
	ParentID     *uint      `json:"parent_id"`
	SchoolID     *uint      `json:"school_id" gorm:"uniqueIndex:idx_name_school;uniqueIndex:idx_slug_school"`
	Position     int        `json:"position" gorm:"default:0"`
	IsSchoolList bool       `json:"is_school_list" gorm:"default:false"`
	Parent       *Category  `json:"parent" gorm:"foreignKey:ParentID"`
	Children     []Category `json:"children" gorm:"foreignKey:ParentID"`
	School       *School    `json:"school,omitempty" gorm:"foreignKey:SchoolID"`
}
