import { createServer } from 'vite';
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const here=dirname(fileURLToPath(import.meta.url));
const root=resolve(here,'..');
process.env.PLAYWRIGHT_BROWSERS_PATH ||= '/home/user/.cache/ms-playwright';
process.env.TMPDIR ||= '/home/user/.tmp';
const featured=process.argv[2] ? [{slug:process.argv[2]}] : JSON.parse(readFileSync(resolve(here,'featured.json'),'utf8'));
const server=await createServer({root,configFile:false,logLevel:'error',server:{host:'127.0.0.1',port:5188,strictPort:true}});
await server.listen();
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=swiftshader','--enable-unsafe-swiftshader']});
try{
 for(const item of featured){
  const page=await browser.newPage({viewport:{width:512,height:512}});
  const url=new URL('/revision-2/render-showcase.html','http://127.0.0.1:5188/');
  url.searchParams.set('model',`/revision-2/public/showcase/${item.slug}/preview.glb`);
  await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.__READY__,null,{timeout:60000});
  const err=await page.evaluate(()=>window.__ERROR__||'');if(err)throw Error(`${item.slug}: ${err}`);
  const png=resolve(here,'public','showcase',item.slug,'render.png');const webp=resolve(here,'public','showcase',item.slug,'render.webp');
  await page.screenshot({path:png,omitBackground:true,timeout:45000});
  const result=spawnSync('python3',['-c','from PIL import Image; import sys; Image.open(sys.argv[1]).save(sys.argv[2],"WEBP",quality=90,method=6)',png,webp],{encoding:'utf8'});
  if(result.status!==0)throw Error(result.stderr);
  console.log('rendered',item.slug);
  await page.close();
 }
}finally{await browser.close();await server.close()}
