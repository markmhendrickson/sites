import{readFileSync,writeFileSync,mkdirSync}from'node:fs';
import{join,dirname}from'node:path';
import{fileURLToPath}from'node:url';
import{execFileSync}from'node:child_process';
import{createHash}from'node:crypto';
const root=dirname(fileURLToPath(import.meta.url));
const selection=JSON.parse(readFileSync(process.argv[2],'utf8'));
if(selection.length!==26)throw Error('Expected twenty-six cleared, unique images');
const seen=new Set(),manifest={};
for(const row of selection){if(!row.cleared)throw Error(`Not cleared: ${row.id}`);const hash=createHash('sha256').update(readFileSync(row.path)).digest('hex');if(seen.has(hash))throw Error(`Repeated image ${row.id}`);seen.add(hash);const src=`images/tension-trace-r2/${row.id}.jpg`,dest=join(root,'dist',src);mkdirSync(dirname(dest),{recursive:true});execFileSync('/usr/bin/sips',['-s','format','jpeg','-s','formatOptions','88',row.path,'--out',dest],{stdio:'pipe'});const meta=execFileSync('/usr/bin/sips',['-g','pixelWidth','-g','pixelHeight',dest],{encoding:'utf8'});manifest[row.id]={src,width:Number(meta.match(/pixelWidth: (\d+)/)[1]),height:Number(meta.match(/pixelHeight: (\d+)/)[1]),sha256:createHash('sha256').update(readFileSync(dest)).digest('hex')};}
writeFileSync(join(root,'tension-trace-r2-art.json'),JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify({images:Object.keys(manifest).length,unique:seen.size}));
