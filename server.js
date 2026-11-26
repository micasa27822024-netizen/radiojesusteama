/* ============================================================================
   SERVIDOR OPCIONAL (Node.js + Express)
   ----------------------------------------------------------------------------
   Sirve la web y expone una mini API para recibir "saludos" de los oyentes
   y guardarlos en Cloudinary.

   La web funciona perfectamente SIN este servidor: solo lo necesitás si querés
   usar la función de saludos de audio.

   Cómo levantarlo:
     1) npm install
     2) Copiá .env.example a .env y completá tus datos
     3) npm start

   Las credenciales NUNCA se escriben en el código: se leen de variables de
   entorno. Así podés subir el proyecto a GitHub sin filtrar secretos.
   ============================================================================ */

'use strict';

const path = require('path');
const express = require('express');

const app = express();
const PUERTO = Number(process.env.PORT) || 3000;

/* ---------------------------------------------------------------------------
   Configuración
   --------------------------------------------------------------------------- */
const CLOUDINARY = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || ''
};

const CARPETA_CLOUDINARY = process.env.CLOUDINARY_FOLDER || 'radio_saludos';
const TOKEN_ADMIN = process.env.ADMIN_TOKEN || '';
const MAX_SALUDOS = Number(process.env.MAX_SALUDOS) || 100;
const TAMANO_MAXIMO = process.env.TAMANO_MAXIMO || '25mb';

const cloudinaryDisponible = Boolean(
  CLOUDINARY.cloud_name && CLOUDINARY.api_key && CLOUDINARY.api_secret
);

let cloudinary = null;
if (cloudinaryDisponible) {
  try {
    cloudinary = require('cloudinary').v2;
    cloudinary.config(CLOUDINARY);
  } catch (error) {
    console.warn('Cloudinary no está instalado. Ejecutá: npm install cloudinary');
    cloudinary = null;
  }
}

/* ---------------------------------------------------------------------------
   Middlewares
   --------------------------------------------------------------------------- */
app.use(express.json({ limit: TAMANO_MAXIMO }));
app.use(express.urlencoded({ extended: true, limit: TAMANO_MAXIMO }));

// Nunca se sirven archivos internos del proyecto
const RUTAS_PRIVADAS = [
  '/server.js', '/package.json', '/package-lock.json',
  '/.env', '/.env.example', '/.gitignore', '/netlify.toml'
];
app.use(RUTAS_PRIVADAS, (req, res) => {
  res.status(404).json({ ok: false, error: 'No encontrado.' });
});

// La web estática vive en la raíz del proyecto
app.use(express.static(path.join(__dirname), { extensions: ['html'] }));

/* ---------------------------------------------------------------------------
   Almacenamiento temporal en memoria
   ---------------------------------------------------------------------------
   Los saludos se pierden al reiniciar el servidor. Si necesitás persistencia,
   guardalos en Firestore, MongoDB o un archivo JSON.
   --------------------------------------------------------------------------- */
const buzonaudios = [];

// Límite simple de envíos por IP (evita spam accidental)
const enviosPorIp = new Map();
const LIMITE_ENVIOS = 5;
const VENTANA_MS = 10 * 60 * 1000;

function permitirEnvio(ip) {
  const ahora = Date.now();
  const registro = enviosPorIp.get(ip) || { inicio: ahora, cantidad: 0 };

  if (ahora - registro.inicio > VENTANA_MS) {
    registro.inicio = ahora;
    registro.cantidad = 0;
  }

  registro.cantidad += 1;
  enviosPorIp.set(ip, registro);

  return registro.cantidad <= LIMITE_ENVIOS;
}

function limpiarNombre(valor, maximo = 60) {
  return String(valor == null ? '' : valor).replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, maximo);
}

/* ---------------------------------------------------------------------------
   POST /api/saludos  →  recibe un audio en base64 y lo sube a Cloudinary
   --------------------------------------------------------------------------- */
app.post('/api/saludos', async (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'desconocida';

  if (!permitirEnvio(ip)) {
    return res.status(429).json({
      ok: false,
      error: 'Recibimos varios saludos tuyos. Probá de nuevo en unos minutos.'
    });
  }

  if (!cloudinary) {
    return res.status(503).json({
      ok: false,
      error: 'El servicio de saludos no está configurado (faltan las credenciales de Cloudinary).'
    });
  }

  try {
    const { nombre, ubicacion, audioBase64 } = req.body || {};

    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return res.status(400).json({ ok: false, error: 'No se recibió ningún audio.' });
    }

    if (!/^(data:audio\/[a-zA-Z0-9.+-]+;base64,|[A-Za-z0-9+/=]+$)/.test(audioBase64)) {
      return res.status(400).json({ ok: false, error: 'El formato del audio no es válido.' });
    }

    const subida = await cloudinary.uploader.upload(audioBase64, {
      resource_type: 'video', // Cloudinary usa "video" para audio (mp3 / webm)
      folder: CARPETA_CLOUDINARY
    });

    const saludo = {
      id: Date.now(),
      nombre: limpiarNombre(nombre) || 'Anónimo',
      ubicacion: limpiarNombre(ubicacion, 80) || 'Desconocida',
      urlAudio: subida.secure_url,
      fecha: new Date().toISOString()
    };

    buzonaudios.unshift(saludo);
    if (buzonaudios.length > MAX_SALUDOS) buzonaudios.length = MAX_SALUDOS;

    console.log(`Saludo recibido de ${saludo.nombre} (${saludo.ubicacion})`);

    return res.status(201).json({ ok: true, mensaje: '¡Saludo guardado!', saludo });
  } catch (error) {
    console.error('Error al subir el audio:', error);
    return res.status(500).json({ ok: false, error: 'No pudimos guardar el saludo. Intentá más tarde.' });
  }
});

/* ---------------------------------------------------------------------------
   GET /api/saludos  →  lista de saludos (para la PC de la radio)
   Si definís ADMIN_TOKEN, hay que enviarlo en el header "x-admin-token".
   --------------------------------------------------------------------------- */
app.get('/api/saludos', (req, res) => {
  if (TOKEN_ADMIN && req.get('x-admin-token') !== TOKEN_ADMIN) {
    return res.status(401).json({ ok: false, error: 'No autorizado.' });
  }

  return res.json({ ok: true, cantidad: buzonaudios.length, saludos: buzonaudios });
});

/* ---------------------------------------------------------------------------
   Estado del servicio (útil para monitoreo)
   --------------------------------------------------------------------------- */
app.get('/api/estado', (req, res) => {
  res.json({
    ok: true,
    saludos: buzonaudios.length,
    cloudinary: Boolean(cloudinary),
    hora: new Date().toISOString()
  });
});

// Cualquier ruta desconocida devuelve la página principal
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PUERTO, process.env.HOST || '127.0.0.1', () => {
  console.log(`\n  Plantilla de radio escuchando en http://localhost:${PUERTO}`);
  console.log(`  Saludos: ${cloudinary ? 'activados (Cloudinary)' : 'desactivados (faltan credenciales)'}\n`);
});
