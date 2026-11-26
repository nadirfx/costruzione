# OpenMontage sound design: every sound tied to a visible event, made with earshot (MIT, rendered in code).
# Rules: no music, effects >=6 dB under the voice, camera moves = LOW air only (low-passed), riser ends on the hit,
# flash = shutter, pieces locking = latch/clicks, counting = tick roll. No long high whooshes, no micro-bursts.
import subprocess,numpy as np,wave,math
O='/tmp/claude-0/-home-user-costruzione/f8f5e66a-bca6-52b8-a8d5-01ec917fceb6/scratchpad/snd/';X='/tmp/claude-0/-home-user-costruzione/f8f5e66a-bca6-52b8-a8d5-01ec917fceb6/scratchpad/om/sfx48/'
DUR=40.6;SR=48000;N=int(DUR*SR)
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
AIR=lambda t,g=-16,i=1:A(t,f'whoosh_airy_{i}',g,.35,.3,900)
FL=lambda t,i=1:A(t-.03,f'whoosh_heavy_{i}',-13,.25,.3,900)
# HOOK: equalizer ring, three orbs, ring explodes into cinema bars
A(.04,'boom_heavy',-11,.9,.02,700);A(.3,'whoosh_low_1',-15,.9,.3,700)
for i in range(3):A(1.0+i*.12,f'bubblewrap_pop_{i+1}',-13,.15,pan=(i-1)*.5)
A(3.44,'rise_reverse',-13,.02,1.0,2500);A(3.45,'hit_drop_1',-8,.4,.02,1500);A(3.46,'boom_heavy',-12,.8,.02,600);A(3.6,'thump_soft_1',-12,.2)
# PROBLEM
FL(4.22,1)
for i,t in enumerate([5.16,6.24,6.92]):A(t,f'tap_tone_{i+1}',-14,.15)
A(7.77,'stamp_press_1',-4,.4,.03);A(7.8,'error_double',-14,.3)
# EARSHOT title
FL(8.42,2);A(9.62,'whoosh_low_2',-12,.6,.45,800);A(10.3,'hit_drop_2',-10,.3);A(10.31,'thump_appear_1',-9,.3)
A(10.9,'tap_tone_4',-14,.15);A(11.13,'stamp_press_2',-6,.4,.03);A(11.92,'tap_tone_5',-13,.15)
# HOW: typing, footsteps, the real rendered sound
AIR(13.0,-16,2)
txt='earshot make "tre passi sulla ghiaia"'
for j in range(len(txt)):
  if txt[j]!=' ' and j%2==0:A(13.22+(15.6-13.22)*j/len(txt),f'keyboard_mechanical_{j%8+1}',-19,.08)
for i,t in enumerate([14.66,14.91,15.16]):A(t,f'step_pebbles_{i+1}',-10,.35,pan=(i-1)*.4)
A(16.22,'steps_real',-9,1.6,.02)
for i in range(3):A(16.37+i*.15,f'tick_wood_{i+1}',-18,.08)
# STATS: tiles flip, counter, offline
FL(16.95,3)
for k in range(14):A(17.2+k*.075,f'tick_glass_{k%6+1}',-21,.15,pan=(-1)**k*.5)
A(17.37,'count:.75:1500:2700',-4,0,0);A(18.0,'hit_drop_1',-9,.3)
A(19.23,'switch_panel_1',-8,.3,.03);A(19.5,'success_fifth',-17,.6)
# OPENVERSE
AIR(20.3,-16,3);A(20.8,'thump_appear_2',-10,.3)
for j in range(9):A(21.64+j*.065,f'keyboard_mechanical_{j%8+1}',-19,.08)
for i in range(3):A(22.22+i*.18,f'tap_tone_{i+6}',-14,.15)
for i in range(3):A(23.9+i*.12,f'tick_metal_{i+1}',-14,.3)
# REAL SFX: panel rises, ball bounces, scan, markers lock on the timeline
FL(24.5,1);A(24.6,'whoosh_low_3',-14,.5,.3,800);A(25.47,'hit_drop_2',-10,.3)
for i,t in enumerate([25.9,26.5,27.1,27.7,28.3,28.9,29.5,30.1]):A(t,f'ball_bounce_{i+1}',-12,.25,.02,pan=-.5+i/7)
A(27.03,'toggle_up',-12,.2)
for i in range(8):A(28.0+i*.09,f'tick_glass_{i%6+1}',-16,.15)
# TWIST
A(30.4,'whoosh_heavy_2',-17,.2,.3,800);A(31.05,'impact_suck',-9,.5,.9,3000)
for k in range(4):A(31.9+k*1.4,'thump_soft_2',-17,.3,.02,400)
A(35.95,'rise_reverse',-15,.02,1.1,2500);A(35.96,'success_fifth',-12,.6)
# CTA
FL(36.1,3)
for i in range(5):A(36.55+i*.07,f'keyboard_mechanical_{i+1}',-10,.1)
A(37.24,'click_mouse',-9,.15);A(37.28,'send_lift',-12,.4);A(37.52,'notify_pair',-14,.7)
for i,t in enumerate([37.88,38.0,38.12,38.28]):A(t,f'tap_tone_{i%8+1}',-14,.15)
for i in range(4):A(37.7+i*.3,f'bubblewrap_pop_{i+5}',-24,.1,pan=.6)
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
subprocess.run(['ffmpeg','-v','error','-y','-i',O+'v.wav','-i',O+'sfx_safe.wav','-filter_complex','[0:a]apad=whole_dur=40.6[v];[v][1:a]amix=inputs=2:normalize=0:duration=longest,loudnorm=I=-14:TP=-1.5:LRA=11,alimiter=limit=0.84:level=false','-t','40.6','-ar','48000','-ac','2',O+'mix.wav'],check=True)
vm=v.mean(1);om=o.mean(1);n=N
for thr,lab in [(-40,'normale'),(-50,'bordi parole')]:
  bad=tot=0;worst=-99
  for i in range(0,n-4800,4800):
    rv=20*np.log10(np.sqrt(np.mean(vm[i:i+4800]**2))+1e-7);rs=20*np.log10(np.sqrt(np.mean(om[i:i+4800]**2))+1e-7)
    if rv>thr:tot+=1;worst=max(worst,rs-rv);bad+=rs>rv-6
  print(f'controllo {lab}: {tot} tratti, troppo vicini {bad}, peggiore {worst:+.1f} dB')
print('eventi',len(E))
