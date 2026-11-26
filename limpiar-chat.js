#!/usr/bin/env node
/**
 * Limpieza automática del chat de la iglesia.
 *
 * Borra los mensajes con más de X días de antigüedad usando la API REST de
 * Firebase. No necesita instalar nada: solo Node (14 o superior).
 *
 * Uso:
 *   node limpiar-chat.js                 borra los mensajes más viejos que DIAS_RETENCION
 *   node limpiar-chat.js --dias 15       usa 15 días en esta corrida
 *   node limpiar-chat.js --simular       muestra qué borraría, sin borrar nada
 *
 * Antes de usarlo, copiá .env.example a .env y completá:
 *   FIREBASE_DB_URL, FIREBASE_API_KEY, MODERADOR_EMAIL, MODERADOR_PASSWORD
 */

'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { URL } = require('url');

/* ----------------------------- Configuración ----------------------------- */

function cargarEnv() {
  const archivo = path.join(process.cwd(), '.env');
  if (!fs.existsSync(archivo)) return;

  const lineas = fs.readFileSync(archivo, 'utf8').split(/\r?\n/);

  for (const linea of lineas) {
    const limpia = linea.trim();
    if (!limpia || limpia.startsWith('#')) continue;

    const corte = limpia.indexOf('=');
    if (corte < 1) continue;

    const clave = limpia.slice(0, corte).trim();
    let valor = limpia.slice(corte + 1).trim();

    if ((valor.startsWith('"') && valor.endsWith('"')) || (valor.startsWith("'") && valor.endsWith("'"))) {
      valor = valor.slice(1, -1);
    }

    if (!(clave in process.env)) process.env[clave] = valor;
  }
}

function leerArgumentos(argv) {
  const opciones = { dias: null, simular: false, ayuda: false };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--simular' || arg === '--dry-run' || arg === '-s') opciones.simular = true;
    else if (arg === '--ayuda' || arg === '--help' || arg === '-h') opciones.ayuda = true;
    else if (arg === '--dias' || arg === '--days') {
      const valor = Number(argv[i + 1]);
      if (Number.isFinite(valor) && valor >= 1) {
        opciones.dias = valor;
        i++;
      }
    } else if (arg.startsWith('--dias=')) {
      const valor = Number(arg.split('=')[1]);
      if (Number.isFinite(valor) && valor >= 1) opciones.dias = valor;
    }
  }

  return opciones;
}

function mostrarAyuda() {
  console.log(`
Limpieza del chat — Plantilla de radio

  node limpiar-chat.js                  borra los mensajes más viejos que DIAS_RETENCION
  node limpiar-chat.js --dias 15        usa 15 días en esta corrida
  node limpiar-chat.js --simular        muestra qué borraría, sin borrar nada

Variables necesarias en .env:
  FIREBASE_DB_URL         https://tu-base-default-rtdb.firebaseio.com
  FIREBASE_API_KEY        Web API Key del proyecto (empieza con AIza)
  MODERADOR_EMAIL         correo del usuario moderador
  MODERADOR_PASSWORD      su contraseña
  DIAS_RETENCION          días a conservar (por defecto 30)
  CHAT_RUTA               ruta del chat (por defecto chat/mensajes)
`);
}

function normalizarBase(url) {
  return String(url || '').trim().replace(/\/+$/, '');
}

function normalizarRuta(ruta) {
  return String(ruta || 'chat/mensajes').replace(/^\/+|\/+$/g, '');
}

/* ------------------------------ HTTP simple ------------------------------ */

function pedir(url, opciones) {
  return new Promise((resolve, reject) => {
    let destino;
    try {
      destino = new URL(url);
    } catch (e) {
      reject(new Error('La dirección de Firebase no es válida: ' + url));
      return;
    }

    const modulo = destino.protocol === 'https:' ? https : http;
    const metodo = (opciones && opciones.method) || 'GET';
    const cuerpo = opciones && opciones.body ? Buffer.from(opciones.body, 'utf8') : null;
    const cabeceras = Object.assign({}, (opciones && opciones.headers) || {});

    if (cuerpo) cabeceras['Content-Length'] = cuerpo.length;

    const solicitud = modulo.request(
      {
        protocol: destino.protocol,
        hostname: destino.hostname,
        port: destino.port || (destino.protocol === 'https:' ? 443 : 80),
        path: destino.pathname + destino.search,
        method: metodo,
        headers: cabeceras
      },
      (respuesta) => {
        const partes = [];

        respuesta.on('data', (parte) => partes.push(parte));
        respuesta.on('end', () => {
          const texto = Buffer.concat(partes).toString('utf8');
          let datos = null;

          try {
            datos = texto ? JSON.parse(texto) : null;
          } catch (e) {
            datos = null;
          }

          resolve({
            ok: respuesta.statusCode >= 200 && respuesta.statusCode < 300,
            status: respuesta.statusCode,
            datos: datos,
            texto: texto
          });
        });
      }
    );

    solicitud.on('error', (error) => reject(error));
    solicitud.setTimeout(20000, () => solicitud.destroy(new Error('Tiempo de espera agotado')));

    if (cuerpo) solicitud.write(cuerpo);
    solicitud.end();
  });
}

/* -------------------------------- Firebase -------------------------------- */

async function iniciarSesion(apiKey, email, password) {
  const base =
    process.env.FIREBASE_AUTH_URL ||
    'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword';

  const respuesta = await pedir(`${base}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });

  if (!respuesta.ok || !respuesta.datos || !respuesta.datos.idToken) {
    const codigo =
      (respuesta.datos && respuesta.datos.error && respuesta.datos.error.message) ||
      `HTTP ${respuesta.status}`;
    throw new Error(`No se pudo iniciar sesión (${codigo}). Revisá el correo y la contraseña.`);
  }

  return respuesta.datos.idToken;
}

async function traerViejos(base, ruta, token, limite) {
  const consulta =
    `${base}/${ruta}.json?orderBy=${encodeURIComponent('"ts"')}` +
    `&endAt=${limite}&auth=${encodeURIComponent(token)}`;

  const respuesta = await pedir(consulta);

  if (!respuesta.ok) {
    const codigo = (respuesta.datos && respuesta.datos.error) || `HTTP ${respuesta.status}`;
    throw new Error(`No se pudieron leer los mensajes (${codigo}). Revisá las reglas de Firebase.`);
  }

  const datos = respuesta.datos;
  if (!datos || typeof datos !== 'object') return [];

  return Object.keys(datos).map((clave) => ({ clave, mensaje: datos[clave] || {} }));
}

async function borrarMensaje(base, ruta, clave, token) {
  const respuesta = await pedir(
    `${base}/${ruta}/${encodeURIComponent(clave)}.json?auth=${encodeURIComponent(token)}`,
    { method: 'DELETE' }
  );

  if (!respuesta.ok) {
    const codigo = (respuesta.datos && respuesta.datos.error) || `HTTP ${respuesta.status}`;
    throw new Error(String(codigo));
  }
}

/* ---------------------------------- Main ---------------------------------- */

async function main() {
  const opciones = leerArgumentos(process.argv.slice(2));

  if (opciones.ayuda) {
    mostrarAyuda();
    return;
  }

  cargarEnv();

  const base = normalizarBase(process.env.FIREBASE_DB_URL);
  const apiKey = String(process.env.FIREBASE_API_KEY || '').trim();
  const email = String(process.env.MODERADOR_EMAIL || '').trim();
  const password = String(process.env.MODERADOR_PASSWORD || '');
  const ruta = normalizarRuta(process.env.CHAT_RUTA);
  const dias = opciones.dias !== null ? opciones.dias : Number(process.env.DIAS_RETENCION || 30);

  const faltantes = [];
  if (!base) faltantes.push('FIREBASE_DB_URL');
  if (!apiKey) faltantes.push('FIREBASE_API_KEY');
  if (!email) faltantes.push('MODERADOR_EMAIL');
  if (!password) faltantes.push('MODERADOR_PASSWORD');

  if (faltantes.length) {
    console.error('\nFaltan datos en el archivo .env:');
    faltantes.forEach((nombre) => console.error(`  - ${nombre}`));
    console.error('\nCopiá .env.example a .env y completalos. Para ver la ayuda: node limpiar-chat.js --ayuda\n');
    process.exitCode = 1;
    return;
  }

  if (!Number.isFinite(dias) || dias < 1) {
    console.error('Los días tienen que ser un número mayor a 0.');
    process.exitCode = 1;
    return;
  }

  const limite = Date.now() - dias * 24 * 60 * 60 * 1000;
  const fechaLimite = new Date(limite).toLocaleString('es-AR');

  console.log(`\nChat: ${base}/${ruta}`);
  console.log(`Se conservan los últimos ${dias} días (se borra lo anterior a ${fechaLimite}).`);

  let token;
  try {
    token = await iniciarSesion(apiKey, email, password);
  } catch (error) {
    console.error(String(error.message || error));
    process.exitCode = 1;
    return;
  }

  let viejos;
  try {
    viejos = await traerViejos(base, ruta, token, limite);
  } catch (error) {
    console.error(String(error.message || error));
    process.exitCode = 1;
    return;
  }

  if (!viejos.length) {
    console.log('No hay mensajes para borrar. Todo limpio.\n');
    return;
  }

  console.log(`Mensajes encontrados: ${viejos.length}`);

  if (opciones.simular) {
    viejos.slice(0, 20).forEach(({ mensaje }) => {
      const fecha = mensaje.ts ? new Date(Number(mensaje.ts)).toLocaleDateString('es-AR') : 'sin fecha';
      console.log(`  [simulación] ${fecha} · ${mensaje.nombre || 'Anónimo'}: ${String(mensaje.texto || '').slice(0, 60)}`);
    });

    if (viejos.length > 20) console.log(`  ... y ${viejos.length - 20} más`);

    console.log('\nModo simulación: no se borró nada.\n');
    return;
  }

  let borrados = 0;
  const errores = [];

  for (const { clave } of viejos) {
    try {
      await borrarMensaje(base, ruta, clave, token);
      borrados++;
    } catch (error) {
      errores.push(`${clave}: ${String(error.message || error)}`);
    }
  }

  console.log(`Borrados: ${borrados}`);

  if (errores.length) {
    console.log(`Con error: ${errores.length}`);
    errores.slice(0, 10).forEach((linea) => console.log(`  ${linea}`));
    process.exitCode = 1;
  }

  console.log('');
}

main().catch((error) => {
  console.error('Error inesperado:', error);
  process.exitCode = 1;
});
