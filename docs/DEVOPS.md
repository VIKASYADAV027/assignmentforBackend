# DevOps Documentation - Course Compass

This document outlines the DevOps practices, CI/CD pipeline, and deployment strategies for the Course Compass MERN stack application.

## 🏗️ CI/CD Pipeline Overview

### Pipeline Stages

1. **Code Commit** → **Build** → **Test** → **Security Scan** → **Deploy**

### Tools Used

- **GitHub Actions**: CI/CD automation
- **Docker**: Containerization
- **Nginx**: Reverse proxy and load balancing
- **PM2**: Process management (for non-containerized deployments)
- **MongoDB Atlas**: Cloud database (production)
- **Redis Cloud**: Cloud caching (production)

## 🔄 CI/CD Pipeline Details

### GitHub Actions Workflow

The CI/CD pipeline is defined in `.github/workflows/ci-cd.yml` and includes:

#### 1. Test Stage
- **Code Quality**: ESLint, TypeScript checking
- **Unit Tests**: Jest for backend testing
- **Integration Tests**: API endpoint testing
- **Database Tests**: MongoDB integration tests

#### 2. Security Stage
- **Dependency Audit**: npm audit for vulnerabilities
- **Snyk Security Scan**: Advanced security scanning
- **Code Quality**: SonarQube integration (optional)

#### 3. Build Stage
- **Docker Image Building**: Multi-stage builds
- **Image Tagging**: Semantic versioning
- **Registry Push**: GitHub Container Registry

#### 4. Deploy Stage
- **Staging Deployment**: Automatic deployment to staging
- **Production Deployment**: Manual approval required
- **Health Checks**: Application monitoring

## 🐳 Docker Configuration

### Multi-Stage Build Strategy

```dockerfile
# Base stage for dependencies
FROM node:18-alpine AS base

# Builder stage for frontend
FROM node:18-alpine AS frontend-builder

# Production stage
FROM node:18-alpine AS production
```

### Docker Compose Services

```yaml
services:
  mongodb:     # Database
  redis:       # Caching
  backend:     # API server
  frontend:    # Next.js app
  nginx:       # Reverse proxy
```

### Production Optimizations

- **Alpine Linux**: Minimal base images
- **Non-root Users**: Security best practices
- **Health Checks**: Container monitoring
- **Volume Mounts**: Persistent data storage

## 🌐 Nginx Configuration

### Reverse Proxy Setup

```nginx
upstream frontend {
    server frontend:3000;
}

upstream backend {
    server backend:5000;
}
```

### Security Headers

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
```

### Rate Limiting

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=general:10m rate=30r/s;
```

## 🚀 Deployment Strategies

### 1. Docker Deployment

#### Local Development
```bash
docker-compose up -d
```

#### Production Deployment
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 2. Linux Server Deployment

#### Prerequisites
- Ubuntu 20.04+ or CentOS 8+
- Docker & Docker Compose
- Nginx
- PM2 (for Node.js process management)

#### Deployment Steps

1. **Server Setup**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **Application Deployment**
   ```bash
   # Clone repository
   git clone <repository-url>
   cd course-compass
   
   # Set environment variables
   cp backend/env.example backend/.env
   nano backend/.env
   
   # Start services
   docker-compose up -d
   ```

3. **Nginx Configuration**
   ```bash
   # Copy nginx config
   sudo cp nginx/nginx.conf /etc/nginx/nginx.conf
   
   # Test configuration
   sudo nginx -t
   
   # Restart nginx
   sudo systemctl restart nginx
   ```

### 3. PM2 Process Management

For non-containerized deployments:

```bash
# Install PM2
npm install -g pm2

# Start backend
cd backend
pm2 start server.js --name "course-compass-backend"

# Start frontend
cd ..
pm2 start npm --name "course-compass-frontend" -- run start

# Save PM2 configuration
pm2 save
pm2 startup
```

## 🔧 Environment Management

### Environment Variables

#### Development
```env
NODE_ENV=development
MONGODB_URI= hse your uri
REDIS_URL=redis://localhost:6379
```

#### Production
```env
NODE_ENV=production
MONGODB_URI= use your uri here
REDIS_URL=redis://user:pass@redis-server:6379
JWT_SECRET= create a super-secret-production-key
```

### Secrets Management

- **GitHub Secrets**: For CI/CD pipeline
- **Environment Files**: For local development
- **Cloud Secrets**: For production deployments

## 📊 Monitoring and Logging

### Application Monitoring

1. **Health Checks**
   ```javascript
   app.get('/health', (req, res) => {
     res.status(200).json({ 
       status: 'OK', 
       timestamp: new Date().toISOString() 
     });
   });
   ```

2. **Logging Strategy**
   - **Morgan**: HTTP request logging
   - **Winston**: Application logging
   - **Error Tracking**: Sentry integration

3. **Performance Monitoring**
   - **Redis Monitoring**: Cache hit/miss ratios
   - **Database Monitoring**: Query performance
   - **API Response Times**: Endpoint performance

### Infrastructure Monitoring

- **Docker Stats**: Container resource usage
- **System Metrics**: CPU, memory, disk usage
- **Network Monitoring**: Traffic and bandwidth

## 🔒 Security Considerations

### Container Security

1. **Image Security**
   - Use official base images
   - Regular security updates
   - Vulnerability scanning

2. **Runtime Security**
   - Non-root users
   - Read-only filesystems
   - Resource limits

### Network Security

1. **Firewall Configuration**
   ```bash
   # Allow only necessary ports
   sudo ufw allow 22    # SSH
   sudo ufw allow 80    # HTTP
   sudo ufw allow 443   # HTTPS
   sudo ufw enable
   ```

2. **SSL/TLS Configuration**
   ```nginx
   ssl_certificate /etc/nginx/ssl/cert.pem;
   ssl_certificate_key /etc/nginx/ssl/key.pem;
   ssl_protocols TLSv1.2 TLSv1.3;
   ```

## 🔄 Backup and Recovery

### Database Backup

```bash
# MongoDB backup
mongodump --uri="mongodb://localhost:27017/course_compass" --out=/backup

# Redis backup
redis-cli BGSAVE
```

### Application Backup

```bash
# Docker volumes backup
docker run --rm -v course_compass_mongodb_data:/data -v $(pwd):/backup alpine tar czf /backup/mongodb_backup.tar.gz -C /data .
```

## 🚀 Scaling Strategies

### Horizontal Scaling

1. **Load Balancer Setup**
   ```nginx
   upstream backend {
       server backend1:5000;
       server backend2:5000;
       server backend3:5000;
   }
   ```

2. **Database Scaling**
   - MongoDB replica sets
   - Redis clustering
   - Read replicas

### Vertical Scaling

- **Resource Allocation**: Increase CPU/memory
- **Optimization**: Code and query optimization
- **Caching**: Redis and CDN implementation

## 🔄 Kafka Integration (Conceptual)

### Use Cases for Apache Kafka

1. **Event-Driven Architecture**
   ```javascript
   // Course creation event
   {
     event: 'course.created',
     data: { courseId, universityId, timestamp },
     metadata: { userId, source }
   }
   ```

2. **Asynchronous Processing**
   - CSV upload processing
   - Email notifications
   - Analytics data processing

3. **Microservices Communication**
   - Course service → Notification service
   - User service → Analytics service
   - Payment service → Course enrollment

### Kafka Implementation Example

```javascript
// Producer
const producer = kafka.producer();
await producer.send({
  topic: 'course-events',
  messages: [{ value: JSON.stringify(event) }]
});

// Consumer
const consumer = kafka.consumer({ groupId: 'course-processors' });
await consumer.subscribe({ topic: 'course-events' });
```

## 📈 Performance Optimization

### Frontend Optimization

1. **Next.js Optimizations**
   - Static generation
   - Image optimization
   - Code splitting

2. **Caching Strategies**
   - Browser caching
   - CDN caching
   - Service worker caching

### Backend Optimization

1. **Database Optimization**
   - Indexing strategies
   - Query optimization
   - Connection pooling

2. **API Optimization**
   - Response compression
   - Pagination
   - Rate limiting

## 🛠️ Troubleshooting

### Common Issues

1. **Container Issues**
   ```bash
   # Check container logs
   docker logs <container-name>
   
   # Check container status
   docker ps -a
   ```

2. **Database Issues**
   ```bash
   # Check MongoDB status
   mongosh --eval "db.adminCommand('ping')"
   
   # Check Redis status
   redis-cli ping
   ```

3. **Network Issues**
   ```bash
   # Check port availability
   netstat -tulpn | grep :5000
   
   # Check firewall status
   sudo ufw status
   ```

### Debug Commands

```bash
# System resources
htop
df -h
free -h

# Docker resources
docker stats
docker system df

# Application logs
docker-compose logs -f
```

## 📚 Additional Resources

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)
- [MongoDB Production Notes](https://docs.mongodb.com/manual/core/security-checklist/)
- [Redis Security](https://redis.io/topics/security)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

This DevOps documentation provides a comprehensive guide for deploying, monitoring, and maintaining the Course Compass application in production environments.
