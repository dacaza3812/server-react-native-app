#!/bin/sh
cd /data

if [ ! -f cuba.mbtiles ]; then
    echo "⬇️ Descargando datos de Cuba..."
    curl -L -o cuba.mbtiles "https://geodata.maptiler.download/extracts/osm/v3.11/2020-02-10/central-america/osm-2020-02-10-v3.11_central-america_cuba.mbtiles"
    echo "✅ Datos de Cuba descargados"
fi

echo "🚀 Iniciando TileServer con datos de Cuba..."
exec tileserver-gl --port 8080 /data/cuba.mbtiles
