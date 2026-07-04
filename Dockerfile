# 📋 TASK 10: Dockerfile (The DevOps Engineer)
# Multi-stage build for a highly optimized NGINX static server
# serving the Vite/React SiegeCraft web application.

# Stage 1: Build the React Application
FROM node:22-alpine as builder

WORKDIR /app

# Install dependencies first for Docker caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Serve with NGINX
FROM nginx:alpine

# Copy the built dist folder from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
