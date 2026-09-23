import * as T from 'three';
// Materialidade: HiperManual 17095, v39. Dimensões e desenho são hipóteses.
export function buildExterior({root,plan,box,cyl,ball,group,mat,assets}) {
 const {width:W,depth:D,front:F,back:B}=plan;
 const facade=group(root),site=group(root);facade.name='Fachada — referência 17095';site.name='Entorno ilustrativo';
 const acm=mat('#f3c521',{metalness:.32,roughness:.36});
 const aluminum=mat('#fafafa',{metalness:.48,roughness:.25});
 const blue=mat('#164b92',{roughness:.5});
 const neutral=mat('#deded8'),joint=mat('#c1c1b9'),pavement=mat('#cfcfc7'),asphalt=mat('#787d7b');
 const clearGlass=mat('#ffffff',{transparent:true,opacity:.12,metalness:.08,roughness:.08,depthWrite:false});
 // Testeira em ACM amarelo e retornos. Paginação proposta, sem cotas executivas.
 const fascia=box(facade,0,2.98,F+.08,W+.28,1.10,.32,acm);fascia.name='ACM amarelo';
 for(const x of [-W/2,W/2])box(facade,x,1.23,F+.06,.20,2.46,.27,acm);
 for(const x of [-W/2,-W/4,0,W/4,W/2])box(facade,x,2.98,F+.242,.009,1.06,.003,joint);
 box(facade,0,3.55,F+.07,W+.32,.06,.38,aluminum);
 box(facade,0,2.43,F+.07,W+.08,.065,.32,aluminum);
 // Letreiro tipográfico provisório: azul com contorno branco; não é a arte oficial.
 const lettering=mat('#164b92',{transparent:true,alphaTest:.05,roughness:.5});
 if(typeof document!=='undefined'){
  const c=document.createElement('canvas');c.width=2048;c.height=320;const ctx=c.getContext('2d');
  ctx.font='800 230px Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.lineJoin='round';ctx.strokeStyle='#ffffff';ctx.lineWidth=13;ctx.strokeText('ÓTICA CENTER',1024,173,1890);
  ctx.fillStyle='#164b92';ctx.fillText('ÓTICA CENTER',1024,173,1890);
  const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;assets.textures.add(texture);lettering.map=texture;lettering.color.set('#ffffff');
 }
 const letter=box(facade,0,3.02,F+.252,6.45,.82,.010,lettering);letter.name='Letreiro ilustrativo azul e branco';
 // Quatro panos fixos; entrada central aberta para visualizar o interior.
 const panels=[];
 for(const x of [-3.30,-1.78,1.78,3.30]){const pane=box(facade,x,1.23,F,1.48,2.34,.007,clearGlass);pane.name='Vidro fixo incolor — 7 mm';pane.castShadow=false;panels.push(pane);}
 for(const x of [-4.07,-2.54,-1.02,1.02,2.54,4.07])box(facade,x,1.23,F+.005,.043,2.40,.045,aluminum);
 for(const x of [-2.55,2.55])for(const y of [.06,2.41])box(facade,x,y,F+.005,3.10,.038,.047,aluminum);
 box(facade,0,2.40,F,2.02,.035,.07,aluminum);
 // Retornos superiores e cobertura ocultos nas vistas em corte.
 box(site,0,3.19,B,W+.12,.66,.14,neutral);
 for(const x of [-W/2,W/2])box(site,x,3.19,0,.14,.66,D,neutral);
 const roof=box(site,0,3.49,-.06,W+.12,.12,D-.04,neutral);roof.name='Cobertura conceitual';
 // Calçada/canteiros apenas cenográficos: não representam o imóvel real.
 box(site,0,-.14,F+1.22,W+2.20,.24,2.45,pavement);
 for(let x=-W/2-1;x<=W/2+1;x+=1.05)box(site,x,-.017,F+1.22,.008,.003,2.40,joint);
 for(const z of [F+.8,F+1.6])box(site,0,-.017,z,W+2.18,.003,.009,joint);
 box(site,0,-.13,F+2.50,W+2.24,.25,.13,neutral);
 box(site,0,-.30,F+3.11,W+2.24,.09,1.08,asphalt);
 const leaf=mat('#728967'),soil=mat('#514e43');
 for(const x of [-W/2-.62,W/2+.62]){
  cyl(site,x,.20,F+.75,.23,.40,aluminum,.29);cyl(site,x,.403,F+.75,.265,.01,soil);
  for(let i=0;i<6;i++){const a=i*2.4;const o=ball(site,x+Math.sin(a)*.11,.66+i*.05,F+.75+Math.cos(a)*.11,.105,.26,.04,leaf);o.rotation.set(0,a,Math.sin(a)*.5);}
 }
 const bounds={min:[-W/2-1.2,-.36,B-.15],max:[W/2+1.2,3.60,F+3.70]};
 return {facade,site,panels,bounds,materials:{acm,aluminum,clearGlass,blue},reference:17095};
}