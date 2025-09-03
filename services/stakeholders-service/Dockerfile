# Stage 1: Build faza
FROM golang:1.24.4-alpine AS builder

# Radni direktorijum unutar kontejnera
WORKDIR /src

# Kopiraj go.mod i go.sum iz korena projekta
COPY go.mod go.sum ./
# Preuzmi sve zavisnosti za ceo monorepo
RUN go mod download

# Kopiraj sav izvorni kod iz korena projekta
COPY . .

# Build-uj specifičnu aplikaciju (stakeholders-service)
# Važno: putanja do 'main' paketa je relativna u odnosu na WORKDIR (/src)
RUN CGO_ENABLED=0 GOOS=linux go build -o /main ./services/stakeholders-service/cmd/main

# Stage 2: Production faza
FROM alpine:latest
WORKDIR /
COPY --from=builder /main /main

EXPOSE 8001
CMD ["/main"]