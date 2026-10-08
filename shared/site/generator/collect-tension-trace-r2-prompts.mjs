import {readFileSync,writeFileSync} from 'node:fs';
const paths=process.argv.slice(2);
if(paths.length!==3)throw Error('Provide the three inspected asset manifests.');
const assets=paths.flatMap(p=>JSON.parse(readFileSync(p,'utf8')).assets).map(a=>{
 const {source,path,file,selected_file,...record}=a;
 return {...record,final_asset:`images/tension-trace-r2/${a.id}.jpg`};
});
if(assets.length!==26||new Set(assets.map(a=>a.id)).size!==26)throw Error('Expected 26 distinct assets.');
writeFileSync('dist/tension-trace-r2-prompts.json',JSON.stringify({mode:'Built-in image generation',review:'All final assets inspected; targeted repairs applied before page integration.',assets},null,2));
console.log(JSON.stringify({prompts:assets.length,pathsRedacted:true}));
