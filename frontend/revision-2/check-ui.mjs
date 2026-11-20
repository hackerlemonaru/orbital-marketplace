import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
process.env.PLAYWRIGHT_BROWSERS_PATH||='/home/user/.cache/ms-playwright';
process.env.TMPDIR||='/home/user/.tmp';
const base=process.argv[2]||'http://127.0.0.1:4174';const out=resolve(dirname(fileURLToPath(import.meta.url)),'../../screenshots');mkdirSync(out,{recursive:true});const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});let fail=0;
for(const path of ['/','/browse/','/licences/'])for(const width of [390,1440,1920]){
 const p=await browser.newPage({viewport:{width,height:900}});let errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await p.emulateMedia({reducedMotion:'reduce'});await p.goto(base+path,{waitUntil:'networkidle',timeout:30000});
 const result=await p.evaluate(()=>{const banned=/GiB|bucket|\bR2\b|quota|headroom|storage|Worker live|API live|health|GitHub raw|github_raw|link_only|Selected files|tge-assets|Preview unavailable/i;const all=[...document.querySelectorAll('*')];const glass=all.filter(e=>getComputedStyle(e).backdropFilter!=='none').length;const lum=(s)=>{let m=s.match(/\d+(?:\.\d+)?/g);if(!m)return 0;let rgb=m.slice(0,3).map(x=>Number(x)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]};return {overflow:document.documentElement.scrollWidth>innerWidth,glass,bright:[...document.querySelectorAll('section')].filter(e=>lum(getComputedStyle(e).backgroundColor)>.2).length,broken:[...document.images].filter(i=>i.complete&&!i.naturalWidth&&getComputedStyle(i).display!=='none').length,banned:document.body.innerText.match(banned)?.[0]||null}});
 const name=path==='/'?'home':path.split('/')[1];await p.screenshot({path:resolve(out,`rev2-current-${name}-${width}.jpg`),fullPage:true,type:'jpeg',quality:80});let bad=result.overflow||result.glass||result.bright||result.broken||result.banned||errors.length;console.log(bad?'FAIL':'PASS',path,width,JSON.stringify(result),'errors',errors.slice(0,3));if(bad)fail++;await p.close();
}
await browser.close();process.exit(fail?1:0);
