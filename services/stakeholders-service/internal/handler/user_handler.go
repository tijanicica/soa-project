package handler

import (
	"fmt"
	"log"

	"net/http"
	"os"
	"path/filepath"
	"stakeholders-service/internal/model"
	"stakeholders-service/internal/store"
	"strconv"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/s3"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AppClaims struct {
	Role string `json:"role"`
	jwt.RegisteredClaims
}

var jwtKey = []byte(os.Getenv("JWT_KEY"))

type UserHandler struct {
	store    *store.Store
	s3Client *s3.S3
}

func NewUserHandler(store *store.Store, s3Client *s3.S3) *UserHandler {
	return &UserHandler{store: store, s3Client: s3Client}
}

func (h *UserHandler) UploadProfileImage(c *gin.Context) {
	// Sada nam STVARNO treba userID
	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID, _ := userIDValue.(int64)

	file, err := c.FormFile("profileImage")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Image not provided"})
		return
	}
	extension := filepath.Ext(file.Filename)
	uniqueFileName := fmt.Sprintf("user-%d-%d%s", userID, time.Now().Unix(), extension)
	bucketName := "user-profiles"

	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not open file"})
		return
	}
	defer src.Close()

	// Upload na MinIO/S3
	_, err = h.s3Client.PutObject(&s3.PutObjectInput{
		Bucket:      aws.String(bucketName),
		Key:         aws.String(uniqueFileName),
		Body:        src,
		ACL:         aws.String("public-read"), // Čini sliku javno dostupnom
		ContentType: aws.String(file.Header.Get("Content-Type")),
	})
	if err != nil {
		log.Printf("Failed to upload to S3: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not upload image"})
		return
	}

	// Konstruišemo URL do upravo upload-ovane slike
	imageUrl := fmt.Sprintf("http://localhost:9000/%s/%s", bucketName, uniqueFileName)

	c.JSON(http.StatusOK, gin.H{"imageUrl": imageUrl})
}

// AuthMiddleware proverava validnost JWT tokena i postavlja userID u kontekst.
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			c.Abort()
			return
		}

		// Token obično dolazi u formatu "Bearer <token>"
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Bearer token not found"})
			c.Abort()
			return
		}

		claims := &AppClaims{}

		// ParseWithClaims je sigurna funkcija. Ona proverava:
		// 1. Da li je token u ispravnom formatu.
		// 2. Da li je potpis (signature) validan, koristeći naš jwtKey.
		// 3. Da li je token istekao (proverava 'exp' claim).
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return jwtKey, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		userID, err := strconv.ParseInt(claims.Subject, 10, 64)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID in token"})
			c.Abort()
			return
		}

		// Ako je sve prošlo kako treba, postavi userID i nastavi dalje.
		c.Set("userID", userID)
		c.Next()
	}
}

// Register je handler za registrovanje novih korisnika SA ISPRAVNOM VALIDACIJOM
func (h *UserHandler) Register(c *gin.Context) {
	var req model.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// --- POČETAK NOVE VALIDACIJE ---
	// 1. Proveri da li korisničko ime već postoji
	existingUser, err := h.store.GetUserByUsername(req.Username)
	if err != nil {
		// Prava greška sa bazom
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error checking username"})
		return
	}
	if existingUser != nil {
		// Korisnik sa tim imenom već postoji
		c.JSON(http.StatusConflict, gin.H{"error": "Username is already taken"})
		return
	}

	// 2. Proveri da li email već postoji
	existingUser, err = h.store.GetUserByEmail(req.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error checking email"})
		return
	}
	if existingUser != nil {
		// Korisnik sa tim email-om već postoji
		c.JSON(http.StatusConflict, gin.H{"error": "Email is already registered"})
		return
	}

	// Validacija uloge (ostaje ista)
	switch req.Role {
	case "guide", "tourist":
		// OK
	case "administrator":
		c.JSON(http.StatusForbidden, gin.H{"error": "Administrator role cannot be assigned through registration."})
		return
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role specified. Allowed roles are 'guide' or 'tourist'."})
		return
	}

	user := &model.User{
		Username: req.Username,
		Password: req.Password,
		Email:    req.Email,
		Role:     req.Role,
	}

	// Sada znamo da je bezbedno kreirati korisnika
	if err := h.store.CreateUser(user); err != nil {
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

// GetProfile je handler za dobijanje profila ulogovanog korisnika
func (h *UserHandler) GetProfile(c *gin.Context) {
	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	// Sigurna provera tipa (type assertion)
	userID, ok := userIDValue.(int64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User ID in context is not of expected type"})
		return
	}

	profile, err := h.store.GetProfileByUserID(userID)
	if err != nil {

		log.Printf("ERROR retrieving profile for user ID %d: %v", userID, err)

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not retrieve profile"})
		return
	}

	if profile == nil {
		c.JSON(http.StatusOK, nil)
		return
	}

	c.JSON(http.StatusOK, profile)
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req model.Profile
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	req.UserID = userID.(int64)

	if err := h.store.UpdateProfile(&req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully"})

}

// UnblockUser je handler za odblokiranje korisnika.
func (h *UserHandler) UnblockUser(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	if err := h.store.UnblockUser(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unblock user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User unblocked successfully"})
}


type PositionDto struct {
	Latitude  float64 `json:"latitude" binding:"required"`
	Longitude float64 `json:"longitude" binding:"required"`
}



func (h *UserHandler) UpdatePosition(c *gin.Context) {
	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID := userIDValue.(int64)

	var req PositionDto
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.store.UpdatePosition(userID, req.Latitude, req.Longitude)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update position"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Position updated successfully"})
}

func (h *UserHandler) GetPosition(c *gin.Context) {
	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID := userIDValue.(int64)

	lat, lon, err := h.store.GetPosition(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error while fetching position"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"latitude":  lat,
		"longitude": lon,
	})
}
  
  
func (h *UserHandler) GetUsersBatch(c *gin.Context) {
	// Očekujemo ID-jeve kao comma-separated string, npr. /users/batch?ids=1,2,3
	idsStr := c.Query("ids")
	if idsStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User IDs are required"})
		return
	}

	idStrs := strings.Split(idsStr, ",")
	var userIDs []int64
	for _, idStr := range idStrs {
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID format"})
			return
		}
		userIDs = append(userIDs, id)
	}

	usersInfo, err := h.store.GetUsersInfoByIDs(userIDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user information"})
		return
	}

	c.JSON(http.StatusOK, usersInfo)
}
