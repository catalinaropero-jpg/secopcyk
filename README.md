# 🔍 SECOP II Intelligence - Sistema de Inteligencia Comercial

**Sistema automatizado para identificación, monitoreo y análisis de oportunidades de contratación pública en SECOP II**

Desarrollado por: **Connect Your Knowledge**

---

## 📋 Índice

1. [Características](#características)
2. [Requisitos Previos](#requisitos-previos)
3. [Instalación](#instalación)
4. [Configuración](#configuración)
5. [Despliegue en Netlify](#despliegue-en-netlify)
6. [Uso del Sistema](#uso-del-sistema)
7. [API Endpoints](#api-endpoints)
8. [Estructura del Proyecto](#estructura-del-proyecto)
9. [Troubleshooting](#troubleshooting)
10. [Soporte](#soporte)

---

## ✨ Características

### 🔎 Búsqueda Inteligente
- Búsqueda automática con palabras clave configurables
- Filtros avanzados (presupuesto, afinidad, fechas)
- Eliminación automática de duplicados
- Exclusión de categorías no relevantes

### 🤖 Análisis Inteligente con IA
- Calificación de afinidad (0-100%)
- Evaluación de compatibilidad automática
- Análisis de riesgos y complejidad
- Recomendación automática (PARTICIPAR / NO PARTICIPAR)

### 📊 Dashboard Ejecutivo
- Métricas en tiempo real
- Procesos próximos a vencer
- Afinidad promedio
- Presupuesto total identificado

### 📋 Gestión de Oportunidades
- Estados configurables (Nueva, En revisión, Interesante, etc.)
- Seguimiento inteligente de procesos
- Historial completo de cambios
- Auditoría de acciones

### 🔔 Notificaciones Inteligentes
- Alertas de nuevas oportunidades (cada 4 horas)
- Resumen diario automático (12:00 PM)
- Resumen ejecutivo semanal
- Notificaciones de cambios detectados

### 📁 Gestión Documental
- Descarga automática de pliegos
- Sincronización con Google Drive
- Estructura de carpetas organizada por año/mes/proceso
- Generación automática de reportes

### 📈 Reportes y Exportaciones
- Exportación a Excel con todas las oportunidades
- Reportes JSON para integración
- PDF con análisis ejecutivo
- Historial de búsquedas y cambios

---

## 🔧 Requisitos Previos

Antes de comenzar, asegúrate de tener:

- **Node.js** (v18+)
- **npm** (v9+)
- **Git**
- **Cuenta de Netlify** (gratuita)
- **Credenciales de OpenAI** (API key)
- **Acceso a SECOP II** (usuario y contraseña)
- **Cuenta de Google** (para Google Drive)
- **Cuenta de correo** (para notificaciones)

---

## 💻 Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/connectyourknowledge/secop-ii-intelligence.git
cd secop-ii-intelligence
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:

```env
OPENAI_API_KEY=sk-your-key
SECOP_USER=901335221
SECOP_PASSWORD=tu-password
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-app-password
```

---

## ⚙️ Configuración

### Configuración en Netlify

1. **Conectar repositorio a Netlify**
   - Ir a https://app.netlify.com/
   - Click en "New site from Git"
   - Seleccionar GitHub / GitLab / Bitbucket
   - Autorizar a Netlify
   - Seleccionar tu repositorio

2. **Configurar Variables de Entorno**
   - En Netlify: Settings → Build & deploy → Environment
   - Agregar variables (no copiar .env):
     ```
     OPENAI_API_KEY=sk-...
     SECOP_USER=901335221
     SECOP_PASSWORD=...
     EMAIL_USER=...
     EMAIL_PASSWORD=...
     GOOGLE_CLIENT_ID=...
     GOOGLE_CLIENT_SECRET=...
     ```

3. **Configurar Build Settings**
   - Base directory: (dejar vacío)
   - Build command: `npm install && npm run build`
   - Publish directory: `.`
   - Functions directory: `netlify/functions`

### Configuración de OpenAI

1. Ir a https://platform.openai.com/account/api-keys
2. Crear nueva API key
3. Copiar la clave
4. Guardar en variable `OPENAI_API_KEY` en Netlify

### Configuración de Google Drive

1. Ir a Google Cloud Console: https://console.cloud.google.com/
2. Crear nuevo proyecto
3. Activar Google Drive API
4. Crear credenciales OAuth 2.0
5. Guardar Client ID y Client Secret

---

## 🚀 Despliegue en Netlify

### Opción 1: Desde GitHub (Recomendado)

1. Hacer push del código a GitHub
2. Conectar repositorio en Netlify
3. Netlify desplegará automáticamente

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### Opción 2: Despliegue Manual

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Conectar tu cuenta
netlify login

# Desplegar
netlify deploy
```

### Opción 3: Drag & Drop

1. Ir a https://app.netlify.com/
2. Arrastrar la carpeta del proyecto
3. Configurar variables de entorno

---

## 📖 Uso del Sistema

### 1. Iniciar Sesión

- Email: `tu-email@example.com`
- Contraseña: (la que configuraste)

### 2. Dashboard Principal

- Visualizar métricas en tiempo real
- Ver procesos próximos a vencer
- Acceder a últimas oportunidades

### 3. Búsqueda Manual

1. Ir a **Búsqueda Manual**
2. Ingresar palabra clave
3. Configurar filtros (presupuesto, afinidad)
4. Click en **Buscar Ahora**
5. Revisar resultados
6. Agregar oportunidades relevantes

### 4. Gestión de Oportunidades

1. Ir a **Oportunidades**
2. Ver lista de procesos
3. Cambiar estado (Nueva → En revisión → Decidimos participar, etc.)
4. Editar detalles
5. Marcar para seguimiento

### 5. Palabras Clave

1. Ir a **Palabras Clave**
2. Agregar nuevas palabras
3. Editar existentes
4. Activar/Desactivar para búsquedas

### 6. Monitoreo

1. Ir a **Monitoreo**
2. Ver procesos en seguimiento
3. El sistema verifica cambios cada hora
4. Notificaciones automáticas de cambios

### 7. Configuración

1. Ir a **Configuración**
2. Ajustar presupuesto min/max
3. Configurar afinidad mínima
4. Seleccionar frecuencia de búsquedas
5. Horario de notificaciones

---

## 🔌 API Endpoints

### Búsqueda SECOP

```bash
POST /.netlify/functions/secopSearch
Content-Type: application/json

{
  "palabrasClave": ["cursos virtuales", "plataforma LMS"],
  "presupuestoMin": 100000000,
  "presupuestoMax": 3000000000,
  "afinidadMin": 70,
  "fechaPublicacionDesde": "2024-06-20"
}
```

**Respuesta:**
```json
{
  "exito": true,
  "totalProcesos": 5,
  "procesos": [
    {
      "numero": "SECOP-2026-001",
      "entidad": "Ministerio de Educación",
      "objeto": "Desarrollo de plataforma LMS",
      "presupuesto": 500000000,
      "fechaCierre": "2024-07-20"
    }
  ]
}
```

### Análisis IA

```bash
POST /.netlify/functions/aiAnalyzer
Content-Type: application/json

{
  "numero": "SECOP-2026-001",
  "objeto": "Desarrollo de plataforma LMS",
  "descripcion": "Se requiere una plataforma virtual...",
  "presupuesto": 500000000
}
```

**Respuesta:**
```json
{
  "exito": true,
  "analisis": {
    "afinidad": 95,
    "serviciosRequeridos": ["Desarrollo de plataforma", "Diseño instruccional"],
    "complejidad": "Alta",
    "recomendacion": "PARTICIPAR"
  }
}
```

### Monitoreo de Proceso

```bash
POST /.netlify/functions/monitorProcess
Content-Type: application/json

{
  "numeroProceso": "SECOP-2026-001"
}
```

### Enviar Notificación

```bash
POST /.netlify/functions/sendNotification
Content-Type: application/json

{
  "destinatario": "email@example.com",
  "asunto": "Nueva Oportunidad SECOP",
  "tipo": "NUEVA_OPORTUNIDAD",
  "datos": {
    "numero": "SECOP-2026-001",
    "presupuesto": 500000000,
    "afinidad": 95
  }
}
```

### Generar Reporte

```bash
POST /.netlify/functions/generateReport
Content-Type: application/json

{
  "tipo": "EXCEL",
  "oportunidades": [...]
}
```

---

## 📁 Estructura del Proyecto

```
secop-ii-intelligence/
├── secop-intelligence.html          # Frontend (UI completa)
├── netlify/
│   └── functions/
│       ├── secopSearch.js          # Búsqueda en SECOP II
│       ├── aiAnalyzer.js           # Análisis con OpenAI
│       ├── monitorProcess.js       # Monitoreo de cambios
│       ├── sendNotification.js     # Envío de notificaciones
│       ├── generateReport.js       # Generación de reportes
│       └── gdriveSyncer.js         # Sincronización con Google Drive
├── package.json                     # Dependencias
├── netlify.toml                     # Configuración Netlify
├── .env.example                     # Ejemplo de variables
├── .gitignore                       # Archivos ignorados
└── README.md                        # Este archivo
```

---

## 🐛 Troubleshooting

### Error: "OPENAI_API_KEY not found"

**Solución:**
- Verificar que `OPENAI_API_KEY` está configurada en Netlify
- No debe estar en `.env` de producción
- En local, crear `.env` con la clave

### Error: "SECOP II no accesible"

**Solución:**
- Verificar credenciales (usuario/contraseña)
- Verificar que SECOP II no tiene CAPTCHA activo
- Implementar servicio manual de CAPTCHA si es necesario
- Usar VPN si hay restricciones IP

### Error: "Email no se envía"

**Solución:**
- Verificar credenciales de email
- Para Gmail: usar "contraseña de aplicación" no la contraseña de cuenta
- Habilitar "Acceso para aplicaciones menos seguras"
- Verificar que el email está en variables de Netlify

### Error: "Función serverless timeout"

**Solución:**
- Las funciones Netlify tienen límite de 10s
- Optimizar búsquedas para ser más rápidas
- Implementar caché de resultados
- Usar procesamiento asincrónico

### No se guardan los datos

**Solución:**
- El sistema usa localStorage del navegador
- Verificar que localStorage está habilitado
- Los datos persisten en el navegador actual
- Para persistencia en servidor, necesitas backend adicional

---

## 📧 Configuración de Notificaciones por Email

### Gmail

1. Ir a https://myaccount.google.com/security
2. Habilitar autenticación de 2 factores
3. Ir a "Contraseñas de aplicaciones"
4. Generar contraseña de aplicación para "Mail"
5. Copiar la contraseña generada a `EMAIL_PASSWORD`

### Outlook/Hotmail

```env
EMAIL_SERVICE=outlook
EMAIL_USER=tu-email@outlook.com
EMAIL_PASSWORD=tu-contraseña
```

### SendGrid (Recomendado para producción)

```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=SG.xxxxx
EMAIL_USER=noreply@tu-dominio.com
```

---

## 🔐 Seguridad

### Checklist de Seguridad

- [ ] Cambiar contraseña de SECOP II
- [ ] Guardar API keys en Netlify, NO en .env
- [ ] Usar contraseñas de aplicación para emails
- [ ] Configurar CORS correctamente
- [ ] Revisar acceso a Google Drive
- [ ] Implementar rate limiting
- [ ] Usar HTTPS en producción
- [ ] Auditar logs regularmente

---

## 📞 Soporte

### Para issues técnicos

1. Revisar la sección Troubleshooting
2. Revisar logs en Netlify (Functions → Logs)
3. Contactar a soporte de Netlify
4. Contactar a Connect Your Knowledge

### Documentación adicional

- Netlify Docs: https://docs.netlify.com/
- OpenAI API: https://platform.openai.com/docs/
- Google Drive API: https://developers.google.com/drive
- SECOP II: https://www.secop.gov.co/

---

## 📄 Licencia

MIT License - © 2024 Connect Your Knowledge

---

## 👥 Contribuidores

- Catalina Ropero - conectar@connectyourknowledge.com

---

**Última actualización:** Junio 2024
**Versión:** 1.0.0
**Estado:** Producción ✅
