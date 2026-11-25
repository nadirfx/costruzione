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
E=[]  # (time the sound lands, name, gain dB vs -1 dBFS peak, max tail s). Only short, dry sounds; run-ups are cut.
A=lambda t,n,g,l=.6:E.append((t,n,g,l))
# HOOK: tile lands, "gratis" pop, 7 floors click in, windows bleep, pixels pop, one bass hit on "completo", whip
A(.72,'2303',-14,.9);A(1.12,'3005',-14,.2)
for i in range(7):A(1.92+i*.085,'2568',-17,.15)
A(2.9,'2520',-17,.4)
for i in range(4):A(3.37+i*.07,'3005',-17,.15)
A(3.9,'2299',-9,.8);A(3.9,'subdrop',-11,.9);A(4.45,'3115',-14,.4)
# NAME: one click per word, card pops, GRATIS stamp, whip out
for t in (5.18,5.5,5.78,6.06):A(t,'2568',-15,.15)
A(6.95,'3005',-13,.15);A(7.32,'2299',-11,.6);A(7.33,'2364',-13,.3);A(7.98,'3115',-15,.4)
# HOW: typing, send, question cards, brief checks, code typing, browser, double click, game opens
for i in range(7):A(8.32+i*.075,'2533',-16,.12)
A(8.86,'2573',-11,.5)
for i in range(3):A(9.46+i*.2,'3005',-13,.15);A(9.9+i*.2,'2568',-17,.15)
A(10.7,'3005',-14,.15)
for t in (11.12,11.33,11.54):A(t,'2568',-17,.15)
for i in range(12):A(11.98+i*.11,'2533',-19,.12)
A(13.42,'2520',-13,.4);A(14.1,'1109',-8,.3);A(14.34,'1109',-8,.3);A(14.48,'2520',-15,.4)
# TEST: scan bleep, three dry glitches on the errors, positive tone on the fix
A(16.26,'2520',-16,.4)
for i in range(3):A(17.54+i*.1,'2951',-12-i*2,.35)
A(18.09,'2870',-12,.9);A(18.2,'2568',-16,.15);A(18.32,'2568',-16,.15)
# DIVE: short swoosh into the screen, ONE dry hit on "assurda"
A(19.0,'3115',-13,.35);A(19.24,'2299',-7,.8);A(19.24,'subdrop',-8,.9)
# AGENTS: counter ticks, 49 lands, morph bleep, one tone per label
for i in range(10):A(21.48+i*.045,'2568',-19,.12)
A(21.86,'2303',-9,.9);A(23.06,'2520',-15,.4)
for t in (26.26,27.02,27.5,29.64,30.18,30.98,31.46,31.88,34.18,35.2,36.14):A(t,'2573',-13,.5)
# FLASH CUT: dry hit, chips pop, 70+ badge
A(36.84,'2299',-8,.8);A(36.84,'subdrop',-10,.8)
for i in range(8):A(36.92+i*.05,'3005',-19,.12)
A(37.12,'2364',-10,.3)
# TIMELINE: one tone per milestone, no rocket sound
A(39.26,'2573',-12,.5);A(39.84,'2520',-12,.4);A(40.62,'2870',-13,.8)
# TWIST: icon pops, X glitch, shatter, building hit, "intero" impact (run-up cut)
A(41.2,'3005',-11,.15);A(41.97,'2951',-11,.35);A(42.15,'2952',-10,.7);A(42.46,'2303',-10,.8);A(42.98,'2908',-9,1.0)
A(44.12,'2573',-12,.5)
# CTA: keys for C-L-A-U-D-E, send, DM notification, link
for i in range(6):A(45.0+i*.065+.02,'2533',-11,.12)
A(45.55,'2573',-9,.5);A(45.76,'2354',-6,.8);A(46.1,'2568',-14,.15);A(47.12,'2303',-14,.8)
SR=48000;N=int(DUR*SR);acc=np.zeros((N,2),np.float32);cache={}
def load(f):
  if f not in cache:
    a,sr=rd(f)
    if a.shape[1]==1:a=np.repeat(a,2,1)
    assert sr==SR,f;cache[f]=a
  return cache[f]
for (t,n,g,l) in E:
  f,pk,d,mx=src(n);pk=PEAKFIX.get(n,pk);a=load(f)
  pre=.06 if n!='subdrop' else pk;cut=max(0.0,pk-pre);end=min(pk+l,d)
  seg=a[int(cut*SR):int(end*SR)].copy()
  if len(seg)<10:print('vuoto',t,n);continue
  fi=min(len(seg),int(.012*SR));seg[:fi]*=np.linspace(0,1,fi)[:,None]
  fo=min(len(seg),int(.12*SR));seg[-fo:]*=np.linspace(1,0,fo)[:,None]
  seg*=10**((g-20*np.log10(mx/0.89))/20)
  i0=int((t+.033-(pk-cut))*SR)
  if i0<0:seg=seg[-i0:];i0=0
  i1=min(N,i0+len(seg));acc[i0:i1]+=seg[:i1-i0]
w=wave.open(G+'ev3.wav','wb');w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((np.clip(acc,-1,1)*32767).astype(np.int16).tobytes());w.close()
v,sr=rd(G+'v.wav');s,_=rd(G+'ev3.wav');n=min(len(v),len(s));v=v[:n];s=s[:n].copy()
hop=240;win=960
def envf(x):m=(x**2).mean(1);c=np.convolve(m,np.ones(win)/win,'same')[::hop];return 10*np.log10(c+1e-12)
ve=envf(v);se=envf(s);need=np.where(ve>-55,np.minimum(0,(ve-10)-se),0.0);la=16
need=np.array([need[max(0,i-la):i+la+1].min() for i in range(len(need))]);sm=np.minimum(np.convolve(need,np.ones(6)/6,'same'),0)
g=10**(np.repeat(sm,hop)[:n]/20);o=s*g[:,None]
w=wave.open(G+'sfx3_safe.wav','wb');w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes((np.clip(o,-1,1)*32767).astype(np.int16).tobytes());w.close()
subprocess.run(['ffmpeg','-v','error','-y','-i',G+'v.wav','-i',G+'sfx3_safe.wav','-filter_complex','[0:a][1:a]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11,volume=1.6dB,alimiter=limit=0.84:level=false','-ar','48000','-ac','2',G+'mix3.wav'],check=True)
vm=v.mean(1);om=o.mean(1)
for thr,lab in [(-40,'normale'),(-50,'bordi parole')]:
  bad=tot=0;worst=-99
  for i in range(0,n-4800,4800):
    rv=20*np.log10(np.sqrt(np.mean(vm[i:i+4800]**2))+1e-7);rs=20*np.log10(np.sqrt(np.mean(om[i:i+4800]**2))+1e-7)
    if rv>thr:tot+=1;worst=max(worst,rs-rv);bad+=rs>rv-6
  print(f'controllo {lab}: {tot} tratti, troppo vicini {bad}, peggiore {worst:+.1f} dB')
q=[20*np.log10(np.sqrt(np.mean(om[i:i+4800]**2))+1e-7) for i in range(0,n-4800,4800)]
print('eventi',len(E),'| effetti, livello medio nei tratti attivi:',round(np.mean([x for x in q if x>-60]),1),'dBFS')
