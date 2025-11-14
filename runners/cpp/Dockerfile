# Base image (Debian slim instead of Ubuntu)
FROM debian:bookworm-slim

# Prevent interactive prompts during apt-get install
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies: curl, unzip, Node.js, npm, OpenJDK 17, strace
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    unzip \
    openjdk-17-jdk \
    strace \
    python3 \
    make \
    g++ \
    build-essential \
    procps \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set workdir
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application files
COPY . .

# Create jobs directory
RUN mkdir -p /usr/src/app/jobs

# Make shell script executable
RUN chmod +x main.sh

# Set environment variables
ENV NODE_ENV=production

# Health check - verify main process is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD pgrep -f "node poller.js" > /dev/null || exit 1

# Entrypoint
ENTRYPOINT ["./main.sh"]