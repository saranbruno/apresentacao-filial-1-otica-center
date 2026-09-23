import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createPlan } from './data.js';
import { buildExterior } from './exterior.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function buildStore(option='op2') {
 const plan=createPlan(option), root=new T.Group(); root.name='Ótica Center — estudo conceitual';
 const colliders=[], walls=[], exterior=[], ceiling=new T.Group(), glassParts=[], spectacles=[];
 root.add(ceiling); const furniture={}; const assets={geometries:new Set(),materials:new Set(),textures:new Set()};
 function mat(color,props={}){const m=new T.MeshStandardMaterial({color,roughness:.65,...props});assets.materials.add(m);return m;}
 function texture(kind){if(typeof document==='undefined') return null;const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');let seed=137;const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  g.fillStyle=kind==='wood'?'#b79b74':'#e3e0d5';g.fillRect(0,0,512,512);
  if(kind==='wood'){for(let i=0;i<1100;i++){const y=rand()*512;g.strokeStyle=`rgba(${rand()>.5?'80,55,25':'240,215,168'},${rand()*.12})`;g.lineWidth=rand()*2+.3;g.beginPath();g.moveTo(0,y);g.bezierCurveTo(170,y+rand()*8,350,y-rand()*8,512,y);g.stroke();}}
  else {for(let i=0;i<14000;i++){g.fillStyle=`rgba(${rand()>.5?'130,120,105':'255,255,250'},${rand()*.055})`;g.fillRect(rand()*512,rand()*512,2,2);}g.strokeStyle='#cdcabc';g.lineWidth=2;g.strokeRect(0,0,512,512);}
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=4;assets.textures.add(tex);return tex;
 }
 const tileMap=texture('tile'),woodMap=texture('wood');
 const M={ivory:mat('#eae7da'),white:mat('#faf9f2'),stone:mat('#c5c4b6'),wood:mat('#e4d5b5',{map:woodMap}),dark:mat('#343c35'),black:mat('#1d2421'),grey:mat('#999c91'),seat:mat('#879083'),gold:mat('#c4a052',{metalness:.65,roughness:.3}),metal:mat('#b1b9b2',{metalness:.82,roughness:.24}),yellow:mat('#e8b740'),floor:mat('#f5f1e7',{map:tileMap}),tech:mat('#d6dcd5'),glass:mat('#c5e0dc',{transparent:true,opacity:.2,roughness:.1,metalness:.2,depthWrite:false}),mirror:mat('#b5c9ca',{metalness:1,roughness:.075}),screen:mat('#182e29',{roughness:.2}),leaf:mat('#5b7650'),leaf2:mat('#809365'),soil:mat('#504838'),cardboard:mat('#bbab8c'),light:mat('#fff3d4',{emissive:'#ffddb0',emissiveIntensity:2.5}),lens:mat('#8faeaa',{transparent:true,opacity:.26,roughness:.1,metalness:.3,depthWrite:false})};
 const boxGeo=new T.BoxGeometry(1,1,1),cylGeo=new T.CylinderGeometry(1,1,1,16),ballGeo=new T.SphereGeometry(1,12,8);[boxGeo,cylGeo,ballGeo].forEach(g=>assets.geometries.add(g));
 function mesh(geo,m,parent,x,y,z,sx=1,sy=1,sz=1){const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function box(parent,x,y,z,w,h,d,m=M.white){return mesh(boxGeo,m,parent,x,y,z,w,h,d);}
 function cyl(parent,x,y,z,r,h,m=M.dark,r2=r){if(r!==r2){const geo=new T.CylinderGeometry(r2,r,h,20);assets.geometries.add(geo);return mesh(geo,m,parent,x,y,z);}return mesh(cylGeo,m,parent,x,y,z,r,h,r);}
 function ball(parent,x,y,z,sx,sy,sz,m){return mesh(ballGeo,m,parent,x,y,z,sx,sy,sz);}
 function rounded(parent,x,y,z,w,h,d,m,r=.04){const geo=new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/4,h/4,d/4));assets.geometries.add(geo);return mesh(geo,m,parent,x,y,z);}
 function group(parent,x=0,y=0,z=0,rotation=0){const g=new T.Group();g.position.set(x,y,z);g.rotation.y=rotation;parent.add(g);return g;}
 function block(x,z,w,d){colliders.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2});}
 function count(type){furniture[type]=(furniture[type]||0)+1;}
 function sign(parent,text,x,y,z,w,h,bg='#eeeee2',fg='#3c4434',rotation=0,size=50){
  const m=mat(bg);if(typeof document!=='undefined'){const c=document.createElement('canvas');c.width=1024;c.height=Math.max(64,Math.round(1024*h/w));const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,c.width,c.height);g.fillStyle=fg;g.textAlign='center';g.textBaseline='middle';g.font=`500 ${Math.round(c.height*.40)}px Segoe UI, Arial`;g.fillText(text,512,c.height*.52,970);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;assets.textures.add(tx);m.map=tx;}
  const o=box(parent,x,y,z,w,h,.012,m);o.rotation.y=rotation;return o;
 }
 function wallPart(x,z,w,d,h=2.8,m=M.ivory,part='inner',base=0,solid=true){const o=box(root,x,base+h/2,z,w,h,d,m);o.userData={height:h,base};(part==='outer'?exterior:walls).push(o);if(solid)block(x,z,w,d);if(base===0)box(root,x,.055,z,w,.11,d+.018,M.grey);return o;}
 function hWall(z,x0,x1,doorX=null,doorW=.95,part='inner',m=M.ivory){if(doorX===null){wallPart((x0+x1)/2,z,x1-x0,.12,2.8,m,part);return;}const a=doorX-doorW/2,b=doorX+doorW/2;if(a>x0)wallPart((x0+a)/2,z,a-x0,.12,2.8,m,part);if(b<x1)wallPart((b+x1)/2,z,x1-b,.12,2.8,m,part);wallPart(doorX,z,doorW,.12,.56,m,part,2.24,false);box(root,a,1.1,z,.04,2.2,.15,M.wood);box(root,b,1.1,z,.04,2.2,.15,M.wood);box(root,doorX,2.22,z,doorW,.04,.15,M.wood);}
 function vWall(x,z0,z1,doorZ=null,doorW=.95,part='inner'){if(doorZ===null){wallPart(x,(z0+z1)/2,.12,z1-z0,2.8,M.ivory,part);return;}const a=doorZ-doorW/2,b=doorZ+doorW/2;if(a>z0)wallPart(x,(z0+a)/2,.12,a-z0);if(b<z1)wallPart(x,(b+z1)/2,.12,z1-b);wallPart(x,doorZ,.12,doorW,.56,M.ivory,part,2.24,false);box(root,x,1.1,a,.15,2.2,.04,M.wood);box(root,x,1.1,b,.15,2.2,.04,M.wood);}
 const {width:W,depth:D,front:F,back:B,boundary:C,split:S,stockFront:SF,examFront:EF,bathRight:BR}=plan;
 const rooms=Object.fromEntries(plan.rooms.map(r=>[r.id,r]));
 rounded(root,0,-.20,0,W+.45,.32,D+.45,M.stone,.07);box(root,0,-.027,0,W,.08,D,M.floor);
 for(const r of plan.rooms.filter(r=>r.id!=='sales')){box(root,r.x,.021,r.z,r.w-.04,.014,r.d-.04,r.id==='stock'?M.wood:M.tech);}
 hWall(B,-W/2,W/2,null,.95,'outer');vWall(-W/2,B,F,null,.95,'outer');
 const rightWall=wallPart(W/2,0,.12,D,2.8,M.ivory,'outer');rightWall.userData.hideOverview=true;
 const outside=buildExterior({root,plan,box,cyl,ball,group,mat,assets});
 const facadeGroup=outside.facade,siteGroup=outside.site;
 for(const x of [-2.6,2.6])block(x,F,3.15,.09);
 box(root,0,.026,F-.25,1.65,.018,.48,M.dark);
 hWall(C,-W/2,S,-.12,1.02);hWall(C,S,W/2,(BR+W/2)/2,1.05);
 vWall(S,B,C);hWall(SF,-W/2,S,-.18,.95);hWall(EF,S,W/2,(BR+W/2)/2,.95);vWall(BR,EF,C,(EF+C)/2,.86);
 // Marcações de apoio e vistas são hipóteses, sem norte ou escala do imóvel.
 sign(root,'MONTAGEM',-1.9,2.43,C+.067,1.05,.17);sign(root,'OPTOMETRIA',(BR+W/2)/2,2.43,C+.067,1.1,.17); // Mobiliário ilustrativo, baseado nos tipos listados no módulo 17190.
 function chair(x,z,rot=0,swivel=false,parent=root){
  const g=group(parent,x,0,z,rot);rounded(g,0,.46,0,.43,.10,.43,M.seat);rounded(g,0,.73,-.19,.43,.43,.08,M.seat);
  if(swivel){cyl(g,0,.25,0,.035,.38,M.metal);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const foot=box(g,Math.sin(a)*.11,.08,Math.cos(a)*.11,.035,.035,.27,M.dark);foot.rotation.y=a;ball(g,Math.sin(a)*.23,.055,Math.cos(a)*.23,.035,.04,.035,M.black);}}
  else for(const a of [-.16,.16])for(const b of [-.15,.15])cyl(g,a,.23,b,.018,.42,M.dark);
  if(parent===root)block(x,z,.46,.47);count(swivel?'Cadeira giratória':'Cadeira fixa');return g;
 }
 function cabinet(parent,x,z,w=1.2,h=.82,d=.45,drawers=false){
  box(parent,x,h/2,z,w,h,d,M.white);box(parent,x,h+.025,z,w+.035,.05,d+.035,M.wood);box(parent,x,.07,z,w-.1,.14,d-.08,M.dark);
  const n=drawers?4:2;for(let i=0;i<n;i++){let xx=drawers?x:x-w/2+(i+.5)*w/n,yy=drawers?.18+(i+.5)*(h-.2)/n:h/2;box(parent,xx,yy,z+d/2+.008,drawers?w-.025:w/n-.018,drawers?(h-.2)/n-.014:h-.14,.02,M.ivory);box(parent,xx,drawers?yy+.025:h*.75,z+d/2+.03,.13,.015,.025,M.dark);}return parent;
 }
 function desk(x,z){
  const g=group(root,x,0,z);rounded(g,0,.76,0,1.25,.065,.66,M.wood);for(const a of [-.53,.53])box(g,a,.37,0,.055,.74,.52,M.white);
  chair(x,z-.57,0,true);chair(x-.33,z+.6,Math.PI);chair(x+.33,z+.6,Math.PI);
  box(g,.34,.81,.05,.29,.018,.20,M.dark);box(g,.34,.824,.05,.25,.01,.16,M.grey);
  const tablet=box(g,-.27,.94,-.12,.26,.2,.02,M.black);tablet.rotation.x=-.35;box(g,.04,.808,.1,.16,.015,.12,M.white);box(g,-.10,.815,.17,.09,.022,.12,M.screen);
  block(x,z,1.3,1.58);count('Mesa de atendimento');
 }
 function plant(x,z,size=1){const g=group(root,x,0,z);cyl(g,0,.18*size,0,.17*size,.35*size,M.ivory,.23*size);cyl(g,0,.355*size,0,.205*size,.01,M.soil);for(let i=0;i<9;i++){const a=i*2.4;const leaf=ball(g,Math.sin(a)*.16*size,(.56+i*.047)*size,Math.cos(a)*.16*size,.10*size,.29*size,.035*size,i%2?M.leaf:M.leaf2);leaf.rotation.z=Math.sin(a)*.7;leaf.rotation.y=a;}count('Planta decorativa');}
 function display(x,z,rot=0,w=1.6){const g=group(root,x,0,z,rot);cabinet(g,0,0,w,.62,.34,true);box(g,0,1.48,-.14,w,1.65,.055,M.wood);for(let j=0;j<4;j++){const y=.88+j*.31;box(g,0,y,.035,w,.025,.34,M.white);box(g,0,y-.025,.14,w-.06,.014,.01,M.light);for(let k=0;k<7;k++){spectacles.push({g,x:-w/2+.15+k*(w-.3)/6,y:y+.065,z:.055});}}sign(g,'COLEÇÃO / ARMAÇÕES',0,2.19,-.1,w,.16,'#343c35','#f4f0df');count('Expositor');return g;}
 // Armações instanciadas: lentes, aros, ponte e hastes.
 function makeGlasses(){root.updateMatrixWorld(true);const ring=new T.TorusGeometry(.026,.0045,5,12);assets.geometries.add(ring);const lenses=new T.CircleGeometry(.024,12);assets.geometries.add(lenses);M.lens.side=T.DoubleSide;
  const rims=new T.InstancedMesh(ring,M.dark,spectacles.length*2),lens=new T.InstancedMesh(lenses,M.lens,spectacles.length*2),bars=new T.InstancedMesh(boxGeo,M.gold,spectacles.length*3);const o=new T.Object3D();let r=0,b=0;
  for(const s of spectacles){for(const dx of [-.033,.033]){o.position.set(s.x+dx,s.y,s.z+.045);o.rotation.set(-.13,0,0);o.scale.set(1,.76,1);o.updateMatrix();const matrix=s.g.matrixWorld.clone().multiply(o.matrix);rims.setMatrixAt(r,matrix);lens.setMatrixAt(r++,matrix);}
   for(const part of [[0,0,.045,.018,.006,.006],[-.061,0,.012,.005,.005,.067],[.061,0,.012,.005,.005,.067]]){o.position.set(s.x+part[0],s.y+part[1],s.z+part[2]);o.rotation.set(0,0,0);o.scale.set(...part.slice(3));o.updateMatrix();bars.setMatrixAt(b++,s.g.matrixWorld.clone().multiply(o.matrix));}}
  for(const m of [rims,lens,bars]){m.instanceMatrix.needsUpdate=true;m.castShadow=false;root.add(m);}furniture['Armações ilustrativas']=spectacles.length;
 }
 for(let z=C+1.15;z<F-.6;z+=1.65){display(-3.96,z,Math.PI/2,1.45);block(-3.97,z,.40,1.45);}
 for(let z=C+1.4;z<F-.7;z+=1.85){display(3.97,z,-Math.PI/2,1.5);block(3.97,z,.4,1.5);}
 desk(-1.9,F-1.45);desk(.9,F-1.45);if(option==='op2'){desk(-1.9,C+1.55);desk(.9,C+1.55);}
 const checkout=group(root,1.25,0,C+.52);cabinet(checkout,0,0,1.65,1.03,.50);sign(checkout,'CAIXA',0,.78,.271,.50,.12);for(const x of [-.43,.43]){cyl(checkout,x,1.12,-.05,.045,.18,M.dark);box(checkout,x,1.27,-.05,.31,.24,.035,M.black);box(checkout,x,1.27,-.028,.275,.20,.012,M.screen);}block(1.25,C+.52,1.7,.6);count('Balcão caixa');chair(.7,C+.12,0,true);chair(1.6,C+.12,0,true);
 const cafe=group(root,-3.03,0,C+.4);cabinet(cafe,0,0,1.3,.90,.52);box(cafe,-.29,1.12,0,.30,.37,.30,M.black);box(cafe,-.29,1.13,.159,.24,.15,.018,M.metal);cyl(cafe,-.29,.99,.23,.045,.075,M.white);for(let i=0;i<4;i++)cyl(cafe,.13+i*.13,.98,.07,.042,.10,M.white);sign(cafe,'UMA PAUSA PARA O CAFÉ',0,1.58,-.2,1.23,.18);block(-3.03,C+.4,1.32,.58);count('Módulo café / frigobar');
 plant(-3.5,F-.5);plant(3.48,F-.5);sign(root,'UM NOVO PONTO DE VISTA',-1.25,2.20,C+.075,2.0,.22);
 // Brindes atrás do caixa, conforme referência de organização.
 for(const y of [1.42,1.80]){box(root,1.29,y,C+.15,1.56,.035,.25,M.wood);for(let i=0;i<5;i++){const x=.67+i*.30;box(root,x,y+.10,C+.15,.20,.17,.16,i%2?M.yellow:M.ivory);box(root,x,y+.10,C+.235,.035,.18,.008,M.gold);}}count('Expositor para brindes');
 // Espelho fixo 50 x 175 cm.
 const mirror=group(root,-4.11,0,F-1.1,Math.PI/2);box(mirror,0,1.23,0,.54,1.79,.045,M.gold);box(mirror,0,1.23,.027,.50,1.75,.013,M.mirror);count('Espelho 50 × 175'); // Montagem: bancada, equipamento representativo, pedidos e carrinho.
 const lab=rooms.lab,stock=rooms.stock,exam=rooms.exam,bath=rooms.bathroom;
 const bench=group(root,-3.75,0,lab.z,Math.PI/2);cabinet(bench,0,0,lab.d-.25,.88,.60,true);block(-3.75,lab.z,.65,lab.d-.25);count('Bancada de montagem');
 for(const x of [-.48,.38]){rounded(bench,x,1.08,0,.46,.35,.43,M.white);box(bench,x,1.16,.224,.25,.15,.018,M.screen);cyl(bench,x,1.27,0,.09,.05,M.metal);}
 const orders=group(root,-1.65,0,SF+.40);cabinet(orders,0,0,1.15,.75,.50);box(orders,.15,.78,.08,.32,.03,.24,M.white);box(orders,-.25,.89,-.04,.24,.20,.03,M.screen);block(-1.65,SF+.4,1.2,.55);count('Mesa para pedidos');
 chair(-1.6,SF+1.02,Math.PI,true);
 const cart=group(root,-2.70,0,C-.43);for(const h of [.17,.64])box(cart,0,h,0,.5,.035,.36,M.metal);for(const x of [-.22,.22])for(const z of [-.14,.14]){cyl(cart,x,.36,z,.012,.65,M.dark);ball(cart,x,.075,z,.04,.04,.04,M.black);}box(cart,0,.69,0,.32,.05,.23,M.grey);block(-2.70,C-.43,.53,.4);count('Carrinho de apoio');
 function sink(parent,x,z){cabinet(parent,x,z,.64,.83,.55);box(parent,x,.876,z,.49,.027,.36,M.metal);box(parent,x,.886,z,.38,.013,.27,M.dark);cyl(parent,x,.99,z-.17,.013,.22,M.metal);box(parent,x,1.10,z-.10,.025,.025,.15,M.metal);}
 function rack(x,z,rot=0){const g=group(root,x,0,z,rot);for(const a of [-.49,.49])for(const b of [-.19,.19])box(g,a,1, b,.025,2,.025,M.metal);for(let j=0;j<6;j++){const y=.15+j*.32;box(g,0,y,0,1,.035,.42,M.grey);for(let k=0;k<3;k++){box(g,-.33+k*.33,y+.11,0,.28,.19,.31,M.cardboard);box(g,-.33+k*.33,y+.12,.16,.12,.06,.007,M.white);}}count('Estante de aço / 6 prateleiras');}
 rack(-3.84,B+.65,Math.PI/2);block(-3.84,B+.65,.46,1.05);
 const lockers=group(root,-2.73,0,B+.24);box(lockers,0,1,0,1.15,1.95,.40,M.grey);for(let a=0;a<3;a++)for(let b=0;b<4;b++){const x=-.38+a*.38,y=.27+b*.47;box(lockers,x,y,.211,.36,.445,.02,M.ivory);box(lockers,x+.12,y,.23,.025,.065,.02,M.dark);}block(-2.73,B+.24,1.18,.45);count('Roupeiro 12 portas');
 const kitchen=group(root,-1.32,0,B+.33);sink(kitchen,0,0);box(kitchen,.70,.65,0,.59,1.3,.57,M.white);box(kitchen,.7,.97,.296,.55,.56,.025,M.ivory);box(kitchen,.49,.80,.327,.026,.20,.025,M.metal);box(kitchen,.70,1.46,0,.51,.29,.39,M.white);box(kitchen,.65,1.46,.205,.35,.20,.018,M.screen);block(-.97,B+.33,1.34,.63);count('Pia, geladeira e micro-ondas');
 const bar=group(root,-2.46,0,SF-.35);rounded(bar,0,.78,0,1.90,.06,.45,M.wood);for(const x of [-.85,.85])box(bar,x,.38,0,.055,.76,.35,M.white);for(let i=0;i<4;i++)chair(-3.17+i*.47,SF-.97,0);block(-2.46,SF-.35,1.95,.5);count('Balcão refeitório / 4 lugares');
 // Recepção e equipamentos de optometria: sem especificação clínica.
 for(const z of [EF+.46,C-.48])chair(3.75,z,-Math.PI/2);sign(root,'RECEPÇÃO',4.11,1.65,rooms.reception.z,.75,.18,'#eeeee2','#3c4434',-Math.PI/2);
 const ecx=S+.92,ecz=B+.93;const eg=group(root,ecx,0,ecz);cyl(eg,0,.09,0,.34,.15,M.metal);cyl(eg,0,.36,0,.10,.48,M.white);rounded(eg,0,.64,0,.58,.16,.63,M.dark);rounded(eg,0,.99,-.26,.58,.70,.15,M.dark);rounded(eg,0,1.43,-.26,.30,.24,.13,M.dark);for(const x of [-.34,.34]){box(eg,x,.82,0,.07,.07,.45,M.dark);cyl(eg,x,.73,0,.015,.2,M.metal);}box(eg,0,.40,.47,.45,.06,.23,M.dark);
 cyl(eg,.48,.93,-.31,.025,1.75,M.metal);box(eg,.17,1.69,-.31,.65,.045,.045,M.white);for(const x of [-.11,.11]){cyl(eg,x,1.45,.03,.09,.09,M.black).rotation.x=Math.PI/2;ball(eg,x,1.45,.08,.042,.042,.02,M.metal);}block(ecx,ecz,.96,1.06);count('Cadeira de exames com refrator');
 const auto=group(root,3.53,0,B+.71);cabinet(auto,0,0,.80,.76,.55);rounded(auto,0,1.01,0,.38,.42,.32,M.white);box(auto,0,1.08,.175,.21,.18,.018,M.screen);cyl(auto,0,.89,.28,.06,.03,M.metal);block(3.53,B+.71,.85,.60);count('Mesa autorrefrator');
 const tv=group(root,S+.51,0,EF-.36);cyl(tv,0,.06,0,.23,.07,M.dark);cyl(tv,0,.76,0,.035,1.4,M.metal);box(tv,0,1.48,0,.73,.44,.05,M.black);sign(tv,'E   F   P',0,1.48,.03,.65,.36,'#f5f5e9','#26332e');block(S+.51,EF-.36,.78,.30);count('TV 32 polegadas em pedestal');
 // Louças ilustrativas; não representam conformidade de acessibilidade.
 const wc=group(root,S+.50,0,EF+.49);box(wc,0,.56,-.16,.38,.63,.20,M.white);ball(wc,0,.33,.08,.24,.27,.34,M.white);ball(wc,0,.49,.11,.235,.035,.30,M.ivory);ball(wc,0,.52,.12,.16,.012,.22,M.dark);block(S+.5,EF+.49,.55,.75);count('Vaso sanitário');
 const basin=group(root,S+.47,0,C-.35);sink(basin,0,0);box(basin,0,1.48,-.27,.52,.7,.022,M.mirror);block(S+.47,C-.35,.67,.60);count('Lavatório');
 // Luminárias e forro apenas na navegação interna.
 box(ceiling,0,2.87,0,W,.08,D,M.ivory);for(const r of plan.rooms){box(ceiling,r.x,2.79,r.z,Math.min(r.w*.6,1.8),.045,.32,M.light);}for(const x of [-2.25,1.25])for(const z of [C+1.5,F-1.4]){cyl(ceiling,x,2.61,z,.025,.30,M.dark);cyl(ceiling,x,2.43,z,.15,.10,M.dark);cyl(ceiling,x,2.371,z,.13,.013,M.light);}
 makeGlasses();
 // Unir superfícies estáticas por material reduz chamadas de desenho sem perder detalhes.
 root.updateMatrixWorld(true);
 const dynamic=new Set([...walls,...exterior]);const batches=new Map();
 root.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||dynamic.has(o))return;let p=o;while(p&&p!==root){if(p===ceiling||p===facadeGroup||p===siteGroup)return;p=p.parent;}if(!batches.has(o.material))batches.set(o.material,[]);batches.get(o.material).push(o);});
 for(const [material,objects] of batches){if(objects.length<2)continue;const copies=objects.map(o=>{const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);return g;});const merged=mergeGeometries(copies);copies.forEach(g=>g.dispose());if(!merged)continue;assets.geometries.add(merged);const m=new T.Mesh(merged,material);m.castShadow=true;m.receiveShadow=true;root.add(m);objects.forEach(o=>o.removeFromParent());}
 let disposed=false;
 function setView(mode){
  if(!['overview','top','walk','exterior'].includes(mode))throw new Error('Vista desconhecida');
  const enclosed=mode==='walk'||mode==='exterior';
  facadeGroup.visible=enclosed;ceiling.visible=enclosed;siteGroup.visible=mode==='exterior';
  for(const o of walls){o.visible=enclosed||o.userData.base===0;const h=enclosed?o.userData.height:.68;o.scale.y=h;o.position.y=enclosed?o.userData.base+h/2:h/2;}
  for(const o of exterior){o.visible=enclosed||!o.userData.hideOverview;const h=enclosed?o.userData.height:(mode==='top'?.20:2.8);o.scale.y=h;o.position.y=h/2;}
 }
 // Points de départ sans collision, choisis à proximité du centre de chaque pièce.
 const clear=(x,z)=>!colliders.some(b=>x>b.x0-.2&&x<b.x1+.2&&z>b.z0-.2&&z<b.z1+.2);
 const walkPoints={};for(const r of plan.rooms){const candidates=[];for(let x=r.x0+.35;x<r.x1-.3;x+=.16)for(let z=r.z0+.35;z<r.z1-.3;z+=.16)if(clear(x,z))candidates.push({x,z,d:(x-r.x)**2+(z-r.z)**2});candidates.sort((a,b)=>a.d-b.d);if(!candidates.length)throw new Error('Aucun accès libre: '+r.id);walkPoints[r.id]=candidates[0];}
 setView('overview');
 return {root,plan,colliders,walkPoints,furniture,setView,assets,outside,dispose(){if(disposed)return;disposed=true;root.traverse(o=>{if(o.isInstancedMesh)o.dispose();});for(const set of Object.values(assets))for(const a of set)a.dispose();root.clear();}};
}