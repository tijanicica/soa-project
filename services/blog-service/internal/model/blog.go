package model

import "time"

type Blog struct {
	ID                  int64     `json:"id"`
	AuthorID            int64     `json:"authorId"`
	Title               string    `json:"title"`
	DescriptionMarkdown string    `json:"descriptionMarkdown"`
	CreationDate        time.Time `json:"creationDate"`
	LastModifiedDate    time.Time `json:"lastModifiedDate"`
	ImageURLs           []string  `json:"imageUrls,omitempty"` // Opcione slike, `omitempty` znači da se neće slati u JSON-u ako je polje prazno
}

type Comment struct {
	ID               int64     `json:"id"`
	BlogID           int64     `json:"blogId"`
	AuthorID         int64     `json:"authorId"`
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
	Stats  BlogStats  `json:"stats"`
	Author AuthorInfo `json:"author"`
}

type Like struct {
	BlogID int64
	UserID int64
}

type AuthorInfo struct {
	Username        string `json:"username"`
	FirstName       string `json:"firstName,omitempty"`
	ProfileImageURL string `json:"profileImageUrl,omitempty"`
}

type CommentWithAuthor struct {
	Comment
	Author AuthorInfo `json:"author"`
}
