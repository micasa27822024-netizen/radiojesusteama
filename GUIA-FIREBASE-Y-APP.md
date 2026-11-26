# Chat Firebase, instalación e imágenes · versión 2.1

## 1. Conectar el chat a tu cuenta de Firebase

La plantilla usa **Firebase Realtime Database** para mensajes y **Firebase Authentication (correo y contraseña)** para los moderadores. No usa Firestore. El botón de chat aparece cuando lo habilitás y completás una URL válida.

1. Entrá en la consola de Firebase y creá o elegí el proyecto de la nueva radio.
2. Registrá una aplicación web. En Configuración del proyecto → General copiá la **Web API Key**. Es una clave pública de la app; no pegues una cuenta de servicio ni una clave privada.
3. En Authentication → Sign-in method habilitá **Correo/contraseña**.
4. En Authentication → Usuarios agregá una cuenta para cada moderador, con correo y contraseña. Copiá el **UID** de cada usuario. El mismo correo en otro proyecto no tiene el mismo UID.
5. Creá Realtime Database y copiá su URL HTTPS (firebaseio.com o firebasedatabase.app).
6. Abrí `editor.html` → **Chat · Firebase**. Habilitá el chat y completá URL, Web API Key y los UID de moderadores (uno por línea). Podés indicar un correo opcional para precargarlo al iniciar sesión.
7. Usá **Descargar reglas de Firebase**, revisá el archivo y publicá sus reglas desde Realtime Database → Reglas. La descarga NO configura Firebase automáticamente.
8. Descargá el sitio ZIP desde el editor y publicalo en tu hosting HTTPS. En Authentication → Settings revisá también los dominios autorizados y añadí el dominio de tu radio si corresponde. Si restringís la API Key, permití las APIs usadas por Firebase Authentication y Token Service y tu dominio.

### Alcance de las reglas

- La raíz de la base queda sin acceso público.
- Solo la ruta de chat configurada permite **leer y crear mensajes públicamente**, como en el proyecto original. Los oyentes no necesitan correo ni contraseña.
- No se permite editar mensajes existentes desde el público.
- Solo las cuentas autenticadas cuyos **UID** figuran en las reglas pueden borrar mensajes.
- Se validan campos, tipos, longitudes, identificador del visitante y fecha cercana al reloj del servidor.
- Con la lista de UID vacía, nadie puede borrar. El editor exige al menos un UID y una clave cuando habilitás el chat.
- Las reglas del paquete son una plantilla. Generá las tuyas después de cargar tus UID.

**Si esta base ya tiene otros datos, no reemplaces todas sus reglas:** combiná solamente la rama del chat con las reglas existentes. Permisos abiertos en nodos superiores pueden invalidar las restricciones de una rama. Revisá esto antes de publicar.

**Antispam:** el filtro de palabras y la espera entre mensajes funcionan en el navegador; no impiden que alguien abuse de la API directamente. La escritura pública conserva el comportamiento de la web original, pero requiere supervisión, seguimiento de cuota y controles adicionales para un sitio con riesgo de abuso. No se configura App Check ni un backend antispam automáticamente. No publiques información sensible en el chat.

### Moderar

1. Abrí el botón flotante del chat.
2. Tocá el botón de **Modo moderador** (escudo).
3. Escribí el correo y la contraseña de una cuenta creada en Authentication.
4. Una cuenta configurada como moderadora verá los botones de borrar. Confirmá para quitar un mensaje.
5. Tocá **Salir** para cerrar la sesión de moderación.

La contraseña no se guarda en `config.js`, el ZIP ni el almacenamiento del navegador. Los tokens se conservan únicamente en memoria durante la visita; al recargar hay que volver a iniciar sesión. Firebase, con sus reglas, decide si un borrado está permitido: ocultar un botón en la web no es una autorización de seguridad.

Si la cuenta inicia sesión pero no puede borrar, revisá que proyecto, UID y reglas publicadas coincidan. Si no hay mensajes o no se puede enviar, revisá URL, reglas y conectividad. La fecha del dispositivo debe ser correcta para enviar.

## 2. Personalizar la invitación de instalación

La app instalable (PWA) ya existía. La versión 2.1 agrega una ventana propia cuyos textos podés editar desde **Instalar la app**:

- título y mensaje principal;
- botón para instalar y botón para posponer;
- mensaje después de instalar y mensaje si ya está instalada;
- instrucciones para Chrome/Android y Safari/iPhone;
- texto de ayuda si no está disponible;
- opción de mostrar la invitación cuando el navegador ofrece instalación.

Usá **{radio}** en cualquier texto para insertar el nombre de tu radio. El nombre, el ícono y el color de la app se actualizan en el manifest al descargar el ZIP.

**Límite del navegador:** el texto de la ventana nativa de Chrome/Edge/Safari no lo puede cambiar la web. Se personalizan la invitación y la ayuda de la radio. Chrome/Edge muestran su confirmación después de tocar el botón de la plantilla. El evento de instalación permite mostrar el agradecimiento cuando el navegador lo comunica.

- En Chrome/Edge compatible: HTTPS, manifest e ícono válidos y demás criterios del navegador. El navegador puede demorar o no ofrecer el aviso; podés instalar desde su menú cuando lo permita.
- En iPhone/iPad: abrir con Safari → Compartir → Agregar a la pantalla de inicio. No hay instalación automática desde el botón.
- Si ya se abre como app, la ventana indica que está instalada. Desde una pestaña normal no todos los navegadores permiten detectar una instalación previa.

No se genera un APK ni se publica una app en Play Store: es una web instalable desde el navegador.

## 3. Imágenes con las dimensiones originales

Los archivos de referencia de esta versión tienen exactamente:

| Uso | Archivo | Medida |
|---|---|---|
| Computadora | `assets/fondo-escritorio.jpg` | **1376 × 768** |
| Celular | `assets/fondo-movil.jpg` | **768 × 1365** |
| Logo / ícono | `assets/icono.png` | **512 × 512** |

Al cargar una imagen desde el editor se adapta a estas medidas con **recorte centrado**, sin deformarla. Si ya tiene la proporción correcta, no hace falta recortar. Revisá el encuadre antes de descargar; para conservar una composición específica prepará el archivo con estas medidas.

Una URL externa no se redimensiona ni se descarga: la plantilla enlaza a esa imagen. Para garantizar las dimensiones y conservarla en el ZIP, cargá el archivo desde tu computadora.

## Pruebas

Se pueden probar localmente el editor, la exportación y los flujos de chat/instalación con respuestas simuladas. La conexión real con tus cuentas y reglas de Firebase, la instalación en tus teléfonos y tu transmisión deben verificarse con tus datos antes de producción. No se incluyen usuarios reales, contraseñas ni claves de tu cuenta.
