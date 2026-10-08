import {fileURLToPath} from 'node:url';
import {resolve,sep} from 'node:path';
export const root=fileURLToPath(new URL('../',import.meta.url));
export const generator=resolve(root,'shared/site/generator');
export function contained(base,path){const full=resolve(base,path);if(!full.startsWith(resolve(base)+sep))throw Error('Path escapes boundary');return full;}
