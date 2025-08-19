# Course Compass - MERN Stack Application

A comprehensive course discovery and recommendation platform built with the MERN stack (MongoDB, Express.js, React/Next.js, Node.js) with AI-powered course recommendations.

## 🚀 Features

### Backend Features
- **User Authentication**: Secure admin authentication with JWT tokens
- **Course Management**: Full CRUD operations for course data
- **CSV Upload**: Bulk course data import via CSV files
- **AI Integration**: Gemini AI-powered course recommendations
- **Redis Caching**: High-performance caching for course data and search results
- **Advanced Search**: Full-text search with multiple filters
- **API Security**: Rate limiting, CORS, and input validation

### Frontend Features
- **Modern UI**: Beautiful, responsive design with Tailwind CSS
- **State Management**: React Context API for global state
- **Client-side Caching**: Local storage for improved performance
- **Real-time Search**: Instant search with debouncing
- **Admin Dashboard**: Comprehensive admin interface
- **Course Recommendations**: AI-powered course suggestions

### DevOps Features
- **Docker Support**: Complete containerization
- **CI/CD Pipeline**: GitHub Actions for automated deployment
- **Nginx Reverse Proxy**: Production-ready web server configuration
- **Health Checks**: Application monitoring and health endpoints

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Redis** - In-memory caching
- **JWT** - Authentication
- **Multer** - File upload handling
- **Joi** - Input validation
- **Helmet** - Security middleware

### Frontend
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Radix UI** - Component library
- **React Hook Form** - Form handling
- **Zustand** - State management

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy
- **GitHub Actions** - CI/CD pipeline

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB 7.0+
- Redis 7.0+
- Docker & Docker Compose (optional)

## 🚀 Quick Start

### Option 1: Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd course-compass
   ```

2. **Set up environment variables**
   ```bash
   cp backend/env.example backend/.env
   # Edit backend/.env with your configuration
   ```

3. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Admin Dashboard: http://localhost:3000/admin/login

### Option 2: Local Development

1. **Install dependencies**
   ```bash
   # Frontend dependencies
   npm install
   
   # Backend dependencies
   cd backend
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp backend/env.example backend/.env
   # Edit backend/.env with your configuration
   ```

3. **Start MongoDB and Redis**
   ```bash
   # Start MongoDB (make sure it's running on port 27017)
   # Start Redis (make sure it's running on port 6379)
   ```

4. **Start the backend**
   ```bash
   cd backend
   npm run dev
   ```

5. **Start the frontend**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
course-compass/
├── src/                    # Frontend source code
│   ├── app/               # Next.js app directory
│   ├── components/        # React components
│   ├── contexts/          # React contexts
│   ├── lib/               # Utilities and API client
│   └── hooks/             # Custom React hooks
├── backend/               # Backend source code
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   ├── utils/             # Utility functions
│   └── uploads/           # File upload directory
├── nginx/                 # Nginx configuration
├── docker-compose.yml     # Docker Compose configuration
├── Dockerfile             # Frontend Dockerfile
└── README.md             # This file
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/course_compass

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key-here

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/signup` - Register new admin
- `POST /api/auth/login` - Admin login
- `GET /api/auth/me` - Get current admin profile
- `POST /api/auth/logout` - Admin logout

### Course Endpoints

- `GET /api/courses` - Get courses with filters
- `GET /api/courses/:id` - Get course by ID
- `POST /api/courses/upload` - Upload CSV file
- `GET /api/courses/stats/summary` - Get course statistics

### Recommendation Endpoints

- `POST /api/recommendations` - Get AI recommendations
- `GET /api/recommendations/popular` - Get popular courses
- `GET /api/recommendations/topics` - Get available topics

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Joi schema validation
- **CORS Protection**: Cross-origin resource sharing configuration
- **Security Headers**: Helmet.js for security headers

## 🚀 Deployment

### Production Deployment

1. **Build Docker images**
   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```

2. **Deploy with Docker Compose**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### CI/CD Pipeline

The project includes a GitHub Actions workflow that:
- Runs tests and linting
- Performs security scans
- Builds Docker images
- Deploys to staging/production environments

## 📊 Performance Features

- **Redis Caching**: Reduces database load
- **Client-side Caching**: Improves user experience
- **Database Indexing**: Optimized MongoDB queries
- **Compression**: Gzip compression for responses
- **CDN Ready**: Static asset optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team

## 🔄 Changelog

### Version 1.0.0
- Initial release
- Complete MERN stack implementation
- AI-powered recommendations
- Admin dashboard
- Docker support
- CI/CD pipeline

---

**Note**: This is a technical assessment project demonstrating MERN stack proficiency with advanced features like AI integration, caching, and DevOps practices.
