import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildStore } from './model.js';
import { createPlan, formatArea, isPositionClear } from './data.js';
const $=id=>document.getElementById(id), canvas=$('scene'), wrap=$('canvas-wrap');
const report=data=>{if(import.meta.env.DEV)fetch('/__render-health',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).catch(()=>{});};
let fatal=false;
function fail(error){fatal=true;$('loading').hidden=true;$('fatal-error').hidden=false;$('error-text').textContent='Verifique se a aceleração gráfica/WebGL está disponível. Detalhe: '+(error?.message||error);report({status:'error',message:String(error?.stack||error)});}
window.addEventListener('error',e=>fail(e.error||e.message));window.addEventListener('unhandledrejection',e=>fail(e.reason));
let toastTimer;function toast(text){$('toast').textContent=text;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3600);}
const icons={cube:'M12 3 3 8v9l9 5 9-5V8Z M3 8l9 5 9-5 M12 13v9',plan:'M3 3h18v18H3Z M3 12h18 M12 12v9',walk:'M13 4h.01 M10 8l3-1 3 5 4 1 M12 8l-2 6-5 6 M10 14l5 3 1 5 M10 9l-4 3-3-1',sun:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v2 M12 20v2 M2 12h2 M20 12h2 M5 5l1 1 M18 18l1 1 M19 5l-1 1 M6 18l-1 1',camera:'M3 7h4l2-3h6l2 3h4v14H3Z M12 10a4 4 0 1 0 0 8 4 4 0 0 0 0-8',expand:'M3 9V3h6 M15 3h6v6 M21 15v6h-6 M9 21H3v-6',pin:'M12 22S4 14 4 9a8 8 0 0 1 16 0c0 5-8 13-8 13 M12 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6',file:'M5 2h9l5 5v15H5Z M14 2v6h5 M8 12h8 M8 16h8',play:'m8 4 13 8-13 8Z',menu:'M3 6h18 M3 12h18 M3 18h18',mouse:'M8 3h8l3 4v10l-3 4H8l-3-4V7Z M12 3v7'};
for(const el of document.querySelectorAll('[data-icon]'))el.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[el.dataset.icon]||icons.cube}"/></svg>`;
report({status:'initializing'});
try { init(); } catch(e){fail(e);}
function init(){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 renderer.debug.onShaderError=(gl,program)=>fail(new Error('Shader: '+gl.getProgramInfoLog(program)));
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fail(new Error('Contexto WebGL interrompido. Recarregue a apresentação.'));});
 const scene=new T.Scene();scene.background=new T.Color('#e9e7df');
 const camera=new T.PerspectiveCamera(39,1,.06,150);camera.position.set(12,13,16);
 const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.08;controls.maxPolarAngle=Math.PI*.48;controls.minDistance=3;controls.maxDistance=35;controls.target.set(0,0,0);controls.update();
 const pmrem=new T.PMREMGenerator(renderer),envScene=new RoomEnvironment(),environment=pmrem.fromScene(envScene,.04);scene.environment=environment.texture;scene.environmentIntensity=.45;envScene.dispose();pmrem.dispose();
 const hemi=new T.HemisphereLight('#fff5df','#a0a794',2);scene.add(hemi);
 const sun=new T.DirectionalLight('#fff2d6',3.2);sun.position.set(-4,13,9);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:.5,far:35});sun.shadow.normalBias=.04;sun.shadow.bias=-.0001;sun.shadow.camera.updateProjectionMatrix();scene.add(sun);
 const fill=new T.DirectionalLight('#d8e6ec',1.1);fill.position.set(7,8,-6);scene.add(fill);
 const ground=new T.Mesh(new T.PlaneGeometry(150,150),new T.MeshStandardMaterial({color:'#e5e3da',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.38;ground.receiveShadow=true;scene.add(ground);
 let store,mode='overview',option='op2',labels=true,night=false,selected=null,tween=null,hotspots=[],frames=0,healthSent=false;
 let tour=-1,tourTime=0,tourPaused=false,yaw=0,pitch=0,drag=null;const keys=new Set();
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let lastWidth=0,lastHeight=0;
 function resize(){const w=wrap.clientWidth,h=wrap.clientHeight;if(!w||!h)return;const reframe=!lastWidth||Math.abs(w/h-lastWidth/lastHeight)>.25;lastWidth=w;lastHeight=h;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();if(store&&mode!=='walk'&&reframe&&tour<0){if(mode==='exterior')exteriorCamera(false,true);else overall(mode==='top',true);}healthSent=false;}
 const observer=new ResizeObserver(resize);observer.observe(wrap);resize();
 function transition(position,target,immediate=false){if(immediate||reduced){camera.position.copy(position);controls.target.copy(target);camera.lookAt(target);tween=null;return;}tween={from:camera.position.clone(),to:position.clone(),start:controls.target.clone(),target:target.clone(),time:0};}
 function overall(top=false,immediate=false){const d=Math.max(store.plan.depth,store.plan.width),aspect=camera.aspect;const dist=d*(aspect<.9?2.4:1.6);const p=top?new T.Vector3(0,dist*1.10,.01):new T.Vector3(dist*.68,dist*.73,dist*.89);const target=new T.Vector3(0,.1,0),probe=camera.clone();
  for(let attempt=0;attempt<18;attempt++){probe.position.copy(p);probe.lookAt(target);probe.updateMatrixWorld();let fit=true;for(const x of [-(store.plan.width+.5)/2,(store.plan.width+.5)/2])for(const y of [-.4,2.9])for(const z of [-(store.plan.depth+.5)/2,(store.plan.depth+.5)/2]){const v=new T.Vector3(x,y,z).project(probe);if(Math.abs(v.x)>.88||Math.abs(v.y)>.69)fit=false;}if(fit)break;p.sub(target).multiplyScalar(1.08).add(target);}
  transition(p,target,immediate);}

 function exteriorCamera(frontal=false,immediate=false){
  const target=new T.Vector3(0,frontal?1.65:1.35,store.plan.front-(frontal?0:1.5));
  const p=target.clone().add(frontal?new T.Vector3(0,.05,16):new T.Vector3(4.3,3.25,18));
  const probe=camera.clone(),b=store.outside.bounds;
  for(let i=0;i<24;i++){probe.position.copy(p);probe.lookAt(target);probe.updateMatrixWorld();let fits=true;
   for(const x of [b.min[0],b.max[0]])for(const y of [b.min[1],b.max[1]])for(const z of [b.min[2],b.max[2]]){const v=new T.Vector3(x,y,z).project(probe);if(Math.abs(v.x)>.88||Math.abs(v.y)>.67||v.z>1)fits=false;}
   if(fits)break;p.sub(target).multiplyScalar(1.09).add(target);
  }
  transition(p,target,immediate);
 }
 function roomCamera(id,immediate=false){const r=store.plan.rooms.find(r=>r.id===id);if(mode==='walk'){const p=store.walkPoints[id];camera.position.set(p.x,1.62,p.z);yaw=0;pitch=-.05;camera.rotation.set(pitch,yaw,0,'YXZ');return;}const dist=Math.max(r.w,r.d)*1.15+2.3;transition(new T.Vector3(r.x+dist*.45,dist*.80,r.z+dist*.70),new T.Vector3(r.x,.35,r.z),immediate);}
 function setMode(next,immediate=false){if(!['overview','top','walk','exterior'].includes(next))throw new Error('Vista desconhecida');keys.clear();mode=next;tween=null;store.setView(mode);controls.enabled=mode!=='walk';controls.enableRotate=mode!=='top';controls.maxDistance=90;controls.minDistance=mode==='exterior'?7:3;camera.up.set(0,1,0);$('walk-pad').hidden=mode!=='walk';$('exterior-actions').hidden=mode!=='exterior';$('labels-button').disabled=mode==='exterior';if(mode==='exterior')$('detail-card').hidden=true;for(const btn of document.querySelectorAll('[data-view]')){const on=btn.dataset.view===mode;btn.classList.toggle('active',on);btn.setAttribute('aria-pressed',String(on));}
  $('view-title').textContent={overview:'O espaço, por inteiro.',top:'Cada ambiente, em perspectiva.',walk:'Entre. Explore. Imagine.',exterior:'A primeira impressão.'}[mode];$('view-caption').textContent=mode==='exterior'?'ACM amarelo · letreiro azul/branco · referência 17095':mode==='walk'?'Arraste para olhar · W A S D / setas para caminhar':'Estudo conceitual · disposição ilustrativa';$('interaction-hint').textContent=mode==='walk'?'Arraste para olhar · W A S D / setas · Esc para sair':'Arraste para girar · scroll para aproximar';
  if(mode==='walk'){roomCamera(selected||'sales',true);canvas.focus();}else if(mode==='exterior')exteriorCamera(false,immediate);else overall(mode==='top',immediate);
 }
 function showRoom(id,focus=true){if(mode==='exterior')setMode('overview',true);selected=id;const r=store.plan.rooms.find(r=>r.id===id);$('detail-card').hidden=tour>=0;$('detail-kicker').textContent=formatArea(r.area)+' m² / REFERÊNCIA';$('detail-title').textContent=r.name;$('detail-text').textContent=r.text;$('detail-items').textContent=r.items;$('detail-source').textContent=r.source;document.querySelectorAll('.room-button').forEach(b=>b.classList.toggle('selected',b.dataset.room===id));if(focus)roomCamera(id);$('sidebar').classList.remove('mobile-visible');}
 function populate(){ $('room-list').replaceChildren();$('hotspots').replaceChildren();hotspots=[];store.plan.rooms.forEach((r,i)=>{const button=document.createElement('button');button.className='room-button';button.dataset.room=r.id;button.innerHTML=`<span class="room-number">0${i+1}</span><span class="room-name">${r.short}</span><span class="room-area">${formatArea(r.area)} m²</span>`;button.onclick=()=>showRoom(r.id);$('room-list').append(button);const spot=document.createElement('button');spot.className='hotspot';spot.setAttribute('aria-label',r.name);spot.innerHTML=`<b>0${i+1}</b><span>${r.short}</span>`;spot.onclick=()=>showRoom(r.id);$('hotspots').append(spot);hotspots.push({el:spot,point:new T.Vector3(r.x,1.05,r.z)});});$('area-total').textContent=formatArea(store.plan.total);$('model-label').textContent=option.toUpperCase().replace('OP','OP.');document.querySelectorAll('[data-option]').forEach(b=>{b.classList.toggle('selected',b.dataset.option===option);b.setAttribute('aria-pressed',String(b.dataset.option===option));});}
 function changeModel(next){if(store){scene.remove(store.root);store.dispose();}option=next;store=buildStore(option);scene.add(store.root);selected=null;$('detail-card').hidden=true;populate();setMode(mode,true);healthSent=false;}
 changeModel('op2'); const tourStops=['exterior',null,'sales','lab','stock','reception','exam','bathroom'];
 function tourStep(index){
 tour=(index+tourStops.length)%tourStops.length;tourTime=0;
 $('tour-count').textContent=String(tour+1).padStart(2,'0')+' / '+String(tourStops.length).padStart(2,'0');
 const id=tourStops[tour];
 if(id==='exterior'){
  setMode('exterior',true);$('tour-title').textContent='A chegada à Ótica Center.';
  $('tour-text').textContent='ACM amarelo, azul e branco no letreiro e vitrines em vidro incolor: referências do memorial 17095. Dimensões, tons e tipografia ainda conceituais.';
 }else{
  if(mode!=='overview')setMode('overview',true);
  if(id){const r=store.plan.rooms.find(r=>r.id===id);$('tour-title').textContent=r.name;$('tour-text').textContent=r.text;roomCamera(id);}
  else{$('tour-title').textContent='Uma nova perspectiva.';$('tour-text').textContent=formatArea(store.plan.total)+' m² de referência. Seis ambientes, uma experiência integrada. Implantação conceitual baseada no HiperManual.';overall();}
 }
 }
 function startTour(){document.body.classList.add('touring');$('detail-card').hidden=true;$('tour-card').hidden=false;tourPaused=reduced;$('tour-pause').textContent=tourPaused?'Continuar':'Pausar';resize();setMode('overview',true);tourStep(0);}
 function stopTour(){tour=-1;document.body.classList.remove('touring');$('tour-card').hidden=true;resize();setMode('overview');}
 $('present-button').onclick=()=>tour<0?startTour():stopTour();$('tour-close').onclick=stopTour;$('tour-next').onclick=()=>tourStep(tour+1);$('tour-prev').onclick=()=>tourStep(tour-1);$('tour-pause').onclick=()=>{tourPaused=!tourPaused;$('tour-pause').textContent=tourPaused?'Continuar':'Pausar';};
 document.querySelectorAll('[data-option]').forEach(b=>b.onclick=()=>{if(tour>=0)stopTour();changeModel(b.dataset.option);});
 document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{if(tour>=0)stopTour();setMode(b.dataset.view);});
 $('detail-close').onclick=()=>{$('detail-card').hidden=true;selected=null;document.querySelectorAll('.room-button').forEach(b=>b.classList.remove('selected'));};
 document.querySelector('.brand').onclick=e=>{e.preventDefault();if(tour>=0)stopTour();setMode('overview');$('detail-card').hidden=true;};
 $('labels-button').onclick=()=>{labels=!labels;$('labels-button').setAttribute('aria-pressed',String(labels));};
 $('light-button').onclick=()=>{night=!night;$('light-button').setAttribute('aria-pressed',String(night));$('light-label').textContent=night?'Luz de apresentação':'Luz natural';hemi.intensity=night?1.1:2;sun.intensity=night?1.5:3.2;fill.intensity=night?1.5:1.1;renderer.toneMappingExposure=night?1.05:1.15;scene.background.set(night?'#c8ccbf':'#e9e7df');};

 $('exterior-front').onclick=()=>exteriorCamera(true);
 $('exterior-enter').onclick=()=>{if(tour>=0)stopTour();selected='sales';setMode('walk',true);camera.position.set(0,1.62,store.plan.front-.55);yaw=0;pitch=-.04;camera.rotation.set(pitch,yaw,0,'YXZ');};
 $('mobile-sidebar').onclick=()=>$('sidebar').classList.toggle('mobile-visible');
 $('fullscreen-button').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('Tela cheia não está disponível neste painel.');}};
 const dialog=$('sources-dialog');for(const id of ['sources-button','sources-small'])$(id).onclick=()=>{keys.clear();dialog.showModal();};for(const id of ['sources-close','sources-done'])$(id).onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
 const p1=createPlan('op1'),p2=createPlan('op2');$('source-table').innerHTML=p1.rooms.map((r,i)=>`<tr><td>${r.official}</td><td>${formatArea(r.area)} m²</td><td>${formatArea(p2.rooms[i].area)} m²</td></tr>`).join('')+`<tr><td><b>Total</b></td><td><b>73,08 m²</b></td><td><b>83,43 m²</b></td></tr>`;
 $('capture-button').onclick=()=>{try{renderer.render(scene,camera);const out=document.createElement('canvas');out.width=canvas.width;out.height=canvas.height+110;const c=out.getContext('2d');c.drawImage(canvas,0,0);c.fillStyle='#f7f6f2';c.fillRect(0,canvas.height,out.width,110);c.fillStyle='#343c35';c.font='bold 19px Segoe UI';c.fillText(`ÓTICA CENTER / ESTUDO 3D — ${option.toUpperCase()}`,24,canvas.height+34);c.font='13px Segoe UI';c.fillText('CONCEITUAL · NÃO HOMOLOGADO · NÃO É PROJETO EXECUTIVO',24,canvas.height+60);c.fillText('Áreas: HiperManual 17178. Móveis: referência 17190. Fachada: 17095. Implantação conceitual.',24,canvas.height+83,out.width-48);out.toBlob(blob=>{if(!blob){toast('Não foi possível gerar a imagem.');return;}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`otica-center-conceito-${option}-${mode}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);toast('Imagem gerada com identificação do estudo conceitual.');});}catch(e){toast('Falha ao gerar imagem: '+e.message);}};
 // Caminhada: colisão em X/Z, velocidade limitada e look por arraste.
 const bindings={KeyW:'forward',ArrowUp:'forward',KeyS:'back',ArrowDown:'back',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right'};
 window.addEventListener('keydown',e=>{if(e.code==='Escape'&&!dialog.open){if(tour>=0)stopTour();else if(mode==='walk')setMode('overview');return;}if(mode==='walk'&&!dialog.open&&bindings[e.code]){e.preventDefault();keys.add(bindings[e.code]);}});
 window.addEventListener('keyup',e=>{if(bindings[e.code])keys.delete(bindings[e.code]);});window.addEventListener('blur',()=>{keys.clear();drag=null;});document.addEventListener('visibilitychange',()=>{keys.clear();drag=null;});
 canvas.addEventListener('pointerdown',e=>{tween=null;if(mode==='walk'){drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);}});
 canvas.addEventListener('pointermove',e=>{if(mode!=='walk'||!drag||drag.id!==e.pointerId)return;yaw-=(e.clientX-drag.x)*.004;pitch=T.MathUtils.clamp(pitch-(e.clientY-drag.y)*.004,-1.2,1.2);drag.x=e.clientX;drag.y=e.clientY;camera.rotation.set(pitch,yaw,0,'YXZ');});
 const endDrag=()=>drag=null;canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);
 for(const b of document.querySelectorAll('[data-move]')){b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.move);});for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>keys.delete(b.dataset.move));}
 function move(dt){let forward=Number(keys.has('forward'))-Number(keys.has('back')),side=Number(keys.has('right'))-Number(keys.has('left'));const len=Math.hypot(forward,side);if(!len)return;forward/=len;side/=len;const speed=dt*1.55,dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*side)*speed,dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*side)*speed;const p=store.plan;const clear=(x,z)=>Math.abs(x)<p.width/2-.22&&z>p.back+.22&&z<p.front-.22&&isPositionClear(x,z,store.colliders,.19);if(clear(camera.position.x+dx,camera.position.z))camera.position.x+=dx;if(clear(camera.position.x,camera.position.z+dz))camera.position.z+=dz;}
 const projected=new T.Vector3();let last=performance.now();const frameTimes=[];
 function animate(now){if(fatal)return;const elapsed=now-last,lastDt=Math.min(elapsed/1000,.05);last=now;if(frames>10&&frameTimes.length<120)frameTimes.push(elapsed);
  if(tween){tween.time+=lastDt;let t=Math.min(1,tween.time/.95);t=t*t*(3-2*t);camera.position.lerpVectors(tween.from,tween.to,t);controls.target.lerpVectors(tween.start,tween.target,t);if(t>=1)tween=null;}
  if(mode==='walk'&&!dialog.open)move(lastDt);else if(mode!=='walk')controls.update();
  if(tour>=0&&!tourPaused&&!dialog.open&&!document.hidden){tourTime+=lastDt;$('tour-progress-bar').style.width=Math.min(100,tourTime/9*100)+'%';if(tourTime>9)tourStep(tour+1);}
  renderer.render(scene,camera);frames++;
  for(const h of hotspots){projected.copy(h.point).project(camera);h.el.hidden=!labels||mode==='walk'||mode==='exterior'||tour>=0||projected.z>1||projected.z< -1||Math.abs(projected.x)>1||Math.abs(projected.y)>1;h.el.style.left=(projected.x*.5+.5)*wrap.clientWidth+'px';h.el.style.top=(-projected.y*.5+.5)*wrap.clientHeight+'px';}
  if(frames===2)$('loading').hidden=true;
  if(frames>12&&!healthSent){healthSent=true;const gl=renderer.getContext(),pixels=new Uint8Array(4),samples=[];for(const [x,y] of [[.5,.5],[.35,.45],[.62,.6],[.5,.7],[.25,.3]]){gl.readPixels(Math.floor(canvas.width*x),Math.floor(canvas.height*y),1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixels);samples.push([...pixels]);}const glError=gl.getError();const data={...window.__storeDiagnostics,status:glError===0?'rendered':'webgl-error',option,mode,frames,canvas:[canvas.width,canvas.height],drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,pixelSamples:samples,glError,furniture:store.furniture,rooms:store.plan.rooms.length,conceptual:true};window.__storeDiagnostics=data;report(data);}
  requestAnimationFrame(animate);
 }
 requestAnimationFrame(animate);
 // Primeiro quadro síncrono: a prévia integrada pode iniciar em uma aba oculta,
 // onde requestAnimationFrame fica suspenso. O render inicial não depende dele.
 renderer.render(scene,camera);
 $('loading').hidden=true;
 if(import.meta.env.DEV){
  const checks=[];const assert=(ok,name)=>{checks.push({name,ok:!!ok});if(!ok)throw new Error('Validação de interface: '+name);};
  const gl=renderer.getContext();
  for(const op of ['op1','op2']){
   document.querySelector(`[data-option="${op}"]`).click();
   assert(option===op&&store.plan.rooms.length===6,op+' seleção de modelo');
   for(const view of ['overview','top','exterior','walk']){document.querySelector(`[data-view="${view}"]`).click();setMode(view,true);renderer.render(scene,camera);assert(mode===view&&gl.getError()===0,op+' render '+view);}
   for(const r of store.plan.rooms){document.querySelector(`[data-room="${r.id}"]`).click();assert(isPositionClear(camera.position.x,camera.position.z,store.colliders,.19),op+' acesso '+r.id);}
  }
  setMode('exterior',true);assert(store.outside.site.visible&&store.outside.facade.visible,'envoltória exterior visível');
  $('exterior-front').click();exteriorCamera(true,true);controls.update();renderer.render(scene,camera);assert(mode==='exterior'&&gl.getError()===0,'vista frontal');
  $('exterior-enter').click();assert(mode==='walk'&&!store.outside.site.visible&&isPositionClear(camera.position.x,camera.position.z,store.colliders,.19),'entrada da fachada para o interior');
  setMode('exterior',true);document.querySelector('[data-room="lab"]').click();assert(mode==='overview'&&!store.outside.site.visible,'seleção de ambiente sai da vista externa');
  $('sources-button').click();assert(dialog.open&&$('source-table').children.length===7,'fontes e áreas');$('sources-close').click();
  $('light-button').click();assert(night,'iluminação');$('light-button').click();
  $('labels-button').click();assert(!labels,'legendas');$('labels-button').click();
  $('present-button').click();assert(tour===0&&mode==='exterior'&&!$('tour-card').hidden,'início do tour pela fachada');$('tour-next').click();assert(tour===1,'próximo ponto do tour');$('tour-prev').click();assert(tour===0,'ponto anterior');$('tour-close').click();assert(tour===-1,'encerrar tour');
  changeModel('op2');setMode('overview',true);$('detail-card').hidden=true;resize();renderer.render(scene,camera);
  const viewportChecks=[];
  for(const op of ['op1','op2'])for(const [w,h] of [[1280,800],[375,720]])for(const view of ['overview','exterior']){
   changeModel(op);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();setMode(view,true);controls.update();renderer.render(scene,camera);
   const b=view==='exterior'?store.outside.bounds:{min:[-store.plan.width/2,0,store.plan.back],max:[store.plan.width/2,2.8,store.plan.front]};let inFrame=true;
   for(const x of [b.min[0],b.max[0]])for(const y of [b.min[1],b.max[1]])for(const z of [b.min[2],b.max[2]]){const p=new T.Vector3(x,y,z).project(camera);if(Math.abs(p.x)>1||Math.abs(p.y)>1||p.z>1)inFrame=false;}
   assert(inFrame&&gl.getError()===0,op+' '+view+' enquadramento '+w+'×'+h);viewportChecks.push({option:op,mode:view,width:w,height:h,inFrame});
  }
  changeModel('op2');setMode('overview',true);
  if(wrap.clientWidth&&wrap.clientHeight){resize();overall(false,true);}else{renderer.setSize(960,640,false);camera.aspect=1.5;camera.updateProjectionMatrix();overall(false,true);}renderer.render(scene,camera);
  const pixel=new Uint8Array(4),samples=[];for(const [x,y] of [[.5,.5],[.35,.45],[.62,.6],[.5,.7],[.25,.3]]){gl.readPixels(Math.floor(canvas.width*x),Math.floor(canvas.height*y),1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);samples.push([...pixel]);}
  assert(new Set(samples.map(p=>p.join(','))).size>1,'pixels distintos no quadro');
  const diagnostic={status:'rendered',option,mode,canvas:[canvas.width,canvas.height],drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,pixelSamples:samples,glError:gl.getError(),checks,viewportChecks,furniture:store.furniture,conceptual:true,visibility:document.visibilityState};window.__storeDiagnostics=diagnostic;healthSent=true;report(diagnostic);
 }
 // Contrôle local, sans réseau externe, pour vérifier les mêmes commandes que l'interface.
 window.__storeReview={setMode,changeModel,showRoom,startTour,stopTour,getState:()=>({option,mode,tour,plan:store.plan,furniture:store.furniture,position:camera.position.toArray(),frames})};
}