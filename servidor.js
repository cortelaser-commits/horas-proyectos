const http = require('http');
const { MongoClient } = require('mongodb');

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || '';
const COL = 'horas_data';

let db = null;

const DATA_INICIAL = {
  operarios: [
    'Eduardo García',
    'Carlos Sarassola',
    'Leonardo Delgado',
    'Milton Placeres',
    'Victor Gallo',
    'Alejandro Bentancur',
    'Julio Saracho',
    'Luciano Sarassola',
    'Lucas Placeres',
    'Cristian Sánchez',
    'Enrique Avero',
    'Santiago Da Silva',
    'Luis Gomez',
    'Sebastián Da Silva',
    'Sergio Bornia',
    'Jorge Agriela',
    'Carlos Gonzales',
    'Maikel Bravo',
    'Adrian Ramos',
    'Octavio Bonnahon'
  ],
  proyectos: [
    '4526 - Instalación de filtros en cañería de producto',
    '4509 - Trabajos varios planta Dairyco',
    '4512 - Transferencias de cadenas para transporte de pallets',
    '4518 - RETIRO Y GESTIÓN DE RESIDUOS DE EMBALAJE',
    '4519 - Reparación tornillo sin fin – Máquina de hielo',
    '4532 - Montaje de robot final de línea y transportadores asociados',
    '4533 - Armado de aireadores',
    '4535 - Aspiracion chocolatada',
    '4536 - Adicionales corrimiento cañeria',
    '4537 - Equipos Elevacion Tanques CIP',
    '4538 - Hidrogrúa para montaje de transportes Línea 8',
    '4539 - Asistencia tecnica pruebas Inspector MIJO',
    '4540 - Transportador Rechazo línea UHT',
    '4541 - Trabajos varios planta Dairyco',
    '4543 - Reparación tornillo sin fin máquina hielo',
    '4545 - Instalación mecánica planta licor cacao Rev2',
    '4546 - Mano de obra descarga y montaje de tanques sala jarabe Tetra Pack',
    '4547 - Equipos de izaje – montaje tanques sala jarabe Tetra Pack',
    '4548 - Descarga y montaje despaletizadora',
    '4549 - Equipos de izaje – montaje paletizadora y horno termocontraíble',
    '4550 - Modificación estanterías cámara de frío',
    '4551 - Materiales corrimiento cañerías sala jarabe',
    '4552 - Puente grúa giratorio tostadora Neptuno',
    '4553 - Servicio prevencionista – montaje Línea 8',
    '4556 - Servicio prevencionista – montaje elaborador',
    '4557 - Cambio de cañería purificadoras agua',
    '4561 - Techo salida llenadora L8',
    '4562 - Techo tapadora L8',
    '4563 - Seguridad de horno y tapadora de L8',
    '4573 - Montaje del tanque aseptico',
    '4574 - Mantenimiento proceso de tostación Radar',
    '4579 - Montaje 2500 Gal y 500 Gal',
    '4582 - Bandeja Resumidero',
    '4584 - Desmontaje Centrifuga Alfa Laval',
    '4585 - Instalación TK500_501_502 SJ',
    '4587 - Adicionales',
    '4589 - Soporteria Inoxidable Servicios L8',
    '4590 - Ingeniería e Instalación Servicios L8',
    '4591 - Montaje Centrifugadora GEA',
    '4593 - Deposito TK SJ y Oficina Krones',
    '4595 - Instalacion SubCArb L4, L5',
    '4596 - Mano de obra Plataforma y Cañerias',
    '4597 - Fabricacion y Suministro Perfil Inoxidable',
    '4598 - Escalera Plataforma L4',
    '4599 - Modificacion Cañeria Existente',
    '4600 - Fabricación Tornillo Sin Fin',
    '4601 - Relevamiento Sala de Envasado y Silos de Bolsa',
    '4602 - Trituradora de Plastico',
    '4603 - Soldadura TIG 30 Piezas según plano',
    '4604 - Tolva Envasadora',
    '4605 - Sistema recuperación de Calor',
    '4606 - Plataforma Pailas',
    '4476 - Cañerias para nuevo tk 520-521',
    '4477 - Cinta para fechadores',
    '4484 - Suplementos transportes L4',
    '4487 - Prevencionista Barredor de Lodo'
  ],
  tareas: [
    'Soldadura',
    'Corte',
    'Armado',
    'Pintura',
    'Instalación',
    'Montaje',
    'Piping',
    'Supervisión',
    'Medición',
    'Mantenimiento',
    'Ingeniería',
    'Transporte'
  ],
  trabajos: []
};

async function conectar() {
  if (!MONGO_URI) { console.log('Sin MONGO_URI, modo memoria'); return; }
  try {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db('horas_app');
    console.log('MongoDB conectado');
  } catch(e) { console.log('Error MongoDB:', e.message); }
}

async function leerData() {
  if (!db) return DATA_INICIAL;
  try {
    const doc = await db.collection(COL).findOne({ _id: 'data' });
    return doc ? doc.data : DATA_INICIAL;
  } catch(e) { return DATA_INICIAL; }
}

async function guardarData(data) {
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
<title>Horas por Proyecto</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css">
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#fff;--bg2:#f5f5f4;--bg3:#f0efed;--text:#1a1a18;--text2:#6b6b68;--border:#d4d2ca;--success-bg:#eaf3de;--success:#3b6d11;--danger-bg:#fcebeb;--danger:#a32d2d;--info-bg:#e6f1fb;--info:#185fa5;--radius:8px;--radius-lg:12px}
@media(prefers-color-scheme:dark){:root{--bg:#1c1c1a;--bg2:#252523;--bg3:#2e2e2b;--text:#f0ede8;--text2:#9b9890;--border:#3a3a37}}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg3);color:var(--text);min-height:100vh}
.header{background:var(--bg);border-bottom:0.5px solid var(--border);padding:14px 16px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:100}
.header-icon{width:36px;height:36px;background:var(--text);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--bg);font-size:18px}
.header h1{font-size:16px;font-weight:500}
.header-sub{font-size:12px;color:var(--text2)}
.tabs{display:flex;background:var(--bg);border-bottom:0.5px solid var(--border);overflow-x:auto}
.tab{flex:1;min-width:80px;padding:12px 8px;font-size:13px;font-weight:500;text-align:center;cursor:pointer;border:none;background:none;color:var(--text2);border-bottom:2px solid transparent;white-space:nowrap;transition:all .2s}
.tab.active{color:var(--text);border-bottom:2px solid var(--text)}
.panel{display:none;padding:12px;max-width:700px;margin:0 auto}.panel.active{display:block}
.card{background:var(--bg);border:0.5px solid var(--border);border-radius:var(--radius-lg);padding:14px;margin-bottom:12px}
.card-title{font-size:14px;font-weight:500;margin-bottom:12px;display:flex;align-items:center;gap:7px;color:var(--text)}
.field{display:flex;flex-direction:column;gap:4px;margin-bottom:10px}
.field label{font-size:12px;color:var(--text2)}
.field input,.field select,.field textarea{font-size:14px;padding:9px 11px;border:0.5px solid var(--border);border-radius:var(--radius);background:var(--bg);color:var(--text);width:100%;-webkit-appearance:none}
.fgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.btn{padding:9px 16px;border-radius:var(--radius);font-size:13px;font-weight:500;cursor:pointer;border:0.5px solid var(--border);background:var(--bg);color:var(--text);display:inline-flex;align-items:center;gap:6px;transition:all .15s}
.btn:active{transform:scale(.97)}
.btn.primary{background:var(--text);color:var(--bg);border-color:var(--text)}
.btn.danger{color:var(--danger);border-color:transparent}
.btn.ghost{border-color:var(--info);color:var(--info)}
.btn-row{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}
.op-table{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px}
.op-table th{text-align:left;padding:6px 6px;font-weight:500;color:var(--text2);border-bottom:0.5px solid var(--border);font-size:12px}
.op-table td{padding:5px 4px;border-bottom:0.5px solid var(--border);vertical-align:middle}
.op-table tr:last-child td{border-bottom:none}
.op-table select,.op-table input{font-size:13px;padding:6px 7px;border:0.5px solid var(--border);border-radius:var(--radius);background:var(--bg);color:var(--text);width:100%}
.total-bar{display:flex;justify-content:space-between;align-items:center;padding:9px 11px;background:var(--bg2);border-radius:var(--radius);margin-top:10px;font-size:13px}
.total-hs{font-size:16px;font-weight:500}
.hcard{background:var(--bg);border:0.5px solid var(--border);border-radius:var(--radius);padding:12px;margin-bottom:8px}
.hcard-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px}
.hcard-proj{font-size:14px;font-weight:500}
.hcard-meta{font-size:12px;color:var(--text2);margin-top:2px}
.hcard-hs{font-size:20px;font-weight:500;text-align:right}
.hcard-hl{font-size:11px;color:var(--text2);text-align:right}
.ops-list{border-top:0.5px solid var(--border);padding-top:8px;display:flex;flex-direction:column;gap:4px}
.op-row-h{display:flex;justify-content:space-between;font-size:12px;padding:2px 0}
.badge{display:inline-block;font-size:11px;padding:2px 7px;border-radius:var(--radius);background:var(--info-bg);color:var(--info)}
.stats{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:12px}
.stat{background:var(--bg);border-radius:var(--radius);padding:12px;border:0.5px solid var(--border)}
.stat-label{font-size:12px;color:var(--text2);margin-bottom:4px}
.stat-val{font-size:24px;font-weight:500}
.bar-wrap{margin-bottom:10px}
.bar-lbl{display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px}
.bar-bg{height:5px;border-radius:3px;background:var(--bg2)}
.bar-fill{height:5px;border-radius:3px;background:var(--text)}
.admin-list{display:flex;flex-direction:column;gap:5px;margin-bottom:10px}
.admin-item{display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:var(--bg2);border-radius:var(--radius);font-size:13px}
.add-row{display:flex;gap:8px}
.add-row input{flex:1;font-size:14px;padding:8px 10px;border:0.5px solid var(--border);border-radius:var(--radius);background:var(--bg);color:var(--text)}
.agrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.filter-bar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}
.filter-bar select{font-size:13px;padding:7px 10px;border:0.5px solid var(--border);border-radius:var(--radius);background:var(--bg);color:var(--text);-webkit-appearance:none;flex:1;min-width:120px}
.toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--success-bg);border:0.5px solid var(--success);color:var(--success);border-radius:var(--radius);padding:10px 18px;font-size:13px;display:none;align-items:center;gap:8px;z-index:999;white-space:nowrap}
.toast.show{display:flex}
.empty{text-align:center;padding:2rem;color:var(--text2);font-size:14px}
.loading{text-align:center;padding:2rem;color:var(--text2);font-size:14px}
@media(max-width:400px){.fgrid{grid-template-columns:1fr}.agrid{grid-template-columns:1fr}.op-table th:nth-child(2),.op-table td:nth-child(2){display:none}}
</style>
</head>
<body>
<div class="header">
  <div class="header-icon"><i class="ti ti-clock"></i></div>
  <div><div class="header h1" style="font-size:16px;font-weight:500">Horas por Proyecto</div><div class="header-sub" id="empresa-sub">Cargando...</div></div>
</div>

<div class="tabs">
  <button class="tab active" onclick="goTab('cargar',this)"><i class="ti ti-clock"></i> Cargar</button>
  <button class="tab" onclick="goTab('historial',this)"><i class="ti ti-list"></i> Historial</button>
  <button class="tab" onclick="goTab('resumen',this)"><i class="ti ti-chart-bar"></i> Resumen</button>
  <button class="tab" onclick="goTab('admin',this)"><i class="ti ti-settings"></i> Admin</button>
</div>

<div id="toast" class="toast"><i class="ti ti-check"></i><span id="toast-msg">Guardado</span></div>

<div id="panel-cargar" class="panel active">
  <div class="card">
    <div class="card-title"><i class="ti ti-briefcase"></i> Datos del trabajo</div>
    <div class="fgrid">
      <div class="field"><label>Proyecto / Presupuesto</label><select id="f-proyecto"><option value="">— seleccionar —</option></select></div>
      <div class="field"><label>Tarea general</label><select id="f-tarea"><option value="">— seleccionar —</option></select></div>
      <div class="field"><label>Fecha</label><input type="date" id="f-fecha"></div>
      <div class="field"><label>Cargado por</label><select id="f-encargado"><option value="">— seleccionar —</option></select></div>
    </div>
    <div class="field"><label>Observaciones <span style="font-size:11px;color:var(--text2)">(opcional)</span></label><input type="text" id="f-obs" placeholder="Detalle adicional..."></div>
  </div>
  <div class="card">
    <div class="card-title"><i class="ti ti-users"></i> Operarios en este trabajo</div>
    <table class="op-table">
      <thead><tr><th>Operario</th><th>Tarea</th><th style="width:75px">Horas</th><th style="width:40px"></th></tr></thead>
      <tbody id="ops-tbody"></tbody>
    </table>
    <div style="margin-top:10px"><button class="btn ghost" onclick="addOpRow()"><i class="ti ti-plus"></i> Agregar operario</button></div>
    <div class="total-bar"><span style="color:var(--text2)">Total horas</span><span class="total-hs" id="total-hs">0 hs</span></div>
  </div>
  <div class="btn-row">
    <button class="btn" onclick="limpiar()">Limpiar</button>
    <button class="btn primary" onclick="guardar()"><i class="ti ti-check"></i> Guardar trabajo</button>
  </div>
</div>

<div id="panel-historial" class="panel">
  <div class="filter-bar">
    <select id="fil-proy" onchange="renderHistorial()"><option value="">Todos los proyectos</option></select>
    <select id="fil-op" onchange="renderHistorial()"><option value="">Todos los operarios</option></select>
  </div>
  <button class="btn" style="margin-bottom:10px;width:100%;justify-content:center" onclick="exportCSV()"><i class="ti ti-download"></i> Exportar CSV</button>
  <div id="hist-list"></div>
</div>

<div id="panel-resumen" class="panel">
  <div class="stats" id="stats"></div>
  <div class="card"><div class="card-title">Horas por proyecto</div><div id="res-proy"></div></div>
  <div class="card"><div class="card-title">Horas por operario</div><div id="res-op"></div></div>
</div>

<div id="panel-admin" class="panel">
  <div class="agrid">
    <div class="card">
      <div class="card-title"><i class="ti ti-users"></i> Operarios</div>
      <div id="adm-op" class="admin-list"></div>
      <div class="add-row"><input id="new-op" placeholder="Nombre..." onkeydown="if(event.key==='Enter')addItem('operarios','new-op','adm-op')"><button class="btn primary" onclick="addItem('operarios','new-op','adm-op')"><i class="ti ti-plus"></i></button></div>
    </div>
    <div class="card">
      <div class="card-title"><i class="ti ti-building"></i> Proyectos</div>
      <div id="adm-proy" class="admin-list"></div>
      <div class="add-row"><input id="new-proy" placeholder="N° / nombre..." onkeydown="if(event.key==='Enter')addItem('proyectos','new-proy','adm-proy')"><button class="btn primary" onclick="addItem('proyectos','new-proy','adm-proy')"><i class="ti ti-plus"></i></button></div>
    </div>
  </div>
  <div class="card">
    <div class="card-title"><i class="ti ti-tool"></i> Tareas</div>
    <div id="adm-tarea" class="admin-list"></div>
    <div class="add-row"><input id="new-tarea" placeholder="Nombre de la tarea..." onkeydown="if(event.key==='Enter')addItem('tareas','new-tarea','adm-tarea')"><button class="btn primary" onclick="addItem('tareas','new-tarea','adm-tarea')"><i class="ti ti-plus"></i></button></div>
  </div>
</div>

<script>
let D={operarios:[],proyectos:[],tareas:[],trabajos:[]};
let opRowId=0;

async function cargarDatos(){
  try{
    const r=await fetch('/data');
    D=await r.json();
    document.getElementById('empresa-sub').textContent='Fischer Montajes';
  }catch(e){ document.getElementById('empresa-sub').textContent='Sin conexión'; }
  poblar(); addOpRow();
  document.getElementById('f-fecha').value=new Date().toISOString().split('T')[0];
}

async function guardarServidor(){
  try{ await fetch('/data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(D)}); }catch(e){}
}

function goTab(t,el){
  document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('panel-'+t).classList.add('active');
  if(t==='historial'){fillFilters();renderHistorial();}
  if(t==='resumen') renderResumen();
  if(t==='admin') renderAdmin();
}

function poblar(){
  const sets=[{id:'f-proyecto',list:D.proyectos,ph:'— seleccionar —'},{id:'f-tarea',list:D.tareas,ph:'— seleccionar —'},{id:'f-encargado',list:D.operarios,ph:'— seleccionar —'}];
  sets.forEach(s=>{
    const el=document.getElementById(s.id);if(!el)return;
    const v=el.value;
    el.innerHTML='<option value="">'+s.ph+'</option>'+s.list.map(x=>'<option value="'+x+'">'+x+'</option>').join('');
    el.value=v;
  });
  document.querySelectorAll('.op-select').forEach(sel=>{const v=sel.value;sel.innerHTML='<option value="">— operario —</option>'+D.operarios.map(x=>'<option value="'+x+'">'+x+'</option>').join('');sel.value=v;});
  document.querySelectorAll('.tarea-select').forEach(sel=>{const v=sel.value;sel.innerHTML='<option value="">—</option>'+D.tareas.map(x=>'<option value="'+x+'">'+x+'</option>').join('');sel.value=v;});
}

function addOpRow(op,tarea,hs){
  const id='op-'+opRowId++;
  const tr=document.createElement('tr');tr.id=id;
  const opOpts='<option value="">— operario —</option>'+D.operarios.map(x=>'<option value="'+x+'"'+(x===op?' selected':'')+'>'+x+'</option>').join('');
  const tOpts='<option value="">—</option>'+D.tareas.map(x=>'<option value="'+x+'"'+(x===tarea?' selected':'')+'>'+x+'</option>').join('');
  tr.innerHTML='<td><select class="op-select">'+opOpts+'</select></td><td><select class="tarea-select">'+tOpts+'</select></td><td><input class="hs-input" type="number" min="0.5" max="24" step="0.5" value="'+(hs||'')+'" placeholder="0" oninput="calcTotal()" style="width:68px"></td><td><button class="btn danger" onclick="document.getElementById(\''+id+'\').remove();calcTotal()" style="padding:4px 8px"><i class="ti ti-x"></i></button></td>';
  document.getElementById('ops-tbody').appendChild(tr);calcTotal();
}

function calcTotal(){
  let t=0;document.querySelectorAll('.hs-input').forEach(i=>{const v=parseFloat(i.value);if(!isNaN(v))t+=v;});
  document.getElementById('total-hs').textContent=t.toFixed(1)+' hs';
}

function guardar(){
  const pr=document.getElementById('f-proyecto').value;
  const ta=document.getElementById('f-tarea').value;
  const fe=document.getElementById('f-fecha').value;
  const en=document.getElementById('f-encargado').value;
  const ob=document.getElementById('f-obs').value.trim();
  if(!pr||!ta||!fe||!en){alert('Completá todos los datos del trabajo.');return;}
  const rows=document.querySelectorAll('#ops-tbody tr');
  const operarios=[];let ok=true;
  rows.forEach(tr=>{
    const op=tr.querySelector('.op-select').value;
    const t=tr.querySelector('.tarea-select').value;
    const h=parseFloat(tr.querySelector('.hs-input').value);
    if(!op||isNaN(h)||h<=0){ok=false;return;}
    operarios.push({operario:op,tarea:t||ta,horas:h});
  });
  if(!operarios.length){alert('Agregá al menos un operario con horas.');return;}
  if(!ok){alert('Revisá que todos los operarios tengan horas cargadas.');return;}
  D.trabajos.unshift({id:Date.now(),proyecto:pr,tarea:ta,fecha:fe,encargado:en,obs:ob,operarios});
  guardarServidor();limpiar();
  showToast('Trabajo guardado con '+operarios.length+' operario'+(operarios.length>1?'s':''));
}

function limpiar(){
  ['f-proyecto','f-tarea','f-encargado'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('f-fecha').value=new Date().toISOString().split('T')[0];
  document.getElementById('f-obs').value='';
  document.getElementById('ops-tbody').innerHTML='';opRowId=0;calcTotal();addOpRow();
}

function showToast(msg){
  const t=document.getElementById('toast');
  document.getElementById('toast-msg').textContent=msg;
  t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3000);
}

function fillFilters(){
  const fp=document.getElementById('fil-proy'),fo=document.getElementById('fil-op');
  const vp=fp.value,vo=fo.value;
  fp.innerHTML='<option value="">Todos los proyectos</option>'+D.proyectos.map(x=>'<option value="'+x+'">'+x+'</option>').join('');
  fo.innerHTML='<option value="">Todos los operarios</option>'+D.operarios.map(x=>'<option value="'+x+'">'+x+'</option>').join('');
  fp.value=vp;fo.value=vo;
}

function renderHistorial(){
  const fPr=document.getElementById('fil-proy').value;
  const fOp=document.getElementById('fil-op').value;
  let trabajos=D.trabajos.filter(t=>{
    if(fPr&&t.proyecto!==fPr)return false;
    if(fOp&&!t.operarios.find(o=>o.operario===fOp))return false;
    return true;
  });
  const el=document.getElementById('hist-list');
  if(!trabajos.length){el.innerHTML='<div class="empty"><i class="ti ti-inbox"></i><br>Sin registros</div>';return;}
  el.innerHTML=trabajos.map(t=>{
    const total=t.operarios.reduce((s,o)=>s+o.horas,0);
    const [y,m,d]=t.fecha.split('-');
    return '<div class="hcard"><div class="hcard-head"><div><div class="hcard-proj">'+t.proyecto+'</div><div class="hcard-meta"><span class="badge">'+t.tarea+'</span> &nbsp; '+d+'/'+m+'/'+y+' &nbsp; por '+t.encargado+'</div>'+(t.obs?'<div style="font-size:12px;color:var(--text2);margin-top:3px;font-style:italic">'+t.obs+'</div>':'')+'</div><div><div class="hcard-hs">'+total.toFixed(1)+'</div><div class="hcard-hl">hs totales</div><button class="btn danger" style="font-size:11px;padding:3px 8px;margin-top:6px" onclick="eliminar('+t.id+')"><i class="ti ti-trash"></i></button></div></div><div class="ops-list">'+t.operarios.map(o=>'<div class="op-row-h"><span>'+o.operario+' <span style="color:var(--text2)">— '+o.tarea+'</span></span><span style="font-weight:500">'+o.horas+' hs</span></div>').join('')+'</div></div>';
  }).join('');
}

function eliminar(id){
  if(!confirm('¿Eliminar este registro?'))return;
  D.trabajos=D.trabajos.filter(t=>t.id!==id);
  guardarServidor();renderHistorial();showToast('Registro eliminado');
}

function renderResumen(){
  const totalHs=D.trabajos.reduce((s,t)=>s+t.operarios.reduce((ss,o)=>ss+o.horas,0),0);
  const mes=new Date().toISOString().slice(0,7);
  const hsMes=D.trabajos.filter(t=>t.fecha.startsWith(mes)).reduce((s,t)=>s+t.operarios.reduce((ss,o)=>ss+o.horas,0),0);
  const projAct=new Set(D.trabajos.map(t=>t.proyecto)).size;
  document.getElementById('stats').innerHTML='<div class="stat"><div class="stat-label">Total horas</div><div class="stat-val">'+totalHs.toFixed(1)+'</div></div><div class="stat"><div class="stat-label">Este mes</div><div class="stat-val">'+hsMes.toFixed(1)+'</div></div><div class="stat"><div class="stat-label">Trabajos</div><div class="stat-val">'+D.trabajos.length+'</div></div><div class="stat"><div class="stat-label">Proyectos</div><div class="stat-val">'+projAct+'</div></div>';
  const byP={};D.trabajos.forEach(t=>t.operarios.forEach(o=>{byP[t.proyecto]=(byP[t.proyecto]||0)+o.horas;}));
  const maxP=Math.max(...Object.values(byP),1);
  document.getElementById('res-proy').innerHTML=Object.keys(byP).length?Object.entries(byP).sort((a,b)=>b[1]-a[1]).map(([k,v])=>'<div class="bar-wrap"><div class="bar-lbl"><span>'+k+'</span><span style="font-weight:500">'+v.toFixed(1)+' hs</span></div><div class="bar-bg"><div class="bar-fill" style="width:'+(v/maxP*100).toFixed(1)+'%"></div></div></div>').join(''):'<div class="empty">Sin datos</div>';
  const byO={};D.trabajos.forEach(t=>t.operarios.forEach(o=>{byO[o.operario]=(byO[o.operario]||0)+o.horas;}));
  const maxO=Math.max(...Object.values(byO),1);
  document.getElementById('res-op').innerHTML=Object.keys(byO).length?Object.entries(byO).sort((a,b)=>b[1]-a[1]).map(([k,v])=>'<div class="bar-wrap"><div class="bar-lbl"><span>'+k+'</span><span style="font-weight:500">'+v.toFixed(1)+' hs</span></div><div class="bar-bg"><div class="bar-fill" style="width:'+(v/maxO*100).toFixed(1)+'%"></div></div></div>').join(''):'<div class="empty">Sin datos</div>';
}

function renderAdmin(){
  const r=(id,key)=>{document.getElementById(id).innerHTML=D[key].length?D[key].map((x,i)=>'<div class="admin-item"><span>'+x+'</span><button class="btn danger" style="padding:3px 8px;font-size:11px" onclick="removeItem(\''+key+'\','+i+',\''+id+'\')"><i class="ti ti-x"></i></button></div>').join(''):'<div style="color:var(--text2);font-size:13px;padding:6px 0">Sin elementos</div>';};
  r('adm-op','operarios');r('adm-proy','proyectos');r('adm-tarea','tareas');
}

function addItem(key,inputId,listId){
  const v=document.getElementById(inputId).value.trim();if(!v)return;
  D[key].push(v);guardarServidor();poblar();renderAdmin();document.getElementById(inputId).value='';
}
function removeItem(key,i,listId){D[key].splice(i,1);guardarServidor();poblar();renderAdmin();}

function exportCSV(){
  const rows=["Fecha,Proyecto,Tarea,Encargado,Operario,Tarea Operario,Horas,Observaciones"];
  D.trabajos.forEach(t=>{t.operarios.forEach(o=>{rows.push(t.fecha+',"'+t.proyecto+'","'+t.tarea+'","'+t.encargado+'","'+o.operario+'","'+o.tarea+'",'+o.horas+',"'+(t.obs||'')+'"');});});
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([rows.join('\n')],{type:'text/csv'}));a.download='horas_proyectos.csv';a.click();
}

cargarDatos();
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
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"ok":true}');
      } catch(e) { res.writeHead(400); res.end('error'); }
    }); return;
  }

  res.writeHead(404); res.end('not found');
});

conectar().then(() => {
  server.listen(PORT, () => {
    console.log('Servidor Horas por Proyecto corriendo en puerto ' + PORT);
  });
});
