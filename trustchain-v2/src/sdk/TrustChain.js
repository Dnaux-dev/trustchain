function mean(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:0}
function std(a){if(a.length<2)return 0;const m=mean(a);return Math.sqrt(a.reduce((x,y)=>x+(y-m)**2,0)/a.length)}
function pct(a,p){if(!a.length)return 0;const s=[...a].sort((x,y)=>x-y),i=(p/100)*(s.length-1),l=Math.floor(i),h=Math.ceil(i);return s[l]+(s[h]-s[l])*(i-l)}
async function hashSig(s){const b=new TextEncoder().encode(JSON.stringify(s));const hb=await crypto.subtle.digest('SHA-256',b);return Array.from(new Uint8Array(hb)).map(x=>x.toString(16).padStart(2,'0')).join('')}
function extractFeatures(sig){
  const f=[]
  const holds=sig.keystrokes.map(k=>k.holdDuration).filter(h=>h&&h>0&&h<2000)
  f.push(mean(holds)||80,std(holds)||20,holds.length?[...holds].sort((a,b)=>a-b)[Math.floor(holds.length/2)]:80,pct(holds,25)||60,pct(holds,75)||100)
  const forces=sig.touchEvents.map(t=>t.force).filter(f=>f>0)
  const radii=sig.touchEvents.map(t=>(t.radiusX+t.radiusY)/2).filter(r=>r>0)
  f.push(mean(forces)||0.3,std(forces)||0.05,mean(radii)||10,std(radii)||2)
  const vels=sig.swipeEvents.map(s=>Math.abs(s.velocityY)).filter(v=>v>0)
  f.push(mean(vels)||0.5,vels.length?Math.max(...vels):1,std(vels)||0.2)
  const betas=sig.deviceMotion.map(m=>m.beta).filter(b=>b!=null)
  const gammas=sig.deviceMotion.map(m=>m.gamma).filter(g=>g!=null)
  f.push(mean(betas)||0,std(betas)||0.5,mean(gammas)||0,std(gammas)||0.5)
  const timings=Object.values(sig.fieldTimings)
  const durs=timings.filter(x=>x.focusTime&&x.blurTime&&x.blurTime>x.focusTime).map(x=>x.blurTime-x.focusTime)
  const pastes=timings.filter(x=>x.pasteDetected).length
  const keys=timings.reduce((a,x)=>a+(x.keyCount||0),0)
  f.push(mean(durs)||3000,std(durs)||500,pastes,keys)
  const ox=sig.tapOffsets.map(t=>Math.abs(t.offsetX))
  const oy=sig.tapOffsets.map(t=>Math.abs(t.offsetY))
  f.push(mean(ox)||5,std(ox)||2,mean(oy)||5,std(oy)||2)
  return f
}
function quality(sig){
  return ([
    Math.min(1,sig.keystrokes.length/5),
    Math.min(1,sig.touchEvents.length/3),
    Math.min(1,sig.swipeEvents.length/2),
    Math.min(1,sig.deviceMotion.length/10),
    Math.min(1,sig.tapOffsets.length/2),
  ].reduce((a,b)=>a+b,0)/5)
}
class TrustChainSDK{
  constructor(formId,userId){
    this.userId=userId;this.formId=formId;this.startTime=Date.now()
    this.signals={keystrokes:[],touchEvents:[],swipeEvents:[],deviceMotion:[],fieldTimings:{},tapOffsets:[]}
    this._ly=window.scrollY;this._lt=Date.now();this._ls=[];this._attach()
  }
  _on(t,e,h,o){t.addEventListener(e,h,o);this._ls.push({t,e,h})}
  _attach(){
    const form=document.getElementById(this.formId)
    this._on(document,'keydown',e=>{this.signals.keystrokes.push({key:e.key.length===1?'c':e.key,downTime:Date.now(),holdDuration:null})})
    this._on(document,'keyup',e=>{const k=e.key.length===1?'c':e.key;const x=[...this.signals.keystrokes].reverse().find(k2=>k2.key===k&&k2.holdDuration===null);if(x)x.holdDuration=Date.now()-x.downTime})
    if(form){
      this._on(form,'touchstart',e=>{const t=e.touches[0];this.signals.touchEvents.push({force:t.force||0,radiusX:t.radiusX||0,radiusY:t.radiusY||0,timestamp:Date.now()});if(e.target){const r=e.target.getBoundingClientRect();this.signals.tapOffsets.push({targetId:e.target.id||e.target.tagName,offsetX:t.clientX-(r.left+r.width/2),offsetY:t.clientY-(r.top+r.height/2),timestamp:Date.now()})}},{passive:true})
    }
    this._on(window,'scroll',()=>{const now=Date.now();const dY=window.scrollY-this._ly;const dt=now-this._lt;if(dt>0)this.signals.swipeEvents.push({deltaY:dY,velocityY:dY/dt,timestamp:now});this._ly=window.scrollY;this._lt=now},{passive:true})
    this._on(window,'deviceorientation',e=>{const last=this.signals.deviceMotion[this.signals.deviceMotion.length-1];if(!last||Date.now()-last.timestamp>100)this.signals.deviceMotion.push({alpha:e.alpha?+e.alpha.toFixed(2):null,beta:e.beta?+e.beta.toFixed(2):null,gamma:e.gamma?+e.gamma.toFixed(2):null,timestamp:Date.now()})})
    if(form){form.querySelectorAll('input,select,textarea').forEach(inp=>{const name=inp.name||inp.id||'f';this.signals.fieldTimings[name]={focusTime:null,blurTime:null,keyCount:0,pasteDetected:false};this._on(inp,'focus',()=>{this.signals.fieldTimings[name].focusTime=Date.now()});this._on(inp,'blur',()=>{this.signals.fieldTimings[name].blurTime=Date.now()});this._on(inp,'keypress',()=>{this.signals.fieldTimings[name].keyCount++});this._on(inp,'paste',()=>{this.signals.fieldTimings[name].pasteDetected=true})})}
  }
  async collect(){
    const features=extractFeatures(this.signals)
    const q=quality(this.signals)
    const signalHash=await hashSig({kc:this.signals.keystrokes.length,tc:this.signals.touchEvents.length,mc:this.signals.deviceMotion.length,sd:Date.now()-this.startTime,ts:new Date().toISOString()})
    return {userId:this.userId,sessionDuration:Date.now()-this.startTime,signalHash,quality:q,signals:{...this.signals,extractedFeatures:features},collectedAt:new Date().toISOString()}
  }
  destroy(){this._ls.forEach(({t,e,h})=>t.removeEventListener(e,h));this._ls=[]}
}
export default TrustChainSDK
