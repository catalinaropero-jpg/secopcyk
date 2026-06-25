/**
 * SECOP II Intelligence - Netlify Functions Backend
 * Este archivo contiene todas las funciones serverless necesarias
 *
 * Instrucciones de despliegue:
 * 1. Crear carpeta: /netlify/functions/
 * 2. Copiar este contenido en archivos separados (ver estructura abajo)
 * 3. Instalar dependencias: npm install axios dotenv openai
 * 4. Configurar variables de entorno en Netlify
 */

// ========== ESTRUCTURA DE ARCHIVOS ESPERADA ==========
/*
netlify/
├── functions/
│   ├── secopSearch.js
│   ├── aiAnalyzer.js
│   ├── monitorProcess.js
│   ├── sendNotification.js
│   ├── generateReport.js
│   └── gdriveSyncer.js
└── ...
*/

// ========== ARCHIVO 1: /netlify/functions/secopSearch.js ==========

const axios = require('axios');

exports.handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers };
    }

    try {
        if (event.httpMethod !== 'POST') {
            return {
                statusCode: 405,
                headers,
                body: JSON.stringify({ error: 'Método no permitido' })
            };
        }

        const {
            palabrasClave,
            presupuestoMin = 100000000,
            presupuestoMax = 3000000000,
            afinidadMin = 70,
            estadoPublicado = true,
            fechaPublicacionDesde = null
        } = JSON.parse(event.body || '{}');

        if (!palabrasClave || palabrasClave.length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Palabras clave requeridas' })
            };
        }

        // NOTA: Esta es una simulación. En producción, necesitarías:
        // 1. Usar Puppeteer o Playwright para navegar SECOP II
        // 2. Manejar CAPTCHA (manualmente o con servicio externo)
        // 3. Parsear HTML de resultados
        // 4. Aplicar filtros específicos

        const resultados = [];

        for (const palabra of palabrasClave) {
            // Simulación de búsqueda SECOP
            const procesosSimulados = generarProcesosSimulados(palabra, 5);
            const procesosFiltrados = procesosSimulados.filter(p =>
                p.presupuesto >= presupuestoMin &&
                p.presupuesto <= presupuestoMax &&
                !debeExcluirse(p)
            );

            resultados.push({
                palabra,
                totalEncontrados: procesosSimulados.length,
                relevantes: procesosFiltrados.length,
                procesos: procesosFiltrados
            });
        }

        // Consolidar y eliminar duplicados
        const procesosUnicos = consolidarYEliminarDuplicados(resultados);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                exito: true,
                totalProcesos: procesosUnicos.length,
                procesos: procesosUnicos,
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('Error en búsqueda SECOP:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};

function generarProcesosSimulados(palabra, cantidad) {
    const procesos = [];
    const entidades = [
        'Ministerio de Educación',
        'Gobernación de Cundinamarca',
        'Alcaldía de Bogotá',
        'SENA',
        'Instituto Colombiano para la Evaluación de la Educación',
        'Secretaría de Educación del Departamento',
        'Fundación para la Educación Digital'
    ];

    for (let i = 0; i < cantidad; i++) {
        procesos.push({
            numero: `SECOP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`,
            entidad: entidades[Math.floor(Math.random() * entidades.length)],
            objeto: `${palabra}: Desarrollo y gestión de contenido educativo digital`,
            presupuesto: Math.floor(Math.random() * (3000000000 - 100000000)) + 100000000,
            fechaPublicacion: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            fechaCierre: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            estado: 'Publicado',
            enlaceSECOP: 'https://www.secop.gov.co/CO1Marketplace/',
            descripcion: `Búsqueda y análisis de ${palabra}. Requisitos de contratación para servicios especializados.`,
            tipoContrato: 'Servicio',
            duracion: `${Math.floor(Math.random() * 12) + 1} meses`
        });
    }

    return procesos;
}

function debeExcluirse(proceso) {
    const palabrasExcluidas = [
        'construcción', 'obra civil', 'infraestructura física',
        'papelería', 'mobiliario', 'dotación',
        'transporte', 'vehículos', 'combustible',
        'servicios médicos', 'salud', 'hospitalario',
        'alimentación', 'catering', 'restaurante',
        'vigilancia', 'seguridad física',
        'aseo', 'limpieza',
        'maquinaria', 'equipos industriales'
    ];

    const objetoLower = proceso.objeto.toLowerCase();
    return palabrasExcluidas.some(palabra => objetoLower.includes(palabra));
}

function consolidarYEliminarDuplicados(resultados) {
    const procesoMap = new Map();

    resultados.forEach(resultado => {
        resultado.procesos.forEach(proceso => {
            if (!procesoMap.has(proceso.numero)) {
                procesoMap.set(proceso.numero, proceso);
            }
        });
    });

    return Array.from(procesoMap.values());
}


// ========== ARCHIVO 2: /netlify/functions/aiAnalyzer.js ==========

const { Configuration, OpenAIApi } = require('openai');

const openai = new OpenAIApi(new Configuration({
    apiKey: process.env.OPENAI_API_KEY
}));

exports.handler = async (event, context) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers };
    }

    try {
        const {
            numero,
            objeto,
            descripcion,
            presupuesto,
            requisitos = ''
        } = JSON.parse(event.body || '{}');

        if (!objeto || !descripcion) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Objeto y descripción requeridos' })
            };
        }

        // Prompt para análisis IA
        const prompt = `
        Analiza el siguiente proceso de contratación pública y proporciona un análisis detallado:

        NÚMERO DE PROCESO: ${numero}
        OBJETO: ${objeto}
        DESCRIPCIÓN: ${descripcion}
        PRESUPUESTO: $${presupuesto} COP
        REQUISITOS: ${requisitos || 'No especificados'}

        Analiza lo siguiente:

        1. COMPATIBILIDAD CON CONNECT YOUR KNOWLEDGE
           - Evalúa si este proceso se alinea con servicios de:
             * Desarrollo de software educativo
             * Plataformas LMS y e-learning
             * Diseño instruccional y contenidos digitales
             * Analítica de datos e IA
             * Integración de sistemas
           - Asigna un porcentaje de afinidad (0-100%)

        2. EVALUACIÓN DETALLADA
           - Servicios requeridos: Lista los servicios que la empresa podría ofrecer
           - Requisitos críticos: Identifica requisitos que podrían ser problemáticos
           - Riesgos: Evalúa riesgos de participación
           - Complejidad: Estimada (Baja, Media, Alta)
           - Probabilidad de éxito: Estimada (%)

        3. RECOMENDACIÓN
           - PARTICIPAR o NO PARTICIPAR
           - Justificación en 2-3 líneas

        Responde en formato JSON estructurado.
        `;

        // Llamada a OpenAI (es un ejemplo simplificado)
        // En producción, necesitarías la versión más reciente de openai package
        const analisisIA = {
            afinidad: calcularAfinidadBasada(objeto, descripcion),
            serviciosRequeridos: extraerServicios(objeto),
            requisitoCritico: extraerRequisitos(requisitos),
            riesgos: identificarRiesgos(objeto),
            complejidad: estimarComplejidad(descripcion),
            probabilidadExito: 75,
            recomendacion: 'PARTICIPAR',
            justificacion: 'El proceso solicita servicios de plataforma educativa y contenidos virtuales, alineándose directamente con el portafolio de Connect Your Knowledge.'
        };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                exito: true,
                analisis: analisisIA,
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('Error en análisis IA:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};

function calcularAfinidadBasada(objeto, descripcion) {
    const serviciosEmpresa = [
        'LMS', 'plataforma', 'e-learning', 'educativo',
        'virtual', 'digital', 'diseño instruccional',
        'contenidos', 'analítica', 'inteligencia artificial',
        'software', 'integración', 'automatización'
    ];

    const texto = (objeto + ' ' + descripcion).toLowerCase();
    const coincidencias = serviciosEmpresa.filter(s => texto.includes(s)).length;
    return Math.min(95, 40 + (coincidencias * 10));
}

function extraerServicios(objeto) {
    const serviciosMap = {
        'plataforma': 'Desarrollo de plataforma',
        'lms': 'Sistema de Gestión de Aprendizaje',
        'e-learning': 'Solución e-learning',
        'contenido': 'Producción de contenidos',
        'diseño instruccional': 'Diseño instruccional',
        'analítica': 'Analítica de datos',
        'inteligencia artificial': 'Soluciones de IA'
    };

    const servicios = [];
    const objetoLower = objeto.toLowerCase();
    for (const [clave, valor] of Object.entries(serviciosMap)) {
        if (objetoLower.includes(clave)) {
            servicios.push(valor);
        }
    }

    return servicios.length > 0 ? servicios : ['Servicio especializado en educación digital'];
}

function extraerRequisitos(requisitos) {
    if (!requisitos) return 'Requisitos estándar de experiencia';
    return requisitos.substring(0, 100) + '...';
}

function identificarRiesgos(objeto) {
    const riesgos = [];
    if (objeto.includes('SENA')) riesgos.push('Cliente gubernamental con procesos estrictos');
    if (objeto.length > 200) riesgos.push('Alcance potencialmente amplio');
    riesgos.push('Competencia de otros proveedores');
    return riesgos;
}

function estimarComplejidad(descripcion) {
    if (descripcion.length > 500) return 'Alta';
    if (descripcion.length > 250) return 'Media';
    return 'Baja';
}


// ========== ARCHIVO 3: /netlify/functions/monitorProcess.js ==========

exports.handler = async (event, context) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    };

    try {
        const { numeroProceso } = JSON.parse(event.body || '{}');

        if (!numeroProceso) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Número de proceso requerido' })
            };
        }

        // Simulación: Simular cambios en SECOP
        const cambios = generarCambiosSimulados(numeroProceso);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                exito: true,
                numeroProceso,
                cambiosDetectados: cambios.length,
                cambios: cambios,
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('Error en monitoreo:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};

function generarCambiosSimulados(numeroProceso) {
    const tipos = ['ADENDA', 'PRÓRROGA', 'CAMBIO_CRONOGRAMA', 'CAMBIO_REQUISITOS'];
    const cambios = [];

    if (Math.random() > 0.7) {
        cambios.push({
            fecha: new Date().toISOString(),
            tipo: tipos[Math.floor(Math.random() * tipos.length)],
            resumen: 'Se detectó una adenda en el proceso',
            impacto: 'Alto',
            descripcion: 'La entidad modificó los requisitos técnicos. Se amplió el plazo de entrega.',
            accionSugerida: 'Revisar adenda y ajustar oferta'
        });
    }

    return cambios;
}


// ========== ARCHIVO 4: /netlify/functions/sendNotification.js ==========

const nodemailer = require('nodemailer');

// Configurar transporte de email
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

exports.handler = async (event, context) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    };

    try {
        const {
            destinatario,
            asunto,
            tipo = 'NUEVA_OPORTUNIDAD',
            datos = {}
        } = JSON.parse(event.body || '{}');

        if (!destinatario) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Destinatario requerido' })
            };
        }

        let htmlContent = '';

        switch (tipo) {
            case 'NUEVA_OPORTUNIDAD':
                htmlContent = generarEmailNuevaOportunidad(datos);
                break;
            case 'RESUMEN_DIARIO':
                htmlContent = generarEmailResumenDiario(datos);
                break;
            case 'CAMBIO_DETECTADO':
                htmlContent = generarEmailCambioDetectado(datos);
                break;
            default:
                htmlContent = `<p>${datos.mensaje}</p>`;
        }

        // Nota: Para usar en producción, necesitas configurar variables de entorno
        // Por ahora, simulamos el envío
        console.log(`Email enviado a ${destinatario}: ${asunto}`);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                exito: true,
                mensaje: 'Notificación enviada correctamente',
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('Error enviando notificación:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};

function generarEmailNuevaOportunidad(datos) {
    const { numero, entidad, objeto, presupuesto, afinidad, enlace } = datos;
    return `
        <h2>🎯 Nueva Oportunidad de Contratación</h2>
        <p><strong>Proceso:</strong> ${numero}</p>
        <p><strong>Entidad:</strong> ${entidad}</p>
        <p><strong>Objeto:</strong> ${objeto}</p>
        <p><strong>Presupuesto:</strong> $${presupuesto}</p>
        <p><strong>Afinidad:</strong> ${afinidad}%</p>
        <p><a href="${enlace}">Ver en SECOP</a></p>
    `;
}

function generarEmailResumenDiario(datos) {
    const { nuevosP rocesos, procesosRelevantes, proximosVencer } = datos;
    return `
        <h2>📊 Resumen Diario SECOP II</h2>
        <p><strong>Nuevos procesos encontrados:</strong> ${nuevos Procesos}</p>
        <p><strong>Procesos relevantes:</strong> ${procesosRelevantes}</p>
        <p><strong>Próximos a vencer (7 días):</strong> ${proximosVencer}</p>
    `;
}

function generarEmailCambioDetectado(datos) {
    const { numero, tipo, descripcion, impacto } = datos;
    return `
        <h2>⚠️ Cambio Detectado en Proceso</h2>
        <p><strong>Proceso:</strong> ${numero}</p>
        <p><strong>Tipo de cambio:</strong> ${tipo}</p>
        <p><strong>Descripción:</strong> ${descripcion}</p>
        <p><strong>Impacto:</strong> <span style="color: red;">${impacto}</span></p>
    `;
}


// ========== ARCHIVO 5: /netlify/functions/generateReport.js ==========

const ExcelJS = require('exceljs');

exports.handler = async (event, context) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    };

    try {
        const {
            tipo = 'OPORTUNIDADES',
            oportunidades = [],
            desde = null,
            hasta = null
        } = JSON.parse(event.body || '{}');

        if (tipo === 'EXCEL') {
            return await generarExcel(oportunidades, headers);
        } else if (tipo === 'PDF') {
            return await generarPDF(oportunidades, headers);
        } else if (tipo === 'JSON') {
            return generarJSON(oportunidades, headers);
        }

        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Tipo de reporte no válido' })
        };

    } catch (error) {
        console.error('Error generando reporte:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};

async function generarExcel(oportunidades, headers) {
    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Oportunidades');

    // Encabezados
    worksheet.columns = [
        { header: 'Fecha Búsqueda', key: 'fechaBusqueda', width: 15 },
        { header: 'Número Proceso', key: 'numero', width: 18 },
        { header: 'Entidad', key: 'entidad', width: 30 },
        { header: 'Objeto', key: 'objeto', width: 40 },
        { header: 'Presupuesto', key: 'presupuesto', width: 18 },
        { header: 'Afinidad', key: 'afinidad', width: 12 },
        { header: 'Estado', key: 'estado', width: 15 },
        { header: 'Fecha Cierre', key: 'fechaCierre', width: 15 },
        { header: 'Recomendación', key: 'recomendacion', width: 15 },
        { header: 'Enlace SECOP', key: 'enlace', width: 30 }
    ];

    // Estilos de encabezado
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0066CC' } };

    // Agregar datos
    oportunidades.forEach((op, index) => {
        worksheet.addRow({
            fechaBusqueda: new Date().toLocaleDateString('es-CO'),
            numero: op.numero,
            entidad: op.entidad,
            objeto: op.objeto,
            presupuesto: op.presupuesto,
            afinidad: op.afinidad + '%',
            estado: op.estado,
            fechaCierre: op.fechaCierre,
            recomendacion: op.afinidad >= 70 ? 'PARTICIPAR' : 'NO PARTICIPAR',
            enlace: 'https://www.secop.gov.co/'
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return {
        statusCode: 200,
        headers: {
            ...headers,
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="SECOP_Oportunidades.xlsx"'
        },
        body: buffer.toString('base64'),
        isBase64Encoded: true
    };
}

async function generarPDF(oportunidades, headers) {
    // Nota: Para PDF completo, necesitarías puppeteer o similar
    // Aquí retornamos JSON que puede ser convertido a PDF en frontend
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            exito: true,
            mensaje: 'PDF generado',
            url: '/reports/SECOP_Oportunidades.pdf'
        })
    };
}

function generarJSON(oportunidades, headers) {
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            exito: true,
            total: oportunidades.length,
            data: oportunidades,
            generadoEn: new Date().toISOString()
        })
    };
}


// ========== ARCHIVO 6: /netlify/functions/gdriveSyncer.js ==========

// Nota: Para integración real con Google Drive necesitarías:
// 1. google-auth-library
// 2. google-drive-api
// 3. Configurar OAuth2 credentials

exports.handler = async (event, context) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    };

    try {
        const {
            accion = 'CREAR',
            numeroProceso,
            archivos = [],
            carpetaDestino = 'Convocatorias'
        } = JSON.parse(event.body || '{}');

        // Simulación de sincronización
        const resultado = {
            exito: true,
            accion,
            numeroProceso,
            archivosSincronizados: archivos.length,
            estructura: `
                Convocatorias/
                └── ${new Date().getFullYear()}/
                    └── ${('0' + (new Date().getMonth() + 1)).slice(-2)}/
                        └── ${numeroProceso}/
                            ├── Pliegos.pdf
                            ├── Estudios_Previos.pdf
                            ├── Adendas/
                            ├── Anexos/
                            └── Reporte_IA.json
            `,
            timestamp: new Date().toISOString()
        };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(resultado)
        };

    } catch (error) {
        console.error('Error sincronizando con Drive:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};


// ========== EXPORTAR PARA PRUEBAS ==========
module.exports = {
    secopSearch: exports.handler,
};
