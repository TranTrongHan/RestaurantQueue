# Stage 1: Build
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Tối ưu hóa việc download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Build mã nguồn
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run
FROM eclipse-temurin:21-jre
WORKDIR /app

# Cài đặt múi giờ Việt Nam cho Debian
RUN apt-get update && apt-get install -y tzdata && rm -rf /var/lib/apt/lists/*
ENV TZ=Asia/Ho_Chi_Minh

# Copy jar từ stage build
COPY --from=build /app/target/*.jar app.jar

# Copy application.yml để dùng config bên ngoài
COPY src/main/resources/application.yml application.yml
# Copy file Firebase
COPY src/main/resources/firebase-service-account.json firebase-service-account.json

EXPOSE 8080

# Chạy app với file config ngoài
ENTRYPOINT ["java", "-jar", "app.jar", "--spring.config.location=file:/app/application.yml"]
