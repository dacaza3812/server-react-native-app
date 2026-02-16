#!/bin/sh

# Cambiar al directorio de datos
cd /data

# Descargar datos de Cuba si no existen
if [ ! -f cuba.mbtiles ]; then
    echo "⬇️ Descargando datos de Cuba..."
    curl -L -o cuba.mbtiles "https://geodata.maptiler.download/extracts/osm/v3.11/2020-02-10/central-america/osm-2020-02-10-v3.11_central-america_cuba.mbtiles"
    echo "✅ Datos de Cuba descargados"
fi

echo "🚀 Iniciando TileServer con datos de Cuba..."

# Usar el entrypoint original de la imagen con nuestros datos
export PORT=8080
cd /usr/src/app
exec /usr/src/app/docker-entrypoint.sh /data/cuba.mbtiles
