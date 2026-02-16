#!/bin/sh
cd /data

if [ ! -f cuba.mbtiles ]; then
    echo "⬇️ Descargando datos de Cuba..."
    curl -L -o cuba.mbtiles "https://geodata.maptiler.download/extracts/osm/v3.11/2020-02-10/central-america/osm-2020-02-10-v3.11_central-america_cuba.mbtiles"
    echo "✅ Datos de Cuba descargados"
fi

echo "🚀 Iniciando TileServer con datos de Cuba..."

# Buscar tileserver-gl en diferentes ubicaciones
if [ -x "/usr/local/bin/tileserver-gl" ]; then
    exec /usr/local/bin/tileserver-gl --port 8080 /data/cuba.mbtiles
elif [ -x "/usr/bin/tileserver-gl" ]; then
    exec /usr/bin/tileserver-gl --port 8080 /data/cuba.mbtiles
else
    # Intentar encontrar con which
    TILESERVER=$(which tileserver-gl 2>/dev/null)
    if [ -n "$TILESERVER" ]; then
        exec "$TILESERVER" --port 8080 /data/cuba.mbtiles
    else
        echo "❌ Error: No se encontró tileserver-gl"
        exit 1
    fi
fi
