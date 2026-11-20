import '../tokens.css';
import './styles.css';

// The server-rendered landing page contains usable links without JavaScript.
// Hydrate interactive islands on intent; app-style routes hydrate immediately.
let hydrated=false;
let pending:Promise<unknown>|undefined;
function hydrate(){
  if(!pending)pending=new Promise<void>((resolve,reject)=>{window.addEventListener('orbital-ready',()=>{hydrated=true;resolve()},{once:true});import('./main').catch(reject)});
  return pending;
}
if(location.pathname!=='/' || location.search) {
  void hydrate();
} else {
  document.addEventListener('pointerover',event=>{
    if((event.target as Element)?.closest?.('button'))void hydrate();
  },{passive:true});
  document.addEventListener('focusin',()=>{void hydrate()},{once:true,passive:true});
  document.addEventListener('wheel',()=>{void hydrate()},{once:true,passive:true});
  document.addEventListener('touchstart',()=>{void hydrate()},{once:true,passive:true});
  document.addEventListener('click',event=>{
    if(hydrated)return;
    const button=(event.target as Element)?.closest?.('button');
    if(!button)return;
    event.preventDefault();event.stopImmediatePropagation();
    void hydrate().then(()=>button.click());
  },true);
  document.addEventListener('keydown',event=>{
    if(hydrated)return;
    if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){
      event.preventDefault();event.stopImmediatePropagation();
      void hydrate().then(()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'k',metaKey:event.metaKey,ctrlKey:event.ctrlKey,bubbles:true})));
    }else void hydrate();
  },true);
}
