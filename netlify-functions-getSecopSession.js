/**
 * NETLIFY FUNCTION: getSecopSession.js
 *
 * Obtiene sesión inicial de SECOP II para preparar búsquedas
 *
 * Ubicación: /netlify/functions/getSecopSession.js
 *
 * Requisitos:
 * - npm install axios
 *
 * Llamada desde frontend:
 * fetch('/.netlify/functions/getSecopSession', {
 *   method: 'POST',
 *   body: JSON.stringify({})
 * }).then(r => r.json()).then(console.log)
 */

const axios = require('axios');

exports.handler = async (event, context) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers };
    }

    try {
        console.log('🌐 Iniciando sesión en SECOP II...');

        const secopUrl = 'https://www.secop.gov.co/CO1Marketplace/';

        // Realizar GET a SECOP para obtener cookies de sesión
        const response = await axios.get(secopUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'es-CO,es;q=0.9',
                'Cache-Control': 'max-age=0'
            },
            withCredentials: true,
            timeout: 10000,
            validateStatus: () => true
        });

        // Extraer cookies de la respuesta
        const setCookies = response.headers['set-cookie'] || [];
        const sessionCookie = setCookies.join('; ');

        console.log(`✅ Sesión obtenida. Cookies: ${setCookies.length}`);

        // Extraer valores específicos
        const cookies = {};
        setCookies.forEach(cookie => {
            const [parte, ...resto] = cookie.split(';');
            const [nombre, valor] = parte.split('=');
            if (nombre && valor) {
                cookies[nombre.trim()] = valor.trim();
            }
        });

        // Detectar token CSRF o similar si existe
        const bodyHtml = response.data;
        const viewStateMatch = bodyHtml.match(/__VIEWSTATE[^=]*=([^"&]*)/);
        const viewState = viewStateMatch ? viewStateMatch[1] : null;

        const eventValidationMatch = bodyHtml.match(/__EVENTVALIDATION[^=]*=([^"&]*)/);
        const eventValidation = eventValidationMatch ? eventValidationMatch[1] : null;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                exito: true,
                mensaje: 'Sesión iniciada en SECOP II. Por favor resuelve el CAPTCHA.',
                sessionCookie: sessionCookie,
                cookies: cookies,
                viewState: viewState,
                eventValidation: eventValidation,
                timestamp: new Date().toISOString(),
                instrucciones: [
                    '1. El navegador abrirá SECOP II en un iframe',
                    '2. Resuelve el CAPTCHA ("No soy un robot")',
                    '3. Espera a que la página cargue',
                    '4. Haz clic en "Continuar con Búsqueda"',
                    '5. La búsqueda se ejecutará automáticamente'
                ]
            })
        };

    } catch (error) {
        console.error('❌ Error obteniendo sesión SECOP:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                exito: false,
                error: error.message || 'Error conectando con SECOP II',
                detalles: process.env.NODE_ENV === 'development' ? {
                    message: error.message,
                    stack: error.stack
                } : undefined,
                sugerencias: [
                    'Verifica que SECOP II está disponible',
                    'Intenta de nuevo en unos segundos',
                    'Si persiste, usa búsqueda simulada'
                ]
            })
        };
    }
};

module.exports = { handler: exports.handler };
