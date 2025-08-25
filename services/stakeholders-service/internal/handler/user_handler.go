package handler

import (
	"net/http"
	"os"
	"stakeholders-service/internal/model"
	"stakeholders-service/internal/store"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// AppClaims je naša custom struktura za podatke unutar JWT tokena.
// Ona "ugnježđuje" (embeds) standardne RegisteredClaims i dodaje naša polja.
type AppClaims struct {
	Role string `json:"role"`
	jwt.RegisteredClaims
}

// Definišemo ključ za potpisivanje tokena. U pravoj aplikaciji, ovo bi trebalo da bude
// tajna koja se čita iz environment varijabli, a ne da je hardkodovana.
var jwtKey = []byte(os.Getenv("JWT_KEY"))

// UserHandler sadrži zavisnosti za handlere, kao što je konekcija ka bazi.
type UserHandler struct {
	store *store.Store
}

// NewUserHandler je konstruktor za UserHandler
func NewUserHandler(store *store.Store) *UserHandler {
	return &UserHandler{store: store}
}

// Register je handler za registrovanje novih korisnika
func (h *UserHandler) Register(c *gin.Context) {
	var req model.RegisterRequest
	// Parsiraj i validiraj JSON iz zahteva
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validacija uloge
	switch req.Role {
	case "guide", "tourist":
		// Uloga je ispravna, nastavi dalje
	case "administrator":
		// Eksplicitno zabranjujemo registraciju admina preko API-ja
		c.JSON(http.StatusForbidden, gin.H{"error": "Administrator role cannot be assigned through registration."})
		return
	default:
		// Bilo koja druga vrednost je nevalidna
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role specified. Allowed roles are 'guide' or 'tourist'."})
		return
	}

	user := &model.User{
		Username: req.Username,
		Password: req.Password,
		Email:    req.Email,
		Role:     req.Role,
	}

	if err := h.store.CreateUser(user); err != nil {
		// Ovde bi trebalo proveriti da li je greška "duplicate entry" i vratiti lepšu poruku
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "User created successfully"})
}

// Login je handler za prijavljivanje korisnika
func (h *UserHandler) Login(c *gin.Context) {
	var req model.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Pronađi korisnika u bazi
	user, err := h.store.GetUserByUsername(req.Username)
	if err != nil || user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if !user.IsActive {
		c.JSON(http.StatusForbidden, gin.H{"error": "Your account has been blocked."})
		return
	}
	// --- KRAJ NOVE PROVERE ---

	// Proveri lozinku
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Kreiraj JWT token
	expirationTime := time.Now().Add(24 * time.Hour) // Token traje 24 sata

	// Kreiramo našu custom strukturu sa podacima
	claims := &AppClaims{
		Role: user.Role, // DODAJEMO ULOGU
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   strconv.FormatInt(user.ID, 10), // Čuvamo ID korisnika
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}

	// Kreiramo token koristeći našu AppClaims strukturu
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create token"})
		return
	}

	c.JSON(http.StatusOK, model.LoginResponse{Token: tokenString})
}

// GetAllUsers je handler za dohvatanje svih korisnika.
func (h *UserHandler) GetAllUsers(c *gin.Context) {
	// U realnoj aplikaciji, ovde bi trebalo dodati proveru da li je ulogovani korisnik administrator.
	// To se obično radi unutar middleware-a koji proverava JWT token.

	users, err := h.store.GetAllUsers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve users"})
		return
	}

	c.JSON(http.StatusOK, users)
}

// --- UNAPREĐENA FUNKCIJA ---
// BlockUser je handler za blokiranje korisnika.
func (h *UserHandler) BlockUser(c *gin.Context) {
	// 1. Dohvatamo ID korisnika iz URL-a.
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// 2. Dohvatamo korisnika kojeg želimo da blokiramo iz baze.
	userToBlock, err := h.store.GetUserByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user information"})
		return
	}
	if userToBlock == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// 3. Proveravamo njegovu ulogu.
	if userToBlock.Role == "administrator" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Administrator accounts cannot be blocked."})
		return
	}

	// 4. Ako su sve provere prošle, nastavljamo sa blokiranjem.
	if err := h.store.BlockUser(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to block user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User blocked successfully"})
}
