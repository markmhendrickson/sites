import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
if(!process.stdin.isTTY)throw Error('Use the hidden-input terminal workflow.');
process.stdin.setRawMode(true);console.log('Ready for hidden hosted-check input.');
const input=JSON.parse(await new Promise(resolve=>{let x='';process.stdin.on('data',b=>{x+=b;if(x.includes('\n'))resolve(x.trim());});}));
process.stdin.pause();process.stdin.setRawMode(false);
const routes=JSON.parse(readFileSync('dist/tension-trace-r2-routes.json'));
const assets=JSON.parse(readFileSync('tension-trace-r2-art.json'));
const queue=[...routes.map(path=>({path,kind:'route'})),...Object.values(assets).map(a=>({path:a.src,kind:'image'}))];
const result=[];
async function worker(){while(queue.length){const item=queue.shift();const r=await fetch(`${input.origin}/${item.path}`,{headers:{Authorization:`Bearer ${input.token}`}});if(!r.ok)throw Error(`Hosted ${item.kind} failed: ${item.path} (${r.status})`);const b=Buffer.from(await r.arrayBuffer());if(item.kind==='image'){const expected=createHash('sha256').update(readFileSync(`dist/${item.path}`)).digest('hex');if(createHash('sha256').update(b).digest('hex')!==expected)throw Error(`Hosted image mismatch: ${item.path}`);}else if(!b.toString().includes('Private'))throw Error(`Unexpected route response: ${item.path}`);result.push(item);}}
await Promise.all([worker(),worker(),worker()]);console.log(JSON.stringify({hostedRoutes:result.filter(x=>x.kind==='route').length,hostedImages:result.filter(x=>x.kind==='image').length,imageBytesMatchSource:true}));
