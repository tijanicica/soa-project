package model

// RegisterRequest je model za parsiranje JSON-a iz zahteva za registraciju
type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Role     string `json:"role" binding:"required"`
}

// LoginRequest je model za parsiranje JSON-a iz zahteva za login
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse je model za slanje JWT tokena kao odgovor
type LoginResponse struct {
	Token string `json:"token"`
}
