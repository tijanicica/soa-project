package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"github.com/hudl/fargo"
	pb "github.com/tijanicica/soa-project/protos"
	grpcServer "github.com/tijanicica/soa-project/services/stakeholders-service/internal/grpc"
	"github.com/tijanicica/soa-project/services/stakeholders-service/internal/handler"
	"github.com/tijanicica/soa-project/services/stakeholders-service/internal/store"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

// registerWithEureka handles service registration and heartbeats with Eureka.
func registerWithEureka(serviceName string, port int) {
	eurekaURL := os.Getenv("EUREKA_URL")
	if eurekaURL == "" {
		log.Fatal("EUREKA_URL environment variable not set")
	}

	instanceName, _ := os.Hostname()
	if instanceName == "" {
		instanceName = "stakeholders-service-instance" // Fallback hostname
	}

	c := fargo.NewConn(eurekaURL)
	instance := fargo.Instance{
		HostName:         instanceName,
		App:              serviceName,
		IPAddr:           instanceName, // Docker's internal DNS will resolve this
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

	// Start heartbeat goroutine
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

	// --- Database and S3 Connection ---
	dbStore, err := store.NewStore(os.Getenv("DB_USER"), os.Getenv("DB_PASS"), os.Getenv("DB_HOST"), os.Getenv("DB_NAME"))
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	if err := dbStore.Init(); err != nil {
		log.Fatalf("Failed to initialize database tables: %v", err)
	}
	if err := dbStore.Seed(); err != nil {
		// Koristimo Warning umesto Fatal da aplikacija nastavi sa radom
		// čak i ako seed ne uspe (npr. podaci već postoje).
		log.Printf("Warning: Failed to seed database: %v", err)
	}
	s3Client, err := store.NewS3Session(os.Getenv("MINIO_ENDPOINT"), os.Getenv("MINIO_ACCESS_KEY"), os.Getenv("MINIO_SECRET_KEY"))
	if err != nil {
		log.Fatalf("Failed to connect to S3: %v", err)
	}
	bucketName := "user-profiles"
	_, err = s3Client.CreateBucket(&s3.CreateBucketInput{Bucket: &bucketName})
	if err != nil && !strings.Contains(err.Error(), "BucketAlreadyOwnedByYou") {
		log.Fatalf("Failed to create S3 bucket: %v", err)
	}

	// --- Configuration and Eureka Registration ---
	portStr := os.Getenv("PORT")
	port, _ := strconv.Atoi(portStr)
	serviceName := os.Getenv("SERVICE_NAME")
	registerWithEureka(serviceName, port)

	grpcPort := os.Getenv("GRPC_PORT")

	// --- 1. Start gRPC server in a background goroutine ---
	go func() {
		lis, err := net.Listen("tcp", ":"+grpcPort)
		if err != nil {
			log.Fatalf("failed to listen for gRPC: %v", err)
		}
		s := grpc.NewServer()
		stakeholderServer := grpcServer.NewServer(dbStore, s3Client)
		pb.RegisterStakeholderServiceServer(s, stakeholderServer)
		log.Printf("gRPC server listening at %v", lis.Addr())
		if err := s.Serve(lis); err != nil {
			log.Fatalf("failed to serve gRPC: %v", err)
		}
	}()

	// --- 2. Create gRPC Gateway Mux (for gRPC-translated routes) ---
	ctx := context.Background()
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()
	grpcGatewayMux := runtime.NewServeMux()
	opts := []grpc.DialOption{grpc.WithTransportCredentials(insecure.NewCredentials())}
	grpcEndpoint := "localhost:" + grpcPort
	err = pb.RegisterStakeholderServiceHandlerFromEndpoint(ctx, grpcGatewayMux, grpcEndpoint, opts)
	if err != nil {
		log.Fatalf("failed to register gateway: %v", err)
	}

	// --- 3. Create Gin router for all other standard HTTP routes ---
	gin.SetMode(gin.ReleaseMode)
	ginRouter := gin.Default()

	// Use Gin's CORS middleware for Gin-handled routes
	ginRouter.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// Register all non-gRPC routes on the Gin router
	userHandler := handler.NewUserHandler(dbStore, s3Client)
	ginRouter.GET("/users/batch", userHandler.GetUsersBatch)
	ginRouter.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"service": serviceName, "status": "UP"})
	})

	adminRoutes := ginRouter.Group("/api")
	{
		adminRoutes.GET("/users", userHandler.GetAllUsers)
		adminRoutes.PUT("/users/:id/block", userHandler.BlockUser)
		adminRoutes.PUT("/users/:id/unblock", userHandler.UnblockUser)
	}
	positionRoutes := ginRouter.Group("/position")
	positionRoutes.Use(handler.AuthMiddleware())
	{
		positionRoutes.GET("", userHandler.GetPosition)
		positionRoutes.PUT("", userHandler.UpdatePosition)
	}
	profileRoutes := ginRouter.Group("/profile")
	profileRoutes.Use(handler.AuthMiddleware())
	{
		profileRoutes.GET("", userHandler.GetProfile)
		profileRoutes.PUT("", userHandler.UpdateProfile)
		profileRoutes.POST("/upload", userHandler.UploadProfileImage)
	}

	// --- 4. Create a main router to delegate requests ---
	mainMux := http.NewServeMux()
	mainMux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// If the path is for a gRPC-Gateway route, let it handle it.
		if strings.HasPrefix(r.URL.Path, "/login") || strings.HasPrefix(r.URL.Path, "/register") {
			grpcGatewayMux.ServeHTTP(w, r)
		} else {
			// Otherwise, let Gin handle it.
			ginRouter.ServeHTTP(w, r)
		}
	})

	log.Printf("%s (Hybrid HTTP Server) starting on port %d", serviceName, port)
	if err := http.ListenAndServe(fmt.Sprintf(":%d", port), mainMux); err != nil {
		log.Fatalf("failed to serve hybrid http server: %v", err)
	}
}
