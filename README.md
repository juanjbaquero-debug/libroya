# LibroYa

Tienda de libros electrónicos. La interfaz vive en `web/` (Next.js, App Router y Tailwind). Todas las APIs REST y los WebSockets viven en `server/` (Express, Socket.IO y Mongoose).

La base de datos es MongoDB Atlas. La cadena de conexión va en `MONGODB_URI`.

## Requisitos

- Node.js 20 o superior
- Una base en MongoDB Atlas
- Una app de PayPal Sandbox (REST API) si vas a cobrar

## Configuración

1. En la raíz, copia `.env.example` a `.env` y completa `MONGODB_URI`, `JWT_SECRET`, PayPal y el admin.
2. En `web/`, copia `.env.example` a `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_PAYPAL_CLIENT_ID=el mismo PAYPAL_CLIENT_ID
```

3. Instala y siembra:

```
npm install
npm run seed
npm run dev
```

La API escucha en `http://0.0.0.0:4000` (o en `PORT`) y la web en `http://localhost:3000`.

`GET /health` responde `{ "ok": true }` y no exige sesión. Sirve como comprobación en Railway.

## Roles

- El registro público (`POST /api/auth/register`) siempre crea un cliente. El cuerpo no puede elegir rol.
- El administrador sale del seed (`ADMIN_EMAIL` y `ADMIN_PASSWORD`). Con el ejemplo: `admin@libroya.com` / `Admin123!`.

## Pago

El navegador no envía montos. El backend crea la orden de PayPal con el total guardado en MongoDB y, al capturar, exige estado `COMPLETED`, moneda USD y el mismo monto. El stock se descuenta solo después de esa validación. Cada intento queda en la colección `Payment` (`orderId`, `provider`, `providerOrderId`, `captureId`, `amount`, `status`), sin datos de tarjeta.

En PayPal Sandbox usa una cuenta personal de comprador de tu aplicación de desarrollador.

## Railway

Despliega solo `server/`:

- Root Directory: `server`
- Start: `npm start`
- Healthcheck path: `/health`
- Variables: `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN` (URL pública del frontend), `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE=sandbox`

Express usa `process.env.PORT` y escucha en `0.0.0.0`.
