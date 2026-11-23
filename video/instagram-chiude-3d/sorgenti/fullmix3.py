import subprocess,numpy as np,wave,json
S='/tmp/claude-0/-home-user-costruzione/f8f5e66a-bca6-52b8-a8d5-01ec917fceb6/scratchpad/'
D=S+'mkw';DUR=38.3
PK={'s01':.09,'s02':.01,'s03':.28,'s04':1.71,'s05':.25,'s06':.12,'s07':.80,'s08':1.97,'s09':.05,'s10':.01}
k=dict(a1=2.09,a2=2.63,a3=2.89,b1=4.23,b2=5.07,c1=6.13,c2=6.79,c3=7.29,c4t=8.15,c4=8.57,d1=9.21,d2=10.67,e1=11.51,e2=12.29,e3=13.67,f1=14.9,f2=15.78,g1=16.87,g2=19.51,h2=24.12,j1=25.92,j2=27.58,j3=28.68,j4=29.42,k1=30.3,k2=31.08,m1=33.32,m2c=34.88,m3=35.36)
r=lambda i:((np.sin(i*127.1+311.7)*43758.5453)%1)
k.update(dict(g1=16.87,g2=19.51,h1=22.42,h3=24.44,m2=34.58))
E=[]
# hook: camera orbit, swell into the lens, the shutter snaps shut on "chiude"
E+=[(0.05,'s07',-15),(k['a2'],'s08',-10),(k['a2'],'s09',-6),(k['a2']+.02,'s02',-1),(k['a2']+.03,'s01',-14),(k['a3'],'s07',-14)]
# glass profile card: arrives, cracks, shatters
E+=[(k['b1'],'s07',-14),(k['b2']-.1,'s09',-12),(k['b2']+.05,'s03',-3),(k['b2']+.05,'s01',-12)]
# neon signs: each lights up with a pop + tick, they flicker out, blackout
E+=[(t,'s06',-9) for t in (k['c1'],k['c2'],k['c3'])]+[(t+.05,'s09',-18) for t in (k['c1'],k['c2'],k['c3'])]
E+=[(k['c4t']+.05+i*.09,'s09',-16) for i in range(5)]+[(k['c4'],'s01',-10),(k['c4'],'s02',-4)]
# followers: wind blows the particles, counter ticks, "Spariti"
E+=[(k['d1']+.4,'s07',-14)]+[(k['d1']+.35+(k['d2']-k['d1']-.35)*(1-(1-i/14)**1.6),'s09',-22) for i in range(14)]+[(k['d2'],'s05',-3)]
# hyperspace: whoosh, year ticks, riser into the implosion, then silence until "Respira"
E+=[(k['e1'],'s07',-12)]+[(k['e1']+(k['e3']-k['e1'])*((i+1)/10)**1.8,'s09',-20) for i in range(9)]+[(k['e3'],'s04',-6),(k['e3'],'s02',-1),(k['e3']+.04,'s03',-5)]
# rebuild: pieces snap back, icon appears, relief shimmer
E+=[(k['f1']+.3+i*.11,'s09',-24) for i in range(10)]+[(k['f1']+1.35,'s06',-10),(k['f2'],'s10',-12)]
# phone opens into layers, labels pop
E+=[(k['g1'],'s07',-14),(k['g2'],'s07',-12)]+[(k['g2']+.6+i*.1,'s06',-16) for i in range(4)]
# Claude asterisk + clock ticking
E+=[(k['h1'],'s07',-18),(k['h2'],'s10',-8),(k['h2'],'s02',-12)]+[(k['h3']+i*(k['j1']-.3-k['h3'])/15,'s09',-26) for i in range(15)]
# idea typed; animazioni ribbon, effetti burst, suoni bars
E+=[(k['j1']+.15+i*.05,'s09',-25) for i in range(16)]+[(k['j2'],'s07',-13),(k['j3'],'s01',-12),(k['j3']+.15,'s01',-16),(k['j4'],'s06',-14),(k['j4']+.05,'s10',-16)]
# shops: camera move, screens light up, riser as the arrow climbs
E+=[(k['k1'],'s07',-14)]+[(k['k2']+i*.35,'s06',-10) for i in range(3)]+[(k['m1']-.4,'s04',-10)]
# CTA: suck-in onto the cut, neon letters tick on, comment typed and sent, message flies off, final hit after the last word
E+=[(k['m1'],'s08',-12)]+[(k['m2c']-.1+i*.07,'s09',-14) for i in range(6)]+[(k['m2c']+i*.07,'s09',-22) for i in range(6)]
E+=[(k['m2c']+.55,'s06',-8),(k['m3']+.15,'s07',-10),(36.95,'s05',-5)]
E=[(t+.033,n,g) for t,n,g in E]
args=['ffmpeg','-v','error','-y'];fc=[];lb=[]
for i,(t,n,g) in enumerate(E):
  args+=['-i',f'{D}/{n}.wav'];st=max(0,t-PK[n]);fc.append(f'[{i}:a]aresample=48000,aformat=channel_layouts=stereo,volume={g}dB,adelay={int(st*1000)}|{int(st*1000)}[a{i}]');lb.append(f'[a{i}]')
fc.append(''.join(lb)+f'amix=inputs={len(E)}:normalize=0:duration=longest,apad,atrim=duration={DUR},volume=-3dB[m]')
args+=['-filter_complex',';'.join(fc),'-map','[m]','-ar','48000','-ac','2',S+'myvoice/f3_sfx.wav'];subprocess.run(args,check=True)
subprocess.run(['ffmpeg','-v','error','-y','-i',S+'igv2/voice_edit.wav','-af',f'aformat=channel_layouts=stereo,aresample=48000,apad,atrim=duration={DUR}',S+'myvoice/f2_v.wav'],check=True)
def rd(f):
  w=wave.open(f);a=np.frombuffer(w.readframes(w.getnframes()),np.int16).astype(np.float32)/32768;return a.reshape(-1,w.getnchannels()),w.getframerate()
v,sr=rd(S+'myvoice/f2_v.wav');s,_=rd(S+'myvoice/f3_sfx.wav');n=min(len(v),len(s));v=v[:n];s=s[:n]
hop=240;win=960
def env(x):m=(x**2).mean(1);c=np.convolve(m,np.ones(win)/win,'same')[::hop];return 10*np.log10(c+1e-12)
ve=env(v);se=env(s);need=np.where(ve>-55,np.minimum(0,(np.maximum(ve,-40)-8)-se),0.0);la=16
need=np.array([need[max(0,i-la):i+la+1].min() for i in range(len(need))]);sm=np.minimum(np.convolve(need,np.ones(6)/6,'same'),0)
g=10**(np.repeat(sm,hop)[:n]/20);o=s*g[:,None]
w=wave.open(S+'myvoice/f3_sfx_safe.wav','wb');w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes((np.clip(o,-1,1)*32767).astype(np.int16).tobytes());w.close()
vm=v.mean(1);om=o.mean(1);bad=tot=0;worst=-99
for i in range(0,n-4800,4800):
  rv=20*np.log10(np.sqrt(np.mean(vm[i:i+4800]**2))+1e-7);rs=20*np.log10(np.sqrt(np.mean(om[i:i+4800]**2))+1e-7)
  if rv>-40:
    tot+=1;worst=max(worst,rs-rv);bad+=rs>rv-6
subprocess.run(['ffmpeg','-v','error','-y','-i',S+'myvoice/f2_v.wav','-i',S+'myvoice/f3_sfx_safe.wav','-filter_complex','[0:a][1:a]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11,volume=1.6dB,alimiter=limit=0.84:level=false','-ar','48000','-ac','2',S+'myvoice/f3_mix.wav'],check=True)
bad2=tot2=0;worst2=-99
for i in range(0,n-4800,4800):
  rv=20*np.log10(np.sqrt(np.mean(vm[i:i+4800]**2))+1e-7);rs=20*np.log10(np.sqrt(np.mean(om[i:i+4800]**2))+1e-7)
  if rv>-50:
    tot2+=1;worst2=max(worst2,rs-rv);bad2+=rs>rv-6
print(f'eventi sonori: {len(E)} (solo i tuoi s01-s10)')
print(f'controllo normale  (voce > -40 dB): {tot} tratti, effetti troppo vicini: {bad}, caso peggiore {worst:+.1f} dB')
print(f'controllo bordi parole (voce > -50 dB): {tot2} tratti, effetti troppo vicini: {bad2}, caso peggiore {worst2:+.1f} dB')
