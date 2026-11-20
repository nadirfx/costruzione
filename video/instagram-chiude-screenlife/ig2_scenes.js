/* ===================== INSTAGRAM CHIUDE · SCREENLIFE edition =====================
   The whole story lives inside the phone. Timings from K (real voice). */
const K={a0:0,a1:2.54,a2:3.02,a3:3.34,b1:4.31,b2:5.6,c1:6.38,c2:6.85,c3:7.39,c4t:7.97,c4:8.63,d1:9.32,d2:10.45,e1:11.99,e2:12.91,e3:14.23,
  f1:15.43,rw0:15.95,rw1:16.75,f2:16.93,f2b:17.55,g1:18.54,g1b:19.73,g2:20.86,g2b:22.03,h0:23.32,h1:25.4,h2:26.17,h3:26.43,j1:27.5,j1a:28.5,j1b:28.68,
  j2:29.4,j3:30.06,j4:30.9,k1:31.3,k2:32.62,m1:34.61,m2:36.39,m2c:36.88,m3:37.4,end:40.1};
const UI={bg:'#FFFFFF',ink:'#0A0A0A',sub:'#737373',line:'#DBDBDB',blue:'#0095F6',red:'#ED4956',soft:'#EFEFEF'};
function T_(s,X,Y,size,weight=400,color=UI.ink,align='left',alpha=1){if(alpha<=0)return;x.save();x.globalAlpha*=alpha;x.font=`${weight} ${size}px Int`;x.fillStyle=color;x.textAlign=align;x.textBaseline='middle';x.fillText(s,X,Y);x.restore()}
function tw2(s,size,weight){x.save();x.font=`${weight} ${size}px Int`;const w=x.measureText(s).width;x.restore();return w}
const PAL=[['#FF8A65','#B44BFF'],['#3FE0FF','#3D7BFF'],['#FFD36E','#FF3D8B'],['#3CFF8F','#2B7FFF'],['#B44BFF','#FF3355'],['#FFB199','#FF0844'],['#43E97B','#38F9D7'],['#FA709A','#FEE140'],['#30CFD0','#330867'],['#A18CD1','#FBC2EB'],['#F6D365','#FDA085'],['#5EE7DF','#B490CA']];
function img(X,Y,w,h,i,grey=0){x.save();x.beginPath();x.rect(X,Y,w,h);x.clip();const pl=PAL[i%PAL.length];const g=x.createLinearGradient(X,Y,X+w*.3,Y+h);g.addColorStop(0,pl[0]);g.addColorStop(1,pl[1]);x.fillStyle=g;x.fillRect(X,Y,w,h);
  x.fillStyle='rgba(255,245,220,.85)';x.beginPath();x.arc(X+w*.7,Y+h*.3,Math.min(w,h)*.09,0,7);x.fill();x.fillStyle='rgba(10,10,30,.45)';x.beginPath();x.moveTo(X,Y+h);x.lineTo(X+w*.32,Y+h*.5);x.lineTo(X+w*.55,Y+h*.72);x.lineTo(X+w*.75,Y+h*.55);x.lineTo(X+w,Y+h*.8);x.lineTo(X+w,Y+h);x.fill();
  if(grey>0){x.globalAlpha=grey;x.fillStyle=UI.soft;x.fillRect(X,Y,w,h);x.globalAlpha=1}x.restore()}
function statusBar(dark=false){const c=dark?'#FFFFFF':UI.ink;T_('9:41',80,62,40,700,c);x.save();x.fillStyle=c;for(let i=0;i<4;i++)x.fillRect(850+i*16,70-i*7,10,10+i*7);x.strokeStyle=c;x.lineWidth=4;x.beginPath();x.roundRect(930,48,64,30,8);x.stroke();x.fillRect(936,54,46,18);x.fillRect(997,57,5,12);x.restore()}
function heartI(X,Y,s,fill=false,col=UI.ink){x.save();x.translate(X,Y);x.beginPath();x.moveTo(0,s*.35);x.bezierCurveTo(-s*.9,-s*.15,-s*.45,-s*.75,0,-s*.3);x.bezierCurveTo(s*.45,-s*.75,s*.9,-s*.15,0,s*.35);if(fill){x.fillStyle=col;x.fill()}else{x.strokeStyle=col;x.lineWidth=s*.09;x.stroke()}x.restore()}
function bubbleI(X,Y,s,col=UI.ink){x.save();x.strokeStyle=col;x.lineWidth=s*.09;x.beginPath();x.arc(X,Y,s*.42,.6,Math.PI*2.35);x.lineTo(X+s*.42,Y+s*.42);x.closePath();x.stroke();x.restore()}
function planeI(X,Y,s,col=UI.ink){x.save();x.strokeStyle=col;x.lineWidth=s*.09;x.lineJoin='round';x.beginPath();x.moveTo(X-s*.45,Y-s*.35);x.lineTo(X+s*.45,Y-s*.35);x.lineTo(X-s*.05,Y+s*.45);x.lineTo(X-s*.12,Y);x.closePath();x.moveTo(X-s*.12,Y);x.lineTo(X+s*.45,Y-s*.35);x.stroke();x.restore()}
function ringAv(X,Y,r,i,o={}){const{ring=true,grey=false}=o;if(ring){const g=x.createLinearGradient(X-r,Y+r,X+r,Y-r);g.addColorStop(0,'#FFDD55');g.addColorStop(.45,'#FF543E');g.addColorStop(1,'#C837AB');x.strokeStyle=grey?UI.line:g;x.lineWidth=r*.09;x.beginPath();x.arc(X,Y,r,0,7);x.stroke()}
  x.save();x.beginPath();x.arc(X,Y,r*.84,0,7);x.clip();if(grey){x.fillStyle=UI.soft;x.fillRect(X-r,Y-r,2*r,2*r);x.fillStyle='#C7C7C7';x.beginPath();x.arc(X,Y-r*.18,r*.3,0,7);x.fill();x.beginPath();x.arc(X,Y+r*.62,r*.55,Math.PI,0);x.fill()}else img(X-r,Y-r,2*r,2*r,i);x.restore()}
function topBar(){T_('Instagram',50,160,58,800,UI.ink);heartI(900,165,52);planeI(990,160,52)}
const STO=['La tua storia','giulia.r','marco_92','ale.design','sara.ph'];
function stories(Y,grey=0){STO.forEach((n,i)=>{ringAv(110+i*215,Y,82,i+3,{grey:grey>i/5});T_(n,110+i*215,Y+120,28,400,UI.ink,'center')})}
function post(Y,i,name,likes,o={}){const{grey=0,liked=0}=o;ringAv(70,Y+50,38,i+1,{ring:true});T_(name,130,Y+50,34,700);T_('•••',1010,Y+45,34,700,UI.ink,'center');img(0,Y+110,1080,1080,i,grey);
  const ay=Y+1260;heartI(60,ay,58,liked>0,liked>0?UI.red:UI.ink);bubbleI(160,ay,56);planeI(260,ay,56);x.save();x.strokeStyle=UI.ink;x.lineWidth=5;x.beginPath();x.moveTo(990,ay-28);x.lineTo(990,ay+28);x.lineTo(1015,ay+10);x.lineTo(1040,ay+28);x.lineTo(1040,ay-28);x.closePath();x.stroke();x.restore();
  T_(`Piace a ${likes} persone`,30,ay+70,32,700)}
function feed(T,scroll=0,o={}){x.fillStyle=UI.bg;x.fillRect(0,0,W,H);x.save();x.translate(0,-scroll);topBar();stories(330,o.sgrey||0);x.fillStyle=UI.line;x.fillRect(0,500,W,2);
  post(520,0,o.n1||'viaggi.nel.mondo',o.l1||'1.284',o);post(1940,2,o.n2||'giulia.r',o.l2||'932',o);post(3360,5,o.n3||'marco_92','2.107',o);x.restore();
  x.fillStyle='rgba(255,255,255,.96)';x.fillRect(0,0,W,110);statusBar();navBar()}
function navBar(){x.fillStyle='#FFFFFF';x.fillRect(0,1790,W,130);x.fillStyle=UI.line;x.fillRect(0,1790,W,2);x.save();x.strokeStyle=UI.ink;x.lineWidth=5;for(let i=0;i<5;i++){const X=108+i*216,Y=1850;x.beginPath();if(i===0){x.moveTo(X-30,Y+25);x.lineTo(X-30,Y-8);x.lineTo(X,Y-32);x.lineTo(X+30,Y-8);x.lineTo(X+30,Y+25);x.closePath()}else if(i===1){x.arc(X-5,Y-5,24,0,7);x.moveTo(X+13,Y+13);x.lineTo(X+30,Y+30)}else if(i===2){x.roundRect(X-30,Y-30,60,60,16);x.moveTo(X,Y-15);x.lineTo(X,Y+15);x.moveTo(X-15,Y);x.lineTo(X+15,Y)}else if(i===3){x.roundRect(X-30,Y-30,60,60,16);x.moveTo(X-8,Y-12);x.lineTo(X+12,Y);x.lineTo(X-8,Y+12);x.closePath()}else{x.arc(X,Y,30,0,7)}x.stroke()}x.restore()}
/* iOS-style push notification */
function banner(T,k,title,msg,clip='',o={}){if(k<=0)return;const{red=0,green=0}=o;x.save();const Y=L(-300,190,eo(k));x.translate(0,Y);x.shadowColor='rgba(0,0,0,.25)';x.shadowBlur=40;x.shadowOffsetY=12;x.fillStyle='rgba(245,245,247,.97)';rr(30,0,1020,clip?250:210,44);x.fill();x.shadowBlur=0;x.shadowOffsetY=0;
  if(red>0){x.globalAlpha=red;x.strokeStyle=UI.red;x.lineWidth=6;rr(30,0,1020,clip?250:210,44);x.stroke();x.globalAlpha=1}if(green>0){x.globalAlpha=green;x.strokeStyle='#2DBE60';x.lineWidth=6;rr(30,0,1020,clip?250:210,44);x.stroke();x.globalAlpha=1}
  igLogo(118,105,104,T);T_('INSTAGRAM',196,52,26,600,UI.sub);T_('ora',1010,52,26,400,UI.sub,'right');T_(title,196,100,38,800,red>.5?UI.red:green>.5?'#1E9E4C':UI.ink);T_(msg,196,148,32,400,UI.ink);if(clip)T_(clip,196,196,30,400,UI.sub);x.restore()}
/* iOS alert */
function alertBox(k,title,msg,b1,b2){if(k<=0)return;x.save();x.fillStyle=`rgba(0,0,0,${.4*clamp(k*2)})`;x.fillRect(0,0,W,H);x.translate(CX,940);const s=L(1.25,1,back(clamp(k)));x.scale(s,s);x.globalAlpha=clamp(k*3);x.fillStyle='rgba(242,242,247,.98)';rr(-380,-210,760,420,40);x.fill();
  T_(title,0,-130,44,800,UI.ink,'center');T_(msg[0],0,-62,34,400,UI.ink,'center');T_(msg[1],0,-18,34,400,UI.ink,'center');x.fillStyle='#C6C6C8';x.fillRect(-380,60,760,2);x.fillRect(-380,135,760,2);T_(b1,0,98,38,600,UI.red,'center');T_(b2,0,172,38,400,UI.blue,'center');x.restore()}
function profile(T,o={}){const{fol='12.480',grey=0,hl=0,dead=0,folc=UI.ink}=o;x.fillStyle=UI.bg;x.fillRect(0,0,W,H);statusBar();x.save();x.translate(0,0);
  T_('iltuoprofilo',50,160,50,800);ringAv(150,350,118,4,{grey:dead>.5});
  [['248','post'],[fol,'follower'],['530','seguiti']].forEach(([n,l],i)=>{T_(n,420+i*230,320,46,800,i===1?folc:UI.ink,'center');T_(l,420+i*230,372,32,400,UI.ink,'center')});
  T_('Il tuo nome',50,520,34,700);T_('Foto, viaggi, ricordi. Dal 2016.',50,566,32,400);
  x.fillStyle=UI.soft;rr(40,620,490,80,18);x.fill();rr(550,620,490,80,18);x.fill();T_('Modifica profilo',285,660,32,600,UI.ink,'center');T_('Condividi profilo',795,660,32,600,UI.ink,'center');
  ['Estate','Amici','2019','Viaggi'].forEach((n,i)=>{const X=110+i*220;x.strokeStyle=UI.line;x.lineWidth=4;if(hl>i/4){x.setLineDash([10,10])}x.beginPath();x.arc(X,800,70,0,7);x.stroke();x.setLineDash([]);x.save();x.globalAlpha=1-clamp(hl*4-i);x.beginPath();x.arc(X,800,60,0,7);x.clip();img(X-60,740,120,120,i+6);x.restore();T_(n,X,905,28,400,UI.ink,'center')});
  x.fillStyle=UI.line;x.fillRect(0,960,W,2);x.fillStyle=UI.ink;x.fillRect(0,1018,360,4);
  for(let i=0;i<12;i++){const c=i%3,r=(i/3)|0;const g=clamp(grey*14-i*1.0);img(c*361,1026+r*361,357,357,i,g);if(g>.6){x.save();x.globalAlpha=g;x.strokeStyle='#C7C7C7';x.lineWidth=5;const cx=c*361+178,cy=1026+r*361+178;x.beginPath();x.roundRect(cx-40,cy-30,80,60,10);x.stroke();x.beginPath();x.arc(cx,cy,14,0,7);x.stroke();x.restore()}}
  x.restore();navBar()}
const DMS=[['giulia.r','Mandami le foto di ieri!',1],['marco_92','Stasera ci sei?',2],['Mamma','Chiamami quando puoi',3],['ale.design','Ahah troppo forte',4],['Calcetto','Giovedì ore 21',5],['sara.ph','Grazie mille ❤',6]];
function dms(T,gone=0,col=0){x.fillStyle=UI.bg;x.fillRect(0,0,W,H);statusBar();T_('iltuoprofilo',50,160,46,800);T_('Messaggi',50,260,40,800);
  DMS.forEach(([n,m,i],j)=>{const Y=360+j*170,g=clamp(gone*7-j);const dy=col*col*(900+j*120);x.save();x.translate(0,dy);x.globalAlpha=1-clamp(col*1.5-j*.1);ringAv(110,Y,64,i,{ring:false,grey:g>.5});T_(n,210,Y-24,36,700,g>.5?UI.sub:UI.ink);T_(g>.5?'Messaggio non disponibile':m.replace('❤',''),210,Y+24,32,400,g>.5?UI.red:UI.sub);x.restore()});navBar()}
/* iOS home screen with app deletion */
function homeScreen(T,o={}){const{jig=0,xk=0,del=0,dlg=0,off=0}=o;const g=x.createLinearGradient(0,0,W,H);g.addColorStop(0,'#2B1A5E');g.addColorStop(.5,'#6B2C91');g.addColorStop(1,'#E25E6B');x.fillStyle=g;x.fillRect(0,0,W,H);statusBar(true);
  const cols=['#34C759','#007AFF','#FF9500','#FF2D55','#5856D6','#AF52DE','#5AC8FA','#FFCC00','#8E8E93','#FF3B30','#30B0C7','#A2845E','#64D2FF','#32D74B','#BF5AF2','#FF6482'];
  const names=['Telefono','Foto','Note','Musica','Meteo','Podcast','Mappe','Calcolatrice','Impostazioni','Calendario','Salute','Wallet','Orologio','Messaggi','Fotocamera','Libri'];
  for(let i=0;i<16;i++){const c=i%4,r=(i/4)|0,X=150+c*260,Y=300+r*300;if(i===5){continue}const jr=jig*Math.sin(T*28+i)*.05;x.save();x.translate(X,Y);x.rotate(jr);x.fillStyle=cols[i];x.shadowColor='rgba(0,0,0,.25)';x.shadowBlur=14;rr(-85,-85,170,170,40);x.fill();x.shadowBlur=0;x.fillStyle='rgba(255,255,255,.85)';x.beginPath();x.arc(0,0,38,0,7);x.fill();x.restore();T_(names[i],X,Y+120,28,500,'#FFFFFF','center')}
  {const X=150+1*260,Y=300+1*300,s=(1-ei(clamp(del)))*170;if(s>2){x.save();x.translate(X,Y);x.rotate(jig*Math.sin(T*28+5)*.06);igLogo(0,0,s,T);if(xk>0){x.globalAlpha=clamp(xk*3);x.fillStyle='rgba(120,120,128,.95)';x.beginPath();x.arc(-80,-80,30*back(clamp(xk)),0,7);x.fill();x.fillStyle='#fff';x.fillRect(-94,-83,28,6)}x.restore();T_('Instagram',X,Y+120,28,500,'#FFFFFF','center',1-clamp(del*2))}
   if(del>0&&del<1){x.save();x.globalCompositeOperation='lighter';for(let i=0;i<22;i++){const a=i*2.4,d=eo(del)*240*(.6+rnd(i));x.globalAlpha=1-del;x.fillStyle=['#FFDD55','#FF543E','#C837AB','#FFFFFF'][i%4];x.beginPath();x.arc(X+Math.cos(a)*d,Y+Math.sin(a)*d,8,0,7);x.fill()}x.restore()}}
  if(dlg>0){x.save();x.translate(CX,1500);const s=L(1.2,1,back(clamp(dlg)));x.scale(s,s);x.globalAlpha=clamp(dlg*3)*(1-clamp(del*3));x.fillStyle='rgba(242,242,247,.97)';rr(-360,-170,720,340,36);x.fill();T_('Eliminare "Instagram"?',0,-100,40,800,UI.ink,'center');T_('Tutti i dati verranno eliminati.',0,-40,32,400,UI.ink,'center');x.fillStyle='#C6C6C8';x.fillRect(-360,10,720,2);T_('Elimina app',0,85,38,600,UI.red,'center');x.restore()}
  if(off>0){const q=clamp(off);x.save();x.fillStyle='#000';if(q<.5){const h=L(H,6,q*2);x.fillRect(0,0,W,(H-h)/2);x.fillRect(0,(H+h)/2,W,(H-h)/2);x.fillStyle=`rgba(255,255,255,${q*1.6})`;x.fillRect(0,(H-h)/2,W,h)}else{x.fillRect(0,0,W,H);const w=L(W,0,(q-.5)*2);x.fillStyle='#fff';x.fillRect((W-w)/2,H/2-3,w,6)}x.restore()}}
/* Claude chat (light) */
function claudeChat(T,o={}){const{sc=0}=o;x.fillStyle='#F5F1EA';x.fillRect(0,0,W,H);statusBar();x.save();x.translate(0,-sc);
  asterisk(80,175,34,T*0,'#D97757');T_('Claude',130,178,44,700,'#3D3929');
  const u1=p(T,K.h1+.1,K.h1+.4);if(u1>0){x.save();x.globalAlpha=clamp(u1*2);x.translate(0,(1-eo(u1))*40);x.fillStyle='#E9E3D7';rr(230,280,800,250,36);x.fill();['Crea un video verticale:','"Instagram chiude in Italia".','Notizia finta, con smentita.','Stile: dentro al telefono.'].forEach((l,i)=>T_(l,270,330+i*52,34,400,'#3D3929'));x.restore()}
  const a1=p(T,K.h2-.05,K.h2+.3);if(a1>0){x.save();x.globalAlpha=clamp(a1*2);asterisk(80,600,26,T,'#D97757');T_('Ecco il tuo video.',130,604,36,400,'#3D3929');x.translate(0,(1-eo(a1))*40);x.fillStyle='#FFFFFF';x.shadowColor='rgba(0,0,0,.08)';x.shadowBlur=20;rr(110,660,620,420,30);x.fill();x.shadowBlur=0;
    x.save();rr(130,680,200,356,20);x.clip();x.drawImage(FEEDC,130,680,200,356);x.restore();T_('instagram-chiude.mp4',360,760,32,700,'#3D3929');T_('Video · 0:40 · 1080×1920',360,808,28,400,'#83827D');
    x.fillStyle='#D97757';rr(360,880,220,70,35);x.fill();T_('Scarica',470,916,30,700,'#FFFFFF','center');x.restore()}
  const tk=p(T,K.h3,K.h3+.3);if(tk>0){x.save();x.translate(890,604);const s=back(clamp(tk));x.scale(s,s);x.globalAlpha=clamp(tk*2);x.fillStyle='#FFFFFF';x.strokeStyle='#D97757';x.lineWidth=4;rr(-130,-40,260,80,40);x.fill();x.stroke();x.beginPath();x.arc(-80,0,20,0,7);x.stroke();x.beginPath();x.moveTo(-80,0);x.lineTo(-80,-12);x.moveTo(-80,0);x.lineTo(-70,6);x.stroke();T_('15 min',-45,2,34,800,'#D97757');x.restore()}
  const u2=p(T,K.j1a,K.j1a+.3);if(u2>0){x.save();x.globalAlpha=clamp(u2*2);x.translate(0,(1-eo(u2))*60);x.fillStyle='#E9E3D7';rr(330,1150,700,110,36);x.fill();T_('Ora fammene uno per il mio negozio',370,1205,32,400,'#3D3929');x.restore()}
  if(T>=K.j1b){asterisk(80,1330,26,T*(T<K.j4+.4?1:0),'#D97757');T_(typed('Creo animazioni, effetti e suoni…',K.j1b,30,T),130,1334,34,400,'#3D3929');
    [[K.j2,'Animazioni','wave'],[K.j3,'Effetti','spark'],[K.j4,'Suoni','note']].forEach(([t0,n,ic],i)=>{const k=p(T,t0,t0+.3);if(k<=0)return;const Y=1420+i*130;x.save();x.globalAlpha=clamp(k*2);x.translate((1-eo(k))*80,0);x.fillStyle='#FFFFFF';rr(110,Y,620,104,26);x.fill();
      x.fillStyle='#F0E6DA';rr(126,Y+14,76,76,18);x.fill();x.save();x.translate(164,Y+52);x.strokeStyle='#D97757';x.fillStyle='#D97757';x.lineWidth=6;x.lineCap='round';if(ic==='wave'){x.beginPath();x.moveTo(-22,4);x.bezierCurveTo(-10,-22,6,26,22,-6);x.stroke()}else if(ic==='spark'){x.beginPath();for(let q=0;q<8;q++){const r=q%2?8:24,a=q*Math.PI/4-Math.PI/2;x.lineTo(Math.cos(a)*r,Math.sin(a)*r)}x.closePath();x.fill()}else{x.beginPath();x.arc(-8,12,10,0,7);x.fill();x.fillRect(0,-22,6,34);x.beginPath();x.moveTo(3,-22);x.quadraticCurveTo(22,-18,20,-4);x.stroke()}x.restore();
      T_(n,226,Y+52,34,700,'#3D3929');const pr=p(T,t0+.1,t0+.6);x.fillStyle='#EDE6DB';rr(470,Y+44,200,16,8);x.fill();x.fillStyle=pr>=1?'#2DBE60':'#D97757';rr(470,Y+44,200*pr,16,8);x.fill();x.restore()})}
  x.restore();
  x.fillStyle='#FFFFFF';x.shadowColor='rgba(0,0,0,.08)';x.shadowBlur=20;rr(40,1660,1000,110,55);x.fill();x.shadowBlur=0;const it=T>=K.j1&&T<K.j1a?typed('Ora fammene uno per il mio negozio',K.j1+.1,34,T):'';T_(it||'Scrivi a Claude…',90,1716,34,400,it?'#3D3929':'#A8A49B');
  x.fillStyle=it?'#D97757':'#E6DFD3';x.beginPath();x.arc(980,1715,38,0,7);x.fill();x.strokeStyle='#fff';x.lineWidth=6;x.lineCap='round';x.beginPath();x.moveTo(980,1735);x.lineTo(980,1697);x.moveTo(964,1712);x.lineTo(980,1696);x.lineTo(996,1712);x.stroke()}
/* comments sheet */
const CMS=[['giulia.r','Ci sono cascata in pieno 😂'],['marco_92','Pensavo fosse vero'],['ale.design','Come hai fatto??'],['sara.ph','Voglio il metodo']];
function comments(T){feed(T,0,{});x.fillStyle='rgba(0,0,0,.45)';x.fillRect(0,0,W,H);const sk=eo(p(T,K.m1,K.m1+.45));x.save();x.translate(0,(1-sk)*1200);x.fillStyle='#FFFFFF';rr(0,640,W,1400,48);x.fill();x.fillStyle='#C7C7C7';rr(490,662,100,10,5);x.fill();T_('Commenti',CX,730,38,800,UI.ink,'center');x.fillStyle=UI.line;x.fillRect(0,780,W,2);
  const tS=K.m2c,tC=K.m2c+.55,posted=p(T,tC+.05,tC+.35);const off=eo(posted)*150;
  if(posted>0){x.save();x.globalAlpha=clamp(posted*2);ringAv(90,860,46,2,{ring:false});T_('tu',160,838,32,700);T_('Ora',205,838,28,400,UI.sub);T_('CLAUDE',160,882,36,800,UI.ink);x.restore()}
  CMS.forEach(([n,m],i)=>{const Y=860+off+i*150;ringAv(90,Y,46,i+3,{ring:false});T_(n,160,Y-22,32,700);T_(m.replace('😂','').trim(),160,Y+22,32,400);heartI(1010,Y,36)});
  x.fillStyle='#FFFFFF';x.fillRect(0,1580,W,220);x.fillStyle=UI.line;x.fillRect(0,1580,W,2);ringAv(90,1660,40,4,{ring:false});x.strokeStyle=T>=K.m2?UI.blue:UI.line;x.lineWidth=3;rr(150,1615,880,90,45);x.stroke();
  const ty=T<tC?typed('CLAUDE',tS,14,T):'';T_(ty||'Aggiungi un commento…',190,1661,36,ty?700:400,ty?UI.ink:UI.sub);if(T>=K.m2&&T<tC&&Math.floor(T*2.5)%2===0){const cw=ty?tw2(ty,36,700):0;x.fillStyle=UI.blue;x.fillRect(192+cw,1638,4,46)}
  T_('Pubblica',990,1661,34,700,ty.length>=6?UI.blue:'#B2DFFC','right');x.restore()}
/* touch indicator (screen-recording look) */
function touch(X,Y,k,press=0){if(k<=0)return;x.save();x.globalAlpha=clamp(k*3)*.85;x.fillStyle='rgba(120,120,120,.45)';x.strokeStyle='rgba(255,255,255,.9)';x.lineWidth=4;x.beginPath();x.arc(X,Y,46*(1-.18*Math.sin(clamp(press)*Math.PI)),0,7);x.fill();x.stroke();if(press>0&&press<1){x.globalAlpha=1-press;x.beginPath();x.arc(X,Y,46+press*80,0,7);x.stroke()}x.restore()}
/* offscreen feed render for thumbnails / phone mockup */
const FEEDC=document.createElement('canvas');FEEDC.width=W;FEEDC.height=H;const feedx=FEEDC.getContext('2d');
function snapFeed(T,fn){const sv=x;x=feedx;x.setTransform(1,0,0,1,0,0);x.globalAlpha=1;x.filter='none';x.clearRect(0,0,W,H);fn();x=sv}
/* captions: word-by-word, TikTok style */
const CAPS=__CAPS__;
function caps(T){let c=null;for(const q of CAPS)if(T>=q[0]&&T<q[1]){c=q;break}if(!c)return;const k=p(T,c[0],c[0]+.09);const col={w:'#FFFFFF',r:'#FF3B4F',g:'#3CFF8F',o:'#FF8A3D',p:'#FF4FA3'}[c[3]];
  x.save();x.translate(CX,1235);const s=L(1.28,1,eo(k));x.scale(s,s);x.font='900 104px Int';x.textAlign='center';x.textBaseline='middle';x.letterSpacing='-2px';x.lineJoin='round';
  let sz=104;const w=x.measureText(c[2]).width;if(w>900){sz=104*900/w;x.font=`900 ${sz}px Int`}
  x.shadowColor='rgba(0,0,0,.55)';x.shadowBlur=26;x.shadowOffsetY=6;x.strokeStyle='#000';x.lineWidth=16;x.strokeText(c[2],0,0);x.shadowBlur=0;x.shadowOffsetY=0;x.fillStyle=col;x.fillText(c[2],0,0);x.restore()}

/* ---------- scenes ---------- */
function s1(T){const sc=L(0,640,eio(p(T,.25,1.6)))+40*p(T,1.6,K.b1);feed(T,sc);banner(T,p(T,-.25,.2),'Instagram chiude in Italia','Dal 1° gennaio 2027 il servizio non sarà','più disponibile in tutta Italia.',{red:p(T,K.a2,K.a2+.2)});
  touch(L(700,620,eio(p(T,.1,1.5))),L(1500,900,eio(p(T,.1,1.5))),p(T,.05,.2)*(1-p(T,1.5,1.7)));if(T>=K.a2){x.save();x.globalAlpha=.22*(1-p(T,K.a2,K.a2+.5));x.fillStyle=UI.red;x.fillRect(0,0,W,H);x.restore()}}
function s2(T){profile(T,{});alertBox(p(T,K.b2,K.b2+.3),'Account in eliminazione',['Il tuo profilo verrà cancellato','il 1° gennaio 2027.'],'Scarica i tuoi dati','OK')}
function s3(T){if(T<K.c3-.12){profile(T,{grey:p(T,K.c1,K.c1+.7),hl:p(T,K.c2,K.c2+.5)})}else{dms(T,p(T,K.c3+.1,K.c3+.6),ei(p(T,K.c4t,K.c4t+.55)));if(T>=K.c4t+.4){x.save();x.globalAlpha=p(T,K.c4t+.4,K.c4t+.7);T_('Nessun messaggio',CX,900,44,800,UI.ink,'center');T_('I tuoi dati sono stati rimossi.',CX,960,32,400,UI.sub,'center');x.restore()}}
  if(T>=K.c3-.12&&T<K.c3+.1){x.save();x.globalAlpha=1-p(T,K.c3-.12,K.c3+.1);x.fillStyle='#FFF';x.fillRect(0,0,W,H);x.restore()}}
function s3wrap(T){shatter(T,K.c4,.9,()=>s3(T),0,0,W,H,CX,900,false,7);}
function s4(T){const dr=eio(p(T,K.d1+.25,K.d2)),n=Math.round(12480*(1-dr)),dead=p(T,K.d2,K.d2+.15);profile(T,{fol:fmtN(n),dead,folc:dead>0?UI.red:UI.ink,grey:dead})}
function s5(T){if(T<K.e3){x.fillStyle=UI.bg;x.fillRect(0,0,W,H);const v=L(0,1,ei(p(T,K.e1,K.e3)));const sc=(T-K.e1)*900+v*v*14000;x.save();x.translate(0,-sc%2600+0);
      for(let b=-1;b<3;b++){const yr=2016+((Math.floor(sc/2600)+b)%10+10)%10,Y=b*2600+300;T_(String(yr),50,Y,72,800);for(let i=0;i<21;i++){const c=i%3,r=(i/3)|0;img(c*361,Y+80+r*361,357,357,i+yr)}}x.restore();x.fillStyle='rgba(255,255,255,.97)';x.fillRect(0,0,W,250);statusBar();T_('Il tuo archivio',50,180,50,800);if(v>.3){x.save();x.globalAlpha=(v-.3)*.6;x.fillStyle='#fff';x.fillRect(0,0,W,H);x.restore()}}
  else homeScreen(T,{jig:1,xk:p(T,K.e3+.05,K.e3+.2),dlg:p(T,K.e3+.18,K.e3+.38),del:p(T,K.e3+.62,K.e3+.95),off:p(T,K.e3+1.0,K.e3+1.25)})
  if(T>=K.e3){touch(L(1100,CX,eo(p(T,K.e3,K.e3+.2))),L(1500,1585,eo(p(T,K.e3,K.e3+.2))),p(T,K.e3,K.e3+.05)*(1-p(T,K.e3+.7,K.e3+.8)),p(T,K.e3+.5,K.e3+.75))}}
function s6(T){if(T<K.rw0){x.fillStyle='#000';x.fillRect(0,0,W,H);return}
  if(T<K.rw1){const q=p(T,K.rw0,K.rw1),Tr=L(K.e3+1.0,.6,ei(q));x.save();x.filter='saturate(1.5) contrast(1.1)';if(Tr>=K.e1)s5(Tr);else if(Tr>=K.d1)s4(Tr);else if(Tr>=K.c1)s3(Math.min(Tr,K.c4-.01));else if(Tr>=K.b1)s2(Tr);else s1(Tr);x.restore();
    x.save();const f=Math.floor(T*30);for(let i=0;i<12;i++){x.fillStyle=i%2?'rgba(255,255,255,.35)':'rgba(0,0,0,.25)';x.fillRect(0,(rnd(f*5+i)*H)|0,W,4+rnd(f+i)*30)}x.fillStyle='rgba(0,0,0,.35)';x.fillRect(0,0,W,H);x.translate(CX,860);x.fillStyle='#fff';x.shadowColor='#fff';x.shadowBlur=30;for(const ox of[-40,70]){x.beginPath();x.moveTo(ox+60,-80);x.lineTo(ox-60,0);x.lineTo(ox+60,80);x.closePath();x.fill()}x.restore();return}
  feed(T,40);banner(T,1,'Instagram non chiude','Era una notizia falsa.','Il tuo profilo è al sicuro.',{green:p(T,K.f2,K.f2+.3)});
  const ck=p(T,K.f2+.1,K.f2+.4);if(ck>0){x.save();x.translate(980,255);const s=back(clamp(ck));x.scale(s,s);x.fillStyle='#2DBE60';x.beginPath();x.arc(0,0,44,0,7);x.fill();x.strokeStyle='#fff';x.lineWidth=9;x.lineCap='round';x.beginPath();x.moveTo(-18,0);x.lineTo(-5,14);x.lineTo(20,-14);x.stroke();x.restore()}}
function s7(T){x.fillStyle='#0B0B10';x.fillRect(0,0,W,H);const dol=L(150,-150,p(T,K.g1+.7,K.h1));const sp=x.createRadialGradient(CX+dol*1.6,700,0,CX+dol*1.6,700,1000);sp.addColorStop(0,'rgba(255,255,255,.10)');sp.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=sp;x.fillRect(0,0,W,H);for(let i=0;i<40;i++){const px=((i*137.5+dol*(1+(i%3)*.6))%W+W)%W,py=(i*251)%H;x.fillStyle=`rgba(255,255,255,${.06+.1*((i*7)%3)/2})`;x.beginPath();x.arc(px,py,2+(i%3),0,7);x.fill()}
  x.save();x.translate(dol*p(T,K.g1,K.g1+.9),0);snapFeed(T,()=>{feed(T,40);banner(T,1,'Instagram chiude in Italia','Dal 1° gennaio 2027 il servizio non sarà','più disponibile in tutta Italia.')});
  const pb=eio(p(T,K.g1,K.g1+.9)),s=L(1,.5,pb),ex_=eio(p(T,K.g2,K.g2+1.0))*(1+.1*p(T,K.g2+1,K.h1)),tilt=Math.min(1,ex_)*(1+.45*p(T,K.g1+.9,K.h1))-.25*(1-p(T,K.g1,K.g2));
  const L4=[['Interfaccia',null],['Animazioni','#8B5CFF'],['Suoni','#FF8A3D'],['Sottotitoli','#3FE0FF']];
  for(let li=3;li>=0;li--){const dy=-li*150*ex_,dx=li*30*ex_;const k=li===0?1:clamp(ex_*1.6-li*.15);if(k<=0)continue;x.save();x.translate(CX-100*ex_+dx,980+dy);x.transform(1,-.18*tilt,0,1-.25*tilt,0,0);x.scale(L(s,.42,ex_),L(s,.42,ex_));x.globalAlpha=li===0?1:k*.92;
    x.shadowColor='rgba(0,0,0,.6)';x.shadowBlur=60;x.fillStyle='#1C1C1E';rr(-W/2-34,-H/2-34,W+68,H+68,110);x.fill();x.shadowBlur=0;x.save();rr(-W/2,-H/2,W,H,80);x.clip();
    if(li===0)x.drawImage(FEEDC,-W/2,-H/2);else{x.fillStyle='rgba(20,20,28,.85)';x.fillRect(-W/2,-H/2,W,H);const c=L4[li][1];x.strokeStyle=c;x.lineWidth=10;x.globalAlpha*=.9;
      if(li===1){for(let q=0;q<6;q++){x.beginPath();x.arc(-200+q*80,-300+q*120,60+q*20,0,Math.PI*1.4);x.stroke()}}else if(li===2){x.beginPath();for(let q=0;q<60;q++){const xx=-W/2+q*18;x.lineTo(xx,Math.sin(q*.7)*120*Math.sin(q*.13)+0)}x.stroke()}else{x.fillStyle=c;for(let q=0;q<5;q++)rr(-380,-500+q*220,760,110,30),x.fill()}}
    x.restore();x.restore();
    if(li>0&&k>.5){x.save();x.globalAlpha=clamp(k*2-1);const lx=CX-100+dx+250,ly=980+dy-150;x.fillStyle=L4[li][1];x.beginPath();x.arc(lx,ly,10,0,7);x.fill();T_(L4[li][0],lx+22,ly,36,800,'#FFFFFF');x.restore()}}
  if(ex_>.5){x.save();x.globalAlpha=clamp(ex_*2-1);x.fillStyle='#FFFFFF';x.beginPath();x.arc(CX+150,830,10,0,7);x.fill();T_('Interfaccia',CX+172,830,36,800,'#FFFFFF');x.restore()}
  x.restore();const ak=p(T,K.h0+.95,K.h0+1.2);if(ak>0&&T<K.h1){x.save();x.translate(CX,400);x.scale(back(clamp(ak)),back(clamp(ak)));x.globalAlpha=clamp(ak*2);x.fillStyle='rgba(255,255,255,.12)';x.strokeStyle='rgba(255,255,255,.5)';x.lineWidth=3;rr(-230,-60,460,120,60);x.fill();x.stroke();T_('Agenzia',0,2,56,800,'#FFFFFF','center');
    const st=eo(p(T,K.h0+1.25,K.h0+1.45));x.strokeStyle=UI.red;x.lineWidth=9;x.lineCap='round';x.beginPath();x.moveTo(-120,0);x.lineTo(-120+240*st,0);x.stroke();x.restore()}}
function s8(T){snapFeed(T,()=>{feed(T,40);banner(T,1,'Instagram chiude in Italia','Dal 1° gennaio 2027 il servizio non sarà','più disponibile in tutta Italia.')});claudeChat(T,{sc:eio(p(T,K.j1a,K.j1a+.4))*360});if(T>=K.j1a-.5&&T<K.j1a+.4)touch(L(1000,980,eo(p(T,K.j1a-.5,K.j1a-.1))),L(1600,1715,eo(p(T,K.j1a-.5,K.j1a-.1))),p(T,K.j1a-.5,K.j1a-.4)*(1-p(T,K.j1a+.25,K.j1a+.4)),p(T,K.j1a,K.j1a+.25))}
function s9(T){const sc=L(0,1420,eio(p(T,K.k1+.1,K.m1+.2)));feed(T,sc,{n1:'il.tuo.negozio',n2:'studio.tuo',n3:'tuo.brand',l1:fmtN(Math.round(L(84,2481,eo(p(T,K.k1,K.k1+1.6))))),l2:fmtN(Math.round(L(40,1873,eo(p(T,K.k2,K.k2+1.4))))),liked:1});
  for(let i=0;i<14;i++){const t0=K.k1+.2+i*.2,q=p(T,t0,t0+1.2);if(q<=0||q>=1)continue;x.save();x.globalAlpha=1-q;heartI(L(900,760+rnd(i)*240,q),L(1650,700,eo(q)),40+rnd(i+3)*30,true,UI.red);x.restore()}}
function s10(T){comments(T);if(T>=K.m2-.4&&T<K.m2c+.75){const k=p(T,K.m2-.4,K.m2);const tx=L(L(900,560,eo(k)),990,eo(p(T,K.m2c+.3,K.m2c+.5))),ty=L(L(1900,1661,eo(k)),1661,1);touch(tx,ty,k*(1-p(T,K.m2c+.62,K.m2c+.75)),Math.max(p(T,K.m2,K.m2+.25),p(T,K.m2c+.55,K.m2c+.75)))}
  banner(T,p(T,K.m3,K.m3+.35),'Nuovo messaggio','Ecco la guida completa per iniziare.','guida-completa.pdf')}

/* ---------- camera: punch-ins on the UI element that matters ---------- */
function zoomKF(T){const KF=[[0,1.06,CX,315,0],[.9,1,CX,960,.8],[K.a1,1.06,CX,315,.48],[K.b1,1,CX,960,0],[K.b2,1.08,CX,940,.3],[K.c1,1,CX,960,0],[K.c1+.05,1.12,CX,1250,.5],[K.c3-.12,1,CX,960,0],
  [K.d1,1.45,620,340,0],[K.d1+.02,1.8,650,330,K.d2-K.d1],[K.d2+.2,1.2,650,600,.4],[K.e1,1,CX,960,0],[K.f2-.1,1.05,CX,315,.4],[K.g1,1,CX,960,0],[K.g1+.9,1.1,CX-60,1000,K.h1-K.g1-.9],[K.h1,1,CX,960,0],[K.h1+.2,1.05,CX,760,K.h3-K.h1-.2],[K.h3,1.1,760,620,.35],[K.j1-.2,1,CX,1100,.4],[K.j1a+.3,1.16,CX,1520,K.k1-K.j1a-.4],[K.k1,1,CX,960,0],[K.m1+.45,1.14,CX,1250,K.m3-K.m1-.45],[K.m3,1.05,CX,315,.4],[K.m3+.45,1.1,CX,330,K.end-K.m3-.45]];
  let cur=[1,CX,960];for(const k of KF){if(T<k[0])break;const q=k[4]<=0?1:eio(p(T,k[0],k[0]+k[4]));cur=[L(cur[0],k[1],q),L(cur[1],k[2],q),L(cur[2],k[3],q)]}return cur}
function camera(T){let[z,cx,cy]=zoomKF(T);for(const t0 of[K.a2,K.b2,K.c4,K.d2,K.e3,K.h2])if(T>=t0)z+=.05*Math.exp(-(T-t0)*8);const[tx,ty]=shakeAt(T,[K.a2,K.b2,K.c4,K.d2,K.e3+.62],16);return{s:z,tx,ty,cx,cy}}
const CUTS=[K.b1,K.c1,K.d1,K.e1,K.g1,K.h1,K.k1,K.m1];
function scenes(T){if(T<K.b1)s1(T);else if(T<K.c1)s2(T);else if(T<K.d1)s3wrap(T);else if(T<K.e1)s4(T);else if(T<K.f1)s5(T);else if(T<K.g1)s6(T);else if(T<K.h1)s7(T);else if(T<K.k1)s8(T);else if(T<K.m1)s9(T);else s10(T)}
function overlay(T){
  for(const c of CUTS){const q=p(T,c-.12,c+.12);if(q>0&&q<1){x.save();x.globalAlpha=Math.sin(q*Math.PI)*.85;x.fillStyle='#FFFFFF';x.fillRect(0,0,W,H);x.restore()}}
  if(T>=K.f2-.05&&T<K.g1+.6){const k=p(T,K.f2,K.f2+.3)*(1-p(T,K.g1+.3,K.g1+.6));x.save();x.globalAlpha=k;x.fillStyle='rgba(0,0,0,.78)';rr(CX-330,1390,660,84,42);x.fill();T_('NON È UNA NOTIZIA REALE',CX,1433,36,800,'#FFFFFF','center');x.restore()}}
function frameContent(T){const cam=camera(T);x.save();x.fillStyle='#000';x.fillRect(0,0,W,H);
  const whip=CUTS.reduce((a,c)=>a+(T>=c-.1&&T<c+.12?(1-Math.abs(T-c)/.12)*(T<c?-1:1):0),0);
  x.translate(cam.cx+cam.tx+whip*90,cam.cy+cam.ty);x.scale(cam.s,cam.s);x.translate(-cam.cx,-cam.cy);scenes(T);x.restore();x.save();overlay(T);caps(T);x.restore()}
