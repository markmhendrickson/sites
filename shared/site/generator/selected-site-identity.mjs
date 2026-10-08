import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const folder='images/logo-typography-2026-10-06/exports';
const marks={ateles:{name:'Ateles',code:'a2'},neotoma:{name:'Neotoma',code:'n2'}};
// Preserve the exact selected SVG. Only the symbol group's existing paths gain animation hooks.
export function selectedIdentitySvg(brand,theme='light',{symbolOnly=false}={}){
 const {code}=marks[brand];
 const file=symbolOnly?`${brand}-symbol-selected-${theme}.svg`:`${code}-nav-${theme}.svg`;
 let svg=readFileSync(`dist/${folder}/${file}`,'utf8');
 svg=svg.replace(/<svg\b([^>]*)>/,(_,attrs)=>`<svg${attrs.replace(/ role="[^"]*"| aria-label="[^"]*"/g,'')} class="logo-on-${theme}" aria-hidden="true" focusable="false">`);
 let part=0;
 if(symbolOnly)svg=svg.replace(/<path\b/g,()=>`<path data-brand-part="${part++}"`);
 else svg=svg.replace(/<g\b[^>]*>([\s\S]*?)<\/g>/,(group)=>group.replace(/<path\b/g,()=>`<path data-brand-part="${part++}"`));
 const expected=brand==='ateles'?2:3;
 if(part!==expected)throw Error(`Selected ${brand} symbol changed: expected ${expected} paths, found ${part}`);
 return svg;
}
export function selectedIdentity(brand,{compact=false,symbolOnly=false}={}){
 if(!marks[brand])throw Error('Unknown selected identity');
 return `<span class="selected-site-logo ${compact?'compact ':''}${symbolOnly?'symbol-only ':''}${brand}" data-brand-entrance="${brand}" aria-hidden="true">${selectedIdentitySvg(brand,'light',{symbolOnly})}${selectedIdentitySvg(brand,'dark',{symbolOnly})}</span>`;
}
export function applySelectedSiteIdentity(route,html){
 if(!/^tension-trace-(ateles|neotoma)-.*2026-10-06-r4\.html$/.test(route))return html;
 const brand=route.includes('-neotoma-')?'neotoma':'ateles';
 html=html.replace(/<a class="wordmark" href="([^"]+)">(Ateles|Neotoma)<\/a>/g,(_,href,name)=>`<a class="wordmark" href="${href}" aria-label="${name} home">${selectedIdentity(name.toLowerCase())}</a>`);
 html=html.replace(/<link rel="icon" href="[^"]+">/,`<link rel="icon" type="image/svg+xml" href="images/selected-logo-exports/${brand}-icon-32.svg">`);
 const asset=path=>`${path}?v=${createHash('sha256').update(readFileSync(`dist/${path}`)).digest('hex').slice(0,12)}`;
 return html.replace('</head>',`<link rel="stylesheet" href="${asset('selected-site-identity.css')}"><script type="module" src="${asset('selected-site-identity.js')}"></script></head>`);
}
