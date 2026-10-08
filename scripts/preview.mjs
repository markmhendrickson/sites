import {createServer} from 'node:http';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {root,contained} from './paths.mjs';
const base=resolve(root,'.build'),port=Number(process.env.PORT||8790);
if(!existsSync(base))throw Error('Run build first');
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2'};
createServer((req,res)=>{try{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 let p=contained(base,'.'+pathname);
 if(existsSync(p)&&statSync(p).isDirectory())p=resolve(p,'index.html');
 if(!existsSync(p)){res.writeHead(404);res.end('Build /ateles/ or /neotoma/ first');return;}
 res.writeHead(200,{'content-type':types[extname(p)]||'application/octet-stream','x-robots-tag':'noindex, nofollow','cache-control':'no-store'});res.end(readFileSync(p));
}catch{res.writeHead(400);res.end('Invalid path');}}).listen(port,'127.0.0.1',()=>console.log('Local preview http://127.0.0.1:'+port+'/ateles/ and /neotoma/'));
