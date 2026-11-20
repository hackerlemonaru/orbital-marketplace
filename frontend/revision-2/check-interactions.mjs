import {chromium} from 'playwright';
import {readFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
process.env.PLAYWRIGHT_BROWSERS_PATH||='/home/user/.cache/ms-playwright';
process.env.TMPDIR||='/home/user/.tmp';
const root=dirname(fileURLToPath(import.meta.url));const base=process.argv[2]||'http://127.0.0.1:4174';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1440,height:900},acceptDownloads:true});const errors=[];const requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('request',r=>requests.push(r.url()));
function assert(ok,message){if(!ok)throw Error(message);console.log('PASS',message)}
try {
 await page.goto(base+'/',{waitUntil:'networkidle'});await page.keyboard.press('Control+k');await page.getByRole('dialog',{name:'Search'}).waitFor({state:'visible',timeout:10000});assert(await page.getByRole('dialog',{name:'Search'}).isVisible(),'keyboard search opens');await page.locator('#global-search').fill('Toy Car');await page.locator('#global-search').press('Enter');await page.waitForURL(/\/browse\/\?q=/);assert(new URL(page.url()).searchParams.get('q')==='Toy Car','search navigates to Browse deep link');
 await page.locator('.result-scroll .card').first().click();await page.locator('.asset-window').waitFor({state:'visible',timeout:10000});assert(await page.locator('.asset-window').isVisible(),'asset window opens');assert(new URL(page.url()).searchParams.has('asset'),'asset deep link updated');await page.keyboard.press('Escape');await page.waitForTimeout(500);assert(!(await page.locator('.asset-window').count()),'Escape closes asset window');
 await page.locator('#global-search').count();await page.locator('.input-search input').fill('');await page.waitForFunction(()=>document.querySelectorAll('.result-scroll .card').length>1,{timeout:10000});await page.locator('.result-scroll .card').first().click();await page.locator('.asset-window').waitFor({state:'visible'});const old=await page.locator('#asset-title').innerText();await page.keyboard.press('ArrowRight');await page.waitForFunction(oldName=>document.querySelector('#asset-title')?.textContent!==oldName,old,{timeout:10000});assert((await page.locator('#asset-title').innerText())!==old,'arrow key moves between assets');await page.keyboard.press('Escape');
 await page.getByLabel('Show all assets').check();await page.getByLabel('Search assets').fill('sarthak hungry penguin 30');await page.waitForTimeout(400);await page.locator('.result-scroll .card').first().click();const download=page.waitForEvent('download',{timeout:30000});await page.getByRole('button',{name:'Download ↓'}).click();const file=await download;const bytes=readFileSync(await file.path());const {unzipSync}=await import('fflate');const files=unzipSync(bytes);assert(Object.keys(files).some(x=>x.endsWith('.html'))&&!!files['CREDITS.txt']&&!!files['LICENSE.md'],'archive entry is verified and packaged with credits and licence');await page.keyboard.press('Escape');
 await page.getByLabel('Search assets').fill('');await page.waitForTimeout(400);
 const frames=await page.locator('.result-scroll').evaluate(async el=>{const gaps=[];const start=performance.now();let last=start;return await new Promise(resolve=>{function step(t){gaps.push(t-last);last=t;el.scrollTop=Math.min(el.scrollHeight-el.clientHeight,(t-start)*8);if(t-start<2500)requestAnimationFrame(step);else resolve(gaps.slice(1))}requestAnimationFrame(step)})});
 const fps=1000/(frames.reduce((a,b)=>a+b,0)/frames.length);const slow=frames.filter(x=>x>25).length;console.log(`Observed virtual grid scroll: ${fps.toFixed(1)} fps; ${slow}/${frames.length} frames over 25 ms (headless measurement, not a device guarantee)`);
 assert(fps>=59,'virtual grid scroll is approximately 60 fps in this sample');
 assert(!requests.some(url=>new URL(url).pathname==='/health'),'UI does not request the status endpoint');
 if(errors.length)console.error('Page errors:',errors);
 assert(!errors.length,'no uncaught page errors');
 const html=readFileSync(resolve(root,'dist/index.html'),'utf8');const js=html.match(/src="(\/assets\/boot-[^"]+\.js)"/)?.[1];if(!js)throw Error('Initial script missing');const gz=gzipSync(readFileSync(resolve(root,'dist',js.slice(1)))).length;console.log(`Initial application JS: ${(gz/1024).toFixed(1)} KiB gzip`);assert(gz<200*1024,'initial application JS below 200 KiB gzip');
} finally {await browser.close()}
