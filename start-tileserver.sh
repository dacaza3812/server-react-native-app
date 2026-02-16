#!/bin/sh
cd /data

if [ ! -f cuba.mbtiles ]; then
    echo "⬇️ Descargando datos de Cuba..."
    curl -L -o cuba.mbtiles "https://geodata.maptiler.download/extracts/osm/v3.11/2020-02-10/central-america/osm-2020-02-10-v3.11_central-america_cuba.mbtiles"
    echo "✅ Datos de Cuba descargados"
fi

echo "🚀 Iniciando TileServer con datos de Cuba..."

# Buscar tileserver-gl
TILESERVER=$(find / -name "tileserver-gl" -type f 2>/dev/null | head -1)

if [ -n "$TILESERVER" ]; then
    echo "✅ Encontrado tileserver-gl en: $TILESERVER"
    exec "$TILESERVER" --port 8080 /data/cuba.mbtiles
else
    echo "❌ Error: No se encontró tileserver-gl"
    echo "🔍 Buscando en /usr/src/app..."
    ls -la /usr/src/app/ 2>/dev/null || echo "No existe /usr/src/app"
    echo "🔍 Buscando node_modules..."
    find /usr -name "tileserver-gl*" 2>/dev/null | head -5
    exit 1
fi
