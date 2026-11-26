/* Utilidades compartidas. Sin dependencias; sin almacenamiento de credenciales. */
(function(root) {
  'use strict';
  const DAYS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
  function text(v) { return typeof v === 'string' ? v.slice(0, 20000) : ''; }
  function safeUrl(v, local) {
    v = text(v).trim();
    if (!v) return '';
    if (local && /^assets\/[a-zA-Z0-9_.\/-]+$/.test(v) && !v.includes('..')) return v;
    try { const u = new URL(v); return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : ''; } catch (_) { return ''; }
  }
  function youtubeId(v) {
    v = text(v).trim();
    if (/^[\w-]{11}$/.test(v)) return v;
    try {
      const u = new URL(v), host = u.hostname.replace(/^www\./,'');
      if (host === 'youtu.be') { const id=u.pathname.split('/')[1]; return /^[\w-]{11}$/.test(id || '') ? id : ''; }
      if (!['youtube.com','m.youtube.com','youtube-nocookie.com'].includes(host)) return '';
      const parts=u.pathname.split('/');
      const id=u.searchParams.get('v') || (['embed','shorts','live'].includes(parts[1]) ? parts[2] : '');
      return /^[\w-]{11}$/.test(id || '') ? id : '';
    } catch (_) { return ''; }
  }
  function phone(v) { return String(v || '').replace(/[^0-9]/g,''); }
  function sanitize(input) {
    function clean(v) {
      if (Array.isArray(v)) return v.slice(0,500).map(clean);
      if (v && typeof v === 'object') {
        const o={};
        Object.keys(v).forEach(k => {
          if (!['__proto__','constructor','prototype'].includes(k)) o[k]=clean(v[k]);
        }); return o;
      }
      return typeof v === 'string' ? text(v) : v;
    }
    const c=clean(input || {});
    for (const [group,keys] of Object.entries({sitio:['urlPublica'],imagenes:['fondoMovil','fondoEscritorio','icono'],transmision:['url'],ubicacion:['linkMapa','embedUrl','consultaUrl']})) {
      if (c[group]) for (const k of keys) c[group][k]=safeUrl(c[group][k],group === 'imagenes');
    }
    if(c.redes) c.redes=c.redes.filter(r => r && r.tipo).map(r => Object.assign(r,{url:safeUrl(r.url)}));
    for (const group of ['marca','sitio']) {
      if(c[group]) for(const k of Object.keys(c[group])) if(group==='marca' || k==='colorBarra') {
        if(!/^#[0-9a-f]{6}$/i.test(c[group][k])) c[group][k]='#22d3ee';
      }
    }
    if(c.barraSuperior) c.barraSuperior.forEach(b => { if(b.color && !/^#[0-9a-f]{6}$/i.test(b.color)) delete b.color; });
    if(c.chat) {
      c.chat.databaseURL=safeUrl(c.chat.databaseURL);
      if(c.chat.habilitado && !c.chat.databaseURL) c.chat.habilitado=false;
    }
    if(c.predicas) c.predicas.videos=(c.predicas.videos || []).filter(v => v && youtubeId(v.url || v.id)).map(v => ({titulo:text(v.titulo),url:'https://www.youtube.com/watch?v='+youtubeId(v.url || v.id),fecha:text(v.fecha)}));
    return c;
  }
  function firebaseRules(c) {
    const chat=c.chat || {}, m=chat.moderacion || {};
    const uids=(m.uids || []).filter(u=>typeof u==='string' && /^[A-Za-z0-9_-]{1,128}$/.test(u));
    const admin=uids.length ? '('+uids.map(u=>'auth.uid === '+JSON.stringify(u)).join(' || ')+')' : 'false';
    const maxNombre=Math.max(1,Math.min(80,Number(chat.maxNombre)||20));
    const maxTexto=Math.max(1,Math.min(2000,Number(chat.maxCaracteres)||280));
    const msg={
      '.write':'(!data.exists() && newData.exists()) || (data.exists() && !newData.exists() && auth != null && '+admin+')',
      '.validate':"newData.hasChildren(['nombre','texto','ts','cid'])",
      nombre:{'.validate':'newData.isString() && newData.val().length > 0 && newData.val().length <= '+maxNombre},
      texto:{'.validate':'newData.isString() && newData.val().length > 0 && newData.val().length <= '+maxTexto},
      ts:{'.validate':'newData.isNumber() && newData.val() >= now - 60000 && newData.val() <= now + 60000'},
      cid:{'.validate':'newData.isString() && newData.val().length > 0 && newData.val().length <= 100'},
      '$other':{'.validate':false}
    };
    const rules={'.read':false,'.write':false};
    let node=rules;
    const parts=String(chat.ruta || 'chat/mensajes').split('/').filter(Boolean);
    for(const part of parts) {
      if(!/^[A-Za-z0-9_-]+$/.test(part) || ['__proto__','constructor','prototype'].includes(part)) throw new Error('Ruta de chat inválida.');
      node[part]={};node=node[part];
    }
    node['.read']=true;node['.indexOn']=['ts'];node['$mensaje']=msg;
    return {rules};
  }
  function applyContacts(c) {
    if(!c.contactos) return c;
    c.redes=(c.redes || []).filter(r => !['whatsapp','oracion'].includes(r.tipo));
    for(const [tipo,key,label,icon,message] of [
      ['whatsapp','whatsapp','WhatsApp','fa-brands fa-whatsapp','mensajeWhatsapp'],
      ['oracion','oracion','Pedir oración','fa-solid fa-hands-praying','mensajeOracion']
    ]) {
      const p=phone(c.contactos[key]);
      if(p) c.redes.push({tipo,etiqueta:label,icono:icon,color:'#25d366',url:'https://wa.me/'+p+'?text='+encodeURIComponent(c.contactos[message] || '')});
    }
    return c;
  }
  function configText(c) {
    return '/* Generado por el editor visual. Volvé a editor.html para modificarlo. */\nwindow.CONFIG = '+JSON.stringify(sanitize(c),null,2).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029')+';\n';
  }
  function manifest(c) {
    const icon=safeUrl(c.imagenes.icono,true), ext=icon.split('.').pop().toLowerCase();
    return {id:'./',name:c.sitio.nombre,short_name:c.sitio.nombreCorto,description:c.sitio.descripcion,lang:'es',start_url:'./index.html',scope:'./',display:'standalone',orientation:'portrait',background_color:'#0a1828',theme_color:c.sitio.colorBarra,icons:icon ? [{src:icon,sizes:ext==='svg' ? 'any' : '512x512',type:ext==='jpg'||ext==='jpeg' ? 'image/jpeg':'image/png',purpose:'any'}] : []};
  }
  function crc32(a) {
    let c=0xffffffff;
    for(const b of a) { c^=b; for(let i=0;i<8;i++) c=(c>>>1)^((c&1)?0xedb88320:0); }
    return (c^0xffffffff)>>>0;
  }
  function zip(entries) {
    const enc=new TextEncoder(),chunks=[],central=[];let offset=0;
    for(const [path,bytes] of entries) {
      const name=enc.encode(path),a=bytes instanceof Uint8Array ? bytes : enc.encode(bytes);
      const h=new Uint8Array(30+name.length),v=new DataView(h.buffer),crc=crc32(a);
      v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint32(14,crc,true);v.setUint32(18,a.length,true);v.setUint32(22,a.length,true);v.setUint16(26,name.length,true);h.set(name,30);
      chunks.push(h,a);
      const ch=new Uint8Array(46+name.length),cv=new DataView(ch.buffer);
      cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x800,true);cv.setUint32(16,crc,true);cv.setUint32(20,a.length,true);cv.setUint32(24,a.length,true);cv.setUint16(28,name.length,true);cv.setUint32(42,offset,true);ch.set(name,46);central.push(ch);offset+=h.length+a.length;
    }
    const size=central.reduce((s,b)=>s+b.length,0),end=new Uint8Array(22),ev=new DataView(end.buffer);
    ev.setUint32(0,0x06054b50,true);ev.setUint16(8,entries.length,true);ev.setUint16(10,entries.length,true);ev.setUint32(12,size,true);ev.setUint32(16,offset,true);
    return new Blob([...chunks,...central,end],{type:'application/zip'});
  }
  const api={DAYS,safeUrl,youtubeId,phone,sanitize,applyContacts,configText,manifest,firebaseRules,crc32,zip};
  if(typeof module!=='undefined' && module.exports) module.exports=api;
  else root.RadioCore=api;
})(typeof window!=='undefined' ? window : globalThis);
