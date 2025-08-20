package store

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/go-sql-driver/mysql" // Donja crta znači da uvozimo paket zbog njegovih "side-effects" (registrovanja drajvera)
	"golang.org/x/crypto/bcrypt"
)

// Store je naša glavna struktura za rad sa bazom. Sadrži konekciju.
type Store struct {
	db *sql.DB
}

// NewStore je "konstruktor". On prima podatke za konekciju, pokušava da se poveže
// i vraća novu instancu Store-a ili grešku.
func NewStore(user, password, host, dbname string) (*Store, error) {
	// String za konekciju (Data Source Name)
	dsn := fmt.Sprintf("%s:%s@tcp(%s:3306)/%s?parseTime=true", user, password, host, dbname)

	// Otvaramo konekciju
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}

	// Proveravamo da li je konekcija zaista uspešna
	if err := db.Ping(); err != nil {
		return nil, err
	}

	return &Store{db: db}, nil
}

// Init metoda kreira potrebne tabele ako ne postoje.
// Ovo je robustan način da osiguramo da je baza uvek spremna.
func (s *Store) Init() error {
	// Kreiranje 'users' tabele
	_, err := s.db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id INT AUTO_INCREMENT PRIMARY KEY,
			username VARCHAR(255) NOT NULL UNIQUE,
			password VARCHAR(255) NOT NULL,
			email VARCHAR(255) NOT NULL UNIQUE,
			role VARCHAR(50) NOT NULL,
			is_active BOOLEAN DEFAULT TRUE
		);
	`)
	if err != nil {
		return fmt.Errorf("error creating users table: %w", err)
	}

	// Kreiranje 'profiles' tabele
	_, err = s.db.Exec(`
		CREATE TABLE IF NOT EXISTS profiles (
			id INT AUTO_INCREMENT PRIMARY KEY,
			user_id INT NOT NULL UNIQUE,
			first_name VARCHAR(255),
			last_name VARCHAR(255),
			profile_image_url VARCHAR(255),
			biography TEXT,
			motto VARCHAR(255),
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		);
	`)
	if err != nil {
		return fmt.Errorf("error creating profiles table: %w", err)
	}

	log.Println("Database tables are ready.")
	return nil
}

// Seed metoda ubacuje početne, test podatke u tabele.
func (s *Store) Seed() error {
	// Hešujemo lozinke pre ubacivanja u bazu
	hashedPasswordAdmin, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	hashedPasswordVodic, _ := bcrypt.GenerateFromPassword([]byte("vodic123"), bcrypt.DefaultCost)
	hashedPasswordTurista, _ := bcrypt.GenerateFromPassword([]byte("turista123"), bcrypt.DefaultCost)

	// Ubacujemo administratore i test korisnike (kako piše u specifikaciji)
	// Koristimo "INSERT IGNORE" da ne bi došlo do greške ako podaci već postoje
	_, err := s.db.Exec(`
		INSERT IGNORE INTO users (id, username, password, email, role) VALUES
		(1, 'admin', ?, 'admin@example.com', 'administrator'),
		(2, 'vodic_pera', ?, 'pera@example.com', 'guide'),
		(3, 'turista_mika', ?, 'mika@example.com', 'tourist');
	`, string(hashedPasswordAdmin), string(hashedPasswordVodic), string(hashedPasswordTurista))

	if err != nil {
		return fmt.Errorf("error seeding users: %w", err)
	}

	// Ubacujemo profile za test korisnike
	_, err = s.db.Exec(`
		INSERT IGNORE INTO profiles (user_id, first_name, last_name, biography, motto) VALUES
		(2, 'Pera', 'Peric', 'Iskusni vodič kroz skrivene delove grada.', 'Carpe diem'),
		(3, 'Mika', 'Mikic', 'Strastveni putnik i ljubitelj prirode.', 'Live, travel, love');
	`)
	if err != nil {
		return fmt.Errorf("error seeding profiles: %w", err)
	}

	log.Println("Database seeding completed for stakeholders!")
	return nil
}
