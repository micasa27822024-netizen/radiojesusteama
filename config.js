/* Datos editables desde editor.html. Sin credenciales de la radio original. */
window.CONFIG = {
  "sitio": {
    "nombre": "Tu Radio Cristiana",
    "nombreCorto": "Tu Radio",
    "eslogan": "Una voz de fe y esperanza",
    "descripcion": "Escuchá nuestra radio cristiana en vivo.",
    "iglesia": "Tu Iglesia",
    "ciudad": "",
    "idioma": "es",
    "urlPublica": "",
    "colorBarra": "#22d3ee"
  },
  "marca": {
    "primario": "#22d3ee",
    "primarioOscuro": "#0891b2",
    "oro": "#fbbf24",
    "secundario": "#a78bfa",
    "fondoModal": "#121824"
  },
  "imagenes": {
    "fondoMovil": "assets/fondo-movil.jpg",
    "fondoEscritorio": "assets/fondo-escritorio.jpg",
    "icono": "assets/icono.png"
  },
  "transmision": {
    "url": "",
    "tipo": "audio/mp3",
    "textoEspera": "Sintonizando transmisión en vivo...",
    "metadatos": {
      "proveedor": "",
      "streamId": ""
    }
  },
  "modulos": {
    "versiculo": true,
    "redesSociales": true
  },
  "barraSuperior": [
    {
      "id": "temporizador",
      "etiqueta": "Off",
      "icono": "fa-solid fa-clock",
      "titulo": "Temporizador para dormir"
    },
    {
      "id": "programacion",
      "etiqueta": "Radio",
      "icono": "fa-solid fa-radio",
      "titulo": "Programación de la radio"
    },
    {
      "id": "reuniones",
      "etiqueta": "Reuniones",
      "icono": "fa-solid fa-church",
      "color": "#38bdf8",
      "titulo": "Nuestras reuniones"
    },
    {
      "id": "predicas",
      "etiqueta": "Prédicas",
      "icono": "fa-brands fa-youtube",
      "color": "#ff4d4d",
      "titulo": "Prédicas y mensajes"
    },
    {
      "id": "ubicacion",
      "etiqueta": "Ubicación",
      "icono": "fa-solid fa-location-dot",
      "color": "#f59e0b",
      "titulo": "Cómo llegar a la iglesia"
    },
    {
      "id": "instalarApp",
      "etiqueta": "App",
      "icono": "fa-solid fa-mobile-screen-button",
      "titulo": "Instalar la aplicación"
    }
  ],
  "programacion": {
    "dias": [
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
      "Domingo"
    ],
    "grilla": [
      {
        "dia": "Lunes",
        "hora": "09:00",
        "titulo": "Programa de ejemplo · Palabra y vida"
      },
      {
        "dia": "Viernes",
        "hora": "20:00",
        "titulo": "Programa de ejemplo · Tiempo de alabanza"
      }
    ]
  },
  "reuniones": {
    "titulo": "Nuestras Reuniones",
    "subtitulo": "Horarios de ejemplo · personalizalos",
    "nombre": "Tu Iglesia",
    "items": [
      {
        "dia": "Domingo",
        "hora": "10:00",
        "nombre": "Culto general (ejemplo)",
        "icono": "fa-solid fa-church",
        "destacado": true
      },
      {
        "dia": "Miércoles",
        "hora": "20:00",
        "nombre": "Estudio bíblico (ejemplo)",
        "icono": "fa-solid fa-book-bible"
      }
    ]
  },
  "predicas": {
    "titulo": "Prédicas & Mensajes",
    "apiKey": "",
    "canalHandle": "",
    "canalId": "",
    "cantidadUltimas": 4,
    "intervaloRefresco": 300000,
    "textoBotonVivo": "Ver Vivo",
    "textoBotonArchivo": "Ver aquí",
    "modo": "manual",
    "videos": []
  },
  "ubicacion": {
    "titulo": "Nuestra Ubicación",
    "direccion": "",
    "localidad": "",
    "provincia": "",
    "codigoPostal": "",
    "linkMapa": "",
    "embedUrl": "",
    "textoComoLlegar": "Cómo llegar",
    "textoMiUbicacion": "Usar mi ubicación",
    "textoConsultarCongregaciones": "Consultar sobre la iglesia",
    "consultaWhatsapp": "",
    "consultaUrl": "",
    "mensajeConsultarCongregaciones": "Hola, quisiera información sobre la iglesia."
  },
  "redes": [
    {
      "tipo": "compartir",
      "etiqueta": "Compartir App",
      "icono": "fa-solid fa-share-nodes"
    },
    {
      "tipo": "chromecast",
      "etiqueta": "Transmitir a Smart TV",
      "icono": "fa-solid fa-tv"
    }
  ],
  "chat": {
    "habilitado": false,
    "titulo": "Chat de la iglesia",
    "databaseURL": "",
    "ruta": "chat/mensajes",
    "maxNombre": 20,
    "maxCaracteres": 280,
    "esperaEnvio": 4000,
    "textoVacio": "Todavía no hay mensajes. ¡Escribí el primero!",
    "textoBloqueado": "Ese mensaje tiene palabras que no están permitidas.",
    "filtro": {
      "activo": true,
      "modo": "censurar",
      "palabras": [
        "puta",
        "puto",
        "putita",
        "putito",
        "mierda",
        "concha",
        "conchuda",
        "forro",
        "forra",
        "pelotudo",
        "pelotuda",
        "boludo",
        "boluda",
        "sorete",
        "orto",
        "cagon",
        "cagada",
        "pija",
        "verga",
        "chota",
        "imbecil",
        "idiota",
        "tarado",
        "mogolico",
        "zorra",
        "perra",
        "maricon",
        "hijo de puta",
        "la concha de tu madre",
        "andate a la mierda"
      ]
    },
    "moderacion": {
      "apiKey": "",
      "email": "",
      "emails": [],
      "uids": []
    }
  },
  "textos": {
    "enPausa": "EN PAUSA",
    "enLinea": "EN LÍNEA",
    "conectando": "CONECTANDO",
    "reconectando": "RECONECTANDO",
    "buffering": "BUFFERING",
    "sinRed": "SIN RED",
    "pieRedes": "Contacto & Redes Sociales"
  },
  "temporizador": {
    "opciones": [
      15,
      30,
      60
    ]
  },
  "contactos": {
    "whatsapp": "",
    "oracion": "",
    "mensajeWhatsapp": "Hola, quisiera comunicarme con la radio.",
    "mensajeOracion": "Hola, quisiera dejar un pedido de oración:"
  },
  "instalacion": {
    "titulo": "Llevá {radio} con vos",
    "mensaje": "Instalá nuestra app y escuchá la radio desde tu pantalla de inicio.",
    "textoBoton": "Instalar app",
    "textoCancelar": "Ahora no",
    "mensajeExito": "¡Gracias por instalar {radio}!",
    "mensajeYaInstalada": "Ya tenés {radio} instalada. ¡Gracias por acompañarnos!",
    "instruccionesAndroid": "En Chrome o Edge, abrí el menú y elegí “Instalar app” o “Agregar a la pantalla principal”.",
    "instruccionesIOS": "En Safari, tocá Compartir y después “Agregar a la pantalla de inicio”.",
    "mensajeNoDisponible": "Si no aparece la opción, abrí el sitio con Chrome, Edge o Safari y verificá que tenga HTTPS.",
    "mostrarInvitacion": true
  }
};
