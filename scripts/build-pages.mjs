import {cpSync,mkdirSync,rmSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {root,contained} from './paths.mjs';

const build=spawnSync(process.execPath,['scripts/build.mjs','all'],{cwd:root,stdio:'inherit'});
if(build.status!==0)process.exit(build.status||1);
const out=contained(root,'.build/pages');
rmSync(out,{recursive:true,force:true});mkdirSync(out,{recursive:true});
for(const brand of ['ateles','neotoma'])cpSync(resolve(root,'.build',brand),resolve(out,brand),{recursive:true});
writeFileSync(resolve(out,'.nojekyll'),'');
writeFileSync(resolve(out,'robots.txt'),'User-agent: *\nDisallow: /\n');
writeFileSync(resolve(out,'index.html'),`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Ateles and Neotoma — review sites</title>
<style>body{margin:0;background:#f7f5ef;color:#183144;font:1.1rem/1.5 system-ui,sans-serif}main{max-width:56rem;margin:auto;padding:clamp(2rem,7vw,6rem)}h1{font:clamp(2.7rem,7vw,5rem)/1.02 Georgia,serif;max-width:13ch}p{max-width:42rem}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(16rem,1fr));gap:1.2rem;margin-top:3rem}a{display:block;padding:2rem;text-decoration:none;color:inherit;background:#ebe8e0;border-top:5px solid #184d3f}a:last-child{border-color:#254b70}a:hover,a:focus-visible{outline:3px solid currentColor;outline-offset:3px}strong{display:block;font:2rem Georgia,serif}small{display:block;margin-top:.7rem;color:#405668}</style></head>
<body><main><p>Public review · not a product launch</p><h1>Two products. Two starting points.</h1><p>Explore the current Ateles and Neotoma website drafts. Examples and Updates media are synthetic development material. Cloud registration is disabled.</p><div class="cards"><a href="ateles/"><strong>Ateles</strong><small>Meaningful delegated work, with roles and decision boundaries.</small></a><a href="neotoma/"><strong>Neotoma</strong><small>Connected context that agents can inspect and maintain.</small></a></div></main></body></html>\n`);
console.log(JSON.stringify({output:out,brands:['ateles','neotoma'],mode:'public-noindex-review'}));
