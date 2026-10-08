const ink='#18333d',blue='#365c72',red='#9f382c',pale='#d8e6e8';
const text=(x,y,label,size=16,weight=450,color=ink)=>`<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${color}">${label}</text>`;
const lines=(x,y,labels,size=15)=>labels.map((s,i)=>text(x,y+i*21,s,size)).join('');
function sheet(x,y,w,h,family,hold=false){
  if(family==='textile')return `<path d="M${x+12},${y} Q${x+w/2},${y-7} ${x+w-12},${y} Q${x+w+6},${y+h/2} ${x+w-12},${y+h} Q${x+w/2},${y+h+7} ${x+12},${y+h} Q${x-6},${y+h/2} ${x+12},${y}" fill="${hold?'#fff3ec':'#f7faf7'}" stroke="${hold?red:blue}" stroke-width="1.5"/><path d="M${x+14},${y+8} Q${x+w/2},${y+1} ${x+w-14},${y+8}" fill="none" stroke="${blue}" stroke-dasharray="2 4"/>`;
  return `<rect x="${x+4}" y="${y+4}" width="${w}" height="${h}" fill="#d9ddd9"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fffdf8" stroke="${hold?red:blue}"/><path d="M${x+8},${y+8}H${x+30} M${x+8},${y+8}V${y+24} M${x+w-8},${y+h-8}H${x+w-30} M${x+w-8},${y+h-8}V${y+h-24}" stroke="${blue}" fill="none"/>`;
}
function ateles(family,mobile){
  const w=mobile?360:1000,h=mobile?655:355;
  const items=[['Research','AG-01 · R-01','Notes AR-01'],['Draft','AG-02 · R-02','Brief B-017 v2'],['Review','AG-03 · R-03','Review of v2'],['Consent','Operator · R-04','C-02: hold A-03'],['Publish','R-02 · A-03','Not taken']];
  const nodes=items.map((_,i)=>mobile?{x:75,y:92+i*103,w:263,h:78}:{x:20+i*198,y:125,w:184,h:106});
  let body=text(18,28,'ONE TASK T-101 · PLAN P-04',mobile?16:20,700)+text(18,52,'Batch B-01 follows workflow W-017',mobile?14:17);
  if(family==='textile'){
    body+=mobile?`<path d="M39,108 Q65,160 39,212 Q13,264 39,314 Q65,365 39,408" stroke="${pale}" stroke-width="23" fill="none"/><path d="M39,461 Q15,508 39,552" stroke="${pale}" stroke-width="23" fill="none" stroke-dasharray="7 6"/>`:`<path d="M25,102 Q135,75 218,102 Q315,129 417,102 Q515,75 615,102 L702,102 M745,102 Q858,75 975,102" stroke="${pale}" stroke-width="24" fill="none"/>`;
    body+=mobile?text(18,636,'One continuing task; publication held.',14):text(20,280,'The continuous ribbon is the work. Each attachment is a responsible contributor.',17);
  }else{
    body+=mobile?`<path d="M39,108V555" stroke="${blue}" stroke-width="2" fill="none" stroke-dasharray="4 5"/>`:`<path d="M35,95H980" stroke="${blue}" stroke-width="1" stroke-dasharray="3 4" fill="none"/>`;
    body+=mobile?text(18,636,'Distinct steps; the same brief identity.',14):text(20,280,'Separate step dockets carry the same task and draft version forward.',17);
  }
  nodes.forEach((n,i)=>{
    const {x,y,w:nw,h:nh}=n;
    if(mobile){body+=`<circle cx="39" cy="${y+38}" r="${i===3?13:8}" fill="${i===3?red:blue}"/><path d="M52,${y+38}H${x}" stroke="${i===3?red:blue}"/>`;}
    else{body+=`<path d="M${x+nw/2},102V${y}" stroke="${i===3?red:blue}" stroke-width="2"/><circle cx="${x+nw/2}" cy="102" r="${i===3?12:5}" fill="${i===3?red:blue}"/>`;}
    body+=sheet(x,y,nw,nh,family,i===3)+text(x+15,y+27,`${i+1}. ${items[i][0]}`,mobile?18:19,700)+lines(x+15,y+49,[items[i][1],items[i][2]],mobile?14:15);
  });
  body+=text(18,mobile?610:322,'C-02 is about publishing A-03, brief v2.',mobile?14:17,650,red);
  return svg(w,h,body,`Ateles ${family} illustration: one task through five workflow steps; a checkpoint holds publishing action A-03.`);
}
function neotoma(family,mobile){
  const w=mobile?360:1000,h=mobile?690:490;
  const a=mobile?{x:18,y:82,w:324,h:88}:{x:20,y:77,w:435,h:86};
  const b=mobile?{x:18,y:190,w:324,h:88}:{x:545,y:77,w:435,h:86};
  const current=mobile?{x:18,y:365,w:324,h:148}:{x:220,y:268,w:560,h:134};
  let body=text(18,28,'ONE ENTITY E-204 · TWO SOURCES',mobile?16:20,700)+text(18,53,'A current view with inspectable history',mobile?14:17);
  [a,b].forEach((n,i)=>{body+=sheet(n.x,n.y,n.w,n.h,family)+text(n.x+16,n.y+29,i?'Role update S-02 → O-02':'Team roster S-01 → O-01',mobile?17:20,650)+text(n.x+16,n.y+57,i?'3 October · role: reviewer':'1 October · role: contributor',mobile?15:17);});
  if(family==='textile'){
    body+=mobile?`<path d="M23,160 C4,236 8,283 77,308 M332,273 Q350,309 280,322" fill="none" stroke="${blue}" stroke-width="3"/><path d="M32,310H329V530H32Z" fill="${pale}" stroke="${blue}" stroke-width="2"/>`:`<path d="M238,163 C238,205 300,218 350,237 M760,163 C760,207 700,218 650,237" fill="none" stroke="${blue}" stroke-width="3"/><rect x="201" y="225" width="598" height="190" rx="18" fill="${pale}" stroke="${blue}" stroke-width="2"/>`;
    const weaveY=mobile?369:272,weaveX=mobile?22:206,weaveW=mobile?316:588;
    for(let i=0;i<8;i++)body+=`<path d="M${weaveX},${weaveY+i*17}H${weaveX+weaveW}" stroke="#9bb5bd" stroke-width=".6"/>`;
    body+=text(mobile?41:225,mobile?334:247,'Reducer · declared merge rule',mobile?16:18,650);
  }else{
    body+=mobile?`<path d="M18,156H7V319H18 M180,278V297" stroke="${blue}" stroke-width="2" fill="none"/><rect x="18" y="297" width="324" height="44" fill="#fffdf8" stroke="${blue}"/><path d="M180,341V365" stroke="${blue}" stroke-width="2"/>`:`<path d="M238,163V184H500 M760,163V184H500V200" stroke="${blue}" stroke-width="2" fill="none"/><rect x="220" y="200" width="560" height="42" fill="#fffdf8" stroke="${blue}"/><path d="M500,242V268" stroke="${blue}" stroke-width="2"/>`;
    body+=text(mobile?32:237,mobile?324:227,'Reducer · declared merge rule',mobile?16:18,650);
  }
  const c=current;
  body+=sheet(c.x,c.y,c.w,c.h,family)+text(c.x+16,c.y+29,'CURRENT SNAPSHOT · E-204',mobile?16:19,700)+text(c.x+16,c.y+62,'Role',mobile?17:19)+text(c.x+(mobile?112:205),c.y+62,'Reviewer',mobile?20:23,700)+text(c.x+16,c.y+91,'Field provenance: O-02 from S-02',mobile?14:17)+text(c.x+16,c.y+119,'Prior O-01 remains retrievable',mobile?14:17);
  body+=mobile?`<path d="M180,${c.y+c.h+18}V558H94 M180,558H278" stroke="${blue}" fill="none"/>`:`<path d="M500,${c.y+c.h+16}V434H320 M500,434H680" stroke="${blue}" fill="none"/>`;
  const ry=mobile?574:453;
  body+=text(mobile?25:255,ry,'AG-01 reads',mobile?16:18,650)+text(mobile?205:615,ry,'AG-02 reads',mobile?16:18,650)+text(mobile?56:392,mobile?605:479,'The same entity snapshot',mobile?16:18);
  if(mobile)body+=text(18,661,'Older evidence remains; the rule selects.',14);
  return svg(w,h,body,`Neotoma ${family} illustration: distinguishable sources become observations; a declared reducer forms one current snapshot shared by agents, while history remains.`);
}
function svg(w,h,body,label){return `<svg role="img" aria-label="${label}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="font-family:system-ui,sans-serif"><title>${label}</title>${body}</svg>`;}
export function materialOverview(brand,family){
  const render=brand==='ateles'?ateles:neotoma;
  const caption=brand==='ateles'?(family==='textile'?'A continuing task ribbon; roles attach at defined steps.':'Separate workflow dockets; one task and draft identity continue.'):(family==='textile'?'Attributable source strands; a continuous current field surface.':'Distinct source impressions; a registered current field record.');
  return `<figure class="material-overview" data-family-diagram="${family}" style="margin:0 0 2rem;padding:1.2rem;background:#fff;border:1px solid var(--rule)"><div class="overview-desktop">${render(family,false)}</div><div class="overview-mobile">${render(family,true)}</div><figcaption style="font-size:.95rem;margin:.7rem 0 0">${caption} This labeled illustration is a visual explanation—not a product screenshot. The detailed model below keeps the full terminology and boundaries.</figcaption></figure>`;
}
