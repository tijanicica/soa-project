# Stage 1: Build faza
FROM golang:1.24.4-alpine AS builder

WORKDIR /src

# Kopiraj go.mod i go.sum iz korena projekta
COPY go.mod go.sum ./
# Preuzmi sve zavisnosti za ceo monorepo
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o /main ./services/stakeholders-service/cmd/main

# Stage 2: Production faza
FROM alpine:latest
WORKDIR /
COPY --from=builder /main /main

EXPOSE 8001
CMD ["/main"]