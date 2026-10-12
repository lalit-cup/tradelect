#!/bin/bash
# Tradelect Development Startup Script

echo "=========================================="
echo "  TRADELECT - Full Stack Development"
echo "=========================================="

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

check_cmd() { command -v $1 &>/dev/null && echo -e "  ${GREEN}✓${NC} $1" || echo -e "  ${RED}✗${NC} $1 (not found)"; }

echo -e "\n${YELLOW}Checking prerequisites...${NC}"
check_cmd java; check_cmd mvn; check_cmd node; check_cmd npm; check_cmd docker

echo -e "\n${YELLOW}Step 1: Starting infrastructure (MySQL, Redis, Kafka, Prometheus, Grafana)...${NC}"
docker-compose up -d mysql redis zookeeper kafka prometheus grafana
echo "Waiting 20s for services to initialize..."
sleep 20

echo -e "\n${YELLOW}Step 2: Building backend...${NC}"
cd backend
mvn clean install -DskipTests -q && echo -e "  ${GREEN}✓ Build successful${NC}" || { echo -e "  ${RED}✗ Build failed${NC}"; exit 1; }

echo -e "\n${YELLOW}Step 3: Starting microservices...${NC}"
start_svc() {
  local name=$1; local dir=$2
  cd $dir && mvn spring-boot:run > /tmp/tradelect-$name.log 2>&1 &
  echo -e "  ${GREEN}✓${NC} $name started (PID: $!, log: /tmp/tradelect-$name.log)"
  cd ..
}

start_svc "eureka-server"       "eureka-server"
echo "  Waiting 10s for Eureka to register..."; sleep 10
start_svc "api-gateway"         "api-gateway"
start_svc "auth-service"        "auth-service"
start_svc "product-service"     "product-service"
start_svc "order-service"       "order-service"
start_svc "user-service"        "user-service"
start_svc "notification-service" "notification-service"

echo -e "\n${YELLOW}Step 4: Starting React frontend...${NC}"
cd ../frontend
npm install -q && npm start > /tmp/tradelect-frontend.log 2>&1 &
echo -e "  ${GREEN}✓${NC} Frontend starting (log: /tmp/tradelect-frontend.log)"

echo -e "\n${GREEN}=========================================="
echo "  All services started!"
echo ""
echo "  Frontend:   http://localhost:3000"
echo "  Admin:      http://localhost:3000/admin/login"
echo "  API GW:     http://localhost:8080"
echo "  Eureka:     http://localhost:8761"
echo "  Prometheus: http://localhost:9090"
echo "  Grafana:    http://localhost:3001  (admin / tradelect123)"
echo "==========================================${NC}"
echo ""
echo -e "${YELLOW}To stop all services:${NC} kill \$(lsof -t -i:3000,8080,8081,8082,8083,8084,8085,8761)"
echo -e "${YELLOW}To stop Docker:${NC}      docker-compose down"
