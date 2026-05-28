const http = require('http');
const { MongoClient } = require('mongodb');

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || '';
const COL = 'horas_data';

let db = null;
let memData = null;

const DATA_INICIAL = {
  operarios: ["Eduardo García","Carlos Sarassola","Leonardo Delgado","Milton Placeres","Victor Gallo","Alejandro Bentancur","Julio Saracho","Luciano Sarassola","Lucas Placeres","Cristian Sánchez","Enrique Avero","Santiago Da Silva","Luis Gomez","Sebastián Da Silva","Sergio Bornia","Jorge Agriela","Carlos Gonzales","Maikel Bravo","Adrian Ramos","Octavio Bonnahon"],
  proyectos: ["4476 - Cañerias para nuevo tk 520-521","4477 - Cinta para fechadores","4484 - Suplementos transportes L4","4487 - Prevencionista Barredor de Lodo","4509 - Trabajos varios planta Dairyco","4512 - Transferencias de cadenas para transporte de pallets","4518 - RETIRO Y GESTIÓN DE RESIDUOS DE EMBALAJE","4519 - Reparación tornillo sin fin Máquina de hielo","4526 - Instalación de filtros en cañería de producto","4532 - Montaje de robot final de línea y transportadores","4533 - Armado de aireadores","4535 - Aspiracion chocolatada","4536 - Adicionales corrimiento cañeria","4537 - Equipos Elevacion Tanques CIP","4538 - Hidrogrúa para montaje de transportes Línea 8","4539 - Asistencia tecnica pruebas Inspector MIJO","4540 - Transportador Rechazo línea UHT","4541 - Trabajos varios planta Dairyco","4543 - Reparación tornillo sin fin máquina hielo","4545 - Instalación mecánica planta licor cacao Rev2","4546 - Descarga y montaje tanques sala jarabe Tetra Pack","4547 - Equipos de izaje montaje tanques sala jarabe","4548 - Descarga y montaje despaletizadora","4549 - Equipos de izaje montaje paletizadora y horno","4550 - Modificación estanterías cámara de frío","4551 - Materiales corrimiento cañerías sala jarabe","4552 - Puente grúa giratorio tostadora Neptuno","4553 - Servicio prevencionista montaje Línea 8","4556 - Servicio prevencionista montaje elaborador","4557 - Cambio de cañería purificadoras agua","4561 - Techo salida llenadora L8","4562 - Techo tapadora L8","4563 - Seguridad de horno y tapadora de L8","4573 - Montaje del tanque aseptico","4574 - Mantenimiento proceso de tostación Radar","4579 - Montaje 2500 Gal y 500 Gal","4582 - Bandeja Resumidero","4584 - Desmontaje Centrifuga Alfa Laval","4585 - Instalación TK500 501 502 SJ","4587 - Adicionales Pepsico","4589 - Soporteria Inoxidable Servicios L8","4590 - Ingeniería e Instalación Servicios L8","4591 - Montaje Centrifugadora GEA","4593 - Deposito TK SJ y Oficina Krones","4595 - Instalacion SubCArb L4 L5","4596 - Mano de obra Plataforma y Cañerias","4597 - Fabricacion Perfil Inoxidable","4598 - Escalera Plataforma L4","4599 - Modificacion Cañeria Existente","4600 - Fabricación Tornillo Sin Fin","4601 - Relevamiento Sala de Envasado y Silos","4602 - Trituradora de Plastico","4603 - Soldadura TIG 30 Piezas","4604 - Tolva Envasadora","4605 - Sistema recuperación de Calor","4606 - Plataforma Pailas"],
  tareas: ["Soldadura","Corte","Armado","Pintura","Instalación","Montaje","Piping","Supervisión","Medición","Mantenimiento","Ingeniería","Transporte"],
  trabajos: []
};

async function conectar() {
  if (!MONGO_URI) return;
  try {
    const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    db = client.db('horas_app');
    console.log('MongoDB conectado');
  } catch(e) { console.log('MongoDB error:', e.message); }
}

async function leerData() {
  if (memData) return memData;
  if (!db) { memData = JSON.parse(JSON.stringify(DATA_INICIAL)); return memData; }
  try {
    const doc = await db.collection(COL).findOne({ _id: 'data' });
    memData = doc ? doc.data : JSON.parse(JSON.stringify(DATA_INICIAL));
    return memData;
  } catch(e) { memData = JSON.parse(JSON.stringify(DATA_INICIAL)); return memData; }
}

async function guardarData(data) {
  memData = data;
  if (!db) return;
  try {
    await db.collection(COL).replaceOne({ _id: 'data' }, { _id: 'data', data, updatedAt: new Date() }, { upsert: true });
  } catch(e) {}
}

function buildHTML(data) {
  const dataJson = JSON.stringify(data);
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Horas por Proyecto - Fischer Montajes</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css">
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#fff;--bg2:#f5f5f4;--bg3:#f0efed;--text:#1a1a18;--text2:#6b6b68;--border:#d4d2ca;--sbg:#eaf3de;--sc:#3b6d11;--dbg:#fcebeb;--dc:#a32d2d;--ibg:#e6f1fb;--ic:#185fa5;--r:8px;--rl:12px}
@media(prefers-color-scheme:dark){:root{--bg:#1c1c1a;--bg2:#252523;--bg3:#2e2e2b;--text:#f0ede8;--text2:#9b9890;--border:#3a3a37}}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg3);color:var(--text);min-height:100vh}
.hdr{background:var(--bg);border-bottom:0.5px solid var(--border);padding:14px 16px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:100}
.hico{width:36px;height:36px;background:var(--text);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--bg);font-size:18px;flex-shrink:0}
.tabs{display:flex;background:var(--bg);border-bottom:0.5px solid var(--border);overflow-x:auto}
.tab{flex:1;min-width:80px;padding:12px 8px;font-size:13px;font-weight:500;text-align:center;cursor:pointer;border:none;background:none;color:var(--text2);border-bottom:2px solid transparent;white-space:nowrap}
.tab.on{color:var(--text);border-bottom:2px solid var(--text)}
.pnl{display:none;padding:12px;max-width:700px;margin:0 auto}.pnl.on{display:block}
.crd{background:var(--bg);border:0.5px solid var(--border);border-radius:var(--rl);padding:14px;margin-bottom:12px}
.ct{font-size:14px;font-weight:500;margin-bottom:12px;display:flex;align-items:center;gap:7px}
.fld{display:flex;flex-direction:column;gap:4px;margin-bottom:10px}
.fld label{font-size:12px;color:var(--text2)}
.fld input,.fld select{font-size:14px;padding:9px 11px;border:0.5px solid var(--border);border-radius:var(--r);background:var(--bg);color:var(--text);width:100%;-webkit-appearance:none}
.fg{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.btn{padding:9px 16px;border-radius:var(--r);font-size:13px;font-weight:500;cursor:pointer;border:0.5px solid var(--border);background:var(--bg);color:var(--text);display:inline-flex;align-items:center;gap:6px}
.btn:active{transform:scale(.97)}
.btn.p{background:var(--text);color:var(--bg);border-color:var(--text)}
.btn.d{color:var(--dc);border-color:transparent}
.btn.g{border-color:var(--ic);color:var(--ic)}
.br{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}
.otb{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px}
.otb th{text-align:left;padding:6px;font-weight:500;color:var(--text2);border-bottom:0.5px solid var(--border);font-size:12px}
.otb td{padding:5px 4px;border-bottom:0.5px solid var(--border);vertical-align:middle}
.otb tr:last-child td{border-bottom:none}
.otb select,.otb input{font-size:13px;padding:6px 7px;border:0.5px solid var(--border);border-radius:var(--r);background:var(--bg);color:var(--text);width:100%}
.tbar{display:flex;justify-content:space-between;align-items:center;padding:9px 11px;background:var(--bg2);border-radius:var(--r);margin-top:10px;font-size:13px}
.ths{font-size:16px;font-weight:500}
.hcrd{background:var(--bg);border:0.5px solid var(--border);border-radius:var(--r);padding:12px;margin-bottom:8px}
.hh{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px}
.hp{font-size:14px;font-weight:500}
.hm{font-size:12px;color:var(--text2);margin-top:2px}
.hhs{font-size:20px;font-weight:500;text-align:right}
.hhl{font-size:11px;color:var(--text2);text-align:right}
.ol{border-top:0.5px solid var(--border);padding-top:8px;display:flex;flex-direction:column;gap:4px}
.or{display:flex;justify-content:space-between;font-size:12px;padding:2px 0}
.bdg{display:inline-block;font-size:11px;padding:2px 7px;border-radius:var(--r);background:var(--ibg);color:var(--ic)}
.sts{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:12px}
.st{background:var(--bg);border-radius:var(--r);padding:12px;border:0.5px solid var(--border)}
.sl{font-size:12px;color:var(--text2);margin-bottom:4px}
.sv{font-size:24px;font-weight:500}
.bw{margin-bottom:10px}
.bl{display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px}
.bb{height:5px;border-radius:3px;background:var(--bg2)}
.bf{height:5px;border-radius:3px;background:var(--text)}
.al{display:flex;flex-direction:column;gap:5px;margin-bottom:10px}
.ai{display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:var(--bg2);border-radius:var(--r);font-size:13px}
.ar{display:flex;gap:8px}
.ar input{flex:1;font-size:14px;padding:8px 10px;border:0.5px solid var(--border);border-radius:var(--r);background:var(--bg);color:var(--text)}
.ag{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.fb{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}
.fb select{font-size:13px;padding:7px 10px;border:0.5px solid var(--border);border-radius:var(--r);background:var(--bg);color:var(--text);-webkit-appearance:none;flex:1;min-width:120px}
.tst{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--sbg);border:0.5px solid var(--sc);color:var(--sc);border-radius:var(--r);padding:10px 18px;font-size:13px;display:none;align-items:center;gap:8px;z-index:999;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.15)}
.tst.on{display:flex}
.emp{text-align:center;padding:2rem;color:var(--text2);font-size:14px}
@media(max-width:420px){.fg{grid-template-columns:1fr}.ag{grid-template-columns:1fr}.otb th:nth-child(2),.otb td:nth-child(2){display:none}}
</style>
</head>
<body>
<div class="hdr">
  <div class="hico"><i class="ti ti-clock"></i></div>
  <div><div style="font-size:16px;font-weight:500">Horas por Proyecto</div><div style="font-size:12px;color:var(--text2)">Fischer Montajes</div></div>
</div>
<div class="tabs">
  <button class="tab on" onclick="goTab('c',this)"><i class="ti ti-clock"></i> Cargar</button>
  <button class="tab" onclick="goTab('h',this)"><i class="ti ti-list"></i> Historial</button>
  <button class="tab" onclick="goTab('r',this)"><i class="ti ti-chart-bar"></i> Resumen</button>
  <button class="tab" onclick="goTab('a',this)"><i class="ti ti-settings"></i> Admin</button>
</div>
<div id="tst" class="tst"><i class="ti ti-check"></i><span id="tm"></span></div>

<div id="pnl-c" class="pnl on">
  <div class="crd">
    <div class="ct"><i class="ti ti-briefcase"></i> Datos del trabajo</div>
    <div class="fg">
      <div class="fld"><label>Proyecto / Presupuesto</label><select id="fp"></select></div>
      <div class="fld"><label>Tarea general</label><select id="ft"></select></div>
      <div class="fld"><label>Fecha</label><input type="date" id="ff"></div>
      <div class="fld"><label>Cargado por</label><select id="fe"></select></div>
    </div>
    <div class="fld"><label>Observaciones <span style="font-size:11px;color:var(--text2)">(opcional)</span></label><input type="text" id="fo" placeholder="Detalle adicional..."></div>
  </div>
  <div class="crd">
    <div class="ct"><i class="ti ti-users"></i> Operarios en este trabajo</div>
    <table class="otb">
      <thead><tr><th>Operario</th><th>Tarea</th><th style="width:78px">Horas</th><th style="width:40px"></th></tr></thead>
      <tbody id="otb"></tbody>
    </table>
    <div style="margin-top:10px"><button class="btn g" onclick="addR()"><i class="ti ti-plus"></i> Agregar operario</button></div>
    <div class="tbar"><span style="color:var(--text2)">Total horas</span><span class="ths" id="tot">0 hs</span></div>
  </div>
  <div class="br">
    <button class="btn" onclick="limp()">Limpiar</button>
    <button class="btn p" onclick="guar()"><i class="ti ti-check"></i> Guardar trabajo</button>
  </div>
</div>

<div id="pnl-h" class="pnl">
  <div class="fb">
    <select id="flp" onchange="renderH()"><option value="">Todos los proyectos</option></select>
    <select id="flo" onchange="renderH()"><option value="">Todos los operarios</option></select>
  </div>
  <button class="btn" style="margin-bottom:10px;width:100%;justify-content:center" onclick="expCSV()"><i class="ti ti-download"></i> Exportar CSV</button>
  <div id="hl"></div>
</div>

<div id="pnl-r" class="pnl">
  <div class="sts" id="sts"></div>
  <div class="crd"><div class="ct">Horas por proyecto</div><div id="rp"></div></div>
  <div class="crd"><div class="ct">Horas por operario</div><div id="ro"></div></div>
</div>

<div id="pnl-a" class="pnl">
  <div class="ag">
    <div class="crd">
      <div class="ct"><i class="ti ti-users"></i> Operarios</div>
      <div id="aop" class="al"></div>
      <div class="ar"><input id="nop" placeholder="Nombre..." onkeydown="if(event.key==='Enter')addI('operarios','nop','aop')"><button class="btn p" onclick="addI('operarios','nop','aop')"><i class="ti ti-plus"></i></button></div>
    </div>
    <div class="crd">
      <div class="ct"><i class="ti ti-building"></i> Proyectos</div>
      <div id="apr" class="al"></div>
      <div class="ar"><input id="npr" placeholder="N° / nombre..." onkeydown="if(event.key==='Enter')addI('proyectos','npr','apr')"><button class="btn p" onclick="addI('proyectos','npr','apr')"><i class="ti ti-plus"></i></button></div>
    </div>
  </div>
  <div class="crd">
    <div class="ct"><i class="ti ti-tool"></i> Tareas</div>
    <div id="ata" class="al"></div>
    <div class="ar"><input id="nta" placeholder="Nombre de la tarea..." onkeydown="if(event.key==='Enter')addI('tareas','nta','ata')"><button class="btn p" onclick="addI('tareas','nta','ata')"><i class="ti ti-plus"></i></button></div>
  </div>
</div>

<script>
var D=${dataJson};
var rid=0;

function sync(){fetch('/data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(D)}).catch(function(){});}

function goTab(t,el){
  document.querySelectorAll('.tab').forEach(function(b){b.classList.remove('on')});
  document.querySelectorAll('.pnl').forEach(function(p){p.classList.remove('on')});
  el.classList.add('on');document.getElementById('pnl-'+t).classList.add('on');
  if(t==='h'){fillF();renderH();}if(t==='r')renderR();if(t==='a')renderA();
}

function mkOpts(list,sel){return list.map(function(x){return'<option value="'+x+'"'+(x===sel?' selected':'')+'>'+x+'</option>';}).join('');}

function poblar(){
  document.getElementById('fp').innerHTML='<option value="">— seleccionar —</option>'+mkOpts(D.proyectos);
  document.getElementById('ft').innerHTML='<option value="">— seleccionar —</option>'+mkOpts(D.tareas);
  document.getElementById('fe').innerHTML='<option value="">— seleccionar —</option>'+mkOpts(D.operarios);
  document.querySelectorAll('.os').forEach(function(s){var v=s.value;s.innerHTML='<option value="">— operario —</option>'+mkOpts(D.operarios);s.value=v;});
  document.querySelectorAll('.ts').forEach(function(s){var v=s.value;s.innerHTML='<option value="">—</option>'+mkOpts(D.tareas);s.value=v;});
}

function addR(op,ta,hs){
  var id='r'+rid++;var tr=document.createElement('tr');tr.id=id;
  tr.innerHTML='<td><select class="os"><option value="">— operario —</option>'+mkOpts(D.operarios,op)+'</select></td><td><select class="ts"><option value="">—</option>'+mkOpts(D.tareas,ta)+'</select></td><td><input class="hi" type="number" min="0.5" max="24" step="0.5" value="'+(hs||'')+'" placeholder="0" oninput="calcT()" style="width:70px"></td><td><button class="btn d" onclick="document.getElementById(\''+id+'\').remove();calcT()" style="padding:4px 8px"><i class="ti ti-x"></i></button></td>';
  document.getElementById('otb').appendChild(tr);calcT();
}

function calcT(){var t=0;document.querySelectorAll('.hi').forEach(function(i){var v=parseFloat(i.value);if(!isNaN(v))t+=v;});document.getElementById('tot').textContent=t.toFixed(1)+' hs';}

function guar(){
  var pr=document.getElementById('fp').value,ta=document.getElementById('ft').value,fe=document.getElementById('ff').value,en=document.getElementById('fe').value,ob=document.getElementById('fo').value.trim();
  if(!pr||!ta||!fe||!en){alert('Completá todos los datos del trabajo.');return;}
  var rows=document.querySelectorAll('#otb tr'),ops=[],ok=true;
  rows.forEach(function(tr){var op=tr.querySelector('.os').value,t=tr.querySelector('.ts').value,h=parseFloat(tr.querySelector('.hi').value);if(!op||isNaN(h)||h<=0){ok=false;return;}ops.push({operario:op,tarea:t||ta,horas:h});});
  if(!ops.length){alert('Agregá al menos un operario con horas.');return;}
  if(!ok){alert('Revisá que todos los operarios tengan horas cargadas.');return;}
  D.trabajos.unshift({id:Date.now(),proyecto:pr,tarea:ta,fecha:fe,encargado:en,obs:ob,operarios:ops});
  sync();limp();toast('Trabajo guardado con '+ops.length+' operario'+(ops.length>1?'s':''));
}

function limp(){
  document.getElementById('fp').value='';document.getElementById('ft').value='';document.getElementById('fe').value='';
  document.getElementById('ff').value=new Date().toISOString().split('T')[0];
  document.getElementById('fo').value='';document.getElementById('otb').innerHTML='';rid=0;calcT();addR();
}

function toast(msg){var t=document.getElementById('tst');document.getElementById('tm').textContent=msg;t.classList.add('on');setTimeout(function(){t.classList.remove('on');},3000);}

function fillF(){
  var fp=document.getElementById('flp'),fo=document.getElementById('flo'),vp=fp.value,vo=fo.value;
  fp.innerHTML='<option value="">Todos los proyectos</option>'+mkOpts(D.proyectos);
  fo.innerHTML='<option value="">Todos los operarios</option>'+mkOpts(D.operarios);
  fp.value=vp;fo.value=vo;
}

function renderH(){
  var fP=document.getElementById('flp').value,fO=document.getElementById('flo').value;
  var tr=D.trabajos.filter(function(t){return(!fP||t.proyecto===fP)&&(!fO||t.operarios.find(function(o){return o.operario===fO;}));});
  var el=document.getElementById('hl');
  if(!tr.length){el.innerHTML='<div class="emp"><i class="ti ti-inbox"></i><br>Sin registros</div>';return;}
  el.innerHTML=tr.map(function(t){
    var tot=t.operarios.reduce(function(s,o){return s+o.horas;},0),p=t.fecha.split('-');
    return'<div class="hcrd"><div class="hh"><div><div class="hp">'+t.proyecto+'</div><div class="hm"><span class="bdg">'+t.tarea+'</span> &nbsp;'+p[2]+'/'+p[1]+'/'+p[0]+' &nbsp; por '+t.encargado+'</div>'+(t.obs?'<div style="font-size:12px;color:var(--text2);margin-top:3px;font-style:italic">'+t.obs+'</div>':'')+'</div><div><div class="hhs">'+tot.toFixed(1)+'</div><div class="hhl">hs totales</div><button class="btn d" style="font-size:11px;padding:3px 8px;margin-top:6px" onclick="del('+t.id+')"><i class="ti ti-trash"></i></button></div></div><div class="ol">'+t.operarios.map(function(o){return'<div class="or"><span>'+o.operario+' <span style="color:var(--text2)">— '+o.tarea+'</span></span><span style="font-weight:500">'+o.horas+' hs</span></div>';}).join('')+'</div></div>';
  }).join('');
}

function del(id){if(!confirm('¿Eliminar?'))return;D.trabajos=D.trabajos.filter(function(t){return t.id!==id;});sync();renderH();toast('Registro eliminado');}

function renderR(){
  var tot=D.trabajos.reduce(function(s,t){return s+t.operarios.reduce(function(ss,o){return ss+o.horas;},0);},0);
  var mes=new Date().toISOString().slice(0,7);
  var hm=D.trabajos.filter(function(t){return t.fecha.startsWith(mes);}).reduce(function(s,t){return s+t.operarios.reduce(function(ss,o){return ss+o.horas;},0);},0);
  document.getElementById('sts').innerHTML='<div class="st"><div class="sl">Total horas</div><div class="sv">'+tot.toFixed(1)+'</div></div><div class="st"><div class="sl">Este mes</div><div class="sv">'+hm.toFixed(1)+'</div></div><div class="st"><div class="sl">Trabajos</div><div class="sv">'+D.trabajos.length+'</div></div><div class="st"><div class="sl">Proyectos activos</div><div class="sv">'+new Set(D.trabajos.map(function(t){return t.proyecto;})).size+'</div></div>';
  function bars(byX,elId){var mx=Math.max.apply(null,Object.values(byX).concat([1]));document.getElementById(elId).innerHTML=Object.keys(byX).length?Object.entries(byX).sort(function(a,b){return b[1]-a[1];}).map(function(e){return'<div class="bw"><div class="bl"><span>'+e[0]+'</span><span style="font-weight:500">'+e[1].toFixed(1)+' hs</span></div><div class="bb"><div class="bf" style="width:'+(e[1]/mx*100).toFixed(1)+'%"></div></div></div>';}).join(''):'<div class="emp">Sin datos</div>';}
  var byP={};D.trabajos.forEach(function(t){t.operarios.forEach(function(o){byP[t.proyecto]=(byP[t.proyecto]||0)+o.horas;});});bars(byP,'rp');
  var byO={};D.trabajos.forEach(function(t){t.operarios.forEach(function(o){byO[o.operario]=(byO[o.operario]||0)+o.horas;});});bars(byO,'ro');
}

function renderA(){
  function rl(id,key){document.getElementById(id).innerHTML=D[key].length?D[key].map(function(x,i){return'<div class="ai"><span>'+x+'</span><button class="btn d" style="padding:3px 8px;font-size:11px" onclick="rmI(\''+key+'\','+i+',\''+id+'\')"><i class="ti ti-x"></i></button></div>';}).join(''):'<div style="color:var(--text2);font-size:13px;padding:6px 0">Sin elementos</div>';}
  rl('aop','operarios');rl('apr','proyectos');rl('ata','tareas');
}

function addI(key,iid,lid){var v=document.getElementById(iid).value.trim();if(!v)return;D[key].push(v);sync();poblar();renderA();document.getElementById(iid).value='';}
function rmI(key,i){D[key].splice(i,1);sync();poblar();renderA();}

function expCSV(){
  var rows=["Fecha,Proyecto,Tarea,Encargado,Operario,Tarea Operario,Horas,Observaciones"];
  D.trabajos.forEach(function(t){t.operarios.forEach(function(o){rows.push(t.fecha+',"'+t.proyecto+'","'+t.tarea+'","'+t.encargado+'","'+o.operario+'","'+o.tarea+'",'+o.horas+',"'+(t.obs||'')+'"');});});
  var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([rows.join('\\n')],{type:'text/csv'}));a.download='horas_fischer.csv';a.click();
}

poblar();
document.getElementById('ff').value=new Date().toISOString().split('T')[0];
addR();
</script>
</body>
</html>`;
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}

  if(req.method==='GET' && req.url==='/'){
    const data = await leerData();
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
    res.end(buildHTML(data));return;
  }

  if(req.method==='POST' && req.url==='/data'){
    let body='';
    req.on('data',c=>body+=c);
    req.on('end',async()=>{
      try{const data=JSON.parse(body);await guardarData(data);res.writeHead(200);res.end('{"ok":true}');}
      catch(e){res.writeHead(400);res.end('error');}
    });return;
  }

  res.writeHead(404);res.end('not found');
});

conectar().then(()=>{
  server.listen(PORT,()=>console.log('Servidor Fischer Montajes - Puerto '+PORT));
});
