package model

import "time"

// Blog predstavlja jednu blog objavu.
// Funkcionalnost #6.
type Blog struct {
	ID                  int64     `json:"id"`
	AuthorID            int64     `json:"authorId"`
	Title               string    `json:"title"`
	DescriptionMarkdown string    `json:"descriptionMarkdown"`
	CreationDate        time.Time `json:"creationDate"`
	LastModifiedDate    time.Time `json:"lastModifiedDate"`
	ImageURLs           []string  `json:"imageUrls,omitempty"` // Opcione slike, `omitempty` znači da se neće slati u JSON-u ako je polje prazno
}

// Comment predstavlja komentar na blog objavi.
// Funkcionalnost #7.
type Comment struct {
	ID               int64     `json:"id"`
	BlogID           int64     `json:"blogId"`
	AuthorID         int64     `json:"authorId"` // ID korisnika koji je kreirao komentar
	Text             string    `json:"text"`
	CreationTime     time.Time `json:"creationTime"`
	LastModifiedTime time.Time `json:"lastModifiedTime"`
}

type BlogStats struct {
	LikesCount    int `json:"likesCount"`
	CommentsCount int `json:"commentsCount"`
}

type BlogWithStats struct {
	Blog
	Stats BlogStats `json:"stats"`
}

type Like struct {
	BlogID int64
	UserID int64
}
