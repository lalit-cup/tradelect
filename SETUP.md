# Tradelect — Complete Setup Guide

## Architecture Overview

```
React Frontend (3000)
       │
   API Gateway (8080)  ←── Eureka Registry (8761)
       │
 ┌─────┴──────────────────────────────────────────┐
 │           Microservices                         │
 ├─ Auth Service        (8081)  ← MySQL + Redis    │
 ├─ Product Service     (8082)  ← MySQL + Kafka    │
 ├─ Order Service       (8083)  ← MySQL + Kafka    │
 ├─ User Service        (8084)  ← MySQL            │
 └─ Notification Svc   (8085)  ← MySQL + Kafka    │
                                                   │
 Monitoring: Prometheus (9090) + Grafana (3001)   │
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Java | 17+ |
| Maven | 3.9+ |
| Node.js | 18+ |
| Docker Desktop | Latest |

---

## Option A — Docker (Recommended)

Start **everything** with one command:

```bash
# From project root
docker-compose up -d
```

Wait ~60 seconds for all services to start, then:

| URL | Description |
|-----|-------------|
| http://localhost:3000 | React Frontend |
| http://localhost:8080 | API Gateway |
| http://localhost:8761 | Eureka Registry |
| http://localhost:9090 | Prometheus |
| http://localhost:3001 | Grafana (admin / tradelect123) |

---

## Option B — Local Development

### Step 1 — Start Infrastructure
```bash
docker-compose up -d mysql redis zookeeper kafka
# Wait 15 seconds for MySQL to be ready
```

### Step 2 — Build All Backend Modules
```bash
cd backend
mvn clean install -DskipTests
```

### Step 3 — Start Services (in order, each in a separate terminal)

```bash
# Terminal 1 — Eureka (start first, wait 10s)
cd backend/eureka-server && mvn spring-boot:run

# Terminal 2 — API Gateway
cd backend/api-gateway && mvn spring-boot:run

# Terminal 3 — Auth Service
cd backend/auth-service && mvn spring-boot:run

# Terminal 4 — Product Service
cd backend/product-service && mvn spring-boot:run

# Terminal 5 — Order Service
cd backend/order-service && mvn spring-boot:run

# Terminal 6 — User Service
cd backend/user-service && mvn spring-boot:run

# Terminal 7 — Notification Service
cd backend/notification-service && mvn spring-boot:run
```

### Step 4 — Start Frontend
```bash
cd frontend
npm install
npm start
```

### Step 5 — Start Monitoring (optional)
```bash
docker-compose up -d prometheus grafana
```

---

## First-Time Setup: Create Admin Account

Visit **http://localhost:3000/admin/login** and click "Register Admin".

If no admin exists yet, the first registration automatically becomes **SUPER_ADMIN**.

Or via curl:
```bash
# First admin (no invite key needed)
curl -X POST http://localhost:8080/api/auth/register-admin \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Super Admin",
    "email": "admin@tradelect.com",
    "password": "Admin@123",
    "phone": "+91 98765 43210",
    "companyName": "Tradelect"
  }'

# Additional admins (invite key required)
curl -X POST http://localhost:8080/api/auth/register-admin \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Admin 2",
    "email": "admin2@tradelect.com",
    "password": "Admin@123",
    "role": "ADMIN",
    "inviteKey": "TRADELECT_ADMIN_2025"
  }'

# Register Dealer
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test Dealer",
    "email": "dealer@tradelect.com",
    "password": "Dealer@123",
    "companyName": "Electronics Pvt Ltd",
    "role": "DEALER"
  }'

# Register Customer
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test Customer",
    "email": "customer@tradelect.com",
    "password": "Customer@123",
    "role": "CUSTOMER"
  }'
```

---

## Grafana Dashboards

1. Open **http://localhost:3001** → Login: `admin` / `tradelect123`
2. Two dashboards are pre-provisioned:
   - **Tradelect — Platform Overview** — HTTP rates, response times, JVM heap, service health
   - **Tradelect — Products & Business Metrics** — product searches, bids/min, notification rate
3. From the Admin Panel at **http://localhost:3000/admin**, click "Open Grafana" for direct links

---

## Email Configuration (Dual Domain)

Edit `backend/auth-service/src/main/resources/application.yml` or set env vars:

```bash
# SMTP send domain (outgoing relay)
MAIL_SMTP_HOST=smtp.qlc.co.in
MAIL_USERNAME=project@intactautomation.com
MAIL_PASSWORD=your-password

# Display / receive domain (what users see in From:)
MAIL_FROM_DISPLAY=noreply@qlc.co.in
MAIL_FROM_NAME=Tradelect
```

---

## Database Summary

MySQL databases created automatically on first start:

| Database | Service |
|----------|---------|
| `tradelect_auth` | Auth Service |
| `tradelect_products` | Product Service |
| `tradelect_orders` | Order Service |
| `tradelect_users` | User Service |
| `tradelect_notifications` | Notification Service |

Default credentials: `root` / `root` (change for production)

---

## Ports Reference

| Service | Port |
|---------|------|
| React Frontend | 3000 |
| API Gateway | 8080 |
| Auth Service | 8081 |
| Product Service | 8082 |
| Order Service | 8083 |
| User Service | 8084 |
| Notification Service | 8085 |
| Eureka Registry | 8761 |
| MySQL | 3306 |
| Redis | 6379 |
| Kafka | 9092 |
| Prometheus | 9090 |
| Grafana | 3001 |

---

## Production Environment Variables

```bash
export JWT_SECRET="your-256-bit-secret-key-here"
export MAIL_USERNAME="project@intactautomation.com"
export MAIL_PASSWORD="your-smtp-password"
export MAIL_FROM_DISPLAY="noreply@qlc.co.in"
export ADMIN_INVITE_KEY="your-secure-invite-key"
export SPRING_DATASOURCE_USERNAME="tradelect"
export SPRING_DATASOURCE_PASSWORD="your-strong-password"
```
