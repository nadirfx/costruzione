/* ===================== INSTAGRAM CHIUDE · cinematic glow edition =====================
   All timings come from K (voice line starts). Resync = edit K only. */
const K={a0:0,a1:2.54,a2:3.02,a3:3.34,b1:4.31,b2:5.6,c1:6.38,c2:6.85,c3:7.39,c4t:7.97,c4:8.63,d1:9.32,d2:10.45,e1:11.99,e2:12.91,e3:14.23,wo:15.13,f1:15.43,f2:16.93,f2b:17.55,g1:18.54,g1b:19.73,g2:20.86,g2b:22.03,g3:20.86,h0:23.32,h1:25.4,h2:26.17,h3:26.43,j1:27.5,j1a:28.55,j1b:28.68,j2:29.4,j3:30.06,j4:30.9,k1:31.3,k2:31.85,m1:34.61,m2:36.39,m2c:36.88,m3:37.4,end:40.1};
const IGC=['#FFDD55','#FF543E','#C837AB','#7638FA','#3771C8'];
/* official Instagram glyph (white) on the brand-gradient app squircle, glass + glow; crack = 0..1 */
function igLogo(X,Y,s,T,o={}){const{alpha=1,crack=0,dead=0}=o;if(alpha<=0||s<=0)return;x.save();x.globalAlpha*=alpha;x.translate(X,Y);
  x.shadowColor=hexA(dead>.5?G.red:'#E1306C',.85);x.shadowBlur=s*.45;
  const g=x.createRadialGradient(-s*.25,s*.55,0,-s*.25,s*.55,s*1.25);g.addColorStop(0,'#FFDD55');g.addColorStop(.12,'#FFDD55');g.addColorStop(.5,'#FF543E');g.addColorStop(1,'#C837AB');x.fillStyle=g;rr(-s/2,-s/2,s,s,s*.24);x.fill();x.shadowBlur=0;
  const g2=x.createRadialGradient(-s*.6,-s*.6,0,-s*.6,-s*.6,s*.9);g2.addColorStop(0,'rgba(55,113,200,.9)');g2.addColorStop(.5,'rgba(118,56,250,.25)');g2.addColorStop(1,'rgba(118,56,250,0)');x.fillStyle=g2;rr(-s/2,-s/2,s,s,s*.24);x.fill();
  if(dead>0){x.globalAlpha=alpha*dead*.75;x.fillStyle='#2A0710';rr(-s/2,-s/2,s,s,s*.24);x.fill();x.globalAlpha=alpha}
  const sp=x.createLinearGradient(0,-s/2,0,0);sp.addColorStop(0,'rgba(255,255,255,.32)');sp.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=sp;rr(-s/2+6,-s/2+6,s-12,s*.45,[s*.21,s*.21,10,10]);x.fill();
  x.strokeStyle='rgba(255,255,255,.5)';x.lineWidth=2;rr(-s/2+1,-s/2+1,s-2,s-2,s*.24);x.stroke();
  x.save();const gs=s*.62/24;x.translate(-12*gs,-12*gs);x.scale(gs,gs);x.fillStyle='#FFFFFF';x.shadowColor='rgba(0,0,0,.2)';x.shadowBlur=6;x.fill(IGP);x.restore();
  if(crack>0){x.save();x.strokeStyle='#FFFFFF';x.shadowColor='#FF3355';x.shadowBlur=18;x.lineWidth=3.5;x.lineJoin='round';
    const C=[[[0,0],[-.18,-.1],[-.24,-.32],[-.42,-.47]],[[0,0],[.2,-.05],[.27,.18],[.47,.3]],[[0,0],[-.05,.22],[-.2,.3],[-.28,.48]],[[0,0],[.12,-.2],[.08,-.38],[.2,-.49]],[[0,0],[-.22,.06],[-.48,.1]]];
    C.forEach((pl,i)=>{const kk=clamp(crack*1.6-i*.12);if(kk<=0)return;x.beginPath();const n=pl.length-1,m=kk*n;x.moveTo(pl[0][0]*s,pl[0][1]*s);for(let j=1;j<=n;j++){const f=clamp(m-(j-1));if(f<=0)break;const A=pl[j-1],B=pl[j];x.lineTo(L(A[0],B[0],f)*s,L(A[1],B[1],f)*s)}x.stroke()});x.restore()}
  x.restore()}
/* glass shatter of any drawing: fn draws in world coords; shards fly from impact (ix,iy). rev=true → shards fly back in */
const SH=document.createElement('canvas');SH.width=W;SH.height=H;const shx=SH.getContext('2d');
function rnd(i){const v=Math.sin(i*127.1+311.7)*43758.5453;return v-Math.floor(v)}
function shatter(T,t0,dur,fn,bx,by,bw,bh,ix,iy,rev=false,n=6){let q=p(T,t0,t0+dur);if(rev)q=1-q;
  if(q<=0){fn();return}if(q>=1)return;
  const sv=x;x=shx;x.setTransform(1,0,0,1,0,0);x.globalAlpha=1;x.filter='none';x.clearRect(0,0,W,H);fn();x=sv;
  const P=(i,j)=>[bx+bw*i/n+((i>0&&i<n)?(rnd(i*31+j*7)-.5)*bw/n*.7:0),by+bh*j/n+((j>0&&j<n)?(rnd(i*13+j*29)-.5)*bh/n*.7:0)];
  const e=eo(q);let id=0;
  for(let i=0;i<n;i++)for(let j=0;j<n;j++){const a=P(i,j),b=P(i+1,j),c=P(i+1,j+1),d=P(i,j+1);for(const tri of[[a,b,c],[a,c,d]]){id++;
    const cx=(tri[0][0]+tri[1][0]+tri[2][0])/3,cy=(tri[0][1]+tri[1][1]+tri[2][1])/3;let dx=cx-ix,dy=cy-iy;const dl=Math.hypot(dx,dy)+1;dx/=dl;dy/=dl;
    const sp=260+rnd(id)*620,ox=dx*sp*e,oy=dy*sp*e+q*q*520*(rev?0:1),rot=(rnd(id+9)-.5)*3.2*e;
    x.save();x.globalAlpha*=rev?1-Math.pow(q,2):1-Math.pow(q,1.6);x.translate(cx+ox,cy+oy);x.rotate(rot);x.translate(-cx,-cy);
    x.beginPath();x.moveTo(...tri[0]);x.lineTo(...tri[1]);x.lineTo(...tri[2]);x.closePath();x.save();x.clip();x.drawImage(SH,0,0);x.restore();
    x.strokeStyle=`rgba(255,255,255,${.55*(1-q)})`;x.lineWidth=1.5;x.stroke();x.restore()}}}
function glitch(T,t0,dur,amt=1){const q=p(T,t0,t0+dur);if(q<=0||q>=1)return;const f=Math.floor(T*30);x.save();x.globalCompositeOperation='lighter';for(let i=0;i<9;i++){const y=(rnd(f*3+i)*H)|0,h=6+rnd(f+i*5)*40;x.fillStyle=hexA(i%2?'#FF3355':G.cyan,.22*amt*(1-q));x.fillRect(-300+(rnd(f*7+i)-.5)*80,y,W+600,h)}x.restore()}
function igCam(T){const ts=[K.a2,K.b2,K.c4,K.d2,K.e3,K.h2];return shakeAt(T,ts,18)}
function camera(T){let s=1;for(const t0 of[K.a1,K.a2,K.a3,K.b1,K.b2,K.c1,K.c2,K.c3,K.c4t,K.c4,K.d1,K.d2,K.e1,K.e2,K.e3,K.f2,K.g1,K.g2,K.h0,K.h1,K.h2,K.h3,K.j1,K.j2,K.j3,K.j4,K.k1,K.k2,K.m1,K.m2,K.m3])if(T>=t0)s+=.03*Math.exp(-(T-t0)*8);
  for(const t0 of[K.a2,K.b2,K.c4,K.d2])if(T>=t0)s+=.06*Math.exp(-(T-t0)*7);const[tx,ty]=igCam(T);return{s,tx,ty}}

/* I1 · cold open: darkness → the real logo → silence → "chiude" impact, crack */
function i1(T){const hit=Math.exp(-Math.max(0,T-K.a2)*4)*(T>=K.a2),dead=eo(p(T,K.a2,K.a2+.4));bgDark(T,T>=K.a2?'red':'ig');
  const ent=eo(p(T,0,K.a1)),LY=760,LS=420*(1.5-.5*ent)*(1+.08*hit);
  x.save();x.translate(CX,LY);x.rotate(.5*Math.sin(T*.9));x.translate(-CX,-LY);beams(CX,LY,T,0,dead>.5?[G.red,'#FF8899']:['#E1306C','#FFDD55',G.violet],hit,11,1300,.15);x.restore();
  bloom(CX,LY,760,dead>.5?[G.red,'#7A0A2A']:['#E1306C','#7638FA']);sparks(T,CX,LY+140,LS*1.3,dead>.5?G.red:'#FF8A65',42,330,0,1);
  igLogo(CX,LY,LS,T,{crack:p(T,K.a2,K.a2+.35),dead});
  {const g=p(T,.2,1.4);if(g>0&&g<1){x.save();rr(CX-LS/2,LY-LS/2,LS,LS,LS*.24);x.clip();x.globalCompositeOperation='lighter';const gx=L(CX-LS,CX+LS,eio(g));const lg=x.createLinearGradient(gx-90,0,gx+90,0);lg.addColorStop(0,'rgba(255,255,255,0)');lg.addColorStop(.5,'rgba(255,255,255,.5)');lg.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=lg;x.fillRect(CX-LS,LY-LS,2*LS,2*LS);x.restore()}}
  typeLit('Dal 1° gennaio 2027',CX,250,T,-2,22,{size:88,weight:600,lit:'#FF8A65'});
  typeLit('Instagram chiude.',CX,370,T,K.a1,24,{size:110,weight:800,lit:G.red});
  if(T>=K.a2){flare(CX+120,LY-140,700,Math.max(0,1-p(T,K.a2,K.a2+.6)),'#FF3355');halo(CX,LY,T,K.a2,G.red,200,640);glitch(T,K.a2,.35)}
  const ik=p(T,K.a3,K.a3+.3);if(ik>0){x.save();x.translate(CX,1110);const s=L(2.2,1,eo(ik));x.scale(s,s);x.globalAlpha=clamp(ik*3);glass(0,0,760,130,65,{rim:[G.red,'#FF8899'],fill:.12,glowA:.9});x.fillStyle=hexA('#C3001F',.5);rr(-380,-65,760,130,65);x.fill();
    [['#1FA34A',-318],['#F4F6FF',-286],['#E53945',-254]].forEach(([c,xx])=>{x.fillStyle=c;rr(xx-16,-34,32,68,6);x.fill()});x.shadowColor=G.red;x.shadowBlur=30;glowText('IN TUTTA ITALIA',72,4,{size:60,weight:800,ls:6,glow:24});x.restore()}}

/* I2 · "Il tuo profilo verrà eliminato." */
function profileCard(X,Y,T,o={}){const{alpha=1,red=0}=o;x.save();x.globalAlpha*=alpha;x.translate(X,Y);glass(0,0,880,840,44,{rim:red>.5?[G.red,'#FF8899']:['#E1306C',G.violet],fill:.07});
  const ag=x.createLinearGradient(-370,-370,-230,-230);IGC.forEach((c,i)=>ag.addColorStop(i/4,c));x.strokeStyle=ag;x.lineWidth=9;x.beginPath();x.arc(-300,-300,70,0,7);x.stroke();
  const fg=x.createLinearGradient(-360,-360,-240,-240);fg.addColorStop(0,'#3FE0FF');fg.addColorStop(1,'#8B5CFF');x.fillStyle=fg;x.beginPath();x.arc(-300,-300,58,0,7);x.fill();
  x.fillStyle='rgba(255,255,255,.9)';x.beginPath();x.arc(-300,-317,20,0,7);x.fill();x.beginPath();x.arc(-300,-270,34,Math.PI,0);x.fill();
  glowText('@iltuoprofilo',-200,-330,{size:46,weight:800,align:'left',glow:8,maxW:9999});
  [['248','post'],['12.480','follower'],['530','seguiti']].forEach(([n,l],i)=>{glowText(n,-200+i*200,-268,{size:40,weight:800,align:'left',glow:0,maxW:9999});glowText(l,-200+i*200,-228,{size:28,weight:400,align:'left',glow:0,color:G.dim,maxW:9999})});
  for(let i=0;i<6;i++){const c=i%3,r=(i/3)|0;photo(-270+c*270,-10+r*255,240,i+2,T)}
  if(red>0){x.globalAlpha*=red*.45;x.fillStyle=G.red;rr(-440,-420,880,840,44);x.fill()}x.restore()}
function i2(T){bgDark(T,T>=K.b2?'red':'ig');typeLit('Il tuo profilo',CX,250,T,K.b1,22,{size:100,weight:700,lit:'#FF8A65'});typeLit('verrà cancellato.',CX,360,T,K.b1+.75,24,{size:84,weight:600,lit:G.red});
  const k=eo(p(T,K.b1-.25,K.b1+.3)),red=eo(p(T,K.b2,K.b2+.25));x.save();x.translate(0,(1-k)*160);profileCard(CX,860,T,{alpha:k,red});x.restore();
  if(T>=K.b2){glitch(T,K.b2,.5,1.4);const sk=p(T,K.b2,K.b2+.16);x.save();x.translate(CX,860);const s=L(2.6,1,eo(sk));x.scale(s,s);x.globalAlpha=clamp(sk*3);glass(0,0,760,150,30,{rim:[G.red,'#FF8899'],fill:.14,glowA:.9});x.fillStyle=hexA('#C3001F',.6);rr(-380,-75,760,150,30);x.fill();x.shadowColor=G.red;x.shadowBlur=40;glowText('PROFILO CANCELLATO',0,4,{size:66,weight:800,ls:4,glow:24});x.restore();flare(CX+300,800,620,Math.max(0,1-p(T,K.b2,K.b2+.6)),G.red)}}

/* I3 · Foto, storie, messaggi… tutto cancellato (stack of screens → glass shatter) */
function storiesPanel(X,Y,T,k){x.save();x.translate(X,Y);glass(0,0,800,230,40,{rim:['#E1306C',G.violet],fill:.07});for(let i=0;i<5;i++){const cx=-300+i*150;const ag=x.createLinearGradient(cx-60,-60,cx+60,60);IGC.forEach((c,j)=>ag.addColorStop(j/4,c));x.strokeStyle=ag;x.lineWidth=7;x.beginPath();x.arc(cx,-15,55,-Math.PI/2,-Math.PI/2+Math.PI*2*clamp(k*1.4-i*.12));x.stroke();
  const fg=x.createLinearGradient(cx-45,-60,cx+45,30);fg.addColorStop(0,['#FF8A65','#3FE0FF','#B44BFF','#3CFF8F','#FFD36E'][i]);fg.addColorStop(1,'#3D7BFF');x.fillStyle=fg;x.beginPath();x.arc(cx,-15,45,0,7);x.fill();glowText(['tu','Marco','Giulia','Calcetto','Mamma'][i],cx,75,{size:26,weight:500,glow:0,color:G.dim})}x.restore()}
function dmPanel(X,Y,T,k){x.save();x.translate(X,Y);glass(0,0,800,250,40,{rim:[G.cyan,G.violet],fill:.07});gIcon('msg',-330,-75,70,T,{cols:[G.white,'#E1306C',G.violet]});glowText('Messaggi',-275,-75,{size:38,weight:800,align:'left',glow:0,maxW:9999});
  [['Giulia','ahah mandami la foto'],['Marco','stasera ci sei?']].forEach(([n,m],i)=>{const y=10+i*80;x.fillStyle=['#B44BFF','#3FE0FF'][i];x.beginPath();x.arc(-330,y,28,0,7);x.fill();glowText(n,-285,y-14,{size:30,weight:700,align:'left',glow:0,maxW:9999});glowText(m,-285,y+18,{size:26,weight:400,align:'left',glow:0,color:G.dim,maxW:9999})});x.restore()}
function gridPanel(X,Y,T){x.save();x.translate(X,Y);glass(0,0,800,300,40,{rim:['#FFDD55','#E1306C'],fill:.07});for(let i=0;i<4;i++)photo(-285+i*190,0,170,i,T);x.restore()}
function i3(T){bgDark(T,'red');
  const words=[[K.c1,'Foto,'],[K.c2,'storie,'],[K.c3,'messaggi…']];
  let line='';for(const[t0,w]of words)if(T>=t0)line+=(line?' ':'')+w;if(T<K.c4t)glowText(line,CX,250,{size:96,weight:700,maxW:880});
  if(T>=K.c4t)typeLit('Tutto verrà cancellato.',CX,250,T,K.c4t,28,{size:96,weight:800,lit:G.red});
  const draw=()=>{const a=eo(p(T,K.c1,K.c1+.35)),b=eo(p(T,K.c2,K.c2+.35)),c=eo(p(T,K.c3,K.c3+.35));
    if(a>0){x.save();x.globalAlpha*=a;x.translate((1-a)*300,0);gridPanel(CX,560,T);x.restore()}
    if(b>0){x.save();x.globalAlpha*=b;x.translate((1-b)*300,0);storiesPanel(CX,860,T,p(T,K.c2,K.c2+.8));x.restore()}
    if(c>0){x.save();x.globalAlpha*=c;x.translate((1-c)*300,0);dmPanel(CX,1150,T,c);x.restore()}};
  shatter(T,K.c4+.05,1.0,draw,140,390,800,900,CX,820);
  if(T>=K.c4){flare(CX,820,800,Math.max(0,1-p(T,K.c4,K.c4+.5)),'#FFFFFF');halo(CX,820,T,K.c4,G.red,150,700);glitch(T,K.c4,.4)}}

/* I4 · "E i tuoi follower? Spariti." */
function i4(T){bgDark(T,'red');typeLit('E i tuoi follower?',CX,250,T,K.d1,22,{size:100,weight:700,lit:'#FF8A65'});
  const drain=eio(p(T,K.d1+.4,K.d2)),n=Math.round(12480*(1-drain));
  for(let i=0;i<110;i++){const a=i*2.399,r=230+((i*53)%10)*24,leave=clamp((drain*1.25)-rnd(i)*.25);const px=CX+Math.cos(a)*r*(1+leave*2.2),py=820+Math.sin(a)*r*.75*(1+leave*2.2)-leave*200;
    x.save();x.globalAlpha=(1-leave)*.9;const c=['#FF8A65','#E1306C','#B44BFF','#3FE0FF','#FFD36E'][i%5];x.fillStyle=c;x.shadowColor=c;x.shadowBlur=10;x.beginPath();x.arc(px,py,9+(i%3)*3,0,7);x.fill();x.restore()}
  bloom(CX,820,520,T>=K.d2?[G.red,'#7A0A2A']:['#E1306C',G.violet],.8);
  const sl=T>=K.d2?1+.25*Math.exp(-(T-K.d2)*8):1;x.save();x.translate(CX,800);x.scale(sl,sl);glowText(fmtN(n),0,0,{size:190,weight:800,color:T>=K.d2?'#FF5A6E':G.white,glow:44});glowText('follower',0,125,{size:54,weight:500,glow:0,color:G.dim});x.restore();
  if(T>=K.d2){typeLit('Spariti.',CX,1180,T,K.d2,20,{size:120,weight:800,lit:G.red});halo(CX,800,T,K.d2,G.red,220,640);flare(CX,800,620,Math.max(0,1-p(T,K.d2,K.d2+.5)),G.red);glitch(T,K.d2,.35)}}

/* I5 · "Anni di lavoro… in un secondo." years collapse, then whiteout */
function i5(T){bgDark(T,'red');typeLit('Anni di lavoro…',CX,250,T,K.e1,22,{size:104,weight:700,lit:'#FF8A65'});if(T>=K.e2)typeLit('in un secondo.',CX,370,T,K.e2,22,{size:84,weight:600,lit:G.red});if(T>=K.e3){const tk=p(T,K.e3,K.e3+.2);x.save();x.translate(CX,1200);x.scale(L(1.6,1,eo(tk)),L(1.6,1,eo(tk)));glowText('Tutto perso.',0,0,{size:120,weight:800,color:'#FF5A6E',glow:40,alpha:Math.min(1,tk*2.5)});x.restore()}
  const imp=ei(p(T,K.e2+.05,K.e3+.1));
  for(let i=0;i<10;i++){const yr=2016+i,k=eo(p(T,K.e1+i*.07,K.e1+.35+i*.07));if(k<=0)continue;const row=i%2,col=(i/2)|0;
    const X0=CX-360+col*180,Y0=700+row*260;const X=L(X0,CX,imp),Y=L(Y0,820,imp),s=(1-imp*.85)*back(clamp(k));
    x.save();x.globalAlpha=clamp(k*2)*(1-imp*.6);x.translate(X,Y);x.scale(s,s);photo(0,0,160,i,T);glowText(String(yr),0,118,{size:34,weight:700,glow:6});x.restore()}
  if(imp>0){bloom(CX,820,300+imp*500,['#FFFFFF','#FF3355'],imp);sparks(T,CX,900,400,'#FFFFFF',30,400,K.e2,imp)}if(T>=K.e3){halo(CX,820,T,K.e3,G.red,120,600);flare(CX,820,700,Math.max(0,1-p(T,K.e3,K.e3+.5)),'#FFFFFF')}}

/* I6 · whiteout → "Ok. Respira." the logo re-assembles → "Non è vero." */
function i6(T){bgDark(T,'ig');const LY=760;
  const br=p(T,K.f1+.2,K.f1+1.6);if(br>0&&br<1){x.save();x.globalAlpha=.6*Math.sin(br*Math.PI);x.strokeStyle='#FFFFFF';x.shadowColor='#E1306C';x.shadowBlur=30;x.lineWidth=4;x.beginPath();x.arc(CX,LY,260+120*Math.sin(br*Math.PI),0,7);x.stroke();x.restore()}
  const k=eo(p(T,K.f1+.9,K.f2));bloom(CX,LY,700,['#E1306C','#7638FA'],.4+.6*k);x.save();x.translate(CX,LY);x.rotate((T-K.f1)*.12);x.translate(-CX,-LY);beams(CX,LY,T,K.f1+.9,['#E1306C','#FFDD55',G.violet],Math.exp(-Math.max(0,T-K.f2)*3)*(T>=K.f2),11,1250,.15);x.restore();
  shatter(T,K.f1+.2,1.2,()=>igLogo(CX,LY,360,T),CX-180,LY-180,360,360,CX,LY,true,5);
  if(T>=K.f1+1.4){igLogo(CX,LY,360*(1+.06*Math.exp(-Math.max(0,T-K.f1-1.4)*6)),T);halo(CX,LY,T,K.f1+1.4,'#E1306C',190,560)}
  typeLit('Respira.',CX,280,T,K.f1,14,{size:120,weight:700,lit:'#FF8A65'});
  if(T>=K.f2){typeLit('Non è vero.',CX,1100,T,K.f2,20,{size:110,weight:800,lit:G.green});if(T>=K.f2b)typeLit('Stavo scherzando.',CX,1220,T,K.f2b,24,{size:64,weight:500,lit:G.green});const ck=p(T,K.f2+.4,K.f2+.7);gIcon('check',CX+180,LY-180,100*back(clamp(ck)),T,{alpha:clamp(ck*2),cols:[G.white,G.green,G.cyan]})}}

/* I7 · "Ma se ci hai creduto, è perché sembrava vero. E invece l'ho fatto io. Con Claude." */
function i7(T){bgDark(T,T>K.h2?'warm':'ig');rbeams(CX,1450,T,K.g1-.3,['#E1306C',G.violet],(T-K.g1)*.3-.4,9,1200,.8*(1-p(T,K.h2-.2,K.h2+.1)));
  if(T<K.g2){typeLit('Però per qualche secondo',CX,240,T,K.g1,26,{size:80,weight:700,lit:'#FF8A65'});typeLit('ci hai creduto, vero?',CX,340,T,K.g1b,24,{size:80,weight:600,lit:'#FF8A65'})}
  else if(T<K.h0){typeLit('Ecco quanto è potente',CX,240,T,K.g2,26,{size:80,weight:700,lit:G.cyan});typeLit('un video fatto bene.',CX,340,T,K.g2b,24,{size:80,weight:600,lit:G.cyan})}
  else if(T<K.h1){typeLit("E questo non l'ha fatto",CX,240,T,K.h0,26,{size:80,weight:700,lit:G.red});typeLit("un'agenzia.",CX,340,T,K.h0+.95,22,{size:80,weight:600,lit:G.red})}
  else{typeLit("L'ho fatto io,",CX,240,T,K.h1,22,{size:92,weight:700,lit:G.orange});if(T>=K.h3)typeLit('in 15 minuti.',CX,345,T,K.h3,20,{size:80,weight:600,lit:G.orange})}
  const fk=eo(p(T,K.g1+.3,K.g1+.9));if(fk>0){const fw=380*(1+.15*p(T,K.g1+.9,K.h2)),fh=fw*16/9,FY=800;x.save();x.globalAlpha=fk;x.translate(CX,FY+(1-fk)*120);bloom(0,0,520,['#E1306C',G.violet],.8);
    x.save();rr(-fw/2,-fh/2,fw,fh,30);x.clip();x.translate(-fw/2,-fh/2);x.scale(fw/W,fh/H);const fo=p(T,K.h2-.3,K.h2-.05);if(fo<1){x.save();x.globalAlpha*=1-fo;i1(((T-K.g1)%K.b1)+.4);x.restore()}if(fo>0){x.fillStyle=`rgba(6,6,14,${fo})`;x.fillRect(0,0,W,H)}x.restore();
    glass(0,0,fw+14,fh+14,36,{rim:['#E1306C',G.violet],fill:0,glowA:.8});x.restore();
  }
  {const ak=p(T,K.h0+.85,K.h0+1.2),ao=1-p(T,K.h2-.35,K.h2-.05);if(ak>0&&ao>0){x.save();x.globalAlpha=clamp(ak*2)*ao;x.translate(CX+(1-eo(ak))*300,1330);glass(0,0,520,130,40,{rim:[G.cyan,G.purple],fill:.1});gIcon('building',-190,0,90,T,{cols:[G.white,G.cyan,G.purple]});glowText('Agenzia',-120,2,{size:60,weight:800,align:'left',glow:8,maxW:9999});
    const st=eo(p(T,K.h0+1.25,K.h0+1.5));if(st>0){x.strokeStyle=G.red;x.shadowColor=G.red;x.shadowBlur=20;x.lineWidth=7;x.lineCap='round';x.font='800 60px Int';const nw=x.measureText('Agenzia').width;x.beginPath();x.moveTo(-126,0);x.lineTo(-126+(nw+12)*st,0);x.stroke();x.shadowBlur=0;gIcon('x',190,0,84*back(clamp(p(T,K.h0+1.4,K.h0+1.7))),T,{alpha:clamp(p(T,K.h0+1.4,K.h0+1.6)*2),cols:['#FFFFFF','#FF8899',G.red]})}x.restore()}}
  if(T>=K.h2){const k=p(T,K.h2,K.h2+.35),hit=Math.exp(-(T-K.h2)*3.5);beams(CX,800,T,K.h2,[G.orange,'#FFB07A'],hit,11,1250,.15);x.save();x.translate(CX,800);const s=back(clamp(k));x.scale(s,s);glass(0,0,230,230,62,{rim:[G.orange,G.violet],fill:.14,glowA:.9});asterisk(0,0,70,T,G.orange);x.restore();
    flare(CX,800,480,Math.max(0,1-p(T,K.h2,K.h2+.5)),G.orange);halo(CX,800,T,K.h2,G.orange,140,560);
    const tk=p(T,K.h2+.05,K.h2+.3);x.save();x.translate(CX,1330);x.scale(L(1.4,1,eo(tk)),L(1.4,1,eo(tk)));x.globalAlpha*=Math.min(1,tk*2);asterisk(-300,0,48,T,G.orange);glowText('con Claude',40,0,{size:112,weight:800,color:'#FFB07A',glow:40});x.restore()}}

/* I9 · "Gli descrivo la scena… e lui crea animazioni, effetti e suoni." */
function i9(T){bgDark(T,'warm');rbeams(CX,1450,T,K.j1-.3,[G.orange,G.violet],(T-K.j1)*.3-.4,9,1200,.75);typeLit("Gli scrivo l'idea",CX,250,T,K.j1,22,{size:100,weight:700,lit:G.orange});
  const bk=eo(p(T,K.j1,K.j1+.35)),BY=520;x.save();x.globalAlpha=bk;x.translate(0,(1-bk)*80);glass(CX,BY,880,130,65,{rim:[G.orange,G.violet],fill:.08});asterisk(CX-375,BY,30,T,G.orange);
  const s='Video: Instagram chiude in Italia',ty=typed(s,K.j1+.15,40,T);glowText(ty||'Scrivi a Claude…',CX-330,BY+2,{size:40,weight:ty?600:400,align:'left',glow:ty?8:0,color:ty?G.white:G.dim,maxW:9999});
  const sent=p(T,K.j1a,K.j1a+.25);gIcon(sent>0?'check':'up',CX+375,BY,90,T,{cols:sent>0?[G.white,G.green,G.cyan]:[G.white,G.orange,G.violet]});x.restore();
  if(T>=K.j1a-.95&&T<K.j1a+.7){const ck=p(T,K.j1a-.95,K.j1a-.15);const cx=L(1300,CX+385,eo(ck)),cy=L(1500,BY+12,eo(ck));x.save();x.globalAlpha=1-p(T,K.j1a+.35,K.j1a+.7);cursor(cx,cy,p(T,K.j1a,K.j1a+.3));x.restore()}
  if(T>=K.j1a)halo(CX+375,BY,T,K.j1a,G.orange,50,200);
  typeLit('e lui crea',CX,690,T,K.j1b,22,{size:70,weight:500,lit:G.orange});
  [[K.j2,'wave','Animazioni',270],[K.j3,'spark','Effetti',540],[K.j4,'note','Suoni',810]].forEach(([t0,kd,lb,X])=>{const k=p(T,t0,t0+.4);if(k<=0)return;
    const lk=eo(p(T,t0-.15,t0+.2));x.save();x.strokeStyle=hexA(G.orange,.7);x.shadowColor=G.orange;x.shadowBlur=14;x.lineWidth=3;x.beginPath();x.moveTo(CX,745);x.quadraticCurveTo((CX+X)/2,800,L(CX,X,lk),L(745,862,lk));x.stroke();x.restore();
    tileL(kd,X,960,190,T,lb,k,{cols:[G.white,G.orange,G.violet]});halo(X,960,T,t0+.15,G.orange,96,135)})}

/* I10 · "Ora immagina cosa può fare per il tuo business." */
function i10(T){bgDark(T,'cool');rbeams(CX,1450,T,K.k1-.3,[G.cyan,G.violet],(T-K.k1)*.3-.4,9,1200,.75);typeLit('Ora immagina',CX,250,T,K.k1,22,{size:100,weight:700,lit:G.cyan});typeLit('un video così per il tuo business.',CX,350,T,K.k1+.55,32,{size:62,weight:500,lit:G.cyan});
  [['building','Il tuo negozio'],['user','Il tuo studio'],['film','Il tuo brand']].forEach(([ic,nm],i)=>{const t0=K.k2+i*.35,k=p(T,t0-.1,t0+.3);if(k<=0)return;const Y=600+i*250,dx=(1-eo(k))*600;
    x.save();x.translate(CX+dx,Y);x.globalAlpha=clamp(k*2);glass(0,0,820,190,44,{rim:[G.cyan,G.violet],fill:.07});gIcon(ic,-320,0,120,T,{cols:[G.white,G.cyan,G.purple]});glowText(nm,-230,-22,{size:58,weight:800,align:'left',glow:8,maxW:9999});glowText('video come questo',-230,36,{size:34,weight:400,align:'left',glow:0,color:G.dim,maxW:9999});
    const gk=p(T,t0+.3,t0+1.2);x.strokeStyle=G.green;x.shadowColor=G.green;x.shadowBlur=14;x.lineWidth=5;x.lineJoin='round';x.beginPath();for(let j=0;j<=12;j++){const q=j/12;if(q>gk)break;const xx=220+q*150,yy=40-q*q*70-Math.sin(j*1.7)*6;j?x.lineTo(xx,yy):x.moveTo(xx,yy)}x.stroke();x.restore()})}

/* I11 · CTA */
function i11(T){bgDark(T,'warm');rbeams(CX,1450,T,K.m1-.3,[G.orange,G.violet],(T-K.m1)*.28-.45,9,1250,.7);sparks(T,CX,1350,900,G.orange,30,280,K.m1,.8);typeLit('Vuoi sapere il metodo?',CX,260,T,K.m1,26,{size:92,weight:700,lit:G.orange});
  const t0=K.m1,cl=ei(p(T,t0+.5,t0+1.1));['msg','spark','note','eye','wave','star'].forEach((kd,i)=>{const a=T*1.6+i*Math.PI/3,r=L(380,0,cl);const depth=(Math.sin(a)+1)/2;gIcon(kd,CX+Math.cos(a)*r,680+Math.sin(a)*r*.5,L(80,140,depth)*(1-cl*.9)*eo(p(T,t0,t0+.4)),T,{blur:(1-depth)*6,alpha:1-cl})});
  if(T>=t0+1.1){const k=back(p(T,t0+1.1,t0+1.4));x.save();x.translate(CX,680);x.scale(k,k);glass(0,0,200,200,54,{rim:[G.orange,G.violet],fill:.06});asterisk(0,0,60,T,G.orange);x.restore();flare(CX,680,500,Math.max(0,1-p(T,t0+1.1,t0+1.7)),G.orange)}
  glowText('Commenta',CX,900,{size:64,weight:400,color:G.dim,glow:0,alpha:p(T,K.m2,K.m2+.15)});
  if(T>=K.m2c-.05){const k=p(T,K.m2c-.05,K.m2c+.15);x.save();x.translate(CX,1030);x.scale(L(1.5,1,eo(k)),L(1.5,1,eo(k)));glowText('CLAUDE',0,0,{size:170,weight:900,color:'#FFB07A',glow:60,ls:4,maxW:760,alpha:Math.min(1,k*2.5)});x.restore()}
  const tS=K.m2c,tC=K.m2c+.55,bk=p(T,K.m2-.3,K.m2);if(bk>0){const sent=p(T,tC+.07,tC+.3);x.save();x.globalAlpha=bk;glass(CX,1230,800,124,62,{rim:sent>0?[G.green,G.cyan]:[G.cyan,G.purple],fill:.08});
    if(sent<=0){const ty=typed('CLAUDE',tS,14,T);glowText(ty||'Aggiungi un commento…',CX-350,1232,{size:ty?46:40,weight:ty?700:400,align:'left',color:ty?G.white:G.dim,glow:ty?12:0,maxW:9999})}else{glowText('Commento inviato',CX-350,1232,{size:44,weight:600,color:G.green,align:'left',glow:20,alpha:sent,maxW:9999})}
    gIcon(sent>0?'check':'up',CX+330,1230,86,T,{cols:sent>0?[G.green,G.cyan,G.green]:[G.cyan,G.purple,G.blue]});x.restore()}
  if(T>=K.m3)typeLit('Ti mando la guida completa.',CX,1400,T,K.m3,26,{size:72,weight:700,lit:G.green});
  const cx=L(L(1300,860,eo(p(T,K.m2-.3,K.m2+.3))),874,eo(p(T,tC-.25,tC))),cy=L(L(1750,1290,eo(p(T,K.m2-.3,K.m2+.3))),1235,eo(p(T,tC-.25,tC)));if(T>=K.m2-.3)cursor(cx,cy,p(T,tC,tC+.3))}

function scenes(T){
  seg(T,0,K.b1,i1,'','L',[.14,-50]);seg(T,K.b1,K.c1,i2,'L','L');seg(T,K.c1,K.d1,i3,'L','L');seg(T,K.d1,K.e1,i4,'L','L');seg(T,K.e1,K.f1,i5,'L','',[.16,0]);
  seg(T,K.f1,K.g1,i6,'','U');seg(T,K.g1,K.j1,i7,'U','L');seg(T,K.j1,K.k1,i9,'L','L');seg(T,K.k1,K.m1,i10,'L','Zin');seg(T,K.m1,DUR+.1,i11,'Zin','',[.16,-40])}
function world(T){scenes(T);
  const wo=p(T,K.wo-.25,K.f1)*(1-p(T,K.f1,K.f1+.7));if(wo>0){x.save();x.globalAlpha=Math.min(1,wo*1.15);x.fillStyle='#FFFFFF';x.fillRect(-300,-400,W+600,H+800);x.restore()}
  if(T>=K.f2-.05&&T<K.g1+.9){const k=p(T,K.f2,K.f2+.3)*(1-p(T,K.g1+.6,K.g1+.9));x.save();x.globalAlpha=k;glass(CX,1390,700,92,46,{rim:['#FFFFFF','#FF8899'],fill:.12,glowA:.4});glowText('NON È UNA NOTIZIA REALE',CX,1392,{size:40,weight:800,ls:3,glow:8});x.restore()}}
