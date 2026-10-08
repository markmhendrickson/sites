import {build} from 'esbuild';
import {mkdir,copyFile,writeFile} from 'node:fs/promises';
await mkdir('build-assets/server',{recursive:true});
await build({entryPoints:['worker.mjs'],outfile:'build-assets/server/index.js',bundle:true,format:'esm',platform:'neutral',target:'es2022',legalComments:'none'});
await build({entryPoints:['verification-worker.mjs'],outfile:'build-assets/server/synthetic-index.js',bundle:true,format:'esm',platform:'neutral',target:'es2022',legalComments:'none'});
await build({entryPoints:['client-entry.mjs'],outfile:'build-assets/waitlist-client.mjs',bundle:true,format:'esm',platform:'browser',target:'es2022',legalComments:'none'});
await build({entryPoints:['verification-client-entry.mjs'],outfile:'build-assets/waitlist-verification-client.mjs',bundle:true,format:'esm',platform:'browser',target:'es2022',legalComments:'none'});
await copyFile('form.css','build-assets/waitlist-form.css');
await writeFile('build-assets/ready-state.json',JSON.stringify({prepared:true,registrationLive:false,retentionTriggerVerified:false,privacyRemovalVerified:false,publicRelease:false,syntheticOnly:true,workerEntry:'server/index.js',staticDelegate:'env.ASSETS.fetch'},null,2));
