package model

// User predstavlja korisnički nalog u sistemu.
// Funkcionalnost #1.
type User struct {
	ID       int64  `json:"id"`
	Username string `json:"username"`
	Password string `json:"-"` // Lozinka se nikada ne šalje klijentu
	Email    string `json:"email"`
	Role     string `json:"role"`     // 'guide', 'tourist', 'administrator'
	IsActive bool   `json:"isActive"` // Koristi se za blokiranje korisnika (Funkcionalnost #3)
}

// Profile predstavlja sve informacije o profilu jednog korisnika.
// Funkcionalnost #4.
type Profile struct {
	// ID polje nije strogo neophodno u modelu ako je 1-na-1 veza sa User-om,
	// ali je dobra praksa imati ga radi konzistentnosti.
	ID              int64  `json:"id"`
	UserID          int64  `json:"userId"`
	FirstName       string `json:"firstName"`
	LastName        string `json:"lastName"`
	ProfileImageURL string `json:"profileImageUrl"`
	Biography       string `json:"biography"`
	Motto           string `json:"motto"`
}
