import subprocess,numpy as np,wave,json,re
S='/tmp/claude-0/-home-user-costruzione/f8f5e66a-bca6-52b8-a8d5-01ec917fceb6/scratchpad/'
D=S+'mkw';Y=S+'synth'
WA=json.loads(re.search(r'const WA=(\[.*?\]\]);',open(S+'t3d/www/ref2.html').read()).group(1))
NA=np.array([a for a,b in WA]);OA=np.array([b for a,b in WA])
def w(t):return float(np.interp(t,OA,NA))  # old timeline -> new timeline
DUR=39.85
PK={'s01':.09,'s02':.01,'s03':.28,'s04':1.71,'s05':.25,'s06':.12,'s07':.80,'s08':1.97,'s09':.05,'s10':.01,'braam':.03,'subdrop':.01,'whoosh':.3,'revswell':1.6}
SRC={n:f'{D}/{n}.wav' for n in ['s01','s02','s03','s04','s05','s06','s07','s08','s09','s10']}
SRC.update({n:f'{Y}/{n}.wav' for n in ['braam','subdrop','whoosh','revswell']})
k=dict(a1=2.09,a2=2.63,a3=2.89,b1=4.23,b2=5.07,c1=6.13,c2=6.79,c3=7.29,c4t=8.15,c4=8.57,d1=9.21,d2=10.67,e1=11.51,e2=12.29,e3=13.67,f1=14.9,sz=15.9,g1=16.87,g2=19.51,h1=22.42,h2=24.12,h3=24.44,j1=25.92,j1b=26.88,j2=27.58,j3=28.68,j4=29.42,k1=30.3,k2=31.08,m1=33.32,m2=34.58,m2c=34.88,m3=35.36)
E=[]
# 1 · icon lands on the paper, calendar, "2027"
E+=[(.45,'s06',-6),(.45,'subdrop',-16),(.29,'s06',-11),(.63,'s09',-12),(1.11,'s01',-10),(1.11,'s09',-10)]
# 2 · "chiude": trailer braam + sub, the sign creaks
E+=[(k['a2'],'braam',-3),(k['a2'],'s02',-3),(k['a2']+.3,'s09',-19)]
# 3 · Italy tiles tick in, short sub on "Italia" (no long tail)
E+=[(2.93+i*.06,'s09',-19) for i in range(6)]+[(3.29,'subdrop',-8)]
# 4 · profile card arrives, "cancellato": hit + sub, photos flip
E+=[(k['b1']+.1,'s06',-12),(k['b2'],'s03',-5),(k['b2'],'subdrop',-9)]+[(k['b2']+.1+i*.045,'s09',-15) for i in range(9)]
# 5 · three tiles land, red slash, they fall
E+=[(t+.24,'s06',-7) for t in (k['c1'],k['c2'],k['c3'])]+[(k['c4'],'s01',-8),(k['c4'],'subdrop',-5),(k['c4']+.2,'whoosh',-16)]
# 6 · cut to dark chart, counter ticks, "Spariti"
E+=[(k['d1'],'whoosh',-11)]+[(k['d1']+.35+(k['d2']-k['d1']-.35)*(1-(1-i/14)**1.6),'s09',-24) for i in range(14)]+[(k['d2'],'subdrop',-3),(k['d2'],'s03',-6)]
# 7 · polaroids pop, flip-book ticks, fly away on "perso"
E+=[(k['e1']+i*.09+.15,'s06',-13) for i in range(7)]+[(k['e2'],'whoosh',-15)]+[(k['e2']+.4+i*.09,'s09',-23) for i in range(int((k['e3']-k['e2']-.4)/.09))]
E+=[(k['e3']+.3,'subdrop',-3),(k['e3']+.3,'s03',-6),(k['e3']+.35,'whoosh',-12)]
# 8 · the pause holds, a reverse swell sucks into "Scherzavo", then the sound flips bright
E+=[(k['sz'],'revswell',-5),(k['sz'],'s08',-15),(k['sz'],'s09',-4),(k['sz'],'s06',-5),(k['sz']+.02,'s10',-7),(k['sz']+.03,'s01',-15)]
# 9 · dark: glowing guy, news cards pop, vanish on "vero?"
E+=[(k['g1'],'whoosh',-11)]+[(k['g1']+.3+i*.12,'s06',-16) for i in range(3)]+[(18.74,'s01',-12)]
# 10 · before/after phones, "potente", chart rises
E+=[(k['g2'],'whoosh',-13),(20.59,'s03',-7),(22.2,'s04',-18)]
# 11 · AI prompt typed, Claude appears, timer
E+=[(k['h1'],'whoosh',-12)]+[(22.6+i*.08,'s09',-24) for i in range(16)]+[(k['h2'],'s10',-6),(k['h2'],'subdrop',-10)]+[(k['h3']+.1+i*(25.3-k['h3']-.1)/15,'s09',-24) for i in range(15)]+[(25.35,'s06',-14)]
# 12 · idea typed and absorbed, outputs shoot out
E+=[(k['j1']+.1,'s06',-14)]+[(k['j1']+.25+i*.045,'s09',-25) for i in range(16)]+[(k['j1b']+.28,'revswell',-14),(k['j1b']+.28,'s02',-8)]
E+=[(t,'s06',-9) for t in (k['j2'],k['j3'],k['j4'])]+[(k['j3']+.05,'s01',-15),(k['j4']+.05,'s10',-17)]
# 13 · bars rise, arrow climbs
E+=[(t+.1,'s06',-9) for t in (k['k2'],31.24,31.52)]+[(32.5,'s04',-12)]
# 14 · CTA: card in, comment typed + sent, DM, heart + final sub
E+=[(k['m1'],'whoosh',-12)]+[(k['m2c']+i*.07,'s09',-14) for i in range(6)]+[(k['m2c']+.55,'s06',-7),(k['m3']+.1,'s01',-11),(k['m3']+.12,'s06',-9),(36.95,'s06',-6),(36.95,'subdrop',-8)]
E=[(w(t)+.033,n,g) for t,n,g in E]
args=['ffmpeg','-v','error','-y'];fc=[];lb=[]
for i,(t,n,g) in enumerate(E):
  args+=['-i',SRC[n]];st=max(0,t-PK[n]);fc.append(f'[{i}:a]aresample=48000,aformat=channel_layouts=stereo,volume={g}dB,adelay={int(st*1000)}|{int(st*1000)}[a{i}]');lb.append(f'[a{i}]')
fc.append(''.join(lb)+f'amix=inputs={len(E)}:normalize=0:duration=longest,apad,atrim=duration={DUR}[m]')
args+=['-filter_complex',';'.join(fc),'-map','[m]','-ar','48000','-ac','2',S+'myvoice/f5_ev.wav'];subprocess.run(args,check=True)
subprocess.run(['ffmpeg','-v','error','-y','-i',S+'v11/luca_edit.wav','-af',f'aformat=channel_layouts=stereo,aresample=48000,apad,atrim=duration={DUR}',S+'myvoice/f5_v.wav'],check=True)
def rd(f):
  ww=wave.open(f);a=np.frombuffer(ww.readframes(ww.getnframes()),np.int16).astype(np.float32)/32768;return a.reshape(-1,ww.getnchannels()),ww.getframerate()
v,sr=rd(S+'myvoice/f5_v.wav');s,_=rd(S+'myvoice/f5_ev.wav');n=min(len(v),len(s));v=v[:n];s=s[:n].copy()
# tension bed: from "chiude" to "Scherzavo", rising, hard stop on the flip
tb,_=rd(Y+'/tension.wav');t0=w(k['a2']);t1=w(k['sz']);i0=int(t0*sr);i1=int(t1*sr);L=i1-i0;seg=tb[:L].copy()
u=np.linspace(0,1,L);gdb=-21+7*np.clip((np.linspace(t0,t1,L)-t0)/(w(k['e3']+.3)-t0),0,1)
env=10**(gdb/20)*np.clip(u*L/sr/1.2,0,1);env[-int(.03*sr):]*=np.linspace(1,0,int(.03*sr));s[i0:i1]+=seg*env[:,None]
hop=240;win=960
def envf(x):m=(x**2).mean(1);c=np.convolve(m,np.ones(win)/win,'same')[::hop];return 10*np.log10(c+1e-12)
ve=envf(v);se=envf(s);need=np.where(ve>-55,np.minimum(0,(ve-10)-se),0.0);la=16
need=np.array([need[max(0,i-la):i+la+1].min() for i in range(len(need))]);sm=np.minimum(np.convolve(need,np.ones(6)/6,'same'),0)
g=10**(np.repeat(sm,hop)[:n]/20);o=s*g[:,None]
ww=wave.open(S+'myvoice/f5_sfx_safe.wav','wb');ww.setnchannels(2);ww.setsampwidth(2);ww.setframerate(sr);ww.writeframes((np.clip(o,-1,1)*32767).astype(np.int16).tobytes());ww.close()
subprocess.run(['ffmpeg','-v','error','-y','-i',S+'myvoice/f5_v.wav','-i',S+'myvoice/f5_sfx_safe.wav','-filter_complex','[0:a][1:a]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11,volume=1.6dB,alimiter=limit=0.84:level=false','-ar','48000','-ac','2',S+'myvoice/f5_mix.wav'],check=True)
vm=v.mean(1);om=o.mean(1)
for thr,lab in [(-40,'normale'),(-50,'bordi parole')]:
  bad=tot=0;worst=-99
  for i in range(0,n-4800,4800):
    rv=20*np.log10(np.sqrt(np.mean(vm[i:i+4800]**2))+1e-7);rs=20*np.log10(np.sqrt(np.mean(om[i:i+4800]**2))+1e-7)
    if rv>thr:tot+=1;worst=max(worst,rs-rv);bad+=rs>rv-6
  print(f'controllo {lab}: {tot} tratti, troppo vicini {bad}, peggiore {worst:+.1f} dB')
print('eventi',len(E),'| tappeto', round(t0,2),'->',round(t1,2))
# loudness of effects alone where voice is silent (how present the sound design is)
q=[20*np.log10(np.sqrt(np.mean(om[i:i+4800]**2))+1e-7) for i in range(0,n-4800,4800)]
print('effetti, livello medio nei tratti attivi:',round(np.mean([x for x in q if x>-60]),1),'dBFS')
