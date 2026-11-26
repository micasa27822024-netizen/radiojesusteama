# Plantilla editable para radio e iglesia · 2.1

## Qué podés editar sin tocar código
Nombre, eslogan y colores; enlace de transmisión; programas por día; reuniones; fondos e ícono; prédicas de YouTube; ubicación; redes; número general de WhatsApp y número independiente de pedidos de oración.

## Empezar
1. Descomprimí el paquete.
2. Para publicarlo, subí los archivos de la carpeta `plantilla-radio-editable` a tu hosting estático (Netlify, Cloudflare Pages u otro). La página principal es `index.html`.
3. Abrí `https://tu-dominio/editor.html` para personalizarla.
4. Hacé clic en **Vista previa** para probar los cambios. La vista previa se actualiza mientras editás.
5. Hacé clic en **Descargar sitio ZIP**. Descomprimí ese nuevo ZIP y reemplazá los archivos en tu hosting. Los cambios se ven para todos después de publicarlos.

El editor también funciona en un servidor local HTTP. Si ya tenés Node.js instalado, podés usar `npm install` y `npm start`, y abrir `http://localhost:3000/editor.html`. El servidor incluido escucha únicamente en la computadora local, salvo que configures HOST para tu propio despliegue. Podés usar cualquier servidor estático local, no es obligatorio usar Node.

**Abrir con doble clic:** puede mostrar la web y el formulario, pero la vista previa entre páginas y la exportación completa requieren HTTP/HTTPS. La copia JSON sí permite guardar textos y enlaces sin servidor. Para la app instalable se necesita HTTPS (o localhost).

## Importante: cómo se guardan los cambios
Este editor es una herramienta de edición y descarga; **no es un panel con guardado automático en el servidor**. Nadie puede cambiar tu web publicada usando el editor: solo se descargan archivos a su computadora. No tiene usuario ni contraseña porque no posee una API de escritura. Protegé el acceso a tu hosting; si no querés mostrar el editor públicamente, usalo localmente y no publiques `editor.html`, `editor.js` ni `editor.css` (en ese caso no podrás exportar desde la web pública).

Antes de cerrar o recargar, descargá el ZIP. El navegador avisa si hay cambios pendientes. El JSON exportado guarda configuración, **no las imágenes elegidas desde tu computadora**: para una copia completa usá el ZIP. Las imágenes mediante URL quedan enlazadas a su proveedor, no se incrustan. Si ese enlace deja de funcionar, también deja de verse la imagen.

## WhatsApp y oración
En la sección correspondiente hay dos números independientes. Usá país + código de área + número. No escribas +, espacios ni guiones; el editor también limpia separadores. Para celulares argentinos suele corresponder 549 + código de área + número, sin 0 ni 15. Consultá el formato correcto con tu línea. Si un campo queda vacío, su botón no aparece. Ambos botones abren WhatsApp con el mensaje que elegiste.

## Prédicas
- **Manual (recomendado):** agregá título y enlace de cada video. Acepta enlaces de YouTube watch, youtu.be, shorts y live. No necesita API Key. Podés ordenar y eliminar videos.
- **Automático (opcional):** requiere YouTube Data API v3 y una clave propia, restringida al dominio y a esa API. Puede consumir cuota; no dejes la clave sin restricciones. Algunos videos no permiten reproducción insertada por decisión del canal. Configurá tu propio canal, no el del archivo original.

## Mapa
Completá calle y número, localidad y provincia. El botón **Crear mapa desde la dirección** genera una URL de Google Maps para esa dirección. No consulta ni confirma que el lugar exista: verificá el resultado antes de publicar. También podés pegar tu enlace exacto. Pegá solamente la URL del mapa, no HTML de iframe.

## Imágenes
Los fondos iniciales son neutros, sin nombre de una iglesia real. Elegí PNG, JPG o WebP de hasta 12 MB. El editor adapta el fondo de computadora a 1376 × 768, el de celular a 768 × 1365 y el ícono a 512 × 512, con recorte central sin deformación. Revisá la vista previa antes de descargar. El ZIP incluye las imágenes elegidas.

## Qué se mantuvo del proyecto original
Se mantuvieron el reproductor, volumen, temporizador, versículos diarios, ventanas de reuniones/programación, ubicación, soporte de app instalable y transmisión a Smart TV. Los scripts opcionales de saludos con Cloudinary y limpieza del chat se conservan, sin configurarlos ni ejecutarlos. Su uso requiere los servicios y credenciales propios.

El chat se conserva como módulo opcional, **desactivado y sin conexión a la base original**. Para activarlo cargá tu proyecto en la sección **Chat · Firebase** del editor, creá los usuarios y publicá las reglas generadas. No se presenta como un chat seguro ya configurado. Las credenciales de moderador no se guardan en el almacenamiento del navegador. El editor visual permite configurar el chat y descargar sus reglas, pero no crea usuarios ni aplica reglas en Firebase, y no administra los saludos de Cloudinary.

## Qué cambió
- Editor visual en español con descarga portable de todo el sitio.
- Datos e imágenes neutrales: no se reutilizan teléfonos, dirección, claves, correo ni conexiones de la otra radio.
- Prédicas manuales sin API, dos números de contacto, identidad visible en la web.
- Manifest de la app actualizado al exportar y nueva versión de caché en cada descarga.
- Lógica de la página separada en archivos JavaScript externos. Los contenidos se muestran como texto; no se ejecuta HTML ingresado.

## Funciones que necesitan validación con tus servicios
No se puede comprobar tu transmisión real porque no se proporcionó un enlace nuevo. YouTube automático, Google Maps, casting, instalación en teléfonos reales, Firebase y Cloudinary deben verificarse con tus cuentas y dispositivos antes de publicar. La radio en vivo y los videos necesitan internet; la caché permite abrir la interfaz sin conexión, no escuchar contenido en vivo offline.

## Archivos principales
- `editor.html`: editor visual.
- `index.html`: web pública.
- `config.js`: datos que lee la radio.
- `radio-config.json`: copia JSON inicial/importable.
- `app.js`, `template-core.js`: funcionamiento y validación.
- `manifest.json`, `sw.js`: app instalable y caché.
- `assets/`: imágenes neutrales o tus reemplazos.
- `export-files.json`: lista usada para descargar el sitio.

Los cambios futuros se pueden hacer también directamente en `config.js`; en ese caso actualizá además el manifest y la versión del service worker. El editor hace esos pasos automáticamente en el ZIP.

El ZIP descargado desde el editor incluye los archivos para hosting estático. Los scripts opcionales de Node/Cloudinary y de limpieza Firebase permanecen en el paquete inicial; guardalos aparte si los usás.

## Novedades 2.1
Chat configurable desde el editor con moderación por correo/contraseña y UID, reglas de Realtime Database exportables, invitación de instalación con textos personalizados e imágenes de referencia con las medidas originales. Leé **GUIA-FIREBASE-Y-APP.md** antes de activar el chat.
