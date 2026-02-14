# ============================================
# Dockerfile para Rapido API Server
# ============================================

FROM node:20-alpine

# Crear directorio de la aplicación
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto de la aplicación
COPY . .

# Crear directorio para uploads si no existe
RUN mkdir -p uploads

# Exponer puerto
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -q --spider http://localhost:3000/health || exit 1

# Comando para iniciar la aplicación
CMD ["node", "app.js"]