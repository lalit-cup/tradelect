# Tradelect — Complete Cloud Deployment Guide

## Architecture Overview

```
Internet
   │
   ▼
┌──────────────────────────────────────────────────────────────────┐
│  Nginx  :80/:443  (reverse proxy + React SPA)                    │
└──────────────────────────────────────────────────────────────────┘
   │  /api/*
   ▼
┌──────────────────────────────────────────────────────────────────┐
│  API Gateway  :8080  (JWT auth filter, circuit breaker, routing) │
└──────────────────────────────────────────────────────────────────┘
   │  lb://service-name  (Eureka discovery)
   ├──► Auth Service       :8081  (login, register, OTP, JWT)
   ├──► Product Service    :8082  (products, brands, CSV import)
   ├──► Order Service      :8083  (bids, enquiries, purchases, wishlist)
   ├──► User Service       :8084  (profiles)
   └──► Notification Svc   :8085  (Kafka consumer, in-app notifications)

Infrastructure:
  MySQL      :3306  (5 separate databases)
  Redis      :6379  (JWT blacklist, session cache)
  Kafka      :9092  (event streaming)
  Zookeeper  :2181  (Kafka coordination)

Monitoring:
  Prometheus :9090  (metrics scrape)
  Grafana    :3001  (dashboards — admin / your-password)
  Eureka     :8761  (service registry)
```

---

## Quick Start (5 steps)

### Step 1 — Get a server
Any Linux VPS with:
- **OS**: Ubuntu 22.04 LTS (recommended)
- **RAM**: 4 GB minimum, 8 GB recommended
- **Disk**: 40 GB SSD
- **Ports open**: 22 (SSH), 80, 443, 8080, 3001, 8761

**Cloud options**: AWS EC2 t3.medium, DigitalOcean Droplet 4GB, Azure B2s, GCP e2-medium

---

### Step 2 — Install Docker on the server
```bash
# Connect to your server
ssh ubuntu@YOUR_SERVER_IP

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose v2
sudo apt install docker-compose-plugin -y
docker compose version  # should show v2.x

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y
node --version  # should show v18.x
```

---

### Step 3 — Upload the project
```bash
# From your local machine - upload project
scp -r tradelect/ ubuntu@YOUR_SERVER_IP:/opt/tradelect

# OR clone from git
ssh ubuntu@YOUR_SERVER_IP
git clone https://github.com/yourorg/tradelect.git /opt/tradelect
cd /opt/tradelect
```

---

### Step 4 — Configure environment
```bash
cd /opt/tradelect

# Create your .env from example
cp .env.example .env
nano .env
```

**Change these values in `.env`:**
```env
MYSQL_ROOT_PASSWORD=YourStrongDBPassword!
JWT_SECRET=generate-with: openssl rand -hex 32
ADMIN_INVITE_KEY=YourSecretAdminKey2025
FRONTEND_URL=http://YOUR_SERVER_IP       # or https://yourdomain.com
MAIL_USERNAME=your@gmail.com
MAIL_PASSWORD=your-gmail-app-password    # https://myaccount.google.com/apppasswords
GRAFANA_ADMIN_PASSWORD=YourGrafanaPass!
```

**Set frontend API URL:**
```bash
nano frontend/.env.production
# Change: REACT_APP_API_URL=http://YOUR_SERVER_IP
# Change: REACT_APP_RAZORPAY_KEY=rzp_live_XXXXXX  (get from razorpay.com)
```

---

### Step 5 — Deploy
```bash
chmod +x deploy.sh
./deploy.sh
```

That's it! The script will:
1. Build the React frontend
2. Build all 7 Java microservice Docker images
3. Start all infrastructure (MySQL, Redis, Kafka)
4. Start all services in correct order
5. Run health checks
6. Print your live URLs

---

## Accessing the Application

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | `http://YOUR_SERVER_IP` | — |
| Admin Panel | `http://YOUR_SERVER_IP/admin/login` | Set via ADMIN_INVITE_KEY |
| API Gateway | `http://YOUR_SERVER_IP:8080` | Bearer JWT |
| Grafana | `http://YOUR_SERVER_IP:3001` | admin / GRAFANA_ADMIN_PASSWORD |
| Eureka | `http://YOUR_SERVER_IP:8761` | — |
| Prometheus | `http://YOUR_SERVER_IP:9090` | — |

---

## Daily Operations

```bash
# View all running containers
docker compose ps

# View logs for a specific service
docker compose logs -f auth-service
docker compose logs -f api-gateway

# Restart a single service
docker compose restart product-service

# Stop everything
docker compose down

# Stop and wipe all data (DESTRUCTIVE)
docker compose down -v

# Update and redeploy
git pull origin main
./deploy.sh
```

---

## Adding HTTPS / SSL (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot -y

# Get certificate (replace with your domain)
sudo certbot certonly --standalone -d tradelect.com -d www.tradelect.com

# Certs will be at:
# /etc/letsencrypt/live/tradelect.com/fullchain.pem
# /etc/letsencrypt/live/tradelect.com/privkey.pem

# Copy to nginx/ssl/
sudo cp /etc/letsencrypt/live/tradelect.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/tradelect.com/privkey.pem nginx/ssl/

# Uncomment the HTTPS server block in nginx/nginx.conf
# Then restart nginx:
docker compose restart nginx
```

---

## Database Backup

```bash
# Manual backup
docker exec tradelect-mysql mysqldump \
  -u root -p"$MYSQL_ROOT_PASSWORD" \
  --all-databases > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
docker exec -i tradelect-mysql mysql \
  -u root -p"$MYSQL_ROOT_PASSWORD" < backup_file.sql

# Add to crontab for daily backups at 2am:
# 0 2 * * * cd /opt/tradelect && docker exec tradelect-mysql mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --all-databases > /opt/backups/tradelect_$(date +\%Y\%m\%d).sql
```

---

## CI/CD with GitHub Actions

1. Push code to GitHub
2. Add these secrets in GitHub → Settings → Secrets:
   - `SERVER_HOST` — your server IP
   - `SERVER_USER` — `ubuntu`
   - `SERVER_SSH_KEY` — your private SSH key
   - `REACT_APP_API_URL` — `http://YOUR_SERVER_IP`
   - `REACT_APP_RAZORPAY_KEY` — your live Razorpay key
3. Every push to `main` auto-deploys to your server

---

## Troubleshooting

**Services not starting?**
```bash
docker compose logs eureka-server   # Check Eureka first
docker compose logs api-gateway
docker compose logs auth-service
```

**MySQL connection refused?**
```bash
docker compose ps mysql             # Is it healthy?
docker compose logs mysql           # Check for errors
```

**Frontend shows blank page?**
```bash
# Check that frontend/build/ exists
ls frontend/build/index.html

# Check nginx
docker compose logs nginx
```

**Kafka errors in notification-service?**
```bash
docker compose restart kafka
sleep 10
docker compose restart notification-service
```

**Out of memory?**
```bash
free -h                             # Check RAM
docker stats                        # Check container memory
# Consider upgrading to 8GB RAM server
```

---

## Resource Requirements by Scale

| Users | RAM | CPU | Disk |
|-------|-----|-----|------|
| < 100 concurrent | 4 GB | 2 vCPU | 40 GB |
| 100–500 concurrent | 8 GB | 4 vCPU | 80 GB |
| 500+ concurrent | 16 GB | 8 vCPU | 160 GB |
