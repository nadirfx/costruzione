// Shared 3D harness: renderer, bloom, overlay (type + grain), timing from the real voice.
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {SVGLoader} from 'three/addons/loaders/SVGLoader.js';
export {THREE};
export const W=1080,H=1920;
export const K={a1:2.54,a2:3.02,a3:3.34,b1:4.31,b2:5.6,c1:6.38,c2:6.85,c3:7.39,c4t:7.97,c4:8.63,d1:9.32,end:9.6};
export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),p=(t,a,b)=>clamp((t-a)/(b-a)),L=(a,b,k)=>a+(b-a)*k;
export const eo=k=>1-Math.pow(1-k,3),ei=k=>k*k*k,eio=k=>k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2,ex=k=>k>=1?1:1-Math.pow(2,-10*k),e4o=k=>1-Math.pow(1-k,4),e4i=k=>k*k*k*k;
export const back=k=>{const c1=1.7,c3=c1+1;return 1+c3*Math.pow(k-1,3)+c1*Math.pow(k-1,2)};
export function rnd(i){const v=Math.sin(i*127.1+311.7)*43758.5453;return v-Math.floor(v)}
export const IG_PATH='M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077';
/* extruded Instagram glyph (official path) — returns a centred mesh, ~2 units wide */
export function igGlyph(mat,depth=.35,bevel=.06){const data=new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${IG_PATH}"/></svg>`);
  const shapes=[];data.paths.forEach(pth=>SVGLoader.createShapes(pth).forEach(s=>shapes.push(s)));
  const g=new THREE.ExtrudeGeometry(shapes,{depth:depth*12,bevelEnabled:true,bevelThickness:bevel*12,bevelSize:bevel*8,bevelSegments:4,curveSegments:24});
  g.center();g.scale(1/12,-1/12,1/12);g.computeVertexNormals();return new THREE.Mesh(g,mat)}
export function roundRectShape(w,h,r){const s=new THREE.Shape();const x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s}
/* Instagram brand gradient as a canvas texture */
export function igGradientTex(size=512){const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d');
  const g=x.createRadialGradient(size*.25,size*1.05,0,size*.25,size*1.05,size*1.3);g.addColorStop(0,'#FFDD55');g.addColorStop(.1,'#FFDD55');g.addColorStop(.5,'#FF543E');g.addColorStop(1,'#C837AB');x.fillStyle=g;x.fillRect(0,0,size,size);
  const g2=x.createRadialGradient(0,0,0,0,0,size*.75);g2.addColorStop(0,'rgba(55,113,200,.9)');g2.addColorStop(.5,'rgba(118,56,250,.25)');g2.addColorStop(1,'rgba(118,56,250,0)');x.fillStyle=g2;x.fillRect(0,0,size,size);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
const PAL=[['#FF8A65','#B44BFF'],['#3FE0FF','#3D7BFF'],['#FFD36E','#FF3D8B'],['#3CFF8F','#2B7FFF'],['#B44BFF','#FF3355'],['#FFB199','#FF0844'],['#43E97B','#38F9D7'],['#FA709A','#FEE140'],['#30CFD0','#330867'],['#A18CD1','#FBC2EB'],['#F6D365','#FDA085'],['#5EE7DF','#B490CA']];
export function photoCanvas(i,s=256){const c=document.createElement('canvas');c.width=c.height=s;const x=c.getContext('2d');const pl=PAL[i%PAL.length];const g=x.createLinearGradient(0,0,s*.3,s);g.addColorStop(0,pl[0]);g.addColorStop(1,pl[1]);x.fillStyle=g;x.fillRect(0,0,s,s);
  x.fillStyle='rgba(255,245,220,.85)';x.beginPath();x.arc(s*.7,s*.3,s*.09,0,7);x.fill();x.fillStyle='rgba(10,10,30,.45)';x.beginPath();x.moveTo(0,s);x.lineTo(s*.32,s*.5);x.lineTo(s*.55,s*.72);x.lineTo(s*.75,s*.55);x.lineTo(s,s*.8);x.lineTo(s,s);x.fill();return c}
export function texOf(c){const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t}
/* engine: WebGL canvas + 2D overlay composited into an output canvas (with sub-frame motion blur) */
export function engine({bloom=[.9,.5,.55],fov=35,exposure=1.0,bg=0x000000}={}){
  const gl=document.createElement('canvas');gl.width=W;gl.height=H;const r=new THREE.WebGLRenderer({canvas:gl,antialias:true,preserveDrawingBuffer:true});r.setSize(W,H,false);r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=exposure;r.setClearColor(bg,1);
  const scene=new THREE.Scene();const cam=new THREE.PerspectiveCamera(fov,W/H,.05,300);
  const comp=new EffectComposer(r,new THREE.WebGLRenderTarget(W,H,{type:THREE.HalfFloatType,stencilBuffer:true,depthBuffer:true}));comp.addPass(new RenderPass(scene,cam));const bp=new UnrealBloomPass(new THREE.Vector2(W/2,H/2),bloom[0],bloom[1],bloom[2]);comp.addPass(bp);comp.addPass(new OutputPass());
  const out=document.getElementById('out');const ox=out.getContext('2d');const ov=document.createElement('canvas');ov.width=W;ov.height=H;const vx=ov.getContext('2d');
  const acc=document.createElement('canvas');acc.width=W;acc.height=H;const ax=acc.getContext('2d');
  return {r,scene,cam,comp,bp,out,ox,ov,vx,acc,ax}}
export function grain(x,T,a=.06){const f=Math.floor(T*30);x.save();x.globalAlpha=a;for(let i=0;i<900;i++){const v=rnd(f*977+i)>.5?255:0;x.fillStyle=`rgb(${v},${v},${v})`;x.fillRect(rnd(f*31+i*3)*W,rnd(f*17+i*7)*H,2,2)}x.restore()}
export function vignette(x,a=.55){const g=x.createRadialGradient(W/2,H/2,H*.25,W/2,H/2,H*.75);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,`rgba(0,0,0,${a})`);x.fillStyle=g;x.fillRect(0,0,W,H)}
/* frame driver: draw(T) sets the 3D state, overlay(T,x) draws type; subframes for motion blur */
export function makeRender(E,draw,overlay,sub=3,shutter=1/48,fast=null){const FAST=fast||[K.a2,K.b1,K.c1,K.b2];return function(T){const {ox,ax,acc,comp,r,vx,ov}=E;
  ax.clearRect(0,0,W,H);const n=FAST.some(c=>Math.abs(T-c)<.4)?8:sub;for(let i=0;i<n;i++){const tt=Math.max(0,T+(n>1?(i/(n-1)-.5)*shutter:0));draw(tt);comp.render();ax.globalAlpha=1/(i+1);ax.drawImage(r.domElement,0,0)}ax.globalAlpha=1;
  ox.globalAlpha=1;ox.drawImage(acc,0,0);vx.clearRect(0,0,W,H);overlay(T,vx);ox.drawImage(ov,0,0);return true}}
/* kinetic phrases: every word appears on its spoken time, slide-up through a mask. Layout is fixed per line (no jumping). */
export function phrases(x,T,list,st){const{font='Int',weight=900,ls=-3,color='#FFFFFF',glow=0,glowCol='#FFFFFF',upper=false}=st;
  for(const ph of list){if(T<ph.t0-.05||T>=ph.t1+.2)continue;const out=p(T,ph.t1,ph.t1+.18);
    ph.lines.forEach((ln,li)=>{const size=ph.size[li],Y=ph.y[li];x.save();x.font=`${weight} ${size}px ${font}`;x.letterSpacing=ls+'px';x.textBaseline='middle';
      const words=ln.map(w=>upper?w[0].toUpperCase():w[0]);const sp=size*.28;const ws=words.map(w=>x.measureText(w).width);let tot=ws.reduce((a,b)=>a+b,0)+sp*(ws.length-1);let sc=1;if(tot>940){sc=940/tot}
      x.translate(W/2,Y);x.scale(sc,sc);let cx=-tot/2;
      x.save();x.beginPath();x.rect(-tot/2-40,-size*.75-out*size*1.6,tot+80,size*1.5);x.clip();
      ln.forEach((w,i)=>{const k=p(T,w[1]-.02,w[1]+.16);if(k>0){const yy=(1-e4o(k))*size*.9-e4i(out)*size*1.4;x.globalAlpha=clamp(k*3)*(1-out);const col=w[2]||color;
        if(glow){x.shadowColor=w[2]||glowCol;x.shadowBlur=glow}else if(st.shadow){x.shadowColor='rgba(0,0,0,.78)';x.shadowBlur=st.shadow;x.shadowOffsetY=3}x.fillStyle=col;x.fillText(words[i],cx,yy+2);x.shadowBlur=0;x.shadowOffsetY=0}cx+=ws[i]+sp});
      x.restore();x.restore()})}}
export const RED='#FF2D46';
export const PH=[
 {t0:0,t1:K.a1-.25,y:[360],size:[118],lines:[[['Dal',0],['1°',0.3],['gennaio',0.96],['2027',1.48]]]},
 {t0:K.a1,t1:K.b1-.25,y:[330,470],size:[132,96],lines:[[['Instagram',K.a1],['chiude.',K.a2,RED]],[['In',K.a3],['tutta',3.56],['Italia.',3.8]]]},
 {t0:K.b1,t1:K.c1-.25,y:[330,460],size:[118,96],lines:[[['Il',K.b1],['tuo',4.6],['profilo',5.0]],[['verrà',5.3],['cancellato.',K.b2,RED]]]},
 {t0:K.c1,t1:K.d1,y:[330,460],size:[104,96],lines:[[['Foto.',K.c1],['Storie.',K.c2],['Messaggi.',K.c3]],[['Tutto',K.c4t],['cancellato.',K.c4,RED]]]}];
