import {spawnSync} from 'node:child_process';
import {root,generator} from './paths.mjs';
const run=(args,cwd)=>{const r=spawnSync(process.execPath,args,{cwd,stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);};
run(['scripts/build-pages.mjs'],root);
run(['scripts/check.mjs'],root);
run(['--test','tests/port.test.mjs'],root);
run(['--test','motion-player.test.mjs','motion-semantic.test.mjs','authored-layer-scene.test.mjs','authored-integration.test.mjs','section-reveals.test.mjs','technical-ia.test.mjs','oct9-ui.test.mjs'],generator);
