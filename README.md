# JAH Link

Plataforma SaaS para **enlaces cortos**, **páginas bio**, **códigos QR** y **analítica**. Backend: **Supabase** (Auth + PostgreSQL + Storage).

## Stack

- React 19 + TypeScript + Vite 6
- Tailwind CSS 4
- React Router 7
- Supabase (`@supabase/supabase-js`)
- Recharts · qrcode.react

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

## Planes y comportamiento

- Todo usuario nuevo inicia siempre en **Plan Gratis**.
- Si alguien selecciona Pro o Business desde la landing, JAH Link guarda solo la intención de plan solicitado. No activa funciones pagadas hasta completar pago o asignación manual.
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
- Dominios personalizados
- Edge Function para redirección ultra-rápida
- Tests E2E (Playwright)
- Políticas Storage `avatars` en dashboard Supabase

---

**JAH Link by ITSA Security**
