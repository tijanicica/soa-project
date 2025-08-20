# Stage 1: Build faza
# AŽURIRANO: Koristimo modernu Go verziju koja se slaže sa tvojim go.mod
FROM golang:1.23-alpine AS builder

# Postavi radni direktorijum unutar kontejnera
WORKDIR /app

# Kopiraj go.mod i go.sum fajlove da bi se iskoristio Docker cache
COPY go.mod go.sum ./
RUN go mod download

# Kopiraj ostatak izvornog koda
COPY . .

# Build-uj Go aplikaciju
RUN CGO_ENABLED=0 GOOS=linux go build -o /main ./cmd/main

# Stage 2: Production faza - minimalna slika
FROM alpine:latest

# Kopiraj samo build-ovani binarni fajl iz 'builder' faze
COPY --from=builder /main /main

# Izloži port na kojem će aplikacija raditi unutar kontejnera
# Za stakeholders-service:
EXPOSE 8001
# Za blog-service, ova linija treba da bude EXPOSE 8002

# Komanda za pokretanje aplikacije
CMD ["/main"]