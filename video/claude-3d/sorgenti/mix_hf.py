# OpenMontage sound design: every sound tied to a visible event, made with earshot (MIT, rendered in code).
# Rules: no music, effects >=6 dB under the voice, camera moves = LOW air only (low-passed), riser ends on the hit,
# flash = shutter, pieces locking = latch/clicks, counting = tick roll. No long high whooshes, no micro-bursts.
import subprocess,numpy as np,wave,math
O='/tmp/claude-0/-home-user-costruzione/f8f5e66a-bca6-52b8-a8d5-01ec917fceb6/scratchpad/hf/';X='/tmp/claude-0/-home-user-costruzione/f8f5e66a-bca6-52b8-a8d5-01ec917fceb6/scratchpad/om/sfx48/'
DUR=19.5;SR=48000;N=int(DUR*SR)
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
P=[('Mostra come funziona un motore a',' combustione.',0,1.0),('Visualizza il campo magnetico',' di un motore elettrico.',5.6,6.4),('Mostra come un buco nero',' deforma lo spazio.',10.6,11.4)]
for pre,suf,t0,t1 in P:
  last=-1
  for i,ch in enumerate(suf):
    t=t0+i/len(suf)*(t1-t0-.05)
    if t-last<.07:continue
    last=t;A(t,f'keyboard_laptop_{i%6+1}' if ch!=' ' else 'keyboard_mechanical_1',-22,.05,.01,pan=((i%5)-2)*.08)
for t in (1.0,6.4,11.4):A(t,'click_mouse',-17,.09,.01)
for t in (1.12,6.52,11.52):A(t,'tap_tone_3',-23,.18)
def IMPACT(t,pk,big=False):
  A(t-.26,'whoosh_low_1',-21,.05,.26,700)
  A(t,'hit_drop_1',pk,.12,.01,2500);A(t+.005,'boom_heavy',pk-4,.3 if not big else .55,.01,650)
  if big:A(t+.01,'bass_drum_orchestral',pk-3,.5,.01,500)
IMPACT(1.8,-8);IMPACT(7.0,-7);IMPACT(12.2,-6,True)
# engine
A(2.3,'switch_industrial',-14,.35,.05,3000);A(2.62,'lock_latch_1',-13,.12);A(3.2,'whoosh_low_2',-21,.25,.2,700)
A(4.0,'gas_stove_ignite',-10,.22,.25,6000);A(4.02,'hit_drop_2',-12,.12)
for k in range(3):A(4.12+k*.13,'thump_soft_1',-15,.1,.01,1200)
A(5.12,'lock_latch_2',-13,.12);A(5.25,'whoosh_heavy_1',-21,.25,.2,800);A(5.58,'success_fifth',-16,.18)
# electric motor
A(7.5,'switch_industrial',-15,.3,.05,3000);A(8.5,'switch_panel_1',-14,.2,.03)
for k in range(6):A(8.52+k*.08,f'tick_glass_{k%6+1}',-21,.1,pan=(-1)**k*.4)
A(9.0,'drill_electric',-19,1.2,.05,1800);A(9.5,'whoosh_low_3',-21,.3,.25,700);A(10.25,'whoosh_heavy_2',-21,.25,.2,800);A(10.58,'success_fifth',-16,.18)
# black hole: near silence 11.8-12.1, then the hit
A(12.5,'swell_gong',-22,1.5,.05,600);A(14.0,'fall_sub',-14,.9,0,400);A(14.98,'rise_reverse',-18,.02,.7,2000);A(15.0,'thump_appear_1',-12,.3)
A(16.25,'whoosh_heavy_3',-21,.25,.2,800);A(16.55,'tap_tone_4',-16,.15)
for i in range(2):A(17.25+i*.12,f'keyboard_laptop_{i+1}',-20,.05,.01)
A(17.75,'click_mouse',-17,.09,.01);A(17.8,'send_lift',-18,.3)
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
ve=envf(v);se=envf(s);need=np.zeros_like(se);la=16
need=np.array([need[max(0,i-la):i+la+1].min() for i in range(len(need))]);sm=np.minimum(np.convolve(need,np.ones(6)/6,'same'),0)
gg=10**(np.repeat(sm,hop)[:N]/20);o=s*gg[:,None];wr(O+'sfx_safe.wav',o)
subprocess.run(['ffmpeg','-v','error','-y','-i',O+'v.wav','-i',O+'sfx_safe.wav','-filter_complex','[0:a]apad=whole_dur=19.5[v];[v][1:a]amix=inputs=2:normalize=0:duration=longest,loudnorm=I=-16:TP=-1.0:LRA=11,alimiter=limit=0.84:level=false','-t','19.5','-ar','48000','-ac','2',O+'mix.wav'],check=True)
print('eventi',len(E))
