# 🚀 GUÍA COMPLETA DE DESPLIEGUE - SECOP II Intelligence

Prueba
**Paso a paso para tener tu aplicativo en producción en Netlify**

---

## 📋 Checklist Predeployment

Antes de comenzar, tienes listo:

- [ ] Cuenta de GitHub / GitLab / Bitbucket
- [ ] Código del proyecto en tu repositorio
- [ ] Cuenta de Netlify (https://netlify.com)
- [ ] API Key de OpenAI
- [ ] Credenciales SECOP II (901335221 / password)
- [ ] Cuenta de Google (para Google Drive)
- [ ] Cuenta de correo (para notificaciones)
- [ ] Dominio personalizado (opcional)

---

## PASO 1: Preparar tu Repositorio en GitHub

### 1.1 Crear repositorio en GitHub

1. Ir a https://github.com/new
2. Nombre: `secop-ii-intelligence`
3. Descripción: "Sistema de Inteligencia Comercial para SECOP II"
4. Seleccionar: **Public** (para que Netlify pueda acceder)
5. **Create repository**

### 1.2 Subir tu código

```bash
# En la carpeta del proyecto
git init
git add .
git commit -m "Initial commit: SECOP II Intelligence v1.0"
git branch -M main
git remote add origin https://github.com/tu-usuario/secop-ii-intelligence.git
git push -u origin main
```

**Verificar:** Entra a tu repositorio en GitHub y confirma que los archivos están allí.

---

## PASO 2: Configurar Netlify

### 2.1 Crear cuenta en Netlify

1. Ir a https://app.netlify.com/signup
2. Opción: **Sign up with GitHub**
3. Autorizar a Netlify para acceder a tus repositorios
4. Completar perfil

### 2.2 Conectar repositorio a Netlify

1. Desde dashboard de Netlify: **Add new site**
2. Opción: **Import an existing project**
3. Seleccionar **GitHub**
4. Buscar y seleccionar: `secop-ii-intelligence`
5. Click **Connect**

### 2.3 Configurar Build Settings

La pantalla muestra:

```
Base directory:        (dejar vacío)
Build command:         npm install && npm run build
Publish directory:     .
Functions directory:   netlify/functions
```

**Esto está correcto.** Click **Deploy site**

**Esperar:** Netlify desplegará (2-3 minutos). Verás URL como: `https://xxxxx.netlify.app`

---

## PASO 3: Configurar Variables de Entorno

### 3.1 Acceder a Build & deploy

En Netlify dashboard:
1. Tu sitio → **Settings**
2. Ir a **Build & deploy**
3. Bajar a **Environment**
4. Click **Edit variables**

### 3.2 Agregar variables (una por una)

Copiar cada variable y su valor desde `.env.example`

#### Variable 1: OpenAI API Key

```
Key:   OPENAI_API_KEY
Value: sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx
```

Obtener en: https://platform.openai.com/api-keys

#### Variable 2: SECOP II User

```
Key:   SECOP_USER
Value: 901335221
```

#### Variable 3: SECOP II Password

```
Key:   SECOP_PASSWORD
Value: catalina2023*
```

#### Variable 4: Email Service

```
Key:   EMAIL_SERVICE
Value: gmail
```

#### Variable 5: Email User (Gmail)

```
Key:   EMAIL_USER
Value: tu-email@gmail.com
```

#### Variable 6: Email Password

```
Key:   EMAIL_PASSWORD
Value: xxxxx xxxx xxxx xxxx (contraseña de aplicación)
```

Obtener:
1. Ir a https://myaccount.google.com/security
2. Activar "Verificación en 2 pasos"
3. Bajar a "Contraseñas de aplicaciones"
4. Generar para "Correo" y "Windows"
5. Copiar la contraseña generada (16 caracteres)

#### Variable 7: Google Drive Client ID

```
Key:   GOOGLE_CLIENT_ID
Value: xxxxx.apps.googleusercontent.com
```

Obtener:
1. Google Cloud Console: https://console.cloud.google.com/
2. Crear proyecto → "SECOP Intelligence"
3. Habilitar Google Drive API
4. Crear credenciales OAuth 2.0
5. Copiar Client ID

#### Variable 8: Google Drive Client Secret

```
Key:   GOOGLE_CLIENT_SECRET
Value: GOCSPX-xxxxxxxxxxxxx
```

De las mismas credenciales OAuth

#### Variable 9: Google Drive Folder ID

```
Key:   GOOGLE_DRIVE_FOLDER_ID
Value: 1xxxxxxxxxxxxxxxxxxxxx
```

Obtener:
1. Crear carpeta en Google Drive → "Convocatorias SECOP"
2. Abrir carpeta
3. URL: `https://drive.google.com/drive/folders/1xxxxxxxxxxxxx`
4. Copiar el ID después de `/folders/`

#### Variable 10: Configuración General

```
Key:   ENVIRONMENT
Value: production
```

```
Key:   NODE_ENV
Value: production
```

### 3.3 Guardar y redeplegar

1. Click **Save**
2. Ir a **Deploys**
3. Click en el último deploy
4. Click **Trigger deploy** → **Deploy site**

**Esperar:** El sitio se redepliegue con las nuevas variables (1-2 minutos)

---

## PASO 4: Habilitar Funciones Serverless

### 4.1 Verificar configuración

En **Settings → Build & deploy → Continuous deployment:**

- Asegurar que **Branch to deploy** es `main`
- Asegurar que **Deploy on push** está habilitado

### 4.2 Crear carpeta functions

En tu repositorio local:

```bash
mkdir -p netlify/functions
```

### 4.3 Crear archivo de función de prueba

`netlify/functions/test.js`:

```javascript
exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Función serverless funcionando ✅' })
  };
};
```

### 4.4 Subir cambios

```bash
git add netlify/functions/test.js
git commit -m "Add test serverless function"
git push origin main
```

### 4.5 Verificar en Netlify

1. Ir a **Functions** en Netlify
2. Deberías ver `test` listada
3. Click en ella → **Invocations** → **Trigger function**
4. Deberías ver respuesta exitosa

---

## PASO 5: Configurar Dominio Personalizado (Opcional)

### 5.1 Cambiar URL por defecto

En **Settings → Domain management:**

1. Click **Options** junto a tu dominio actual
2. **Edit site name**
3. Cambiar a: `secop-intelligence` (o tu preferencia)
4. Tu URL será: `https://secop-intelligence.netlify.app`

### 5.2 Usar dominio propio (si tienes uno)

1. Click **Add custom domain**
2. Ingresar: `secop.tuempresa.com` (ejemplo)
3. Seguir instrucciones de DNS
4. Esperar propagación (hasta 48 horas)

---

## PASO 6: Pruebas Iniciales

### 6.1 Acceder a la aplicación

1. Ir a tu URL de Netlify: `https://tu-sitio.netlify.app`
2. Deberías ver pantalla de login
3. Email: `catalina.ropero@gmail.com`
4. Contraseña: (cualquiera, es demo local)
5. Click **Ingresar**

### 6.2 Probar funcionalidad básica

**Dashboard:**
- [ ] Ver métricas (Convocatorias: 0)
- [ ] Ver fecha última búsqueda

**Búsqueda Manual:**
- [ ] Ingresar palabra clave: "cursos virtuales"
- [ ] Click **Buscar Ahora**
- [ ] Deberías ver resultados simulados

**Palabras Clave:**
- [ ] Ver lista precargada (56 palabras)
- [ ] Agregar nueva palabra: "Test"
- [ ] Editar y eliminar

**Configuración:**
- [ ] Ver valores por defecto
- [ ] Modificar presupuesto mínimo
- [ ] Click **Guardar Configuración**

### 6.3 Probar APIs Serverless

Abrir consola del navegador (F12) y ejecutar:

```javascript
// Test función secopSearch
fetch('/.netlify/functions/secopSearch', {
  method: 'POST',
  body: JSON.stringify({
    palabrasClave: ['cursos virtuales'],
    presupuestoMin: 100000000,
    presupuestoMax: 3000000000
  })
})
.then(r => r.json())
.then(d => console.log(d));
```

Deberías ver respuesta con procesos simulados.

---

## PASO 7: Configurar Notificaciones por Email

### 7.1 Probar envío de email

En la consola del navegador:

```javascript
fetch('/.netlify/functions/sendNotification', {
  method: 'POST',
  body: JSON.stringify({
    destinatario: 'catalina.ropero@gmail.com',
    asunto: 'Test SECOP Intelligence',
    tipo: 'NUEVA_OPORTUNIDAD',
    datos: {
      numero: 'SECOP-2026-TEST',
      presupuesto: 500000000,
      afinidad: 95
    }
  })
})
.then(r => r.json())
.then(d => console.log(d));
```

Verificar que el email llega a la bandeja (puede tardar 1-2 minutos).

### 7.2 Configurar horario de notificaciones

En la app:
1. **Configuración**
2. Horario notificaciones: `12:00`
3. Correo: `tu-email@empresa.com`
4. Marcar **Activar notificaciones automáticas**
5. **Guardar Configuración**

---

## PASO 8: Integración con Google Drive (Opcional pero Recomendado)

### 8.1 Crear carpeta en Google Drive

1. Ir a https://drive.google.com
2. Nuevo → Carpeta
3. Nombre: "Convocatorias SECOP"
4. Crear
5. Abrir carpeta → copiar ID de URL (después de `/folders/`)
6. Guardar como `GOOGLE_DRIVE_FOLDER_ID` en Netlify

### 8.2 Autorizar acceso a Google Drive

1. Primera vez que se intente sincronizar:
   - La app pedirá autenticación de Google
   - Click en el botón de autorización
   - Permitir acceso a Google Drive
   - Los documentos se sincronizarán automáticamente

### 8.3 Estructura automática creada

```
Convocatorias SECOP/
├── 2024/
│   ├── 06/
│   │   ├── SECOP-2026-001/
│   │   │   ├── Pliegos.pdf
│   │   │   ├── Estudios_Previos.pdf
│   │   │   ├── Adendas/
│   │   │   ├── Anexos/
│   │   │   └── Reporte_IA.json
```

---

## PASO 9: Monitoreo y Mantenimiento

### 9.1 Revisar logs en Netlify

**Para ver errores:**
1. Dashboard → **Functions**
2. Seleccionar función
3. **Invocations** → ver logs
4. O ver **Recent builds** para errores de deploy

### 9.2 Configurar alertas

1. Settings → **Notifications**
2. **Add notification**
3. Evento: "Deploy failed"
4. Destinatario: tu-email@empresa.com
5. **Create**

### 9.3 Limpiar almacenamiento

Netlify tiene límites de funciones. Si ves errores:
1. Eliminar builds antiguos
2. Optimizar función de búsqueda
3. Implementar caché

---

## PASO 10: Optimizaciones para Producción

### 10.1 Mejorar rendimiento

**En `netlify.toml`:**

```toml
[build]
  command = "npm ci && npm run build"  # Usar ci en lugar de install
  
[functions]
  node_bundler = "esbuild"
  memory = 512
  timeout = 30
```

### 10.2 Habilitar caching

**En `netlify.toml`:**

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Cache-Control = "public, max-age=3600"

[[headers]]
  for = "/secop-intelligence.html"
  [headers.values]
    Cache-Control = "no-cache, must-revalidate"
```

### 10.3 Configurar CORS correctamente

En `netlify.toml`:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Access-Control-Allow-Origin = "https://tu-dominio.com"
    Access-Control-Allow-Methods = "GET, POST, OPTIONS"
```

---

## PASO 11: Automatización de Búsquedas

### 11.1 Usar Netlify Scheduled Functions (Beta)

En `netlify.toml`:

```toml
[[scheduled_functions]]
  function = "secopSearch"
  expression = "0 */4 * * *"  # Cada 4 horas
```

### 11.2 Alternativa: Usar servicio externo

Si necesitas más control, usar:
- **GitHub Actions** para ejecutar búsquedas
- **Zapier / Make** para automatizaciones
- **AWS EventBridge** con Netlify

Ejemplo con GitHub Actions (`.github/workflows/search.yml`):

```yaml
name: Search SECOP II
on:
  schedule:
    - cron: '0 */4 * * *'  # Cada 4 horas
jobs:
  search:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger search
        run: |
          curl -X POST \
            https://tu-sitio.netlify.app/.netlify/functions/secopSearch \
            -H "Content-Type: application/json" \
            -d '{"palabrasClave":["cursos virtuales"]}'
```

---

## 🐛 Troubleshooting de Despliegue

### Error: "Build failed"

**Solución:**
1. Revisar logs: Dashboard → **Deploys** → click en deploy fallido
2. Verificar que `package.json` está en raíz
3. Verificar que `netlify.toml` es válido
4. Verificar dependencias: `npm install`

### Error: "Functions not running"

**Solución:**
1. Verificar que `netlify/functions/` existe
2. Revisar nombre de funciones (deben coincidir con archivos)
3. Verificar sintaxis de JavaScript
4. Ver logs: **Functions** → **Invocations**

### Error: "Enviroment variables not found"

**Solución:**
1. Ir a **Settings → Build & deploy → Environment**
2. Verificar que variables están listadas
3. Hacer nuevo deploy: **Deploys** → **Trigger deploy**
4. En local, crear archivo `.env` para testing

### Error: "Email no se envía"

**Solución:**
1. Verificar credenciales de email en variables
2. Para Gmail: usar contraseña de aplicación, no contraseña de cuenta
3. Revisar logs de la función `sendNotification`
4. Verificar que el email no está en spam

### Error: "Google Drive sync falla"

**Solución:**
1. Verificar que `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` son correctos
2. Verificar que Google Drive API está habilitada
3. Verificar que `GOOGLE_DRIVE_FOLDER_ID` es correcto
4. Autorizar nuevamente acceso a Google en la app

### El site está muy lento

**Solución:**
1. Revisar tamaño de funciones: `netlify/functions/` no debe tener archivos >200MB
2. Implementar caché de resultados
3. Usar CDN de Netlify (automático)
4. Optimizar búsquedas SECOP para ser más rápidas

---

## ✅ Checklist Post-Deployment

Después de desplegar, verifica:

- [ ] Sitio accesible en URL pública
- [ ] Login funciona correctamente
- [ ] Dashboard carga sin errores
- [ ] Búsqueda manual devuelve resultados
- [ ] Botones de agregar/editar funcionan
- [ ] Configuración se guarda
- [ ] Emails se envían correctamente
- [ ] Logs en Netlify no muestran errores
- [ ] Google Drive sincroniza documentos
- [ ] Variables de entorno están protegidas
- [ ] CORS está configurado correctamente
- [ ] Sitio es responsive en móvil

---

## 📞 Soporte y Recursos

### Documentación oficial

- [Netlify Docs](https://docs.netlify.com/)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [OpenAI API Docs](https://platform.openai.com/docs/)
- [Google Drive API](https://developers.google.com/drive/api)

### Comunidad

- [Netlify Community](https://community.netlify.com/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/netlify)
- [GitHub Issues](https://github.com/netlify/cli/issues)

### Contacto

- **Email:** soporte@connectyourknowledge.com
- **Teléfono:** +57 (1) XXXX-XXXX
- **Website:** https://cyk.com.co/

---

## 📝 Notas Importantes

1. **Seguridad:**
   - Nunca subir `.env` a GitHub
   - Usar secrets de Netlify para credenciales
   - Cambiar contraseña de SECOP II regularmente
   - Revisar accesos de Google Drive

2. **Costos:**
   - Netlify: Gratuito para sites estáticos
   - Funciones: 125,000 invocaciones/mes gratis
   - OpenAI: Paga por uso ($ dependiendo uso)
   - Google Drive: Gratis hasta 15 GB

3. **Límites:**
   - Funciones Netlify: máx 10 segundos
   - Archivo máx tamaño: 50 MB
   - Memoria función: 512 MB por defecto
   - Bandwidth: ilimitado

4. **Escalabilidad:**
   - Si necesitas más, considerar migrar a:
     - Vercel
     - AWS Lambda
     - Heroku
     - DigitalOcean Functions

---

**¡Tu aplicación está lista para producción! 🎉**

Fecha: Junio 2024
Versión: 1.0
Última actualización: Junio 24, 2024
