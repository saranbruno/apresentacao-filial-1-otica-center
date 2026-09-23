import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlan, isPositionClear } from './data.js';
import { buildStore } from './model.js';
for(const option of ['op1','op2']) {
 test(`${option}: áreas e divisão geométrica sem sobreposições`,()=>{
  const p=createPlan(option);assert.equal(p.rooms.length,6);assert.ok(Math.abs(p.rooms.reduce((s,r)=>s+r.area,0)-p.total)<1e-8);
  for(const r of p.rooms){assert.ok(Math.abs(r.w*r.d-r.area)<1e-8);assert.ok(r.w>0&&r.d>0);}
  for(let i=0;i<p.rooms.length;i++)for(let j=i+1;j<p.rooms.length;j++){const a=p.rooms[i],b=p.rooms[j];assert.ok(Math.min(a.x1,b.x1)<=Math.max(a.x0,b.x0)+1e-9||Math.min(a.z1,b.z1)<=Math.max(a.z0,b.z0)+1e-9);}
 });
 test(`${option}: modelo, móveis, cortes e descarte`,()=>{
  const s=buildStore(option);assert.equal(s.furniture['Mesa de atendimento'],option==='op1'?2:4);assert.ok(s.furniture['Armações ilustrativas']>=100);
  let meshes=0; s.root.traverse(o=>{if(o.isMesh){meshes++;assert.ok(o.geometry.getAttribute('position').count>0);}});assert.ok(meshes>30&&meshes<250,`meshes: ${meshes}`);
  for(const mode of ['overview','walk','top','exterior']){s.setView(mode);s.root.updateMatrixWorld(true);s.root.traverse(o=>assert.ok(o.matrixWorld.elements.every(Number.isFinite)));}
  let disposed=0;for(const g of s.assets.geometries)g.addEventListener('dispose',()=>disposed++);s.dispose();assert.equal(disposed,s.assets.geometries.size);s.dispose();assert.equal(disposed,s.assets.geometries.size);assert.equal(s.root.children.length,0);
 });
 test(option+': fachada, cobertura e entorno seguem a visibilidade de cada modo',()=>{
  const s=buildStore(option),o=s.outside;
  assert.equal(o.reference,17095);assert.equal(o.panels.length,4);
  for(const panel of o.panels){assert.equal(panel.scale.z,.007);assert.equal(panel.material.color.getHexString(),'ffffff');assert.equal(panel.castShadow,false);}
  assert.equal(o.materials.aluminum.color.getHexString(),'fafafa');
  for(const mode of ['exterior','walk','overview','top','exterior']){
   s.setView(mode);assert.equal(o.facade.visible,['exterior','walk'].includes(mode));assert.equal(o.site.visible,mode==='exterior');
   assert.ok(o.facade.children.length>10);assert.ok(o.site.children.length>10);
  }
  assert.throws(()=>s.setView('invalid'));s.dispose();
 });
 test(`${option}: percurso livre conecta entrada e todos os ambientes`,()=>{
  const s=buildStore(option),p=s.plan,step=.075,nx=Math.ceil(p.width/step),nz=Math.ceil(p.depth/step),seen=new Uint8Array(nx*nz),queue=[];
  const coords=i=>({x:-p.width/2+(i%nx+.5)*step,z:p.back+(Math.floor(i/nx)+.5)*step});
  const index=(x,z)=>Math.floor((z-p.back)/step)*nx+Math.floor((x+p.width/2)/step);
  const clear=i=>{const {x,z}=coords(i);return Math.abs(x)<p.width/2-.19&&z>p.back+.19&&z<p.front-.19&&isPositionClear(x,z,s.colliders,.19);};
  const start=index(0,p.front-.4);assert.ok(clear(start),'entrada livre');seen[start]=1;queue.push(start);
  for(let head=0;head<queue.length;head++){const i=queue[head],x=i%nx,z=Math.floor(i/nx);for(const j of [x>0?i-1:-1,x<nx-1?i+1:-1,z>0?i-nx:-1,z<nz-1?i+nx:-1])if(j>=0&&j<nx*nz&&!seen[j]&&clear(j)){seen[j]=1;queue.push(j);}}
  for(const [id,point] of Object.entries(s.walkPoints)){assert.ok(isPositionClear(point.x,point.z,s.colliders,.19),id+' ponto livre');assert.ok(seen[index(point.x,point.z)],id+' alcançável desde entrada');}s.dispose();
 });
}
test('opções inválidas rejeitadas e colisão com margem',()=>{assert.throws(()=>createPlan('other'));assert.equal(isPositionClear(0,0,[{x0:-1,x1:1,z0:-1,z1:1}]),false);assert.equal(isPositionClear(2,2,[{x0:-1,x1:1,z0:-1,z1:1}]),true);});