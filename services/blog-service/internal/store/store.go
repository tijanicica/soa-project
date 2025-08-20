package store

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

// Store struktura je ista kao i u drugom servisu
type Store struct {
	db *sql.DB
}

// NewStore funkcija je takođe ista
func NewStore(user, password, host, dbname string) (*Store, error) {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:3306)/%s?parseTime=true", user, password, host, dbname)
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	return &Store{db: db}, nil
}

// Init metoda kreira tabele specifične za blog servis
func (s *Store) Init() error {
	// Kreiranje 'blogs' tabele
	_, err := s.db.Exec(`
		CREATE TABLE IF NOT EXISTS blogs (
			id INT AUTO_INCREMENT PRIMARY KEY,
			author_id INT NOT NULL,
			title VARCHAR(255) NOT NULL,
			description_markdown TEXT,
			creation_date DATETIME NOT NULL
		);
	`)
	if err != nil {
		return fmt.Errorf("error creating blogs table: %w", err)
	}

	// Kreiranje 'comments' tabele
	_, err = s.db.Exec(`
		CREATE TABLE IF NOT EXISTS comments (
			id INT AUTO_INCREMENT PRIMARY KEY,
			blog_id INT NOT NULL,
			author_id INT NOT NULL,
			text TEXT,
			creation_time DATETIME NOT NULL,
			last_modified_time DATETIME NOT NULL,
			FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE
		);
	`)
	if err != nil {
		return fmt.Errorf("error creating comments table: %w", err)
	}

	// Kreiranje 'likes' tabele
	_, err = s.db.Exec(`
		CREATE TABLE IF NOT EXISTS likes (
			blog_id INT NOT NULL,
			user_id INT NOT NULL,
			PRIMARY KEY (blog_id, user_id),
			FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE
		);
	`)
	if err != nil {
		return fmt.Errorf("error creating likes table: %w", err)
	}

	log.Println("Database tables are ready for blog-service.")
	return nil
}

// Seed metoda ubacuje test podatke za blogove
func (s *Store) Seed() error {
	// Ubacujemo test blog koji je napisao 'vodic_pera' (čiji je ID=2)
	// Koristimo REPLACE INTO da bi se podaci osvežili svaki put, umesto INSERT IGNORE
	res, err := s.db.Exec(`
		REPLACE INTO blogs (id, author_id, title, description_markdown, creation_date) VALUES
		(1, 2, 'Moja prva tura po Beogradu', 'Ovo je opis moje prve pešačke ture...', ?);
	`, time.Now())

	if err != nil {
		return fmt.Errorf("error seeding blogs: %w", err)
	}

	// Uzimamo ID bloga koji smo upravo ubacili
	blogID, _ := res.LastInsertId()
	if blogID == 0 { // Ako je REPLACE uradio update, ID će biti 0, pa ga fiksiramo
		blogID = 1
	}

	// Ubacujemo komentar od 'turista_mika' (čiji je ID=3) na taj blog
	_, err = s.db.Exec(`
		REPLACE INTO comments (id, blog_id, author_id, text, creation_time, last_modified_time) VALUES
		(1, ?, 3, 'Sjajna tura, jedva čekam da je probam!', ?, ?);
	`, blogID, time.Now(), time.Now())

	if err != nil {
		return fmt.Errorf("error seeding comments: %w", err)
	}

	// Ubacujemo lajk od 'turista_mika'
	_, err = s.db.Exec(`
		REPLACE INTO likes (blog_id, user_id) VALUES (?, 3);
	`, blogID)

	if err != nil {
		return fmt.Errorf("error seeding likes: %w", err)
	}

	log.Println("Database seeding completed for blog-service!")
	return nil
}
