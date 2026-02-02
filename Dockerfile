# Stage 1: Construcción (Build)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
# En esta fase no necesitamos las variables reales, generamos un bundle base
RUN npm run build

# Stage 2: Servidor (Production) con Inyección en Runtime
FROM nginx:alpine

# Instalamos sed para el reemplazo de variables
RUN apk add --no-cache sed

WORKDIR /usr/share/nginx/html

# Copiamos los archivos construidos
COPY --from=builder /app/dist .
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

# Variables de entorno por defecto (Cloud Run inyectara las reales)
ENV PORT=8080
ENV VITE_GOOGLE_MAPS_API_KEY=""
ENV VITE_GOOGLE_MAPS_MAP_ID=""
ENV VITE_DEFAULT_LAT="40.7484"
ENV VITE_DEFAULT_LNG="-73.9857"
ENV VITE_APP_ENV="production"

# El comando de inicio:
# 1. Reemplaza los placeholders en el index.html con las variables de entorno REALES del contenedor
# 2. Configura Nginx y arranca
CMD ["sh", "-c", "\
    sed -i \"s|__VITE_GOOGLE_MAPS_API_KEY__|${VITE_GOOGLE_MAPS_API_KEY}|g\" index.html && \
    sed -i \"s|__VITE_GOOGLE_MAPS_MAP_ID__|${VITE_GOOGLE_MAPS_MAP_ID}|g\" index.html && \
    sed -i \"s|__VITE_DEFAULT_LAT__|${VITE_DEFAULT_LAT}|g\" index.html && \
    sed -i \"s|__VITE_DEFAULT_LNG__|${VITE_DEFAULT_LNG}|g\" index.html && \
    sed -i \"s|__VITE_APP_ENV__|${VITE_APP_ENV}|g\" index.html && \
    envsubst '${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && \
    nginx -g 'daemon off;' \
"]
