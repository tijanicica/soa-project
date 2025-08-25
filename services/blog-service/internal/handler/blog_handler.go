package handler

import (
	"blog-service/internal/model"
	"blog-service/internal/store"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/s3"
)

// AppClaims je identična struktura kao u stakeholders-service
type AppClaims struct {
	Role string `json:"role"`
	jwt.RegisteredClaims
}

var jwtKey []byte

func init() {
	key := os.Getenv("JWT_KEY")
	if key == "" {
		log.Fatal("JWT_KEY environment variable not set. Application cannot start.")
	}
	jwtKey = []byte(key)
}

// BlogHandler sadrži zavisnosti, kao što je konekcija ka bazi.
type BlogHandler struct {
	store    *store.Store
	s3Client *s3.S3
}

// konstruktor
func NewBlogHandler(store *store.Store, s3Client *s3.S3) *BlogHandler {
	return &BlogHandler{store: store, s3Client: s3Client}
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Bearer token not found"})
			c.Abort()
			return
		}

		claims := &AppClaims{}
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

		// Postavljamo userID u kontekst da bi ga ostali handleri mogli koristiti
		c.Set("userID", userID)
		c.Next()
	}
}

// Funkcionalnost #6: Korisnik može da kreira blog
func (h *BlogHandler) CreateBlog(c *gin.Context) {
	// 1. Parsiranje tekstualnih polja iz forme
	title := c.PostForm("title")
	descriptionMarkdown := c.PostForm("descriptionMarkdown")
	if title == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title is required"})
		return
	}

	// 2. Dobijanje ID-ja ulogovanog korisnika
	userID, _ := c.Get("userID")
	authorID := userID.(int64)

	// 3. Rukovanje upload-om fajlova
	var imageUrls []string
	bucketName := "blog-images"

	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid form data"})
		return
	}

	// "images" je ime polja u form-data
	files := form.File["images"]

	for i, file := range files {
		extension := filepath.Ext(file.Filename)
		uniqueFileName := fmt.Sprintf("user-%d-blog-%d-image-%d%s", authorID, time.Now().Unix(), i+1, extension)

		src, err := file.Open()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not open uploaded file"})
			return
		}
		defer src.Close()

		// Upload na MinIO/S3
		_, err = h.s3Client.PutObject(&s3.PutObjectInput{
			Bucket:      aws.String(bucketName),
			Key:         aws.String(uniqueFileName),
			Body:        src,
			ACL:         aws.String("public-read"),
			ContentType: aws.String(file.Header.Get("Content-Type")),
		})
		if err != nil {
			log.Printf("Failed to upload to S3: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not upload image"})
			return
		}

		imageUrl := fmt.Sprintf("http://localhost:9000/%s/%s", bucketName, uniqueFileName)
		imageUrls = append(imageUrls, imageUrl)
	}

	// 4. Kreiranje Blog objekta i poziv store-a
	blog := &model.Blog{
		AuthorID:            authorID,
		Title:               title,
		DescriptionMarkdown: descriptionMarkdown,
		CreationDate:        time.Now(),
	}

	createdBlog, err := h.store.CreateBlog(blog, imageUrls)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create blog in database"})
		return
	}

	c.JSON(http.StatusCreated, createdBlog)
}

// Funkcionalnost #7: Korisnik može da ostavi komentar na blog
func (h *BlogHandler) AddComment(c *gin.Context) {
	blogID, err := strconv.ParseInt(c.Param("blogId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid blog ID"})
		return
	}

	var comment model.Comment
	if err := c.ShouldBindJSON(&comment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Autor komentara je ulogovani korisnik
	userID, _ := c.Get("userID")
	comment.AuthorID = userID.(int64)
	comment.BlogID = blogID
	comment.CreationTime = time.Now()
	comment.LastModifiedTime = time.Now()

	createdComment, err := h.store.AddComment(&comment)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add comment"})
		return
	}

	c.JSON(http.StatusCreated, createdComment)
}

// Funkcionalnost #8: Korisnik može da lajkuje/dislajkuje blog
func (h *BlogHandler) ToggleLike(c *gin.Context) {
	blogID, err := strconv.ParseInt(c.Param("blogId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid blog ID"})
		return
	}

	userID, _ := c.Get("userID")

	// Pozivamo store metodu koja rešava logiku dodavanja/uklanjanja lajka
	action, err := h.store.ToggleLike(blogID, userID.(int64))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process like"})
		return
	}

	// Vraćamo i novi broj lajkova
	likesCount, err := h.store.GetLikesCount(blogID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get new likes count"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Successfully " + action,
		"likesCount": likesCount,
	})
}

func (h *BlogHandler) GetAllBlogs(c *gin.Context) {
	blogs, err := h.store.GetAllBlogs()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve blogs"})
		return
	}

	if blogs == nil {
		blogs = []*model.BlogWithStats{}
	}

	c.JSON(http.StatusOK, blogs)
}
