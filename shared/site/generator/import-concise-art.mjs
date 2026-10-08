import{readFileSync,writeFileSync,mkdirSync,copyFileSync}from'node:fs';
import{join,dirname}from'node:path';
import{fileURLToPath}from'node:url';
import{execFileSync}from'node:child_process';
const root=dirname(fileURLToPath(import.meta.url));
const assetRoot=process.argv[2];if(!assetRoot)throw Error('Pass the verified asset workspace root');
const manifest={};
const selected=process.argv.slice(3);for(const world of (selected.length?selected:['tension','printed','field'])){
 const raw=JSON.parse(readFileSync(join(assetRoot,`concise-assets-${world}`,'manifest.json'),'utf8'));
 const rows=Array.isArray(raw.assets)?raw.assets:raw.assets?Object.entries(raw.assets).map(([id,v])=>({id,...v})):raw.scenes;
 if(!rows||rows.length!==14)throw Error(`Expected fourteen scenes for ${world}`);
 manifest[world]={};
 for(const row of rows){
  if(!['pass','passed'].includes(row.status))throw Error(`Uncleared ${world}/${row.id}: ${row.status}`);
  const src=`images/concise-2026-10-05/${world}-${row.id}.jpg`,dest=join(root,'dist',src);
  mkdirSync(dirname(dest),{recursive:true});
  execFileSync('/usr/bin/sips',['-s','format','jpeg','-s','formatOptions','86',row.path,'--out',dest],{stdio:'pipe'});
  const meta=execFileSync('/usr/bin/sips',['-g','pixelWidth','-g','pixelHeight',dest],{encoding:'utf8'});
  manifest[world][row.id]={src,alt:row.alt,width:Number(meta.match(/pixelWidth: (\d+)/)[1]),height:Number(meta.match(/pixelHeight: (\d+)/)[1])};
 }
}
writeFileSync(join(root,'concise-art-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({worlds:Object.keys(manifest),images:Object.values(manifest).reduce((n,x)=>n+Object.keys(x).length,0)}));
