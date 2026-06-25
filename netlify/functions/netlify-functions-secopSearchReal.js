/**
 * NETLIFY FUNCTION: secopSearchWithCookie.js
 *
 * Busca en SECOP II usando cookie válida obtenida después de resolver CAPTCHA
 *
 * Ubicación: /netlify/functions/secopSearchWithCookie.js
 *
 * Requisitos:
 * - npm install axios cheerio form-data
 *
 * Llamada desde frontend:
 * fetch('/.netlify/functions/secopSearchWithCookie', {
 *   method: 'POST',
 *   body: JSON.stringify({
 *     palabraClave: 'cursos virtuales',
 *     sessionCookie: 'ASP.NET_SessionId=...',
 *     presupuestoMin: 100000000,
 *     presupuestoMax: 3000000000,
 *     afinidadMin: 70
 *   })
 * })
 */

const axios = require('axios');
const cheerio = require('cheerio');

exports.handler = async (event, context) => {
    // Headers CORS
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    // Manejar OPTIONS
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers };
    }

    // Solo POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Solo POST permitido' })
        };
    }

    try {
        const {
            palabraClave,
            sessionCookie,
            presupuestoMin = 100000000,
            presupuestoMax = 3000000000,
            afinidadMin = 70,
            estado = '1', // 1 = Publicado
            fechaPublicacionDesde = null
        } = JSON.parse(event.body || '{}');

        // Validar entrada
        if (!palabraClave || palabraClave.trim().length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    exito: false,
                    error: 'Palabra clave requerida'
                })
            };
        }

        if (!sessionCookie || sessionCookie.trim().length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    exito: false,
                    error: 'Sesión requerida. Por favor resuelve el CAPTCHA primero.'
                })
            };
        }

        console.log(`🔍 Buscando en SECOP II: "${palabraClave}"`);

        // Ejecutar búsqueda
        const procesos = await buscarEnSecopReal(
            palabraClave,
            sessionCookie,
            presupuestoMin,
            presupuestoMax
        );

        console.log(`✅ Encontrados ${procesos.length} procesos`);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                exito: true,
                palabra: palabraClave,
                totalEncontrados: procesos.length,
                procesos: procesos,
                timestamp: new Date().toISOString(),
                fuente: 'SECOP II Real'
            })
        };

    } catch (error) {
        console.error('❌ Error buscando en SECOP II:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                exito: false,
                error: error.message || 'Error en búsqueda',
                detalles: process.env.NODE_ENV === 'development' ? error.stack : undefined
            })
        };
    }
};

/**
 * Busca en SECOP II y extrae resultados
 */
async function buscarEnSecopReal(palabra, cookie, presupuestoMin, presupuestoMax) {
    try {
        // URL de búsqueda en SECOP II
        const baseUrl = 'https://www.secop.gov.co/CO1Marketplace/Consulta/DoBuscar.aspx';

        // Parámetros de búsqueda
        const searchParams = new URLSearchParams({
            lstKeyWords: palabra,
            ddlEstado: '1', // Publicado
            ddlFechaPublicacion: '', // Todas las fechas (o especificar)
            txtPresupuestoDesde: presupuestoMin,
            txtPresupuestoHasta: presupuestoMax,
            btnBuscar: 'Buscar'
        });

        const searchUrl = `${baseUrl}?${searchParams.toString()}`;

        console.log(`📡 Haciendo request a: ${searchUrl}`);

        // Hacer request con cookie
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'es-CO,es;q=0.9',
                'Cookie': cookie,
                'Referer': 'https://www.secop.gov.co/CO1Marketplace/',
                'Cache-Control': 'max-age=0'
            },
            withCredentials: true,
            timeout: 15000,
            validateStatus: () => true // No lanzar error por status codes
        });

        console.log(`📄 Status: ${response.status}`);

        // Verificar si recibimos HTML válido
        if (response.status !== 200) {
            throw new Error(`Status ${response.status}: ${response.statusText}`);
        }

        // Parsear HTML
        const $ = cheerio.load(response.data);

        // Buscar tabla de resultados
        // NOTA: Estos selectores pueden cambiar si SECOP II modifica su HTML
        // Inspeccionar la página para obtener selectores actuales
        const procesos = [];

        // Intento 1: Buscar por tabla con clase específica
        let filas = $('table.tablaResultados tbody tr');

        if (filas.length === 0) {
            // Intento 2: Buscar por id
            filas = $('#gvwProcesos tbody tr');
        }

        if (filas.length === 0) {
            // Intento 3: Buscar cualquier tabla con resultados
            filas = $('table tbody tr:has(td)').slice(0, 100);
        }

        console.log(`🔢 Filas encontradas: ${filas.length}`);

        // Procesar cada fila
        filas.each((index, element) => {
            try {
                const celdas = $(element).find('td');

                // Necesitamos al menos 6 celdas (número, entidad, objeto, presupuesto, fechas, etc.)
                if (celdas.length >= 6) {
                    const numero = $(celdas[0]).text().trim();
                    const entidad = $(celdas[1]).text().trim();
                    const objeto = $(celdas[2]).text().trim();
                    const presupuestoText = $(celdas[3]).text().trim();
                    const fechaCierre = $(celdas[4] || celdas[5]).text().trim();

                    // Extraer presupuesto numérico
                    const presupuesto = extraerPresupuesto(presupuestoText);

                    // Validar que sea un proceso válido
                    if (numero && entidad && objeto && presupuesto > 0) {
                        const proceso = {
                            numero: numero,
                            entidad: entidad,
                            objeto: objeto,
                            presupuesto: presupuesto,
                            presupuestoFormato: presupuestoText,
                            fechaCierre: formatearFecha(fechaCierre),
                            fechaPublicacion: new Date().toISOString().split('T')[0],
                            enlaceSECOP: `https://www.secop.gov.co/CO1Marketplace/Procesos/p_procesos_ver.aspx?idn=${numero}`,
                            estado: 'Publicado',
                            tipoContrato: extraerTipo(objeto),
                            fuente: 'SECOP II Real',
                            afinidad: calcularAfinidad(objeto)
                        };

                        procesos.push(proceso);
                    }
                }
            } catch (e) {
                console.log(`⚠️ Error parseando fila ${index}:`, e.message);
                // Continuar con siguiente fila
            }
        });

        // Si no encontramos nada, intentar método alternativo
        if (procesos.length === 0) {
            console.log('⚠️ No se encontraron procesos con selectores principales. Intentando alternativa...');
            return extraerProcesosAlternativo($, palabra);
        }

        console.log(`✅ Extraídos ${procesos.length} procesos válidos`);

        return procesos;

    } catch (error) {
        console.error('❌ Error en buscarEnSecopReal:', error);
        throw error;
    }
}

/**
 * Extrae número de presupuesto de diferentes formatos
 */
function extraerPresupuesto(texto) {
    if (!texto) return 0;

    // Intentar extraer número: "$ 500.000.000" o "$500000000" o "500000000"
    let match = texto.match(/\$?\s*([\d.]+)/);
    if (match) {
        const num = match[1].replace(/\./g, '');
        return parseInt(num, 10) || 0;
    }

    // Intentar número sin separadores
    match = texto.match(/(\d+)/);
    if (match) {
        return parseInt(match[1], 10) || 0;
    }

    return 0;
}

/**
 * Formatea fecha de diferentes formas
 */
function formatearFecha(texto) {
    if (!texto) return new Date().toISOString().split('T')[0];

    // Intentar detectar formato y convertir a YYYY-MM-DD
    // Si ya está en formato correcto, devolver
    if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
        return texto.split('T')[0];
    }

    // Si es DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}/.test(texto)) {
        const partes = texto.split('/');
        return `${partes[2]}-${partes[1]}-${partes[0]}`;
    }

    return new Date().toISOString().split('T')[0];
}

/**
 * Extrae tipo de contrato de la descripción
 */
function extraerTipo(objeto) {
    const tipo = objeto.toLowerCase();
    if (tipo.includes('servicio')) return 'Servicio';
    if (tipo.includes('suministro')) return 'Suministro';
    if (tipo.includes('obra')) return 'Obra';
    if (tipo.includes('consultoría')) return 'Consultoría';
    if (tipo.includes('arrendamiento')) return 'Arrendamiento';
    return 'Otro';
}

/**
 * Calcula afinidad con Connect Your Knowledge
 */
function calcularAfinidad(objeto) {
    const servicios = [
        'LMS', 'plataforma', 'e-learning', 'educativo', 'educación',
        'virtual', 'digital', 'diseño instruccional', 'diseño',
        'contenido', 'contenidos', 'analítica', 'analytics',
        'inteligencia artificial', 'IA', 'software', 'sofware',
        'integración', 'integración de sistemas', 'integración de servicios',
        'automatización', 'automatizar',
        'capacitación', 'capacitación virtual', 'capacitación digital',
        'formación', 'formación virtual', 'formación digital',
        'SENA', 'educación digital', 'transformación digital',
        'infraestructura tecnológica', 'servicio de plataforma'
    ];

    const objetoLower = objeto.toLowerCase();
    let coincidencias = 0;

    servicios.forEach(servicio => {
        if (objetoLower.includes(servicio.toLowerCase())) {
            coincidencias++;
        }
    });

    // Calcular afinidad: cada coincidencia suma puntos
    const afinidad = Math.min(95, 20 + (coincidencias * 15));

    return Math.round(afinidad);
}

/**
 * Método alternativo si los selectores principales no funcionan
 */
function extraerProcesosAlternativo($, palabra) {
    const procesos = [];

    // Buscar enlaces que contengan números de proceso (formato SECOP-XXXX-XXXXX)
    $('a').each((index, element) => {
        const href = $(element).attr('href') || '';
        const texto = $(element).text();

        if (href.includes('id=') || href.includes('procesos') || /SECOP-\d+/.test(texto)) {
            // Intentar extraer información del contexto
            const fila = $(element).closest('tr');
            if (fila.length > 0) {
                const celdas = fila.find('td');
                if (celdas.length > 0) {
                    procesos.push({
                        numero: texto.trim() || 'Sin número',
                        entidad: $(celdas[1]).text().trim() || 'No especificada',
                        objeto: $(celdas[2]).text().trim() || palabra,
                        presupuesto: extraerPresupuesto($(celdas[3]).text()),
                        fechaCierre: formatearFecha($(celdas[4]).text()),
                        enlaceSECOP: href,
                        fuente: 'SECOP II Real (método alternativo)'
                    });
                }
            }
        }
    });

    return procesos;
}

/**
 * Validar estructura de respuesta
 */
function validarProceso(proceso) {
    return (
        proceso.numero &&
        proceso.entidad &&
        proceso.objeto &&
        proceso.presupuesto > 0 &&
        proceso.fechaCierre
    );
}

module.exports = { handler: exports.handler };
