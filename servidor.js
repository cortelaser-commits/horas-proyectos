const http = require('http');
const { MongoClient } = require('mongodb');
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || '';
let db = null, mem = null;

const INIT = {
  operarios:["Eduardo García","Carlos Sarassola","Leonardo Delgado","Milton Placeres","Victor Gallo","Alejandro Bentancur","Julio Saracho","Luciano Sarassola","Lucas Placeres","Cristian Sánchez","Enrique Avero","Santiago Da Silva","Sebastián Da Silva","Sergio Bornia","Carlos Gonzales","Maikel Bravo","Adrian Ramos","Octavio Bonnahon","Angel Barreto"],
  proyectos:["4476 - Cañerias tk 520-521","4484 - Suplementos transportes L4","4509 - Trabajos varios Dairyco","4526 - Instalacion filtros caneria","4532 - Montaje robot final linea","4533 - Armado aireadores","4535 - Aspiracion chocolatada","4537 - Elevacion Tanques CIP","4541 - Trabajos varios Dairyco","4545 - Instalacion mecanica licor cacao","4546 - Montaje tanques sala jarabe","4548 - Descarga despaletizadora","4550 - Modificacion estanterias","4553 - Prevencionista Linea 8","4556 - Prevencionista elaborador","4561 - Techo llenadora L8","4562 - Techo tapadora L8","4573 - Montaje tanque aseptico","4579 - Montaje 2500 Gal","4582 - Bandeja Resumidero","4584 - Desmontaje Centrifuga","4585 - Instalacion TK500 501 502","4587 - Adicionales Pepsico","4589 - Soporteria Inox L8","4590 - Ingenieria Servicios L8","4591 - Montaje Centrifugadora GEA","4593 - Deposito TK SJ","4595 - SubCArb L4 L5","4596 - Plataforma y Canerias","4598 - Escalera Plataforma L4","4600 - Fabricacion Tornillo Sin Fin","4602 - Trituradora Plastico","4604 - Tolva Envasadora","4605 - Sistema recuperacion Calor","4606 - Plataforma Pailas"],
  tareas:["Soldadura","Corte","Armado","Pintura","Instalacion","Montaje","Piping","Supervision","Medicion","Mantenimiento","Ingenieria","Transporte"],
  trabajos:[],favoritos:[],proyectosCerrados:[],limites:{}
};

async function conectar(){
  if(!MONGO_URI)return;
  try{const c=new MongoClient(MONGO_URI,{serverSelectionTimeoutMS:5000});await c.connect();db=c.db('horas_app');console.log('MongoDB OK');}catch(e){console.log('Mongo err:',e.message);}
}
async function leer(){
  if(mem)return mem;
  if(!db){mem=JSON.parse(JSON.stringify(INIT));return mem;}
  try{const d=await db.collection('horas_data').findOne({_id:'data'});mem=d?{...INIT,...d.data}:JSON.parse(JSON.stringify(INIT));}catch(e){mem=JSON.parse(JSON.stringify(INIT));}
  return mem;
}
async function guardar(data){
  mem=data;
  if(!db)return;
  try{await db.collection('horas_data').replaceOne({_id:'data'},{_id:'data',data,updatedAt:new Date()},{upsert:true});}catch(e){}
}

const server=http.createServer(async(req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}

  if(req.method==='GET'&&req.url==='/'){
    const data=await leer();
    const j=JSON.stringify(data);
    const html=PAGE.replace('__DATA__',j);
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
    res.end(html);return;
  }
  if(req.method==='POST'&&req.url==='/data'){
    let b='';req.on('data',c=>b+=c);req.on('end',async()=>{
      try{await guardar(JSON.parse(b));res.writeHead(200);res.end('ok');}catch(e){res.writeHead(400);res.end('err');}
    });return;
  }
  res.writeHead(404);res.end('404');
});

const PAGE=`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Horas - Fischer Montajes</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css">
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#fff;--bg2:#f5f5f4;--bg3:#f0efed;--tx:#1a1a18;--tx2:#6b6b68;--bd:#d4d2ca;--sc:#3b6d11;--sbg:#eaf3de;--dc:#a32d2d;--ic:#185fa5;--ibg:#e6f1fb;--r:8px;--rl:12px}
@media(prefers-color-scheme:dark){:root{--bg:#1c1c1a;--bg2:#252523;--bg3:#2e2e2b;--tx:#f0ede8;--tx2:#9b9890;--bd:#3a3a37}}
body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;background:var(--bg3);color:var(--tx)}
.hdr{background:var(--bg);border-bottom:.5px solid var(--bd);padding:14px 16px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:10}
.hico{width:36px;height:36px;background:var(--tx);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--bg);font-size:18px}
.tabs{display:flex;background:var(--bg);border-bottom:.5px solid var(--bd);overflow-x:auto}
.tab{flex:1;min-width:70px;padding:11px 6px;font-size:12px;font-weight:500;text-align:center;cursor:pointer;border:none;background:none;color:var(--tx2);border-bottom:2px solid transparent;white-space:nowrap}
.tab.on{color:var(--tx);border-bottom:2px solid var(--tx)}
.pnl{display:none;padding:12px;max-width:700px;margin:0 auto}.pnl.on{display:block}
.crd{background:var(--bg);border:.5px solid var(--bd);border-radius:var(--rl);padding:14px;margin-bottom:12px}
.ct{font-size:14px;font-weight:500;margin-bottom:12px;display:flex;align-items:center;gap:7px}
.fld{display:flex;flex-direction:column;gap:4px;margin-bottom:10px}
.fld label{font-size:12px;color:var(--tx2)}
.fld input,.fld select{font-size:14px;padding:9px 11px;border:.5px solid var(--bd);border-radius:var(--r);background:var(--bg);color:var(--tx);width:100%;-webkit-appearance:none}
.fg{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.btn{padding:9px 16px;border-radius:var(--r);font-size:13px;font-weight:500;cursor:pointer;border:.5px solid var(--bd);background:var(--bg);color:var(--tx);display:inline-flex;align-items:center;gap:6px}
.btn.p{background:var(--tx);color:var(--bg);border-color:var(--tx)}
.btn.d{color:var(--dc);border-color:transparent}
.btn.g{border-color:var(--ic);color:var(--ic)}
.br{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}
.proy-wrap{position:relative}
.proy-drop{position:absolute;top:100%;left:0;right:0;border:.5px solid var(--bd);border-radius:var(--r);background:var(--bg);max-height:200px;overflow-y:auto;z-index:50;box-shadow:0 4px 12px rgba(0,0,0,.1);display:none}
.proy-item{padding:9px 11px;cursor:pointer;font-size:13px;border-bottom:.5px solid var(--bd)}
.proy-item:hover{background:var(--bg2)}
.dbtns{display:flex;gap:6px;margin-top:6px}
.dbtn{flex:1;padding:6px;border-radius:var(--r);font-size:12px;font-weight:500;cursor:pointer;border:.5px solid var(--bd);background:var(--bg2);color:var(--tx2);text-align:center}
.dbtn.on{background:var(--tx);color:var(--bg);border-color:var(--tx)}
.ogrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:6px;margin-bottom:10px}
.ochk{display:flex;align-items:center;gap:7px;padding:8px 10px;border:.5px solid var(--bd);border-radius:var(--r);cursor:pointer;font-size:13px;background:var(--bg2)}
.ochk.sel{background:var(--ibg);border-color:var(--ic);color:var(--ic);font-weight:500}
.ochk input{display:none}
.shs{display:flex;align-items:center;gap:10px;margin-top:10px;padding:10px;background:var(--bg2);border-radius:var(--r)}
.shs label{font-size:13px;color:var(--tx2)}
.shs input{width:75px;font-size:15px;font-weight:600;padding:6px 8px;border:.5px solid var(--bd);border-radius:var(--r);background:var(--bg);color:var(--tx);text-align:center}
.otb{width:100%;border-collapse:collapse;font-size:13px}
.otb th{text-align:left;padding:6px;font-weight:500;color:var(--tx2);border-bottom:.5px solid var(--bd);font-size:12px}
.otb td{padding:5px 4px;border-bottom:.5px solid var(--bd);vertical-align:middle}
.otb tr:last-child td{border-bottom:none}
.otb select,.otb input{font-size:13px;padding:6px 7px;border:.5px solid var(--bd);border-radius:var(--r);background:var(--bg);color:var(--tx);width:100%}
.tbar{display:flex;justify-content:space-between;align-items:center;padding:9px 11px;background:var(--bg2);border-radius:var(--r);margin-top:10px;font-size:13px}
.ths{font-size:16px;font-weight:500}
.mtabs{display:flex;border:.5px solid var(--bd);border-radius:var(--r);overflow:hidden;margin-bottom:12px}
.mtab{flex:1;padding:8px;font-size:12px;font-weight:500;cursor:pointer;border:none;background:var(--bg2);color:var(--tx2);text-align:center}
.mtab.on{background:var(--tx);color:var(--bg)}
.hcrd{background:var(--bg);border:.5px solid var(--bd);border-radius:var(--r);padding:12px;margin-bottom:8px}
.sts{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:12px}
.st{background:var(--bg);border-radius:var(--r);padding:12px;border:.5px solid var(--bd)}
.sl{font-size:12px;color:var(--tx2);margin-bottom:4px}
.sv{font-size:24px;font-weight:500}
.bw{margin-bottom:10px}
.bl{display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px}
.bb{height:5px;border-radius:3px;background:var(--bg2)}
.bf{height:5px;border-radius:3px;background:var(--tx)}
.alist{display:flex;flex-direction:column;gap:5px;margin-bottom:10px}
.ai{display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:var(--bg2);border-radius:var(--r);font-size:13px;gap:6px}
.ar{display:flex;gap:8px}
.ar input{flex:1;font-size:14px;padding:8px 10px;border:.5px solid var(--bd);border-radius:var(--r);background:var(--bg);color:var(--tx)}
.ag{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.fb{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}
.fb select{font-size:13px;padding:7px 10px;border:.5px solid var(--bd);border-radius:var(--r);background:var(--bg);color:var(--tx);-webkit-appearance:none;flex:1;min-width:120px}
.bdg{display:inline-block;font-size:11px;padding:2px 7px;border-radius:var(--r);background:var(--ibg);color:var(--ic)}
.ol{border-top:.5px solid var(--bd);padding-top:8px;display:flex;flex-direction:column;gap:4px}
.or{display:flex;justify-content:space-between;font-size:12px;padding:2px 0}
.tst{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--sbg);border:.5px solid var(--sc);color:var(--sc);border-radius:var(--r);padding:10px 18px;font-size:13px;display:none;align-items:center;gap:8px;z-index:999;white-space:nowrap}
.tst.on{display:flex}
.emp{text-align:center;padding:2rem;color:var(--tx2);font-size:14px}
@media(max-width:420px){.fg{grid-template-columns:1fr}.ag{grid-template-columns:1fr}}
</style></head><body>
<div class="hdr"><div class="hico"><i class="ti ti-clock"></i></div><div><div style="font-size:16px;font-weight:500">Horas por Proyecto</div><div style="font-size:12px;color:var(--tx2)">Fischer Montajes</div></div></div>
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
      <div class="fld"><label>Proyecto</label>
        <div class="proy-wrap">
          <input type="text" id="ps" placeholder="Buscar proyecto..." oninput="filP()" autocomplete="off" style="font-size:14px;padding:9px 11px;border:.5px solid var(--bd);border-radius:var(--r);background:var(--bg);color:var(--tx);width:100%">
          <div id="pd" class="proy-drop"></div>
        </div>
        <input type="hidden" id="pv">
      </div>
      <div class="fld"><label>Tarea general</label><select id="ft"><option value="">-- seleccionar --</option></select></div>
      <div class="fld"><label>Fecha</label>
        <input type="date" id="ff">
        <div class="dbtns">
          <div class="dbtn on" id="bh" onclick="sF(0)">Hoy</div>
          <div class="dbtn" id="ba" onclick="sF(-1)">Ayer</div>
          <div class="dbtn" id="bb" onclick="sF(-2)">Antes de ayer</div>
        </div>
      </div>
      <div class="fld"><label>Cargado por</label><select id="fe"><option value="">-- seleccionar --</option></select></div>
    </div>
    <div class="fld"><label>Observaciones</label><input type="text" id="fo" placeholder="Opcional..."></div>
  </div>
  <div class="crd">
    <div class="ct"><i class="ti ti-users"></i> Operarios</div>
    <div class="mtabs">
      <button class="mtab on" onclick="sM('r',this)"><i class="ti ti-bolt"></i> Mismas horas</button>
      <button class="mtab" onclick="sM('i',this)"><i class="ti ti-adjustments"></i> Individuales</button>
    </div>
    <div id="mr">
      <div style="font-size:12px;color:var(--tx2);margin-bottom:8px">Selecciona operarios:</div>
      <div class="ogrid" id="og"></div>
      <div class="shs"><label>Horas para todos:</label><input type="number" id="hc" min="0.5" max="24" step="0.5" placeholder="8" oninput="cT()"><span style="font-size:13px;color:var(--tx2)">hs</span></div>
    </div>
    <div id="mi" style="display:none">
      <table class="otb"><thead><tr><th>Operario</th><th>Tarea</th><th style="width:78px">Horas</th><th style="width:40px"></th></tr></thead><tbody id="ot"></tbody></table>
      <div style="margin-top:10px"><button class="btn g" onclick="aR()"><i class="ti ti-plus"></i> Agregar</button></div>
    </div>
    <div class="tbar"><span style="color:var(--tx2)">Total horas</span><span class="ths" id="tt">0 hs</span></div>
  </div>
  <div class="br"><button class="btn" onclick="lmp()">Limpiar</button><button class="btn p" onclick="grd()"><i class="ti ti-check"></i> Guardar</button></div>
</div>

<div id="pnl-h" class="pnl">
  <div class="fb">
    <select id="flp" onchange="rH()"><option value="">Todos los proyectos</option></select>
    <select id="flo" onchange="rH()"><option value="">Todos los operarios</option></select>
  </div>
  <button class="btn" style="margin-bottom:10px;width:100%;justify-content:center" onclick="eCSV()"><i class="ti ti-download"></i> Exportar CSV</button>
  <div id="hl"></div>
</div>

<div id="pnl-r" class="pnl">
  <div class="sts" id="sts"></div>
  <div class="crd"><div class="ct">Por proyecto</div><div id="rp"></div></div>
  <div class="crd"><div class="ct">Por operario (este mes)</div><div id="ro"></div></div>
</div>

<div id="pnl-a" class="pnl">
  <div class="ag">
    <div class="crd"><div class="ct"><i class="ti ti-users"></i> Operarios</div><div id="aop" class="alist"></div><div class="ar"><input id="nop" placeholder="Nombre..."><button class="btn p" onclick="aI('operarios','nop')"><i class="ti ti-plus"></i></button></div></div>
    <div class="crd"><div class="ct"><i class="ti ti-building"></i> Proyectos</div><div id="apr" class="alist"></div><div class="ar"><input id="npr" placeholder="N / nombre..."><button class="btn p" onclick="aI('proyectos','npr')"><i class="ti ti-plus"></i></button></div></div>
  </div>
  <div class="crd"><div class="ct"><i class="ti ti-tool"></i> Tareas</div><div id="ata" class="alist"></div><div class="ar"><input id="nta" placeholder="Nombre..."><button class="btn p" onclick="aI('tareas','nta')"><i class="ti ti-plus"></i></button></div></div>
</div>

<script>
var D=__DATA__;
var rid=0,modo='r';
D.operarios=D.operarios&&D.operarios.length?D.operarios:["Eduardo García","Carlos Sarassola","Leonardo Delgado","Milton Placeres","Victor Gallo","Alejandro Bentancur","Julio Saracho","Luciano Sarassola","Lucas Placeres","Cristian Sánchez","Enrique Avero","Santiago Da Silva","Sebastián Da Silva","Sergio Bornia","Carlos Gonzales","Maikel Bravo","Adrian Ramos","Octavio Bonnahon","Angel Barreto"];
D.proyectos=D.proyectos&&D.proyectos.length?D.proyectos:["4526 - Instalacion filtros","4532 - Montaje robot","4545 - Instalacion licor cacao","4585 - TK500 501 502","4590 - Ingenieria Servicios L8","4606 - Plataforma Pailas"];
D.tareas=D.tareas&&D.tareas.length?D.tareas:["Soldadura","Corte","Armado","Pintura","Instalacion","Montaje","Supervision"];
D.trabajos=D.trabajos||[];
D.favoritos=D.favoritos||[];

function sync(){fetch('/data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(D)}).catch(function(){});}

function goTab(t,el){
  document.querySelectorAll('.tab').forEach(function(b){b.classList.remove('on')});
  document.querySelectorAll('.pnl').forEach(function(p){p.classList.remove('on')});
  el.classList.add('on');document.getElementById('pnl-'+t).classList.add('on');
  if(t==='h'){fF();rH();}if(t==='r')rR();if(t==='a')rA();
}

function poblar(){
  var ft=document.getElementById('ft'),fe=document.getElementById('fe');
  var vt=ft.value,ve=fe.value;
  ft.innerHTML='<option value="">-- seleccionar --</option>'+D.tareas.map(function(x){return'<option value="'+x+'">'+x+'</option>';}).join('');
  fe.innerHTML='<option value="">-- seleccionar --</option>'+D.operarios.map(function(x){return'<option value="'+x+'">'+x+'</option>';}).join('');
  ft.value=vt;fe.value=ve;
  // restaurar ultimo encargado
  var ul=localStorage.getItem('ue');
  if(ul&&!ve){for(var i=0;i<fe.options.length;i++){if(fe.options[i].value===ul){fe.value=ul;break;}}}
}

function poblarChecks(){
  var og=document.getElementById('og');
  og.innerHTML=D.operarios.map(function(op){
    return'<label class="ochk"><input type="checkbox" value="'+op+'" onchange="this.closest(\'label\').classList.toggle(\'sel\',this.checked);cT()"><i class="ti ti-user" style="font-size:14px"></i>'+op+'</label>';
  }).join('');
}

function sF(d){var dt=new Date();dt.setDate(dt.getDate()+d);document.getElementById('ff').value=dt.toISOString().split('T')[0];document.getElementById('bh').classList.toggle('on',d===0);document.getElementById('ba').classList.toggle('on',d===-1);document.getElementById('bb').classList.toggle('on',d===-2);}

function filP(){
  var q=document.getElementById('ps').value.toLowerCase(),pd=document.getElementById('pd');
  if(!q){pd.style.display='none';document.getElementById('pv').value='';return;}
  var f=D.proyectos.filter(function(p){return p.toLowerCase().includes(q);});
  if(!f.length){pd.style.display='none';return;}
  pd.style.display='block';
  pd.innerHTML=f.map(function(p){return'<div class="proy-item" onclick="selP(\''+p.replace(/'/g,"\\'")+'\')" >'+p+'</div>';}).join('');
}
function selP(p){document.getElementById('ps').value=p;document.getElementById('pv').value=p;document.getElementById('pd').style.display='none';}
document.addEventListener('click',function(e){if(!e.target.closest('.proy-wrap'))document.getElementById('pd').style.display='none';});

function sM(m,el){modo=m;document.querySelectorAll('.mtab').forEach(function(b){b.classList.remove('on')});el.classList.add('on');document.getElementById('mr').style.display=m==='r'?'block':'none';document.getElementById('mi').style.display=m==='i'?'block':'none';cT();}

function cT(){var t=0;if(modo==='r'){var hs=parseFloat(document.getElementById('hc').value)||0;t=hs*document.querySelectorAll('#og input:checked').length;}else{document.querySelectorAll('.hi').forEach(function(i){var v=parseFloat(i.value);if(!isNaN(v))t+=v;});}document.getElementById('tt').textContent=t.toFixed(1)+' hs';}

function mkO(list,sel){return list.map(function(x){return'<option value="'+x+'"'+(x===sel?' selected':'')+'>'+x+'</option>';}).join('');}

function aR(op,ta,hs){var id='r'+rid++;var tr=document.createElement('tr');tr.id=id;tr.innerHTML='<td><select class="os"><option value="">--</option>'+mkO(D.operarios,op)+'</select></td><td><select class="ts"><option value="">--</option>'+mkO(D.tareas,ta)+'</select></td><td><input class="hi" type="number" min="0.5" max="24" step="0.5" value="'+(hs||'')+'" placeholder="0" oninput="cT()" style="width:70px"></td><td><button class="btn d" onclick="document.getElementById(\''+id+'\').remove();cT()" style="padding:4px 8px"><i class="ti ti-x"></i></button></td>';document.getElementById('ot').appendChild(tr);cT();}

function grd(){
  var pr=document.getElementById('pv').value||document.getElementById('ps').value.trim();
  var ta=document.getElementById('ft').value,fe=document.getElementById('ff').value,en=document.getElementById('fe').value,ob=document.getElementById('fo').value.trim();
  if(!pr||!ta||!fe||!en){alert('Completa todos los datos.');return;}
  var ops=[];
  if(modo==='r'){var hs=parseFloat(document.getElementById('hc').value)||0;if(!hs){alert('Ingresa las horas.');return;}var sels=document.querySelectorAll('#og input:checked');if(!sels.length){alert('Selecciona al menos un operario.');return;}sels.forEach(function(s){ops.push({operario:s.value,tarea:ta,horas:hs});});}
  else{var rows=document.querySelectorAll('#ot tr'),ok=true;rows.forEach(function(tr){var op=tr.querySelector('.os').value,t=tr.querySelector('.ts').value,h=parseFloat(tr.querySelector('.hi').value);if(!op||isNaN(h)||h<=0){ok=false;return;}ops.push({operario:op,tarea:t||ta,horas:h});});if(!ops.length){alert('Agrega al menos un operario.');return;}if(!ok){alert('Revisa las horas.');return;}}
  localStorage.setItem('ue',en);
  D.trabajos.unshift({id:Date.now(),proyecto:pr,tarea:ta,fecha:fe,encargado:en,obs:ob,operarios:ops});
  sync();lmp();toast('Guardado — '+ops.length+' operario'+(ops.length>1?'s':''));
}

function lmp(){document.getElementById('ps').value='';document.getElementById('pv').value='';document.getElementById('pd').style.display='none';document.getElementById('ft').value='';document.getElementById('fo').value='';sF(0);document.querySelectorAll('#og input').forEach(function(c){c.checked=false;c.closest('label').classList.remove('sel');});document.getElementById('hc').value='';document.getElementById('ot').innerHTML='';rid=0;aR();cT();}

function toast(msg){var t=document.getElementById('tst');document.getElementById('tm').textContent=msg;t.classList.add('on');setTimeout(function(){t.classList.remove('on');},3000);}

function fF(){var fp=document.getElementById('flp'),fo=document.getElementById('flo'),vp=fp.value,vo=fo.value;fp.innerHTML='<option value="">Todos los proyectos</option>'+D.proyectos.map(function(x){return'<option value="'+x+'">'+x+'</option>';}).join('');fo.innerHTML='<option value="">Todos los operarios</option>'+D.operarios.map(function(x){return'<option value="'+x+'">'+x+'</option>';}).join('');fp.value=vp;fo.value=vo;}

function rH(){var fP=document.getElementById('flp').value,fO=document.getElementById('flo').value;var tr=D.trabajos.filter(function(t){return(!fP||t.proyecto===fP)&&(!fO||t.operarios.find(function(o){return o.operario===fO;}));});var el=document.getElementById('hl');if(!tr.length){el.innerHTML='<div class="emp"><i class="ti ti-inbox"></i><br>Sin registros</div>';return;}el.innerHTML=tr.map(function(t){var tot=t.operarios.reduce(function(s,o){return s+o.horas;},0),p=t.fecha.split('-');return'<div class="hcrd"><div style="display:flex;justify-content:space-between;margin-bottom:8px"><div><div style="font-size:14px;font-weight:500">'+t.proyecto+'</div><div style="font-size:12px;color:var(--tx2)"><span class="bdg">'+t.tarea+'</span> '+p[2]+'/'+p[1]+'/'+p[0]+' por '+t.encargado+'</div>'+(t.obs?'<div style="font-size:12px;color:var(--tx2);font-style:italic">'+t.obs+'</div>':'')+'</div><div style="text-align:right"><div style="font-size:20px;font-weight:500">'+tot.toFixed(1)+'</div><div style="font-size:11px;color:var(--tx2)">hs</div><button class="btn d" style="font-size:11px;padding:3px 8px;margin-top:4px" onclick="del('+t.id+')"><i class="ti ti-trash"></i></button></div></div><div class="ol">'+t.operarios.map(function(o){return'<div class="or"><span>'+o.operario+' <span style="color:var(--tx2)">- '+o.tarea+'</span></span><span style="font-weight:500">'+o.horas+' hs</span></div>';}).join('')+'</div></div>';}).join('');}

function del(id){if(!confirm('Eliminar?'))return;D.trabajos=D.trabajos.filter(function(t){return t.id!==id;});sync();rH();}

function rR(){var tot=D.trabajos.reduce(function(s,t){return s+t.operarios.reduce(function(ss,o){return ss+o.horas;},0);},0);var mes=new Date().toISOString().slice(0,7);var hm=D.trabajos.filter(function(t){return t.fecha.startsWith(mes);}).reduce(function(s,t){return s+t.operarios.reduce(function(ss,o){return ss+o.horas;},0);},0);document.getElementById('sts').innerHTML='<div class="st"><div class="sl">Total horas</div><div class="sv">'+tot.toFixed(1)+'</div></div><div class="st"><div class="sl">Este mes</div><div class="sv">'+hm.toFixed(1)+'</div></div><div class="st"><div class="sl">Trabajos</div><div class="sv">'+D.trabajos.length+'</div></div><div class="st"><div class="sl">Proyectos</div><div class="sv">'+new Set(D.trabajos.map(function(t){return t.proyecto;})).size+'</div></div>';function bars(by,eid){var mx=Math.max.apply(null,Object.values(by).concat([1]));document.getElementById(eid).innerHTML=Object.keys(by).length?Object.entries(by).sort(function(a,b){return b[1]-a[1];}).map(function(e){return'<div class="bw"><div class="bl"><span>'+e[0]+'</span><span style="font-weight:500">'+e[1].toFixed(1)+' hs</span></div><div class="bb"><div class="bf" style="width:'+(e[1]/mx*100).toFixed(1)+'%"></div></div></div>';}).join(''):'<div class="emp">Sin datos</div>';}var byP={};D.trabajos.forEach(function(t){t.operarios.forEach(function(o){byP[t.proyecto]=(byP[t.proyecto]||0)+o.horas;});});bars(byP,'rp');var byO={};D.trabajos.filter(function(t){return t.fecha.startsWith(mes);}).forEach(function(t){t.operarios.forEach(function(o){byO[o.operario]=(byO[o.operario]||0)+o.horas;});});bars(byO,'ro');}

function rA(){function rl(id,key){document.getElementById(id).innerHTML=D[key].length?D[key].map(function(x,i){return'<div class="ai"><span>'+x+'</span><button class="btn d" style="padding:3px 8px;font-size:11px" onclick="rI(\''+key+'\','+i+')"><i class="ti ti-x"></i></button></div>';}).join(''):'<div style="color:var(--tx2);font-size:13px">Sin elementos</div>';}rl('aop','operarios');rl('apr','proyectos');rl('ata','tareas');}
function aI(key,iid){var v=document.getElementById(iid).value.trim();if(!v)return;D[key].push(v);sync();poblar();poblarChecks();rA();document.getElementById(iid).value='';}
function rI(key,i){D[key].splice(i,1);sync();poblar();poblarChecks();rA();}
function eCSV(){var rows=["Fecha,Proyecto,Tarea,Encargado,Operario,Horas"];D.trabajos.forEach(function(t){t.operarios.forEach(function(o){rows.push(t.fecha+',"'+t.proyecto+'","'+t.tarea+'","'+t.encargado+'","'+o.operario+'",'+o.horas);});});var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([rows.join('\\n')],{type:'text/csv'}));a.download='horas.csv';a.click();}

window.onload=function(){poblar();poblarChecks();sF(0);aR();};
</script></body></html>`;

conectar().then(function(){server.listen(PORT,function(){console.log('Servidor Puerto '+PORT);});});
