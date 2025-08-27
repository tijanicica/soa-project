package handler

import (
	"blog-service/internal/model"
	"blog-service/internal/store"
	"database/sql"
	"encoding/json"
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

type BlogHandler struct {
	store    *store.Store
	s3Client *s3.S3
}

// za komunikaciju sa stakeholders, ime usera  na blogu
type UserInfo struct {
	ID              int64          `json:"id"`
	Username        string         `json:"username"`
	FirstName       sql.NullString `json:"firstName"`
	ProfileImageURL sql.NullString `json:"profileImageUrl"`
}

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

	// --- POČETAK NOVE LOGIKE ---
	// Nakon kreiranja, odmah dobavi info o autoru da bi ga vratio frontendu
	url := fmt.Sprintf("http://stakeholders-service:8001/users/batch?ids=%d", createdComment.AuthorID)
	resp, err := http.Get(url)
	authorsInfo := make(map[int64]UserInfo)
	if err == nil && resp.StatusCode == http.StatusOK {
		defer resp.Body.Close()
		json.NewDecoder(resp.Body).Decode(&authorsInfo)
	}

	commentWithAuthor := &model.CommentWithAuthor{
		Comment: *createdComment,
	}

	if author, ok := authorsInfo[createdComment.AuthorID]; ok {
		commentWithAuthor.Author.Username = author.Username
		if author.FirstName.Valid {
			commentWithAuthor.Author.FirstName = author.FirstName.String
		}
		if author.ProfileImageURL.Valid {
			commentWithAuthor.Author.ProfileImageURL = author.ProfileImageURL.String
		}
	} else {
		commentWithAuthor.Author.Username = "You"
	}
	// --- KRAJ NOVE LOGIKE ---

	c.JSON(http.StatusCreated, commentWithAuthor) // Vraćamo obogaćeni objekat
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

// moze da vidi samo blogove korisnika koje prati
type FollowingUser struct {
	UserID int64 `json:"userId"`
}

func (h *BlogHandler) GetAllBlogs(c *gin.Context) {
	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	currentUserID := userIDValue.(int64)

	// --- POČETAK NOVE LOGIKE ---
	// 2. Pozivamo followers-service da dobijemo listu ID-jeva korisnika koje pratimo
	url := "http://followers-service:8004/api/followers/me/following"

	// Kreiramo zahtev sa tokenom
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create request for followers-service"})
		return
	}
	// Prosleđujemo token iz originalnog zahteva
	req.Header.Add("Authorization", c.GetHeader("Authorization"))

	client := &http.Client{}
	resp, err := client.Do(req)

	followingIDs := make(map[int64]bool)
	// Uvek dodajemo sopstveni ID, da bismo videli i svoje blogove
	followingIDs[currentUserID] = true

	if err != nil {
		log.Printf("Error fetching following list from followers-service: %v", err)
		// U slučaju greške, nastavljamo dalje, ali ćemo videti samo sopstvene blogove
	} else if resp.StatusCode == http.StatusOK {
		defer resp.Body.Close()
		var followingList []FollowingUser
		if err := json.NewDecoder(resp.Body).Decode(&followingList); err == nil {
			for _, user := range followingList {
				followingIDs[user.UserID] = true
			}
		} else {
			log.Printf("Error decoding following list: %v", err)
		}
	} else {
		log.Printf("Followers-service returned non-OK status: %d", resp.StatusCode)
	}
	// --- KRAJ NOVE LOGIKE ---

	// 3. Dobavi SVE blogove iz baze
	allBlogs, err := h.store.GetAllBlogs()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve blogs"})
		return
	}

	// --- POČETAK FILTRIRANJA ---
	// 4. Filtriraj blogove
	var filteredBlogs []*model.BlogWithStats
	for _, blog := range allBlogs {
		if _, ok := followingIDs[blog.AuthorID]; ok {
			filteredBlogs = append(filteredBlogs, blog)
		}
	}
	// --- KRAJ FILTRIRANJA ---

	// Ako je lista prazna nakon filtriranja, vrati praznu listu
	if len(filteredBlogs) == 0 {
		c.JSON(http.StatusOK, []*model.BlogWithStats{})
		return
	}

	// 5. Sakupi ID-jeve autora SAMO za filtrirane blogove
	authorIDs := make(map[int64]bool)
	for _, blog := range filteredBlogs {
		authorIDs[blog.AuthorID] = true
	}

	var ids []string
	for id := range authorIDs {
		ids = append(ids, strconv.FormatInt(id, 10))
	}

	// 3. Pozovi stakeholders-service da dobiješ informacije o autorima
	// Unutar Docker mreže, koristimo ime servisa kao hostname.
	stakeholdersURL := fmt.Sprintf("http://stakeholders-service:8001/users/batch?ids=%s", strings.Join(ids, ","))

	stakeholdersResp, err := http.Get(stakeholdersURL)
	if err != nil {
		log.Printf("Error fetching user data from stakeholders-service: %v", err)
		// U slučaju greške, možemo vratiti blogove bez info o autoru
		// ili vratiti grešku. Za sada ćemo nastaviti.
	}

	authorsInfo := make(map[int64]UserInfo)
	if stakeholdersResp != nil && stakeholdersResp.StatusCode == http.StatusOK {
		defer stakeholdersResp.Body.Close()
		if err := json.NewDecoder(stakeholdersResp.Body).Decode(&authorsInfo); err != nil {
			log.Printf("Error decoding user data: %v", err)
		}
	}

	// 4. Spoji informacije o autorima sa blogovima
	for _, blog := range filteredBlogs {
		if author, ok := authorsInfo[blog.AuthorID]; ok {
			blog.Author.Username = author.Username
			if author.FirstName.Valid {
				blog.Author.FirstName = author.FirstName.String
			}
			if author.ProfileImageURL.Valid {
				blog.Author.ProfileImageURL = author.ProfileImageURL.String
			}
		} else {
			// Fallback ako autor nije pronađen
			blog.Author.Username = "Unknown Author"
		}
	}

	c.JSON(http.StatusOK, filteredBlogs)
}
func (h *BlogHandler) GetAllCommentsForBlog(c *gin.Context) {
	blogID, err := strconv.ParseInt(c.Param("blogId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid blog ID"})
		return
	}

	// 1. Dobavi osnovne podatke o komentarima iz baze
	comments, err := h.store.GetCommentsForBlog(blogID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve comments"})
		return
	}

	if len(comments) == 0 {
		c.JSON(http.StatusOK, []*model.CommentWithAuthor{})
		return
	}

	// 2. Sakupi sve jedinstvene author ID-jeve iz komentara
	authorIDs := make(map[int64]bool)
	for _, comment := range comments {
		authorIDs[comment.AuthorID] = true
	}

	var ids []string
	for id := range authorIDs {
		ids = append(ids, strconv.FormatInt(id, 10))
	}

	// 3. Pozovi stakeholders-service da dobiješ informacije o autorima
	url := fmt.Sprintf("http://stakeholders-service:8001/users/batch?ids=%s", strings.Join(ids, ","))

	resp, err := http.Get(url)
	if err != nil {
		log.Printf("Error fetching user data for comments from stakeholders-service: %v", err)
	}

	authorsInfo := make(map[int64]UserInfo)
	if resp != nil && resp.StatusCode == http.StatusOK {
		defer resp.Body.Close()
		if err := json.NewDecoder(resp.Body).Decode(&authorsInfo); err != nil {
			log.Printf("Error decoding user data for comments: %v", err)
		}
	}

	// 4. Kreiraj novu listu (slice) sa obogaćenim podacima
	var commentsWithAuthors []*model.CommentWithAuthor
	for _, comment := range comments {
		cwa := &model.CommentWithAuthor{
			Comment: *comment,
		}

		if author, ok := authorsInfo[comment.AuthorID]; ok {
			cwa.Author.Username = author.Username
			if author.FirstName.Valid {
				cwa.Author.FirstName = author.FirstName.String
			}
			if author.ProfileImageURL.Valid {
				cwa.Author.ProfileImageURL = author.ProfileImageURL.String
			}
		} else {
			cwa.Author.Username = "Unknown User"
		}

		commentsWithAuthors = append(commentsWithAuthors, cwa)
	}

	c.JSON(http.StatusOK, commentsWithAuthors)
}

type UpdateBlogRequest struct {
	Title               string `json:"title"`
	DescriptionMarkdown string `json:"descriptionMarkdown"`
}

func (h *BlogHandler) UpdateBlog(c *gin.Context) {
	blogID, err := strconv.ParseInt(c.Param("blogId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid blog ID"})
		return
	}

	userID, _ := c.Get("userID")
	authorID := userID.(int64)

	// Čitamo tekstualna polja. Ako nisu poslata, biće prazni stringovi.
	title := c.PostForm("title")
	descriptionMarkdown := c.PostForm("descriptionMarkdown")

	// Čitamo listu postojećih slika koje treba obrisati.
	// Frontend će ih slati kao niz, npr. imagesToDelete=url1&imagesToDelete=url2
	imagesToDelete := c.PostFormArray("imagesToDelete")

	// Čitamo NOVE slike koje treba uploadovati.
	var newImageURLs []string
	form, err := c.MultipartForm()

	// `err` će postojati ako forma nije `multipart`, što je ok ako se menja samo tekst/brisanje.
	if err == nil && form != nil {
		files := form.File["images"] // Ključ za nove slike
		if len(files) > 0 {
			bucketName := "blog-images"
			for i, file := range files {
				// Generišemo jedinstveno ime fajla
				extension := filepath.Ext(file.Filename)
				uniqueFileName := fmt.Sprintf("user-%d-blog-%d-image-%d%s", authorID, time.Now().UnixNano(), i, extension)

				src, err := file.Open()
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not open uploaded file"})
					return
				}
				defer src.Close()

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
				newImageURLs = append(newImageURLs, imageUrl)
			}
		}
	}

	// Proveravamo da li je bar nešto poslato za ažuriranje.
	if title == "" && descriptionMarkdown == "" && len(newImageURLs) == 0 && len(imagesToDelete) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No data provided for update."})
		return
	}

	blogToUpdate := &model.Blog{
		ID:                  blogID,
		AuthorID:            authorID,
		Title:               title,
		DescriptionMarkdown: descriptionMarkdown,
	}

	// Pozivamo novu, moćnu store funkciju sa svim podacima
	err = h.store.UpdateBlog(blogToUpdate, newImageURLs, imagesToDelete)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Blog not found or you do not have permission to edit it"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update blog"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Blog updated successfully"})
}
