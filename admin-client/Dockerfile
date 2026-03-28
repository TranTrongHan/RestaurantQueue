# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies and build
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

COPY . .
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
