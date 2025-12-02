.PHONY: help build up down logs clean install test health

# Default target
help:
	@echo "🔭 OpenTelemetry Demo - Available Commands"
	@echo ""
	@echo "  make build      - Build all Docker images"
	@echo "  make up         - Start all services (with build)"
	@echo "  make down       - Stop all services"
	@echo "  make logs       - View all service logs"
	@echo "  make clean      - Stop services and remove volumes"
	@echo "  make install    - Install dependencies locally (for development)"
	@echo "  make test       - Test the demo endpoints"
	@echo "  make health     - Check service health"
	@echo ""

# Build Docker images
build:
	@echo "🏗️  Building Docker images..."
	docker-compose build

# Start all services
up:
	@echo "🚀 Starting all services..."
	docker-compose up --build -d
	@echo ""
	@echo "✅ Services started!"
	@echo ""
	@echo "📱 Frontend:  http://localhost:5173"
	@echo "🖥️  Backend:   http://localhost:4000"
	@echo "📊 Collector: http://localhost:4318 (OTLP HTTP)"
	@echo "🏥 Health:    http://localhost:13133"
	@echo ""
	@echo "💡 View logs: make logs"
	@echo "🛑 Stop:      make down"

# Stop all services
down:
	@echo "🛑 Stopping all services..."
	docker-compose down

# View logs
logs:
	docker-compose logs -f

# Clean everything
clean:
	@echo "🧹 Cleaning up..."
	docker-compose down -v
	@echo "✅ Cleanup complete"

# Install dependencies locally (for development)
install:
	@echo "📦 Installing backend dependencies..."
	cd backend && npm install
	@echo "📦 Installing frontend dependencies..."
	cd frontend && npm install
	@echo "✅ Dependencies installed"

# Test the demo
test:
	@echo "🧪 Testing demo endpoints..."
	@echo ""
	@echo "Testing backend health..."
	@curl -s http://localhost:4000/health | jq . || echo "❌ Backend not responding"
	@echo ""
	@echo "Testing backend data endpoint..."
	@curl -s http://localhost:4000/api/data | jq . || echo "❌ Backend not responding"
	@echo ""
	@echo "Testing backend slow endpoint..."
	@curl -s http://localhost:4000/api/slow | jq . || echo "❌ Backend not responding"
	@echo ""
	@echo "Testing backend error endpoint..."
	@curl -s http://localhost:4000/api/error | jq . || echo "✅ Error endpoint working (expected 500)"
	@echo ""

# Check service health
health:
	@echo "🏥 Checking service health..."
	@echo ""
	@echo "Backend:"
	@curl -s http://localhost:4000/health || echo "❌ Backend not healthy"
	@echo ""
	@echo ""
	@echo "Collector:"
	@curl -s http://localhost:13133/ || echo "❌ Collector not healthy"
	@echo ""
	@echo ""
	@echo "Frontend:"
	@curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 | grep -q "200" && echo "✅ Frontend healthy" || echo "❌ Frontend not healthy"
	@echo ""

