# Stage 1: Build faza
FROM node:20-alpine AS builder
WORKDIR /app

# Kopiraj package fajlove i instaliraj dependencije
COPY package*.json ./
RUN npm install

# Kopiraj ostatak koda
COPY . .

# Build
RUN npm run build

# Stage 2: Production
FROM nginx:1.23-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
