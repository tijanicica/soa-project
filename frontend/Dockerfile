# Stage 1: Build faza
FROM node:20-bullseye AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci   # bolje od npm install u dockeru

COPY . .
RUN npm run build

# Stage 2: Production
FROM nginx:1.23-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
