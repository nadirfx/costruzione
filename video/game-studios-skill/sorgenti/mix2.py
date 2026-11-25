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
E=[]  # (time the sound "lands", name, gain dB relative to a -1 dBFS peak, max length s)
A=lambda t,n,g,l=1.5:E.append((t,n,g,l))
# HOOK
A(.36,'1464',-12,.8);A(.72,'2303',-13,1.4);A(1.15,'3083',-17,1.2)
A(1.95,'1143',-12,1.6)
for i in range(7):A(1.92+i*.085,'2568',-18,.2)
A(2.92,'2602',-18,1.0)
for i in range(4):A(3.37+i*.07,'3005',-16,.2)
A(3.9,'772',-9,1.1);A(4.45,'3115',-9,.6)
# NAME
for t in (5.18,5.5,5.78,6.06):A(t,'2568',-15,.2)
A(6.95,'166',-12,.7);A(7.32,'2299',-10,1.0);A(7.33,'2364',-13,.5);A(7.98,'1464',-13,.8)
# HOW
A(8.12,'166',-15,.7)
for i in range(7):A(8.32+i*.075,'2533',-16,.15)
A(8.86,'2573',-10,.8);A(9.2,'3115',-17,.5)
for i in range(3):A(9.46+i*.2,'3005',-12,.2);A(9.9+i*.2,'2568',-17,.2)
A(10.7,'1464',-14,.8)
for t in (11.12,11.33,11.54):A(t,'2568',-17,.2)
for i in range(12):A(11.98+i*.11,'2533',-19,.15)
A(13.45,'2618',-11,.7);A(14.1,'1109',-8,.4);A(14.34,'1109',-8,.4);A(14.45,'2626',-13,1.4);A(14.5,'3083',-18,1.2)
# TEST
A(16.3,'2521',-14,.7)
A(17.54,'2595',-11,.8);A(17.64,'2951',-14,.6);A(17.74,'2595',-14,.8)
A(18.09,'2870',-12,1.4);A(18.2,'2568',-16,.2);A(18.32,'2568',-16,.2)
# DIVE: suck into the screen, epic hit on "assurda", hyperspace
A(19.24,'revswell',-8,1.7);A(19.24,'2908',-6,3.0);A(19.24,'subdrop',-7,1.4);A(19.95,'1486',-12,2.6)
# AGENTS
for i in range(10):A(21.48+i*.045,'2568',-19,.15)
A(21.86,'2303',-8,1.8);A(22.05,'2602',-17,1.1);A(23.1,'2626',-12,1.6)
for t in (24.95,28.05,32.6):A(t,'2618',-15,.7)
for t in (26.26,27.02,27.5,29.64,30.18,30.98,31.46,31.88,34.18,35.2,36.14):A(t,'2573',-13,.7)
A(32.98,'2602',-17,1.1)
# FLASH CUT to the command wall
A(36.84,'revswell',-11,1.7);A(36.84,'788',-7,3.0)
for i in range(8):A(36.92+i*.05,'3005',-19,.2)
A(37.12,'2299',-9,1.0)
A(39.26,'2573',-12,.7);A(39.84,'2520',-12,.6);A(40.62,'2521',-12,.7);A(41.0,'1714',-11,2.0)
# TWIST
A(41.2,'3005',-11,.2);A(41.97,'2152',-10,1.0);A(42.15,'2952',-9,1.2);A(42.6,'1143',-10,1.6);A(42.5,'subdrop',-9,1.2);A(42.98,'2908',-8,2.5)
A(44.12,'revswell',-12,1.7);A(44.14,'3083',-13,1.4)
# CTA
A(44.65,'166',-12,.7)
for i in range(6):A(45.0+i*.065+.02,'2533',-11,.15)
A(45.55,'2573',-9,.7);A(45.57,'3115',-15,.5);A(45.76,'2354',-6,.9);A(46.1,'2568',-14,.2);A(46.0,'3083',-18,1.2);A(47.12,'2303',-12,1.5)
args=['ffmpeg','-v','error','-y'];fc=[];lb=[]
for i,(t,n,g,l) in enumerate(E):
  f,pk,d,mx=src(n);pk=PEAKFIX.get(n,pk);norm=-20*np.log10(mx/0.89)
  st=t+.033-pk;cut=0.0
  if st<0:cut=-st;st=0
  l2=min(l+pk,d)  # keep the run-up before the peak and l seconds after it
  args+=['-i',f]
  fc.append(f'[{i}:a]atrim=start={cut:.3f}:end={l2:.3f},asetpts=PTS-STARTPTS,afade=t=out:st={max(0,l2-cut-.12):.3f}:d=0.12,aresample=48000,aformat=channel_layouts=stereo,volume={g+norm:.2f}dB,adelay={int(st*1000)}|{int(st*1000)}[a{i}]');lb.append(f'[a{i}]')
fc.append(''.join(lb)+f'amix=inputs={len(E)}:normalize=0:duration=longest,apad,atrim=duration={DUR}[m]')
args+=['-filter_complex',';'.join(fc),'-map','[m]','-ar','48000','-ac','2',G+'ev2.wav'];subprocess.run(args,check=True)
v,sr=rd(G+'v.wav');s,_=rd(G+'ev2.wav');n=min(len(v),len(s));v=v[:n];s=s[:n].copy()
hop=240;win=960
def envf(x):m=(x**2).mean(1);c=np.convolve(m,np.ones(win)/win,'same')[::hop];return 10*np.log10(c+1e-12)
ve=envf(v);se=envf(s);need=np.where(ve>-55,np.minimum(0,(ve-10)-se),0.0);la=16
need=np.array([need[max(0,i-la):i+la+1].min() for i in range(len(need))]);sm=np.minimum(np.convolve(need,np.ones(6)/6,'same'),0)
g=10**(np.repeat(sm,hop)[:n]/20);o=s*g[:,None]
w=wave.open(G+'sfx2_safe.wav','wb');w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes((np.clip(o,-1,1)*32767).astype(np.int16).tobytes());w.close()
subprocess.run(['ffmpeg','-v','error','-y','-i',G+'v.wav','-i',G+'sfx2_safe.wav','-filter_complex','[0:a][1:a]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11,volume=1.6dB,alimiter=limit=0.84:level=false','-ar','48000','-ac','2',G+'mix2.wav'],check=True)
vm=v.mean(1);om=o.mean(1)
for thr,lab in [(-40,'normale'),(-50,'bordi parole')]:
  bad=tot=0;worst=-99
  for i in range(0,n-4800,4800):
    rv=20*np.log10(np.sqrt(np.mean(vm[i:i+4800]**2))+1e-7);rs=20*np.log10(np.sqrt(np.mean(om[i:i+4800]**2))+1e-7)
    if rv>thr:tot+=1;worst=max(worst,rs-rv);bad+=rs>rv-6
  print(f'controllo {lab}: {tot} tratti, troppo vicini {bad}, peggiore {worst:+.1f} dB')
q=[20*np.log10(np.sqrt(np.mean(om[i:i+4800]**2))+1e-7) for i in range(0,n-4800,4800)]
print('eventi',len(E),'| effetti, livello medio nei tratti attivi:',round(np.mean([x for x in q if x>-60]),1),'dBFS')
