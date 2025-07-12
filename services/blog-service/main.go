package main

import (
	"fmt"
	"log"
	"net/http"
)

func handler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Hello from Blog Service!")
}

func main() {
	http.HandleFunc("/", handler)
	log.Println("Blog service is running on port 8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}