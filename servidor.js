const http = require('http');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || '';
let db = null, mem = null;

async function conectar(){
  if(!MONGO_URI) return;
  try{
    const c = new MongoClient(MONGO_URI, {serverSelectionTimeoutMS:5000});
    await c.connect();
    db = c.db('horas_app');
    console.log('MongoDB OK');
  }catch(e){ console.log('Mongo err:', e.message); }
}

async function leer(){
  if(mem) return mem;
  if(!db){ mem = {trabajos:[]}; return mem; }
  try{
    const d = await db.collection('horas_data').findOne({_id:'data'});
    mem = d ? d.data : {trabajos:[]};
  }catch(e){ mem = {trabajos:[]}; }
  return mem;
}

async function guardar(data){
  mem = data;
  if(!db) return;
  try{
    await db.collection('horas_data').replaceOne(
      {_id:'data'}, {_id:'data', data, updatedAt:new Date()}, {upsert:true}
    );
  }catch(e){}
}

const server = http.createServer(async function(req, res){
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if(req.method === 'OPTIONS'){ res.writeHead(204); res.end(); return; }

  if(req.method === 'GET' && req.url === '/'){
    try{
      const html = fs.readFileSync(path.join(__dirname, 'index.html'));
      res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
      res.end(html);
    }catch(e){ res.writeHead(500); res.end('Error'); }
    return;
  }

  if(req.method === 'GET' && req.url === '/data'){
    const d = await leer();
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(d)); return;
  }

  if(req.method === 'POST' && req.url === '/data'){
    let b = '';
    req.on('data', function(c){ b += c; });
    req.on('end', async function(){
      try{ await guardar(JSON.parse(b)); res.writeHead(200); res.end('ok'); }
      catch(e){ res.writeHead(400); res.end('err'); }
    }); return;
  }

  res.writeHead(404); res.end('404');
});

conectar().then(function(){
  server.listen(PORT, function(){ console.log('Servidor Puerto ' + PORT); });
});
