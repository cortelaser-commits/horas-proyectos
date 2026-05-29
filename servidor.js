const http = require('http');
const { MongoClient } = require('mongodb');

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || '';
const COL = 'horas_data';
const CLAVE = process.env.CLAVE || '2675';

let db = null;
let memData = null;

const OPERARIOS = ["Eduardo García","Carlos Sarassola","Leonardo Delgado","Milton Placeres","Victor Gallo","Alejandro Bentancur","Julio Saracho","Luciano Sarassola","Lucas Placeres","Cristian Sánchez","Enrique Avero","Santiago Da Silva","Sebastián Da Silva","Sergio Bornia","Carlos Gonzales","Maikel Bravo","Adrian Ramos","Octavio Bonnahon","Angel Barreto"];
const PROYECTOS = ["4476 - Cañerias para nuevo tk 520-521","4477 - Cinta para fechadores","4484 - Suplementos transportes L4","4487 - Prevencionista Barredor de Lodo","4509 - Trabajos varios planta Dairyco","4512 - Transferencias de cadenas transporte pallets","4518 - RETIRO Y GESTION DE RESIDUOS DE EMBALAJE","4519 - Reparacion tornillo sin fin Maquina de hielo","4526 - Instalacion de filtros en caneria de producto","4532 - Montaje de robot final de linea y transportadores","4533 - Armado de aireadores","4535 - Aspiracion chocolatada","4536 - Adicionales corrimiento caneria","4537 - Equipos Elevacion Tanques CIP","4538 - Hidrogrua para montaje de transportes Linea 8","4539 - Asistencia tecnica pruebas Inspector MIJO","4540 - Transportador Rechazo linea UHT","4541 - Trabajos varios planta Dairyco","4543 - Reparacion tornillo sin fin maquina hielo","4545 - Instalacion mecanica planta licor cacao Rev2","4546 - Descarga y montaje tanques sala jarabe Tetra Pack","4547 - Equipos de izaje montaje tanques sala jarabe","4548 - Descarga y montaje despaletizadora","4549 - Equipos de izaje montaje paletizadora y horno","4550 - Modificacion estanterias camara de frio","4551 - Materiales corrimiento canerias sala jarabe","4552 - Puente grua giratorio tostadora Neptuno","4553 - Prevencionista montaje Linea 8","4556 - Prevencionista montaje elaborador","4557 - Cambio de caneria purificadoras agua","4561 - Techo salida llenadora L8","4562 - Techo tapadora L8","4563 - Seguridad de horno y tapadora de L8","4573 - Montaje del tanque aseptico","4574 - Mantenimiento proceso de tostacion Radar","4579 - Montaje 2500 Gal y 500 Gal","4582 - Bandeja Resumidero","4584 - Desmontaje Centrifuga Alfa Laval","4585 - Instalacion TK500 501 502 SJ","4587 - Adicionales Pepsico","4589 - Soporteria Inoxidable Servicios L8","4590 - Ingenieria e Instalacion Servicios L8","4591 - Montaje Centrifugadora GEA","4593 - Deposito TK SJ y Oficina Krones","4595 - Instalacion SubCArb L4 L5","4596 - Mano de obra Plataforma y Canerias","4597 - Fabricacion Perfil Inoxidable","4598 - Escalera Plataforma L4","4599 - Modificacion Caneria Existente","4600 - Fabricacion Tornillo Sin Fin","4601 - Relevamiento Sala de Envasado y Silos","4602 - Trituradora de Plastico","4603 - Soldadura TIG 30 Piezas","4604 - Tolva Envasadora","4605 - Sistema recuperacion de Calor","4606 - Plataforma Pailas"];
const TAREAS = ["Soldadura","Corte","Armado","Pintura","Instalacion","Montaje","Piping","Supervision","Medicion","Mantenimiento","Ingenieria","Transporte"];

const DATA_INICIAL = { operarios: OPERARIOS, proyectos: PROYECTOS, tareas: TAREAS, trabajos: [] };

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
  try { await db.collection(COL).replaceOne({ _id: 'data' }, { _id: 'data', data, updatedAt: new Date() }, { upsert: true }); } catch(e) {}
}

function opts(arr) { return arr.map(x => `<option value="${x}">${x}</option>`).join(''); }

function buildHTML(data) {
  const opOpts = opts(data.operarios);
  const taOpts = opts(data.tareas);
  const dj = JSON.stringify(data).replace(/\\/g,'\\\\').replace(/<\/script>/gi,'<\\/script>');

return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Horas por Proyecto - Fischer Montajes</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css">
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#fff;--bg2:#f5f5f4;--bg3:#f0efed;--tx:#1a1a18;--tx2:#6b6b68;--bd:#d4d2ca;--sc:#3b6d11;--sbg:#eaf3de;--dc:#a32d2d;--ic:#185fa5;--ibg:#e6f1fb;--r:8px;--rl:12px}
@media(prefers-color-scheme:dark){:root{--bg:#1c1c1a;--bg2:#252523;--bg3:#2e2e2b;--tx:#f0ede8;--tx2:#9b9890;--bd:#3a3a37}}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg3);color:var(--tx);min-height:100vh}

/* LOGIN */
.login-screen{position:fixed;inset:0;background:#1a1a18;display:flex;align-items:center;justify-content:center;z-index:9999;flex-direction:column;gap:20px}
.login-box{background:#fff;border-radius:12px;padding:28px 32px;width:100%;max-width:320px;box-shadow:0 8px 32px rgba(0,0,0,.3)}
.login-title{font-size:14px;font-weight:600;color:#1a1a18;margin-bottom:12px}
.login-input{width:100%;height:44px;text-align:center;font-size:22px;letter-spacing:6px;border:1.5px solid #ddd;border-radius:8px;outline:none;color:#1a1a18;background:#f5f4f0}
.login-err{color:#a32d2d;font-size:12px;margin-top:8px;min-height:16px;text-align:center}
.login-btn{width:100%;height:42px;background:#1a1a18;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;margin-top:12px}

.hdr{background:var(--bg);border-bottom:0.5px solid var(--bd);padding:14px 16px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:100}
.hico{width:36px;height:36px;background:var(--tx);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--bg);font-size:18px;flex-shrink:0}
.tabs{display:flex;background:var(--bg);border-bottom:0.5px solid var(--bd);overflow-x:auto}
.tab{flex:1;min-width:80px;padding:12px 8px;font-size:13px;font-weight:500;text-align:center;cursor:pointer;border:none;background:none;color:var(--tx2);border-bottom:2px solid transparent;white-space:nowrap}
.tab.on{color:var(--tx);border-bottom:2px solid var(--tx)}
.pnl{display:none;padding:12px;max-width:700px;margin:0 auto}.pnl.on{display:block}
.crd{background:var(--bg);border:0.5px solid var(--bd);border-radius:var(--rl);padding:14px;margin-bottom:12px}
.ct{font-size:14px;font-weight:500;margin-bottom:12px;display:flex;align-items:center;gap:7px}
.fld{display:flex;flex-direction:column;gap:4px;margin-bottom:10px}
.fld label{font-size:12px;color:var(--tx2)}
.fld input,.fld select,.fld textarea{font-size:14px;padding:9px 11px;border:0.5px solid var(--bd);border-radius:var(--r);background:var(--bg);color:var(--tx);width:100%;-webkit-appearance:none}
.fg{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.btn{padding:9px 16px;border-radius:var(--r);font-size:13px;font-weight:500;cursor:pointer;border:0.5px solid var(--bd);background:var(--bg);color:var(--tx);display:inline-flex;align-items:center;gap:6px}
.btn:active{transform:scale(.97)}
.btn.p{background:var(--tx);color:var(--bg);border-color:var(--tx)}
.btn.d{color:var(--dc);border-color:transparent}
.btn.g{border-color:var(--ic);color:var(--ic)}
.br{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}

/* Buscador proyectos */
.proy-search{font-size:13px;padding:7px 10px;border:0.5px solid var(--bd);border-radius:var(--r);background:var(--bg);color:var(--tx);width:100%;margin-bottom:6px}

/* Operarios checkboxes */
.ops-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:6px;margin-bottom:10px}
.op-check{display:flex;align-items:center;gap:8px;padding:8px 10px;border:0.5px solid var(--bd);border-radius:var(--r);cursor:pointer;font-size:13px;background:var(--bg2)}
.op-check:hover{border-color:var(--ic)}
.op-check.sel{background:var(--ibg);border-color:var(--ic);color:var(--ic);font-weight:500}
.op-check input{display:none}
.same-hours{display:flex;align-items:center;gap:10px;margin-top:10px;padding:10px;background:var(--bg2);border-radius:var(--r)}
.same-hours label{font-size:13px;color:var(--tx2)}
.same-hours input{width:80px;font-size:15px;font-weight:600;padding:6px 8px;border:0.5px solid var(--bd);border-radius:var(--r);background:var(--bg);color:var(--tx);text-align:center}

/* tabla operarios individuales */
.otb{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px}
.otb th{text-align:left;padding:6px;font-weight:500;color:var(--tx2);border-bottom:0.5px solid var(--bd);font-size:12px}
.otb td{padding:5px 4px;border-bottom:0.5px solid var(--bd);vertical-align:middle}
.otb tr:last-child td{border-bottom:none}
.otb select,.otb input{font-size:13px;padding:6px 7px;border:0.5px solid var(--bd);border-radius:var(--r);background:var(--bg);color:var(--tx);width:100%}
.tbar{display:flex;justify-content:space-between;align-items:center;padding:9px 11px;background:var(--bg2);border-radius:var(--r);margin-top:10px;font-size:13px}
.ths{font-size:16px;font-weight:500}

/* modo tabs carga */
.modo-tabs{display:flex;gap:0;margin-bottom:12px;border:0.5px solid var(--bd);border-radius:var(--r);overflow:hidden}
.modo-tab{flex:1;padding:8px;font-size:13px;font-weight:500;cursor:pointer;border:none;background:var(--bg2);color:var(--tx2);text-align:center}
.modo-tab.on{background:var(--tx);color:var(--bg)}

.hcrd{background:var(--bg);border:0.5px solid var(--bd);border-radius:var(--r);padding:12px;margin-bottom:8px}
.hh{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px}
.hp{font-size:14px;font-weight:500}
.hm{font-size:12px;color:var(--tx2);margin-top:2px}
.hhs{font-size:20px;font-weight:500;text-align:right}
.hhl{font-size:11px;color:var(--tx2);text-align:right}
.ol{border-top:0.5px solid var(--bd);padding-top:8px;display:flex;flex-direction:column;gap:4px}
.or{display:flex;justify-content:space-between;font-size:12px;padding:2px 0}
.bdg{display:inline-block;font-size:11px;padding:2px 7px;border-radius:var(--r);background:var(--ibg);color:var(--ic)}
.sts{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:12px}
.st{background:var(--bg);border-radius:var(--r);padding:12px;border:0.5px solid var(--bd)}
.sl{font-size:12px;color:var(--tx2);margin-bottom:4px}
.sv{font-size:24px;font-weight:500}
.bw{margin-bottom:10px}
.bl{display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px}
.bb{height:5px;border-radius:3px;background:var(--bg2)}
.bf{height:5px;border-radius:3px;background:var(--tx)}
.alist{display:flex;flex-direction:column;gap:5px;margin-bottom:10px}
.ai{display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:var(--bg2);border-radius:var(--r);font-size:13px}
.ar{display:flex;gap:8px}
.ar input{flex:1;font-size:14px;padding:8px 10px;border:0.5px solid var(--bd);border-radius:var(--r);background:var(--bg);color:var(--tx)}
.ag{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.fb{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}
.fb select{font-size:13px;padding:7px 10px;border:0.5px solid var(--bd);border-radius:var(--r);background:var(--bg);color:var(--tx);-webkit-appearance:none;flex:1;min-width:120px}
.tst{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--sbg);border:0.5px solid var(--sc);color:var(--sc);border-radius:var(--r);padding:10px 18px;font-size:13px;display:none;align-items:center;gap:8px;z-index:999;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.15)}
.tst.on{display:flex}
.emp{text-align:center;padding:2rem;color:var(--tx2);font-size:14px}
@media(max-width:420px){.fg{grid-template-columns:1fr}.ag{grid-template-columns:1fr}.otb th:nth-child(2),.otb td:nth-child(2){display:none}}
</style>
</head>
<body>

<!-- LOGIN -->
<div class="login-screen" id="login-screen">
  <div style="text-align:center;color:#fff;margin-bottom:10px">
    <div style="font-size:32px;margin-bottom:8px"><i class="ti ti-clock"></i></div>
    <div style="font-size:20px;font-weight:700">Horas por Proyecto</div>
    <div style="font-size:13px;opacity:.5;margin-top:4px">Fischer Montajes</div>
  </div>
  <div class="login-box">
    <div class="login-title">Ingresá la clave de acceso</div>
    <input class="login-input" id="login-input" type="password" placeholder="••••" maxlength="20" onkeydown="if(event.key==='Enter')login()">
    <div class="login-err" id="login-err"></div>
    <button class="login-btn" onclick="login()">Ingresar →</button>
  </div>
</div>

<div id="app" style="display:none">
<div class="hdr">
  <div class="hico"><i class="ti ti-clock"></i></div>
  <div><div style="font-size:16px;font-weight:500">Horas por Proyecto</div><div style="font-size:12px;color:var(--tx2)">Fischer Montajes</div></div>
</div>
<div class="tabs">
  <button class="tab on" onclick="goTab('c',this)"><i class="ti ti-clock"></i> Cargar</button>
  <button class="tab" onclick="goTab('h',this)"><i class="ti ti-list"></i> Historial</button>
  <button class="tab" onclick="goTab('r',this)"><i class="ti ti-chart-bar"></i> Resumen</button>
  <button class="tab" onclick="goTab('a',this)"><i class="ti ti-settings"></i> Admin</button>
</div>
<div id="tst" class="tst"><i class="ti ti-check"></i><span id="tm"></span></div>

<!-- CARGAR -->
<div id="pnl-c" class="pnl on">
  <div class="crd">
    <div class="ct"><i class="ti ti-briefcase"></i> Datos del trabajo</div>
    <div class="fg">
      <div class="fld">
        <label>Proyecto / Presupuesto</label>
        <input type="text" id="proy-search" class="proy-search" placeholder="Buscar proyecto..." oninput="filtrarProyectos()" autocomplete="off">
        <select id="fp" size="1" style="display:none"></select>
        <div id="proy-list" style="border:0.5px solid var(--bd);border-radius:var(--r);background:var(--bg);max-height:200px;overflow-y:auto;display:none"></div>
        <input type="hidden" id="fp-val">
      </div>
      <div class="fld"><label>Tarea general</label><select id="ft"><option value="">— seleccionar —</option>${taOpts}</select></div>
      <div class="fld"><label>Fecha</label><input type="date" id="ff"></div>
      <div class="fld"><label>Cargado por</label><select id="fe"><option value="">— seleccionar —</option>${opOpts}</select></div>
    </div>
    <div class="fld"><label>Observaciones <span style="font-size:11px;color:var(--tx2)">(opcional)</span></label><input type="text" id="fo" placeholder="Detalle adicional..."></div>
  </div>

  <div class="crd">
    <div class="ct"><i class="ti ti-users"></i> Operarios en este trabajo</div>

    <div class="modo-tabs">
      <button class="modo-tab on" onclick="setModo('rapido',this)"><i class="ti ti-bolt"></i> Carga rápida (mismas horas)</button>
      <button class="modo-tab" onclick="setModo('individual',this)"><i class="ti ti-adjustments"></i> Horas individuales</button>
    </div>

    <!-- MODO RÁPIDO -->
    <div id="modo-rapido">
      <div style="font-size:12px;color:var(--tx2);margin-bottom:8px">Seleccioná los operarios que trabajaron las mismas horas:</div>
      <div class="ops-grid" id="ops-checks"></div>
      <div class="same-hours">
        <label>Horas para todos los seleccionados:</label>
        <input type="number" id="horas-comun" min="0.5" max="24" step="0.5" placeholder="8" oninput="calcT()">
        <span style="font-size:13px;color:var(--tx2)">hs</span>
      </div>
    </div>

    <!-- MODO INDIVIDUAL -->
    <div id="modo-individual" style="display:none">
      <table class="otb">
        <thead><tr><th>Operario</th><th>Tarea</th><th style="width:78px">Horas</th><th style="width:40px"></th></tr></thead>
        <tbody id="otb"></tbody>
      </table>
      <div style="margin-top:10px"><button class="btn g" onclick="addR()"><i class="ti ti-plus"></i> Agregar operario</button></div>
    </div>

    <div class="tbar"><span style="color:var(--tx2)">Total horas</span><span class="ths" id="tot">0 hs</span></div>
  </div>
  <div class="br">
    <button class="btn" onclick="limp()">Limpiar</button>
    <button class="btn p" onclick="guar()"><i class="ti ti-check"></i> Guardar trabajo</button>
  </div>
</div>

<!-- HISTORIAL -->
<div id="pnl-h" class="pnl">
  <div class="fb">
    <select id="flp" onchange="renderH()"><option value="">Todos los proyectos</option></select>
    <select id="flo" onchange="renderH()"><option value="">Todos los operarios</option></select>
  </div>
  <button class="btn" style="margin-bottom:10px;width:100%;justify-content:center" onclick="expCSV()"><i class="ti ti-download"></i> Exportar CSV</button>
  <div id="hl"></div>
</div>

<!-- RESUMEN -->
<div id="pnl-r" class="pnl">
  <div class="sts" id="sts"></div>
  <div class="crd"><div class="ct">Horas por proyecto</div><div id="rp"></div></div>
  <div class="crd"><div class="ct">Horas por operario</div><div id="ro"></div></div>
</div>

<!-- ADMIN -->
<div id="pnl-a" class="pnl">
  <div class="ag">
    <div class="crd">
      <div class="ct"><i class="ti ti-users"></i> Operarios</div>
      <div id="aop" class="alist"></div>
      <div class="ar"><input id="nop" placeholder="Nombre..." onkeydown="if(event.key==='Enter')addI('operarios','nop','aop')"><button class="btn p" onclick="addI('operarios','nop','aop')"><i class="ti ti-plus"></i></button></div>
    </div>
    <div class="crd">
      <div class="ct"><i class="ti ti-building"></i> Proyectos</div>
      <div id="apr" class="alist"></div>
      <div class="ar"><input id="npr" placeholder="N° / nombre..." onkeydown="if(event.key==='Enter')addI('proyectos','npr','apr')"><button class="btn p" onclick="addI('proyectos','npr','apr')"><i class="ti ti-plus"></i></button></div>
    </div>
  </div>
  <div class="crd">
    <div class="ct"><i class="ti ti-tool"></i> Tareas</div>
    <div id="ata" class="alist"></div>
    <div class="ar"><input id="nta" placeholder="Nombre de la tarea..." onkeydown="if(event.key==='Enter')addI('tareas','nta','ata')"><button class="btn p" onclick="addI('tareas','nta','ata')"><i class="ti ti-plus"></i></button></div>
  </div>
</div>
</div><!-- fin app -->

<script>
var D=${dj};
var rid=0;
var modo='rapido';
var proySeleccionado='';

// LOGIN
function login(){
  var c=document.getElementById('login-input').value;
  if(c==='${CLAVE}'){
    document.getElementById('login-screen').style.display='none';
    document.getElementById('app').style.display='block';
    sessionStorage.setItem('auth','ok');
    init();
  } else {
    document.getElementById('login-err').textContent='Clave incorrecta';
    document.getElementById('login-input').value='';
    setTimeout(function(){document.getElementById('login-err').textContent='';},2000);
  }
}
if(sessionStorage.getItem('auth')==='ok'){
  document.getElementById('login-screen').style.display='none';
  document.getElementById('app').style.display='block';
}

function init(){
  poblarChecks();
  document.getElementById('ff').value=new Date().toISOString().split('T')[0];
  addR();
}

function sync(){fetch('/data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(D)}).catch(function(){});}

function goTab(t,el){
  document.querySelectorAll('.tab').forEach(function(b){b.classList.remove('on')});
  document.querySelectorAll('.pnl').forEach(function(p){p.classList.remove('on')});
  el.classList.add('on');document.getElementById('pnl-'+t).classList.add('on');
  if(t==='h'){fillF();renderH();}if(t==='r')renderR();if(t==='a')renderA();
}

// BUSCADOR PROYECTOS
function filtrarProyectos(){
  var q=document.getElementById('proy-search').value.toLowerCase();
  var list=document.getElementById('proy-list');
  if(!q){list.style.display='none';proySeleccionado='';document.getElementById('fp-val').value='';calcT();return;}
  var filtered=D.proyectos.filter(function(p){return p.toLowerCase().includes(q);});
  if(!filtered.length){list.style.display='none';return;}
  list.style.display='block';
  list.innerHTML=filtered.map(function(p){
    return '<div onclick="selProy(\''+p.replace(/'/g,"\\'")+'\')" style="padding:8px 10px;cursor:pointer;font-size:13px;border-bottom:0.5px solid var(--bd)"onmouseover="this.style.background=\'var(--bg2)\'" onmouseout="this.style.background=\'var(--bg)\'">'+p+'</div>';
  }).join('');
}

function selProy(p){
  proySeleccionado=p;
  document.getElementById('proy-search').value=p;
  document.getElementById('fp-val').value=p;
  document.getElementById('proy-list').style.display='none';
}

// MODO CARGA
function setModo(m,el){
  modo=m;
  document.querySelectorAll('.modo-tab').forEach(function(b){b.classList.remove('on')});
  el.classList.add('on');
  document.getElementById('modo-rapido').style.display=m==='rapido'?'block':'none';
  document.getElementById('modo-individual').style.display=m==='individual'?'block':'none';
  calcT();
}

// CHECKBOXES OPERARIOS
function poblarChecks(){
  var cont=document.getElementById('ops-checks');
  cont.innerHTML=D.operarios.map(function(op){
    return '<label class="op-check" id="chk-'+op.replace(/[^a-z]/gi,'_')+'"><input type="checkbox" value="'+op+'" onchange="calcT()"><i class="ti ti-user"></i>'+op+'</label>';
  }).join('');
}

function calcT(){
  var t=0;
  if(modo==='rapido'){
    var hs=parseFloat(document.getElementById('horas-comun').value)||0;
    var sel=document.querySelectorAll('#ops-checks input:checked');
    t=hs*sel.length;
  } else {
    document.querySelectorAll('.hi').forEach(function(i){var v=parseFloat(i.value);if(!isNaN(v))t+=v;});
  }
  document.getElementById('tot').textContent=t.toFixed(1)+' hs';
}

function mkOE(list,sel){return list.map(function(x){return'<option value="'+x+'"'+(x===sel?' selected':'')+'>'+x+'</option>';}).join('');}

function addR(op,ta,hs){
  var id='r'+rid++;var tr=document.createElement('tr');tr.id=id;
  tr.innerHTML='<td><select class="os"><option value="">— operario —</option>'+mkOE(D.operarios,op)+'</select></td><td><select class="ts"><option value="">—</option>'+mkOE(D.tareas,ta)+'</select></td><td><input class="hi" type="number" min="0.5" max="24" step="0.5" value="'+(hs||'')+'" placeholder="0" oninput="calcT()" style="width:70px"></td><td><button class="btn d" onclick="document.getElementById(\''+id+'\').remove();calcT()" style="padding:4px 8px"><i class="ti ti-x"></i></button></td>';
  document.getElementById('otb').appendChild(tr);calcT();
}

function guar(){
  var pr=document.getElementById('fp-val').value||document.getElementById('proy-search').value;
  var ta=document.getElementById('ft').value;
  var fe=document.getElementById('ff').value;
  var en=document.getElementById('fe').value;
  var ob=document.getElementById('fo').value.trim();
  if(!pr||!ta||!fe||!en){alert('Completa todos los datos del trabajo.');return;}

  var ops=[];
  if(modo==='rapido'){
    var hs=parseFloat(document.getElementById('horas-comun').value)||0;
    if(!hs){alert('Ingresa las horas.');return;}
    var sels=document.querySelectorAll('#ops-checks input:checked');
    if(!sels.length){alert('Selecciona al menos un operario.');return;}
    sels.forEach(function(s){ops.push({operario:s.value,tarea:ta,horas:hs});});
  } else {
    var rows=document.querySelectorAll('#otb tr');var ok=true;
    rows.forEach(function(tr){
      var op=tr.querySelector('.os').value;
      var t=tr.querySelector('.ts').value;
      var h=parseFloat(tr.querySelector('.hi').value);
      if(!op||isNaN(h)||h<=0){ok=false;return;}
      ops.push({operario:op,tarea:t||ta,horas:h});
    });
    if(!ops.length){alert('Agrega al menos un operario.');return;}
    if(!ok){alert('Revisa que todos los operarios tengan horas.');return;}
  }

  D.trabajos.unshift({id:Date.now(),proyecto:pr,tarea:ta,fecha:fe,encargado:en,obs:ob,operarios:ops});
  sync();limp();
  toast('Trabajo guardado — '+ops.length+' operario'+(ops.length>1?'s':''));
}

function limp(){
  document.getElementById('proy-search').value='';
  document.getElementById('fp-val').value='';
  document.getElementById('proy-list').style.display='none';
  proySeleccionado='';
  document.getElementById('ft').value='';
  document.getElementById('fe').value='';
  document.getElementById('ff').value=new Date().toISOString().split('T')[0];
  document.getElementById('fo').value='';
  // reset checks
  document.querySelectorAll('#ops-checks input').forEach(function(c){
    c.checked=false;
    c.closest('label').classList.remove('sel');
  });
  document.getElementById('horas-comun').value='';
  // reset tabla individual
  document.getElementById('otb').innerHTML='';rid=0;addR();
  calcT();
}

// highlight checks on click
document.addEventListener('change',function(e){
  if(e.target.closest('.op-check')){
    e.target.closest('.op-check').classList.toggle('sel',e.target.checked);
    calcT();
  }
});

function toast(msg){var t=document.getElementById('tst');document.getElementById('tm').textContent=msg;t.classList.add('on');setTimeout(function(){t.classList.remove('on');},3000);}

function fillF(){
  var fp=document.getElementById('flp'),fo=document.getElementById('flo'),vp=fp.value,vo=fo.value;
  fp.innerHTML='<option value="">Todos los proyectos</option>'+D.proyectos.map(function(x){return'<option value="'+x+'">'+x+'</option>';}).join('');
  fo.innerHTML='<option value="">Todos los operarios</option>'+D.operarios.map(function(x){return'<option value="'+x+'">'+x+'</option>';}).join('');
  fp.value=vp;fo.value=vo;
}

function renderH(){
  var fP=document.getElementById('flp').value,fO=document.getElementById('flo').value;
  var tr=D.trabajos.filter(function(t){return(!fP||t.proyecto===fP)&&(!fO||t.operarios.find(function(o){return o.operario===fO;}));});
  var el=document.getElementById('hl');
  if(!tr.length){el.innerHTML='<div class="emp"><i class="ti ti-inbox"></i><br>Sin registros</div>';return;}
  el.innerHTML=tr.map(function(t){
    var tot=t.operarios.reduce(function(s,o){return s+o.horas;},0),p=t.fecha.split('-');
    return'<div class="hcrd"><div class="hh"><div><div class="hp">'+t.proyecto+'</div><div class="hm"><span class="bdg">'+t.tarea+'</span> &nbsp;'+p[2]+'/'+p[1]+'/'+p[0]+' &nbsp; por '+t.encargado+'</div>'+(t.obs?'<div style="font-size:12px;color:var(--tx2);margin-top:3px;font-style:italic">'+t.obs+'</div>':'')+'</div><div><div class="hhs">'+tot.toFixed(1)+'</div><div class="hhl">hs totales</div><button class="btn d" style="font-size:11px;padding:3px 8px;margin-top:6px" onclick="del('+t.id+')"><i class="ti ti-trash"></i></button></div></div><div class="ol">'+t.operarios.map(function(o){return'<div class="or"><span>'+o.operario+' <span style="color:var(--tx2)">— '+o.tarea+'</span></span><span style="font-weight:500">'+o.horas+' hs</span></div>';}).join('')+'</div></div>';
  }).join('');
}

function del(id){if(!confirm('Eliminar?'))return;D.trabajos=D.trabajos.filter(function(t){return t.id!==id;});sync();renderH();toast('Registro eliminado');}

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
  function rl(id,key){document.getElementById(id).innerHTML=D[key].length?D[key].map(function(x,i){return'<div class="ai"><span>'+x+'</span><button class="btn d" style="padding:3px 8px;font-size:11px" onclick="rmI(\''+key+'\','+i+')"><i class="ti ti-x"></i></button></div>';}).join(''):'<div style="color:var(--tx2);font-size:13px;padding:6px 0">Sin elementos</div>';}
  rl('aop','operarios');rl('apr','proyectos');rl('ata','tareas');
}

function addI(key,iid){var v=document.getElementById(iid).value.trim();if(!v)return;D[key].push(v);sync();poblarChecks();renderA();document.getElementById(iid).value='';}
function rmI(key,i){D[key].splice(i,1);sync();poblarChecks();renderA();}

function expCSV(){
  var rows=["Fecha,Proyecto,Tarea,Encargado,Operario,Tarea Operario,Horas,Observaciones"];
  D.trabajos.forEach(function(t){t.operarios.forEach(function(o){rows.push(t.fecha+',"'+t.proyecto+'","'+t.tarea+'","'+t.encargado+'","'+o.operario+'","'+o.tarea+'",'+o.horas+',"'+(t.obs||'')+'"');});});
  var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([rows.join('\\n')],{type:'text/csv'}));a.download='horas_fischer.csv';a.click();
}

// AUTO-INIT si ya autenticado
if(sessionStorage.getItem('auth')==='ok'){
  poblarChecks();
  document.getElementById('ff').value=new Date().toISOString().split('T')[0];
  addR();
}
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
  server.listen(PORT,()=>console.log('Servidor Horas Fischer Montajes - Puerto '+PORT));
});
