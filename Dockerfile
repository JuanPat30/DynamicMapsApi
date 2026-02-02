# Stage 1: Construcción (Build)
FROM node:20-alpine as builder

WORKDIR /app

# Copiamos definiciones de paquetes primero para aprovechar caché de Docker
COPY package.json ./
RUN npm install

# Copiamos el código fuente
COPY . .

# Argumentos de construcción (necesarios para Vite en build time)
ARG VITE_GOOGLE_MAPS_API_KEY
ARG VITE_GOOGLE_MAPS_MAP_ID
ARG GOOGLE_CLOUD_PROJECT
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY
ENV VITE_GOOGLE_MAPS_MAP_ID=$VITE_GOOGLE_MAPS_MAP_ID
ENV GOOGLE_CLOUD_PROJECT=$GOOGLE_CLOUD_PROJECT

# Generamos los archivos estáticos (dist/)
RUN npm run build

# Stage 2: Servidor (Production)
FROM nginx:alpine

# Variable de entorno por defecto para el puerto
ENV PORT=8080

# Copiamos la configuración de Nginx como plantilla
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

# Copiamos los archivos construidos desde el Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

# Usamos envsubst para inyectar el puerto dinámicamente al arrancar
CMD ["sh", "-c", "envsubst '${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
