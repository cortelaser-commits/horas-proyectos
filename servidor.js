const http = require('http');
const { MongoClient } = require('mongodb');

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || '';
const COL = 'horas_data';

let db = null;
let memData = null;

const DATA_INICIAL = {
  operarios: [
    "Eduardo García","Carlos Sarassola","Leonardo Delgado","Milton Placeres",
    "Victor Gallo","Alejandro Bentancur","Julio Saracho","Luciano Sarassola",
    "Lucas Placeres","Cristian Sánchez","Enrique Avero","Santiago Da Silva",
    "Luis Gomez","Sebastián Da Silva","Sergio Bornia","Jorge Agriela",
    "Carlos Gonzales","Maikel Bravo","Adrian Ramos","Octavio Bonnahon"
  ],
  proyectos: [
    "4476 - Cañerias para nuevo tk 520-521",
    "4477 - Cinta para fechadores",
    "4484 - Suplementos transportes L4",
    "4487 - Prevencionista Barredor de Lodo",
    "4509 - Trabajos varios planta Dairyco",
    "4512 - Transferencias de cadenas para transporte de pallets",
    "4518 - RETIRO Y GESTIÓN DE RESIDUOS DE EMBALAJE",
    "4519 - Reparación tornillo sin fin – Máquina de hielo",
    "4526 - Instalación de filtros en cañería de producto",
    "4532 - Montaje de robot final de línea y transportadores asociados",
    "4533 - Armado de aireadores",
    "4535 - Aspiracion chocolatada",
    "4536 - Adicionales corrimiento cañeria",
    "4537 - Equipos Elevacion Tanques CIP",
    "4538 - Hidrogrúa para montaje de transportes Línea 8",
    "4539 - Asistencia tecnica pruebas Inspector MIJO",
    "4540 - Transportador Rechazo línea UHT",
    "4541 - Trabajos varios planta Dairyco",
    "4543 - Reparación tornillo sin fin máquina hielo",
    "4545 - Instalación mecánica planta licor cacao Rev2",
    "4546 - Mano de obra descarga y montaje tanques sala jarabe Tetra Pack",
    "4547 - Equipos de izaje – montaje tanques sala jarabe Tetra Pack",
    "4548 - Descarga y montaje despaletizadora",
    "4549 - Equipos de izaje – montaje paletizadora y horno",
    "4550 - Modificación estanterías cámara de frío",
    "4551 - Materiales corrimiento cañerías sala jarabe",
    "4552 - Puente grúa giratorio tostadora Neptuno",
    "4553 - Servicio prevencionista – montaje Línea 8",
    "4556 - Servicio prevencionista – montaje elaborador",
    "4557 - Cambio de cañería purificadoras agua",
    "4561 - Techo salida llenadora L8",
    "4562 - Techo tapadora L8",
    "4563 - Seguridad de horno y tapadora de L8",
    "4573 - Montaje del tanque aseptico",
    "4574 - Mantenimiento proceso de tostación Radar",
    "4579 - Montaje 2500 Gal y 500 Gal",
    "4582 - Bandeja Resumidero",
    "4584 - Desmontaje Centrifuga Alfa Laval",
    "4585 - Instalación TK500_501_502 SJ",
    "4587 - Adicionales Pepisco",
    "4589 - Soporteria Inoxidable Servicios L8",
    "4590 - Ingeniería e Instalación Servicios L8",
    "4591 - Montaje Centrifugadora GEA",
    "4593 - Deposito TK SJ y Oficina Krones",
    "4595 - Instalacion SubCArb L4 L5",
    "4596 - Mano de obra Plataforma y Cañerias",
    "4597 - Fabricacion y Suministro Perfil Inoxidable",
    "4598 - Escalera Plataforma L4",
    "4599 - Modificacion Cañeria Existente",
    "4600 - Fabricación Tornillo Sin Fin",
    "4601 - Relevamiento Sala de Envasado y Silos de Bolsa",
    "4602 - Trituradora de Plastico",
    "4603 - Soldadura TIG 30 Piezas según plano",
    "4604 - Tolva Envasadora",
    "4605 - Sistema recuperación de Calor",
    "4606 - Plataforma Pailas"
  ],
  tareas: [
    "Soldadura","Corte","Armado","Pintura","Instalación","Montaje",
    "Piping","Supervisión","Medición","Mantenimiento","Ingeniería","Transporte"
  ],
  trabajos: []
};

async function conectar() {
  if (!MONGO_URI) { console.log('Sin MONGO_URI, modo memoria'); return; }
  try {
    const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    db = client.db('horas_app');
    console.log('MongoDB conectado');
  } catch(e) { console.log('Error MongoDB:', e.message); }
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
  if (!db) return false;
  try {
    await db.collection(COL).replaceOne(
      { _id: 'data' },
      { _id: 'data', data, updatedAt: new Date() },
      { upsert: true }
    );
    return true;
  } catch(e) { return false; }
}

const HTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Horas por Proyecto - Fischer Montajes</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css">
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#fff;--bg2:#f5f5f4;--bg3:#f0efed;--text:#1a1a18;--text2:#6b6b68;--border:#d4d2ca;--success-bg:#eaf3de;--success:#3b6d11;--danger-bg:#fcebeb;--danger:#a32d2d;--info-bg:#e6f1fb;--info:#185fa5;--r:8px;--rl:12px}
@media(prefers-color-scheme:dark){:root{--bg:#1c1c1a;--bg2:#252523;--bg3:#2e2e2b;--text:#f0ede8;--text2:#9b9890;--border:#3a3a37}}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg3);color:var(--text);min-height:100vh}
.header{background:var(--bg);border-bottom:0.5px solid var(--border);padding:14px 16px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:100}
.hicon{width:36px;height:36px;background:var(--text);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--bg);font-size:18px;flex-shrink:0}
.htitle{font-size:16px;font-weight:500}
.hsub{font-size:12px;color:var(--text2)}
.tabs{display:flex;background:var(--bg);border-bottom:0.5px solid var(--border);overflow-x:auto}
.tab{flex:1;min-width:80px;padding:12px 8px;font-size:13px;font-weight:500;text-align:center;cursor:pointer;border:none;background:none;color:var(--text2);border-bottom:2px solid transparent;white-space:nowrap;transition:all .2s}
.tab.active{color:var(--text);border-bottom:2px solid var(--text)}
.panel{display:none;padding:12px;max-width:700px;margin:0 auto}.panel.active{display:block}
.card{background:var(--bg);border:0.5px solid var(--border);border-radius:var(--rl);padding:14px;margin-bottom:12px}
.ct{font-size:14px;font-weight:500;margin-bottom:12px;display:flex;align-items:center;gap:7px}
.field{display:flex;flex-direction:column;gap:4px;margin-bottom:10px}
.field label{font-size:12px;color:var(--text2)}
.field input,.field select,.field textarea{font-size:14px;padding:9px 11px;border:0.5px solid var(--border);border-radius:var(--r);background:var(--bg);color:var(--text);width:100%;-webkit-appearance:none}
.fg{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.btn{padding:9px 16px;border-radius:var(--r);font-size:13px;font-weight:500;cursor:pointer;border:0.5px solid var(--border);background:var(--bg);color:var(--text);display:inline-flex;align-items:center;gap:6px;transition:all .15s}
.btn:active{transform:scale(.97)}
.btn.primary{background:var(--text);color:var(--bg);border-color:var(--text)}
.btn.danger{color:var(--danger);border-color:transparent}
.btn.ghost{border-color:var(--info);color:var(--info)}
.br{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}
.opt{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px}
.opt th{text-align:left;padding:6px;font-weight:500;color:var(--text2);border-bottom:0.5px solid var(--border);font-size:12px}
.opt td{padding:5px 4px;border-bottom:0.5px solid var(--border);vertical-align:middle}
.opt tr:last-child td{border-bottom:none}
.opt select,.opt input{font-size:13px;padding:6px 7px;border:0.5px solid var(--border);border-radius:var(--r);background:var(--bg);color:var(--text);width:100%}
.tbar{display:flex;justify-content:space-between;align-items:center;padding:9px 11px;background:var(--bg2);border-radius:var(--r);margin-top:10px;font-size:13px}
.ths{font-size:16px;font-weight:500}
.hcard{background:var(--bg);border:0.5px solid var(--border);border-radius:var(--r);padding:12px;margin-bottom:8px}
.hhead{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px}
.hproj{font-size:14px;font-weight:500}
.hmeta{font-size:12px;color:var(--text2);margin-top:2px}
.hhs{font-size:20px;font-weight:500;text-align:right}
.hhl{font-size:11px;color:var(--text2);text-align:right}
.olist{border-top:0.5px solid var(--border);padding-top:8px;display:flex;flex-direction:column;gap:4px}
.orow{display:flex;justify-content:space-between;font-size:12px;padding:2px 0}
.badge{display:inline-block;font-size:11px;padding:2px 7px;border-radius:var(--r);background:var(--info-bg);color:var(--info)}
.stats{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:12px}
.stat{background:var(--bg);border-radius:var(--r);padding:12px;border:0.5px solid var(--border)}
.slbl{font-size:12px;color:var(--text2);margin-bottom:4px}
.sval{font-size:24px;font-weight:500}
.bwrap{margin-bottom:10px}
.blbl{display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px}
.bbg{height:5px;border-radius:3px;background:var(--bg2)}
.bfill{height:5px;border-radius:3px;background:var(--text)}
.alist{display:flex;flex-direction:column;gap:5px;margin-bottom:10px}
.aitem{display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:var(--bg2);border-radius:var(--r);font-size:13px}
.addrow{display:flex;gap:8px}
.addrow input{flex:1;font-size:14px;padding:8px 10px;border:0.5px solid var(--border);border-radius:var(--r);background:var(--bg);color:var(--text)}
.agrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.fbar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}
.fbar select{font-size:13px;padding:7px 10px;border:0.5px solid var(--border);border-radius:var(--r);background:var(--bg);color:var(--text);-webkit-appearance:none;flex:1;min-width:120px}
.toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--success-bg);border:0.5px solid var(--success);color:var(--success);border-radius:var(--r);padding:10px 18px;font-size:13px;display:none;align-items:center;gap:8px;z-index:999;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.15)}
.toast.show{display:flex}
.empty{text-align:center;padding:2rem;color:var(--text2);font-size:14px}
@media(max-width:420px){.fg{grid-template-columns:1fr}.agrid{grid-template-columns:1fr}.opt th:nth-child(2),.opt td:nth-child(2){display:none}}
</style>
</head>
<body>
<div class="header">
  <div class="hicon"><i class="ti ti-clock"></i></div>
  <div><div class="htitle">Horas por Proyecto</div><div class="hsub">Fischer Montajes</div></div>
</div>
<div class="tabs">
  <button class="tab active" onclick="goTab('cargar',this)"><i class="ti ti-clock"></i> Cargar</button>
  <button class="tab" onclick="goTab('historial',this)"><i class="ti ti-list"></i> Historial</button>
  <button class="tab" onclick="goTab('resumen',this)"><i class="ti ti-chart-bar"></i> Resumen</button>
  <button class="tab" onclick="goTab('admin',this)"><i class="ti ti-settings"></i> Admin</button>
</div>
<div id="toast" class="toast"><i class="ti ti-check"></i><span id="tmsg">Guardado</span></div>

<div id="panel-cargar" class="panel active">
  <div class="card">
    <div class="ct"><i class="ti ti-briefcase"></i> Datos del trabajo</div>
    <div class="fg">
      <div class="field"><label>Proyecto / Presupuesto</label><select id="f-proy"><option value="">— seleccionar —</option></select></div>
      <div class="field"><label>Tarea general</label><select id="f-tarea"><option value="">— seleccionar —</option></select></div>
      <div class="field"><label>Fecha</label><input type="date" id="f-fecha"></div>
      <div class="field"><label>Cargado por</label><select id="f-enc"><option value="">— seleccionar —</option></select></div>
    </div>
    <div class="field"><label>Observaciones <span style="font-size:11px;color:var(--text2)">(opcional)</span></label><input type="text" id="f-obs" placeholder="Detalle adicional..."></div>
  </div>
  <div class="card">
    <div class="ct"><i class="ti ti-users"></i> Operarios en este trabajo</div>
    <table class="opt">
      <thead><tr><th>Operario</th><th>Tarea</th><th style="width:78px">Horas</th><th style="width:40px"></th></tr></thead>
      <tbody id="ops-tbody"></tbody>
    </table>
    <div style="margin-top:10px"><button class="btn ghost" onclick="addRow()"><i class="ti ti-plus"></i> Agregar operario</button></div>
    <div class="tbar"><span style="color:var(--text2)">Total horas</span><span class="ths" id="total-hs">0 hs</span></div>
  </div>
  <div class="br">
    <button class="btn" onclick="limpiar()">Limpiar</button>
    <button class="btn primary" onclick="guardar()"><i class="ti ti-check"></i> Guardar trabajo</button>
  </div>
</div>

<div id="panel-historial" class="panel">
  <div class="fbar">
    <select id="fil-proy" onchange="renderH()"><option value="">Todos los proyectos</option></select>
    <select id="fil-op" onchange="renderH()"><option value="">Todos los operarios</option></select>
  </div>
  <button class="btn" style="margin-bottom:10px;width:100%;justify-content:center" onclick="exportCSV()"><i class="ti ti-download"></i> Exportar CSV</button>
  <div id="hlist"></div>
</div>

<div id="panel-resumen" class="panel">
  <div class="stats" id="stats"></div>
  <div class="card"><div class="ct">Horas por proyecto</div><div id="res-p"></div></div>
  <div class="card"><div class="ct">Horas por operario</div><div id="res-o"></div></div>
</div>

<div id="panel-admin" class="panel">
  <div class="agrid">
    <div class="card">
      <div class="ct"><i class="ti ti-users"></i> Operarios</div>
      <div id="adm-op" class="alist"></div>
      <div class="addrow"><input id="new-op" placeholder="Nombre..." onkeydown="if(event.key==='Enter')addItem('operarios','new-op','adm-op')"><button class="btn primary" onclick="addItem('operarios','new-op','adm-op')"><i class="ti ti-plus"></i></button></div>
    </div>
    <div class="card">
      <div class="ct"><i class="ti ti-building"></i> Proyectos</div>
      <div id="adm-proy" class="alist"></div>
      <div class="addrow"><input id="new-proy" placeholder="N° / nombre..." onkeydown="if(event.key==='Enter')addItem('proyectos','new-proy','adm-proy')"><button class="btn primary" onclick="addItem('proyectos','new-proy','adm-proy')"><i class="ti ti-plus"></i></button></div>
    </div>
  </div>
  <div class="card">
    <div class="ct"><i class="ti ti-tool"></i> Tareas</div>
    <div id="adm-tarea" class="alist"></div>
    <div class="addrow"><input id="new-tarea" placeholder="Nombre de la tarea..." onkeydown="if(event.key==='Enter')addItem('tareas','new-tarea','adm-tarea')"><button class="btn primary" onclick="addItem('tareas','new-tarea','adm-tarea')"><i class="ti ti-plus"></i></button></div>
  </div>
</div>

<script>
var D={operarios:[],proyectos:[],tareas:[],trabajos:[]};
var rid=0;

async function init(){
  try{
    var r=await fetch('/data');
    if(r.ok) D=await r.json();
  }catch(e){}
  poblar();
  addRow();
  document.getElementById('f-fecha').value=new Date().toISOString().split('T')[0];
}

async function sync(){
  try{await fetch('/data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(D)});}catch(e){}
}

function goTab(t,el){
  document.querySelectorAll('.tab').forEach(function(b){b.classList.remove('active')});
  document.querySelectorAll('.panel').forEach(function(p){p.classList.remove('active')});
  el.classList.add('active');
  document.getElementById('panel-'+t).classList.add('active');
  if(t==='historial'){fillF();renderH();}
  if(t==='resumen') renderR();
  if(t==='admin') renderA();
}

function poblar(){
  var sets=[{id:'f-proy',l:D.proyectos,p:'— seleccionar —'},{id:'f-tarea',l:D.tareas,p:'— seleccionar —'},{id:'f-enc',l:D.operarios,p:'— seleccionar —'}];
  sets.forEach(function(s){
    var el=document.getElementById(s.id);if(!el)return;
    var v=el.value;
    el.innerHTML='<option value="">'+s.p+'</option>'+s.l.map(function(x){return'<option value="'+x+'">'+x+'</option>';}).join('');
    el.value=v;
  });
  document.querySelectorAll('.os').forEach(function(sel){
    var v=sel.value;
    sel.innerHTML='<option value="">— operario —</option>'+D.operarios.map(function(x){return'<option value="'+x+'">'+x+'</option>';}).join('');
    sel.value=v;
  });
  document.querySelectorAll('.ts').forEach(function(sel){
    var v=sel.value;
    sel.innerHTML='<option value="">—</option>'+D.tareas.map(function(x){return'<option value="'+x+'">'+x+'</option>';}).join('');
    sel.value=v;
  });
}

function addRow(op,ta,hs){
  var id='r'+rid++;
  var tr=document.createElement('tr');tr.id=id;
  var oo='<option value="">— operario —</option>'+D.operarios.map(function(x){return'<option value="'+x+'"'+(x===op?' selected':'')+'>'+x+'</option>';}).join('');
  var to='<option value="">—</option>'+D.tareas.map(function(x){return'<option value="'+x+'"'+(x===ta?' selected':'')+'>'+x+'</option>';}).join('');
  tr.innerHTML='<td><select class="os">'+oo+'</select></td><td><select class="ts">'+to+'</select></td><td><input class="hi" type="number" min="0.5" max="24" step="0.5" value="'+(hs||'')+'" placeholder="0" oninput="calcT()" style="width:70px"></td><td><button class="btn danger" onclick="document.getElementById(\''+id+'\').remove();calcT()" style="padding:4px 8px"><i class="ti ti-x"></i></button></td>';
  document.getElementById('ops-tbody').appendChild(tr);calcT();
}

function calcT(){
  var t=0;
  document.querySelectorAll('.hi').forEach(function(i){var v=parseFloat(i.value);if(!isNaN(v))t+=v;});
  document.getElementById('total-hs').textContent=t.toFixed(1)+' hs';
}

function guardar(){
  var pr=document.getElementById('f-proy').value;
  var ta=document.getElementById('f-tarea').value;
  var fe=document.getElementById('f-fecha').value;
  var en=document.getElementById('f-enc').value;
  var ob=document.getElementById('f-obs').value.trim();
  if(!pr||!ta||!fe||!en){alert('Completá todos los datos del trabajo.');return;}
  var rows=document.querySelectorAll('#ops-tbody tr');
  var ops=[];var ok=true;
  rows.forEach(function(tr){
    var op=tr.querySelector('.os').value;
    var t=tr.querySelector('.ts').value;
    var h=parseFloat(tr.querySelector('.hi').value);
    if(!op||isNaN(h)||h<=0){ok=false;return;}
    ops.push({operario:op,tarea:t||ta,horas:h});
  });
  if(!ops.length){alert('Agregá al menos un operario con horas.');return;}
  if(!ok){alert('Revisá que todos los operarios tengan horas cargadas.');return;}
  D.trabajos.unshift({id:Date.now(),proyecto:pr,tarea:ta,fecha:fe,encargado:en,obs:ob,operarios:ops});
  sync();limpiar();
  toast('Trabajo guardado con '+ops.length+' operario'+(ops.length>1?'s':''));
}

function limpiar(){
  ['f-proy','f-tarea','f-enc'].forEach(function(id){document.getElementById(id).value='';});
  document.getElementById('f-fecha').value=new Date().toISOString().split('T')[0];
  document.getElementById('f-obs').value='';
  document.getElementById('ops-tbody').innerHTML='';rid=0;calcT();addRow();
}

function toast(msg){
  var t=document.getElementById('toast');
  document.getElementById('tmsg').textContent=msg;
  t.classList.add('show');setTimeout(function(){t.classList.remove('show');},3000);
}

function fillF(){
  var fp=document.getElementById('fil-proy'),fo=document.getElementById('fil-op');
  var vp=fp.value,vo=fo.value;
  fp.innerHTML='<option value="">Todos los proyectos</option>'+D.proyectos.map(function(x){return'<option value="'+x+'">'+x+'</option>';}).join('');
  fo.innerHTML='<option value="">Todos los operarios</option>'+D.operarios.map(function(x){return'<option value="'+x+'">'+x+'</option>';}).join('');
  fp.value=vp;fo.value=vo;
}

function renderH(){
  var fP=document.getElementById('fil-proy').value;
  var fO=document.getElementById('fil-op').value;
  var tr=D.trabajos.filter(function(t){
    if(fP&&t.proyecto!==fP)return false;
    if(fO&&!t.operarios.find(function(o){return o.operario===fO;}))return false;
    return true;
  });
  var el=document.getElementById('hlist');
  if(!tr.length){el.innerHTML='<div class="empty"><i class="ti ti-inbox"></i><br>Sin registros</div>';return;}
  el.innerHTML=tr.map(function(t){
    var tot=t.operarios.reduce(function(s,o){return s+o.horas;},0);
    var p=t.fecha.split('-');
    return '<div class="hcard"><div class="hhead"><div><div class="hproj">'+t.proyecto+'</div><div class="hmeta"><span class="badge">'+t.tarea+'</span> &nbsp; '+p[2]+'/'+p[1]+'/'+p[0]+' &nbsp; por '+t.encargado+'</div>'+(t.obs?'<div style="font-size:12px;color:var(--text2);margin-top:3px;font-style:italic">'+t.obs+'</div>':'')+'</div><div><div class="hhs">'+tot.toFixed(1)+'</div><div class="hhl">hs totales</div><button class="btn danger" style="font-size:11px;padding:3px 8px;margin-top:6px" onclick="del('+t.id+')"><i class="ti ti-trash"></i></button></div></div><div class="olist">'+t.operarios.map(function(o){return'<div class="orow"><span>'+o.operario+' <span style="color:var(--text2)">— '+o.tarea+'</span></span><span style="font-weight:500">'+o.horas+' hs</span></div>';}).join('')+'</div></div>';
  }).join('');
}

function del(id){
  if(!confirm('¿Eliminar este registro?'))return;
  D.trabajos=D.trabajos.filter(function(t){return t.id!==id;});
  sync();renderH();toast('Registro eliminado');
}

function renderR(){
  var tot=D.trabajos.reduce(function(s,t){return s+t.operarios.reduce(function(ss,o){return ss+o.horas;},0);},0);
  var mes=new Date().toISOString().slice(0,7);
  var hm=D.trabajos.filter(function(t){return t.fecha.startsWith(mes);}).reduce(function(s,t){return s+t.operarios.reduce(function(ss,o){return ss+o.horas;},0);},0);
  var pa=new Set(D.trabajos.map(function(t){return t.proyecto;})).size;
  document.getElementById('stats').innerHTML='<div class="stat"><div class="slbl">Total horas</div><div class="sval">'+tot.toFixed(1)+'</div></div><div class="stat"><div class="slbl">Este mes</div><div class="sval">'+hm.toFixed(1)+'</div></div><div class="stat"><div class="slbl">Trabajos</div><div class="sval">'+D.trabajos.length+'</div></div><div class="stat"><div class="slbl">Proyectos</div><div class="sval">'+pa+'</div></div>';
  var byP={};D.trabajos.forEach(function(t){t.operarios.forEach(function(o){byP[t.proyecto]=(byP[t.proyecto]||0)+o.horas;});});
  var mP=Math.max.apply(null,Object.values(byP).concat([1]));
  document.getElementById('res-p').innerHTML=Object.keys(byP).length?Object.entries(byP).sort(function(a,b){return b[1]-a[1];}).map(function(e){return'<div class="bwrap"><div class="blbl"><span>'+e[0]+'</span><span style="font-weight:500">'+e[1].toFixed(1)+' hs</span></div><div class="bbg"><div class="bfill" style="width:'+(e[1]/mP*100).toFixed(1)+'%"></div></div></div>';}).join(''):'<div class="empty">Sin datos</div>';
  var byO={};D.trabajos.forEach(function(t){t.operarios.forEach(function(o){byO[o.operario]=(byO[o.operario]||0)+o.horas;});});
  var mO=Math.max.apply(null,Object.values(byO).concat([1]));
  document.getElementById('res-o').innerHTML=Object.keys(byO).length?Object.entries(byO).sort(function(a,b){return b[1]-a[1];}).map(function(e){return'<div class="bwrap"><div class="blbl"><span>'+e[0]+'</span><span style="font-weight:500">'+e[1].toFixed(1)+' hs</span></div><div class="bbg"><div class="bfill" style="width:'+(e[1]/mO*100).toFixed(1)+'%"></div></div></div>';}).join(''):'<div class="empty">Sin datos</div>';
}

function renderA(){
  function rl(id,key){
    document.getElementById(id).innerHTML=D[key].length?D[key].map(function(x,i){return'<div class="aitem"><span>'+x+'</span><button class="btn danger" style="padding:3px 8px;font-size:11px" onclick="rmItem(\''+key+'\','+i+',\''+id+'\')"><i class="ti ti-x"></i></button></div>';}).join(''):'<div style="color:var(--text2);font-size:13px;padding:6px 0">Sin elementos</div>';
  }
  rl('adm-op','operarios');rl('adm-proy','proyectos');rl('adm-tarea','tareas');
}

function addItem(key,iid,lid){
  var v=document.getElementById(iid).value.trim();if(!v)return;
  D[key].push(v);sync();poblar();renderA();document.getElementById(iid).value='';
}
function rmItem(key,i,lid){D[key].splice(i,1);sync();poblar();renderA();}

function exportCSV(){
  var rows=["Fecha,Proyecto,Tarea,Encargado,Operario,Tarea Operario,Horas,Observaciones"];
  D.trabajos.forEach(function(t){t.operarios.forEach(function(o){rows.push(t.fecha+',"'+t.proyecto+'","'+t.tarea+'","'+t.encargado+'","'+o.operario+'","'+o.tarea+'",'+o.horas+',"'+(t.obs||'')+'"');});});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([rows.join('\n')],{type:'text/csv'}));
  a.download='horas_fischer.csv';a.click();
}

init();
</script>
</body>
</html>`;

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(HTML); return;
  }

  if (req.method === 'GET' && req.url === '/data') {
    const data = await leerData();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data)); return;
  }

  if (req.method === 'POST' && req.url === '/data') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        await guardarData(data);
        res.writeHead(200); res.end('{"ok":true}');
      } catch(e) { res.writeHead(400); res.end('error'); }
    }); return;
  }

  res.writeHead(404); res.end('not found');
});

conectar().then(() => {
  server.listen(PORT, () => {
    console.log('Servidor Horas Fischer Montajes - Puerto ' + PORT);
  });
});
