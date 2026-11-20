import {createServer} from 'vite';
import {readFileSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
const server=await createServer({root,configFile:resolve(root,'vite.config.mjs'),server:{middlewareMode:true},appType:'custom',logLevel:'error'});
try{
 globalThis.location={pathname:'/',search:'',href:'http://localhost/'};
 const React=await import('react');
 const {renderToString}=await import('react-dom/server');
 const {App}=await server.ssrLoadModule('/src/main.tsx');
 const html=renderToString(React.createElement(App));
 const file=resolve(root,'dist/index.html');
 let doc=readFileSync(file,'utf8');
 if(!doc.includes('<div id="root"></div>'))throw Error('Missing root');
 // The compact local stylesheet is inlined only on the server-rendered landing
 // page, eliminating one render-blocking request while retaining the same CSS.
 doc=doc.replace(/<link rel="stylesheet" crossorigin href="(\/assets\/[^\"]+\.css)">/,(_match,cssPath)=>`<style>${readFileSync(resolve(root,'dist',cssPath.slice(1)),'utf8')}</style>`);
 writeFileSync(file,doc.replace('<div id="root"></div>',`<div id="root">${html}</div>`));
 console.log('Prerendered landing page');
}finally{await server.close()}
