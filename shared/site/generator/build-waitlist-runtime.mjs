import {cpSync,copyFileSync,mkdirSync,readdirSync,readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {assertNoDevelopmentOutputs} from './development-updates.mjs';
// Build-only copies preserve legacy assets and never run schema DDL.
const hosting=JSON.parse(readFileSync('.openai/hosting.json','utf8'));
if(hosting.static!=null||hosting.d1!=='DB')throw Error('Explicit Worker/D1 configuration required');
execFileSync(process.execPath,['build.mjs'],{cwd:'waitlist-runtime',stdio:'inherit'});
for(const dir of ['dist/client','dist/server','dist/.openai','drizzle'])mkdirSync(dir,{recursive:true});
for(const entry of readdirSync('dist',{withFileTypes:true})){
 if(['client','server','.openai'].includes(entry.name))continue;
 cpSync(join('dist',entry.name),join('dist/client',entry.name),{recursive:entry.isDirectory()});
}
copyFileSync('waitlist-runtime/build-assets/server/synthetic-index.js','dist/server/index.js');
if(!process.argv.includes('--development-updates'))assertNoDevelopmentOutputs('dist');
for(const file of ['waitlist-client.mjs','waitlist-verification-client.mjs','waitlist-form.css'])copyFileSync(join('waitlist-runtime/build-assets',file),join('dist/client',file));
cpSync('waitlist-runtime/drizzle','drizzle',{recursive:true});
cpSync('drizzle','dist/.openai/drizzle',{recursive:true});
writeFileSync('dist/.openai/hosting.json',JSON.stringify(hosting)+'\n');
console.log('Built synthetic-only Worker, generated migration metadata and preserved static assets; live collection disabled.');
