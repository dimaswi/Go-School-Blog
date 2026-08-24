package models

import (
	"gorm.io/gorm"
)

type School struct {
	gorm.Model
	Name      string `json:"name"`
	Subdomain string `json:"subdomain" gorm:"unique;index"`
	Address   string `json:"address"`
	Logo      string `json:"logo"`
	Users     []User `json:"users" gorm:"foreignKey:SchoolID"`
}
