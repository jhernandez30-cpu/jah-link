# JAH Link

Plataforma SaaS para **enlaces cortos**, **páginas bio**, **códigos QR** y **analítica**. Backend: **Supabase** (Auth + PostgreSQL + Storage).

## Stack

- React 19 + TypeScript + Vite 6
- Tailwind CSS 4
- React Router 7
- Supabase (`@supabase/supabase-js`)
- Recharts · qrcode.react

Este proyecto usa **Vite + React**, no Next.js. Por eso las variables publicas correctas son:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id
VITE_PAYPAL_CURRENCY=USD
```

No uses `NEXT_PUBLIC_SUPABASE_URL` ni `NEXT_PUBLIC_SUPABASE_ANON_KEY` en esta app.

## Instalación

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Configurar variables de entorno**:
   Crea un archivo `.env` o `.env.local` en la raíz del proyecto (puedes copiar `.env.example`):
   ```bash
   cp .env.example .env
   ```
   Edita `.env` o `.env.local` y añade tus claves de Supabase:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu_anon_key
   VITE_PAYPAL_CLIENT_ID=tu_paypal_client_id
   VITE_PAYPAL_CURRENCY=USD
   ```
   > **Nota**: Si dejas estas variables vacías, JAH Link funcionará automáticamente en **modo demo** con `localStorage` local, permitiendo probar toda la funcionalidad sin configurar base de datos. En producción, estas variables se configurarán en Vercel para conectar Supabase.

## Ejecución en Desarrollo

Desde la raíz del proyecto (`C:\Users\herna\Documents\JAH Link`), inicia el servidor de desarrollo local:
```bash
npm run dev
```

El proyecto usa **Vite + React + TypeScript**. El script `dev` está configurado para levantar Vite en el puerto 3000:
```text
Local: http://localhost:3000/
```

Abre la URL exacta que muestre la terminal. Si `http://localhost:3000` rechaza la conexión, significa que el servidor no está iniciado, se inició desde otra carpeta o el puerto cambió por conflicto.

### ⚠️ Importante: ¿Por qué no usar Live Server?
No intentes abrir `index.html` directamente usando **Live Server** u otros servidores estáticos de archivos. 
Vite es un bundler que necesita su propio servidor de desarrollo para procesar la compilación de TypeScript (`.tsx`), importar dependencias npm y resolver módulos de Javascript (`import`). Si abres `index.html` directamente, obtendrás una **pantalla en blanco** y errores de importación en la consola del navegador. Siempre inicia la aplicación usando `npm run dev`.

## Compilación y Producción

* **Crear build de producción**: Compila y optimiza la app en la carpeta `dist`.
  ```bash
  npm run build
  ```
* **Previsualizar build local**: Sirve la carpeta `dist` localmente para probar el build de producción.
  ```bash
  npm run preview
  ```
  Vite normalmente mostrará una URL de preview en `http://localhost:4173/`.

## Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecuta el archivo completo:
   `supabase/schema.sql`
3. En **Authentication → Providers**, habilita Email.
4. (Opcional) **Storage** → crea un bucket público llamado `avatars` para fotos de perfil/bio.
5. Copia la **Project URL** y **anon public key** a tu archivo de configuración de entorno.

### Vercel + Supabase

La guía de Vercel muestra una tabla notes como ejemplo, pero JAH Link usa tablas reales: profiles, short_links, bio_pages, bio_links, qr_codes y analytics_events.

Pasos para producción:

1. En Vercel, conecta Supabase desde **Storage/Database**.
2. Usa **Open in Supabase** para entrar al proyecto conectado.
3. En Supabase, abre **SQL Editor** y ejecuta `supabase/schema.sql` completo.
4. En Vercel, configura:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_PAYPAL_CLIENT_ID=your_paypal_client_id
   VITE_PAYPAL_CURRENCY=USD
   ```
   Ruta: **Project Settings → Environment Variables**.
5. Haz **Redeploy** del proyecto en Vercel.

No crees ni uses la tabla `notes` para producción. Esa tabla pertenece al ejemplo genérico y no representa el modelo de datos de JAH Link.

Opcional con Vercel CLI:

```bash
vercel link
vercel env pull .env.local
```

En Vite puedes usar `.env.local` para desarrollo local. No subas `.env` ni `.env.local` al repositorio.

## Redirección de enlaces cortos

JAH Link resuelve enlaces públicos con estas rutas:

- `/:slug` resuelve enlaces cortos.
- `/u/:username` resuelve páginas bio públicas.
- `/legal/*` resuelve páginas legales.
- `/dashboard/*` queda protegido y no debe ser tomado como slug.

En producción, Vercel debe cargar siempre la SPA para rutas dinámicas. El archivo `vercel.json` incluye:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Supabase debe permitir lectura pública de enlaces activos con RLS:

```sql
create policy "Public can read active short links"
on public.short_links
for select
to anon, authenticated
using (is_active = true);
```

Flujo esperado:

1. El usuario abre `https://jah.link/JAH-LINK`.
2. React Router carga `/:slug`.
3. JAH Link busca el slug en `public.short_links`, con soporte case-insensitive.
4. Si el enlace existe y está activo, muestra una vista previa de seguridad.
5. El botón **Continuar al destino** redirige de inmediato.
6. Si el usuario no hace clic, se redirige automáticamente en 4 segundos.
7. El clic se registra en Supabase; si la analítica falla, la redirección continúa.

El modo demo/localStorage solo se usa en desarrollo local cuando faltan `VITE_SUPABASE_URL` o `VITE_SUPABASE_ANON_KEY`. En producción, si Supabase está configurado, el banner demo no aparece y la app usa Supabase real.

## PayPal Checkout automático y Webhooks

JAH Link usa PayPal Buttons programáticos como flujo principal para Pro y Business. El SDK se carga desde React/Vite con `src/lib/loadPayPalSdk.ts`, pero la activación del plan ocurre solo en Vercel Serverless Functions usando `PAYPAL_CLIENT_SECRET` y `SUPABASE_SERVICE_ROLE_KEY`.

- Endpoint create order: `/api/paypal/create-order`.
- Endpoint capture order: `/api/paypal/capture-order`.
- Webhook PayPal: `/api/paypal/webhook`.
- Business Hosted Button ID `3DP34KZHDUYFG` queda como respaldo visual, no como activación automática.
- Pro link fallback: `https://www.paypal.com/ncp/payment/KXKYAMRPDNKXG`.
- Business link fallback: `https://www.paypal.com/ncp/payment/3DP34KZHDUYFG`.
- Client ID se configura con `VITE_PAYPAL_CLIENT_ID`.
- Moneda se configura con `VITE_PAYPAL_CURRENCY=USD`.
- La ruta de retorno configurada en PayPal es `/payment/success`.

Flujo actual:

1. El usuario elige Pro o Business desde la landing.
2. Si no tiene sesión, va a `/register?plan=pro` o `/register?plan=business`.
3. Si tiene sesión, va a `/checkout?plan=pro` o `/checkout?plan=business`.
4. El botón PayPal llama a `/api/paypal/create-order`.
5. El backend valida usuario, plan y precio desde `api/_lib/plans.js`; no confía en precios del frontend.
6. PayPal aprueba el pago y el frontend llama a `/api/paypal/capture-order`.
7. Si PayPal devuelve `COMPLETED`, el backend marca `payments.status = completed`, crea/actualiza `subscriptions` y actualiza `profiles.plan`.
8. El webhook `/api/paypal/webhook` verifica firma con `PAYPAL_WEBHOOK_ID` y procesa eventos duplicados de forma idempotente.
9. `/payment/success` solo muestra estado y refresca perfil; no activa planes.

Regla crítica: el plan no se activa por hacer clic en PayPal ni por volver desde `/payment/success`. La activación ocurre únicamente desde funciones backend seguras tras capture/webhook verificado.

Eventos webhook configurados:

- Checkout order approved
- Payment capture completed
- Payment capture denied
- Payment capture refunded
- Payment capture reversed

Si las tablas `payments` o `subscriptions` todavía no existen, ejecuta `supabase/schema.sql` completo. El modo demo/localStorage no activa planes pagados.

## Pendientes de producción

1. Abrir el proyecto de Supabase conectado a JAH Link.
2. Ir a **SQL Editor**.
3. Ejecutar el archivo completo `supabase/schema.sql`.
4. Ir a Vercel → **Project Settings** → **Environment Variables**.
5. Agregar estas variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_PAYPAL_CLIENT_ID=your_paypal_client_id
   VITE_PAYPAL_CURRENCY=USD
   PAYPAL_CLIENT_ID=your_paypal_client_id
   PAYPAL_CLIENT_SECRET=your_paypal_client_secret
   PAYPAL_ENV=sandbox
   PAYPAL_WEBHOOK_ID=your_paypal_webhook_id
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```
6. Confirmar configuración de Vercel:
   - Build command: `npm run build`
   - Output directory: `dist`
7. Configurar webhook en PayPal Developer Dashboard:
   - URL: `https://jah.link/api/paypal/webhook`
   - Eventos: Checkout order approved, Payment capture completed, Payment capture denied, Payment capture refunded, Payment capture reversed
   - Copiar el Webhook ID a `PAYPAL_WEBHOOK_ID`.
8. Hacer **Redeploy** en Vercel.
9. Verificar en producción:
   - Registro
   - Login
   - Perfil de usuario
   - Pago sandbox Pro y Business
   - Enlaces cortos y redirección por slug
   - Página bio pública
   - Códigos QR
   - Analítica de clics, visitas y escaneos

## Planes y comportamiento

- Todo usuario nuevo inicia siempre en **Plan Gratis**.
- Si alguien selecciona Pro o Business desde la landing, JAH Link guarda solo la intención de plan solicitado. No activa funciones pagadas hasta capture PayPal `COMPLETED` o webhook verificado.
- Plan Gratis permite 10 enlaces cortos, 1 página bio, QR básicos, analítica de 7 días y branding "Creado con JAH Link".
- Plan Pro prepara enlaces ilimitados, dominio personalizado, QR avanzados, analítica de 90 días y personalización avanzada.
- Plan Business prepara equipos, API, soporte prioritario, marca blanca y analítica avanzada.
- El avatar por defecto usa iniciales generadas desde nombre o correo. No se asignan fotos de personas ni avatares externos aleatorios.
- El usuario puede subir foto desde `/dashboard/settings`. En modo demo se guarda una vista previa local en `localStorage`; en Supabase se usa el bucket `avatars`.
- Modo demo: los datos se guardan temporalmente en este navegador. En producción se conectará Supabase desde Vercel para persistencia real.

## Solución de Problemas Comunes

### 1. `localhost rechazó la conexión`
* **Causa**: El servidor de desarrollo de Vite no se ha iniciado, o se está intentando acceder en un puerto incorrecto.
* **Solución**: Ejecuta estos comandos en PowerShell:
  ```powershell
  cd "C:\Users\herna\Documents\JAH Link"
  npm install
  npm run dev
  ```
  Verifica que la terminal muestre `Local: http://localhost:3000/` y deja esa terminal abierta mientras usas la app.
* **Conflicto de puerto**: Si Vite muestra otro puerto, abre la URL exacta que aparece en consola o libera el proceso que ocupa el 3000.

### 2. Pantalla en Blanco al abrir la aplicación
* **Causa**: Podría ser por intentar abrir mediante Live Server en lugar de `npm run dev`, o por errores de importación/compilación.
* **Solución**: No abras `index.html` directamente. Ejecuta `npm run dev`, entra a `http://localhost:3000` y revisa la consola del navegador si aparece algún error.

### 3. Dependencias faltantes o conflictos al instalar
* **Causa**: Archivos de caché corruptos o versiones incompatibles.
* **Solución**: Ejecuta los siguientes comandos para limpiar e instalar desde cero:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```
  En Windows PowerShell, usa:
  ```powershell
  Remove-Item -Recurse -Force node_modules, package-lock.json
  npm install
  ```
  *Se recomienda usar Node LTS 20 o 22. La validación local también funcionó con Node v25.9.0.*


## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Desarrollo |
| `npm run build` | Producción |
| `npm run lint` / `typecheck` | TypeScript |
| `npm run test` | Placeholder |

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Landing |
| `/login`, `/register` | Supabase Auth |
| `/checkout?plan=pro`, `/checkout?plan=business` | Checkout PayPal automático con create/capture order |
| `/payment/success?plan=pro`, `/payment/success?plan=business` | Retorno PayPal; refresca estado pero no activa planes |
| `/api/paypal/create-order` | Crea orden PayPal desde backend |
| `/api/paypal/capture-order` | Captura orden y activa plan si PayPal confirma `COMPLETED` |
| `/api/paypal/webhook` | Webhook PayPal con verificación de firma |
| `/dashboard` | Panel (protegido) |
| `/dashboard/links` | Enlaces cortos |
| `/dashboard/bio` | Editor página bio |
| `/dashboard/analytics` | Analítica |
| `/dashboard/qr` | Códigos QR |
| `/dashboard/settings` | Configuración |
| `/u/:username` | Bio pública |
| `/:slug` | Redirección + tracking |

## Capa de datos

| Archivo | Rol |
|---------|-----|
| `src/lib/supabase.ts` | Cliente Supabase |
| `src/lib/storage.ts` | API async (Supabase + fallback local) |
| `src/lib/paypal.ts` | Configuración centralizada PayPal Hosted Buttons |
| `src/lib/loadPayPalSdk.ts` | Loader único del SDK PayPal |
| `src/lib/payments.ts` | Estado de pagos PayPal en frontend |
| `api/_lib/paypal.js` | PayPal REST API backend |
| `api/_lib/activatePlan.js` | Activación segura de planes y subscriptions |
| `api/_lib/supabaseAdmin.js` | Cliente Supabase service role solo backend |
| `src/lib/storageLocal.ts` | Fallback demo |
| `src/context/AppContext.tsx` | Estado global y acciones UI |

## Probar flujos

### 1. Registro e inicio de sesión

1. `/register` → nombre, correo, contraseña (mín. 6 caracteres).
2. Si Supabase exige confirmación por correo, revisa el email antes de entrar.
3. `/login` → accede al dashboard.

### 2. Enlaces cortos

1. `/dashboard/links` → URL destino + slug (o generar automático).
2. Copia `jah.link/tu-slug`.
3. Abre `http://localhost:3000/tu-slug` → redirección y conteo de clic en Supabase.

### 3. Página bio

1. `/dashboard/bio` → edita perfil y botones → guardar.
2. Visita `/u/tu-username` → vista pública y registro de visita.

### 4. Analítica

1. `/dashboard/analytics` → eventos desde tabla `analytics_events`.

### 5. QR

1. `/dashboard/qr` → selecciona enlace → guardar QR → descargar PNG.

## Logo y marca

Assets en `public/brand/`. Componente: `src/components/BrandLogo.tsx`.

## Paleta

- Fondo `#000000`
- Azul `#006BFF` · Cian `#00CFFF` · Verde `#22C55E`

## Pendientes

- Confirmación de email en producción
- Probar PayPal Webhooks en sandbox y luego cambiar `PAYPAL_ENV=live`
- Dominios personalizados
- Edge Function para redirección ultra-rápida
- Tests E2E (Playwright)
- Políticas Storage `avatars` en dashboard Supabase

---

**JAH Link by ITSA Security**
