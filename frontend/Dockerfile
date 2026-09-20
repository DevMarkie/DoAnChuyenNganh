# Multi-stage Dockerfile for React Frontend
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first for Docker cache
COPY package.json ./
RUN npm install

# Build application
COPY . .
RUN npm run build

# Nginx runtime stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
