package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	// NOVI IMPORT: Uvozimo store paket iz blog-service-a
	"blog-service/internal/store"
	"github.com/gin-contrib/cors" // <-- 1. NOVI IMPORT
	"github.com/gin-gonic/gin"
	"github.com/hudl/fargo"
)

// registerWithEureka funkcija ostaje POTPUNO ISTA kao u stakeholders-service
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
	log.Println("Starting blog-service...")

	// --- POČETAK KODA ZA BAZU ---
	log.Println("Connecting to database...")
	dbUser := os.Getenv("DB_USER")
	dbPass := os.Getenv("DB_PASS")
	dbHost := os.Getenv("DB_HOST")
	dbName := os.Getenv("DB_NAME")

	dbStore, err := store.NewStore(dbUser, dbPass, dbHost, dbName)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	log.Println("Database connection successful.")

	if err := dbStore.Init(); err != nil {
		log.Fatalf("Failed to initialize database tables: %v", err)
	}

	if err := dbStore.Seed(); err != nil {
		log.Printf("Warning: Failed to seed database: %v", err)
	}
	// --- KRAJ KODA ZA BAZU ---

	portStr := os.Getenv("PORT")
	port, _ := strconv.Atoi(portStr)
	serviceName := os.Getenv("SERVICE_NAME")

	registerWithEureka(serviceName, port)

	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"service": serviceName, "status": "UP"})
	})

	// OVDE ĆETE KASNIJE DODAVATI PRAVE RUTE ZA BLOG
	// npr. router.POST("/blogs", handler.CreateBlog)
	// Primer:
	// blogHandler := handler.NewBlogHandler(dbStore)
	// router.POST("/blogs", blogHandler.CreateBlog)
	// router.POST("/blogs/:id/comments", blogHandler.AddComment)

	log.Printf("%s starting on port %d", serviceName, port)
	router.Run(fmt.Sprintf(":%d", port))
}
