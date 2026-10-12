#!/bin/bash
# ════════════════════════════════════════════════════════════════════════════════
#  Tradelect  –  One-command Cloud Deployment Script
#  Usage:  chmod +x deploy.sh && ./deploy.sh
# ════════════════════════════════════════════════════════════════════════════════

set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

log()  { echo -e "${GREEN}[✔] $1${NC}"; }
warn() { echo -e "${YELLOW}[!] $1${NC}"; }
err()  { echo -e "${RED}[✗] $1${NC}"; exit 1; }
info() { echo -e "${BLUE}[→] $1${NC}"; }

echo ""
echo "  ████████╗██████╗  █████╗ ██████╗ ███████╗██╗     ███████╗ ██████╗████████╗"
echo "     ██╔══╝██╔══██╗██╔══██╗██╔══██╗██╔════╝██║     ██╔════╝██╔════╝╚══██╔══╝"
echo "     ██║   ██████╔╝███████║██║  ██║█████╗  ██║     █████╗  ██║        ██║   "
echo "     ██║   ██╔══██╗██╔══██║██║  ██║██╔══╝  ██║     ██╔══╝  ██║        ██║   "
echo "     ██║   ██║  ██║██║  ██║██████╔╝███████╗███████╗███████╗╚██████╗   ██║   "
echo "     ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚══════╝╚══════╝ ╚═════╝   ╚═╝  "
echo ""
echo "  Cloud Deployment Script  |  $(date)"
echo ""

# ── Step 1: Check prerequisites ───────────────────────────────────────────────
info "Checking prerequisites..."
command -v docker  >/dev/null 2>&1 || err "Docker not found. Install from https://docs.docker.com/engine/install/"
command -v docker-compose >/dev/null 2>&1 || command -v docker compose >/dev/null 2>&1 || err "docker-compose not found."
command -v node >/dev/null 2>&1 || err "Node.js not found. Install Node 18+."
log "Prerequisites OK"

# ── Step 2: Check .env file ───────────────────────────────────────────────────
info "Checking .env file..."
if [ ! -f .env ]; then
  warn ".env not found - copying from .env.example"
  cp .env.example .env
  warn "Please edit .env with your real values, then re-run this script."
  echo ""
  echo "  Minimum required changes in .env:"
  echo "    MYSQL_ROOT_PASSWORD  - set a strong password"
  echo "    JWT_SECRET           - set a random 64-char string"
  echo "    ADMIN_INVITE_KEY     - change from default"
  echo "    FRONTEND_URL         - your server IP or domain"
  echo "    MAIL_USERNAME        - your SMTP email"
  echo "    MAIL_PASSWORD        - your SMTP password"
  echo ""
  exit 1
fi
log ".env file found"

# ── Step 3: Build frontend ────────────────────────────────────────────────────
info "Building React frontend..."
cd frontend
if [ ! -f .env.production ]; then
  warn ".env.production not found in frontend/ - using defaults"
fi
npm ci --silent
npm run build
log "Frontend build complete → frontend/build/"
cd ..

# ── Step 4: Pull base Docker images ──────────────────────────────────────────
info "Pulling latest base Docker images..."
docker pull mysql:8.0 --quiet
docker pull redis:7-alpine --quiet
docker pull confluentinc/cp-zookeeper:7.4.0 --quiet
docker pull confluentinc/cp-kafka:7.4.0 --quiet
log "Base images ready"

# ── Step 5: Build application images ─────────────────────────────────────────
info "Building application Docker images (this takes 3-5 minutes first time)..."
docker-compose build --parallel
log "All application images built"

# ── Step 6: Start infrastructure first ───────────────────────────────────────
info "Starting infrastructure (MySQL, Redis, Kafka, Zookeeper)..."
docker-compose up -d mysql redis zookeeper kafka
info "Waiting for MySQL to be ready..."
until docker exec tradelect-mysql mysqladmin ping -h localhost -u root -p"$(grep MYSQL_ROOT_PASSWORD .env | cut -d= -f2)" --silent 2>/dev/null; do
  sleep 2
  printf "."
done
echo ""
log "MySQL is ready"

# ── Step 7: Start Eureka ──────────────────────────────────────────────────────
info "Starting Eureka service registry..."
docker-compose up -d eureka-server
info "Waiting for Eureka..."
until curl -sf http://localhost:8761/actuator/health | grep -q '"UP"' 2>/dev/null; do
  sleep 3
  printf "."
done
echo ""
log "Eureka is UP"

# ── Step 8: Start all application services ───────────────────────────────────
info "Starting all application services..."
docker-compose up -d auth-service product-service order-service user-service notification-service
sleep 10

# ── Step 9: Start gateway + nginx ────────────────────────────────────────────
info "Starting API Gateway and Nginx..."
docker-compose up -d api-gateway nginx

# ── Step 10: Start monitoring ─────────────────────────────────────────────────
info "Starting Prometheus + Grafana..."
docker-compose up -d prometheus grafana

# ── Step 11: Health checks ────────────────────────────────────────────────────
info "Running health checks..."
sleep 15

SERVICES=(
  "Nginx/Frontend:http://localhost:80/health"
  "API Gateway:http://localhost:8080/actuator/health"
  "Auth Service:http://localhost:8081/actuator/health"
  "Product Service:http://localhost:8082/actuator/health"
  "Order Service:http://localhost:8083/actuator/health"
  "User Service:http://localhost:8084/actuator/health"
  "Notification Svc:http://localhost:8085/actuator/health"
  "Eureka:http://localhost:8761/actuator/health"
  "Grafana:http://localhost:3001/api/health"
)

ALL_OK=true
for SVC in "${SERVICES[@]}"; do
  NAME="${SVC%%:*}"
  URL="${SVC#*:}"
  if curl -sf "$URL" >/dev/null 2>&1; then
    log "$NAME → UP"
  else
    warn "$NAME → not responding yet (may still be starting)"
    ALL_OK=false
  fi
done

echo ""
echo "════════════════════════════════════════════════════"
if [ "$ALL_OK" = true ]; then
  log "ALL SERVICES HEALTHY — Tradelect is live!"
else
  warn "Some services still starting. Run: docker-compose ps"
fi
echo ""
SERVER_IP=$(curl -sf https://ipinfo.io/ip 2>/dev/null || echo "YOUR_SERVER_IP")
echo "  🌐  Frontend    →  http://${SERVER_IP}"
echo "  🔌  API         →  http://${SERVER_IP}:8080"
echo "  🔐  Admin Panel →  http://${SERVER_IP}/admin/login"
echo "  📊  Grafana     →  http://${SERVER_IP}:3001  (admin / your password)"
echo "  🔍  Eureka      →  http://${SERVER_IP}:8761"
echo ""
echo "  To watch logs:   docker-compose logs -f"
echo "  To stop:         docker-compose down"
echo "  To restart:      docker-compose restart"
echo "════════════════════════════════════════════════════"
