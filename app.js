(function () {
    'use strict';

    /* ======================================================================
       UTILIDADES
       ====================================================================== */
    const $ = (id) => document.getElementById(id);

    const DEFAULTS = {
      sitio: {
        nombre: 'Radio en vivo',
        nombreCorto: 'Radio',
        eslogan: '',
        descripcion: '',
        iglesia: '',
        ciudad: '',
        idioma: 'es',
        urlPublica: '',
        colorBarra: '#f59e0b'
      },
      marca: {
        primario: '#f59e0b',
        primarioOscuro: '#d97706',
        oro: '#d4af37',
        secundario: '#38bdf8',
        fondoModal: '#121824'
      },
      imagenes: {
        fondoMovil: 'assets/fondo-movil.jpg',
        fondoEscritorio: 'assets/fondo-escritorio.jpg',
        icono: 'assets/icono.png'
      },
      transmision: {
        url: '',
        tipo: 'audio/mp3',
        textoEspera: 'Sintonizando transmisión en vivo...',
        metadatos: { proveedor: '', streamId: '' }
      },
      modulos: { versiculo: true, redesSociales: true },
      barraSuperior: [],
      programacion: [],
      reuniones: { titulo: 'Nuestras Reuniones', subtitulo: '', nombre: '', items: [] },
      predicas: {
        titulo: 'Prédicas & Mensajes',
        apiKey: '',
        canalHandle: '',
        canalId: '',
        cantidadUltimas: 4,
        intervaloRefresco: 60000,
        textoBotonVivo: 'Ver Vivo',
        textoBotonArchivo: 'Ver aquí'
      },
      ubicacion: {
        titulo: 'Nuestra Ubicación',
        direccion: '', localidad: '', provincia: '', codigoPostal: '',
        linkMapa: '', embedUrl: '',
        textoComoLlegar: 'Cómo llegar', textoMiUbicacion: 'Usar mi ubicación',
        textoConsultarCongregaciones: 'Consultar por las congregaciones de la común fe',
        consultaWhatsapp: '', consultaUrl: '', mensajeConsultarCongregaciones: ''
      },
      redes: [],
      textos: {
        enPausa: 'EN PAUSA',
        enLinea: 'EN LÍNEA',
        conectando: 'CONECTANDO',
        reconectando: 'RECONECTANDO',
        buffering: 'BUFFERING',
        sinRed: 'SIN RED',
        pieRedes: 'Contacto & Redes Sociales'
      },
      temporizador: { opciones: [15, 30, 60] },
      versiculo: { lista: [] }
    };

    function esObjetoPlano(valor) {
      return valor !== null && typeof valor === 'object' && !Array.isArray(valor);
    }

    function combinar(base, extra) {
      if (Array.isArray(extra)) return extra.slice();
      const salida = esObjetoPlano(base) ? Object.assign({}, base) : {};
      if (!esObjetoPlano(extra)) return salida;

      Object.keys(extra).forEach((clave) => {
        const valor = extra[clave];
        if (esObjetoPlano(valor) && esObjetoPlano(salida[clave])) {
          salida[clave] = combinar(salida[clave], valor);
        } else if (valor !== undefined) {
          salida[clave] = valor;
        }
      });
      return salida;
    }

    const C = combinar(DEFAULTS, RadioCore.sanitize(window.CONFIG || {}));
    C.versiculo = {lista: window.VERSICULOS || []};
    RadioCore.applyContacts(C);

    const COLORES_RED = {
      facebook: '#1877f2',
      whatsapp: '#25d366',
      youtube: '#ff0000',
      compartir: '#8b5cf6',
      chromecast: '#3b82f6'
    };

    function icono(clases) {
      const i = document.createElement('i');
      i.className = clases || 'fa-solid fa-circle';
      i.setAttribute('aria-hidden', 'true');
      return i;
    }

    function ponerMeta(selector, valor) {
      const el = document.querySelector(selector);
      if (el && valor) el.setAttribute('content', valor);
    }

    /* ======================================================================
       1. IDENTIDAD, COLORES E IMÁGENES
       ====================================================================== */
    function aplicarIdentidad() {
      const s = C.sitio;
      $('radioName').textContent = s.nombre;
      $('radioSlogan').textContent = s.eslogan;

      document.title = s.nombre;
      document.documentElement.lang = s.idioma || 'es';

      ponerMeta('#metaDescription', s.descripcion);
      ponerMeta('#ogTitle', s.nombre);
      ponerMeta('#ogDescription', s.descripcion);
      ponerMeta('#ogImage', C.imagenes.fondoMovil);
      ponerMeta('#ogUrl', s.urlPublica || window.location.href);
      ponerMeta('#themeColorMeta', s.colorBarra);
      ponerMeta('#appleTitle', s.nombreCorto);

      const metaTema = $('themeColorMeta');
      if (metaTema) metaTema.setAttribute('content', s.colorBarra || C.marca.primario);

      document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]').forEach((link) => {
        link.setAttribute('href', C.imagenes.icono);
      });

      const raiz = document.documentElement.style;
      raiz.setProperty('--primario', C.marca.primario);
      raiz.setProperty('--primario-oscuro', C.marca.primarioOscuro);
      raiz.setProperty('--oro', C.marca.oro);
      raiz.setProperty('--secundario', C.marca.secundario);
      raiz.setProperty('--fondo-modal', C.marca.fondoModal);
      raiz.setProperty('--fondo-movil', 'url("' + C.imagenes.fondoMovil + '")');
      raiz.setProperty('--fondo-escritorio', 'url("' + C.imagenes.fondoEscritorio + '")');

      if (s.nombreCorto) $('appleTitle') && $('appleTitle').setAttribute('content', s.nombreCorto);

      $('footerTitle').textContent = C.textos.pieRedes;
      $('statusText').textContent = C.textos.enPausa;
      $('songInfoText').textContent = C.transmision.textoEspera;
    }

    /* ======================================================================
       2. BARRA SUPERIOR
       ====================================================================== */
    const MODULOS_CON_DATOS = {
      programacion: () => {
        const p = C.programacion;
        if (Array.isArray(p)) return p.length > 0;
        return !!(p && Array.isArray(p.grilla) && p.grilla.length > 0);
      },
      reuniones: () => C.reuniones && Array.isArray(C.reuniones.items) && C.reuniones.items.length > 0,
      predicas: () => !!(C.predicas && (C.predicas.modo === 'manual' || C.predicas.canalHandle || C.predicas.canalId)),
      ubicacion: () => !!C.ubicacion,
      chat: () => !!(C.chat && C.chat.habilitado !== false && String(C.chat.databaseURL || '').trim())
    };

    function renderBarraSuperior() {
      const contenedor = $('topActions');
      contenedor.replaceChildren();
      $('topBar').classList.remove('oculto');
      const botones = (C.barraSuperior || []).filter((b) => {
        if (!b || !b.id) return false;
        if (b.activo === false) return false;
        const verificador = MODULOS_CON_DATOS[b.id];
        return verificador ? verificador() : true;
      });

      if (!botones.length) {
        $('topBar').classList.add('oculto');
        return;
      }

      botones.forEach((b) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-top';
        btn.title = b.titulo || b.etiqueta || '';
        btn.setAttribute('aria-label', b.titulo || b.etiqueta || b.id);

        const i = icono(b.icono);
        if (b.color) i.style.color = b.color;
        btn.appendChild(i);

        const span = document.createElement('span');
        span.textContent = b.etiqueta || '';
        if (b.id === 'temporizador') {
          span.id = 'timerLabel';
          span.textContent = b.etiqueta || 'Off';
        }
        btn.appendChild(span);

        btn.addEventListener('click', () => ejecutarAccion(b.id));
        contenedor.appendChild(btn);
      });
    }

    function ejecutarAccion(id) {
      switch (id) {
        case 'temporizador': cicloTemporizador(); break;
        case 'programacion': abrirModal('modalProgramacion'); break;
        case 'reuniones': abrirModal('modalReuniones'); break;
        case 'predicas': abrirModal('modalPredicas'); break;
        case 'ubicacion': pausarAudio(); abrirModal('modalUbicacion'); break;
        case 'chat': pausarAudio(); abrirModal('modalChat'); break;
        case 'instalarApp': instalarPWA(); break;
      }
    }

    /* ======================================================================
       3. PROGRAMACIÓN
       ====================================================================== */
    function normalizarDia(valor) {
      return String(valor || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
    }

    function esGrillaProgramacion(p) {
      return !!p && !Array.isArray(p) && Array.isArray(p.dias) && Array.isArray(p.grilla);
    }

    function renderProgramacion() {
      const lista = $('programacionList');
      lista.innerHTML = '';

      if (esGrillaProgramacion(C.programacion)) {
        renderGrillaProgramacion(C.programacion, lista);
        return;
      }

      const programas = Array.isArray(C.programacion) ? C.programacion : [];

      if (!programas.length) {
        const vacio = document.createElement('div');
        vacio.className = 'empty-message';
        vacio.textContent = 'Todavía no hay programas cargados.';
        lista.appendChild(vacio);
        return;
      }

      programas.forEach((p) => {
        const fila = document.createElement('div');
        fila.className = 'schedule-item';

        const info = document.createElement('div');
        info.className = 'schedule-info';

        const titulo = document.createElement('span');
        titulo.className = 'schedule-title';
        titulo.textContent = p.titulo || '';
        info.appendChild(titulo);

        if (p.dias) {
          const dias = document.createElement('span');
          dias.className = 'schedule-days';
          dias.textContent = p.dias;
          info.appendChild(dias);
        }

        const hora = document.createElement('span');
        hora.className = 'schedule-time';
        hora.textContent = p.horario || '';

        fila.appendChild(info);
        fila.appendChild(hora);
        lista.appendChild(fila);
      });
    }

    function renderGrillaProgramacion(programacion, contenedor) {
      const dias = (programacion.dias || []).filter(Boolean);
      const items = (programacion.grilla || []).filter((i) => i && i.dia && i.hora);

      const pestanas = document.createElement('div');
      pestanas.className = 'prog-tabs';
      pestanas.setAttribute('role', 'tablist');

      const turnos = document.createElement('div');
      turnos.className = 'prog-slots';

      // Abre en el día actual; si ese día no está en la lista, abre en el primero
      const nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const hoy = nombresDias[new Date().getDay()];
      const activo = dias.find((d) => normalizarDia(d) === normalizarDia(hoy)) || dias[0];

      function pintarDia(dia) {
        turnos.innerHTML = '';

        Array.prototype.forEach.call(pestanas.children, (boton) => {
          const elegido = normalizarDia(boton.dataset.dia) === normalizarDia(dia);
          boton.classList.toggle('activo', elegido);
          boton.setAttribute('aria-selected', elegido ? 'true' : 'false');
        });

        const delDia = items
          .filter((i) => normalizarDia(i.dia) === normalizarDia(dia))
          .sort((a, b) => String(a.hora).localeCompare(String(b.hora)));

        if (!delDia.length) {
          const vacio = document.createElement('div');
          vacio.className = 'empty-message';
          vacio.textContent = 'Sin programación para este día.';
          turnos.appendChild(vacio);
          return;
        }

        delDia.forEach((item) => {
          const fila = document.createElement('div');
          fila.className = 'prog-slot';

          const hora = document.createElement('span');
          hora.className = 'prog-hora';
          hora.textContent = item.hora;

          const titulo = document.createElement('span');
          titulo.className = 'prog-programa';
          titulo.textContent = item.titulo || '';

          fila.appendChild(hora);
          fila.appendChild(titulo);
          turnos.appendChild(fila);
        });
      }

      dias.forEach((dia) => {
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'prog-tab';
        boton.dataset.dia = dia;
        boton.setAttribute('role', 'tab');
        boton.textContent = dia;
        boton.addEventListener('click', () => pintarDia(dia));
        pestanas.appendChild(boton);
      });

      contenedor.appendChild(pestanas);
      contenedor.appendChild(turnos);

      if (activo) pintarDia(activo);
    }

    /* ======================================================================
       4. REUNIONES
       ====================================================================== */
    function renderReuniones() {
      const r = C.reuniones;
      $('reunionesSubtitulo').textContent = r.subtitulo || '';
      $('reunionesNombre').textContent = r.nombre || '';

      const lista = $('reunionesList');
      lista.innerHTML = '';

      (r.items || []).forEach((item) => {
        const fila = document.createElement('div');
        fila.className = 'reunion-row' + (item.destacado ? ' destacado' : '');

        const cajaIcono = document.createElement('div');
        cajaIcono.className = 'reunion-icon-box';
        cajaIcono.appendChild(icono(item.icono || 'fa-solid fa-church'));

        const detalles = document.createElement('div');
        detalles.className = 'reunion-details';

        const etiquetaHora = document.createElement('div');
        etiquetaHora.className = 'reunion-time-tag';

        const dia = document.createElement('span');
        dia.className = 'day';
        dia.textContent = item.dia || '';

        const hora = document.createElement('span');
        hora.className = 'hour';
        hora.textContent = item.hora || '';

        etiquetaHora.appendChild(dia);
        etiquetaHora.appendChild(hora);

        const nombre = document.createElement('span');
        nombre.className = 'reunion-name';
        nombre.textContent = item.nombre || '';

        detalles.appendChild(etiquetaHora);
        detalles.appendChild(nombre);

        fila.appendChild(cajaIcono);
        fila.appendChild(detalles);
        lista.appendChild(fila);
      });
    }

    /* ======================================================================
       5. REDES Y ACCIONES
       ====================================================================== */
    function renderRedes() {
      const contenedor = $('socialButtons');
      contenedor.replaceChildren();
      $('footerSection').classList.remove('oculto');

      if (!C.modulos.redesSociales || !C.redes.length) {
        $('footerSection').classList.add('oculto');
        return;
      }

      C.redes.forEach((red) => {
        const tipo = red.tipo || 'otro';
        const esAccion = tipo === 'compartir' || tipo === 'chromecast';
        const el = document.createElement(esAccion ? 'button' : 'a');

        el.className = 'social-btn' + (tipo === 'chromecast' ? ' cast-btn' : '');
        el.title = red.etiqueta || '';
        el.setAttribute('aria-label', red.etiqueta || tipo);
        el.style.backgroundColor = red.color || COLORES_RED[tipo] || C.marca.primario;

        if (esAccion) {
          el.type = 'button';
        } else {
          el.href = red.url || '#';
          el.target = '_blank';
          el.rel = 'noopener';
        }

        el.appendChild(icono(red.icono || 'fa-solid fa-link'));

        if (tipo === 'compartir') el.addEventListener('click', compartirSitio);
        if (tipo === 'chromecast') el.addEventListener('click', transmitirATV);

        contenedor.appendChild(el);
      });
    }

    /* ======================================================================
       6. VERSÍCULO DEL DÍA
       ====================================================================== */
    function versiculoDelDia() {
      const lista = C.versiculo.lista || [];
      if (!lista.length) return null;

      const ahora = new Date();
      const inicioAnio = new Date(ahora.getFullYear(), 0, 0);
      const diaDelAnio = Math.floor((ahora - inicioAnio) / 86400000);

      return lista[diaDelAnio % lista.length];
    }

    function renderVersiculo() {
      const tarjeta = $('verseCard');
      const lista = C.versiculo.lista || [];

      if (!C.modulos.versiculo || !lista.length) {
        tarjeta.classList.add('oculto');
        return;
      }

      const v = versiculoDelDia();
      if (!v) { tarjeta.classList.add('oculto'); return; }

      $('verseText').textContent = '“' + v.text + '”';
      $('verseRef').textContent = v.ref || '';
    }

    function programarCambioDeVersiculo() {
      const ahora = new Date();
      const medianoche = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1, 0, 0, 0);

      setTimeout(() => {
        renderVersiculo();
        programarCambioDeVersiculo();
      }, medianoche.getTime() - ahora.getTime());
    }

    /* ======================================================================
       7. MODALES
       ====================================================================== */
    const modales = ['modalInstalar', 'modalProgramacion', 'modalReuniones', 'modalUbicacion', 'modalPredicas', 'modalChat'];

    function abrirModal(id) {
      const modal = $(id);
      if (!modal) return;

      modal.style.display = 'flex';

      if (id === 'modalPredicas') iniciarAutoRefrescoYouTube();
      if (id === 'modalUbicacion') cargarMapa();
      if (id === 'modalChat') iniciarChat();
    }

    function cerrarModal(id) {
      const modal = $(id);
      if (!modal) return;

      modal.style.display = 'none';

      if (id === 'modalPredicas') {
        detenerAutoRefrescoYouTube();
        cerrarVideo();
      }
      if (id === 'modalUbicacion') descargarMapa();
      if (id === 'modalChat') detenerChat();
    }

    function cerrarTodosLosModales() {
      modales.forEach((id) => {
        const modal = $(id);
        if (modal && modal.style.display === 'flex') cerrarModal(id);
      });
    }

    modales.forEach((id) => {
      const modal = $(id);
      if (!modal) return;
      modal.addEventListener('click', (e) => {
        if (e.target === modal) cerrarModal(id);
      });
    });

    document.querySelectorAll('[data-cerrar]').forEach((btn) => {
      btn.addEventListener('click', () => cerrarModal(btn.getAttribute('data-cerrar')));
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') cerrarTodosLosModales();
    });

    /* ======================================================================
       8. UBICACIÓN Y MAPA
       ====================================================================== */
    function direccionCompleta() {
      const u = C.ubicacion;
      const partes = [u.direccion, u.localidad, u.provincia].filter(Boolean);
      let texto = partes.join(', ');
      if (u.codigoPostal) texto += ' (CP ' + u.codigoPostal + ')';
      return texto;
    }

    function urlComoLlegar(origen) {
      const destino = encodeURIComponent(direccionCompleta() + ', Argentina');
      let url = 'https://www.google.com/maps/dir/?api=1&destination=' + destino;
      if (origen) url += '&origin=' + encodeURIComponent(origen) + '&travelmode=driving';
      return url;
    }

    function urlConsultarCongregaciones() {
      const u = C.ubicacion;
      if (u.consultaUrl) return u.consultaUrl;
      const telefono = String(u.consultaWhatsapp || '').replace(/[^0-9]/g, '');
      if (!telefono) return '';
      const mensaje = u.mensajeConsultarCongregaciones || 'Hola, quisiera consultar por las congregaciones de la común fe. ¿Me pueden dar información?';
      return 'https://wa.me/' + telefono + '?text=' + encodeURIComponent(mensaje);
    }

    function cargarMapa() {
      const iframe = $('mapaIframe');
      if (!iframe || !C.ubicacion.embedUrl) return;
      if (!iframe.getAttribute('src')) iframe.src = C.ubicacion.embedUrl;
    }

    function descargarMapa() {
      const iframe = $('mapaIframe');
      if (iframe) iframe.removeAttribute('src');
      const estado = $('ubicacionEstado');
      if (estado) estado.textContent = '';
    }

    function renderUbicacion() {
      const u = C.ubicacion;

      $('ubicacionNombre').textContent = C.reuniones.nombre || C.sitio.iglesia || '';
      $('ubicacionDireccion').textContent = direccionCompleta();

      const comoLlegar = $('btnComoLlegar');
      comoLlegar.href = urlComoLlegar();
      comoLlegar.target = '_blank';
      comoLlegar.rel = 'noopener';

      const enlace = $('enlaceMapa');
      enlace.href = u.linkMapa || comoLlegar.href;

      $('btnComoLlegarTexto').textContent = u.textoComoLlegar || 'Cómo llegar';
      $('btnMiUbicacionTexto').textContent = u.textoMiUbicacion || 'Usar mi ubicación';

      const btnConsultar = $('btnConsultarCongregaciones');
      if (btnConsultar) {
        const textoConsultar = $('btnConsultarCongregacionesTexto');
        if (textoConsultar) {
          textoConsultar.textContent = u.textoConsultarCongregaciones || 'Consultar por las congregaciones de la común fe';
        }
        const urlConsultar = urlConsultarCongregaciones();
        if (urlConsultar) {
          btnConsultar.href = urlConsultar;
          btnConsultar.target = '_blank';
          btnConsultar.rel = 'noopener';
          btnConsultar.hidden = false;
        } else {
          btnConsultar.hidden = true;
        }
      }
    }

    function usarMiUbicacion() {
      const estado = $('ubicacionEstado');

      if (!navigator.geolocation) {
        estado.textContent = 'Tu navegador no permite obtener la ubicación. Usá "Cómo llegar" y escribí tu dirección.';
        return;
      }

      estado.textContent = 'Buscando tu ubicación…';

      navigator.geolocation.getCurrentPosition(
        (posicion) => {
          const origen = posicion.coords.latitude + ',' + posicion.coords.longitude;
          window.open(urlComoLlegar(origen), '_blank', 'noopener');
          estado.textContent = 'Listo: abrimos el mapa con tu ubicación.';
        },
        () => {
          estado.textContent = 'No pudimos obtener tu ubicación. Podés tocar "Cómo llegar" y escribir tu dirección.';
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }

    $('btnMiUbicacion').addEventListener('click', usarMiUbicacion);

    /* ======================================================================
       9. REPRODUCTOR DE AUDIO
       ====================================================================== */
    let streamUrl = C.transmision.url;
    const audio = $('radioStream');
    const silentAudio = $('silentAudio');
    const playBtn = $('playBtn');
    const playIcon = $('playIcon');
    const volSlider = $('volSlider');
    const volIcon = $('volIcon');
    const statusDot = $('statusDot');
    const statusText = $('statusText');

    let temporizadorTimeout = null;
    let temporizadorMinutos = 0;
    let pausadoPorUsuario = true;
    let reconectando = false;
    let wakeLock = null;
    let castSession = null;

    function actualizarEstado(clase, texto) {
      statusDot.className = 'status-dot ' + clase;
      statusText.textContent = texto;
    }

    async function pedirWakeLock() {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch (e) { /* no soportado */ }
    }

    function liberarWakeLock() {
      if (wakeLock) {
        wakeLock.release().then(() => { wakeLock = null; }).catch(() => {});
      }
    }

    function actualizarEstadoMediaSession(estado) {
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = estado;
    }

    function configurarMediaSession(titulo) {
      if (!('mediaSession' in navigator)) return;

      let portada = C.imagenes.fondoMovil;
      try { portada = new URL(C.imagenes.fondoMovil, window.location.href).href; } catch (e) {}

      navigator.mediaSession.metadata = new MediaMetadata({
        title: titulo || C.sitio.nombre,
        artist: C.sitio.eslogan || C.sitio.nombre,
        album: C.sitio.nombreCorto || '',
        artwork: [{ src: portada, sizes: '512x512', type: 'image/jpeg' }]
      });

      navigator.mediaSession.setActionHandler('play', () => reproducirAudio());
      navigator.mediaSession.setActionHandler('pause', () => pausarAudio());
      navigator.mediaSession.setActionHandler('stop', () => pausarAudio());
    }

    configurarMediaSession();

    const workerBlob = new Blob([
      'let interval=null;' +
      'self.onmessage=function(e){' +
      '  if(e.data==="start"){ if(!interval){ interval=setInterval(function(){ self.postMessage("check"); },3000); } }' +
      '  else if(e.data==="stop"){ if(interval){ clearInterval(interval); interval=null; } }' +
      '};'
    ], { type: 'application/javascript' });

    const keepAliveWorker = new Worker(URL.createObjectURL(workerBlob));
    keepAliveWorker.onmessage = (e) => {
      if (e.data === 'check' && !pausadoPorUsuario) {
        if (audio.paused || audio.readyState < 2) forzarReconexion();
      }
    };

    function urlConMarcaDeTiempo(url) {
      return url + (url.indexOf('?') === -1 ? '?' : '&') + 't=' + Date.now();
    }

    function reproducirAudio() {
      if (!streamUrl) { actualizarEstado('offline', 'CONFIGURAR RADIO'); return; }
      cerrarVideo();

      if (!streamUrl) {
        actualizarEstado('offline', C.textos.sinRed);
        return;
      }

      pausadoPorUsuario = false;
      playIcon.className = 'fa-solid fa-spinner fa-spin';
      actualizarEstado('reconnecting', C.textos.conectando);

      silentAudio.play().catch(() => {});
      pedirWakeLock();

      audio.src = urlConMarcaDeTiempo(streamUrl);

      audio.play().then(() => {
        playBtn.classList.add('playing');
        playBtn.setAttribute('aria-label', 'Pausar');
        playIcon.className = 'fa-solid fa-pause';
        actualizarEstado('online', C.textos.enLinea);
        configurarMediaSession();
        actualizarEstadoMediaSession('playing');
        keepAliveWorker.postMessage('start');
      }).catch(() => {
        if (!pausadoPorUsuario) {
          actualizarEstado('reconnecting', C.textos.reconectando);
          setTimeout(reproducirAudio, 2000);
        } else {
          pausarAudio();
        }
      });
    }

    function pausarAudio() {
      pausadoPorUsuario = true;
      keepAliveWorker.postMessage('stop');
      liberarWakeLock();

      audio.pause();
      silentAudio.pause();
      audio.removeAttribute('src');
      audio.load();

      playBtn.classList.remove('playing');
      playBtn.setAttribute('aria-label', 'Reproducir');
      playIcon.className = 'fa-solid fa-play';
      actualizarEstado('offline', C.textos.enPausa);
      actualizarEstadoMediaSession('paused');
    }

    function alternarAudio() {
      if (audio.paused || pausadoPorUsuario) reproducirAudio();
      else pausarAudio();
    }

    function forzarReconexion() {
      if (pausadoPorUsuario || reconectando) return;
      reconectando = true;

      playIcon.className = 'fa-solid fa-spinner fa-spin';
      actualizarEstado('reconnecting', C.textos.reconectando);

      audio.pause();
      audio.removeAttribute('src');
      audio.load();

      setTimeout(() => {
        if (pausadoPorUsuario) { reconectando = false; return; }

        audio.src = urlConMarcaDeTiempo(streamUrl);
        audio.play().then(() => {
          playBtn.classList.add('playing');
          playIcon.className = 'fa-solid fa-pause';
          actualizarEstado('online', C.textos.enLinea);
          actualizarEstadoMediaSession('playing');
        }).catch(() => {
          if (!pausadoPorUsuario) setTimeout(forzarReconexion, 2000);
        }).finally(() => { reconectando = false; });
      }, 300);
    }

    audio.addEventListener('waiting', () => {
      if (!pausadoPorUsuario) {
        playIcon.className = 'fa-solid fa-spinner fa-spin';
        actualizarEstado('reconnecting', C.textos.buffering);
      }
    });

    audio.addEventListener('playing', () => {
      if (!pausadoPorUsuario) {
        playBtn.classList.add('playing');
        playIcon.className = 'fa-solid fa-pause';
        actualizarEstado('online', C.textos.enLinea);
      }
    });

    audio.addEventListener('pause', () => {
      if (!pausadoPorUsuario && !reconectando) {
        actualizarEstadoMediaSession('paused');
        actualizarEstado('reconnecting', C.textos.reconectando);
        setTimeout(() => { if (!pausadoPorUsuario) forzarReconexion(); }, 1000);
      }
    });

    audio.addEventListener('ended', () => { if (!pausadoPorUsuario) forzarReconexion(); });
    audio.addEventListener('stalled', () => { if (!pausadoPorUsuario) forzarReconexion(); });
    audio.addEventListener('error', () => { if (!pausadoPorUsuario) forzarReconexion(); });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !pausadoPorUsuario) {
        pedirWakeLock();
        if (audio.paused || audio.readyState < 2) forzarReconexion();
      }
    });

    window.addEventListener('online', () => { if (!pausadoPorUsuario) forzarReconexion(); });
    window.addEventListener('offline', () => { if (!pausadoPorUsuario) actualizarEstado('offline', C.textos.sinRed); });

    playBtn.addEventListener('click', alternarAudio);

    function ajustarVolumen(valor) {
      audio.volume = Number(valor);
      volIcon.className = valor == 0
        ? 'fa-solid fa-volume-xmark'
        : (valor < 0.5 ? 'fa-solid fa-volume-low' : 'fa-solid fa-volume-high');
    }

    volSlider.addEventListener('input', (e) => ajustarVolumen(e.target.value));

    function alternarSilencio() {
      if (audio.volume > 0) {
        volSlider.value = 0;
        ajustarVolumen(0);
      } else {
        volSlider.value = 1;
        ajustarVolumen(1);
      }
    }

    volIcon.addEventListener('click', alternarSilencio);
    volIcon.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alternarSilencio(); }
    });

    /* ======================================================================
       10. TÍTULO DE LA CANCIÓN (ZENO.FM)
       ====================================================================== */
    function iniciarMetadatos() {
      const meta = C.transmision.metadatos || {};
      const salida = $('songInfoText');

      if (meta.proveedor !== 'zeno' || !meta.streamId) {
        salida.textContent = C.sitio.nombre;
        return;
      }

      const url = 'https://api.zeno.fm/mounts/metadata/subscribe/' + encodeURIComponent(meta.streamId);

      try {
        const fuente = new EventSource(url);

        fuente.onmessage = (event) => {
          try {
            const datos = JSON.parse(event.data);
            let titulo = datos.streamTitle || '';

            if (!titulo && datos.currentSong) {
              titulo = (datos.currentArtist || C.sitio.nombre) + ' - ' + datos.currentSong;
            }

            if (titulo && titulo.trim()) {
              salida.textContent = titulo;
              configurarMediaSession(titulo);
            } else {
              salida.textContent = C.sitio.nombre;
            }
          } catch (e) { /* mensaje inválido */ }
        };

        fuente.onerror = () => {
          if (salida.textContent === C.transmision.textoEspera) {
            salida.textContent = C.sitio.nombre;
          }
        };
      } catch (e) {
        salida.textContent = C.sitio.nombre;
      }
    }

    /* ======================================================================
       11. PRÉDICAS (YOUTUBE)
       ====================================================================== */
    let YT = C.predicas;
    let intervaloYouTube = null;
    let youtubeEnCurso = false;

    function escaparHTML(valor) {
      return String(valor == null ? '' : valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function formatearFecha(fechaISO) {
      if (!fechaISO) return '';
      const fecha = new Date(fechaISO);
      if (isNaN(fecha.getTime())) return '';
      return fecha.toLocaleDateString(C.sitio.idioma || 'es', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
    }

    function urlCanal() {
      const handle = (YT.canalHandle || '').replace(/^@?/, '@');
      return 'https://www.youtube.com/' + handle;
    }

    async function pedirJSON(url, timeout) {
      const control = new AbortController();
      const reloj = setTimeout(() => control.abort(), timeout || 12000);

      try {
        const respuesta = await fetch(url, { method: 'GET', cache: 'no-store', signal: control.signal });
        let datos = null;
        try { datos = await respuesta.json(); } catch (e) {}

        if (!respuesta.ok) {
          const mensaje = datos && datos.error && datos.error.message
            ? datos.error.message
            : 'HTTP ' + respuesta.status;
          throw new Error(mensaje);
        }
        return datos;
      } finally {
        clearTimeout(reloj);
      }
    }

    function crearBotonVideo(videoId, titulo, texto) {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'btn-play-video';

      boton.appendChild(icono('fa-solid fa-play'));
      boton.appendChild(document.createTextNode(' ' + texto));

      boton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        reproducirVideo(videoId, titulo);
      });

      return boton;
    }

    function dibujarItem(contenedor, videoId, titulo, fechaTexto, esVivo) {
      const item = document.createElement('div');
      item.className = esVivo ? 'schedule-item live-item' : 'schedule-item';

      const info = document.createElement('div');
      info.className = 'schedule-info';

      if (esVivo) {
        const etiqueta = document.createElement('span');
        etiqueta.className = 'badge-live';
        etiqueta.appendChild(icono('fa-solid fa-satellite-dish'));
        etiqueta.appendChild(document.createTextNode(' EN VIVO AHORA'));
        info.appendChild(etiqueta);
      }

      const tituloEl = document.createElement('span');
      tituloEl.className = 'schedule-title';
      tituloEl.textContent = titulo || 'Transmisión en vivo';
      info.appendChild(tituloEl);

      const sub = document.createElement('span');
      sub.className = 'schedule-days';
      sub.textContent = esVivo
        ? (C.reuniones.nombre || C.sitio.iglesia || 'En vivo')
        : (fechaTexto ? 'Publicado el ' + fechaTexto : '');
      info.appendChild(sub);

      item.appendChild(info);
      item.appendChild(crearBotonVideo(
        videoId,
        titulo || 'Transmisión en vivo',
        esVivo ? (YT.textoBotonVivo || 'Ver Vivo') : (YT.textoBotonArchivo || 'Ver aquí')
      ));

      contenedor.appendChild(item);
    }

    function reproducirVideo(videoId, titulo) {
      if (!videoId) return;
      pausarAudio();

      const contenedor = $('videoWrapper');
      const reproductor = $('ytIframePlayer');
      const tituloEl = $('videoTitleDisplay');

      if (!contenedor || !reproductor || !tituloEl) return;

      tituloEl.textContent = titulo || 'Reproduciendo...';
      reproductor.src = 'https://www.youtube.com/embed/' + encodeURIComponent(videoId) + '?autoplay=1&playsinline=1&rel=0';
      contenedor.style.display = 'block';

      const contenido = document.querySelector('#modalPredicas .modal-content');
      if (contenido) contenido.scrollTop = 0;
    }

    function cerrarVideo() {
      const contenedor = $('videoWrapper');
      const reproductor = $('ytIframePlayer');
      if (contenedor && reproductor) {
        reproductor.removeAttribute('src');
        contenedor.style.display = 'none';
      }
    }

    $('cerrarVideo').addEventListener('click', cerrarVideo);

    async function resolverCanalId() {
      if (!YT.canalHandle) return YT.canalId;

      try {
        const url = 'https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=' +
          encodeURIComponent(YT.canalHandle) + '&key=' + encodeURIComponent(YT.apiKey);
        const datos = await pedirJSON(url);

        if (datos.items && datos.items.length && datos.items[0].id) return datos.items[0].id;
      } catch (e) {
        console.warn('No se pudo resolver el handle de YouTube:', e);
      }

      return YT.canalId;
    }

    function mensajePredicas(contenedor, mensaje, detalle) {
      contenedor.innerHTML = '';

      const caja = document.createElement('div');
      caja.className = 'empty-message';
      caja.appendChild(icono('fa-brands fa-youtube'));
      caja.appendChild(document.createElement('br'));
      caja.appendChild(document.createTextNode(mensaje));

      if (detalle) {
        caja.appendChild(document.createElement('br'));
        caja.appendChild(document.createElement('br'));
        const pequeño = document.createElement('span');
        pequeño.style.fontSize = '0.72rem';
        pequeño.textContent = detalle;
        caja.appendChild(pequeño);
      }

      caja.appendChild(document.createElement('br'));
      caja.appendChild(document.createElement('br'));

      const enlace = document.createElement('a');
      enlace.href = urlCanal();
      enlace.target = '_blank';
      enlace.rel = 'noopener';
      enlace.textContent = 'Abrir canal en YouTube';
      caja.appendChild(enlace);

      contenedor.appendChild(caja);
    }

    async function cargarVideosYouTube() {
      if (youtubeEnCurso) return;

      const contenedorVivo = $('liveStreamContainer');
      const contenedorVideos = $('latestVideosContainer');
      if (!contenedorVivo || !contenedorVideos) return;

      if (YT.modo !== 'automatico') {
        contenedorVivo.replaceChildren();
        contenedorVideos.replaceChildren();
        (YT.videos || []).forEach(v => {
          const id = RadioCore.youtubeId(v.url || v.id);
          if (id) dibujarItem(contenedorVideos, id, v.titulo || 'Prédica', v.fecha || '', false);
        });
        if (!contenedorVideos.children.length) mensajePredicas(contenedorVideos,
          'Todavía no hay prédicas cargadas.', 'Agregá enlaces de YouTube en el editor de la plantilla.');
        return;
      }

      if (!YT.apiKey) {
        contenedorVivo.innerHTML = '';
        mensajePredicas(contenedorVideos,
          'Falta configurar la API Key de YouTube.',
          'Pegala en config.js, dentro del bloque "predicas" (apiKey).');
        return;
      }

      youtubeEnCurso = true;

      contenedorVivo.innerHTML =
        '<div class="empty-message"><i class="fa-solid fa-spinner fa-spin"></i> Comprobando transmisión en vivo...</div>';
      contenedorVideos.innerHTML =
        '<div class="empty-message"><i class="fa-solid fa-spinner fa-spin"></i> Cargando transmisiones...</div>';

      try {
        const canalId = await resolverCanalId();

        if (!canalId) throw new Error('No se encontró el canal de YouTube.');

        const urlCanalDatos = 'https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=' +
          encodeURIComponent(canalId) + '&key=' + encodeURIComponent(YT.apiKey);

        const datosCanal = await pedirJSON(urlCanalDatos);
        const listaSubidas = datosCanal.items && datosCanal.items[0] &&
          datosCanal.items[0].contentDetails &&
          datosCanal.items[0].contentDetails.relatedPlaylists &&
          datosCanal.items[0].contentDetails.relatedPlaylists.uploads;

        if (!listaSubidas) throw new Error('No se encontró la lista de videos del canal.');

        const urlPlaylist = 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=' +
          encodeURIComponent(listaSubidas) + '&maxResults=50&key=' + encodeURIComponent(YT.apiKey);

        const datosPlaylist = await pedirJSON(urlPlaylist);

        const items = (datosPlaylist.items || []).filter((i) => i && i.contentDetails && i.contentDetails.videoId);
        const ids = items.map((i) => i.contentDetails.videoId);

        if (!ids.length) throw new Error('El canal no devolvió videos.');

        const urlVideos = 'https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails&id=' +
          ids.map(encodeURIComponent).join(',') + '&key=' + encodeURIComponent(YT.apiKey);

        const datosVideos = await pedirJSON(urlVideos);
        const videos = datosVideos.items || [];

        let videoVivo = videos.find((v) => {
          const detalles = v.liveStreamingDetails || {};
          const estado = v.snippet && v.snippet.liveBroadcastContent;
          return estado === 'live' ||
            (detalles.actualStartTime && !detalles.actualEndTime) ||
            detalles.concurrentViewers !== undefined;
        });

        if (!videoVivo) {
          try {
            const urlVivo = 'https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=' +
              encodeURIComponent(canalId) + '&eventType=live&type=video&order=date&maxResults=1&key=' +
              encodeURIComponent(YT.apiKey);

            const datosVivo = await pedirJSON(urlVivo);

            if (datosVivo.items && datosVivo.items.length && datosVivo.items[0].id && datosVivo.items[0].id.videoId) {
              const idVivo = datosVivo.items[0].id.videoId;
              videoVivo = videos.find((v) => v.id === idVivo) || {
                id: idVivo,
                snippet: datosVivo.items[0].snippet || {}
              };
            }
          } catch (e) {
            console.warn('No se pudo consultar el vivo actual:', e);
          }
        }

        const idVivo = videoVivo ? videoVivo.id : null;

        contenedorVivo.innerHTML = '';
        if (videoVivo) {
          dibujarItem(contenedorVivo, videoVivo.id,
            (videoVivo.snippet && videoVivo.snippet.title) || 'Transmisión en vivo', '', true);
        }

        const cantidad = Number(YT.cantidadUltimas) || 4;

        const archivados = videos
          .filter((v) => !!(v && v.id && v.id !== idVivo))
          .sort((a, b) => {
            const fa = new Date((a.liveStreamingDetails && a.liveStreamingDetails.actualEndTime) ||
              (a.snippet && a.snippet.publishedAt) || 0);
            const fb = new Date((b.liveStreamingDetails && b.liveStreamingDetails.actualEndTime) ||
              (b.snippet && b.snippet.publishedAt) || 0);
            return fb - fa;
          })
          .slice(0, cantidad);

        contenedorVideos.innerHTML = '';

        archivados.forEach((v) => {
          dibujarItem(contenedorVideos, v.id,
            (v.snippet && v.snippet.title) || 'Transmisión en vivo',
            formatearFecha((v.liveStreamingDetails && v.liveStreamingDetails.actualEndTime) ||
              (v.snippet && v.snippet.publishedAt)),
            false);
        });

        if (!archivados.length) {
          try {
            const urlArchivados = 'https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=' +
              encodeURIComponent(canalId) + '&eventType=completed&type=video&order=date&maxResults=10&key=' +
              encodeURIComponent(YT.apiKey);

            const datosArchivados = await pedirJSON(urlArchivados);

            (datosArchivados.items || [])
              .filter((i) => i && i.id && i.id.videoId && i.id.videoId !== idVivo)
              .slice(0, cantidad)
              .forEach((i) => {
                dibujarItem(contenedorVideos, i.id.videoId,
                  (i.snippet && i.snippet.title) || 'Transmisión en vivo',
                  formatearFecha(i.snippet && i.snippet.publishedAt), false);
              });
          } catch (e) {
            console.warn('No se pudieron obtener transmisiones archivadas:', e);
          }
        }

        if (!contenedorVideos.children.length) {
          mensajePredicas(contenedorVideos, 'Todavía no hay videos publicados en el canal.');
        }
      } catch (error) {
        console.error('Error al obtener las transmisiones de YouTube:', error);
        contenedorVivo.innerHTML = '';
        mensajePredicas(contenedorVideos,
          'No se pudieron cargar las transmisiones.',
          String((error && error.message) || error));
      } finally {
        youtubeEnCurso = false;
      }
    }

    function iniciarAutoRefrescoYouTube() {
      cargarVideosYouTube();

      if (intervaloYouTube) clearInterval(intervaloYouTube);

      intervaloYouTube = setInterval(() => {
        const modal = $('modalPredicas');
        if (modal && getComputedStyle(modal).display !== 'none') cargarVideosYouTube();
      }, Number(YT.intervaloRefresco) || 60000);
    }

    function detenerAutoRefrescoYouTube() {
      if (intervaloYouTube) {
        clearInterval(intervaloYouTube);
        intervaloYouTube = null;
      }
    }

    /* ======================================================================
       11.5 CHAT (Firebase Realtime Database, sin SDK)
       ====================================================================== */
    let CHAT = C.chat || {};
    let chatFuente = null;
    let chatPoll = null;
    let chatMensajes = [];
    let chatUltimoEnvio = 0;
    let chatIdCliente = '';

    function chatConfigurado() {
      if (!CHAT || CHAT.habilitado === false) return false;
      try { const u=new URL(CHAT.databaseURL);return u.protocol==='https:' && /(?:^|\.)(?:firebaseio\.com|firebasedatabase\.app)$/.test(u.hostname); } catch(e){ return false; }
    }

    function chatBase() {
      return String(CHAT.databaseURL || '').trim().replace(/\/+$/, '');
    }

    function chatRuta() {
      return String(CHAT.ruta || 'chat/mensajes').replace(/^\/+|\/+$/g, '');
    }

    function chatEndpoint(consulta) {
      return chatBase() + '/' + chatRuta() + '.json' + (consulta || '');
    }

    function chatId() {
      if (chatIdCliente) return chatIdCliente;
      try {
        chatIdCliente = '' || '';
        if (!chatIdCliente) {
          chatIdCliente = 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
          /* Identidad solo durante esta visita. */
        }
      } catch (e) {
        chatIdCliente = 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      }
      return chatIdCliente;
    }

    function definirEstadoChat(texto, esError) {
      const el = $('chatEstado');
      if (!el) return;
      el.textContent = texto || '';
      el.classList.toggle('error', !!esError);
    }

    function normalizarChat(datos) {
      if (!datos || typeof datos !== 'object') return [];
      return Object.keys(datos)
        .map((clave) => {
          const m = datos[clave] || {};
          return {
            id: clave,
            nombre: String(m.nombre || '').slice(0, Number(CHAT.maxNombre) || 20),
            texto: String(m.texto || '').slice(0, Number(CHAT.maxCaracteres) || 280),
            ts: Number(m.ts) || 0,
            cid: String(m.cid || '')
          };
        })
        .filter((m) => m.texto)
        .sort((a, b) => (a.ts - b.ts) || a.id.localeCompare(b.id))
        .slice(-120);
    }

    function marcarChatSinLeer() {
      const punto = $('chatPunto');
      if (punto) punto.hidden = false;
    }

    function pintarChat() {
      const lista = $('chatLista');
      if (!lista) return;

      const pegadoAbajo = lista.scrollHeight - lista.scrollTop - lista.clientHeight < 90;
      const estabaVacio = !lista.querySelector('.chat-msg');
      const mio = chatId();

      lista.innerHTML = '';

      if (!chatMensajes.length) {
        const vacio = document.createElement('p');
        vacio.className = 'chat-vacio';
        vacio.textContent = CHAT.textoVacio || 'Todavía no hay mensajes. ¡Escribí el primero!';
        lista.appendChild(vacio);
        return;
      }

      chatMensajes.forEach((m) => {
        const propio = !!m.cid && m.cid === mio;
        const burbuja = document.createElement('div');
        burbuja.className = 'chat-msg' + (propio ? ' propio' : '');

        const nombre = document.createElement('span');
        nombre.className = 'chat-msg-nombre';
        nombre.textContent = propio ? 'Vos' : (m.nombre || 'Anónimo');
        burbuja.appendChild(nombre);

        const texto = document.createElement('span');
        texto.className = 'chat-msg-texto';
        texto.textContent = aplicarFiltroChat(m.texto).texto;
        burbuja.appendChild(texto);

        if (chatToken) {
          const borrar = document.createElement('button');
          borrar.type = 'button';
          borrar.className = 'chat-borrar';
          borrar.title = 'Borrar mensaje';
          borrar.setAttribute('aria-label', 'Borrar mensaje');
          borrar.appendChild(icono('fa-solid fa-trash-can'));
          borrar.addEventListener('click', (evento) => {
            evento.stopPropagation();
            borrarMensajeChat(m.id);
          });
          burbuja.appendChild(borrar);
        }

        const hora = document.createElement('span');
        hora.className = 'chat-msg-hora';
        hora.textContent = m.ts
          ? new Date(m.ts).toLocaleTimeString(C.sitio.idioma || 'es', { hour: '2-digit', minute: '2-digit' })
          : '';
        burbuja.appendChild(hora);

        lista.appendChild(burbuja);
      });

      if (pegadoAbajo || estabaVacio) lista.scrollTop = lista.scrollHeight;
    }

    function aplicarCambioChat(ruta, datos) {
      const camino = String(ruta || '/');

      if (camino === '/' || camino === '') {
        chatMensajes = normalizarChat(datos);
        pintarChat();
        return;
      }

      const clave = camino.replace(/^\//, '');
      const indice = chatMensajes.findIndex((m) => m.id === clave);

      if (datos === null) {
        if (indice >= 0) chatMensajes.splice(indice, 1);
        pintarChat();
        return;
      }

      if (datos && typeof datos === 'object') {
        const nuevo = normalizarChat({ [clave]: datos })[0];
        if (!nuevo) return;

        if (indice >= 0) chatMensajes[indice] = nuevo;
        else chatMensajes.push(nuevo);

        chatMensajes.sort((a, b) => (a.ts - b.ts) || a.id.localeCompare(b.id));
        chatMensajes = chatMensajes.slice(-120);

        const modal = $('modalChat');
        const abierto = modal && modal.style.display === 'flex';
        if (!abierto && nuevo.cid !== chatId()) marcarChatSinLeer();

        pintarChat();
      }
    }

    async function cargarChat() {
      if (!chatConfigurado()) return;
      try {
        const respuesta = await fetch(chatEndpoint('?orderBy=%22%24key%22&limitToLast=120'), { cache: 'no-store' });
        if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
        chatMensajes = normalizarChat(await respuesta.json());
        pintarChat();
        definirEstadoChat('');
      } catch (e) {
        definirEstadoChat('No se pudo cargar el chat. Revisá la conexión.', true);
      }
    }

    function detenerRespaldoChat() {
      if (chatPoll) {
        clearInterval(chatPoll);
        chatPoll = null;
      }
    }

    function conectarChat() {
      if (!chatConfigurado() || chatFuente) return;

      try {
        chatFuente = new EventSource(chatEndpoint('?orderBy=%22%24key%22&limitToLast=120'));
      } catch (e) {
        chatFuente = null;
        return;
      }

      chatFuente.addEventListener('put', (evento) => {
        try {
          const datos = JSON.parse(evento.data);
          aplicarCambioChat(datos.path, datos.data);
        } catch (e) {}
      });

      chatFuente.onopen = () => {
        definirEstadoChat('');
        detenerRespaldoChat();
      };

      chatFuente.onerror = () => {
        definirEstadoChat('Reconectando…');
        if (!chatPoll) chatPoll = setInterval(cargarChat, 15000);
      };
    }

    async function enviarChat(evento) {
      if (evento) evento.preventDefault();
      if (!chatConfigurado()) return;

      const campoNombre = $('chatNombre');
      const campoTexto = $('chatTexto');
      if (!campoNombre || !campoTexto) return;

      const nombre = (campoNombre.value || '').replace(/\s+/g, ' ').trim().slice(0, Number(CHAT.maxNombre) || 20);
      const texto = (campoTexto.value || '').trim().slice(0, Number(CHAT.maxCaracteres) || 280);

      if (!nombre) {
        definirEstadoChat('Poné tu nombre para participar.', true);
        campoNombre.focus();
        return;
      }
      if (!texto) return;

      const filtrado = aplicarFiltroChat(texto);
      if (filtrado.bloqueado) {
        definirEstadoChat(CHAT.textoBloqueado || 'Ese mensaje tiene palabras que no están permitidas.', true);
        return;
      }

      const espera = Number(CHAT.esperaEnvio) || 4000;
      const ahora = Date.now();

      if (ahora - chatUltimoEnvio < espera) {
        definirEstadoChat('Esperá unos segundos antes de mandar otro mensaje.', true);
        return;
      }

      const boton = $('chatEnviar');
      if (boton) boton.disabled = true;
      definirEstadoChat('Enviando…');

      try {
        const respuesta = await fetch(chatEndpoint(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre: nombre, texto: filtrado.texto, ts: ahora, cid: chatId() })
        });

        if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);

        try { /* Identidad solo durante esta visita. */ } catch (e) {}

        campoTexto.value = '';
        chatUltimoEnvio = ahora;
        definirEstadoChat('');
        campoTexto.focus();
      } catch (e) {
        definirEstadoChat('No se pudo enviar. Probá de nuevo.', true);
      } finally {
        if (boton) boton.disabled = false;
      }
    }

    function iniciarChat() {
      const lista = $('chatLista');
      if (!lista) return;

      $('chatNombre').maxLength=Number(CHAT.maxNombre)||20;
      $('chatTexto').maxLength=Number(CHAT.maxCaracteres)||280;
      const titulo = $('tituloChatTexto');
      if (titulo) titulo.textContent = CHAT.titulo || 'Chat';

      if (!chatConfigurado()) {
        chatMensajes = [];
        lista.innerHTML = '';
        const aviso = document.createElement('p');
        aviso.className = 'chat-vacio';
        aviso.textContent = 'El chat todavía no está configurado. Pegá la URL de tu base de Firebase en config.js (bloque "chat").';
        lista.appendChild(aviso);
        return;
      }

      const campoNombre = $('chatNombre');
      if (campoNombre && !campoNombre.value) {
        try { campoNombre.value = '' || ''; } catch (e) {}
      }

      leerSesionModerador();
      actualizarPanelModo();

      cargarChat();
      conectarChat();

      const punto = $('chatPunto');
      if (punto) punto.hidden = true;

      setTimeout(() => {
        const campoTexto = $('chatTexto');
        if (campoNombre && !campoNombre.value) campoNombre.focus();
        else if (campoTexto) campoTexto.focus();
      }, 250);
    }

    function detenerChat() {
      if (chatFuente) {
        chatFuente.close();
        chatFuente = null;
      }
      detenerRespaldoChat();
    }

    function configurarBotonChat() {
      const boton = $('chatFlotante');
      if (!boton) return;
      boton.style.display = chatConfigurado() ? 'flex' : 'none';
      boton.title=CHAT.titulo || 'Chat';
      if (!boton.dataset.chatBound) {
        boton.addEventListener('click', () => { pausarAudio(); abrirModal('modalChat'); });
        boton.dataset.chatBound='true';
      }
    }

    const formularioChat = $('chatForm');
    if (formularioChat) formularioChat.addEventListener('submit', enviarChat);

    /* ------------------------- Filtro de palabras ------------------------- */
    let FILTRO = CHAT.filtro || {};
    let chatPatronFiltro;

    function patronFiltroChat() {
      if (chatPatronFiltro !== undefined) return chatPatronFiltro;

      const lista = Array.isArray(FILTRO.palabras) ? FILTRO.palabras : [];
      const piezas = lista
        .map((p) => String(p || '').trim().toLowerCase())
        .filter(Boolean)
        .map((p) => p
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          .split('')
          .map((c) => (c === ' ' ? '\\s+' : c + '+'))
          .join(''));

      chatPatronFiltro = piezas.length ? new RegExp('(?:' + piezas.join('|') + ')', 'gi') : null;
      return chatPatronFiltro;
    }

    function normalizarFiltroChat(texto) {
      const original = String(texto || '');
      const limpio = [];
      const mapa = [];

      for (let i = 0; i < original.length; i++) {
        const partes = original[i].normalize('NFD');
        for (let j = 0; j < partes.length; j++) {
          const c = partes[j];
          if (/[\u0300-\u036f]/.test(c)) continue;
          limpio.push(c.toLowerCase());
          mapa.push(i);
        }
      }

      const norm = limpio.join('')
        .replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e')
        .replace(/4/g, 'a').replace(/5/g, 's').replace(/7/g, 't')
        .replace(/@/g, 'a').replace(/\$/g, 's');

      return { norm: norm, mapa: mapa };
    }

    function aplicarFiltroChat(texto) {
      const original = String(texto || '');
      if (FILTRO.activo === false) return { texto: original, bloqueado: false };

      const patron = patronFiltroChat();
      if (!patron) return { texto: original, bloqueado: false };

      const normalizado = normalizarFiltroChat(original);
      const norm = normalizado.norm;
      const mapa = normalizado.mapa;

      patron.lastIndex = 0;

      let hubo = false;
      let encontrado;
      const caracteres = original.split('');

      while ((encontrado = patron.exec(norm)) !== null) {
        hubo = true;

        for (let k = encontrado.index; k < encontrado.index + encontrado[0].length; k++) {
          const indice = mapa[k];
          if (indice === undefined) continue;
          if (!/\s/.test(caracteres[indice])) caracteres[indice] = '*';
        }

        if (patron.lastIndex === encontrado.index) patron.lastIndex++;
      }

      if (!hubo) return { texto: original, bloqueado: false };

      if (String(FILTRO.modo || 'censurar') === 'bloquear') {
        return { texto: original, bloqueado: true };
      }

      return { texto: caracteres.join(''), bloqueado: false };
    }

    /* ------------------------- Moderación ------------------------- */
    let CHAT_MOD = CHAT.moderacion || {};
    let chatToken = '';
    let chatRefresh = '';
    let chatModoQuien = '';

    function moderacionConfigurada() {
      return !!(CHAT_MOD && String(CHAT_MOD.apiKey || '').trim());
    }

    function leerSesionModerador() {
      try {
        const guardado = null;
        if (!guardado) return;
        const datos = JSON.parse(guardado);
        if (datos && datos.token) {
          chatToken = datos.token;
          chatRefresh = datos.refresh || '';
          chatModoQuien = datos.email || '';
        }
      } catch (e) {}
    }

    function guardarSesionModerador() {
      try {
        /* Las credenciales no se guardan. */
      } catch (e) {}
    }

    function estadoModo(texto) {
      const el = $('chatModoEstado');
      if (el) el.textContent = texto || '';
    }

    function actualizarPanelModo() {
      const panel = $('chatModoPanel');
      const cajaForm = $('chatModoFormBox');
      const cajaActiva = $('chatModoActivo');
      const quien = $('chatModoQuien');
      const boton = $('chatModoBoton');

      if (boton) {
        boton.hidden = !moderacionConfigurada();
        boton.classList.toggle('activo', !!chatToken);
      }

      const campoCorreo = $('chatModoEmail');
      if (campoCorreo && !campoCorreo.value) {
        const correos = [].concat(CHAT_MOD.emails || CHAT_MOD.email || []);
        const primero = correos.filter(function (c) { return c && String(c).trim(); })[0];
        if (primero) campoCorreo.value = String(primero).trim();
      }

      if (!panel) return;

      const logueado = !!chatToken;
      if (cajaForm) cajaForm.hidden = logueado;
      if (cajaActiva) cajaActiva.hidden = !logueado;
      if (quien) quien.textContent = chatModoQuien || 'moderador';

      if (logueado) panel.hidden = false;
    }

    async function entrarModoModerador(evento) {
      if (evento) evento.preventDefault();
      if (!moderacionConfigurada()) return;

      const campoEmail = $('chatModoEmail');
      const campoPass = $('chatModoPass');
      const email = (campoEmail.value || '').trim();
      const clave = campoPass.value || '';

      if (!email || !clave) {
        estadoModo('Completá correo y contraseña.');
        return;
      }

      estadoModo('Entrando…');

      try {
        const respuesta = await fetch(
          'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' +
            encodeURIComponent(CHAT_MOD.apiKey),
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: clave, returnSecureToken: true })
          }
        );

        const datos = await respuesta.json();
        if (!respuesta.ok) {
          campoPass.value='';
          const codigo = (datos && datos.error && datos.error.message) || '';
          if (codigo.indexOf('INVALID_PASSWORD') >= 0 || codigo.indexOf('EMAIL_NOT_FOUND') >= 0 || codigo.indexOf('INVALID_LOGIN_CREDENTIALS') >= 0) {
            estadoModo('Correo o contraseña incorrectos.');
          } else if (codigo.indexOf('TOO_MANY_ATTEMPTS') >= 0) {
            estadoModo('Demasiados intentos. Esperá un rato.');
          } else {
            estadoModo('No se pudo entrar. Revisá la configuración.');
          }
          return;
        }

        const autorizados=CHAT_MOD.uids || [];
        if(!datos.idToken || !datos.localId || !autorizados.includes(datos.localId)) {
          campoPass.value='';
          estadoModo('Esta cuenta no está configurada como moderadora. Revisá su UID y las reglas de Firebase.');
          return;
        }
        chatToken = datos.idToken || '';
        chatRefresh = datos.refreshToken || '';
        chatModoQuien = datos.email || email;
        guardarSesionModerador();
        campoPass.value = '';
        estadoModo('');
        actualizarPanelModo();
        pintarChat();
      } catch (e) {
        estadoModo('No se pudo conectar. Revisá la conexión.');
      }
    }

    function salirModoModerador() {
      chatToken = '';
      chatRefresh = '';
      chatModoQuien = '';
      try { /* Las credenciales no se guardan. */ } catch (e) {}
      actualizarPanelModo();
      pintarChat();
    }

    function urlBorradoChat(id) {
      return chatBase() + '/' + chatRuta() + '/' + encodeURIComponent(id) + '.json?auth=' + encodeURIComponent(chatToken);
    }

    async function renovarAccesoModerador() {
      if (!chatRefresh) return false;
      try {
        const respuesta = await fetch(
          'https://securetoken.googleapis.com/v1/token?key=' + encodeURIComponent(CHAT_MOD.apiKey),
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(chatRefresh)
          }
        );
        const datos = await respuesta.json();
        if (!respuesta.ok || !datos || !datos.id_token) return false;
        chatToken = datos.id_token;
        if (datos.refresh_token) chatRefresh = datos.refresh_token;
        guardarSesionModerador();
        return true;
      } catch (e) {
        return false;
      }
    }

    async function borrarMensajeChat(id) {
      if (!chatToken || !id) return;
      if (!window.confirm('¿Borrar este mensaje del chat?')) return;

      definirEstadoChat('Borrando…');

      try {
        let respuesta = await fetch(urlBorradoChat(id), { method: 'DELETE' });

        if (respuesta.status === 401 || respuesta.status === 403) {
          // Primero intentamos renovar el acceso por si el token caducó.
          const renovado = await renovarAccesoModerador();
          if (renovado) respuesta = await fetch(urlBorradoChat(id), { method: 'DELETE' });

          if (respuesta.status === 401 || respuesta.status === 403) {
            if (renovado) {
              // El acceso es válido pero las reglas no le dan permiso a este correo.
              definirEstadoChat(
                'Firebase no autoriza el borrado con el correo «' + (chatModoQuien || 'con el que entraste') +
                '». Ese correo tiene que estar escrito en las reglas de la base de datos.',
                true
              );
            } else {
              salirModoModerador();
              definirEstadoChat('La sesión venció. Volvé a entrar en modo moderador.', true);
            }
            return;
          }
        }

        if (!respuesta.ok) {
          definirEstadoChat('No se pudo borrar el mensaje.', true);
          return;
        }

        chatMensajes = chatMensajes.filter((m) => m.id !== id);
        pintarChat();
        definirEstadoChat('Mensaje borrado.');
      } catch (e) {
        definirEstadoChat('No se pudo borrar el mensaje.', true);
      }
    }

    const formularioModo = $('chatModoForm');
    if (formularioModo) formularioModo.addEventListener('submit', entrarModoModerador);

    const botonModo = $('chatModoBoton');
    if (botonModo) {
      botonModo.addEventListener('click', () => {
        const panel = $('chatModoPanel');
        if (panel) panel.hidden = !panel.hidden;
      });
    }

    const botonSalirModo = $('chatSalirModo');
    if (botonSalirModo) botonSalirModo.addEventListener('click', salirModoModerador);

    /* ======================================================================
       12. TEMPORIZADOR PARA DORMIR
       ====================================================================== */
    const OPCIONES_TIMER = (C.temporizador.opciones || []).map(Number).filter((n) => n > 0);
    const ETIQUETAS_TIMER = [0].concat(OPCIONES_TIMER);

    function cicloTemporizador() {
      const indiceActual = ETIQUETAS_TIMER.indexOf(temporizadorMinutos);
      const siguiente = ETIQUETAS_TIMER[(indiceActual + 1) % ETIQUETAS_TIMER.length];

      temporizadorMinutos = siguiente;
      clearTimeout(temporizadorTimeout);

      const etiqueta = $('timerLabel');

      if (temporizadorMinutos > 0) {
        if (etiqueta) etiqueta.textContent = temporizadorMinutos + 'm';
        temporizadorTimeout = setTimeout(() => {
          if (!pausadoPorUsuario) pausarAudio();
          temporizadorMinutos = 0;
          if ($('timerLabel')) $('timerLabel').textContent = 'Off';
        }, temporizadorMinutos * 60 * 1000);
      } else if (etiqueta) {
        etiqueta.textContent = 'Off';
      }
    }

    /* ======================================================================
       13. COMPARTIR / SMART TV / INSTALAR
       ====================================================================== */
    function compartirSitio() {
      const datos = {
        title: C.sitio.nombre,
        text: C.sitio.descripcion || C.sitio.nombre,
        url: C.sitio.urlPublica || window.location.href
      };

      if (navigator.share) {
        navigator.share(datos).catch(() => {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(datos.url)
          .then(() => alert('¡Enlace copiado al portapapeles!'))
          .catch(() => alert(datos.url));
      } else {
        alert(datos.url);
      }
    }

    window.__onGCastApiAvailable = function (disponible) {
      if (!disponible) return;

      try {
        const contexto = cast.framework.CastContext.getInstance();
        contexto.setOptions({
          receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
          autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGINAL_URL
        });

        contexto.addEventListener(
          cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
          function () {
            castSession = contexto.getCurrentSession();
            const boton = document.querySelector('.cast-btn');
            if (!boton) return;

            if (castSession) {
              boton.style.backgroundColor = '#22c55e';
              boton.title = 'Transmitiendo a Smart TV (tocar para desconectar)';
            } else {
              boton.style.backgroundColor = '#3b82f6';
              boton.title = 'Transmitir a Smart TV';
            }
          }
        );
      } catch (e) { /* Cast no disponible */ }
    };

    function transmitirATV() {
      try {
        if (typeof cast === 'undefined' || !cast.framework) {
          alert('La transmisión a Smart TV requiere Google Chrome o un navegador compatible.');
          return;
        }

        const contexto = cast.framework.CastContext.getInstance();
        const sesionActual = contexto.getCurrentSession();

        if (sesionActual) {
          if (confirm('¿Deseás detener la transmisión en la Smart TV?')) sesionActual.endSession(true);
          return;
        }

        contexto.requestSession().then(() => {
          const sesion = contexto.getCurrentSession();
          if (!sesion) return;

          pausarAudio();

          const info = new chrome.cast.media.MediaInfo(streamUrl, C.transmision.tipo || 'audio/mp3');
          info.metadata = new chrome.cast.media.MusicTrackMediaMetadata();
          info.metadata.title = C.sitio.nombreCorto || C.sitio.nombre;
          info.metadata.subtitle = C.sitio.eslogan || '';

          try {
            info.metadata.images = [{ url: new URL(C.imagenes.fondoMovil, window.location.href).href }];
          } catch (e) {}

          sesion.loadMedia(new chrome.cast.media.LoadRequest(info));
        }).catch(() => {
          console.log('Sesión de Cast cancelada o sin dispositivos cercanos.');
        });
      } catch (e) {
        alert('Asegurate de estar conectado a la misma red Wi-Fi que tu Smart TV.');
      }
    }

    let promptInstalacion = null, instalacionConfirmada=false;
    function textoInstalacion(key,fallback) {
      return String((C.instalacion || {})[key] || fallback || '').replace(/\{radio\}/g,C.sitio.nombre);
    }
    function appInstalada() {
      return instalacionConfirmada || window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    }
    function aplicarTextosInstalacion() {
      $('tituloInstalar').textContent=textoInstalacion('titulo','Instalá {radio}');
      $('mensajeInstalar').textContent=textoInstalacion('mensaje','Escuchá la radio desde tu pantalla de inicio.');
      $('confirmarInstalar').textContent=textoInstalacion('textoBoton','Instalar app');
      $('posponerInstalar').textContent=textoInstalacion('textoCancelar','Ahora no');
    }
    function mostrarInstalacion() {
      aplicarTextosInstalacion();
      const ayuda=$('ayudaInstalar'),confirmar=$('confirmarInstalar');
      ayuda.textContent='';confirmar.hidden=!promptInstalacion || appInstalada();
      if(appInstalada()) ayuda.textContent=textoInstalacion('mensajeYaInstalada','Ya tenés {radio} instalada.');
      else if(!promptInstalacion) {
        const ios=/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
        ayuda.textContent=textoInstalacion(ios?'instruccionesIOS':'instruccionesAndroid',ios?'En Safari: Compartir → Agregar a la pantalla de inicio.':'En Chrome: menú → Instalar app.')+'\n\n'+textoInstalacion('mensajeNoDisponible','Se necesita HTTPS y un navegador compatible.');
      }
      abrirModal('modalInstalar');
    }
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();promptInstalacion=e;
      if((C.instalacion || {}).mostrarInvitacion !== false && !new URLSearchParams(location.search).has('preview')) mostrarInstalacion();
    });
    window.addEventListener('appinstalled',()=>{
      instalacionConfirmada=true;promptInstalacion=null;
      aplicarTextosInstalacion();$('confirmarInstalar').hidden=true;
      $('ayudaInstalar').textContent=textoInstalacion('mensajeExito','¡Gracias por instalar {radio}!');
      abrirModal('modalInstalar');
    });
    $('confirmarInstalar').addEventListener('click',async()=>{
      if(!promptInstalacion){mostrarInstalacion();return;}
      const prompt=promptInstalacion;
      try {await prompt.prompt();await prompt.userChoice;promptInstalacion=null;cerrarModal('modalInstalar');}
      catch(e){$('ayudaInstalar').textContent=textoInstalacion('mensajeNoDisponible','Usá el menú de tu navegador.');}
    });
    function instalarPWA() {mostrarInstalacion();}
    aplicarTextosInstalacion();

    if (!new URLSearchParams(window.location.search).has('preview') && 'serviceWorker' in navigator && /^https?:$/.test(window.location.protocol)) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      });
    }

    /* ======================================================================
       14-bis. POSICIÓN DEL BOTÓN DEL CHAT EN EL CELULAR
       En pantallas angostas (celular parado) el botón se sube al espacio libre
       que queda arriba de la tarjeta del versículo, así no tapa el volumen
       del reproductor. En pantalla grande queda como siempre, abajo a la derecha.
       ====================================================================== */
    function ubicarBotonChat() {
      const boton = $('chatFlotante');
      if (!boton) return;

      const enCelular = window.matchMedia('(max-width: 600px)').matches;
      const seccion = document.querySelector('.bottom-section');

      if (!enCelular || !seccion) {
        boton.style.top = '';
        boton.style.bottom = '';
        return;
      }

      const bordeSuperior = seccion.getBoundingClientRect().top;
      const destino = Math.max(70, Math.round(bordeSuperior - 56));

      boton.style.bottom = 'auto';
      boton.style.top = destino + 'px';
    }

    window.addEventListener('resize', ubicarBotonChat);
    window.addEventListener('orientationchange', function () { setTimeout(ubicarBotonChat, 250); });
    window.addEventListener('load', ubicarBotonChat);
    setTimeout(ubicarBotonChat, 300);
    setTimeout(ubicarBotonChat, 1500);

    /* ======================================================================
       15. ARRANQUE
       ====================================================================== */
    aplicarIdentidad();
    renderBarraSuperior();
    renderProgramacion();
    renderReuniones();
    renderUbicacion();
    configurarBotonChat();
    ubicarBotonChat();
    renderRedes();
    renderVersiculo();
    programarCambioDeVersiculo();
    iniciarMetadatos();

    // Títulos de modales desde la configuración
    const h3Predicas = $('tituloPredicas');
    if (h3Predicas && YT.titulo) {
      h3Predicas.innerHTML = '';
      h3Predicas.appendChild(icono('fa-brands fa-youtube'));
      h3Predicas.lastChild.style.color = '#ff4d4d';
      h3Predicas.appendChild(document.createTextNode(' ' + YT.titulo));
    }

    if (C.ubicacion.titulo) {
      const h3Ubicacion = $('tituloUbicacion');
      h3Ubicacion.innerHTML = '';
      h3Ubicacion.appendChild(icono('fa-solid fa-location-dot'));
      h3Ubicacion.lastChild.style.color = C.marca.primario;
      h3Ubicacion.appendChild(document.createTextNode(' ' + C.ubicacion.titulo));
    }

    if (C.reuniones.titulo) {
      const h3Reuniones = $('tituloReuniones');
      h3Reuniones.innerHTML = '';
      h3Reuniones.appendChild(icono('fa-solid fa-church'));
      h3Reuniones.lastChild.style.color = C.marca.secundario;
      h3Reuniones.appendChild(document.createTextNode(' ' + C.reuniones.titulo));
    }

    const enlaceCanal = $('canalYoutubeLink');
    if (enlaceCanal) enlaceCanal.href = urlCanal();


    if (new URLSearchParams(window.location.search).has('preview')) {
      window.addEventListener('message', event => {
        if (event.origin !== window.location.origin || event.source !== window.parent || !event.data || event.data.type !== 'radio-preview') return;
        pausarAudio(); detenerAutoRefrescoYouTube(); cerrarVideo();
        const next = combinar(DEFAULTS, RadioCore.sanitize(event.data.config));
        next.versiculo = {lista: window.VERSICULOS || []}; RadioCore.applyContacts(next);
        detenerChat(); salirModoModerador();
        Object.assign(C, next); YT = C.predicas; streamUrl = C.transmision.url;
        CHAT=C.chat || {};CHAT_MOD=CHAT.moderacion || {};FILTRO=CHAT.filtro || {};chatPatronFiltro=undefined;chatMensajes=[];
        configurarBotonChat();ubicarBotonChat();actualizarPanelModo();
        if($('modalChat').style.display==='flex') iniciarChat();
        aplicarTextosInstalacion();
        aplicarIdentidad(); renderBarraSuperior(); renderProgramacion(); renderReuniones(); renderUbicacion(); renderRedes(); renderVersiculo();
        const images = event.data.images || {};
        for (const [key, value] of Object.entries(images)) {
          if (typeof value !== 'string' || !value.startsWith('blob:' + window.location.origin + '/')) continue;
          if (key === 'fondoMovil') document.documentElement.style.setProperty('--fondo-movil', 'url("' + value + '")');
          if (key === 'fondoEscritorio') document.documentElement.style.setProperty('--fondo-escritorio', 'url("' + value + '")');
        }

        $('mapaIframe').removeAttribute('src');
        $('tituloPredicas').textContent = C.predicas.titulo;
        $('tituloUbicacion').textContent = C.ubicacion.titulo;
        $('tituloReuniones').textContent = C.reuniones.titulo;
        $('canalYoutubeLink').href = urlCanal();
        $('songInfoText').textContent = C.sitio.nombre;
      });
    }

  })();