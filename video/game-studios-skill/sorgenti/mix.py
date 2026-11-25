import subprocess,numpy as np,wave
S='/tmp/claude-0/-home-user-costruzione/f8f5e66a-bca6-52b8-a8d5-01ec917fceb6/scratchpad/'
D=S+'mkw';Y=S+'synth';G=S+'gs/'
DUR=48.0
PK={'s01':.09,'s02':.01,'s03':.28,'s04':1.71,'s06':.12,'s08':1.97,'s09':.05,'s10':.01,'braam':.03,'subdrop':.01,'whoosh':.3,'revswell':1.6}
SRC={n:f'{D}/{n}.wav' for n in ['s01','s02','s03','s04','s06','s08','s09','s10']};SRC.update({n:f'{Y}/{n}.wav' for n in ['braam','subdrop','whoosh','revswell']})
E=[]
# HOOK: tile appears, "gratis" sparkle, floors stack, windows light, pixels burst, shock ring, whip out
E+=[(.05,'s06',-8),(.02,'subdrop',-14),(1.1,'s10',-12),(1.72,'whoosh',-13)]+[(1.8+i*.085+.12,'s09',-19) for i in range(7)]
E+=[(2.82,'s01',-12),(3.34,'s08',-15)]+[(3.36+i*.07,'s06',-19) for i in range(4)]+[(3.9,'subdrop',-7),(3.9,'s03',-11),(4.42,'whoosh',-8)]
# NAME: each word flips in, card rises, GRATIS stamp, push out
E+=[(t,'s09',-15) for t in (5.18,5.5,5.78,6.06)]+[(6.85,'whoosh',-15),(7.32,'s06',-7),(7.32,'s01',-15),(7.95,'whoosh',-14)]
# HOW: typing, send, questions pop, brief lines, code, browser, double click, game opens
E+=[(8.32+i*.075,'s09',-25) for i in range(7)]+[(8.86,'s06',-9),(9.2,'whoosh',-19)]+[(9.46+i*.2,'s06',-12) for i in range(3)]+[(9.86+i*.2,'s09',-20) for i in range(3)]
E+=[(10.66,'whoosh',-18)]+[(10.85+i*.07,'s09',-25) for i in range(9)]+[(11.1,'s06',-17),(11.3,'s06',-17),(11.5,'s06',-17)]
E+=[(11.95+i*.11,'s09',-27) for i in range(13)]+[(13.38,'s10',-12),(13.45,'s06',-12),(14.1,'s09',-7),(14.34,'s09',-7),(14.36,'s01',-10),(14.4,'s08',-17)]
# TEST: scan, three errors, fixes
E+=[(16.24,'s08',-19)]+[(17.54+i*.1,'s03',-11-i*2) for i in range(3)]+[(18.08,'s10',-10)]+[(18.08+i*.12,'s06',-12) for i in range(3)]
# DIVE: suck into the screen, hit on "assurda"
E+=[(19.24,'revswell',-6),(19.24,'subdrop',-3),(19.24,'braam',-6),(19.24,'s03',-9)]
# AGENTS: counter ticks, 49 lands, grid wave, morph to pyramid
E+=[(21.48+i*.045,'s09',-21) for i in range(10)]+[(21.86,'s01',-10),(22.0,'s08',-18),(23.04,'whoosh',-12),(23.3,'revswell',-16),(24.2,'s02',-13)]
# TIERS
E+=[(24.9,'whoosh',-15)]+[(t,'s06',-10) for t in (26.26,27.02,27.5)]+[(28.0,'whoosh',-15)]+[(t,'s06',-11) for t in (29.64,30.18,30.98,31.46,31.88)]
E+=[(32.54,'whoosh',-15),(32.94,'s08',-14)]+[(t,'s06',-10) for t in (34.18,35.2,36.14)]
# FLASH CUT to the command wall
E+=[(36.84,'revswell',-9),(36.84,'s01',-6),(36.84,'subdrop',-7)]+[(36.9+i*.04,'s09',-23) for i in range(10)]+[(37.1,'s03',-10)]
E+=[(39.26,'s06',-9),(39.84,'s06',-9),(40.62,'s10',-11),(40.9,'whoosh',-10)]
# TWIST
E+=[(41.18,'s06',-11),(41.94,'s02',-9),(42.12,'s03',-8),(42.46,'braam',-5),(42.46,'subdrop',-7),(42.98,'s01',-8)]
E+=[(44.12,'revswell',-10),(44.12,'s10',-10)]
# CTA
E+=[(44.6,'whoosh',-12)]+[(45.0+i*.065,'s09',-13) for i in range(6)]+[(45.55,'s06',-8),(45.74,'s10',-12),(46.1,'s06',-14),(46.9,'subdrop',-11)]
E=[(t+.033,n,g) for t,n,g in E]
args=['ffmpeg','-v','error','-y'];fc=[];lb=[]
for i,(t,n,g) in enumerate(E):
  args+=['-i',SRC[n]];st=max(0,t-PK[n]);fc.append(f'[{i}:a]aresample=48000,aformat=channel_layouts=stereo,volume={g}dB,adelay={int(st*1000)}|{int(st*1000)}[a{i}]');lb.append(f'[a{i}]')
fc.append(''.join(lb)+f'amix=inputs={len(E)}:normalize=0:duration=longest,apad,atrim=duration={DUR}[m]')
args+=['-filter_complex',';'.join(fc),'-map','[m]','-ar','48000','-ac','2',G+'ev.wav'];subprocess.run(args,check=True)
subprocess.run(['ffmpeg','-v','error','-y','-i',G+'voce.mp3','-af',f'aformat=channel_layouts=stereo,aresample=48000,apad,atrim=duration={DUR}',G+'v.wav'],check=True)
def rd(f):
  ww=wave.open(f);a=np.frombuffer(ww.readframes(ww.getnframes()),np.int16).astype(np.float32)/32768;return a.reshape(-1,ww.getnchannels()),ww.getframerate()
v,sr=rd(G+'v.wav');s,_=rd(G+'ev.wav');n=min(len(v),len(s));v=v[:n];s=s[:n].copy()
# tension bed under the whole "inside the studio" section, rising, hard stop on the flash cut
tb,_=rd(Y+'/tension.wav');t0,t1=19.3,36.84;i0=int(t0*sr);i1=int(t1*sr);Lg=i1-i0;seg=np.concatenate([tb,tb])[:Lg].copy()
u=np.linspace(0,1,Lg);gdb=-22+8*u;env=10**(gdb/20)*np.clip(u*Lg/sr/1.0,0,1);env[-int(.03*sr):]*=np.linspace(1,0,int(.03*sr));s[i0:i1]+=seg*env[:,None]
hop=240;win=960
def envf(x):m=(x**2).mean(1);c=np.convolve(m,np.ones(win)/win,'same')[::hop];return 10*np.log10(c+1e-12)
ve=envf(v);se=envf(s);need=np.where(ve>-55,np.minimum(0,(ve-10)-se),0.0);la=16
need=np.array([need[max(0,i-la):i+la+1].min() for i in range(len(need))]);sm=np.minimum(np.convolve(need,np.ones(6)/6,'same'),0)
g=10**(np.repeat(sm,hop)[:n]/20);o=s*g[:,None]
ww=wave.open(G+'sfx_safe.wav','wb');ww.setnchannels(2);ww.setsampwidth(2);ww.setframerate(sr);ww.writeframes((np.clip(o,-1,1)*32767).astype(np.int16).tobytes());ww.close()
subprocess.run(['ffmpeg','-v','error','-y','-i',G+'v.wav','-i',G+'sfx_safe.wav','-filter_complex','[0:a][1:a]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11,volume=1.6dB,alimiter=limit=0.84:level=false','-ar','48000','-ac','2',G+'mix.wav'],check=True)
vm=v.mean(1);om=o.mean(1)
for thr,lab in [(-40,'normale'),(-50,'bordi parole')]:
  bad=tot=0;worst=-99
  for i in range(0,n-4800,4800):
    rv=20*np.log10(np.sqrt(np.mean(vm[i:i+4800]**2))+1e-7);rs=20*np.log10(np.sqrt(np.mean(om[i:i+4800]**2))+1e-7)
    if rv>thr:tot+=1;worst=max(worst,rs-rv);bad+=rs>rv-6
  print(f'controllo {lab}: {tot} tratti, troppo vicini {bad}, peggiore {worst:+.1f} dB')
print('eventi',len(E))
