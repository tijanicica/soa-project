#Stage 1: Build faza
FROM golang:1.19-alpine AS builder

# Postavi radni direktorijum unutar kontejnera
WORKDIR /app

#  Kopiraj go.mod i go.sum fajlove da bi se iskoristio Docker cache
COPY go.* ./
RUN go mod download

#  Kopiraj ostatak izvornog koda
COPY . .

#  Build-uj Go aplikaciju. Onemogućava CGO i pravi statički binarni fajl.
RUN CGO_ENABLED=0 GOOS=linux go build -o /main .

# Stage 2: Production faza - minimalna slika
FROM alpine:latest

# Kopiraj samo build-ovani binarni fajl iz 'builder' faze
COPY --from=builder /main /main

# Izloži port na kojem će aplikacija raditi unutar kontejnera
EXPOSE 8080

# Komanda za pokretanje aplikacije
CMD ["/main"]