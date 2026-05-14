# Stage 1: Build the React application
FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install --legacy-peer-deps

# Copy source code and environment variables
# Note: .env is needed at build time for Vite
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Xóa cấu hình mặc định của Nginx
RUN rm -rf /etc/nginx/conf.d

# Copy cấu hình nginx tùy chỉnh từ host vào container
COPY nginx.conf /etc/nginx/nginx.conf

# Copy build files từ bước 1 sang thư mục serve của nginx
COPY --from=builder /app/dist /app

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
