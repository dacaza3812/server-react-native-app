# Resultados de Pruebas - API v1 Tienda

## Fecha: 2026-02-01

### 1. Registro Store Owner ✅
- **Endpoint**: `POST /api/v1/auth/register`
- **Status**: ✅ Éxito
- **Datos**: Phone 55559988, Tienda "El Éxito"
- **Token**: Generado correctamente

### 2. Crear Tienda ✅
- **Endpoint**: `POST /api/v1/stores/register`
- **Status**: ✅ Éxito
- **Store ID**: `697fe3e0273daab836db0371`
- **Nombre**: "Tienda El Éxito"
- **Ubicación**: La Habana, CU

### 3. Crear Productos ✅

#### Producto 1: Arroz Premium
- **Endpoint**: `POST /api/v1/products/store/{storeId}`
- **Status**: ✅ Éxito
- **ID**: `697fe4a2273daab836db0377`
- **Precio**: $250
- **Inventario**: 100 unidades

#### Producto 2: Refresco Cola
- **Endpoint**: `POST /api/v1/products/store/{storeId}`
- **Status**: ✅ Éxito
- **ID**: `697fe4ea273daab836db037b`
- **Precio**: $180
- **Inventario**: 50 unidades

### 4. Listar Productos de Tienda ✅
- **Endpoint**: `GET /api/v1/products/store/{storeId}`
- **Status**: ✅ Éxito
- **Total**: 2 productos
- **Productos**: Arroz Premium, Refresco Cola

### 5. Registro Customer para Pedido ✅
- **Endpoint**: `POST /api/v1/auth/register`
- **Status**: ✅ Éxito
- **Phone**: 55557766
- **Nombre**: Ana García

### 6. Crear Pedido/Delivery ✅
- **Endpoint**: `POST /api/v1/deliveries/create`
- **Status**: ✅ Éxito
- **Order ID**: `697fe526273daab836db038c`
- **Tracking Code**: `TRK17699894143764801`
- **Order Number**: `ORD1769989414378922`
- **Status**: PENDING
- **OTP**: 2286

#### Detalles del Pedido:
- **Items**:
  - 2x Arroz Premium ($500)
  - 3x Refresco Cola ($540)
- **Subtotal**: $1040
- **Tax**: $166.4
- **Total**: $1206.4
- **Tipo**: HOME_DELIVERY
- **Método de Pago**: Cash

## Resumen

✅ **Todas las pruebas pasaron exitosamente**

- Autenticación con password y bcrypt: ✅
- Creación de tienda con ubicación: ✅
- Creación de productos con inventario: ✅
- Listado de productos: ✅
- Creación de pedidos con tracking: ✅

## IDs Importantes

- **Store Owner**: `697fe3bb273daab836db036d`
- **Store**: `697fe3e0273daab836db0371`
- **Product 1**: `697fe4a2273daab836db0377`
- **Product 2**: `697fe4ea273daab836db037b`
- **Customer**: `697fe4f1273daab836db0380`
- **Delivery**: `697fe526273daab836db038c`
