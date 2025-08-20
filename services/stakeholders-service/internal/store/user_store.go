package store

import (
	"database/sql"
	"golang.org/x/crypto/bcrypt"
	"stakeholders-service/internal/model"
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
