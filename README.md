# ZAPO — código inicial completo

Este repositorio contiene una web React/Vite con catálogo, carrito y paneles básicos, una API Express, SQL de Supabase y una app Android Kotlin/Compose que consulta el catálogo y muestra detalle de producto. La app Android es una base inicial: aún no implementa checkout, login ni mapas nativos.

## Requisitos
- Node.js LTS y Git
- Android Studio con SDK compatible con el proyecto
- Proyecto Supabase
- Claves restringidas de Google Maps si se activa el mapa

## 1. Base de datos
1. Abre Supabase > SQL Editor.
2. Ejecuta `database/schema.sql`.
3. Ejecuta `database/seed.sql` para insertar productos de demostración.
4. Configura Authentication > Providers > Email.
5. Para producción, revisa `database/README.md` y crea un perfil de administrador manualmente; nunca permitas que el formulario público asigne `admin`.

## 2. Backend
```powershell
cd backend
Copy-Item .env.example .env
npm install
npm run dev
```
Completa `.env` con la URL y claves de Supabase. Comprueba `http://localhost:3000/api/health`.

## 3. Web
```powershell
cd frontend-web
Copy-Item .env.example .env.local
npm install
npm run dev
```
Completa `.env.local`. Abre la dirección mostrada por Vite.

## 4. Android
Abre la carpeta `app-android` desde Android Studio y espera a Gradle Sync. Configura `app/src/main/res/values/secrets.xml` con tu clave de Maps si vas a habilitar el mapa. La URL base de la API está en `app/src/main/java/com/example/zapo/data/remote/ApiClient.kt`.
- En emulador Android, el backend local se accede normalmente con `http://10.0.2.2:3000/`.
- En un móvil físico, utiliza la IP local del computador y asegúrate de que ambos estén en la misma red.
- En producción, usa HTTPS.

## Seguridad
- No subas `.env`, claves de servicio ni keystores.
- La clave `service_role` solo va en backend.
- El esquema activa RLS. Los pedidos se deben crear con la función SQL transaccional y el backend autenticado.
- Este proyecto es una base funcional para desarrollo académico; antes de producción, completa pruebas, políticas de operación, recuperación de contraseñas, pagos y privacidad.
