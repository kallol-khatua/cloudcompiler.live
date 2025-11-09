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
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*


# Set workdir
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy main.sh, script.js, compile-java-code.js, run-java-code.js and send-output.js
COPY poller.js .
COPY redis-subscriber.js .
COPY run-code.js .
COPY runner.js .
COPY script.js .
COPY send-output.js .
COPY main.sh .

# Make shell script executable
RUN chmod +x main.sh

# Entrypoint
ENTRYPOINT ["./main.sh"]