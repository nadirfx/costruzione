# OpenMontage sound design: every sound tied to a visible event, made with earshot (MIT, rendered in code).
# Rules: no music, effects >=6 dB under the voice, camera moves = LOW air only (low-passed), riser ends on the hit,
# flash = shutter, pieces locking = latch/clicks, counting = tick roll. No long high whooshes, no micro-bursts.
import subprocess,numpy as np,wave,math
O='/tmp/claude-0/-home-user-costruzione/f8f5e66a-bca6-52b8-a8d5-01ec917fceb6/scratchpad/s2/';X='/tmp/claude-0/-home-user-costruzione/f8f5e66a-bca6-52b8-a8d5-01ec917fceb6/scratchpad/om/sfx48/'
DUR=38.8;SR=48000;N=int(DUR*SR)
def rd(f):
  w=wave.open(f);a=np.frombuffer(w.readframes(w.getnframes()),np.int16).astype(np.float32)/32768;return a.reshape(-1,w.getnchannels()),w.getframerate()
INFO={};cache={}
def src(n):
  if n not in INFO:
    a,sr=rd(X+n+'.wav');m=a.mean(1);env=np.convolve(np.abs(m),np.ones(240)/240,'same');INFO[n]=(env.argmax()/sr,len(m)/sr,float(np.abs(a).max())+1e-6);cache[n]=a
  return INFO[n]
def lowpass(seg,fc):
  F=np.fft.rfft(seg,axis=0);fr=np.fft.rfftfreq(len(seg),1/SR);F*=(1/(1+(fr/fc)**4))[:,None];return np.fft.irfft(F,n=len(seg),axis=0).astype(np.float32)
E=[]
def A(t,n,g,l=.5,pre=.05,lp=None,pan=0.0):E.append((t,n,g,l,pre,lp,pan))
AIR=lambda t,g=-17,i=1:A(t,f'whoosh_airy_{i}',g,.35,.3,900)
def LAND(t,g=-9,pan=0):A(t,'tick_wood_1',g-6,.08,pan=pan);A(t+.005,'thump_appear_1',g,.25,pan=pan)          # transient + body
def JUMP(t,i=1,pan=0):A(t,f'jump_soft_{i}',-15,.3,.05,2500,pan=pan)
def UNLOCK(t):                                                                                               # rattle, crack, body, tail
  for k in range(3):A(t-.22+k*.07,f'tick_metal_{k+1}',-17,.12,pan=-.4)
  A(t,'lock_latch_1',-5,.25,.02,pan=-.3);A(t+.01,'hit_drop_1',-9,.3,.02,1800);A(t+.02,'boom_heavy',-16,1.1,.02,700);A(t+.08,f'whoosh_airy_2',-19,.3,.2,900)
# HOOK
A(.02,'whoosh_low_1',-16,.8,.05,700);A(.05,'boom_heavy',-17,1.0,.02,500)
JUMP(-.0+.02,1);LAND(.38,-8)
A(.84,'dial_click_1',-14,.12);A(1.22,'dial_click_2',-14,.12)
A(1.85,'switch_panel_1',-8,.25,.03);A(1.86,'boom_heavy',-13,1.0,.02,600);A(1.88,'camera_shutter_1',-15,.2)
JUMP(2.62,2,.3);A(2.75,'whoosh_low_2',-15,.6,.4,700);LAND(3.05,-10,.3)
for i in range(3):A(3.42+i*.11,f'lock_latch_{i+2}',-11,.2,pan=(i-1)*.3);A(3.43+i*.11,'thump_soft_1',-14,.2)
A(3.6,'tap_tone_1',-15,.15)
# EAR: unlock 01
JUMP(4.57,1,-.3);UNLOCK(5.02);A(5.22,'success_rise',-17,.6)
JUMP(5.97,2);LAND(6.4,-11)
A(6.48,'tap_tone_2',-15,.15)
# MAKE: console, the real demo sounds
A(8.05,'whoosh_heavy_1',-15,.25,.3,900);A(8.12,'toggle_up',-12,.2);JUMP(8.02,1);LAND(8.45,-10)
for j in range(14):A(9.6+j*.07,f'keyboard_mechanical_{j%8+1}',-20,.08)
A(10.83,'camera_shutter_2',-5,.3,.02)
for j in range(11):A(11.13+j*.07,f'keyboard_mechanical_{j%8+1}',-20,.08)
for i,t in enumerate([11.9,12.15,12.4]):A(t,f'step_pebbles_{i+1}',-8,.3,pan=(1-i)*.3)
A(12.8,'success_fifth',-15,.6);A(12.82,'tap_tone_3',-14,.15)
# LIB: wall of 922
A(13.95,'rise_reverse',-16,.02,.5,2500);A(13.5,'whoosh_low_3',-14,.7,.1,700)
for k in range(16):A(13.55+k*.07,f'tick_glass_{k%6+1}',-22,.15,pan=(-1)**k*.5)
A(13.96,'count:.8:1500:2700',-5,0,0);A(14.78,'hit_drop_2',-10,.3)
A(15.32,'tap_tone_4',-15,.15);A(15.57,'jump_heavy_1',-16,.3,.2,1200);LAND(16.05,-8);A(16.2,'switch_panel_2',-7,.25,.03);A(16.35,'success_rise',-17,.5)
# OV: unlock 02, fly into the library
JUMP(17.07,2);LAND(17.5,-11);JUMP(17.62,1);UNLOCK(18.0);A(18.2,'success_rise',-17,.6)
A(18.75,'whoosh_heavy_2',-14,.3,.3,900)
for k in range(8):A(19.0+k*.06,f'tap_tone_{k%8+1}',-21,.1,pan=(-1)**k*.4)
for j in range(14):A(19.04+j*.07,f'keyboard_mechanical_{j%8+1}',-21,.08)
for k in range(6):A(21.72+k*.07+.12,f'tick_metal_{k%3+1}',-15,.2,pan=(-1)**k*.4)
# RS: unlock 03, the timeline
JUMP(23.12,2);UNLOCK(23.64);A(23.66,'sparkle_burst',-14,.5);A(23.9,'success_fifth',-13,.6)
for t in (23.95,24.2,24.45):LAND(t,-14)
A(24.62,'whoosh_heavy_3',-15,.25,.3,900);A(25.0,'toggle_up',-12,.2)
for i in range(4):A(25.39+i*.12+.15,f'lock_latch_{i%4+1}',-12,.15)
for t in (25.5,25.95,26.4,26.85):A(t,'thump_soft_2',-13,.2,.02,900)
A(26.3,'whoosh_low_1',-15,.5,.4,700);A(26.55,'stamp_press_1',-8,.3,.03);A(26.57,'tap_tone_5',-15,.15)
# TWIST: silence, then build
A(28.04,'impact_suck',-8,.5,.9,3000);A(28.1,'fall_sub',-14,.9,0,400)
LAND(28.85,-10)
for j in range(9):A(28.8+j*.065,f'keyboard_mechanical_{j%8+1}',-20,.08)
A(29.4,'error_double',-11,.3)
for i in range(3):A(29.9+i*.14,f'whoosh_airy_{i+3}',-17,.3,.25,1000,pan=(-1)**i*.5)
A(30.5,'hit_drop_1',-7,.3,.02,1800);A(30.52,'boom_heavy',-14,1.0,.02,700);A(30.55,'lock_latch_4',-12,.2)
for t in (31.4,32.4):A(t,'thump_soft_3',-14,.4,.02,350)
A(32.2,'tap_tone_6',-15,.15);A(32.25,'count:1.35:900:1800',-11,0,0);A(33.72,'success_fifth',-12,.6)
# CTA
A(34.28,'whoosh_heavy_1',-15,.25,.3,900);JUMP(34.22,1);LAND(34.6,-11);LAND(34.85,-13)
for i in range(5):A(34.75+i*.07,f'keyboard_mechanical_{i+1}',-10,.1)
A(35.33,'click_mouse',-9,.15);A(35.36,'send_lift',-12,.4);LAND(35.6,-13);A(35.6,'notify_pair',-14,.7)
for i in range(3):A(36.27+i*.12,f'tap_tone_{i+6}',-14,.15)
A(36.67,'tap_tone_8',-12,.15)
# ---------------- render ----------------
acc=np.zeros((N,2),np.float32)
def counting(dur,f0,f1):
  out=np.zeros((int(dur*SR)+SR//5,2),np.float32);rng=np.random.default_rng(3);t=0.0;i=0
  while t<dur:
    u=t/dur;rate=18+22*u;f=f0+(f1-f0)*u;n=int(.035*SR);tt=np.arange(n)/SR
    tick=np.sin(2*np.pi*f*tt)*np.exp(-tt*120)+.5*np.sin(2*np.pi*f*2.01*tt)*np.exp(-tt*160)
    nz=rng.standard_normal(n)*np.exp(-tt*600)*.6;x=(tick+nz)*(.55+.45*u);p=.5+.35*np.sin(i*1.7)
    j=int(t*SR);out[j:j+n,0]+=x*(1-p)*1.4;out[j:j+n,1]+=x*p*1.4;t+=1/rate;i+=1
  return out/np.abs(out).max()*.89
for (t,n,g,l,pre,lp,pan) in E:
  if n.startswith('count:'):
    _,d_,a_,b_=n.split(':');seg=counting(float(d_),float(a_),float(b_))*10**((g-12)/20);i0=int(t*SR)
  else:
    pk,d,mx=src(n);a=cache[n];cut=max(0.0,pk-pre);end=min(pk+l,d);seg=a[int(cut*SR):int(end*SR)].copy()
    if len(seg)<10:continue
    if lp:seg=lowpass(seg,lp)
    fi=min(len(seg),int((.006 if pre<.1 else .08)*SR));seg[:fi]*=np.linspace(0,1,fi)[:,None]
    fo=min(len(seg),int(.1*SR));seg[-fo:]*=np.linspace(1,0,fo)[:,None]
    m=float(np.abs(seg).max())+1e-6;seg*=10**(g/20)*.89/m;i0=int((t-(pk-cut))*SR)
  if pan:seg=seg*np.array([1-max(0,pan),1+min(0,pan)],np.float32)
  if i0<0:seg=seg[-i0:];i0=0
  i1=min(N,i0+len(seg));acc[i0:i1]+=seg[:i1-i0]
def wr(f,a):
  w=wave.open(f,'wb');w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((np.clip(a,-1,1)*32767).astype(np.int16).tobytes());w.close()
wr(O+'ev.wav',acc)
v,_=rd(O+'v.wav');v=np.vstack([v,np.zeros((max(0,N-len(v)),2),np.float32)])[:N];s=acc
hop=240;win=3600
def envf(x):m=(x**2).mean(1);c=np.convolve(m,np.ones(win)/win,'same')[::hop];return 10*np.log10(c+1e-12)
ve=envf(v);se=envf(s);need=np.where(ve>-55,np.minimum(0,(ve-10)-se),0.0);la=16
need=np.array([need[max(0,i-la):i+la+1].min() for i in range(len(need))]);sm=np.minimum(np.convolve(need,np.ones(6)/6,'same'),0)
gg=10**(np.repeat(sm,hop)[:N]/20);o=s*gg[:,None];wr(O+'sfx_safe.wav',o)
subprocess.run(['ffmpeg','-v','error','-y','-i',O+'v.wav','-i',O+'sfx_safe.wav','-filter_complex','[0:a]apad=whole_dur=38.8[v];[v][1:a]amix=inputs=2:normalize=0:duration=longest,loudnorm=I=-14:TP=-1.5:LRA=11,alimiter=limit=0.84:level=false','-t','38.8','-ar','48000','-ac','2',O+'mix.wav'],check=True)
vm=v.mean(1);om=o.mean(1);n=N
for thr,lab in [(-40,'normale'),(-50,'bordi parole')]:
  bad=tot=0;worst=-99
  for i in range(0,n-4800,4800):
    rv=20*np.log10(np.sqrt(np.mean(vm[i:i+4800]**2))+1e-7);rs=20*np.log10(np.sqrt(np.mean(om[i:i+4800]**2))+1e-7)
    if rv>thr:tot+=1;worst=max(worst,rs-rv);bad+=rs>rv-6
  print(f'controllo {lab}: {tot} tratti, troppo vicini {bad}, peggiore {worst:+.1f} dB')
print('eventi',len(E))
