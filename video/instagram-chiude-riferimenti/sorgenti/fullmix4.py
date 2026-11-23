import subprocess,numpy as np,wave,json
S='/tmp/claude-0/-home-user-costruzione/f8f5e66a-bca6-52b8-a8d5-01ec917fceb6/scratchpad/'
D=S+'mkw';DUR=38.3
PK={'s01':.09,'s02':.01,'s03':.28,'s04':1.71,'s05':.25,'s06':.12,'s07':.80,'s08':1.97,'s09':.05,'s10':.01}
k=dict(a1=2.09,a2=2.63,a3=2.89,b1=4.23,b2=5.07,c1=6.13,c2=6.79,c3=7.29,c4t=8.15,c4=8.57,d1=9.21,d2=10.67,e1=11.51,e2=12.29,e3=13.67,f1=14.9,f2=15.78,g1=16.87,g2=19.51,h2=24.12,j1=25.92,j2=27.58,j3=28.68,j4=29.42,k1=30.3,k2=31.08,m1=33.32,m2c=34.88,m3=35.36)
r=lambda i:((np.sin(i*127.1+311.7)*43758.5453)%1)
k.update(dict(j1b=26.88,g1=16.87,g2=19.51,h1=22.42,h3=24.44,m2=34.58))
E=[]
# icon drops onto the paper, calendar pops, "2027" hit
E+=[(0.0,'s07',-17),(.45,'s06',-8),(.45,'s02',-7),(.29,'s06',-13),(.63,'s09',-14),(1.11,'s01',-12),(1.11,'s09',-12)]
# CHIUSO sign drops on "chiude", swings
E+=[(k['a2'],'s03',-4),(k['a2'],'s02',-2),(k['a2']+.25,'s09',-20)]
# Italy: tiles pop in, then switch off north to south
E+=[(2.93+i*.06,'s09',-21) for i in range(6)]+[(3.29,'s05',-6)]
# profile card swings in, photos flip one by one
E+=[(k['b1'],'s07',-15),(k['b2'],'s03',-6)]+[(k['b2']+i*.045+.1,'s09',-17) for i in range(9)]
# three tiles land, red slash, they fall
E+=[(t,'s07',-25) for t in (k['c1'],k['c2'],k['c3'])]+[(t+.24,'s06',-8) for t in (k['c1'],k['c2'],k['c3'])]+[(k['c4'],'s01',-10),(k['c4'],'s02',-4),(k['c4']+.15,'s07',-16)]
# dark chart: counter ticks down, "Spariti"
E+=[(k['d1'],'s08',-13)]+[(k['d1']+.35+(k['d2']-k['d1']-.35)*(1-(1-i/14)**1.6),'s09',-26) for i in range(14)]+[(k['d2'],'s05',-3),(k['d2'],'s02',-3)]
# polaroids pop one by one, collapse, fall on "perso"
E+=[(k['e1']+i*.09+.15,'s06',-15) for i in range(7)]+[(k['e2'],'s07',-12),(k['e3']+.3,'s03',-5),(k['e3']+.3,'s02',-3)]
# toggle: appears, click ON on "scherzando", confetti shimmer
E+=[(k['f1']+.1,'s06',-12),(15.9,'s09',-6),(15.9,'s06',-6),(15.95,'s10',-12)]
# glowing guy: news cards pop, vanish on "vero?"
E+=[(k['g1'],'s07',-14)]+[(k['g1']+.3+i*.12,'s06',-18) for i in range(3)]+[(18.74,'s01',-14)]
# before / after phones, chart rises
E+=[(k['g2'],'s07',-12),(20.59,'s03',-8),(22.15,'s04',-21)]
# AI prompt typed, Claude appears, timer
E+=[(k['h1'],'s07',-16)]+[(22.6+i*.08,'s09',-26) for i in range(16)]+[(k['h2'],'s10',-8),(k['h2'],'s02',-10)]+[(k['h3']+.1+i*(25.3-k['h3']-.1)/15,'s09',-26) for i in range(15)]+[(25.35,'s06',-17)]
# idea bubble typed and absorbed, three outputs shoot out
E+=[(k['j1'],'s07',-16)]+[(k['j1']+.25+i*.045,'s09',-26) for i in range(16)]+[(k['j1b']+.28,'s08',-14),(k['j1b']+.28,'s02',-10)]
E+=[(t,'s06',-12) for t in (k['j2'],k['j3'],k['j4'])]+[(k['j3']+.05,'s01',-18),(k['j4']+.05,'s10',-20)]
# bars rise, arrow climbs
E+=[(k['k1'],'s07',-16)]+[(t+.1,'s06',-10) for t in (k['k2'],31.24,31.52)]+[(32.5,'s04',-12)]
# CTA: post card, comment typed and sent, DM arrives, heart
E+=[(k['m1'],'s07',-14)]+[(k['m2c']+i*.07,'s09',-16) for i in range(6)]+[(k['m2c']+.55,'s06',-8),(k['m3']+.1,'s01',-12),(k['m3']+.12,'s06',-10),(36.95,'s06',-6),(36.95,'s05',-8)]
E=[(t+.033,n,g) for t,n,g in E]
args=['ffmpeg','-v','error','-y'];fc=[];lb=[]
for i,(t,n,g) in enumerate(E):
  args+=['-i',f'{D}/{n}.wav'];st=max(0,t-PK[n]);fc.append(f'[{i}:a]aresample=48000,aformat=channel_layouts=stereo,volume={g}dB,adelay={int(st*1000)}|{int(st*1000)}[a{i}]');lb.append(f'[a{i}]')
fc.append(''.join(lb)+f'amix=inputs={len(E)}:normalize=0:duration=longest,apad,atrim=duration={DUR},volume=-3dB[m]')
args+=['-filter_complex',';'.join(fc),'-map','[m]','-ar','48000','-ac','2',S+'myvoice/f4_sfx.wav'];subprocess.run(args,check=True)
subprocess.run(['ffmpeg','-v','error','-y','-i',S+'igv2/voice_edit.wav','-af',f'aformat=channel_layouts=stereo,aresample=48000,apad,atrim=duration={DUR}',S+'myvoice/f2_v.wav'],check=True)
def rd(f):
  w=wave.open(f);a=np.frombuffer(w.readframes(w.getnframes()),np.int16).astype(np.float32)/32768;return a.reshape(-1,w.getnchannels()),w.getframerate()
v,sr=rd(S+'myvoice/f2_v.wav');s,_=rd(S+'myvoice/f4_sfx.wav');n=min(len(v),len(s));v=v[:n];s=s[:n]
hop=240;win=960
def env(x):m=(x**2).mean(1);c=np.convolve(m,np.ones(win)/win,'same')[::hop];return 10*np.log10(c+1e-12)
ve=env(v);se=env(s);need=np.where(ve>-55,np.minimum(0,(ve-9)-se),0.0);la=16
need=np.array([need[max(0,i-la):i+la+1].min() for i in range(len(need))]);sm=np.minimum(np.convolve(need,np.ones(6)/6,'same'),0)
g=10**(np.repeat(sm,hop)[:n]/20);o=s*g[:,None]
w=wave.open(S+'myvoice/f4_sfx_safe.wav','wb');w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes((np.clip(o,-1,1)*32767).astype(np.int16).tobytes());w.close()
vm=v.mean(1);om=o.mean(1);bad=tot=0;worst=-99
for i in range(0,n-4800,4800):
  rv=20*np.log10(np.sqrt(np.mean(vm[i:i+4800]**2))+1e-7);rs=20*np.log10(np.sqrt(np.mean(om[i:i+4800]**2))+1e-7)
  if rv>-40:
    tot+=1;worst=max(worst,rs-rv);bad+=rs>rv-6
subprocess.run(['ffmpeg','-v','error','-y','-i',S+'myvoice/f2_v.wav','-i',S+'myvoice/f4_sfx_safe.wav','-filter_complex','[0:a][1:a]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11,volume=1.6dB,alimiter=limit=0.84:level=false','-ar','48000','-ac','2',S+'myvoice/f4_mix.wav'],check=True)
bad2=tot2=0;worst2=-99
for i in range(0,n-4800,4800):
  rv=20*np.log10(np.sqrt(np.mean(vm[i:i+4800]**2))+1e-7);rs=20*np.log10(np.sqrt(np.mean(om[i:i+4800]**2))+1e-7)
  if rv>-50:
    tot2+=1;worst2=max(worst2,rs-rv);bad2+=rs>rv-6
print(f'eventi sonori: {len(E)} (solo i tuoi s01-s10)')
print(f'controllo normale  (voce > -40 dB): {tot} tratti, effetti troppo vicini: {bad}, caso peggiore {worst:+.1f} dB')
print(f'controllo bordi parole (voce > -50 dB): {tot2} tratti, effetti troppo vicini: {bad2}, caso peggiore {worst2:+.1f} dB')
