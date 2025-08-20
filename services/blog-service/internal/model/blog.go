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

// BlogStats je pomoćna struktura koja se može koristiti za vraćanje
// dodatnih informacija uz blog, kao što je broj lajkova.
// Ovo je napredniji pristup koji će ti kasnije olakšati rad.
type BlogStats struct {
	LikesCount int `json:"likesCount"`
	// CommentsCount int `json:"commentsCount"`
}

// BlogWithStats je model koji spaja Blog i njegove statistike,
// idealan za slanje klijentu.
type BlogWithStats struct {
	Blog
	Stats BlogStats `json:"stats"`
}

// Like je jednostavna struktura koja beleži ko je lajkovao koju objavu.
// Funkcionalnost #8.
// Ova struktura se koristi samo za rad sa bazom i ne mora se često slati klijentu.
type Like struct {
	BlogID int64
	UserID int64
}
