package store

import (
	"database/sql"

	"github.com/tijanicica/soa-project/services/stakeholders-service/internal/model"

	"fmt"
	"strings"

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

func (s *Store) GetProfileByUserID(userID int64) (*model.Profile, error) {
	profile := &model.Profile{}
	row := s.db.QueryRow("SELECT id, user_id, first_name, last_name, profile_image_url, biography, motto FROM profiles WHERE user_id = ?", userID)

	err := row.Scan(&profile.ID, &profile.UserID, &profile.FirstName, &profile.LastName, &profile.ProfileImageURL, &profile.Biography, &profile.Motto)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return profile, nil
}

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

	err := row.Scan(&user.ID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // Korisnik ne postoji, što je u ovom slučaju uspeh

		}
		return nil, err
	}
	return user, nil
}

func (s *Store) UnblockUser(userID int64) error {
	_, err := s.db.Exec("UPDATE users SET is_active = TRUE WHERE id = ?", userID)
	return err
}

func (s *Store) UpdatePosition(userID int64, latitude, longitude float64) error {
	_, err := s.db.Exec("UPDATE users SET latitude = ?, longitude = ? WHERE id = ?", latitude, longitude, userID)
	return err
}

func (s *Store) GetPosition(userID int64) (sql.NullFloat64, sql.NullFloat64, error) {
	var lat, lon sql.NullFloat64
	row := s.db.QueryRow("SELECT latitude, longitude FROM users WHERE id = ?", userID)
	err := row.Scan(&lat, &lon)
	if err != nil {
		if err == sql.ErrNoRows {
			// Nije greška ako korisnik postoji ali nema poziciju (NULL vrednosti)
			// sql.ErrNoRows će se desiti samo ako korisnik sa tim ID-jem ne postoji uopšte
			return lat, lon, nil
		}
		return lat, lon, err
	}
	return lat, lon, nil
}

func (s *Store) GetUsersInfoByIDs(userIDs []int64) (map[int64]model.UserInfo, error) {
	if len(userIDs) == 0 {
		return make(map[int64]model.UserInfo), nil
	}

	placeholders := strings.Repeat("?,", len(userIDs)-1) + "?"
	query := fmt.Sprintf(`
		SELECT u.id, u.username, p.first_name, p.profile_image_url
		FROM users u
		LEFT JOIN profiles p ON u.id = p.user_id
		WHERE u.id IN (%s)
	`, placeholders)

	// Moramo da konvertujemo []int64 u []interface{} za Query
	args := make([]interface{}, len(userIDs))
	for i, id := range userIDs {
		args[i] = id
	}

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	usersInfo := make(map[int64]model.UserInfo)
	for rows.Next() {
		var info model.UserInfo
		if err := rows.Scan(&info.ID, &info.Username, &info.FirstName, &info.ProfileImageURL); err != nil {
			return nil, err
		}
		usersInfo[info.ID] = info
	}

	return usersInfo, nil
}
