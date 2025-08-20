package main

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/hudl/fargo"
	// NOVI IMPORT: Uvozimo naš paket za rad sa bazom
	"stakeholders-service/internal/handler"
	"stakeholders-service/internal/store"
)

// Funkcija koja registruje servis na Eureku, SADA SA PONOVNIM POKUŠAJIMA
// OVA FUNKCIJA OSTAJE POTPUNO ISTA
func registerWithEureka(serviceName string, port int) {
	eurekaURL := os.Getenv("EUREKA_URL")
	if eurekaURL == "" {
		log.Fatal("EUREKA_URL environment variable not set")
	}

	instanceName, _ := os.Hostname()

	c := fargo.NewConn(eurekaURL)
	instance := fargo.Instance{
		HostName:         instanceName,
		App:              serviceName,
		IPAddr:           instanceName,
		VipAddress:       serviceName,
		SecureVipAddress: serviceName,
		Port:             port,
		DataCenterInfo:   fargo.DataCenterInfo{Name: fargo.MyOwn},
		Status:           fargo.UP,
	}

	var err error
	for i := 0; i < 10; i++ {
		err = c.RegisterInstance(&instance)
		if err == nil {
			log.Printf("Successfully registered with Eureka as %s", serviceName)
			break
		}
		log.Printf("Eureka registration failed, retrying in 5 seconds... (%s)", err.Error())
		time.Sleep(5 * time.Second)
	}

	if err != nil {
		log.Fatalf("Could not register with Eureka after multiple retries: %v", err)
	}

	go func() {
		for {
			if err := c.HeartBeatInstance(&instance); err != nil {
				log.Printf("Eureka heartbeat failed: %v", err)
			}
			time.Sleep(30 * time.Second)
		}
	}()
}

func main() {
	log.Println("Starting stakeholders-service...")

	// --- POČETAK NOVOG KODA ZA POVEZIVANJE NA BAZU ---
	log.Println("Connecting to database...")
	// Čitamo podatke za konekciju iz environment varijabli (iz docker-compose)
	dbUser := os.Getenv("DB_USER")
	dbPass := os.Getenv("DB_PASS")
	dbHost := os.Getenv("DB_HOST")
	dbName := os.Getenv("DB_NAME")

	// Kreiramo konekciju pomoću naše NewStore funkcije
	dbStore, err := store.NewStore(dbUser, dbPass, dbHost, dbName)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	log.Println("Database connection successful.")

	// Inicijalizujemo tabele (kreiramo ih ako ne postoje)
	if err := dbStore.Init(); err != nil {
		log.Fatalf("Failed to initialize database tables: %v", err)
	}

	// Ubacujemo početne podatke (seeding)
	if err := dbStore.Seed(); err != nil {
		// Koristimo log.Printf umesto Fatalf da aplikacija ne bi pukla ako podaci već postoje
		// a mi iz nekog razloga dobijemo grešku. U produkciji bi ovo bilo drugačije.
		log.Printf("Warning: Failed to seed database: %v", err)
	}
	// --- KRAJ NOVOG KODA ZA BAZU ---

	// Ostatak koda za pokretanje servisa
	portStr := os.Getenv("PORT")
	port, _ := strconv.Atoi(portStr)
	serviceName := os.Getenv("SERVICE_NAME")

	// Registrujemo se na Eureku
	registerWithEureka(serviceName, port)

	router := gin.Default()

	userHandler := handler.NewUserHandler(dbStore)

	// Definišemo API rute i povezujemo ih sa odgovarajućim funkcijama iz handlera
	router.POST("/register", userHandler.Register)
	router.POST("/login", userHandler.Login)
	
	log.Printf("%s starting on port %d", serviceName, port)
	router.Run(fmt.Sprintf(":%d", port))
}
