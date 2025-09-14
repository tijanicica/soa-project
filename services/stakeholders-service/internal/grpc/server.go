package grpc

import (
	"context"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/golang-jwt/jwt/v5"
	pb "github.com/tijanicica/soa-project/protos"
	"github.com/tijanicica/soa-project/services/stakeholders-service/internal/model"
	"github.com/tijanicica/soa-project/services/stakeholders-service/internal/store"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// AppClaims definiše podatke koji se čuvaju u JWT tokenu.
type AppClaims struct {
	Role string `json:"role"`
	jwt.RegisteredClaims
}

var jwtKey = []byte(os.Getenv("JWT_KEY"))

// Server je implementacija gRPC servisa.
type Server struct {
	pb.UnimplementedStakeholderServiceServer
	store    *store.Store
	s3Client *s3.S3
}

// NewServer kreira novu instancu gRPC servera sa potrebnim zavisnostima.
func NewServer(store *store.Store, s3Client *s3.S3) *Server {
	return &Server{
		store:    store,
		s3Client: s3Client,
	}
}

// GetUsersInfo dobavlja osnovne informacije o više korisnika na osnovu njihovih ID-jeva.
func (s *Server) GetUsersInfo(ctx context.Context, req *pb.GetUsersInfoRequest) (*pb.GetUsersInfoResponse, error) {
	// Pozivamo store metodu koja vraća mapu modela
	usersInfo, err := s.store.GetUsersInfoByIDs(req.UserIds)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get user info: %v", err)
	}

	// Kreiramo mapu za protobuf odgovor
	responseUsers := make(map[int64]*pb.UserInfo)
	for id, info := range usersInfo {
		responseUsers[id] = &pb.UserInfo{
			Id:              info.ID,
			Username:        info.Username,
			FirstName:       info.FirstName.String, // sql.NullString se pretvara u string
			ProfileImageUrl: info.ProfileImageURL.String,
		}
	}

	return &pb.GetUsersInfoResponse{Users: responseUsers}, nil
}

// Login obrađuje zahtev za prijavljivanje korisnika.
func (s *Server) Login(ctx context.Context, req *pb.LoginRequest) (*pb.LoginResponse, error) {
	// 1. Pronađi korisnika u bazi
	log.Printf("--- LOGIN ATTEMPT for user: %s ---", req.Username)
	user, err := s.store.GetUserByUsername(req.Username)
	if err != nil {
		// Prava greška sa bazom
		log.Printf("[ERROR] Database error on GetUserByUsername: %v", err)
		return nil, status.Errorf(codes.Internal, "database error: %v", err)
	}
	if user == nil {
		log.Printf("[FAIL] User not found: %s", req.Username)
		// Korisnik ne postoji
		return nil, status.Errorf(codes.Unauthenticated, "invalid credentials")
	}

	// 2. Proveri da li je korisnik aktivan
	if !user.IsActive {
		log.Printf("[FAIL] User is not active: %s", req.Username)
		return nil, status.Errorf(codes.PermissionDenied, "your account has been blocked")
	}

	log.Printf("[DEBUG] Hashed password from DB for user %s: %s", req.Username, user.Password)
	log.Printf("[DEBUG] Plain-text password from request: %s", req.Password)

	// 3. Proveri lozinku
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		// Pogrešna lozinka
		log.Printf("[FAIL] Password comparison failed for user %s: %v", req.Username, err)
		return nil, status.Errorf(codes.Unauthenticated, "invalid credentials")
	}

	log.Printf("[SUCCESS] Password comparison successful for user: %s", req.Username)

	// 4. Kreiraj JWT token
	expirationTime := time.Now().Add(24 * time.Hour) // Token traje 24 sata

	claims := &AppClaims{
		Role: user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   strconv.FormatInt(user.ID, 10),
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create token: %v", err)
	}

	// 5. Vrati odgovor sa tokenom i ID-jem korisnika
	return &pb.LoginResponse{
		Token:  tokenString,
		UserId: user.ID,
	}, nil
}

func (s *Server) Register(ctx context.Context, req *pb.RegisterRequest) (*pb.RegisterResponse, error) {
	// 1. Proveri da li korisničko ime već postoji
	existingUser, err := s.store.GetUserByUsername(req.Username)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "database error checking username: %v", err)
	}
	if existingUser != nil {
		return nil, status.Errorf(codes.AlreadyExists, "username is already taken")
	}

	// 2. Proveri da li email već postoji
	existingUser, err = s.store.GetUserByEmail(req.Email)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "database error checking email: %v", err)
	}
	if existingUser != nil {
		return nil, status.Errorf(codes.AlreadyExists, "email is already registered")
	}

	// 3. Validacija uloge
	switch req.Role {
	case "guide", "tourist":
		// Dozvoljene uloge
	case "administrator":
		return nil, status.Errorf(codes.PermissionDenied, "administrator role cannot be assigned through registration")
	default:
		return nil, status.Errorf(codes.InvalidArgument, "invalid role specified. Allowed roles are 'guide' or 'tourist'")
	}

	// 4. Kreiraj korisnika u bazi
	user := &model.User{
		Username: req.Username,
		Password: req.Password,
		Email:    req.Email,
		Role:     req.Role,
	}

	if err := s.store.CreateUser(user); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create user: %v", err)
	}

	// 5. Vrati uspešan odgovor
	return &pb.RegisterResponse{
		Message: "User created successfully",
	}, nil

}
