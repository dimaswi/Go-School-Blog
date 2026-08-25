package models

import (
	"gorm.io/gorm"
)

// Setting model to store global configurations like Super Admin contacts
type Setting struct {
	gorm.Model
	Key   string `json:"key" gorm:"uniqueIndex"`
	Value string `json:"value"`
}
