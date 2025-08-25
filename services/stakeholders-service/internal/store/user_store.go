package store

import (
	"database/sql"
	"stakeholders-service/internal/model"

	"golang.org/x/crypto/bcrypt"
)


func (s *Store) CreateUser(user *model.User) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	_, err = s.db.Exec("INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)",
		user.Username, string(hashedPassword), user.Email, user.Role)
	return err
}


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

func (s *Store) BlockUser(userID int64) error {
	_, err := s.db.Exec("UPDATE users SET is_active = false WHERE id = ?", userID)
	return err
}

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

// GetProfileByUserID pronalazi profil korisnika.
func (s *Store) GetProfileByUserID(userID int64) (*model.Profile, error) {
	profile := &model.Profile{}
	// SELECT lista ostaje ista
	row := s.db.QueryRow("SELECT id, user_id, first_name, last_name, profile_image_url, biography, motto FROM profiles WHERE user_id = ?", userID)

	// Scan sada ide u naša nova sql.NullString polja
	err := row.Scan(&profile.ID, &profile.UserID, &profile.FirstName, &profile.LastName, &profile.ProfileImageURL, &profile.Biography, &profile.Motto)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return profile, nil
}

// UpdateProfile ažurira ili kreira profil korisnika.
func (s *Store) UpdateProfile(profile *model.Profile) error {
	_, err := s.db.Exec(`
		INSERT INTO profiles (user_id, first_name, last_name, profile_image_url, biography, motto)
		VALUES (?, ?, ?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE
		first_name = VALUES(first_name),
		last_name = VALUES(last_name),
		profile_image_url = VALUES(profile_image_url),
		biography = VALUES(biography),
		motto = VALUES(motto);
	`, profile.UserID, profile.FirstName, profile.LastName, profile.ProfileImageURL, profile.Biography, profile.Motto)

	return err
}


func (s *Store) GetUserByEmail(email string) (*model.User, error) {
	user := &model.User{}
	row := s.db.QueryRow("SELECT id FROM users WHERE email = ?", email)

	// Treba nam samo da proverimo da li postoji red, ne trebaju nam svi podaci
	err := row.Scan(&user.ID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // Korisnik ne postoji, što je u ovom slučaju uspeh

		}
		return nil, err
	}
	return user, nil
}
