# Cloudcompiler.live

A real-time cloud-based code compiler and execution platform that allows users to write, compile, and run code directly in their browser with live output streaming and interactive input support.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://cloudcompiler.live/)

## Features

- **Multi-Language Support**: Write and execute code in multiple programming languages (Java, C++, Python, and more)
- **Real-Time Output Streaming**: Live output as code executes with millisecond latency
- **Interactive Input**: Provide runtime input through WebSocket connection with node-pty integration
- **Browser-Based IDE**: No installation required - code directly in your browser
- **High-Performance Execution**: Distributed queue-based architecture with language-specific workers
- **Secure Sandboxing**: Code runs in isolated Docker containers with strict resource limits
- **Horizontally Scalable**: Built on AWS cloud infrastructure with auto-scaling capabilities
- **Modern UI**: Clean, responsive interface built with React, TypeScript, and Tailwind CSS
- **Sub-Second Latency**: Optimized WebSocket connections with ElastiCache Valkey for state management

## Live Demo

Visit [cloudcompiler.live](https://cloudcompiler.live/) to try it out!

## High-Level Architecture

```
                              ┌─────────────────┐
                              │   Route 53      │
                              │   DNS Routing   │
                              └────────┬────────┘
                                       │
                              ┌────────▼────────┐
                              │  cloudcompiler  │
                              │      .live      │
                              └────────┬────────┘
                                       │ HTTPS + WSS
┌──────────────────────────────────────┼──────────────────────────────────┐
│                              USER BROWSER                               │
│                    (React + TypeScript + Tailwind)                      │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │ HTTPS + WebSocket (WSS)
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    APPLICATION LOAD BALANCER (ALB)                      │
│            ┌──────────────────┬──────────────────────────┐              │
│            │  Frontend Target │  Backend WebSocket       │              │
│            │  Group (Port 80) │  Target Group (Port 8080)│              │
└────────────┴─────────┬────────┴──────────┬───────────────┴──────────────┘
                       │                   │
          ┌────────────▼────────┐   ┌──────▼─────────────────────────────┐
          │  FRONTEND SERVICE   │   │  BACKEND WEBSOCKET SERVICE         │
          │  ┌───────────────┐  │   │  ┌──────────────────────────────┐  │
          │  │ Nginx + React │  │   │  │  Spring Boot WebSocket       │  │
          │  │     SPA       │  │   │  │  • STOMP Protocol            │  │
          │  │  AWS ECS      │  │   │  │  • Session Management        │  │
          │  └───────────────┘  │   │  │  • Real-time Communication   │  │
          │  Auto-scaling: 2-5  │   │  │  AWS ECS                     │  │
          └─────────────────────┘   │  └──────────┬───────────────────┘  │
                                    │             │                      │
                                    │  Auto-scaling: 3-15 (based on      │
                                    │  concurrent WebSocket connections) │
                                    └─────────────┼──────────────────────┘
                                                  │
                    ┌─────────────────────────────┼────────────────────┐
                    │                             │                    │
                    ▼                             ▼                    ▼
         ┌────────────────────┐      ┌─────────────────────┐  ┌──────────────┐
         │    AWS SQS         │      │ AWS ElastiCache     │  │   AWS ECR    │
         │  (FIFO Queues)     │      │    (Valkey)         │  │              │
         │                    │      │                     │  │ Container    │
         │ • java-queue.fifo  │      │ • WebSocket State   │  │ Images       │
         │ • cpp-queue.fifo   │      │ • Session Store     │  │              │
         │ • python-queue.fifo│      │ • Pub/Sub Channels  │  │ • Frontend   │
         │                    │      │ • Job Output Cache  │  │ • Backend    │
         │                    │      │                     │  │ • Runners    │
         └──────────┬─────────┘      │ Pattern:            │  └──────────────┘
                    │                │ • session:{userId}  │
                    │                │ • job:output:{id}   │
                    │                │ • job:input:{id}    │
                    │                └──────────▲──────────┘
                    │                           │
                    │                           │
                    ▼                           │
         ┌──────────────────────────────────────┴────────────────┐
         │             LANGUAGE-SPECIFIC RUNNER SERVICES         │
         │                                                       │
         │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐   │
         │  │ Java Runner │  │ C++ Runner  │  │ Python Runner│   │
         │  │             │  │             │  │              │   │
         │  │ • Poll SQS  │  │ • Poll SQS  │  │ • Poll SQS   │   │
         │  │ • Compile   │  │ • Compile   │  │ • Execute    │   │
         │  │ • Execute   │  │ • Execute   │  │ • node-pty   │   │
         │  │ • node-pty  │  │ • node-pty  │  │ • Stream     │   │
         │  │ • Stream    │  │ • Stream    │  │ • AWS ECS    │   │
         │  │ • AWS ECS   │  │ • AWS ECS   │  │              │   │
         │  └─────────────┘  └─────────────┘  └──────────────┘   │
         │                                                       │
         │  Auto-scaling per language: 1-10 containers           │
         │  (based on SQS queue depth)                           │
         └───────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│                         CI/CD PIPELINES                               │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ GitHub Branches → AWS CodePipeline (Branch-specific)           │   │
│  │                                                                │   │
│  │  • frontend-deploy        → Frontend Pipeline                  │   │
│  │  • backend-websocket-deploy → Backend Pipeline                 │   │
│  │  • runner-java-deploy     → Java Runner Pipeline               │   │
│  │  • runner-cpp-deploy      → C++ Runner Pipeline                │   │
│  │  • runner-python-deploy   → Python Runner Pipeline             │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  Flow: Branch Push → CodePipeline → CodeBuild → ECR → ECS Deploy      │
└───────────────────────────────────────────────────────────────────────┘
```

## Execution Flow

### 1. Code Submission
- User writes code in browser and clicks "Run"
- Frontend establishes WebSocket connection to backend
- Code submission sent via WebSocket with language and execution parameters

### 2. Job Queueing
- Spring Boot backend receives code via WebSocket
- Generates unique `jobId` for tracking
- Adds job to language-specific SQS FIFO queue (java-queue.fifo, cpp-queue.fifo, etc.)
- Stores WebSocket session mapping in ElastiCache Valkey

### 3. Runner Processing
- Language-specific runner container polls its dedicated SQS queue
- Fetches job and creates isolated Docker container
- Compiles (if needed) and executes code with resource limits
- Uses node-pty for interactive I/O handling

### 4. Real-Time Output Streaming
- Runner streams stdout/stderr to ElastiCache Valkey pub/sub channel: `job:output:{jobId}`
- Spring Boot backend subscribes to job-specific channel
- Output forwarded to user via WebSocket in real-time (< 50ms latency)

### 5. Interactive Input (if needed)
- User sends input through WebSocket
- Backend publishes input to `job:input:{jobId}` channel in Valkey
- Runner subscribes and receives input
- Input injected into running container via node-pty
- Execution continues with user input

### 6. Job Completion
- Runner sends completion status to Valkey
- Backend notifies user via WebSocket
- Container cleaned up and resources released

## Tech Stack

### Frontend
- **React** with **TypeScript** - Type-safe component architecture
- **Tailwind CSS** - Utility-first styling for modern UI
- **WebSocket Client** (stomp) - Real-time bidirectional communication
- **Monaco Editor** - Code editor with syntax highlighting
- **Nginx** - Internal routing and static file serving
- **Docker** - Containerization for consistent deployment

### Backend
- **Spring Boot** - WebSocket server and REST API
- **Spring WebSocket** with **STOMP** - Real-time communication protocol
- **AWS SDK for Java** - AWS service integration (SQS, ElastiCache)
- **Lettuce** - ElastiCache Valkey client for pub/sub
- **Spring Session** with Valkey - Distributed session management

### Infrastructure & DevOps
- **AWS ECS (Elastic Container Service)** - Container orchestration
- **AWS ECR (Elastic Container Registry)** - Docker image storage
- **AWS SQS (Simple Queue Service)** - FIFO queues for ordered job processing
- **AWS ElastiCache (Valkey)** - High-performance in-memory data store for:
  - WebSocket session management (enabling horizontal scaling)
  - Pub/Sub channels for real-time output streaming
- **Application Load Balancer** - Traffic distribution with sticky sessions
- **Route 53** - DNS management and routing
- **AWS CodePipeline** - Branch-specific CI/CD automation
- **AWS CodeBuild** - Build automation
- **Docker** - Code execution sandboxing
- **node-pty** - Interactive terminal (PTY) for stdin/stdout handling

### Code Execution
- **Docker Containers** - Isolated, ephemeral execution environment
- **Language-specific runtimes**:
  - Java (OpenJDK 17)
  - C++ (GCC 11 with C++17 support)
  - Python (3.11)
- **Resource limits** - CPU, memory, disk I/O, and time constraints

## AWS Infrastructure Components

### ECS Services
- **Frontend Service**: 
  - Nginx serving React SPA
  - Auto-scaling: 2-5 containers
  - Health check: `/`
  
- **Backend WebSocket Service**: 
  - Spring Boot with WebSocket support
  - Auto-scaling: 3-15 containers (based on concurrent connections)
  - Health check: `/actuator/health`
  - Sticky sessions enabled via ALB
  
- **Runner Services** (per language):
  - Java Runner: 1-10 containers
  - C++ Runner: 1-10 containers
  - Python Runner: 1-10 containers
  - Auto-scaling based on SQS queue depth

### SQS Queues (FIFO)
- `java-code-queue.fifo` - Java compilation and execution jobs
- `cpp-code-queue.fifo` - C++ compilation and execution jobs
- `python-code-queue.fifo` - Python execution jobs

### ElastiCache (Valkey)
- **Cluster Mode**: Enabled for horizontal scaling
- **Multi-AZ**: Enabled for high availability
- **Use Cases**:
  - WebSocket session storage → Enables backend horizontal scaling
  - Pub/Sub channels for real-time output streaming
- **Key Patterns**:
  - `session:{sessionId}` - WebSocket session data
  - `job:output:{jobId}` - Real-time output pub/sub channel
  - `job:input:{jobId}` - Interactive input pub/sub channel

### Route 53
- **Domain**: cloudcompiler.live
- **A Record**: Points to Application Load Balancer
- **Health Checks**: Configured for failover
- **SSL/TLS**: ACM certificate for HTTPS/WSS

### Application Load Balancer
- **Frontend Target Group**: 
  - Port 80 → Container port 80
  - Health check: `GET /`
  - Deregistration delay: 30s
  
- **Backend Target Group**: 
  - Port 8080 → Container port 8080
  - Health check: `GET /actuator/health`
  - Sticky sessions: Enabled (for WebSocket connections)
  - Deregistration delay: 300s (graceful WebSocket closure)

### CI/CD Pipelines (Branch-specific)

```
┌────────────────────────────────────────────────────────────────┐
│ Branch: frontend-deploy                                        │
│ ├─ Trigger: Push to frontend-deploy                            │
│ ├─ CodeBuild: configuration/buildspec-frontend.yml             │
│ ├─ Build: React production build                               │
│ ├─ Docker: Build & push to ECR                                 │
│ └─ Deploy: Update ECS frontend service                         │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ Branch: backend-websocket-deploy                               │
│ ├─ Trigger: Push to backend-websocket-deploy                   │
│ ├─ CodeBuild: configuration/buildspec-backend-websocket.yml    │
│ ├─ Build: Maven build Spring Boot                              │
│ ├─ Docker: Build & push to ECR                                 │
│ └─ Deploy: Update ECS backend service (zero-downtime)          │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ Branch: runner-java-deploy                                     │
│ ├─ Trigger: Push to runner-java-deploy                         │
│ ├─ CodeBuild: configuration/buildspec-runner-java.yml          │
│ ├─ Build: TypeScript compilation + Docker                      │
│ ├─ Docker: Build & push to ECR                                 │
│ └─ Deploy: Update ECS java runner service                      │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ Branch: runner-cpp-deploy                                      │
│ ├─ Trigger: Push to runner-cpp-deploy                          │
│ ├─ CodeBuild: configuration/buildspec-runner-cpp.yml           │
│ ├─ Build: TypeScript compilation + Docker                      │
│ ├─ Docker: Build & push to ECR                                 │
│ └─ Deploy: Update ECS cpp runner service                       │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ Branch: runner-python-deploy                                   │
│ ├─ Trigger: Push to runner-python-deploy                       │
│ ├─ CodeBuild: configuration/buildspec-runner-python.yml        │
│ ├─ Build: TypeScript compilation + Docker                      │
│ ├─ Docker: Build & push to ECR                                 │
│ └─ Deploy: Update ECS python runner service                    │
└────────────────────────────────────────────────────────────────┘
```

## Security

### Code Execution
- Isolated Docker containers with no network access
- Resource limits: 512MB RAM, 0.25 vCPU, 10-second timeout
- Container lifecycle management (auto-cleanup)

### Network Security
- VPC with public and private subnets
- Runner containers in private subnets (no direct internet)
- Security groups with least privilege access
- HTTPS/WSS only for public endpoints

### Application Security
- Input validation and sanitization
- Rate limiting: 10 executions/minute per user (enforced via Valkey)
- WebSocket authentication with session tokens
- CORS configuration for allowed origins
- IAM roles with minimal permissions

## Performance

### Latency Metrics
- **WebSocket Connection**: < 100ms (initial handshake)
- **WebSocket Message Latency**: < 50ms (roundtrip)
- **Code Submission to Queue**: < 100ms
- **Queue to Runner Pickup**: < 200ms (average)
- **Compilation Time** (language-dependent):
  - Python: ~50ms (interpreted)
  - Java: 1-3 seconds (compilation + execution)
  - C++: 1-2 seconds (compilation + execution)
- **Output Streaming Latency**: < 50ms (Valkey pub/sub)
- **Total Time to First Output**: 
  - Python: ~500ms
  - Java: 2-4 seconds
  - C++: 2-3 seconds

### Throughput
- **Concurrent WebSocket Connections**: 5,000+ (with horizontal scaling)
- **Backend Auto-scaling**: 3-15 containers
  - Scale-out trigger: > 300 concurrent connections per container
  - Scale-in trigger: < 150 concurrent connections per container
- **Runner Auto-scaling** (per language): 1-10 containers
  - Scale-out trigger: SQS queue depth > 10 messages
  - Scale-in trigger: SQS queue depth < 2 messages
- **Queue Processing Rate**: 50-100 jobs/second per language
- **Peak Concurrent Executions**: 500+ simultaneous code executions
- **Message Processing**: 
  - SQS Polling: Long polling (20-second intervals)
  - Batch size: 1 message per poll (FIFO ordering)

### Scalability
- **Horizontal Scaling**:
  - Backend scales based on active WebSocket connections
  - Runners scale based on queue depth
  - Valkey cluster mode for high-throughput pub/sub
- **Session Management**: 
  - Distributed sessions via Valkey (no sticky backend required)
  - Enables true stateless backend scaling

### Resource Utilization
- **Backend**: 
  - Memory: 1GB per container (average 60% utilization)
  - CPU: 0.5 vCPU per container (average 40% utilization)
- **Runners**: 
  - Memory: 0.5GB per container 
  - CPU: 0.25 vCPU per container
- **Valkey**: 
  - Pub/Sub throughput: 100,000+ messages/second

### Optimization Techniques
- **Connection Pooling**: 
  - SQS long polling for reduced API calls
- **Caching**: 
  - Docker image layers cached on ECS hosts
- **Efficient Data Structures**: 
  - Streaming output (no buffering in memory)
  - Chunked message delivery via WebSocket
- **Load Balancing**: 
  - ALB distributes traffic evenly
  - Cross-zone load balancing enabled

## Monitoring & Logging

### CloudWatch Logs
- **Log Groups**:
  - `/ecs/frontend` - Frontend container logs
  - `/ecs/backend` - Backend application logs
  - `/ecs/runner-java` - Java runner logs
  - `/ecs/runner-cpp` - C++ runner logs
  - `/ecs/runner-python` - Python runner logs

### CloudWatch Metrics
- **Custom Metrics**:
  - `ExecutionTime` - Code execution duration by language
  - `QueueDepth` - SQS messages waiting per queue

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes following our coding standards
4. Write/update tests for your changes
5. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
6. Push to the branch (`git push origin feature/AmazingFeature`)
7. Open a Pull Request targeting the appropriate deployment branch

### Development Guidelines
- **Documentation**: Update README and inline comments
- **Commit Messages**: Follow Conventional Commits specification
- **CI/CD**: Ensure all pipelines pass before merging

### Deployment Branches
- `frontend-deploy` - Frontend changes
- `backend-websocket-deploy` - Backend changes
- `runner-java-deploy` - Java runner changes
- `runner-cpp-deploy` - C++ runner changes
- `runner-python-deploy` - Python runner changes

## Author

**Kallol Khatua**

- GitHub: [@kallol-khatua](https://github.com/kallol-khatua)
- LinkedIn: [kallol-khatua](https://www.linkedin.com/in/kallol-khatua/)
- Website: [cloudcompiler.live](https://cloudcompiler.live/)

## Acknowledgments

- **Spring Boot Team** - Excellent WebSocket and STOMP support
- **AWS** - Reliable and scalable cloud infrastructure
- **Valkey Community** - High-performance Redis fork for caching and pub/sub
- **Docker Community** - Containerization and isolation best practices
- **React & TypeScript Communities** - Modern web development tools
- **Open Source Contributors** - Libraries and tools that made this possible

## Support

For issues, questions, or feature requests:

- **Bug Reports**: [GitHub Issues](https://github.com/kallol-khatua/cloudcompiler.live/issues)
- **Discussions**: [GitHub Discussions](https://github.com/kallol-khatua/cloudcompiler.live/discussions)
- **Documentation**: [docs.cloudcompiler.live](https://docs.cloudcompiler.live) (if available)
- **Contact**: Open an issue or reach out via LinkedIn

## Roadmap

### Completed 
- [x] Multi-language support (Java, C++, Python)
- [x] Real-time output streaming with WebSocket
- [x] Interactive input support via node-pty
- [x] Horizontal scaling with ElastiCache Valkey
- [x] Language-specific SQS queues
- [x] Branch-specific CI/CD pipelines
- [x] Docker-based code isolation
- [x] AWS cloud deployment with ECS

### In Progress
- [ ] Additional language support (Go, Rust, JavaScript/Node.js)
- [ ] Code sharing functionality with unique URLs
- [ ] User authentication and saved code snippets
- [ ] Syntax themes (dark/light mode)

### Planned 
- [ ] Collaborative real-time coding 
- [ ] Code snippet library and templates
- [ ] Project workspaces (multiple files)
- [ ] GitHub integration for code imports
- [ ] Version control and history
- [ ] API for third-party integrations
- [ ] Code execution analytics dashboard
- [ ] Custom time and memory limits (premium)
- [ ] Private execution environments
- [ ] Webhook notifications for job completion
- [ ] Plugin system for custom languages/tools

### Future Enhancements
- [ ] AI-powered code suggestions
- [ ] Automated testing framework integration
- [ ] Code quality analysis and linting
- [ ] Performance profiling tools
- [ ] Container resource monitoring in real-time
- [ ] Multi-region deployment for lower latency
- [ ] CDN integration for faster asset delivery

## Project Statistics

- **Total Lines of Code**: ~15,000+
- **Languages**: TypeScript, Java, Python, C++
- **Containers**: 5+ microservices
- **AWS Services**: 10+ integrated services
- **Deployment Time**: ~5 minutes per service
- **Average Response Time**: < 2 seconds
- **Uptime**: 99.9%+ (target)

## Key Technical Achievements

1. **Sub-50ms WebSocket Latency** - Achieved through optimized Valkey pub/sub and efficient message routing
2. **Horizontal Scalability** - Stateless backend design with distributed sessions enabling unlimited scaling
3. **Language-Specific Optimization** - Dedicated runners with language-specific optimizations and caching
4. **Zero-Downtime Deployments** - Blue-green deployment strategy with health checks and gradual traffic shifting
5. **Real-Time Interactivity** - Full bidirectional communication with stdin/stdout support via node-pty

---

⭐ **Star this repository if you find it helpful!**

**Interested in contributing or have questions? Let's connect on [LinkedIn](https://www.linkedin.com/in/kallol-khatua/)!**

**Built with** ❤️ **using React, TypeScript, Spring Boot, Docker, AWS, and Valkey**

---

## Use Cases

- **Learning & Education**: Students learning programming languages
- **Technical Interviews**: Quick code testing during interviews
- **Code Sharing**: Share code snippets with colleagues
- **Quick Prototyping**: Test algorithms and logic quickly
- **Teaching**: Instructors demonstrating code concepts
- **Code Review**: Test code snippets during reviews

---

**© 2025 Kallol Khatua. All rights reserved.**