package store

import (
	"database/sql"
	"stakeholders-service/internal/model"

	"golang.org/x/crypto/bcrypt"
)

// CreateUser hešuje lozinku i upisuje novog korisnika u bazu
func (s *Store) CreateUser(user *model.User) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	_, err = s.db.Exec("INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)",
		user.Username, string(hashedPassword), user.Email, user.Role)
	return err
}

// GetUserByUsername pronalazi korisnika po korisničkom imenu.
// Neophodno za login.
func (s *Store) GetUserByUsername(username string) (*model.User, error) {
	user := &model.User{}
	row := s.db.QueryRow("SELECT id, username, password, email, role, is_active FROM users WHERE username = ?", username)

	err := row.Scan(&user.ID, &user.Username, &user.Password, &user.Email, &user.Role, &user.IsActive)
	if err != nil {
		if err == sql.ErrNoRows {
			// Ovo nije prava greška, samo znači da korisnik ne postoji.
			// Vraćamo nil, nil da bi handler znao kako da reaguje.
			return nil, nil
		}
		return nil, err
	}
	return user, nil
}

// GetAllUsers dohvata sve korisnike iz baze bez njihovih lozinki.
func (s *Store) GetAllUsers() ([]model.User, error) {
	rows, err := s.db.Query("SELECT id, username, email, role, is_active FROM users")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []model.User
	for rows.Next() {
		var user model.User
		if err := rows.Scan(&user.ID, &user.Username, &user.Email, &user.Role, &user.IsActive); err != nil {
			return nil, err
		}
		users = append(users, user)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return users, nil
}

// BlockUser postavlja is_active status korisnika na false.
func (s *Store) BlockUser(userID int64) error {
	_, err := s.db.Exec("UPDATE users SET is_active = false WHERE id = ?", userID)
	return err
}

// ... (postojeći kod, npr. ispod GetUserByUsername)

// --- NOVA FUNKCIJA ---
// GetUserByID pronalazi korisnika po njegovom ID-ju.
func (s *Store) GetUserByID(id int64) (*model.User, error) {
	user := &model.User{}
	row := s.db.QueryRow("SELECT id, username, password, email, role, is_active FROM users WHERE id = ?", id)
	err := row.Scan(&user.ID, &user.Username, &user.Password, &user.Email, &user.Role, &user.IsActive)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return user, nil
}
