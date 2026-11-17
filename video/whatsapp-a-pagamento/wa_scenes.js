/* ===================== WHATSAPP A PAGAMENTO · glow edition =====================
   Every time below comes from table K (voice line starts). To resync on the real
   voice recording, only K changes. */
const K={h1:0,h1b:1.66,h2:3.12,h3:4.4,h3b:5.34,h3c:5.78,h3d:6.5,h4:6.85,h5:7.84,h5b:9.6,t1:11.16,t1b:12.16,t1c:13.18,t2:14.0,t2b:14.86,t2c:15.68,rw:16.95,r1:17.64,r2:18.2,c1:19.28,c2:20.6,c2b:22.25,c3:23.16,c3b:24.38,c3c:25.34,c4:26.7,c4a:27.75,c4b:28.12,c4c:29.04,c4d:29.68,e1:30.1,e1b:31.42,e1c:32.36,e2:33.5,e3:34.68,e3b:35.36,end:37.5};
const WAG='#25D366';
const WA=new Path2D('M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z');
/* the real WhatsApp mark: official glyph, white on the brand-green app squircle, glass + neon */
function waLogo(X,Y,s,T,o={}){const{alpha=1,red=0}=o;if(alpha<=0||s<=0)return;x.save();x.globalAlpha*=alpha;x.translate(X,Y);
  const glowC=red>.5?G.red:WAG;x.shadowColor=hexA(glowC,.9);x.shadowBlur=s*.45;
  const g=x.createLinearGradient(0,-s/2,0,s/2);g.addColorStop(0,'#5FFC7B');g.addColorStop(1,'#1FAF4F');x.fillStyle=g;rr(-s/2,-s/2,s,s,s*.24);x.fill();x.shadowBlur=0;
  if(red>0){x.globalAlpha=alpha*red*.85;const gr=x.createLinearGradient(0,-s/2,0,s/2);gr.addColorStop(0,'#FF5A6E');gr.addColorStop(1,'#B0001A');x.fillStyle=gr;rr(-s/2,-s/2,s,s,s*.24);x.fill();x.globalAlpha=alpha}
  const sp=x.createLinearGradient(0,-s/2,0,0);sp.addColorStop(0,'rgba(255,255,255,.35)');sp.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=sp;rr(-s/2+6,-s/2+6,s-12,s*.45,[s*.21,s*.21,10,10]);x.fill();
  x.strokeStyle='rgba(255,255,255,.5)';x.lineWidth=2;rr(-s/2+1,-s/2+1,s-2,s-2,s*.24);x.stroke();
  const gs=s*.64/24;x.translate(-12*gs,-12*gs);x.scale(gs,gs);x.fillStyle='#FFFFFF';x.shadowColor='rgba(0,0,0,.18)';x.shadowBlur=8;x.fill(WA);x.restore()}
/* fan of light beams (as in the approved glow scene) */
function beams(X,Y,T,t0,cols,hit=0,n=9,maxLen=1300,spread=.17){x.save();x.globalCompositeOperation='lighter';
  for(let b=0;b<n;b++){const a=-Math.PI/2+(b-(n-1)/2)*spread+.04*Math.sin(b*1.7)+(T-t0)*.03*(b%2?1:-1),len=L(0,maxLen,eo(p(T,t0+b*.03,t0+.8+b*.03))),wd=18+((b*37)%5)*9;if(len<=1)continue;
    x.save();x.translate(X,Y);x.rotate(a+Math.PI/2);const lg=x.createLinearGradient(0,0,0,-len);lg.addColorStop(0,hexA(cols[b%cols.length],.30+.25*hit));lg.addColorStop(1,hexA(cols[0],0));x.fillStyle=lg;x.beginPath();x.moveTo(-wd*.2,0);x.lineTo(wd*.2,0);x.lineTo(wd,-len);x.lineTo(-wd,-len);x.closePath();x.fill();x.restore()}x.restore()}
function bloom(X,Y,R,cols,a=1){x.save();x.globalCompositeOperation='lighter';x.globalAlpha*=a;const g=x.createRadialGradient(X,Y,0,X,Y,R);g.addColorStop(0,hexA(cols[0],.5));g.addColorStop(.4,hexA(cols[1],.25));g.addColorStop(1,hexA(cols[1],0));x.fillStyle=g;x.fillRect(X-R,Y-R,2*R,2*R);x.restore()}
function halo(X,Y,T,t0,col,r0=120,r1=520){for(let r=0;r<2;r++){const q=p(T,t0+r*.16,t0+.9+r*.16);if(q>0&&q<1){x.save();x.globalAlpha=(1-q)*.8;x.strokeStyle=r?G.violet:col;x.shadowColor=x.strokeStyle;x.shadowBlur=26;x.lineWidth=4;x.beginPath();x.arc(X,Y,r0+eo(q)*(r1-r0),0,7);x.stroke();x.restore()}}}
function coin(X,Y,s,k){if(k<=0)return;x.save();x.translate(X,Y);const sc=back(clamp(k));x.scale(sc,sc);x.shadowColor=G.red;x.shadowBlur=24;const g=x.createLinearGradient(0,-s/2,0,s/2);g.addColorStop(0,'#FF6A7C');g.addColorStop(1,'#C3001F');x.fillStyle=g;x.beginPath();x.arc(0,0,s/2,0,7);x.fill();x.shadowBlur=0;x.strokeStyle='rgba(255,255,255,.7)';x.lineWidth=2;x.stroke();
  x.fillStyle='#fff';x.font=`800 ${s*.56}px Int`;x.textAlign='center';x.textBaseline='middle';x.fillText('€',0,s*.03);x.restore()}
function tileL(kind,X,Y,s,T,label,k,o={}){if(k<=0)return;const sc=back(clamp(k));gIcon(kind,X,Y,s*sc,T,{alpha:clamp(k*2),cols:o.cols||[G.white,G.cyan,G.purple]});if(label)glowText(label,X,Y+s*.5+50,{size:42,weight:500,alpha:clamp(k*2-.4),glow:8,color:o.lc||G.white})}
function shakeAt(T,ts,amp){let dx=0,dy=0;for(const t0 of ts){if(T>=t0&&T<t0+.5){const e=Math.exp(-(T-t0)*9)*amp;dx+=Math.sin((T-t0)*95)*e;dy+=Math.cos((T-t0)*80)*e}}return[dx,dy]}
/* deterministic particles */
function burst(X,Y,T,t0,col,n=18,spd=420){const q=p(T,t0,t0+.9);if(q<=0||q>=1)return;x.save();x.globalCompositeOperation='lighter';for(let i=0;i<n;i++){const a=i*2.399+.3,v=spd*(.5+((i*53)%10)/14),d=v*eo(q);x.globalAlpha=1-q;x.fillStyle=i%3?col:'#fff';const sz=3+(i%4)*2;x.fillRect(X+Math.cos(a)*d-sz/2,Y+Math.sin(a)*d+q*q*120-sz/2,sz,sz)}x.restore()}

function rbeams(X,Y,T,t0,cols,rot,n=9,len=1300,a=1){x.save();x.globalAlpha*=a;x.translate(X,Y);x.rotate(rot);x.translate(-X,-Y);beams(X,Y,T,t0,cols,0,n,len,.2);x.restore()}
function sparks(T,X,Y,W0,col,n=34,spd=260,t0=0,a=1){x.save();x.globalCompositeOperation='lighter';for(let i=0;i<n;i++){const ph=(((T-t0)*spd/600)+i*.6180339)%1;const px=X+(((i*97)%100)/100-.5)*W0+Math.sin(i*3.1+ph*4)*14,py=Y-ph*700;x.globalAlpha=a*Math.sin(ph*Math.PI)*.9;x.fillStyle=i%4?col:'#fff';const sz=2+(i%3)*1.5;x.beginPath();x.arc(px,py,sz,0,7);x.fill()}x.restore()}
/* ---------- camera: punches on beats + deterministic shake on impacts (no drift, no roll) ---------- */
function camera(T){let s=1;for(const t0 of[K.h1b,K.h2,K.h3,K.h3b,K.h3c,K.h3d,K.h4,K.h5,K.h5b,K.t1,K.t1b,K.t1c,K.t2,K.r1,K.r2,K.c1,K.c2,K.c2b,K.c3,K.c3b,K.c3c,K.c4,K.c4b,K.c4c,K.c4d,K.e1,K.e1c,K.e2,K.e3,K.e3b])if(T>=t0)s+=.03*Math.exp(-(T-t0)*8);
  const[tx,ty]=shakeAt(T,[K.h2,K.h3d,K.h5,K.t1c,K.c2b],14);return{s,tx,ty}}
function seg(T,a,b,fn,tin,tout,push=[.11,0],lin=true){if(T<a||T>=b)return;const P4i=k=>k*k*k*k,P4o=k=>1-Math.pow(1-k,4);let dx=0,dy=0,z=1,bl=0;
  const ki=p(T,a,a+.3),ko=p(T,b-.34,b),ei_=1-P4o(ki),eo_=P4i(ko);
  if(tin==='L'){dx+=130*ei_;bl+=10*ei_}if(tin==='U'){dy+=170*ei_;bl+=10*ei_}if(tin==='Zin'){z*=1+.35*ei_;bl+=16*ei_}
  if(tout==='L'){dx-=130*eo_;bl+=10*eo_}if(tout==='U'){dy-=170*eo_;bl+=10*eo_}if(tout==='Zin'){z*=1-.22*eo_;bl+=16*eo_}
  const pq=lin?p(T,a,b):eio(p(T,a,b)),sc=z*(1+push[0]*pq);dy+=push[1]*pq;x.save();if(bl>.4)x.filter=`blur(${bl.toFixed(1)}px)`;x.translate(CX+dx,860+dy);x.scale(sc,sc);x.translate(-CX,-860);fn(T);x.restore()}

/* S1 · hook: WhatsApp becomes paid */
function w1(T){const paid=eo(p(T,K.h2,K.h2+.35));bgDark(T,T>K.h2?'red':'green');
  const ent=ex(p(T,0,1.3)),LY=740,LS=420*(1.45-.45*ent)*(1+.06*Math.exp(-Math.max(0,T-K.h2)*7)*(T>=K.h2));
  bloom(CX,LY,700,paid>.5?[G.red,'#7A0A2A']:[WAG,G.blue]);x.save();x.translate(CX,LY);x.rotate(.55*Math.sin(T*.9));x.translate(-CX,-LY);beams(CX,LY,T,0,paid>.5?[G.red,'#FF8899']:[WAG,G.cyan],Math.exp(-Math.max(0,T-K.h2)*4)*(T>=K.h2),9,1250);x.restore();
  flare(CX+170,LY-170,620,Math.max(0,1-p(T,0,.8)),WAG);
  sparks(T,CX,LY+120,LS*1.2,paid>.5?G.red:WAG,40,330,0,1);waLogo(CX,LY,LS,T,{red:paid});{const g=p(T,.2,1.5);if(g>0&&g<1){x.save();rr(CX-LS/2,LY-LS/2,LS,LS,LS*.24);x.clip();x.globalCompositeOperation='lighter';const gx=L(CX-LS,CX+LS,eio(g));const lg=x.createLinearGradient(gx-90,0,gx+90,0);lg.addColorStop(0,'rgba(255,255,255,0)');lg.addColorStop(.5,'rgba(255,255,255,.55)');lg.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=lg;x.fillRect(CX-LS,LY-LS,2*LS,2*LS);x.restore()}}
  if(T>=K.h2){const k=p(T,K.h2+.25,K.h2+.55);gIcon('lock',CX+LS*.42,LY-LS*.42,120*back(clamp(k)),T,{alpha:clamp(k*2),cols:['#FFFFFF','#FF8899',G.red]})}
  typeLit('Da gennaio WhatsApp',CX,250,T,-2,22,{size:92,weight:600,lit:WAG});
  typeLit('diventa a pagamento.',CX,370,T,K.h1b,24,{size:100,weight:800,lit:G.red});
  const sk=p(T,K.h2,K.h2+.16);if(sk>0){x.save();x.translate(CX,1075);const s=L(2.6,1,eo(sk));x.scale(s,s);x.globalAlpha=clamp(sk*3);glass(0,0,620,150,75,{rim:[G.red,'#FF8899'],fill:.12,glowA:.9});x.fillStyle=hexA('#C3001F',.55);rr(-310,-75,620,150,75);x.fill();x.shadowColor=G.red;x.shadowBlur=40;glowText('5 € / mese',0,4,{size:88,weight:800,color:'#FFFFFF',glow:30});x.restore();flare(CX+250,1020,560,Math.max(0,1-p(T,K.h2,K.h2+.6)),G.red)}
  [[K.h3,'msg','Messaggi',300],[K.h3b,'mic','Vocali',540],[K.h3c,'phone','Chiamate',780]].forEach(([t0,kd,lb,X])=>{const k=p(T,t0,t0+.4);if(k<=0)return;const allRed=T>=K.h3d;
    tileL(kd,X,1250,150,T,lb,k,{cols:allRed?['#FFFFFF','#FF8899',G.red]:[G.white,G.cyan,G.purple],lc:allRed?'#FF8899':G.white});coin(X+62,1250-62,58,p(T,t0+.22,t0+.5));
    if(allRed)halo(X,1250,T,K.h3d,G.red,70,190)});
  if(T>=K.h3d)burst(CX,1250,T,K.h3d,G.red,26,520)}

/* S2 · "E se non paghi?" chats get deleted, 30-day countdown */
const CHATS=[['Mamma','Hai mangiato?','09:41',['#FF8A65','#FF3D8B']],['Calcetto del giovedì','Chi porta il pallone?','08:15',['#3FE0FF','#3D7BFF']],['Lavoro','Riunione spostata alle 10','ieri',['#B44BFF','#3D7BFF']],['Amore','Stasera cinema?','ieri',['#FF3355','#FF8A65']],['Famiglia','Foto del pranzo','lun',['#3CFF8F','#3FE0FF']]];
function chatRow(X,Y,w,c,T,o={}){const{alpha=1,red=0,unread=0}=o;if(alpha<=0)return;x.save();x.globalAlpha*=alpha;
  const g=x.createLinearGradient(X-w/2,0,X-w/2+90,0);g.addColorStop(0,c[3][0]);g.addColorStop(1,c[3][1]);x.fillStyle=g;x.shadowColor=c[3][0];x.shadowBlur=20;x.beginPath();x.arc(X-w/2+60,Y,48,0,7);x.fill();x.shadowBlur=0;
  glowText(c[0][0],X-w/2+60,Y+2,{size:44,weight:800,glow:0});
  glowText(c[0],X-w/2+128,Y-22,{size:46,weight:700,align:'left',glow:0,maxW:9999,color:red>.5?'#FF8899':G.white});
  glowText(c[1],X-w/2+128,Y+28,{size:36,weight:400,align:'left',glow:0,color:G.dim,maxW:9999});
  glowText(c[2],X+w/2-30,Y-22,{size:30,weight:500,align:'right',glow:0,color:unread?WAG:G.dim,maxW:9999});
  if(unread){x.fillStyle=WAG;x.beginPath();x.arc(X+w/2-48,Y+26,24,0,7);x.fill();glowText(String(unread),X+w/2-48,Y+27,{size:28,weight:800,glow:0,color:'#04110A'})}
  if(red>0){x.globalAlpha*=red*.5;x.fillStyle=G.red;rr(X-w/2+10,Y-58,w-20,116,22);x.fill()}x.restore()}
function w2(T){bgDark(T,'red');typeLit('E se non paghi?',CX,250,T,K.h4,22,{size:104,weight:700,lit:G.red});
  typeLit('Le tue chat vengono cancellate.',CX,365,T,K.h5,26,{size:66,weight:500,lit:G.red});
  const pk=eo(p(T,K.h4,K.h4+.5)),PY=L(1000,820,pk),PH=740;if(T<K.h5b+.2){x.save();x.globalAlpha=pk*(1-p(T,K.h5b-.2,K.h5b+.2));glass(CX,PY,880,PH,40,{rim:[WAG,G.purple],fill:.06});
    waLogo(CX-350,PY-PH/2+62,64,T);glowText('Chat',CX-300,PY-PH/2+62,{size:44,weight:800,align:'left',glow:0,maxW:9999});glowText(`${CHATS.length} conversazioni`,CX+400,PY-PH/2+62,{size:28,weight:500,align:'right',glow:0,color:G.dim,maxW:9999});
    CHATS.forEach((c,i)=>{const td=K.h5+.25+i*.24,dk=p(T,td,td+.35);const ry=PY-PH/2+170+i*128;x.save();x.translate(-dk*dk*700,0);chatRow(CX,ry,820,c,T,{alpha:1-dk,red:p(T,td-.15,td+.05),unread:i===0?2:i===1?14:0});x.restore();
      burst(CX+300-dk*400,ry,T,td+.1,G.red,12,260)});x.restore()}
  const ck=p(T,K.h5b-.1,K.h5b+.3);if(ck>0){const prog=1-p(T,K.h5b+.3,K.h4+4.3)*.12;x.save();x.globalAlpha=clamp(ck*2);x.translate(CX,820);const s=back(clamp(ck));x.scale(s,s);
    bloom(0,0,520,[G.red,'#7A0A2A']);ring(0,0,230,prog,T,{col:G.red});glowText('30',0,-18,{size:200,weight:800,color:'#FF5A6E',glow:50});glowText('giorni',0,110,{size:54,weight:500,glow:0,color:'#FFB3BE'});x.restore();halo(CX,820,T,K.h5b,G.red,240,600)}}

/* S3 · photos, voice notes, everything → that one chat */
function photo(X,Y,s,i,T){x.save();x.translate(X,Y);rr(-s/2,-s/2,s,s,22);x.save();x.clip();const pal=[['#FF8A65','#B44BFF'],['#3FE0FF','#3D7BFF'],['#FFD36E','#FF3D8B'],['#3CFF8F','#3D7BFF'],['#B44BFF','#FF3355'],['#3FE0FF','#3CFF8F']][i%6];
  const g=x.createLinearGradient(0,-s/2,0,s/2);g.addColorStop(0,pal[0]);g.addColorStop(1,pal[1]);x.fillStyle=g;x.fillRect(-s/2,-s/2,s,s);x.fillStyle='rgba(255,240,200,.9)';x.beginPath();x.arc(s*.18,-s*.18,s*.1,0,7);x.fill();
  x.fillStyle='rgba(10,10,30,.55)';x.beginPath();x.moveTo(-s/2,s/2);x.lineTo(-s*.15,-s*.02);x.lineTo(s*.1,s*.22);x.lineTo(s*.28,s*.06);x.lineTo(s/2,s*.3);x.lineTo(s/2,s/2);x.fill();x.restore();
  x.strokeStyle='rgba(255,255,255,.55)';x.lineWidth=2;rr(-s/2,-s/2,s,s,22);x.stroke();x.restore()}
function vnote(X,Y,w,T,k,red){x.save();x.globalAlpha*=clamp(k*2);x.translate(X,Y);const sc=back(clamp(k));x.scale(sc,sc);glass(0,0,w,110,55,{rim:[WAG,G.cyan],fill:.08});gIcon('play',-w/2+60,0,78,T,{cols:[G.white,WAG,G.cyan]});
  for(let i=0;i<26;i++){const hgt=(12+Math.abs(Math.sin(i*1.9+X))*34)*(1-red);x.fillStyle=red>.3?hexA(G.red,.9):hexA(G.white,.85);rr(-w/2+120+i*13,-hgt/2-2,6,Math.max(4,hgt),3);x.fill()}
  glowText('0:'+String(10+((X/7)|0)%40).padStart(2,'0'),w/2-50,2,{size:28,weight:500,glow:0,color:G.dim,maxW:9999});x.restore()}
function w3(T){bgDark(T,'red');
  const l1=1-p(T,K.t2-.25,K.t2);if(l1>0){x.save();x.globalAlpha=l1;
    if(T<K.t1b)typeLit('Tutte le foto.',CX,250,T,K.t1,22,{size:104,weight:700,lit:G.red});else if(T<K.t1c)typeLit('Tutti i vocali.',CX,250,T,K.t1b,22,{size:104,weight:700,lit:G.red});else typeLit('Tutto.',CX,250,T,K.t1c,14,{size:130,weight:800,lit:G.red});
    const suck=ei(p(T,K.t1c+.05,K.t1c+.55));
    for(let i=0;i<9;i++){const c=i%3,r=(i/3)|0,k=p(T,K.t1-.2+i*.04,K.t1+.15+i*.04),dk=p(T,K.t1b-.3+i*.03,K.t1b+.1+i*.03);if(k<=0||dk>=1)continue;
      const X=L(CX+(c-1)*250,CX,suck),Y=L(760+(r-1)*250,1100,suck);x.save();x.globalAlpha*=clamp(k*2)*(1-dk);const s=220*back(clamp(k))*(1-.4*dk);photo(X,Y,s,i,T);if(dk>0){x.globalAlpha*=dk;gIcon('x',X,Y,s*.5,T,{cols:['#FFFFFF','#FF8899',G.red]})}x.restore()}
    for(let i=0;i<3;i++){const t0=K.t1b+.05+i*.12,k=p(T,t0,t0+.35);if(k<=0)continue;const red=p(T,K.t1b+.55+i*.1,K.t1b+.85+i*.1);const X=L(CX,CX,suck),Y=L(600+i*170,1100,suck);x.save();x.globalAlpha=1-suck;vnote(X,Y,720*(1-suck*.7),T,k,red);x.restore()}
    if(T>=K.t1c){const k=p(T,K.t1c+.3,K.t1c+.6);x.save();x.globalAlpha=1-p(T,K.t2-.3,K.t2);bloom(CX,1100,500,[G.red,'#7A0A2A'],k);tileL('trash',CX,1100,210*(1+.12*Math.exp(-Math.max(0,T-K.t1c-.55)*8)),T,'',k,{cols:['#FFFFFF','#FF8899',G.red]});x.restore();burst(CX,1100,T,K.t1c+.55,G.red,24,500)}
    x.restore()}
  if(T>=K.t2-.05){rbeams(CX,1450,T,K.t2-.3,[G.violet,G.red],(T-K.t2)*.32-.3,9,1200,.9);const zp=1+.22*eio(p(T,K.t2,K.rw));sparks(T,CX,1250,900,G.red,30,240,K.t2,.8);x.translate(CX,700);x.scale(zp,zp);x.translate(-CX,-700);typeLit('Anche quella chat',CX,250,T,K.t2,22,{size:100,weight:700,lit:G.red});
    typeLit('che non hai mai avuto',CX,370,T,K.t2b,26,{size:68,weight:500,lit:G.red});typeLit('il coraggio di cancellare.',CX,450,T,K.t2c,26,{size:68,weight:500,lit:G.red});
    const k=p(T,K.t2+.1,K.t2+.55);if(k>0){let bump=0;for(let i=0;i<3;i++){const tb=K.t2+.9+i*.55;if(T>=tb)bump+=Math.exp(-(T-tb)*9)*Math.sin((T-tb)*70)*16}x.save();x.globalAlpha=clamp(k*2);x.translate(CX+bump,800);const s=back(clamp(k));x.scale(s*1.08,s*1.08);bloom(0,0,560,[G.violet,G.red],.7);glass(0,0,860,180,40,{rim:[G.red,G.violet],fill:.08});
      chatRow(0,0,840,['Ex','Ci sei?','02:47',['#FF3355','#B44BFF']],T,{unread:3});x.restore()}
    [['Ci sei?','02:47'],['Dai, rispondi','02:48'],['Ok… buonanotte','02:51']].forEach(([m,h],i)=>{const bk=p(T,K.t2+.9+i*.55,K.t2+1.2+i*.55);if(bk<=0)return;const Y=960+i*100;x.save();x.globalAlpha=clamp(bk*2);x.translate(CX-380+(1-eo(bk))*-300,Y);x.font='500 40px Int';const w=x.measureText(m).width+150;glass(w/2,0,w,80,24,{rim:[G.violet,G.red],fill:.09});glowText(m,28,2,{size:40,weight:500,align:'left',glow:0,maxW:9999});glowText(h,w-22,14,{size:22,weight:500,align:'right',glow:0,color:G.dim,maxW:9999});x.restore()});
    const dk=p(T,K.t2c+.5,K.t2c+.8);if(dk>0){x.save();x.globalAlpha=dk;glowText('Eliminazione chat…',CX-380,1260,{size:40,weight:600,align:'left',glow:0,color:'#FF8899',maxW:9999});
      const pr=Math.min(.97,eo(p(T,K.t2c+.6,K.rw-.35))*.97);glowText(Math.round(pr*100)+'%',CX+380,1260,{size:40,weight:800,align:'right',color:'#FF5A6E',glow:16,maxW:9999});
      x.fillStyle='rgba(255,255,255,.1)';rr(CX-380,1305,760,18,9);x.fill();x.fillStyle=G.red;x.shadowColor=G.red;x.shadowBlur=18;rr(CX-380,1305,760*pr,18,9);x.fill();x.restore()}}}

/* S4 · REWIND → "Tranquillo. Non è vero." */
function w4(T){bgDark(T,'green');const k=eo(p(T,K.r1,K.r1+.5));bloom(CX,760,700,[WAG,G.blue],k);beams(CX,760,T,K.r1,[WAG,G.cyan],Math.exp(-Math.max(0,T-K.r1)*4),9,1150);
  waLogo(CX,760,L(260,330,k),T,{alpha:clamp(k*2)});halo(CX,760,T,K.r1+.05,WAG,170,520);
  typeLit('Tranquillo.',CX,280,T,K.r1,20,{size:120,weight:700,lit:WAG});
  if(T>=K.r2){typeLit('Non è vero.',CX,1080,T,K.r2,20,{size:104,weight:800,lit:WAG});const ck=p(T,K.r2+.4,K.r2+.7);gIcon('check',CX+LY4(),760-150,100*back(clamp(ck)),T,{alpha:clamp(ck*2),cols:[G.white,WAG,G.cyan]})}}
function LY4(){return 150}
function rewindFX(T){const q=p(T,K.rw,K.r1);x.save();x.globalCompositeOperation='lighter';for(let i=0;i<14;i++){const fy=((i*197+Math.floor(T*30)*131)%H),h=4+((i*31+Math.floor(T*30)*7)%26);x.fillStyle=hexA(i%2?G.cyan:'#FFFFFF',.10+.12*((i*7)%3));x.fillRect(-300,fy,W+600,h)}x.restore();
  x.save();x.fillStyle='rgba(4,5,12,.25)';x.fillRect(-300,-400,W+600,H+800);x.restore();
  x.save();x.translate(CX,760);const s=1+.06*Math.sin(q*Math.PI*6);x.scale(s,s);x.shadowColor='#fff';x.shadowBlur=40;x.fillStyle='rgba(255,255,255,.95)';for(const ox of[-40,70]){x.beginPath();x.moveTo(ox+60,-80);x.lineTo(ox-60,0);x.lineTo(ox+60,80);x.closePath();x.fill()}x.restore();
  glowText('REWIND',CX,920,{size:54,weight:800,ls:14,glow:20});
  if(q>.82){x.save();x.globalAlpha=(q-.82)/.18;x.fillStyle='#fff';x.fillRect(-300,-400,W+600,H+800);x.restore()}}

/* S5 · "Ma una cosa vera c'è. Questo video l'ho fatto io. Con Claude." */
function w5(T){bgDark(T,T>K.c2b?'warm':'cool');typeLit("Ma una cosa vera c'è.",CX,250,T,K.c1,22,{size:92,weight:700,lit:G.cyan});
  rbeams(CX,1450,T,K.c1-.3,[G.cyan,G.violet],(T-K.c1)*.3-.4,9,1200,.8*(1-p(T,K.c2b-.2,K.c2b+.1)));sparks(T,CX,1200,700,G.cyan,30,260,K.c1,.8);const fk=eo(p(T,K.c1+.25,K.c1+.85));if(fk>0){const fw=380*(1+.18*p(T,K.c1+.85,K.c2b)),fh=fw*16/9,FY=760;x.save();x.globalAlpha=fk;x.translate(CX,FY+(1-fk)*120);
    bloom(0,0,520,[G.cyan,G.purple],.8);x.save();rr(-fw/2,-fh/2,fw,fh,30);x.clip();x.translate(-fw/2,-fh/2);x.scale(fw/W,fh/H);const tm=((T-K.c1+.3)%(K.h4))+.0;w1(Math.min(tm,K.h4-.01));x.restore();
    glass(0,0,fw+14,fh+14,36,{rim:[G.cyan,G.violet],fill:0,glowA:.8});x.restore();
    typeLit("Questo video l'ho fatto io.",CX,1200,T,K.c2,26,{size:76,weight:600,lit:G.cyan})}
  if(T>=K.c2b){const k=p(T,K.c2b,K.c2b+.35),hit=Math.exp(-(T-K.c2b)*3.5);beams(CX,760,T,K.c2b,[G.orange,'#FFB07A'],hit,11,1250,.15);x.save();x.translate(CX,760);const s=back(clamp(k));x.scale(s,s);glass(0,0,230,230,62,{rim:[G.orange,G.violet],fill:.14,glowA:.9});asterisk(0,0,70,T,G.orange);x.restore();
    flare(CX,760,700,Math.max(0,1-p(T,K.c2b,K.c2b+.7)),G.orange);halo(CX,760,T,K.c2b,G.orange,140,560);
    const tk=p(T,K.c2b+.05,K.c2b+.3);x.save();x.translate(CX,1320);x.scale(L(1.4,1,eo(tk)),L(1.4,1,eo(tk)));x.globalAlpha*=Math.min(1,tk*2);asterisk(-300,0,48,T,G.orange);glowText('con Claude',40,0,{size:112,weight:800,color:'#FFB07A',glow:40,alpha:Math.min(1,tk*2)});x.restore()}}

/* S6 · Niente agenzia / editor / After Effects */
function w6(T){bgDark(T,'warm');typeLit('Niente…',CX,250,T,K.c3,14,{size:110,weight:700,lit:G.orange});
  [[K.c3,'building','Agenzia','preventivi e settimane di attesa'],[K.c3b,'user','Editor','1.400 € al mese'],[K.c3c,'film','After Effects','ore di rendering']].forEach(([t0,ic,nm,sub],i)=>{const k=p(T,t0-.05,t0+.3);if(k<=0)return;const Y=560+i*270,dx=(1-eo(k))*700;
    x.save();x.translate(CX+dx,Y);x.globalAlpha=clamp(k*2);glass(0,0,820,200,44,{rim:[G.cyan,G.purple],fill:.07});gIcon(ic,-320,0,130,T,{cols:[G.white,G.cyan,G.purple]});
    glowText(nm,-230,-30,{size:74,weight:800,align:'left',glow:10,maxW:9999});glowText(sub,-230,42,{size:38,weight:400,align:'left',glow:0,color:G.dim,maxW:9999});
    const st=eo(p(T,t0+.35,t0+.6));if(st>0){x.strokeStyle=G.red;x.shadowColor=G.red;x.shadowBlur=20;x.lineWidth=7;x.lineCap='round';x.font='800 74px Int';x.letterSpacing='-2px';const nw=x.measureText(nm).width;x.letterSpacing='0px';x.beginPath();x.moveTo(-236,-32);x.lineTo(-236+(nw+12)*st,-32);x.stroke();x.shadowBlur=0;
      gIcon('x',320,0,100*back(clamp(p(T,t0+.5,t0+.8))),T,{alpha:clamp(p(T,t0+.5,t0+.7)*2),cols:['#FFFFFF','#FF8899',G.red]})}x.restore()})}

/* S7 · "Gli scrivo l'idea, e lui mi fa animazioni, effetti e suoni." */
function w7(T){bgDark(T,'warm');rbeams(CX,1450,T,K.c4-.3,[G.orange,G.violet],(T-K.c4)*.3-.4,9,1200,.75);typeLit("Gli scrivo l'idea",CX,250,T,K.c4,22,{size:100,weight:700,lit:G.orange});
  const bk=eo(p(T,K.c4,K.c4+.35)),BY=520;x.save();x.globalAlpha=bk;x.translate(0,(1-bk)*80);glass(CX,BY,880,130,65,{rim:[G.orange,G.violet],fill:.08});asterisk(CX-375,BY,30,T,G.orange);
  const s='Video: WhatsApp a pagamento',ty=typed(s,K.c4+.15,34,T);glowText(ty||'Scrivi a Claude…',CX-330,BY+2,{size:40,weight:ty?600:400,align:'left',glow:ty?8:0,color:ty?G.white:G.dim,maxW:9999});
  const sent=p(T,K.c4a,K.c4a+.25);gIcon(sent>0?'check':'up',CX+375,BY,90,T,{cols:sent>0?[G.white,G.green,G.cyan]:[G.white,G.orange,G.violet]});x.restore();
  if(T>=K.c4a-.95&&T<K.c4a+.7){const ck=p(T,K.c4a-.95,K.c4a-.15);const cx=L(1300,CX+385,eo(ck)),cy=L(1500,BY+12,eo(ck));x.save();x.globalAlpha=1-p(T,K.c4a+.35,K.c4a+.7);cursor(cx,cy,p(T,K.c4a,K.c4a+.3));x.restore()}
  if(T>=K.c4a)halo(CX+375,BY,T,K.c4a,G.orange,50,200);
  typeLit('e lui mi fa',CX,690,T,K.c4b-.3,22,{size:70,weight:500,lit:G.orange});
  [[K.c4b,'wave','Animazioni',270],[K.c4c,'spark','Effetti',540],[K.c4d,'note','Suoni',810]].forEach(([t0,kd,lb,X])=>{const k=p(T,t0,t0+.4);if(k<=0)return;
    const lk=eo(p(T,t0-.15,t0+.2));x.save();x.strokeStyle=hexA(G.orange,.7);x.shadowColor=G.orange;x.shadowBlur=14;x.lineWidth=3;x.beginPath();x.moveTo(CX,745);x.quadraticCurveTo((CX+X)/2,800,L(CX,X,lk),L(745,862,lk));x.stroke();x.restore();
    tileL(kd,X,960,190,T,lb,k,{cols:[G.white,G.orange,G.violet]});halo(X,960,T,t0+.15,G.orange,96,135)})}

/* S8 · "E se per un secondo ti sei preoccupato… ha funzionato." */
function w8(T){const calm=p(T,K.e1c,K.e1c+.4);bgDark(T,calm>.5?'green':'red');
  typeLit('E se per un secondo',CX,250,T,K.e1,22,{size:92,weight:700,lit:G.red});typeLit('ti sei preoccupato…',CX,360,T,K.e1b,22,{size:80,weight:500,lit:G.red});
  rbeams(CX,1450,T,K.e1-.3,calm>.5?[WAG,G.cyan]:[G.red,G.violet],(T-K.e1)*.32-.3,9,1200,.85);sparks(T,CX,1250,900,calm>.5?WAG:G.red,30,300,K.e1,.8);const pk=eo(p(T,K.e1,K.e1+.4)),PY=780;x.save();x.globalAlpha=pk;glass(CX,PY,880,420,44,{rim:calm>.5?[WAG,G.cyan]:[G.red,G.violet],fill:.06});
  const bpm=Math.round(T<K.e1c?L(74,142,eio(p(T,K.e1,K.e1c))):L(142,72,eo(calm)));gIcon('heart',CX-360,PY-150,70,T,{cols:calm>.5?[G.white,WAG,G.cyan]:['#FFFFFF','#FF8899',G.red]});
  glowText(bpm+' bpm',CX-305,PY-148,{size:46,weight:800,align:'left',glow:14,color:calm>.5?'#9FFFC4':'#FF8899',maxW:9999});
  const col=calm>.5?WAG:G.red,amp=T<K.e1c?L(40,150,p(T,K.e1,K.e1c)):L(150,45,calm),rate=bpm/60;x.save();x.beginPath();x.rect(CX-420,PY-110,840,300);x.clip();x.strokeStyle=col;x.shadowColor=col;x.shadowBlur=18;x.lineWidth=5;x.lineJoin='round';x.beginPath();
  for(let i=0;i<=210;i++){const X=CX-420+i*4,ph=((i*4/840)*3.2+T*rate*2.6)%1;let y=0;if(ph>.40&&ph<.44)y=-amp*.25;else if(ph>.46&&ph<.49)y=amp*.35;else if(ph>=.49&&ph<.52)y=-amp;else if(ph>=.52&&ph<.55)y=amp*.5;else if(ph>.66&&ph<.74)y=-amp*.18*Math.sin((ph-.66)/.08*Math.PI);i?x.lineTo(X,PY+60+y):x.moveTo(X,PY+60+y)}x.stroke();x.restore();x.restore();
  if(T>=K.e1c){typeLit('…ha funzionato.',CX,1180,T,K.e1c,22,{size:110,weight:800,lit:WAG});const ck=p(T,K.e1c+.5,K.e1c+.8);gIcon('check',CX+360,PY-150,90*back(clamp(ck)),T,{alpha:clamp(ck*2),cols:[G.white,WAG,G.cyan]});halo(CX,PY,T,K.e1c,WAG,200,620)}}

/* S9 · CTA */
function w9(T){bgDark(T,'warm');rbeams(CX,1450,T,K.e2-.3,[G.orange,G.violet],(T-K.e2)*.28-.45,9,1250,.7);sparks(T,CX,1350,900,G.orange,30,280,K.e2,.8);typeLit('Vuoi il metodo?',CX,260,T,K.e2,22,{size:100,weight:700,lit:G.orange});
  const t0=K.e2,cl=ei(p(T,t0+.5,t0+1.1));['msg','spark','note','eye','wave','star'].forEach((kd,i)=>{const a=T*1.6+i*Math.PI/3,r=L(380,0,cl);const depth=(Math.sin(a)+1)/2;gIcon(kd,CX+Math.cos(a)*r,680+Math.sin(a)*r*.5,L(80,140,depth)*(1-cl*.9)*eo(p(T,t0,t0+.4)),T,{blur:(1-depth)*6,alpha:1-cl})});
  if(T>=t0+1.1){const k=back(p(T,t0+1.1,t0+1.4));x.save();x.translate(CX,680);x.scale(k,k);glass(0,0,200,200,54,{rim:[G.orange,G.violet],fill:.06});asterisk(0,0,60,T,G.orange);x.restore();flare(CX,680,500,Math.max(0,1-p(T,t0+1.1,t0+1.7)),G.orange)}
  glowText('Commenta',CX,900,{size:64,weight:400,color:G.dim,glow:0,alpha:p(T,K.e3,K.e3+.15)});
  if(T>=K.e3+.1){const k=p(T,K.e3+.1,K.e3+.3);x.save();x.translate(CX,1030);x.scale(L(1.5,1,eo(k)),L(1.5,1,eo(k)));glowText('CLAUDE',0,0,{size:170,weight:900,color:'#FFB07A',glow:60,ls:4,maxW:760,alpha:Math.min(1,k*2.5)});x.restore()}
  const tS=K.e3+.15,tC=K.e3+.75,bk=p(T,K.e3-.3,K.e3);if(bk>0){const sent=p(T,tC+.07,tC+.3);x.save();x.globalAlpha=bk;glass(CX,1230,800,124,62,{rim:sent>0?[G.green,G.cyan]:[G.cyan,G.purple],fill:.08});
    if(sent<=0){const ty=typed('CLAUDE',tS,14,T);glowText(ty||'Aggiungi un commento…',CX-350,1232,{size:ty?46:40,weight:ty?700:400,align:'left',color:ty?G.white:G.dim,glow:ty?12:0,maxW:9999})}else{glowText('Commento inviato',CX-350,1232,{size:44,weight:600,color:G.green,align:'left',glow:20,alpha:sent,maxW:9999})}
    gIcon(sent>0?'check':'up',CX+330,1230,86,T,{cols:sent>0?[G.green,G.cyan,G.green]:[G.cyan,G.purple,G.blue]});x.restore()}
  if(T>=K.e3b)typeLit('Te lo mando.',CX,1400,T,K.e3b,22,{size:96,weight:700,lit:G.green});
  const cx=L(L(1300,860,eo(p(T,K.e3-.3,K.e3+.3))),874,eo(p(T,tC-.25,tC))),cy=L(L(1750,1290,eo(p(T,K.e3-.3,K.e3+.3))),1235,eo(p(T,tC-.25,tC)));if(T>=K.e3-.3)cursor(cx,cy,p(T,tC,tC+.3))}

function scenes(T){
  seg(T,0,K.h4,w1,'','L',[.14,-50]);seg(T,K.h4,K.t1,w2,'L','L');seg(T,K.t1,K.rw,w3,'L','',[.08,0]);
  seg(T,K.rw,K.c1,w4,'','U');seg(T,K.c1,K.c3,w5,'U','L');seg(T,K.c3,K.c4,w6,'L','L');seg(T,K.c4,K.e1,w7,'L','L');seg(T,K.e1,K.e2,w8,'L','Zin');seg(T,K.e2,DUR+.1,w9,'Zin','',[.16,-40],true)}
function world(T){
  if(T>=K.rw&&T<K.r1){const q=p(T,K.rw,K.r1),Tr=L(K.rw-.05,.4,eio(q));x.save();x.filter='saturate(1.6) hue-rotate(-12deg)';scenes(Tr);x.restore();rewindFX(T);return}
  scenes(T);
  if(T>=K.r2-.05&&T<K.c1+.9){const k=p(T,K.r2,K.r2+.3)*(1-p(T,K.c1+.6,K.c1+.9));x.save();x.globalAlpha=k;glass(CX,1390,700,92,46,{rim:['#FFFFFF','#FF8899'],fill:.12,glowA:.4});glowText('NON È UNA NOTIZIA REALE',CX,1392,{size:40,weight:800,ls:3,glow:8});x.restore()}}
