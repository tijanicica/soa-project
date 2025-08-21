# Stage 1: Build faza - gradi Vite aplikaciju
# PROMENA: Korišćenje novije verzije Node.js koju Vite zahteva
FROM node:20-alpine AS builder

WORKDIR /app

# Kopiraj package.json i package-lock.json da bi se iskoristio Docker cache
COPY package*.json ./
RUN npm install

# Kopiraj ostatak koda aplikacije
COPY . .

# Build-uj aplikaciju
# PROMENA: Uklonjen NODE_OPTIONS jer verovatno više nije potreban sa Node 20
RUN npm run build

# Stage 2: Production faza - servira build-ovane fajlove
FROM nginx:1.23-alpine

# Kopiraj build-ovane statičke fajlove iz 'builder' faze u folder koji Nginx koristi
COPY --from=builder /app/dist /usr/share/nginx/html

# Kopiraj custom Nginx konfiguraciju
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Izloži port 80 (standardni HTTP port)
EXPOSE 80

# Komanda za pokretanje Nginx servera
CMD ["nginx", "-g", "daemon off;"]