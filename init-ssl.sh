#!/bin/bash
# ============================================
# Script para inicializar SSL con Let's Encrypt
# Ejecutar después de configurar DNS
# ============================================

cd /opt/rapido

echo "========================================"
echo "CONFIGURACIÓN SSL - LET'S ENCRYPT"
echo "========================================"
echo ""

DOMAIN="foxlawyer.net"
EMAIL="david383812@gmail.com"

# Verificar que nginx esté corriendo
if ! docker-compose ps | grep -q "rapido-nginx"; then
    echo "❌ ERROR: Nginx no está corriendo"
    exit 1
fi

echo "Obteniendo certificados SSL..."
echo "Dominios: api.$DOMAIN, mapas.$DOMAIN, routing.$DOMAIN, places.$DOMAIN"
echo ""

# Obtener certificados
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d api.$DOMAIN \
    -d mapas.$DOMAIN \
    -d routing.$DOMAIN \
    -d places.$DOMAIN

if [ $? -eq 0 ]; then
    echo "✅ Certificados obtenidos"
    
    # Crear configuración HTTPS
    cat > nginx/conf.d/ssl.conf << 'EOF'
# API - HTTPS
server {
    listen 443 ssl http2;
    server_name api.foxlawyer.net;
    
    ssl_certificate /etc/letsencrypt/live/api.foxlawyer.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.foxlawyer.net/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    
    location / {
        proxy_pass http://api:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        add_header 'Access-Control-Allow-Origin' '*' always;
    }
}

# Mapas - HTTPS
server {
    listen 443 ssl http2;
    server_name mapas.foxlawyer.net;
    
    ssl_certificate /etc/letsencrypt/live/mapas.foxlawyer.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mapas.foxlawyer.net/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    
    location / {
        proxy_pass http://tileserver:8080;
        proxy_set_header Host $host;
        add_header 'Access-Control-Allow-Origin' '*' always;
    }
}

# Routing - HTTPS
server {
    listen 443 ssl http2;
    server_name routing.foxlawyer.net;
    
    ssl_certificate /etc/letsencrypt/live/routing.foxlawyer.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/routing.foxlawyer.net/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    
    location / {
        proxy_pass http://osrm:5000;
        proxy_set_header Host $host;
        add_header 'Access-Control-Allow-Origin' '*' always;
    }
}

# Places - HTTPS
server {
    listen 443 ssl http2;
    server_name places.foxlawyer.net;
    
    ssl_certificate /etc/letsencrypt/live/places.foxlawyer.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/places.foxlawyer.net/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    
    location / {
        proxy_pass http://nominatim:8080;
        proxy_set_header Host $host;
        add_header 'Access-Control-Allow-Origin' '*' always;
    }
}

# Redirección HTTP a HTTPS
server {
    listen 80;
    server_name api.foxlawyer.net;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://$server_name$request_uri; }
}

server {
    listen 80;
    server_name mapas.foxlawyer.net;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://$server_name$request_uri; }
}

server {
    listen 80;
    server_name routing.foxlawyer.net;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://$server_name$request_uri; }
}

server {
    listen 80;
    server_name places.foxlawyer.net;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://$server_name$request_uri; }
}
EOF

    # Recargar nginx
    docker-compose exec nginx nginx -s reload
    
    echo ""
    echo "========================================"
    echo "✅ SSL CONFIGURADO CORRECTAMENTE"
    echo "========================================"
    echo ""
    echo "URLs seguras:"
    echo "  🔒 https://api.foxlawyer.net"
    echo "  🔒 https://mapas.foxlawyer.net"
    echo "  🔒 https://routing.foxlawyer.net"
    echo "  🔒 https://places.foxlawyer.net"
    echo ""
    
else
    echo "❌ ERROR: No se pudieron obtener los certificados"
    echo "Verifica que los DNS estén configurados correctamente"
    exit 1
fi