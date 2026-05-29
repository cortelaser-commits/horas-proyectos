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
const DATA_INICIAL = { operarios: OPERARIOS, proyectos: PROYECTOS, tareas: TAREAS, trabajos: [], favoritos: [], proyectosCerrados: [], limites: {} };

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
    memData = doc ? { ...DATA_INICIAL, ...doc.data } : JSON.parse(JSON.stringify(DATA_INICIAL));
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
  const dj = JSON.stringify({...data, favoritos: data.favoritos||[], proyectosCerrados: data.proyectosCerrados||[], limites: data.limites||{}})
    .replace(/\\/g,'\\\\').replace(/<\/script>/gi,'<\\/script>');

return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Horas por Proyecto - Fischer Montajes</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css">
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#fff;--bg2:#f5f5f4;--bg3:#f0efed;--tx:#1a1a18;--tx2:#6b6b68;--bd:#d4d2ca;--sc:#3b6d11;--sbg:#eaf3de;--dc:#a32d2d;--dbg:#fcebeb;--ic:#185fa5;--ibg:#e6f1fb;--wc:#7a4f00;--wbg:#fef3db;--r:8px;--rl:12px}
@media(prefers-color-scheme:dark){:root{--bg:#1c1c1a;--bg2:#252523;--bg3:#2e2e2b;--tx:#f0ede8;--tx2:#9b9890;--bd:#3a3a37}}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg3);color:var(--tx);min-height:100vh}
.login-screen{position:fixed;inset:0;background:#1a1a18;display:flex;align-items:center;justify-content:center;z-index:9999;flex-direction:column;gap:20px}
.login-box{background:#fff;border-radius:12px;padding:28px 32px;width:100%;max-width:320px;box-shadow:0 8px 32px rgba(0,0,0,.3)}
.hdr{background:var(--bg);border-bottom:0.5px solid var(--bd);padding:14px 16px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:100}
.hico{width:36px;height:36px;background:var(--tx);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--bg);font-size:18px;flex-shrink:0}
.tabs{display:flex;background:var(--bg);border-bottom:0.5px solid var(--bd);overflow-x:auto}
.tab{flex:1;min-width:70px;padding:11px 6px;font-size:12px;font-weight:500;text-align:center;cursor:pointer;border:none;background:none;color:var(--tx2);border-bottom:2px solid transparent;white-space:nowrap}
.tab.on{color:var(--tx);border-bottom:2px solid var(--tx)}
.pnl{display:none;padding:12px;max-width:720px;margin:0 auto}.pnl.on{display:block}
.crd{background:var(--bg);border:0.5px solid var(--bd);border-radius:var(--rl);padding:14px;margin-bottom:12px}
.ct{font-size:14px;font-weight:500;margin-bottom:12px;display:flex;align-items:center;gap:7px}
.fld{display:flex;flex-direction:column;gap:4px;margin-bottom:10px}
.fld label{font-size:12px;color:var(--tx2)}
.fld input,.fld select{font-size:14px;padding:9px 11px;border:0.5px solid var(--bd);border-radius:var(--r);background:var(--bg);color:var(--tx);width:100%;-webkit-appearance:none}
.fg{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.btn{padding:9px 16px;border-radius:var(--r);font-size:13px;font-weight:500;cursor:pointer;border:0.5px solid var(--bd);background:var(--bg);color:var(--tx);display:inline-flex;align-items:center;gap:6px}
.btn:active{transform:scale(.97)}
.btn.p{background:var(--tx);color:var(--bg);border-color:var(--tx)}
.btn.d{color:var(--dc);border-color:transparent}
.btn.g{border-color:var(--ic);color:var(--ic)}
.btn.w{border-color:var(--wc);color:var(--wc)}
.br{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}
/* Buscador proyectos */
.proy-wrap{position:relative}
.proy-drop{position:absolute;top:100%;left:0;right:0;border:0.5px solid var(--bd);border-radius:var(--r);background:var(--bg);max-height:220px;overflow-y:auto;z-index:50;box-shadow:0 4px 12px rgba(0,0,0,.1);display:none}
.proy-item{padding:9px 11px;cursor:pointer;font-size:13px;border-bottom:0.5px solid var(--bd);display:flex;align-items:center;gap:6px}
.proy-item:last-child{border-bottom:none}
.proy-item:hover{background:var(--bg2)}
.proy-item.fav{color:var(--wc)}
.fav-star{cursor:pointer;padding:2px 4px;border-radius:4px;font-size:14px}
.fav-star:hover{background:var(--wbg)}
/* Operarios checks */
.ops-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:6px;margin-bottom:10px}
.op-check{display:flex;align-items:center;gap:7px;padding:8px 10px;border:0.5px solid var(--bd);border-radius:var(--r);cursor:pointer;font-size:13px;background:var(--bg2);transition:all .15s}
.op-check:hover{border-color:var(--ic)}
.op-check.sel{background:var(--ibg);border-color:var(--ic);color:var(--ic);font-weight:500}
.op-check input{display:none}
.same-hours{display:flex;align-items:center;gap:10px;margin-top:10px;padding:10px;background:var(--bg2);border-radius:var(--r);flex-wrap:wrap}
.same-hours label{font-size:13px;color:var(--tx2)}
.same-hours input{width:75px;font-size:15px;font-weight:600;padding:6px 8px;border:0.5px solid var(--bd);border-radius:var(--r);background:var(--bg);color:var(--tx);text-align:center}
.date-btns{display:flex;gap:6px;margin-top:6px}
.date-btn{flex:1;padding:6px;border-radius:var(--r);font-size:12px;font-weight:500;cursor:pointer;border:0.5px solid var(--bd);background:var(--bg2);color:var(--tx2);text-align:center}
.date-btn.on{background:var(--tx);color:var(--bg);border-color:var(--tx)}
/* Tabla individual */
.otb{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px}
.otb th{text-align:left;padding:6px;font-weight:500;color:var(--tx2);border-bottom:0.5px solid var(--bd);font-size:12px}
.otb td{padding:5px 4px;border-bottom:0.5px solid var(--bd);vertical-align:middle}
.otb tr:last-child td{border-bottom:none}
.otb select,.otb input{font-size:13px;padding:6px 7px;border:0.5px solid var(--bd);border-radius:var(--r);background:var(--bg);color:var(--tx);width:100%}
.tbar{display:flex;justify-content:space-between;align-items:center;padding:9px 11px;background:var(--bg2);border-radius:var(--r);margin-top:10px;font-size:13px}
.ths{font-size:16px;font-weight:500}
.modo-tabs{display:flex;gap:0;margin-bottom:12px;border:0.5px solid var(--bd);border-radius:var(--r);overflow:hidden}
.modo-tab{flex:1;padding:8px;font-size:12px;font-weight:500;cursor:pointer;border:none;background:var(--bg2);color:var(--tx2);text-align:center}
.modo-tab.on{background:var(--tx);color:var(--bg)}
/* Historial */
.hcrd{background:var(--bg);border:0.5px solid var(--bd);border-radius:var(--r);padding:12px;margin-bottom:8px}
.hh{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px}
.hp{font-size:14px;font-weight:500}
.hm{font-size:12px;color:var(--tx2);margin-top:2px}
.hhs{font-size:20px;font-weight:500;text-align:right}
.hhl{font-size:11px;color:var(--tx2);text-align:right}
.ol{border-top:0.5px solid var(--bd);padding-top:8px;display:flex;flex-direction:column;gap:4px}
.or{display:flex;justify-content:space-between;font-size:12px;padding:2px 0}
.bdg{display:inline-block;font-size:11px;padding:2px 7px;border-radius:var(--r);background:var(--ibg);color:var(--ic)}
/* Resumen */
.sts{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:12px}
.st{background:var(--bg);border-radius:var(--r);padding:12px;border:0.5px solid var(--bd)}
.sl{font-size:12px;color:var(--tx2);margin-bottom:4px}
.sv{font-size:24px;font-weight:500}
.bw{margin-bottom:10px}
.bl{display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px}
.bb{height:5px;border-radius:3px;background:var(--bg2)}
.bf{height:5px;border-radius:3px;background:var(--tx)}
.blim{height:5px;border-radius:3px;background:var(--dc)}
/* Semanas */
.semana-tabs{display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap}
.semana-tab{padding:6px 12px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;border:0.5px solid var(--bd);background:var(--bg2);color:var(--tx2)}
.semana-tab.on{background:var(--tx);color:var(--bg);border-color:var(--tx)}
/* Admin */
.alist{display:flex;flex-direction:column;gap:5px;margin-bottom:10px}
.ai{display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:var(--bg2);border-radius:var(--r);font-size:13px;gap:6px}
.ai-lim{display:flex;align-items:center;gap:6px;font-size:12px}
.ai-lim input{width:70px;padding:4px 6px;border:0.5px solid var(--bd);border-radius:var(--r);background:var(--bg);color:var(--tx);font-size:12px}
.ar{display:flex;gap:8px}
.ar input{flex:1;font-size:14px;padding:8px 10px;border:0.5px solid var(--bd);border-radius:var(--r);background:var(--bg);color:var(--tx)}
.ag{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.fb{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}
.fb select,.fb input{font-size:13px;padding:7px 10px;border:0.5px solid var(--bd);border-radius:var(--r);background:var(--bg);color:var(--tx);-webkit-appearance:none;flex:1;min-width:120px}
.tst{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--sbg);border:0.5px solid var(--sc);color:var(--sc);border-radius:var(--r);padding:10px 18px;font-size:13px;display:none;align-items:center;gap:8px;z-index:999;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.15)}
.tst.on{display:flex}
.emp{text-align:center;padding:2rem;color:var(--tx2);font-size:14px}
.warn-bar{background:var(--wbg);border:0.5px solid var(--wc);color:var(--wc);border-radius:var(--r);padding:8px 12px;font-size:12px;margin-bottom:8px;display:flex;align-items:center;gap:6px}
@media(max-width:420px){.fg{grid-template-columns:1fr}.ag{grid-template-columns:1fr}}
</style>
</head>
<body>

<div class="login-screen" id="login-screen">
  <div style="text-align:center;color:#fff;margin-bottom:10px">
    <div style="font-size:32px;margin-bottom:8px"><i class="ti ti-clock"></i></div>
    <div style="font-size:20px;font-weight:700">Horas por Proyecto</div>
    <div style="font-size:13px;opacity:.5;margin-top:4px">Fischer Montajes</div>
  </div>
  <div class="login-box">
    <div style="font-size:14px;font-weight:600;color:#1a1a18;margin-bottom:12px">Ingresá la clave de acceso</div>
    <input id="login-input" type="password" placeholder="••••" maxlength="20"
      style="width:100%;height:44px;text-align:center;font-size:22px;letter-spacing:6px;border:1.5px solid #ddd;border-radius:8px;outline:none;color:#1a1a18;background:#f5f4f0"
      onkeydown="if(event.key==='Enter')login()">
    <div id="login-err" style="color:#a32d2d;font-size:12px;margin-top:8px;min-height:16px;text-align:center"></div>
    <button onclick="login()" style="width:100%;height:42px;background:#1a1a18;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;margin-top:12px">Ingresar →</button>
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
  <button class="tab" onclick="goTab('s',this)"><i class="ti ti-calendar-week"></i> Semana</button>
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
        <div class="proy-wrap">
          <input type="text" id="proy-search" placeholder="Buscar proyecto..." oninput="filtrarProyectos()" autocomplete="off"
            style="font-size:14px;padding:9px 11px;border:0.5px solid var(--bd);border-radius:var(--r);background:var(--bg);color:var(--tx);width:100%">
          <div id="proy-drop" class="proy-drop"></div>
        </div>
        <input type="hidden" id="fp-val">
      </div>
      <div class="fld"><label>Tarea general</label><select id="ft"><option value="">— seleccionar —</option>${taOpts}</select></div>
      <div class="fld">
        <label>Fecha</label>
        <input type="date" id="ff">
        <div class="date-btns">
          <div class="date-btn on" id="btn-hoy" onclick="setFecha(0)">Hoy</div>
          <div class="date-btn" id="btn-ayer" onclick="setFecha(-1)">Ayer</div>
          <div class="date-btn" id="btn-ante" onclick="setFecha(-2)">Antes de ayer</div>
        </div>
      </div>
      <div class="fld"><label>Cargado por</label><select id="fe"><option value="">— seleccionar —</option>${opOpts}</select></div>
    </div>
    <div class="fld"><label>Observaciones <span style="font-size:11px;color:var(--tx2)">(opcional)</span></label>
      <input type="text" id="fo" placeholder="Detalle adicional..."></div>
  </div>

  <div class="crd">
    <div class="ct"><i class="ti ti-users"></i> Operarios en este trabajo</div>
    <div class="modo-tabs">
      <button class="modo-tab on" onclick="setModo('rapido',this)"><i class="ti ti-bolt"></i> Mismas horas para todos</button>
      <button class="modo-tab" onclick="setModo('individual',this)"><i class="ti ti-adjustments"></i> Horas individuales</button>
    </div>
    <div id="modo-rapido">
      <div style="font-size:12px;color:var(--tx2);margin-bottom:8px">Seleccioná los operarios:</div>
      <div class="ops-grid" id="ops-checks"></div>
      <div class="same-hours">
        <label>Horas para todos:</label>
        <input type="number" id="horas-comun" min="0.5" max="24" step="0.5" placeholder="8" oninput="calcT()">
        <span style="font-size:13px;color:var(--tx2)">hs</span>
      </div>
    </div>
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
  <div class="crd"><div class="ct">Horas por proyecto <span style="font-size:11px;color:var(--tx2);font-weight:normal">(barra roja = superó límite)</span></div><div id="rp"></div></div>
  <div class="crd"><div class="ct">Operarios — horas este mes</div><div id="ro"></div></div>
  <div id="op-sin-carga" style="display:none"></div>
</div>

<!-- SEMANA -->
<div id="pnl-s" class="pnl">
  <div class="semana-tabs" id="semana-tabs"></div>
  <div id="semana-content"></div>
</div>

<!-- ADMIN -->
<div id="pnl-a" class="pnl">
  <div class="ag">
    <div class="crd">
      <div class="ct"><i class="ti ti-users"></i> Operarios</div>
      <div id="aop" class="alist"></div>
      <div class="ar"><input id="nop" placeholder="Nombre..." onkeydown="if(event.key==='Enter')addI('operarios','nop')"><button class="btn p" onclick="addI('operarios','nop')"><i class="ti ti-plus"></i></button></div>
    </div>
    <div class="crd">
      <div class="ct"><i class="ti ti-building"></i> Proyectos</div>
      <div id="apr" class="alist"></div>
      <div class="ar"><input id="npr" placeholder="N° / nombre..." onkeydown="if(event.key==='Enter')addI('proyectos','npr')"><button class="btn p" onclick="addI('proyectos','npr')"><i class="ti ti-plus"></i></button></div>
    </div>
  </div>
  <div class="crd">
    <div class="ct"><i class="ti ti-tool"></i> Tareas</div>
    <div id="ata" class="alist"></div>
    <div class="ar"><input id="nta" placeholder="Nombre de la tarea..." onkeydown="if(event.key==='Enter')addI('tareas','nta')"><button class="btn p" onclick="addI('tareas','nta')"><i class="ti ti-plus"></i></button></div>
  </div>
  <div class="crd">
    <div class="ct"><i class="ti ti-target"></i> Límite de horas por proyecto</div>
    <div style="font-size:12px;color:var(--tx2);margin-bottom:10px">Asigná un tope de horas presupuestadas por proyecto. Se verá en el resumen.</div>
    <div id="lim-list"></div>
  </div>
</div>
</div>

<script>
var D=${dj};
var rid=0,modo='rapido';
D.favoritos=D.favoritos||[];
D.proyectosCerrados=D.proyectosCerrados||[];
D.limites=D.limites||{};

function login(){
  var c=document.getElementById('login-input').value;
  if(c==='${CLAVE}'){
    document.getElementById('login-screen').style.display='none';
    document.getElementById('app').style.display='block';
    sessionStorage.setItem('auth','ok');
    appInit();
  } else {
    document.getElementById('login-err').textContent='Clave incorrecta';
    document.getElementById('login-input').value='';
    setTimeout(function(){document.getElementById('login-err').textContent='';},2000);
  }
}
if(sessionStorage.getItem('auth')==='ok'){
  document.getElementById('login-screen').style.display='none';
  document.getElementById('app').style.display='block';
  setTimeout(appInit,50);
}

function appInit(){
  poblarChecks();
  setFecha(0);
  addR();
  // restaurar último operario
  var ul=localStorage.getItem('ultimo_enc');
  if(ul){var sel=document.getElementById('fe');for(var i=0;i<sel.options.length;i++){if(sel.options[i].value===ul){sel.value=ul;break;}}}
}

function sync(){fetch('/data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(D)}).catch(function(){});}

function goTab(t,el){
  document.querySelectorAll('.tab').forEach(function(b){b.classList.remove('on')});
  document.querySelectorAll('.pnl').forEach(function(p){p.classList.remove('on')});
  el.classList.add('on');document.getElementById('pnl-'+t).classList.add('on');
  if(t==='h'){fillF();renderH();}
  if(t==='r')renderR();
  if(t==='s')renderSemana();
  if(t==='a')renderA();
}

// FECHAS
function setFecha(delta){
  var d=new Date();d.setDate(d.getDate()+delta);
  document.getElementById('ff').value=d.toISOString().split('T')[0];
  ['btn-hoy','btn-ayer','btn-ante'].forEach(function(id,i){
    document.getElementById(id).classList.toggle('on',i===-delta);
  });
}
document.getElementById('ff').addEventListener('change',function(){
  ['btn-hoy','btn-ayer','btn-ante'].forEach(function(id){document.getElementById(id).classList.remove('on');});
});

// BUSCADOR PROYECTOS
function proyectosOrdenados(){
  var activos=D.proyectos.filter(function(p){return!(D.proyectosCerrados||[]).includes(p);});
  var cerrados=D.proyectos.filter(function(p){return(D.proyectosCerrados||[]).includes(p);});
  var favs=(D.favoritos||[]).filter(function(p){return activos.includes(p);});
  var otros=activos.filter(function(p){return!favs.includes(p);});
  return {favs:favs,otros:otros,cerrados:cerrados};
}

function filtrarProyectos(){
  var q=document.getElementById('proy-search').value.toLowerCase().trim();
  var drop=document.getElementById('proy-drop');
  if(!q){drop.style.display='none';document.getElementById('fp-val').value='';calcT();return;}
  var po=proyectosOrdenados();
  var all=[...po.favs,...po.otros,...po.cerrados];
  var filtered=all.filter(function(p){return p.toLowerCase().includes(q);});
  if(!filtered.length){drop.style.display='none';return;}
  drop.style.display='block';
  drop.innerHTML=filtered.map(function(p){
    var isFav=(D.favoritos||[]).includes(p);
    var isCerrado=(D.proyectosCerrados||[]).includes(p);
    var estiloExtra=isCerrado?'opacity:.5':'';
    return '<div class="proy-item" style="'+estiloExtra+'" onclick="selProy(\''+p.replace(/\\/g,'\\\\').replace(/'/g,"\\'")+'\')">'+
      '<span class="fav-star" onclick="event.stopPropagation();toggleFav(\''+p.replace(/\\/g,'\\\\').replace(/'/g,"\\'")+'\');filtrarProyectos()" title="'+(isFav?'Quitar favorito':'Marcar favorito')+'">'+(isFav?'⭐':'☆')+'</span>'+
      '<span style="flex:1">'+p+(isCerrado?' <span style="font-size:10px;color:var(--tx2)">[cerrado]</span>':'')+'</span>'+
    '</div>';
  }).join('');
}

function selProy(p){
  document.getElementById('proy-search').value=p;
  document.getElementById('fp-val').value=p;
  document.getElementById('proy-drop').style.display='none';
  // alerta si supera límite
  var lim=D.limites[p];
  if(lim){
    var hsP=D.trabajos.filter(function(t){return t.proyecto===p;}).reduce(function(s,t){return s+t.operarios.reduce(function(ss,o){return ss+o.horas;},0);},0);
    if(hsP>=lim) toast('⚠️ Proyecto '+p.split(' - ')[0]+' ya superó las '+lim+' hs presupuestadas');
  }
}

document.addEventListener('click',function(e){
  if(!e.target.closest('.proy-wrap')) document.getElementById('proy-drop').style.display='none';
});

function toggleFav(p){
  var favs=D.favoritos||[];
  var idx=favs.indexOf(p);
  if(idx>=0) favs.splice(idx,1); else favs.push(p);
  D.favoritos=favs;sync();
}

// MODO
function setModo(m,el){
  modo=m;
  document.querySelectorAll('.modo-tab').forEach(function(b){b.classList.remove('on')});
  el.classList.add('on');
  document.getElementById('modo-rapido').style.display=m==='rapido'?'block':'none';
  document.getElementById('modo-individual').style.display=m==='individual'?'block':'none';
  calcT();
}

// OPERARIOS CHECKS
function poblarChecks(){
  var cont=document.getElementById('ops-checks');
  if(!cont)return;
  cont.innerHTML=D.operarios.map(function(op){
    var sid='chk_'+op.replace(/[^a-zA-Z0-9]/g,'_');
    return '<label class="op-check" id="'+sid+'"><input type="checkbox" value="'+op+'" onchange="onCheck(this)"><i class="ti ti-user" style="font-size:14px"></i>'+op+'</label>';
  }).join('');
}

function onCheck(inp){
  inp.closest('label').classList.toggle('sel',inp.checked);
  calcT();
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
  var pr=document.getElementById('fp-val').value||document.getElementById('proy-search').value.trim();
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
    var rows=document.querySelectorAll('#otb tr'),ok=true;
    rows.forEach(function(tr){
      var op=tr.querySelector('.os').value,t=tr.querySelector('.ts').value,h=parseFloat(tr.querySelector('.hi').value);
      if(!op||isNaN(h)||h<=0){ok=false;return;}
      ops.push({operario:op,tarea:t||ta,horas:h});
    });
    if(!ops.length){alert('Agrega al menos un operario.');return;}
    if(!ok){alert('Revisa que todos los operarios tengan horas.');return;}
  }
  // guardar último encargado
  localStorage.setItem('ultimo_enc',en);
  D.trabajos.unshift({id:Date.now(),proyecto:pr,tarea:ta,fecha:fe,encargado:en,obs:ob,operarios:ops});
  sync();limp();
  toast('Guardado — '+ops.length+' operario'+(ops.length>1?'s':''));
}

function limp(){
  document.getElementById('proy-search').value='';
  document.getElementById('fp-val').value='';
  document.getElementById('proy-drop').style.display='none';
  document.getElementById('ft').value='';
  document.getElementById('fo').value='';
  setFecha(0);
  document.querySelectorAll('#ops-checks input').forEach(function(c){c.checked=false;c.closest('label').classList.remove('sel');});
  document.getElementById('horas-comun').value='';
  document.getElementById('otb').innerHTML='';rid=0;addR();
  calcT();
}

function toast(msg){var t=document.getElementById('tst');document.getElementById('tm').textContent=msg;t.classList.add('on');setTimeout(function(){t.classList.remove('on');},3000);}

// HISTORIAL
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

// RESUMEN
function renderR(){
  var tot=D.trabajos.reduce(function(s,t){return s+t.operarios.reduce(function(ss,o){return ss+o.horas;},0);},0);
  var mes=new Date().toISOString().slice(0,7);
  var hm=D.trabajos.filter(function(t){return t.fecha.startsWith(mes);}).reduce(function(s,t){return s+t.operarios.reduce(function(ss,o){return ss+o.horas;},0);},0);
  document.getElementById('sts').innerHTML='<div class="st"><div class="sl">Total horas</div><div class="sv">'+tot.toFixed(1)+'</div></div><div class="st"><div class="sl">Este mes</div><div class="sv">'+hm.toFixed(1)+'</div></div><div class="st"><div class="sl">Trabajos</div><div class="sv">'+D.trabajos.length+'</div></div><div class="st"><div class="sl">Proyectos activos</div><div class="sv">'+new Set(D.trabajos.map(function(t){return t.proyecto;})).size+'</div></div>';
  // Por proyecto con límites
  var byP={};D.trabajos.forEach(function(t){t.operarios.forEach(function(o){byP[t.proyecto]=(byP[t.proyecto]||0)+o.horas;});});
  var mP=Math.max.apply(null,Object.values(byP).concat(Object.values(D.limites||{})).concat([1]));
  document.getElementById('rp').innerHTML=Object.keys(byP).length?Object.entries(byP).sort(function(a,b){return b[1]-a[1];}).map(function(e){
    var lim=D.limites[e[0]];
    var pct=(e[1]/mP*100).toFixed(1);
    var limPct=lim?(lim/mP*100).toFixed(1):null;
    var superado=lim&&e[1]>lim;
    return'<div class="bw"><div class="bl"><span>'+e[0]+(superado?'<span style="color:var(--dc);font-size:10px;margin-left:4px">⚠️ +' + (e[1]-lim).toFixed(1)+'hs</span>':'')+'</span><span style="font-weight:500">'+e[1].toFixed(1)+(lim?' / '+lim:'')+'  hs</span></div><div class="bb" style="position:relative"><div class="bf" style="width:'+pct+'%;background:'+(superado?'var(--dc)':'var(--tx)')+'"></div>'+(limPct?'<div style="position:absolute;top:0;left:'+limPct+'%;width:2px;height:100%;background:var(--wc)"></div>':'')+'</div></div>';
  }).join(''):'<div class="emp">Sin datos</div>';
  // Por operario este mes + alerta sin carga
  var byO={};
  D.trabajos.filter(function(t){return t.fecha.startsWith(mes);}).forEach(function(t){t.operarios.forEach(function(o){byO[o.operario]=(byO[o.operario]||0)+o.horas;});});
  var mO=Math.max.apply(null,Object.values(byO).concat([1]));
  document.getElementById('ro').innerHTML=Object.keys(byO).length?Object.entries(byO).sort(function(a,b){return b[1]-a[1];}).map(function(e){return'<div class="bw"><div class="bl"><span>'+e[0]+'</span><span style="font-weight:500">'+e[1].toFixed(1)+' hs</span></div><div class="bb"><div class="bf" style="width:'+(e[1]/mO*100).toFixed(1)+'%"></div></div></div>';}).join(''):'<div class="emp">Sin datos este mes</div>';
  // Operarios sin carga este mes
  var sinCarga=D.operarios.filter(function(op){return!byO[op];});
  var sc=document.getElementById('op-sin-carga');
  if(sinCarga.length){
    sc.style.display='block';
    sc.innerHTML='<div class="warn-bar"><i class="ti ti-alert-triangle"></i> Sin horas cargadas este mes: '+sinCarga.join(', ')+'</div>';
  } else sc.style.display='none';
}

// SEMANA
function getSemanas(){
  var semanas=[];
  var hoy=new Date();
  for(var i=0;i<5;i++){
    var d=new Date(hoy);d.setDate(d.getDate()-i*7);
    var lunes=new Date(d);lunes.setDate(d.getDate()-((d.getDay()+6)%7));
    var viernes=new Date(lunes);viernes.setDate(lunes.getDate()+4);
    var desde=lunes.toISOString().split('T')[0];
    var hasta=viernes.toISOString().split('T')[0];
    var label=i===0?'Esta semana':i===1?'Semana pasada':desde.slice(8)+'/'+desde.slice(5,7);
    semanas.push({desde:desde,hasta:hasta,label:label});
  }
  return semanas;
}

var semanaActual=0;
function renderSemana(){
  var semanas=getSemanas();
  var tabs=document.getElementById('semana-tabs');
  tabs.innerHTML=semanas.map(function(s,i){return'<div class="semana-tab'+(i===semanaActual?' on':'')+'" onclick="semanaActual='+i+';renderSemana()">'+s.label+'</div>';}).join('');
  var sem=semanas[semanaActual];
  var trabajos=D.trabajos.filter(function(t){return t.fecha>=sem.desde&&t.fecha<=sem.hasta;});
  var byOp={};
  trabajos.forEach(function(t){t.operarios.forEach(function(o){byOp[o.operario]=(byOp[o.operario]||0)+o.horas;});});
  var totSem=Object.values(byOp).reduce(function(s,v){return s+v;},0);
  var cont=document.getElementById('semana-content');
  if(!trabajos.length){cont.innerHTML='<div class="emp"><i class="ti ti-calendar"></i><br>Sin registros esta semana</div>';return;}
  cont.innerHTML='<div class="crd"><div class="ct">Total semana: <strong>'+totSem.toFixed(1)+' hs</strong></div>'+
    Object.entries(byOp).sort(function(a,b){return b[1]-a[1];}).map(function(e){
      return'<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:0.5px solid var(--bd);font-size:13px"><span>'+e[0]+'</span><span style="font-weight:500">'+e[1].toFixed(1)+' hs</span></div>';
    }).join('')+'</div>'+
    '<div class="crd"><div class="ct">Detalle por proyecto</div>'+
    trabajos.map(function(t){
      var tot=t.operarios.reduce(function(s,o){return s+o.horas;},0);
      var p=t.fecha.split('-');
      return'<div style="padding:8px 0;border-bottom:0.5px solid var(--bd)"><div style="font-size:13px;font-weight:500">'+t.proyecto+'</div><div style="font-size:12px;color:var(--tx2)">'+p[2]+'/'+p[1]+' · '+t.tarea+' · '+tot.toFixed(1)+' hs</div><div style="font-size:12px;color:var(--tx2);margin-top:3px">'+t.operarios.map(function(o){return o.operario+' ('+o.horas+'hs)';}).join(', ')+'</div></div>';
    }).join('')+'</div>';
}

// ADMIN
function renderA(){
  function rl(id,key){
    document.getElementById(id).innerHTML=D[key].length?D[key].map(function(x,i){
      var isFav=(D.favoritos||[]).includes(x);
      var isCerrado=(D.proyectosCerrados||[]).includes(x);
      var extra=key==='proyectos'?
        '<button class="btn '+(isFav?'w':'g')+'" style="padding:3px 7px;font-size:11px" onclick="toggleFav(\''+x.replace(/'/g,"\\'")+'\')" title="Favorito">'+(isFav?'⭐':'☆')+'</button>'+
        '<button class="btn" style="padding:3px 7px;font-size:11px" onclick="toggleCerrado(\''+x.replace(/'/g,"\\'")+'\')" title="'+(isCerrado?'Reabrir':'Cerrar')+'">'+(isCerrado?'🔓':'🔒')+'</button>':'';
      return'<div class="ai" style="'+(isCerrado?'opacity:.5':'')+'"><span style="flex:1;font-size:13px">'+x+'</span>'+extra+'<button class="btn d" style="padding:3px 8px;font-size:11px" onclick="rmI(\''+key+'\','+i+')"><i class="ti ti-x"></i></button></div>';
    }).join(''):'<div style="color:var(--tx2);font-size:13px;padding:6px 0">Sin elementos</div>';
  }
  rl('aop','operarios');rl('apr','proyectos');rl('ata','tareas');
  // Límites
  var limHtml=D.proyectos.filter(function(p){return!(D.proyectosCerrados||[]).includes(p);}).map(function(p){
    var val=D.limites[p]||'';
    return'<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:0.5px solid var(--bd);font-size:13px"><span style="flex:1">'+p+'</span><input type="number" min="0" step="1" value="'+val+'" placeholder="sin límite" onchange="setLimite(\''+p.replace(/'/g,"\\'")+'\',this.value)" style="width:90px;padding:4px 8px;border:0.5px solid var(--bd);border-radius:var(--r);font-size:12px;background:var(--bg);color:var(--tx)"><span style="font-size:11px;color:var(--tx2)">hs</span></div>';
  }).join('');
  document.getElementById('lim-list').innerHTML=limHtml||'<div class="emp">Sin proyectos activos</div>';
}

function toggleCerrado(p){
  var idx=(D.proyectosCerrados||[]).indexOf(p);
  if(idx>=0) D.proyectosCerrados.splice(idx,1); else {D.proyectosCerrados=D.proyectosCerrados||[];D.proyectosCerrados.push(p);}
  sync();renderA();toast(idx>=0?'Proyecto reabierto':'Proyecto cerrado');
}

function setLimite(p,v){
  var n=parseFloat(v)||0;
  if(n>0) D.limites[p]=n; else delete D.limites[p];
  sync();
}

function addI(key,iid){var v=document.getElementById(iid).value.trim();if(!v)return;D[key].push(v);sync();poblarChecks();renderA();document.getElementById(iid).value='';}
function rmI(key,i){D[key].splice(i,1);sync();poblarChecks();renderA();}

function expCSV(){
  var rows=["Fecha,Proyecto,Tarea,Encargado,Operario,Tarea Operario,Horas,Observaciones"];
  D.trabajos.forEach(function(t){t.operarios.forEach(function(o){rows.push(t.fecha+',"'+t.proyecto+'","'+t.tarea+'","'+t.encargado+'","'+o.operario+'","'+o.tarea+'",'+o.horas+',"'+(t.obs||'')+'"');});});
  var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([rows.join('\\n')],{type:'text/csv'}));a.download='horas_fischer.csv';a.click();
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
  if(req.method==='GET'&&req.url==='/'){
    const data=await leerData();
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
    res.end(buildHTML(data));return;
  }
  if(req.method==='POST'&&req.url==='/data'){
    let body='';req.on('data',c=>body+=c);
    req.on('end',async()=>{
      try{const data=JSON.parse(body);await guardarData(data);res.writeHead(200);res.end('{"ok":true}');}
      catch(e){res.writeHead(400);res.end('error');}
    });return;
  }
  res.writeHead(404);res.end('not found');
});

conectar().then(()=>{server.listen(PORT,()=>console.log('Servidor Horas Fischer Montajes - Puerto '+PORT));});
