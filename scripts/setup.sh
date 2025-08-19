#!/bin/bash

# Course Compass MERN Stack Setup Script
# This script helps set up the development environment

set -e

echo "🚀 Course Compass MERN Stack Setup"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if command -v docker &> /dev/null; then
        print_success "Docker is installed"
        return 0
    else
        print_error "Docker is not installed. Please install Docker first."
        return 1
    fi
}

# Check if Docker Compose is installed
check_docker_compose() {
    if command -v docker-compose &> /dev/null; then
        print_success "Docker Compose is installed"
        return 0
    else
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        return 1
    fi
}

# Check if Node.js is installed
check_node() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js is installed: $NODE_VERSION"
        return 0
    else
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        return 1
    fi
}

# Setup environment variables
setup_env() {
    print_status "Setting up environment variables..."
    
    if [ ! -f "backend/.env" ]; then
        cp backend/env.example backend/.env
        print_success "Created backend/.env file"
        print_warning "Please edit backend/.env with your configuration"
    else
        print_status "backend/.env already exists"
    fi
}

# Install frontend dependencies
install_frontend_deps() {
    print_status "Installing frontend dependencies..."
    
    if [ ! -d "node_modules" ]; then
        npm install
        print_success "Frontend dependencies installed"
    else
        print_status "Frontend dependencies already installed"
    fi
}

# Install backend dependencies
install_backend_deps() {
    print_status "Installing backend dependencies..."
    
    if [ ! -d "backend/node_modules" ]; then
        cd backend
        npm install
        cd ..
        print_success "Backend dependencies installed"
    else
        print_status "Backend dependencies already installed"
    fi
}

# Start services with Docker
start_docker_services() {
    print_status "Starting services with Docker Compose..."
    
    if docker-compose up -d; then
        print_success "Services started successfully"
        echo ""
        echo "🌐 Application URLs:"
        echo "   Frontend: http://localhost:3000"
        echo "   Backend API: http://localhost:5000"
        echo "   Admin Dashboard: http://localhost:3000/admin/login"
        echo ""
        echo "📊 Service Status:"
        docker-compose ps
    else
        print_error "Failed to start services"
        exit 1
    fi
}

# Start services locally
start_local_services() {
    print_status "Starting services locally..."
    
    print_warning "Make sure MongoDB and Redis are running on your system"
    print_warning "MongoDB should be running on port 27017"
    print_warning "Redis should be running on port 6379"
    
    echo ""
    echo "To start the backend:"
    echo "  cd backend && npm run dev"
    echo ""
    echo "To start the frontend (in another terminal):"
    echo "  npm run dev"
}

# Main setup function
main() {
    echo ""
    print_status "Checking prerequisites..."
    
    # Check Docker and Docker Compose
    if check_docker && check_docker_compose; then
        DOCKER_AVAILABLE=true
    else
        DOCKER_AVAILABLE=false
    fi
    
    # Check Node.js
    if ! check_node; then
        print_error "Node.js is required for local development"
        exit 1
    fi
    
    echo ""
    print_status "Setting up project..."
    
    # Setup environment
    setup_env
    
    # Install dependencies
    install_frontend_deps
    install_backend_deps
    
    echo ""
    print_status "Setup completed!"
    echo ""
    
    # Ask user for deployment method
    if [ "$DOCKER_AVAILABLE" = true ]; then
        echo "Choose deployment method:"
        echo "1) Docker (recommended)"
        echo "2) Local development"
        echo ""
        read -p "Enter your choice (1 or 2): " choice
        
        case $choice in
            1)
                start_docker_services
                ;;
            2)
                start_local_services
                ;;
            *)
                print_error "Invalid choice"
                exit 1
                ;;
        esac
    else
        print_warning "Docker not available, using local development"
        start_local_services
    fi
    
    echo ""
    print_success "Setup completed successfully!"
    echo ""
    echo "📚 Next steps:"
    echo "1. Edit backend/.env with your configuration"
    echo "2. Access the application at the URLs shown above"
    echo "3. Create an admin account at /admin/login"
    echo "4. Upload course data via the admin dashboard"
    echo ""
    echo "📖 Documentation:"
    echo "   - README.md: General project information"
    echo "   - docs/DEVOPS.md: DevOps and deployment guide"
    echo ""
}

# Run main function
main "$@"
