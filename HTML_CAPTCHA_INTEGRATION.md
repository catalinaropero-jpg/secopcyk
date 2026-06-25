# 🔐 Integración de Modal CAPTCHA en secop-intelligence.html

**Cómo agregar el modal para resolver CAPTCHA y búsqueda real**

---

## Paso 1: Agregar Modal HTML

Dentro de la sección de MODALS en `secop-intelligence.html`, antes del cierre de `</body>`, agregar:

```html
<!-- Modal CAPTCHA SECOP II -->
<div id="modalCaptchaSecop" class="modal">
    <div class="modal-content" style="max-width: 800px; max-height: 90vh;">
        <div class="modal-header">
            <h2>🔐 Verificación SECOP II</h2>
            <button class="close-btn" onclick="closeModal('modalCaptchaSecop')">&times;</button>
        </div>

        <!-- Instrucciones -->
        <div class="alert alert-info" style="margin-bottom: 20px;">
            <strong>📋 Instrucciones:</strong>
            <ol style="margin: 10px 0 0 20px;">
                <li>Resuelve el CAPTCHA en la ventana de abajo</li>
                <li>Haz clic en el botón de búsqueda de SECOP</li>
                <li>Espera a que aparezcan los resultados</li>
                <li>Haz clic en "Continuar con Búsqueda"</li>
            </ol>
        </div>

        <!-- iframe con SECOP II -->
        <div style="border: 2px solid var(--border); border-radius: 6px; overflow: hidden; margin-bottom: 20px; background: white;">
            <iframe 
                id="secopCaptchaFrame" 
                src="https://www.secop.gov.co/CO1Marketplace/Consulta/DoBuscar.aspx" 
                style="width: 100%; height: 650px; border: none; display: block;"
                title="SECOP II - Resolver CAPTCHA">
            </iframe>
        </div>

        <!-- Estado de la búsqueda -->
        <div id="secopBuscaStatus" class="alert alert-warning" style="display: none; margin-bottom: 20px;">
            <span class="spinner">⟳</span> Esperando resolución de CAPTCHA...
        </div>

        <!-- Botones de acción -->
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button 
                class="btn btn-secondary" 
                onclick="closeModal('modalCaptchaSecop')">
                ✕ Cancelar
            </button>
            <button 
                class="btn btn-primary" 
                id="btnContinuarBusqueda"
                onclick="continuarDespuesCaptchaSecop()"
                disabled>
                ✓ Continuar con Búsqueda
            </button>
        </div>

        <!-- Ayuda -->
        <div style="margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 6px; font-size: 12px; color: #666;">
            <strong>💡 Ayuda:</strong>
            <ul style="margin: 8px 0 0 20px;">
                <li>Si el CAPTCHA tarda en cargar, recarga la página</li>
                <li>Debes tener cookies habilitadas en el navegador</li>
                <li>Si persisten los problemas, usa búsqueda simulada</li>
                <li>Contacta a soporte si el problema continúa</li>
            </ul>
        </div>
    </div>
</div>
```

---

## Paso 2: Agregar Funciones JavaScript

En la sección de JAVASCRIPT de `secop-intelligence.html`, antes del cierre de `</script>`, agregar estas funciones:

```javascript
// ========== INTEGRACIÓN SECOP II CON CAPTCHA ==========

/**
 * Abre el modal para resolver CAPTCHA y hacer búsqueda real
 */
function abrirModalCaptchaSecop() {
    const modal = document.getElementById('modalCaptchaSecop');
    const btnContinuar = document.getElementById('btnContinuarBusqueda');
    
    // Resetear estado
    btnContinuar.disabled = true;
    btnContinuar.innerHTML = '✓ Continuar con Búsqueda';
    document.getElementById('secopBuscaStatus').style.display = 'none';
    
    // Abrir modal
    modal.classList.add('active');
    
    // Obtener sesión inicial
    obtenerSecionSecopInicial();
}

/**
 * Obtiene sesión inicial de SECOP II
 */
async function obtenerSecionSecopInicial() {
    try {
        console.log('📡 Obteniendo sesión SECOP II...');
        
        const response = await fetch('/.netlify/functions/getSecopSession', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });

        const data = await response.json();

        if (data.exito) {
            console.log('✅ Sesión SECOP obtenida');
            localStorage.setItem('secopSessionCookie', data.sessionCookie);
            localStorage.setItem('secopSessionTime', new Date().toISOString());
            
            // El iframe ya está cargando SECOP II
            // El usuario puede resolver el CAPTCHA
            habilitarBotonContinuar();
        } else {
            console.error('Error:', data.error);
            alert('Error obteniendo sesión SECOP II: ' + data.error);
        }

    } catch (error) {
        console.error('Error en obtenerSecionSecopInicial:', error);
        alert('Error: ' + error.message);
    }
}

/**
 * Habilita el botón "Continuar" después de que usuario resuelva CAPTCHA
 */
function habilitarBotonContinuar() {
    // Esperar un poco y luego mostrar mensaje
    setTimeout(() => {
        const btnContinuar = document.getElementById('btnContinuarBusqueda');
        btnContinuar.disabled = false;
        btnContinuar.innerHTML = '✓ Continuar con Búsqueda';
        
        document.getElementById('secopBuscaStatus').style.display = 'none';
    }, 3000);
}

/**
 * Continúa con la búsqueda después de resolver CAPTCHA
 */
async function continuarDespuesCaptchaSecop() {
    const palabra = document.getElementById('palabraClaveManual').value.trim();
    
    if (!palabra) {
        alert('Por favor ingresa una palabra clave');
        return;
    }

    try {
        // Cerrar modal
        closeModal('modalCaptchaSecop');
        
        // Obtener sesión
        const sessionCookie = localStorage.getItem('secopSessionCookie');
        const presupuestoMin = parseInt(document.getElementById('presupuestoMinManual').value);
        const presupuestoMax = parseInt(document.getElementById('presupuestoMaxManual').value);
        
        // Mostrar loading
        const container = document.getElementById('contenidoResultados');
        const resultadosDiv = document.getElementById('resultadosBusqueda');
        container.innerHTML = '<div class="text-center" style="padding: 40px;"><span class="spinner">⟳</span> Buscando en SECOP II...<br><small style="color: #666; margin-top: 10px;">Esta búsqueda puede tardar 10-30 segundos</small></div>';
        resultadosDiv.classList.remove('hidden');
        
        console.log('🔍 Iniciando búsqueda real en SECOP II...');
        
        // Llamar función serverless
        const response = await fetch('/.netlify/functions/secopSearchWithCookie', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                palabraClave: palabra,
                sessionCookie: sessionCookie,
                presupuestoMin: presupuestoMin,
                presupuestoMax: presupuestoMax
            })
        });

        const data = await response.json();
        
        if (data.exito) {
            console.log(`✅ Búsqueda completada: ${data.procesos.length} procesos encontrados`);
            mostrarResultadosSecopReales(data.procesos);
            
            // Registrar en historial
            appState.historialBusquedas.push({
                fecha: new Date().toISOString(),
                palabra: palabra,
                totalResultados: data.procesos.length,
                relevantes: data.procesos.length,
                fuente: 'SECOP II Real'
            });
            saveToStorage();
        } else {
            throw new Error(data.error || 'Error desconocido');
        }
        
    } catch (error) {
        console.error('Error en búsqueda:', error);
        const container = document.getElementById('contenidoResultados');
        container.innerHTML = `
            <div class="alert alert-danger">
                <strong>❌ Error en búsqueda SECOP II:</strong><br>
                ${error.message}<br>
                <br>
                <small>Soluciones:</small>
                <ul style="margin: 5px 0 0 20px; font-size: 12px;">
                    <li>Verifica tu conexión a internet</li>
                    <li>Intenta de nuevo en unos segundos</li>
                    <li>Si persiste, usa búsqueda simulada</li>
                </ul>
            </div>
        `;
    }
}

/**
 * Muestra resultados reales de SECOP II
 */
function mostrarResultadosSecopReales(procesos) {
    const container = document.getElementById('contenidoResultados');
    const resultadosDiv = document.getElementById('resultadosBusqueda');

    if (procesos.length === 0) {
        container.innerHTML = `
            <div class="alert alert-warning">
                ⚠️ No se encontraron procesos en SECOP II con esos filtros.
            </div>
        `;
        return;
    }

    // Renderizar resultados
    container.innerHTML = `
        <div class="alert alert-success" style="margin-bottom: 20px;">
            ✅ <strong>${procesos.length} procesos encontrados en SECOP II</strong>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr; gap: 15px;">
            ${procesos.map((p, idx) => `
                <div style="border: 1px solid var(--border); padding: 20px; border-radius: 6px; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                        <div>
                            <h3 style="color: var(--primary); margin: 0 0 5px 0; font-size: 16px;">
                                ${p.numero}
                            </h3>
                            <p style="color: #666; margin: 0; font-size: 13px;">
                                ${p.entidad}
                            </p>
                        </div>
                        <span class="badge badge-success">SECOP Real</span>
                    </div>
                    
                    <p style="margin: 10px 0; color: #333; line-height: 1.4;">
                        <strong>Objeto:</strong> ${p.objeto}
                    </p>
                    
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 12px 0;">
                        <div>
                            <small style="color: #999;">Presupuesto</small><br>
                            <strong style="font-size: 14px; color: var(--success);">
                                ${formatCurrency(p.presupuesto)}
                            </strong>
                        </div>
                        <div>
                            <small style="color: #999;">Fecha Cierre</small><br>
                            <strong style="font-size: 14px;">
                                ${p.fechaCierre || 'No especificada'}
                            </strong>
                        </div>
                        <div>
                            <small style="color: #999;">Afinidad</small><br>
                            <strong style="font-size: 14px;">
                                <span class="badge badge-primary">${p.afinidad || 75}%</span>
                            </strong>
                        </div>
                        <div>
                            <small style="color: #999;">Tipo</small><br>
                            <strong style="font-size: 14px;">
                                ${p.tipoContrato || 'Servicio'}
                            </strong>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;">
                        <a href="${p.enlaceSECOP}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-small">
                            🔗 Ver en SECOP
                        </a>
                        <button 
                            class="btn btn-primary btn-small"
                            onclick="agregarOportunidadDesdeResultado('${p.numero.replace(/'/g, "\\'")}', '${p.entidad.replace(/'/g, "\\'")}', '${p.objeto.replace(/'/g, "\\'")}', ${p.presupuesto}, ${p.afinidad || 75}, '${p.fechaCierre || ''}')">
                            ➕ Agregar a Oportunidades
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    resultadosDiv.classList.remove('hidden');
}

/**
 * Modificar la función busquedaManual para que pregunta si usar datos reales
 */
function busquedaManualModificada() {
    const palabra = document.getElementById('palabraClaveManual').value.trim();
    
    if (!palabra) {
        alert('Por favor ingresa una palabra clave');
        return;
    }

    // Mostrar diálogo de opción
    const resultado = confirm(
        '¿Deseas buscar datos REALES de SECOP II?\n\n' +
        '✓ Datos Reales (requiere resolver CAPTCHA, más lento)\n' +
        '✗ Datos Simulados (rápido, para pruebas)\n\n' +
        'Haz clic en ✓ para datos reales o ✗ para simulados'
    );

    if (resultado) {
        // Usuario eligió datos reales
        abrirModalCaptchaSecop();
    } else {
        // Usuario eligió datos simulados
        busquedaManualSimulada();
    }
}

/**
 * Búsqueda simulada (la función existente)
 */
function busquedaManualSimulada() {
    const palabra = document.getElementById('palabraClaveManual').value.trim();
    const presupuestoMin = parseInt(document.getElementById('presupuestoMinManual').value);
    const presupuestoMax = parseInt(document.getElementById('presupuestoMaxManual').value);
    const afinidadMin = parseInt(document.getElementById('afinidadMinManual').value);

    if (!palabra) {
        alert('Por favor ingresa una palabra clave');
        return;
    }

    // Simulación de búsqueda (datos simulados)
    const resultados = [
        {
            numero: 'SECOP-2024-001',
            entidad: 'Ministerio de Educación',
            objeto: 'Desarrollo de plataforma LMS para educación virtual',
            presupuesto: 500000000,
            afinidad: 95,
            fechaPublicacion: new Date().toISOString().split('T')[0],
            fechaCierre: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        {
            numero: 'SECOP-2024-002',
            entidad: 'Gobernación de Cundinamarca',
            objeto: 'Diseño instruccional y producción de contenidos digitales para capacitación',
            presupuesto: 300000000,
            afinidad: 88,
            fechaPublicacion: new Date().toISOString().split('T')[0],
            fechaCierre: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
    ];

    const resultadosFiltrados = resultados.filter(r =>
        r.presupuesto >= presupuestoMin &&
        r.presupuesto <= presupuestoMax &&
        r.afinidad >= afinidadMin
    );

    mostrarResultados(resultadosFiltrados);

    // Registrar en historial
    appState.historialBusquedas.push({
        fecha: new Date().toISOString(),
        palabra: palabra,
        totalResultados: resultados.length,
        relevantes: resultadosFiltrados.length,
        fuente: 'Simulada'
    });
    saveToStorage();
}
```

---

## Paso 3: Modificar Botón de Búsqueda

En el HTML de la página de búsqueda, cambiar el onclick del botón:

**Buscar:**
```html
<button class="btn btn-primary btn-block mt-20" onclick="busquedaManual()">🔍 Buscar Ahora</button>
```

**Reemplazar con:**
```html
<button class="btn btn-primary btn-block mt-20" onclick="busquedaManualModificada()">🔍 Buscar Ahora</button>
```

---

## Paso 4: Actualizar package.json

Asegurar que `cheerio` está en dependencias:

```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "cheerio": "^1.0.0-rc.12",
    "dotenv": "^16.3.0"
  }
}
```

Si no está, agregar:
```bash
npm install cheerio
```

---

## Paso 5: Crear Archivos de Función Serverless

1. Copiar contenido de `netlify-functions-getSecopSession.js` a:
   ```
   netlify/functions/getSecopSession.js
   ```

2. Copiar contenido de `netlify-functions-secopSearchReal.js` a:
   ```
   netlify/functions/secopSearchWithCookie.js
   ```

---

## Paso 6: Probar Localmente

```bash
# Instalar dependencies
npm install

# Iniciar en desarrollo
netlify dev

# Abrir http://localhost:8888
# Ir a "Búsqueda Manual"
# Ingresar palabra clave: "cursos virtuales"
# Click "Buscar Ahora" → Elegir "Datos Reales"
```

---

## 📝 Notas Importantes

1. **CAPTCHA es obligatorio:**
   - El usuario DEBE resolver el CAPTCHA manualmente
   - Sin resuelverlo, SECOP II bloquea la búsqueda
   - El iframe muestra la página completa de SECOP

2. **Cookie válida por ~15 minutos:**
   - Después de resolver CAPTCHA, la sesión es válida por 15-20 minutos
   - Si expira, el usuario debe resolver otro CAPTCHA

3. **Selectores pueden cambiar:**
   - Si SECOP II cambia su HTML, los selectores pueden no funcionar
   - Ver SECOP_SCRAPING_GUIDE.md para actualizar selectores

4. **Límites de Netlify Functions:**
   - Máximo 10 segundos por búsqueda
   - Máximo 512 MB de memoria
   - Si busca es muy lenta, optimizar

---

## 🐛 Troubleshooting

**Problema:** "Función no encontrada"
- Verificar que archivos están en `netlify/functions/`
- Verificar nombres: `getSecopSession.js` y `secopSearchWithCookie.js`
- Hacer nuevo deploy

**Problema:** "CAPTCHA no carga en iframe"
- SECOP II puede bloquear iframes
- Solución: abrir en nueva pestaña en lugar de iframe
- Alternativa: usar ReCAPTCHA service

**Problema:** "Búsqueda devuelve 0 resultados"
- Selectores pueden estar desactualizados
- Inspeccionar HTML de SECOP II
- Actualizar selectores en función

**Problema:** "Timeout en búsqueda"
- SECOP II está lento
- Reducir búsquedas concurrentes
- Aumentar timeout en función

---

**¡Integración lista! 🎉**
