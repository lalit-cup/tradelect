# ── Stage 1: Build React app ─────────────────────────────────────────────────
FROM node:18-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --silent

COPY . .
ARG REACT_APP_API_URL
ARG REACT_APP_RAZORPAY_KEY
ARG REACT_APP_GRAFANA_URL
ARG REACT_APP_ENVIRONMENT=production

RUN npm run build

# ── Stage 2: Serve with nginx ────────────────────────────────────────────────
FROM nginx:1.25-alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx-spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
