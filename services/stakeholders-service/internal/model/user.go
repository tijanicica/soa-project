package model

import (
	"database/sql"
)

type User struct {
	ID        int64           `json:"id"`
	Username  string          `json:"username"`
	Password  string          `json:"-"`
	Email     string          `json:"email"`
	Role      string          `json:"role"`
	IsActive  bool            `json:"isActive"`
	Latitude  sql.NullFloat64 `json:"latitude"`
	Longitude sql.NullFloat64 `json:"longitude"`
}

type Profile struct {
	ID              int64          `json:"id"`
	UserID          int64          `json:"userId"`
	FirstName       sql.NullString `json:"firstName"`       // Može biti NULL
	LastName        sql.NullString `json:"lastName"`        // Može biti NULL
	ProfileImageURL sql.NullString `json:"profileImageUrl"` // Može biti NULL
	Biography       sql.NullString `json:"biography"`       // Može biti NULL
	Motto           sql.NullString `json:"motto"`           // Može biti NULL
}

type UserInfo struct {
	ID              int64          `json:"id"`
	Username        string         `json:"username"`
	FirstName       sql.NullString `json:"firstName"`
	ProfileImageURL sql.NullString `json:"profileImageUrl"`
}
