# Sound design v2: every sound is tied to a visible event. Premium Mixkit SFX (free licence) + synth suck/sub.
import subprocess,numpy as np,wave
S='/tmp/claude-0/-home-user-costruzione/f8f5e66a-bca6-52b8-a8d5-01ec917fceb6/scratchpad/';MK=S+'mixkit/wav/';Y=S+'synth/';G=S+'gs/'
DUR=48.0
def rd(f):
  w=wave.open(f);a=np.frombuffer(w.readframes(w.getnframes()),np.int16).astype(np.float32)/32768;return a.reshape(-1,w.getnchannels()),w.getframerate()
INFO={}
def src(n):
  f=(Y+n+'.wav') if n in('revswell','subdrop') else MK+n+'.wav'
  if n not in INFO:
    a,sr=rd(f);m=a.mean(1);env=np.convolve(np.abs(m),np.ones(480)/480,'same');INFO[n]=(f,env.argmax()/sr,len(m)/sr,float(np.abs(a).max()))
  return INFO[n]
PEAKFIX={'revswell':1.6}
E=[]  # (time of the hit, sound, gain dB vs -1 dBFS peak, tail after hit s, run-up kept before hit s)
A=lambda t,n,g,l=.6,pre=.06:E.append((t,n,g,l,pre))
LOW,VAC,DEEP='1482','1465','1143'
# HOOK
A(.6,LOW,-12,.6,.5);A(.74,'2303',-14,.8)
A(1.12,'3005',-14,.2)
A(2.0,DEEP,-15,.7,.3)
for i in range(7):A(1.92+i*.085,'2857',-15,.12)
A(2.9,'2602',-17,.6,.1)
for i in range(4):A(3.37+i*.07,'3005',-17,.15)
A(3.9,'2299',-9,.8);A(3.9,'subdrop',-11,.9,0)
A(4.45,LOW,-11,.4,.4)
# NAME: split-flap clacks, card rises with a low swoosh, GRATIS stamp thud, push out
for t in (5.18,5.5,5.78,6.06):A(t,'2857',-14,.12)
A(7.05,VAC,-14,.4,.6);A(7.32,'2303',-11,.7);A(7.33,'3005',-15,.15);A(7.98,LOW,-13,.4,.4)
# HOW
for i in range(7):A(8.32+i*.075,'2533',-16,.12)
A(8.86,'2573',-11,.5)
for i in range(3):A(9.46+i*.2,'3005',-13,.15);A(9.9+i*.2,'2568',-17,.15)
A(10.8,VAC,-16,.3,.4)
for i in range(6):A(10.86+i*.12,'2533',-20,.1)
A(11.9,'count:1.45:1500:2600',-1,0,0)
A(13.42,'2520',-12,.4);A(14.1,'1109',-8,.3);A(14.34,'1109',-8,.3);A(14.52,VAC,-15,.3,.3);A(14.55,'2520',-16,.4)
# TEST: keys pressed by the auto-tester, glitches on the errors, fix tone
import math
for k in range(4):
  for f in range(int(16.0*60),int(18.75*60)):
    T=f/60
    if math.sin(T*6+k*1.3)>.85 and math.sin((T-1/60)*6+k*1.3)<=.85:A(T,'2533',-21,.1)
for i in range(3):A(17.54+i*.1,'2951',-13-i*2,.4)
A(18.09,'2870',-12,.9);A(18.2,'2568',-16,.15);A(18.32,'2568',-16,.15)
# DIVE: suck into the screen, hit on "assurda", riser through hyperspace into the counter
A(19.2,VAC,-10,.2,.5);A(19.24,'2299',-7,.8);A(19.24,'subdrop',-8,.9,0)
A(21.46,'790',-12,.05,1.6)
A(21.46,'count:.5:1800:3200',0,0,0);A(21.86,'2303',-9,.9)
# AGENTS: nodes lock into the pyramid, camera moves, one tone per label
A(23.4,LOW,-14,.5,.4)
for i in range(5):A(23.3+i*.12,'2858',-18,.15)
for t in (25.0,28.1,32.65):A(t,LOW,-16,.4,.4)
for t in (26.26,27.02,27.5,29.64,30.18,30.98,31.46,31.88,34.18,35.2,36.14):A(t,'2573',-13,.5)
# FLASH: short riser on the pull-back, camera shutter + hit on the white flash
A(36.84,'790',-15,.02,.55);A(36.84,'1430',-8,.3);A(36.84,'2299',-9,.8)
for i in range(8):A(36.92+i*.05,'3005',-19,.12)
A(37.12,'2303',-11,.7)
A(39.3,LOW,-15,.4,.35);A(39.26,'2573',-12,.5);A(39.84,'2520',-12,.4);A(40.62,'2870',-13,.8)
# TWIST
A(41.2,'3005',-11,.15);A(41.97,'2858',-11,.25);A(42.15,'2952',-10,.7);A(42.6,DEEP,-11,.7,.3);A(42.98,'2908',-9,1.1)
A(44.1,VAC,-12,.2,.5);A(44.14,'2303',-15,.6)
# CTA
A(44.7,LOW,-14,.4,.35)
for i in range(6):A(45.0+i*.065+.02,'2533',-11,.12)
A(45.55,'2573',-9,.5);A(45.76,'2354',-6,.8);A(46.1,'2568',-14,.15);A(47.12,'2303',-14,.8)
SR=48000;N=int(DUR*SR);acc=np.zeros((N,2),np.float32);cache={}
def load(f):
  if f not in cache:
    a,sr=rd(f)
    if a.shape[1]==1:a=np.repeat(a,2,1)
    cache[f]=a
  return cache[f]
def counting(dur,f0,f1):  # "counting score": a roll of tiny metallic ticks that speeds up and rises in pitch
  out=np.zeros((int(dur*SR)+SR//5,2),np.float32);rng=np.random.default_rng(3);t=0.0;i=0
  while t<dur:
    u=t/dur;rate=18+22*u;f=f0+(f1-f0)*u;n=int(.035*SR);tt=np.arange(n)/SR
    tick=np.sin(2*np.pi*f*tt)*np.exp(-tt*120)+.5*np.sin(2*np.pi*f*2.01*tt)*np.exp(-tt*160)
    nz=rng.standard_normal(n)*np.exp(-tt*600)*.6;x=(tick+nz)*(.55+.45*u);p=.5+.35*np.sin(i*1.7)
    j=int(t*SR);out[j:j+n,0]+=x*(1-p)*1.4;out[j:j+n,1]+=x*p*1.4;t+=1/rate;i+=1
  return out/np.abs(out).max()*.89
for (t,n,g,l,pre) in E:
  if n.startswith('count:'):
    _,d_,a_,b_=n.split(':');seg=counting(float(d_),float(a_),float(b_))*10**(g/20);i0=int(t*SR)
  else:
    f,pk,d,mx=src(n);pk=PEAKFIX.get(n,pk);a=load(f)
    if n=='subdrop':pre=pk
    cut=max(0.0,pk-pre);end=min(pk+l,d);seg=a[int(cut*SR):int(end*SR)].copy()
    if len(seg)<10:continue
    fi=min(len(seg),int((.012 if pre<.1 else .08)*SR));seg[:fi]*=np.linspace(0,1,fi)[:,None]
    fo=min(len(seg),int(.12*SR));seg[-fo:]*=np.linspace(1,0,fo)[:,None]
    seg*=10**((g-20*np.log10(mx/0.89))/20);i0=int((t+.033-(pk-cut))*SR)
  if i0<0:seg=seg[-i0:];i0=0
  i1=min(N,i0+len(seg));acc[i0:i1]+=seg[:i1-i0]
w=wave.open(G+'ev4.wav','wb');w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((np.clip(acc,-1,1)*32767).astype(np.int16).tobytes());w.close()
v,sr=rd(G+'v.wav');s,_=rd(G+'ev4.wav');n=min(len(v),len(s));v=v[:n];s=s[:n].copy()
hop=240;win=3600
def envf(x):m=(x**2).mean(1);c=np.convolve(m,np.ones(win)/win,'same')[::hop];return 10*np.log10(c+1e-12)
ve=envf(v);se=envf(s);need=np.where(ve>-55,np.minimum(0,(ve-10)-se),0.0);la=16
need=np.array([need[max(0,i-la):i+la+1].min() for i in range(len(need))]);sm=np.minimum(np.convolve(need,np.ones(6)/6,'same'),0)
g=10**(np.repeat(sm,hop)[:n]/20);o=s*g[:,None]
w=wave.open(G+'sfx4_safe.wav','wb');w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes((np.clip(o,-1,1)*32767).astype(np.int16).tobytes());w.close()
subprocess.run(['ffmpeg','-v','error','-y','-i',G+'v.wav','-i',G+'sfx4_safe.wav','-filter_complex','[0:a][1:a]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11,volume=1.6dB,alimiter=limit=0.84:level=false','-ar','48000','-ac','2',G+'mix4.wav'],check=True)
vm=v.mean(1);om=o.mean(1)
for thr,lab in [(-40,'normale'),(-50,'bordi parole')]:
  bad=tot=0;worst=-99
  for i in range(0,n-4800,4800):
    rv=20*np.log10(np.sqrt(np.mean(vm[i:i+4800]**2))+1e-7);rs=20*np.log10(np.sqrt(np.mean(om[i:i+4800]**2))+1e-7)
    if rv>thr:tot+=1;worst=max(worst,rs-rv);bad+=rs>rv-6
  print(f'controllo {lab}: {tot} tratti, troppo vicini {bad}, peggiore {worst:+.1f} dB')
q=[20*np.log10(np.sqrt(np.mean(om[i:i+4800]**2))+1e-7) for i in range(0,n-4800,4800)]
print('eventi',len(E),'| effetti, livello medio nei tratti attivi:',round(np.mean([x for x in q if x>-60]),1),'dBFS')
