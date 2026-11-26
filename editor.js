/* Editor visual: todos los cambios se guardan mediante exportación explícita. */
(function() {
  'use strict';
  const $=id=>document.getElementById(id), R=window.RadioCore;
  let config=R.sanitize(window.CONFIG), active='identidad', dirty=false, previewTimer, exporting=false;
  const uploaded=new Map(), imageUrls=new Map();
  const sections=[
    ['identidad','01','Identidad','Nombre de la radio, iglesia, eslogan y colores.'],
    ['transmision','02','Radio en vivo','Enlace de audio para escuchar tu emisora.'],
    ['programas','03','Programas','Agregá, editá y eliminá programas por día.'],
    ['reuniones','04','Reuniones','Días, horarios y nombres de los encuentros.'],
    ['imagenes','05','Imágenes','Fondos para celular y computadora e ícono de la app.'],
    ['predicas','06','Prédicas · YouTube','Pegá enlaces de videos; el modo manual no necesita API.'],
    ['ubicacion','07','Ubicación','Dirección de la iglesia y enlaces al mapa.'],
    ['contactos','08','WhatsApp y oración','Dos números independientes y sus mensajes.'],
    ['redes','09','Redes sociales','Facebook, Instagram, YouTube y otros enlaces.'],
    ['chat','10','Chat · Firebase','Mensajes públicos y moderación con correo y contraseña.'],
    ['instalacion','11','Instalar la app','Textos propios para invitar a instalar la radio.'],
    ['exportar','12','Guardar y publicar','Descargá la web completa o una copia de la configuración.']
  ];
  function el(tag,cls,text) {const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
  function button(label,fn,cls='btn btn-soft btn-sm') {const b=el('button',cls,label);b.type='button';b.addEventListener('click',fn);return b;}
  function get(path){return path.split('.').reduce((o,k)=>o?.[k],config);}
  function set(path,v){const keys=path.split('.');let o=config;for(const k of keys.slice(0,-1)){if(!o[k])o[k]={};o=o[k];}o[keys.at(-1)]=v;changed();}
  function changed(){dirty=true;$('status').textContent='Cambios pendientes: descargá el sitio ZIP para conservarlos.';clearTimeout(previewTimer);previewTimer=setTimeout(sendPreview,300);}
  function field(parent,label,path,type='text',hint='',options=null){
    const wrap=el('div','field'), lab=el('label',null,label), id='field-'+path.replace(/\./g,'-');lab.htmlFor=id;
    let input;
    if(type==='color'){
      const box=el('div','color-field'),picker=el('input'),hex=el('input','inp');
      picker.type='color';picker.value=/^#[0-9a-f]{6}$/i.test(get(path)||'')?get(path):'#22d3ee';
      hex.value=get(path)??'';hex.maxLength=7;hex.spellcheck=false;
      picker.addEventListener('input',()=>{hex.value=picker.value;set(path,picker.value);});
      hex.addEventListener('input',()=>{if(/^#[0-9a-f]{6}$/i.test(hex.value)){picker.value=hex.value;set(path,hex.value);}});
      box.append(picker,hex);wrap.append(lab,box);if(hint)wrap.append(el('small','hint',hint));parent.append(wrap);return hex;
    }
    if(options){input=el('select','inp');for(const [v,l] of options){const op=el('option',null,l);op.value=v;input.append(op);}}
    else input=el(type==='textarea' ? 'textarea':'input','inp');
    input.id=id;if(!options && type!=='textarea')input.type=type;input.value=get(path)??'';
    if(type==='tel'){input.inputMode='tel';input.placeholder='Ejemplo de formato: 54911…';}
    input.addEventListener(options?'change':'input',()=>{set(path,type==='number'?Number(input.value):input.value);if(path==='predicas.modo')render();});
    wrap.append(lab,input);if(hint)wrap.append(el('small','hint',hint));parent.append(wrap);return input;
  }
  function arrayField(parent,label,path,hint) {
    const wrap=el('div','field'),lab=el('label',null,label),input=el('textarea','inp');
    input.id='field-'+path.replace(/\./g,'-');lab.htmlFor=input.id;
    input.value=(get(path)||[]).join('\n');
    input.addEventListener('input',()=>set(path,input.value.split(/[\n,;]+/).map(s=>s.trim()).filter(Boolean)));
    wrap.append(lab,input,el('small','hint',hint));parent.append(wrap);
  }
  function toggle(parent,label,path){const lab=el('label','switch'),i=el('input');i.type='checkbox';i.checked=!!get(path);i.id='field-'+path.replace(/\./g,'-');i.addEventListener('change',()=>set(path,i.checked));lab.append(i,el('i'),el('em',null,label));parent.append(lab);}
  function card(title,subtitle){const c=el('section','card'),head=el('div','card-head'),text=el('div');text.append(el('h2',null,title));if(subtitle)text.append(el('p',null,subtitle));head.append(text);c.append(head);$('panels').append(c);return c;}
  function grid(c,one=false){const g=el('div','grid'+(one?' one':''));c.append(g);return g;}
  function note(c,text){c.append(el('p','lead',text));}
  function rowFields(container,path,fields){const g=el('div','grid');for(const f of fields)field(g,...[f[0],path+'.'+f[1],f[2]||'text',f[3]||'',f[4]||null]);container.append(g);}
  function list(c,path,fields,defaults){
    const a=get(path)||[],stack=el('div','stack');c.append(stack);
    if(!a.length)stack.append(el('div','empty','Todavía no hay elementos. Agregá el primero.'));
    a.forEach((item,i)=>{const row=el('div','item'),grow=el('div','grow');rowFields(grow,path+'.'+i,fields);
      if(path==='reuniones.items')toggle(grow,'Reunión destacada',path+'.'+i+'.destacado');
      const actions=el('div','toolbar');
      actions.append(button('↑',()=>move(path,i,-1),'btn btn-ghost btn-sm'),button('↓',()=>move(path,i,1),'btn btn-ghost btn-sm'),button('Eliminar',()=>{a.splice(i,1);changed();render();},'btn btn-danger btn-sm'));
      grow.append(actions);row.append(grow);stack.append(row);
    });
    c.append(button('＋ Agregar',()=>{a.push(JSON.parse(JSON.stringify(defaults)));set(path,a);render();}));
  }
  function move(path,i,delta){const a=get(path),j=i+delta;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];changed();render();}
  function render(){
    $('panels').replaceChildren();
    for(const b of $('navigation').children)b.classList.toggle('active',b.dataset.id===active);
    const section=sections.find(s=>s[0]===active);$('sectionTitle').textContent=section[2];$('sectionSubtitle').textContent=section[3];
    let c,g;
    if(active==='identidad'){
      c=card('Una plantilla para tu radio','Los nombres también se actualizan en la aplicación instalable al exportar.');g=grid(c);
      for(const [label,path,type,hint] of [['Nombre completo','sitio.nombre'],['Nombre corto de la app','sitio.nombreCorto','text','Recomendado: hasta 12 caracteres.'],['Eslogan','sitio.eslogan'],['Nombre de la iglesia','sitio.iglesia'],['Ciudad','sitio.ciudad'],['Web pública','sitio.urlPublica','url','Completala cuando tengas tu dominio.'],['Descripción','sitio.descripcion','textarea']])field(g,label,path,type||'text',hint||'');
      c=card('Colores de la marca');g=grid(c);
      for(const [label,path] of [['Color principal','marca.primario'],['Color principal oscuro','marca.primarioOscuro'],['Detalles','marca.oro'],['Color secundario','marca.secundario'],['Fondo de las ventanas','marca.fondoModal'],['Barra del navegador','sitio.colorBarra']])field(g,label,path,'color');
      toggle(c,'Mostrar versículo del día','modulos.versiculo');toggle(c,'Mostrar redes y contactos','modulos.redesSociales');
    }
    if(active==='transmision'){
      c=card('Transmisión en vivo','Usá el enlace directo de audio, no la página web de la radio.');g=grid(c,true);
      field(g,'Enlace de transmisión','transmision.url','url','Ej.: https://tu-servidor/stream.mp3. El enlace queda vacío hasta que cargues tu radio.');
      field(g,'Formato de audio','transmision.tipo','text','audio/mp3 o audio/aac, según tu proveedor.');
      field(g,'Texto de conexión','transmision.textoEspera');
      c=card('Nombre de la canción · opcional','Si no usás Zeno, dejá el proveedor en “Sin metadatos”.');g=grid(c);
      field(g,'Proveedor','transmision.metadatos.proveedor','text','',[['','Sin metadatos'],['zeno','Zeno.fm']]);field(g,'ID de la transmisión Zeno','transmision.metadatos.streamId');
    }
    if(active==='programas'){
      c=card('Programación semanal','Los horarios iniciales son ejemplos: reemplazalos por los de tu radio.');
      list(c,'programacion.grilla',[
        ['Día','dia','text','',R.DAYS.map(d=>[d,d])],['Horario','hora','time'],['Nombre del programa','titulo']
      ],{dia:'Lunes',hora:'09:00',titulo:'Nuevo programa'});
    }
    if(active==='reuniones'){
      c=card('Información de las reuniones');g=grid(c);field(g,'Título de la sección','reuniones.titulo');field(g,'Subtítulo','reuniones.subtitulo');field(g,'Nombre de la iglesia en esta sección','reuniones.nombre');
      c=card('Días y horarios','Podés agregar tantos encuentros como necesites.');
      list(c,'reuniones.items',[['Día','dia'],['Horario','hora'],['Nombre de la reunión','nombre']],{dia:'Domingo',hora:'10:00',nombre:'Nueva reunión',icono:'fa-solid fa-church',destacado:false});
    }
    if(active==='imagenes'){
      c=card('Imágenes de tu radio','Las imágenes incluidas son neutras. Reemplazalas por las de tu ministerio.');
      note(c,'Elegí un archivo PNG, JPG o WebP (hasta 12 MB), o indicá una URL pública. Las imágenes cargadas desde tu computadora se incluyen en el ZIP. Cada imagen se adapta a su medida exacta con recorte centrado; revisá el encuadre.');
      const cards=el('div','img-grid');c.append(cards);
      for(const [key,title,hint] of [['fondoMovil','Fondo para celular','Medida exacta: 768 × 1365.'],['fondoEscritorio','Fondo para computadora','Medida exacta: 1376 × 768.'],['icono','Ícono / logo de la app','Medida exacta: 512 × 512.']]){
        const box=el('section','img-card'),prev=el('div','img-prev'+(key==='icono'?' square':'')),img=el('img');img.alt=title;img.src=imageUrls.get(key)||config.imagenes[key];prev.append(img);
        const body=el('div','img-body');body.append(el('b',null,title),el('span',null,hint));
        const file=el('input');file.type='file';file.accept='image/png,image/jpeg,image/webp';file.id='image-'+key;file.hidden=true;file.addEventListener('change',()=>uploadImage(key,file.files[0],img));
        const pick=el('label','btn btn-soft btn-sm','Cambiar imagen');pick.htmlFor='image-'+key;body.append(pick,file);
        const input=field(body,'Ruta o URL pública','imagenes.'+key,'text','Si usás URL, preferí HTTPS.');
        input.addEventListener('input',()=>{uploaded.delete(key);if(imageUrls.has(key))URL.revokeObjectURL(imageUrls.get(key));imageUrls.delete(key);const safe=R.safeUrl(input.value,true);if(safe)img.src=safe;else img.removeAttribute('src');});
        box.append(prev,body);cards.append(box);
      }
    }
    if(active==='predicas'){
      c=card('Prédicas y mensajes');g=grid(c);field(g,'Título','predicas.titulo');field(g,'Modo de carga','predicas.modo','text','Manual: elegís qué videos aparecen. Automático: consulta tu canal con una API Key.',[['manual','Manual · enlaces de YouTube'],['automatico','Automático · API de YouTube']]);field(g,'Canal de YouTube','predicas.canalHandle','text','Ej.: @nombreDeTuCanal. Opcional en el modo manual.');
      if(config.predicas.modo==='manual'){
        c=card('Videos seleccionados','Se aceptan enlaces youtube.com/watch, youtu.be, shorts y transmisiones /live.');
        list(c,'predicas.videos',[['Título de la prédica','titulo'],['Enlace de YouTube','url','url'],['Fecha o referencia (opcional)','fecha']],{titulo:'Nueva prédica',url:'',fecha:''});
      }else{
        c=card('Configuración automática','Usá una clave de tu propio proyecto de Google. Restringila a YouTube Data API v3 y al dominio de tu radio.');g=grid(c);field(g,'API Key de YouTube','predicas.apiKey');field(g,'ID del canal (alternativa)','predicas.canalId');const n=field(g,'Cantidad de videos','predicas.cantidadUltimas','number');n.min='1';n.max='20';field(g,'Refresco en milisegundos','predicas.intervaloRefresco','number','300000 = 5 minutos. Consume cuota de Google.');
      }
    }
    if(active==='ubicacion'){
      c=card('Dónde se reúne la iglesia','No dejamos la dirección de la radio original. Cargá la de tu iglesia.');g=grid(c);
      for(const [label,path] of [['Título','titulo'],['Calle y número','direccion'],['Localidad','localidad'],['Provincia / región','provincia'],['Código postal','codigoPostal'],['Enlace para abrir Google Maps','linkMapa'],['URL del mapa insertado (opcional)','embedUrl']])field(g,label,'ubicacion.'+path,path.includes('Url')||path==='linkMapa'?'url':'text');
      c.append(button('Crear mapa desde la dirección',()=>{const addr=[config.ubicacion.direccion,config.ubicacion.localidad,config.ubicacion.provincia].filter(Boolean).join(', ');if(!addr){status('Primero completá la dirección.');return;}config.ubicacion.linkMapa='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(addr);config.ubicacion.embedUrl='https://www.google.com/maps?q='+encodeURIComponent(addr)+'&output=embed';changed();render();}));
      note(c,'Pegá solamente la URL del mapa, no el código HTML de un iframe. No hace falta una API Key.');
      c=card('Botón adicional de consulta · opcional');g=grid(c);field(g,'Texto del botón','ubicacion.textoConsultarCongregaciones');field(g,'Número de consulta','ubicacion.consultaWhatsapp','tel');
    }
    if(active==='contactos'){
      c=card('WhatsApp de la radio','Contacto general: saludos, información y consultas.');g=grid(c,true);field(g,'Número de WhatsApp','contactos.whatsapp','tel','Código de país y número, sin + ni espacios. En Argentina, para celulares suele ser 549 + código de área + número, sin 0 ni 15.');field(g,'Mensaje inicial','contactos.mensajeWhatsapp','textarea');
      c=card('Pedidos de oración','Este número puede ser distinto al WhatsApp general.');g=grid(c,true);field(g,'Número para pedidos de oración','contactos.oracion','tel','Si lo dejás vacío, no aparece el botón de oración.');field(g,'Mensaje para pedir oración','contactos.mensajeOracion','textarea');
      note(c,'Cada botón abre su propio chat de WhatsApp. También podés usar el mismo número en ambos campos.');
    }
    if(active==='redes'){
      c=card('Redes y enlaces','Eliminá los que no uses. WhatsApp y oración se configuran por separado.');
      list(c,'redes',[
        ['Tipo','tipo','text','',[['facebook','Facebook'],['instagram','Instagram'],['youtube','YouTube'],['tiktok','TikTok'],['web','Sitio web'],['compartir','Compartir app'],['chromecast','Transmitir a Smart TV']]],
        ['Nombre del botón','etiqueta'],['Enlace','url','url','No hace falta para Compartir app ni Smart TV.']
      ],{tipo:'instagram',etiqueta:'Instagram',url:'',icono:'fa-brands fa-instagram'});
      note(c,'Si cambiás el tipo de red, el ícono se ajusta automáticamente al descargar o actualizar la vista previa.');
    }
    if(active==='chat'){
      c=card('Chat de la radio · Firebase Realtime Database','El chat sigue desactivado hasta que cargues los datos de TU proyecto. No se conecta a la radio original.');
      toggle(c,'Habilitar chat','chat.habilitado');g=grid(c);
      field(g,'Título del chat','chat.titulo');
      field(g,'URL de Realtime Database','chat.databaseURL','url','Copiala desde Firebase → Realtime Database. Acepta firebaseio.com o firebasedatabase.app. No es Firestore.');
      field(g,'Ruta de mensajes','chat.ruta','text','Por defecto: chat/mensajes. Usá letras, números, guiones y barras.');
      field(g,'Mensaje cuando está vacío','chat.textoVacio');
      field(g,'Máximo de caracteres por mensaje','chat.maxCaracteres','number');
      field(g,'Máximo de caracteres en el nombre','chat.maxNombre','number');
      field(g,'Espera entre mensajes (milisegundos)','chat.esperaEnvio','number','El límite local no reemplaza medidas antispam del servidor.');
      c=card('Moderación · correo y contraseña','Activá el proveedor Correo/contraseña y creá los moderadores en Firebase Authentication.');g=grid(c);
      field(g,'Web API Key de Firebase','chat.moderacion.apiKey','text','Clave web del mismo proyecto. NO pegues una clave privada ni un archivo de cuenta de servicio.');
      field(g,'Correo a completar al entrar (opcional)','chat.moderacion.email','email');
      arrayField(c,'UID de cada moderador (uno por línea)','chat.moderacion.uids','Firebase → Authentication → Usuarios → UID. Las reglas autorizan estos UID, no solamente un correo escrito en la web.');
      note(c,'La contraseña se escribe solamente en el chat al iniciar sesión. No se guarda en el ZIP ni en la configuración. Después de entrar, un moderador autorizado puede borrar mensajes y cerrar sesión.');
      c=card('Filtro de palabras','Filtro visual/local; no reemplaza moderación ni controles de Firebase.');toggle(c,'Activar filtro','chat.filtro.activo');g=grid(c);field(g,'Acción del filtro','chat.filtro.modo','text','',[['censurar','Censurar con asteriscos'],['bloquear','No enviar el mensaje']]);
      arrayField(c,'Palabras a filtrar (una por línea)','chat.filtro.palabras','Podés agregar o quitar palabras.');
      c=card('Reglas para este chat','Descargá las reglas y publicalas en la consola de Firebase. La descarga NO las instala en tu cuenta.');
      c.append(button('Descargar reglas de Firebase',()=>{try{download(new Blob([JSON.stringify(R.firebaseRules(prepare()),null,2)],{type:'application/json'}),'firebase.database.rules.json');status('Reglas descargadas. Aplicá las reglas en Firebase antes de publicar.');}catch(e){status(e.message,true);}}));
      note(c,'Estas reglas permiten leer y crear mensajes públicamente. Solo los UID autorizados pueden borrarlos. Si la base tiene otros datos, combiná las reglas del chat con tus reglas actuales: no reemplaces toda la base sin revisarlas.');
    }
    if(active==='instalacion'){
      c=card('Invitación para instalar','La aplicación instalable ya está incluida. Estos textos son de la web, no del cuadro nativo del navegador.');
      toggle(c,'Mostrar invitación cuando el navegador ofrece instalar','instalacion.mostrarInvitacion');g=grid(c);
      for(const [label,key,type] of [['Título de la invitación','titulo'],['Mensaje principal','mensaje','textarea'],['Texto del botón','textoBoton'],['Texto para posponer','textoCancelar'],['Mensaje después de instalar','mensajeExito','textarea'],['Mensaje si ya está instalada','mensajeYaInstalada','textarea'],['Instrucciones Chrome / Android','instruccionesAndroid','textarea'],['Instrucciones Safari / iPhone','instruccionesIOS','textarea'],['Ayuda si no se puede instalar','mensajeNoDisponible','textarea']])field(g,label,'instalacion.'+key,type||'text');
      note(c,'Escribí {radio} para insertar el nombre de tu radio. El nombre, el ícono y los colores de la app se toman de Identidad e Imágenes. El texto de confirmación nativo lo controla Chrome/Safari y no se puede cambiar. Se requiere HTTPS; en iPhone la instalación se hace desde Compartir en Safari.');
    }
    if(active==='exportar'){
      c=card('1 · Guardar la web completa','El ZIP contiene la radio, el editor, tus textos, las imágenes y los datos de la app.');note(c,'La descarga no publica automáticamente. Descomprimí el ZIP y subí los archivos a tu hosting (reemplazando la versión anterior).');c.append(button('Descargar sitio ZIP',exportSite,'btn btn-primary'));
      c=card('2 · Copia de seguridad de los datos','El JSON guarda textos y enlaces, pero no los archivos de imágenes. Para guardar todo, usá el ZIP.');const acts=el('div','toolbar');acts.append(button('Descargar configuración JSON',()=>{download(new Blob([JSON.stringify(prepare(),null,2)],{type:'application/json'}),'radio-config.json');status('Copia de configuración descargada (sin archivos de imágenes).');}),button('Importar configuración JSON',()=>$('importFile').click()));c.append(acts);
      c=card('3 · Cómo volver a editar');note(c,'Abrí editor.html desde tu hosting o un servidor local. El editor lee la configuración actual del sitio. Editá, descargá nuevamente el ZIP y publicá los archivos reemplazados. No es un panel de administración con guardado en servidor.');
      c=card('Estado antes de publicar');const checks=el('div','checklist');c.append(checks);
      for(const [label,ok] of [['Nombre de la radio cargado',!!config.sitio.nombre],['Enlace de transmisión cargado',!!R.safeUrl(config.transmision.url)],['WhatsApp general cargado',!!R.phone(config.contactos.whatsapp)],['Número de oración cargado',!!R.phone(config.contactos.oracion)],['Dirección de la iglesia cargada',!!config.ubicacion.direccion],['Prédicas configuradas',config.predicas.modo==='manual'?config.predicas.videos.some(v=>R.youtubeId(v.url)):!!config.predicas.apiKey]])checks.append(el('div','check'+(ok?' ok':''),(ok?'✓ ':'○ ')+label));
    }
  }
  const icons={facebook:'fa-brands fa-facebook-f',instagram:'fa-brands fa-instagram',youtube:'fa-brands fa-youtube',tiktok:'fa-brands fa-tiktok',web:'fa-solid fa-globe',compartir:'fa-solid fa-share-nodes',chromecast:'fa-solid fa-tv'};
  function prepare(){const c=R.sanitize(config);c.programacion.dias=R.DAYS.slice();c.redes=c.redes.filter(r=>['compartir','chromecast'].includes(r.tipo)||r.url).map(r=>Object.assign(r,{icono:icons[r.tipo]||'fa-solid fa-link'}));return c;}
  function validate(){
    const errors=[];
    if(!config.sitio.nombre.trim())errors.push('Completá el nombre de la radio.');
    for(const [p,label,local] of [['transmision.url','Transmisión',false],['sitio.urlPublica','Web pública',false],['ubicacion.linkMapa','Enlace de mapa',false],['ubicacion.embedUrl','Mapa insertado',false],['imagenes.fondoMovil','Fondo móvil',true],['imagenes.fondoEscritorio','Fondo escritorio',true],['imagenes.icono','Ícono',true]]){const v=get(p);if(v && !R.safeUrl(v,local))errors.push(label+': usá una URL HTTP/HTTPS válida o una ruta assets permitida.');}
    config.predicas.videos.forEach((v,i)=>{if(v.url && !R.youtubeId(v.url))errors.push('Prédica '+(i+1)+': el enlace no es un video válido de YouTube.');});
    config.redes.forEach((r,i)=>{if(r.url && !R.safeUrl(r.url))errors.push('Red '+(i+1)+': enlace inválido.');});
    for(const k of ['whatsapp','oracion'])if(config.contactos[k] && !/^\d{7,15}$/.test(R.phone(config.contactos[k])))errors.push('Revisá el número de '+k+' (7 a 15 dígitos).');
    if(config.chat && config.chat.habilitado){
      try { const u=new URL(config.chat.databaseURL);if(u.protocol!=='https:' || !/(?:^|\.)(?:firebaseio\.com|firebasedatabase\.app)$/.test(u.hostname))errors.push('Chat: usá la URL HTTPS de tu Realtime Database.'); } catch(e){errors.push('Chat: falta una URL válida de Firebase.');}
      if(!/^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(config.chat.ruta||'') || config.chat.ruta.split('/').some(p=>['__proto__','constructor','prototype'].includes(p)))errors.push('Chat: revisá la ruta de mensajes.');
      if(!config.chat.moderacion.apiKey)errors.push('Chat: completá la Web API Key para moderar con correo y contraseña.');
      const ids=config.chat.moderacion.uids||[];
      if(!ids.length || ids.some(id=>!/^[A-Za-z0-9_-]{1,128}$/.test(id)))errors.push('Chat: agregá UID válidos de moderadores.');
      if(!(config.chat.maxNombre>=1 && config.chat.maxNombre<=80 && config.chat.maxCaracteres>=1 && config.chat.maxCaracteres<=2000))errors.push('Chat: nombre de 1 a 80 caracteres y mensaje de 1 a 2000.');
    }
    return errors;
  }
  function status(message,bad=false){$('status').textContent=message;$('status').className='status-line '+(bad?'bad':'ok');}
  function download(blob,name){const url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
  async function uploadImage(key,file,img){
    if(!file)return;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>12*1024*1024){status('Elegí una imagen PNG, JPG o WebP de hasta 12 MB.',true);return;}
    try{
      const bitmap=await createImageBitmap(file),canvas=document.createElement('canvas');
      const sizes={icono:[512,512],fondoMovil:[768,1365],fondoEscritorio:[1376,768]};
      [canvas.width,canvas.height]=sizes[key];
      const ctx=canvas.getContext('2d'),scale=Math.max(canvas.width/bitmap.width,canvas.height/bitmap.height);
      const sw=canvas.width/scale,sh=canvas.height/scale;
      ctx.drawImage(bitmap,(bitmap.width-sw)/2,(bitmap.height-sh)/2,sw,sh,0,0,canvas.width,canvas.height);
      bitmap.close();const blob=await new Promise(resolve=>canvas.toBlob(resolve,key==='icono'?'image/png':'image/jpeg',.92));
      if(!blob)throw new Error('No se pudo convertir la imagen.');
      if(imageUrls.has(key))URL.revokeObjectURL(imageUrls.get(key));const url=URL.createObjectURL(blob);uploaded.set(key,blob);imageUrls.set(key,url);img.src=url;
      config.imagenes[key]=key==='icono'?'assets/icono.png':key==='fondoMovil'?'assets/fondo-movil.jpg':'assets/fondo-escritorio.jpg';
      const f=$('field-imagenes-'+key);if(f)f.value=config.imagenes[key];changed();status('Imagen cargada. Se incluirá en el sitio ZIP.');
    }catch(e){status('No pudimos abrir la imagen: '+e.message,true);}
  }
  function sendPreview(){const frame=$('previewFrame');if(!$('preview').classList.contains('open')||!frame.contentWindow)return;frame.contentWindow.postMessage({type:'radio-preview',config:prepare(),images:Object.fromEntries(imageUrls)},window.location.origin);}
  $('previewButton').addEventListener('click',()=>{if(window.location.protocol==='file:'){status('Para la vista previa y el ZIP, abrí el editor desde un hosting o servidor local. Consultá LEEME.md.',true);return;}$('preview').classList.add('open');$('preview').setAttribute('aria-hidden','false');const f=$('previewFrame');if(!f.getAttribute('src'))f.src='./index.html?preview=1';else sendPreview();});
  $('previewFrame').addEventListener('load',sendPreview);
  $('closePreview').addEventListener('click',()=>{$('preview').classList.remove('open');$('preview').setAttribute('aria-hidden','true');});
  $('refreshPreview').addEventListener('click',sendPreview);
  async function exportSite(){
    if(exporting)return;const errors=validate();if(errors.length){status(errors.join(' '),true);return;}
    if(window.location.protocol==='file:'){status('La descarga del sitio necesita hosting o servidor local. Podés guardar el JSON desde “Guardar y publicar”.',true);return;}
    exporting=true;$('exportButton').disabled=true;status('Preparando el sitio y las imágenes…');
    try{
      const c=prepare(),response=await fetch('export-files.json',{cache:'no-store'});if(!response.ok)throw new Error('No se encontró la lista de archivos.');const paths=await response.json();
      const entries=[],enc=new TextEncoder();
      for(const path of paths){
        if(path==='config.js'){entries.push([path,enc.encode(R.configText(c))]);continue;}
        if(path==='manifest.json'){entries.push([path,enc.encode(JSON.stringify(R.manifest(c),null,2))]);continue;}
        if(path==='firebase.database.rules.json'){entries.push([path,enc.encode(JSON.stringify(R.firebaseRules(c),null,2))]);continue;}
        if(path==='radio-config.json'){entries.push([path,enc.encode(JSON.stringify(c,null,2))]);continue;}
        if(path==='sw.js') {const res=await fetch(path,{cache:'no-store'});if(!res.ok)throw new Error('Falta '+path);let s=await res.text();s=s.replace(/const VERSION = '[^']*';/,"const VERSION = 'radio-editable-"+Date.now()+"';");entries.push([path,enc.encode(s)]);continue;}
        const key=Object.keys(c.imagenes).find(k=>c.imagenes[k]===path && uploaded.has(k));
        if(key){entries.push([path,new Uint8Array(await uploaded.get(key).arrayBuffer())]);continue;}
        const res=await fetch(path,{cache:'no-store'});if(!res.ok)throw new Error('No se pudo incluir '+path);entries.push([path,new Uint8Array(await res.arrayBuffer())]);
      }
      // Include any additional local asset selected via a custom path.
      for(const path of Object.values(c.imagenes).filter(p=>p.startsWith('assets/'))){if(entries.some(e=>e[0]===path))continue;const res=await fetch(path,{cache:'no-store'});if(!res.ok)throw new Error('No se encontró la imagen '+path);entries.push([path,new Uint8Array(await res.arrayBuffer())]);}
      download(R.zip(entries),'mi-radio-editable.zip');dirty=false;status('Sitio descargado. Descomprimí el ZIP y publicá los archivos en tu hosting.');
    }catch(e){status('No se pudo exportar: '+e.message,true);}finally{exporting=false;$('exportButton').disabled=false;}
  }
  $('exportButton').addEventListener('click',exportSite);
  $('importFile').addEventListener('change',async event=>{
    const file=event.target.files[0];if(!file)return;if(file.size>1024*1024){status('El JSON es demasiado grande (máximo 1 MB).',true);return;}
    try{
      const raw=JSON.parse(await file.text());
      for(const group of ['sitio','marca','imagenes','transmision','programacion','reuniones','predicas','ubicacion','contactos','redes'])if(!raw[group])throw new Error('Falta el bloque '+group+'. Usá un JSON exportado por este editor.');
      if(!Array.isArray(raw.redes)||!Array.isArray(raw.reuniones.items)||!Array.isArray(raw.programacion.grilla)||!Array.isArray(raw.predicas.videos))throw new Error('Las listas no tienen el formato esperado.');
      config=R.sanitize(raw);config.chat=config.chat||JSON.parse(JSON.stringify(window.CONFIG.chat));config.chat.moderacion.uids=config.chat.moderacion.uids||[];config.instalacion=config.instalacion||JSON.parse(JSON.stringify(window.CONFIG.instalacion));for(const url of imageUrls.values())URL.revokeObjectURL(url);uploaded.clear();imageUrls.clear();changed();render();status('Configuración importada. Las imágenes deben existir en assets o ser URLs públicas.');
    }catch(e){status('No pudimos importar: '+e.message,true);}finally{event.target.value='';}
  });
  for(const [id,num,label] of sections){const b=button(num+' · '+label,()=>{active=id;render();},'nav-item');b.dataset.id=id;$('navigation').append(b);}
  window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
  render();
})();
