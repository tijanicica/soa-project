package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"blog-service/internal/handler"
	"blog-service/internal/store"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/hudl/fargo"

	"strings"

	"github.com/aws/aws-sdk-go/service/s3" // <-- NOVI IMPORT
)

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

	log.Println("Connecting to S3 storage...")
	minioEndpoint := os.Getenv("MINIO_ENDPOINT")
	minioAccessKey := os.Getenv("MINIO_ACCESS_KEY")
	minioSecretKey := os.Getenv("MINIO_SECRET_KEY")
	s3Client, err := store.NewS3Session(minioEndpoint, minioAccessKey, minioSecretKey)
	if err != nil {
		log.Fatalf("Failed to connect to S3: %v", err)
	}
	log.Println("S3 connection successful.")

	// Kreiramo Bucket ako ne postoji
	bucketName := "blog-images"
	_, err = s3Client.CreateBucket(&s3.CreateBucketInput{
		Bucket: &bucketName,
	})
	if err != nil {
		// Ignorišemo grešku ako bucket već postoji
		if !strings.Contains(err.Error(), "BucketAlreadyOwnedByYou") {
			log.Fatalf("Failed to create S3 bucket: %v", err)
		}
	}

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

	blogHandler := handler.NewBlogHandler(dbStore, s3Client)

	authRoutes := router.Group("/")
	authRoutes.Use(handler.AuthMiddleware())
	{
		authRoutes.GET("/blogs", blogHandler.GetAllBlogs)

		authRoutes.POST("/blogs", blogHandler.CreateBlog)

		authRoutes.POST("/blogs/:blogId/comments", blogHandler.AddComment)
		authRoutes.GET("/blogs/:blogId/comments", blogHandler.GetAllCommentsForBlog)

		authRoutes.POST("/blogs/:blogId/like", blogHandler.ToggleLike)
	}

	log.Printf("%s starting on port %d", serviceName, port)
	router.Run(fmt.Sprintf(":%d", port))

}
