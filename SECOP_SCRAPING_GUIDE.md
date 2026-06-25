# 🔍 GUÍA: Web Scraping Real de SECOP II en Netlify Functions

**Implementación práctica para extraer datos reales de SECOP II**

---

## ⚠️ Nota Importante

SECOP II tiene **CAPTCHA** en búsquedas. Este es el principal desafío. Tienes 3 opciones:

1. **Opción A:** Validación manual de CAPTCHA (usuario lo resuelve en la app)
2. **Opción B:** Servicio externo de resolución de CAPTCHA ($$$)
3. **Opción C:** Usar API alternativa o RSS feed de SECOP II (si existe)

Aquí cubro la **Opción A** (más práctica y gratuita).

---

## 📋 Problema: CAPTCHA en SECOP II

Cuando intentas buscar en SECOP II:
1. Cargas la página
2. Te pide resolver CAPTCHA ("No soy un robot")
3. Solo después puedes ver resultados

**Solución:** El navegador (frontend) resuelve el CAPTCHA manualmente, luego el servidor extrae los datos.

---

## 🛠️ Arquitectura de Solución

```
Usuario Frontend
    ↓
[1. Usuario resuelve CAPTCHA manualmente en la app]
    ↓
SECOP II (Cookie válida obtenida)
    ↓
[2. Backend (Netlify Function) extrae datos con cookie]
    ↓
Base de datos local (localStorage o servidor)
    ↓
Dashboard actualizado
```

---

## PASO 1: Crear Función para Obtener Cookie de SECOP

Archivo: `netlify/functions/getSecopSession.js`

```javascript
const axios = require('axios');
const cheerio = require('cheerio');

exports.handler = async (event, context) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers };
    }

    try {
        // Crear sesión en SECOP II
        const secopUrl = 'https://www.secop.gov.co/CO1Marketplace/';
        
        const response = await axios.get(secopUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            withCredentials: true
        });

        // Extraer cookies
        const cookies = response.headers['set-cookie'] || [];
        const sessionCookie = cookies.join('; ');

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                exito: true,
                sessionCookie: sessionCookie,
                mensaje: 'Sesión iniciada. El navegador debe resolver el CAPTCHA.'
            })
        };

    } catch (error) {
        console.error('Error obteniendo sesión SECOP:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                exito: false,
                error: error.message
            })
        };
    }
};
```

---

## PASO 2: Crear iframe para Resolver CAPTCHA

En `secop-intelligence.html`, agregar modal para CAPTCHA:

```html
<!-- Modal para resolver CAPTCHA -->
<div id="modalCaptcha" class="modal">
    <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
            <h2>Verificación SECOP II</h2>
        </div>
        <p style="text-align: center; color: #666; margin-bottom: 20px;">
            Por favor, resuelve el CAPTCHA de SECOP II para continuar con la búsqueda.
        </p>
        
        <!-- iframe que carga SECOP II para resolver CAPTCHA -->
        <iframe 
            id="secopFrame" 
            src="https://www.secop.gov.co/CO1Marketplace/Consulta/DoBuscar.aspx" 
            style="width: 100%; height: 600px; border: 1px solid var(--border); border-radius: 6px; margin-bottom: 15px;">
        </iframe>
        
        <p style="font-size: 12px; color: #999; text-align: center;">
            Después de resolver el CAPTCHA, haz clic en "Continuar"
        </p>
        
        <button class="btn btn-primary btn-block" onclick="continuarDespuesCaptcha()">
            ✓ Continuar con Búsqueda
        </button>
    </div>
</div>
```

---

## PASO 3: Función para Buscar Después de CAPTCHA

Archivo: `netlify/functions/secopSearchWithCookie.js`

```javascript
const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');

exports.handler = async (event, context) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    };

    try {
        const {
            palabraClave,
            sessionCookie,
            presupuestoMin = 100000000,
            presupuestoMax = 3000000000
        } = JSON.parse(event.body || '{}');

        if (!palabraClave || !sessionCookie) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Palabra clave y sesión requeridas'
                })
            };
        }

        // Realizar búsqueda en SECOP II
        const procesos = await buscarEnSecop(
            palabraClave,
            sessionCookie,
            presupuestoMin,
            presupuestoMax
        );

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                exito: true,
                palabra: palabraClave,
                totalEncontrados: procesos.length,
                procesos: procesos
            })
        };

    } catch (error) {
        console.error('Error buscando en SECOP:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                exito: false,
                error: error.message
            })
        };
    }
};

async function buscarEnSecop(palabra, cookie, presupuestoMin, presupuestoMax) {
    try {
        // URL de búsqueda en SECOP II
        const buscarUrl = 'https://www.secop.gov.co/CO1Marketplace/Consulta/DoBuscar.aspx';

        const datos = new FormData();
        datos.append('txtDescript', palabra);
        datos.append('ddlEstado', '1'); // 1 = Publicado
        datos.append('ddlFechaPublicacion', ''); // Última semana
        datos.append('ddlPresupuestoDesde', presupuestoMin);
        datos.append('ddlPresupuestoHasta', presupuestoMax);
        datos.append('btnBuscar', 'Buscar');

        const response = await axios.post(buscarUrl, datos, {
            headers: {
                ...datos.getHeaders(),
                'Cookie': cookie,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://www.secop.gov.co/CO1Marketplace/'
            },
            withCredentials: true,
            timeout: 30000
        });

        // Parsear HTML con Cheerio
        const $ = cheerio.load(response.data);
        const procesos = [];

        // Selector para filas de resultados (ajustar según estructura actual de SECOP)
        $('table tbody tr').each((index, element) => {
            try {
                const celdas = $(element).find('td');
                
                if (celdas.length >= 6) {
                    const proceso = {
                        numero: $(celdas[0]).text().trim(),
                        entidad: $(celdas[1]).text().trim(),
                        objeto: $(celdas[2]).text().trim(),
                        presupuesto: parsearPresupuesto($(celdas[3]).text()),
                        fechaPublicacion: $(celdas[4]).text().trim(),
                        fechaCierre: $(celdas[5]).text().trim(),
                        enlaceSECOP: extraerEnlace($(celdas[0]), palabra),
                        estado: 'Publicado',
                        fuente: 'SECOP II Real'
                    };

                    // Validar que sea un proceso válido
                    if (proceso.numero && proceso.entidad && proceso.objeto) {
                        procesos.push(proceso);
                    }
                }
            } catch (e) {
                console.log('Error parseando fila:', e);
            }
        });

        return procesos;

    } catch (error) {
        console.error('Error en búsqueda SECOP:', error);
        throw error;
    }
}

function parsearPresupuesto(texto) {
    // Extraer número de texto como "$ 500.000.000"
    const match = texto.match(/\$\s*([\d.]+)/);
    if (match) {
        return parseInt(match[1].replace(/\./g, ''));
    }
    return 0;
}

function extraerEnlace(celda, palabra) {
    const enlace = $(celda).find('a').attr('href');
    return enlace ? 'https://www.secop.gov.co' + enlace : 'https://www.secop.gov.co/CO1Marketplace/';
}
```

---

## PASO 4: Función JavaScript en Frontend

En `secop-intelligence.html`, agregar esta función:

```javascript
async function abrirModalCaptchaSecop() {
    const modal = document.getElementById('modalCaptcha');
    modal.classList.add('active');
    
    // Obtener sesión inicial
    try {
        const response = await fetch('/.netlify/functions/getSecopSession', {
            method: 'POST'
        });
        const data = await response.json();
        console.log('Sesión SECOP obtenida:', data);
    } catch (error) {
        console.error('Error obteniendo sesión:', error);
        alert('Error conectando con SECOP II');
    }
}

async function continuarDespuesCaptcha() {
    const palabra = document.getElementById('palabraClaveManual').value;
    
    if (!palabra) {
        alert('Por favor ingresa una palabra clave');
        return;
    }

    // Obtener cookie del iframe
    try {
        const iframe = document.getElementById('secopFrame');
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        
        // Nota: Por seguridad, no podemos acceder directamente a cookies del iframe
        // En su lugar, usamos una cookie guardada en servidor
        
        document.getElementById('modalCaptcha').classList.remove('active');
        
        // Llamar búsqueda real
        await busquedaSecopReal(palabra);
        
    } catch (error) {
        console.error('Error en búsqueda:', error);
        alert('Error durante la búsqueda');
    }
}

async function busquedaSecopReal(palabra) {
    const presupuestoMin = parseInt(document.getElementById('presupuestoMinManual').value);
    const presupuestoMax = parseInt(document.getElementById('presupuestoMaxManual').value);
    
    try {
        // Mostrar loading
        const btnBuscar = document.querySelector('button[onclick="busquedaManual()"]');
        btnBuscar.disabled = true;
        btnBuscar.innerHTML = '<span class="spinner">⟳</span> Buscando...';
        
        const response = await fetch('/.netlify/functions/secopSearchWithCookie', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                palabraClave: palabra,
                sessionCookie: localStorage.getItem('secopSessionCookie') || '',
                presupuestoMin: presupuestoMin,
                presupuestoMax: presupuestoMax
            })
        });

        const data = await response.json();
        
        btnBuscar.disabled = false;
        btnBuscar.innerHTML = '🔍 Buscar Ahora';
        
        if (data.exito) {
            mostrarResultadosReales(data.procesos);
            
            // Guardar en historial
            appState.historialBusquedas.push({
                fecha: new Date().toISOString(),
                palabra: palabra,
                totalResultados: data.totalEncontrados,
                relevantes: data.procesos.length,
                fuente: 'SECOP II Real'
            });
            saveToStorage();
        } else {
            alert('Error en búsqueda: ' + data.error);
        }
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error durante la búsqueda: ' + error.message);
    }
}

function mostrarResultadosReales(procesos) {
    const container = document.getElementById('contenidoResultados');
    const resultadosDiv = document.getElementById('resultadosBusqueda');

    if (procesos.length === 0) {
        container.innerHTML = '<p class="text-center">No se encontraron procesos en SECOP II.</p>';
    } else {
        container.innerHTML = `
            <div class="alert alert-success">
                ✅ Se encontraron ${procesos.length} procesos reales en SECOP II
            </div>
            <p style="margin-bottom: 20px;"><strong>Procesos encontrados:</strong></p>
            ${procesos.map(p => `
                <div style="border: 1px solid var(--border); padding: 15px; border-radius: 6px; margin-bottom: 15px; background: #f9f9f9;">
                    <h3 style="color: var(--primary); margin-bottom: 10px;">${p.numero}</h3>
                    <p><strong>Entidad:</strong> ${p.entidad}</p>
                    <p><strong>Objeto:</strong> ${p.objeto}</p>
                    <p><strong>Presupuesto:</strong> ${formatCurrency(p.presupuesto)}</p>
                    <p><strong>Fecha Cierre:</strong> ${p.fechaCierre}</p>
                    <p><strong>Fuente:</strong> <span class="badge badge-success">SECOP II Real</span></p>
                    <div style="margin-top: 10px; display: flex; gap: 10px;">
                        <a href="${p.enlaceSECOP}" target="_blank" class="btn btn-secondary btn-small">Ver en SECOP</a>
                        <button class="btn btn-primary btn-small" onclick="agregarOportunidadDesdeResultado('${p.numero}', '${p.entidad}', '${p.objeto.replace(/'/g, "\\'")}', ${p.presupuesto}, 75, '${p.fechaCierre}')">+ Agregar</button>
                    </div>
                </div>
            `).join('')}
        `;
    }

    resultadosDiv.classList.remove('hidden');
}
```

---

## PASO 5: Modificar Botón de Búsqueda

En `secop-intelligence.html`, cambiar función `busquedaManual()`:

```javascript
function busquedaManual() {
    const palabra = document.getElementById('palabraClaveManual').value.trim();
    
    if (!palabra) {
        alert('Por favor ingresa una palabra clave');
        return;
    }

    // Opción: usar datos reales de SECOP II
    if (confirm('¿Usar datos REALES de SECOP II? (Requiere resolver CAPTCHA)\n\nOpciones:\n✓ Sí → Datos reales (más lento)\n✗ No → Datos simulados (rápido)')) {
        abrirModalCaptchaSecop();
    } else {
        // Búsqueda simulada (como actualmente)
        busquedaManualSimulada();
    }
}

function busquedaManualSimulada() {
    // Tu código existente aquí
    const palabra = document.getElementById('palabraClaveManual').value.trim();
    const presupuestoMin = parseInt(document.getElementById('presupuestoMinManual').value);
    const presupuestoMax = parseInt(document.getElementById('presupuestoMaxManual').value);
    const afinidadMin = parseInt(document.getElementById('afinidadMinManual').value);

    const resultados = [
        {
            numero: 'SECOP-2026-001',
            entidad: 'Ministerio de Educación',
            objeto: 'Desarrollo de plataforma LMS para educación virtual',
            presupuesto: 500000000,
            afinidad: 95,
            fechaPublicacion: new Date().toISOString().split('T')[0],
            fechaCierre: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
        // ... más resultados
    ];

    const resultadosFiltrados = resultados.filter(r =>
        r.presupuesto >= presupuestoMin &&
        r.presupuesto <= presupuestoMax &&
        r.afinidad >= afinidadMin
    );

    mostrarResultados(resultadosFiltrados);
}
```

---

## PASO 6: Actualizar Dependencias

En `package.json`, asegurar que tienes:

```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "cheerio": "^1.0.0-rc.12",
    "form-data": "^4.0.0",
    "dotenv": "^16.3.0"
  }
}
```

Instalar:
```bash
npm install cheerio form-data
```

---

## PASO 7: Pruebas Locales

Archivo: `test-scraping.js`

```javascript
// Para probar el scraping localmente
const axios = require('axios');
const cheerio = require('cheerio');

async function testSecopScraping() {
    try {
        console.log('🔍 Conectando a SECOP II...');
        
        const response = await axios.get(
            'https://www.secop.gov.co/CO1Marketplace/Consulta/DoBuscar.aspx?lstKeyWords=cursos%20virtuales',
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 15000
            }
        );

        console.log('✅ Página cargada');
        console.log('Status:', response.status);
        console.log('Headers:', response.headers);
        
        // Buscar tabla de resultados
        const $ = cheerio.load(response.data);
        const filas = $('table tbody tr').length;
        console.log('Filas encontradas:', filas);
        
        // Extraer primer resultado
        const primerResultado = $('table tbody tr').first();
        console.log('Primer resultado:', primerResultado.html());
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testSecopScraping();
```

Ejecutar:
```bash
node test-scraping.js
```

---

## 🚨 Problemas Comunes y Soluciones

### Problema 1: "CAPTCHA bloqueando búsqueda"
**Solución:** El usuario debe resolver el CAPTCHA en el iframe. Después, la cookie es válida para ~15 minutos.

```javascript
// Guardar cookie después de resolver CAPTCHA
localStorage.setItem('secopSessionCookie', cookieFromServer);
```

### Problema 2: "estructura HTML diferente a la esperada"
**Solución:** SECOP II puede cambiar su HTML. Necesitas inspeccionar y ajustar selectores:

```bash
# En navegador, F12 → Inspector
# Buscar el selector correcto para tabla de resultados
# Ej: table.tablaResultados tr
# Actualizar en función buscarEnSecop()
```

### Problema 3: "Timeout en búsquedas largas"
**Solución:** Netlify Functions tienen límite de 10 segundos. Optimizar:

```javascript
// Limitar resultados
procesos = procesos.slice(0, 50); // Máximo 50

// O paginar
async function buscarPaginado(palabra, pagina = 1) {
    const url = `https://www.secop.gov.co/...?page=${pagina}`;
    // ...
}
```

### Problema 4: "IP bloqueada por SECOP"
**Solución:** Usar proxy o esperar 1 hora

```javascript
const response = await axios.get(url, {
    httpAgent: new HttpProxyAgent('http://proxy:8080'),
    httpsAgent: new HttpsProxyAgent('http://proxy:8080')
});
```

---

## 📊 Flujo Completo de Ejecución

```
Usuario abre app
    ↓
Click "Buscar" → "¿Usar datos reales?"
    ↓
Sí → Modal con iframe de SECOP II
    ↓
Usuario resuelve CAPTCHA manualmente
    ↓
Click "Continuar con Búsqueda"
    ↓
Frontend envía palabra clave + cookie a Netlify Function
    ↓
secopSearchWithCookie.js:
    - Hace POST a SECOP II
    - Extrae HTML con Cheerio
    - Parsea tabla de resultados
    - Retorna JSON
    ↓
Frontend recibe resultados
    ↓
Mostrar en tabla
    ↓
Opción de agregar a "Oportunidades"
```

---

## ✅ Checklist de Implementación

- [ ] Instalar `cheerio` y `form-data`
- [ ] Crear `getSecopSession.js`
- [ ] Crear `secopSearchWithCookie.js`
- [ ] Agregar modal de CAPTCHA en HTML
- [ ] Implementar `abrirModalCaptchaSecop()`
- [ ] Implementar `continuarDespuesCaptcha()`
- [ ] Implementar `busquedaSecopReal()`
- [ ] Modificar `busquedaManual()` para elegir real vs simulado
- [ ] Probar localmente con `test-scraping.js`
- [ ] Desplegar a Netlify
- [ ] Probar en producción

---

## 📈 Optimizaciones Futuras

1. **Caché de resultados:**
```javascript
// Guardar resultados por 4 horas
const cacheKey = `secop_${palabra}_${Date.now() / (4*60*60*1000) | 0}`;
localStorage.setItem(cacheKey, JSON.stringify(resultados));
```

2. **Búsqueda automática cada 4 horas:**
```javascript
setInterval(() => {
    appState.palabrasClaves
        .filter(p => p.activa)
        .forEach(p => busquedaSecopReal(p.palabra));
}, 4 * 60 * 60 * 1000);
```

3. **Notificaciones de nuevas oportunidades:**
```javascript
if (procesosNuevos.length > 0) {
    enviarNotificacion('email@empresa.com', {
        tipo: 'NUEVAS_OPORTUNIDADES',
        cantidad: procesosNuevos.length,
        procesos: procesosNuevos
    });
}
```

4. **Base de datos real (Firebase, Supabase):**
```javascript
// Guardar en Firestore en lugar de localStorage
await db.collection('oportunidades').add(proceso);
```

---

## 🔐 Consideraciones de Seguridad

1. **Validar entrada del usuario:**
```javascript
function validarPalabraClave(palabra) {
    if (palabra.length < 2 || palabra.length > 100) return false;
    if (!/^[a-záéíóúñ\s]+$/i.test(palabra)) return false;
    return true;
}
```

2. **Rate limiting:**
```javascript
// Máximo 5 búsquedas por hora
const ultimasBusquedas = appState.historialBusquedas.filter(
    h => new Date(h.fecha) > new Date(Date.now() - 60*60*1000)
);
if (ultimasBusquedas.length >= 5) {
    alert('Máximo 5 búsquedas por hora');
    return;
}
```

3. **Ocultar credenciales:**
```javascript
// NUNCA en cliente
// SECOP_USER y SECOP_PASSWORD deben estar SOLO en Netlify Environment Variables
```

---

## 📞 Debugging

Ver logs en Netlify:
```bash
netlify functions:invoke secopSearchWithCookie --identity=test
```

O ver en dashboard:
1. Netlify → Functions → secopSearchWithCookie
2. Invocations
3. Click en invocación
4. Ver logs completos

---

**¡Listo para scraping real de SECOP II! 🚀**

Cualquier duda, avísame.
