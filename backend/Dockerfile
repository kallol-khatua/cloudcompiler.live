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

# Copy the JAR and any extra resources
COPY --from=build /build/target/websocket-0.0.1-SNAPSHOT.jar ./app.jar

# (Optional) copy any resources, configs, or static files
# COPY --from=build /build/path/to/resource ./resource

# Expose default HTTP port
EXPOSE 8009

# Set entrypoint
ENTRYPOINT ["java", "-jar", "app.jar"]
