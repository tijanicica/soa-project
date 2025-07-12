# Stage 1: Build faza - gradi Vite aplikaciju
FROM node:18-alpine AS builder

WORKDIR /app

# Kopiraj package.json i package-lock.json da bi se iskoristio Docker cache
COPY package*.json ./
RUN npm install

# Kopiraj ostatak koda aplikacije
COPY . .

# Build-uj aplikaciju sa legacy OpenSSL provajderom
RUN NODE_OPTIONS=--openssl-legacy-provider npm run build

# Stage 2: Production faza - servira build-ovane fajlove
FROM nginx:1.23-alpine

# Kopiraj build-ovane statičke fajlove iz 'builder' faze u folder koji Nginx koristi
# Vite kreira 'dist' folder, a ne 'build'
COPY --from=builder /app/dist /usr/share/nginx/html

# Kopiraj custom Nginx konfiguraciju
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Izloži port 80 (standardni HTTP port)
EXPOSE 80

# Komanda za pokretanje Nginx servera
CMD ["nginx", "-g", "daemon off;"]