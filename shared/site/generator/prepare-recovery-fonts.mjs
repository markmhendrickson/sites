import {mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const base='dist/fonts/recovery-2026-10-05';mkdirSync(base,{recursive:true});
const source='https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif&family=Source+Sans+3:wght@400;500;600&family=Source+Serif+4:wght@500;600&display=swap';
const fetchOK=async u=>{const r=await fetch(u);if(!r.ok)throw Error(`${r.status} fetching font source`);return r};
let css=await (await fetchOK(source)).text();const sources=[...new Set([...css.matchAll(/url\((https:[^)]+)\)/g)].map(x=>x[1]))],files=[];
for(let i=0;i<sources.length;i++){const url=sources[i],data=Buffer.from(await(await fetchOK(url)).arrayBuffer()),filename=`font-${i}.${url.split('.').pop()}`;writeFileSync(`${base}/${filename}`,data);css=css.replaceAll(url,filename);files.push({filename,source:url,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});}
const licenses=[];for(const family of ['barlowcondensed','instrumentsans','instrumentserif','sourcesans3','sourceserif4']){const url=`https://raw.githubusercontent.com/google/fonts/main/ofl/${family}/OFL.txt`,text=await(await fetchOK(url)).text();if(!text.includes('SIL OPEN FONT LICENSE'))throw Error('Font license missing');writeFileSync(`${base}/${family}-OFL.txt`,text);licenses.push({family,source:url,license:'SIL OFL 1.1'});}
writeFileSync(`${base}/fonts.css`,css);writeFileSync(`${base}/manifest.json`,JSON.stringify({retrieved:'2026-10-05',cssSource:source,files,licenses},null,2));console.log(JSON.stringify({files:files.length,licenses:licenses.length,bytes:files.reduce((a,b)=>a+b.bytes,0)}));
