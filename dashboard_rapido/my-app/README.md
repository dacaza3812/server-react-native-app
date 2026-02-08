# Rapido Admin Dashboard

Dashboard de administración para la aplicación Rapido (Uber-like app).

## Características

- **Dashboard Overview**: Métricas y estadísticas en tiempo real
- **Mapa en Vivo**: Visualización de choferes y tiendas en tiempo real (Las Tunas, Cuba)
- **Gestión de Usuarios**: CRUD completo de clientes, choferes y dueños de tienda
- **Gestión de Viajes**: CRUD de viajes con filtros por estado
- **Gestión de Entregas**: CRUD de entregas con seguimiento
- **Gestión de Tiendas**: CRUD de tiendas y visualización
- **Gestión de Productos**: CRUD de productos por tienda

## Tecnologías

- Next.js 16
- TypeScript
- Tailwind CSS
- MapLibre GL (Mapas)
- Axios (API Client)
- React Query (Data fetching)
- Lucide React (Iconos)

## Configuración

### Variables de Entorno

Crear archivo `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Instalación

```bash
cd dashboard_rapido/my-app
npm install
npm run dev
```

### Credenciales de Admin

- **Email**: david383812@gmail.com
- **Contraseña**: 12345678

## Estructura del Proyecto

```
app/
├── login/              # Página de login
├── page.tsx            # Dashboard principal
├── users/              # Gestión de usuarios
├── rides/              # Gestión de viajes
├── deliveries/         # Gestión de entregas
├── stores/             # Gestión de tiendas
├── products/           # Gestión de productos
└── live-map/           # Mapa en tiempo real

components/
├── auth-provider.tsx   # Proveedor de autenticación
├── layout/
│   └── dashboard-layout.tsx  # Layout con sidebar
└── map/                # Componentes del mapa

lib/
├── api.ts              # Cliente API
└── utils.ts            # Utilidades

types/
└── index.ts            # Tipos TypeScript
```

## API Endpoints (Express)

El dashboard se conecta a los siguientes endpoints:

- `POST /api/admin/auth/login` - Login de admin
- `GET /api/admin/stats` - Estadísticas del dashboard
- `GET /api/admin/captains/live` - Choferes en tiempo real
- `GET /api/admin/users` - Listar usuarios
- `GET /api/admin/rides` - Listar viajes
- `GET /api/admin/deliveries` - Listar entregas
- `GET /api/admin/stores` - Listar tiendas
- `GET /api/admin/products` - Listar productos

## Ubicación

El mapa está configurado para mostrar **Las Tunas, Cuba** por defecto:
- Latitud: 20.961204224981
- Longitud: -76.95441383298188

## Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Iniciar en producción
npm start
```

## Notas

- El mapa se actualiza automáticamente cada 10 segundos
- La autenticación usa JWT tokens almacenados en localStorage
- Todos los endpoints requieren autenticación excepto el login
