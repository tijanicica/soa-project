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
			creation_date DATETIME NOT NULL,
			last_modified_date DATETIME NOT NULL
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

	_, err = s.db.Exec(`
		CREATE TABLE IF NOT EXISTS blog_images (
			id INT AUTO_INCREMENT PRIMARY KEY,
			blog_id INT NOT NULL,
			image_url VARCHAR(255) NOT NULL,
			FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE
		);
	`)
	if err != nil {
		return fmt.Errorf("error creating blog_images table: %w", err)
	}

	log.Println("Database tables are ready for blog-service.")
	return nil

}

// Seed metoda ubacuje test podatke za blogove
func (s *Store) Seed() error {
	// === BLOG 1 ===
	res, err := s.db.Exec(`
		REPLACE INTO blogs (id, author_id, title, description_markdown, creation_date, last_modified_date) VALUES
		(1, 2, 'Moja prva tura po Beogradu', 'Ovo je opis moje prve pešačke ture...', ?, ?);
	`, time.Now(), time.Now())

	if err != nil {
		return fmt.Errorf("error seeding first blog: %w", err)
	}

	blogID1, _ := res.LastInsertId()
	if blogID1 == 0 { // Ako je REPLACE uradio update, ID će biti 0, pa ga fiksiramo
		blogID1 = 1
	}

	// Ubacujemo komentar od 'turista_mika' (čiji je ID=3) na prvi blog
	_, err = s.db.Exec(`
		REPLACE INTO comments (id, blog_id, author_id, text, creation_time, last_modified_time) VALUES
		(1, ?, 3, 'Sjajna tura, jedva čekam da je probam!', ?, ?);
	`, blogID1, time.Now(), time.Now())

	if err != nil {
		return fmt.Errorf("error seeding first comment: %w", err)
	}

	// Ubacujemo lajk od 'turista_mika' na prvi blog
	_, err = s.db.Exec(`
		REPLACE INTO likes (blog_id, user_id) VALUES (?, 3);
	`, blogID1)

	if err != nil {
		return fmt.Errorf("error seeding first like: %w", err)
	}

	// === BLOG 2 (NOVI) ===
	res, err = s.db.Exec(`
		REPLACE INTO blogs (id, author_id, title, description_markdown, creation_date, last_modified_date) VALUES
		(2, 3, 'Saveti za putnike početnike', '### Planiranje je ključ!\n\nEvo nekoliko saveta kako da se pripremite za vaše prvo veliko putovanje.', ?, ?);
	`, time.Now().Add(-24*time.Hour), time.Now().Add(-24*time.Hour))
	if err != nil {
		return fmt.Errorf("error seeding second blog: %w", err)
	}

	blogID2, _ := res.LastInsertId()
	if blogID2 == 0 {
		blogID2 = 2
	}

	// Dodajemo komentar na drugi blog od korisnika 'vodic_pera' (ID=2)
	_, err = s.db.Exec(`
		REPLACE INTO comments (id, blog_id, author_id, text, creation_time, last_modified_time) VALUES
		(2, ?, 2, 'Odlični saveti, Mika!', ?, ?);
	`, blogID2, time.Now(), time.Now())

	if err != nil {
		return fmt.Errorf("error seeding second comment: %w", err)
	}

	// Možemo dodati i lajk na drugi blog od 'vodic_pera'
	_, err = s.db.Exec(`
		REPLACE INTO likes (blog_id, user_id) VALUES (?, 2);
	`, blogID2)

	if err != nil {
		return fmt.Errorf("error seeding second like: %w", err)
	}

	log.Println("Database seeding completed for blog-service!")
	return nil
}
