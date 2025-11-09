# ---- Stage 1: Build JAR ----
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build

# Set the working directory
WORKDIR /build

# Copy pom.xml and download dependencies first (optimize caching)
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy the entire project source
COPY src ./src

# Build the application (creates JAR in target/)
RUN mvn clean package -DskipTests

# ---- Stage 2: Final image ----
FROM eclipse-temurin:21-jre-alpine

# Set working directory in final container
WORKDIR /app

# Install curl for health checks or debugging
RUN apk add --no-cache curl

# Copy the JAR and any extra resources
COPY --from=build /build/target/cloudcompiler_live-backend-websocket.jar ./cloudcompiler_live-backend-websocket.jar

# (Optional) copy any resources, configs, or static files
# COPY --from=build /build/path/to/resource ./resource

# Expose default HTTP port
EXPOSE 8009

# # Optional: Add a basic healthcheck using curl
# HEALTHCHECK CMD curl -f http://localhost:8009/actuator/health || exit 1

# # Run as non-root user for better security
# RUN adduser -D spring
# USER spring

# Set entrypoint
ENTRYPOINT ["java", "-jar", "/app/cloudcompiler_live-backend-websocket.jar"]
