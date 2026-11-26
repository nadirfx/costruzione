# OpenMontage sound design: every sound tied to a visible event, made with earshot (MIT, rendered in code).
# Rules: no music, effects >=6 dB under the voice, camera moves = LOW air only (low-passed), riser ends on the hit,
# flash = shutter, pieces locking = latch/clicks, counting = tick roll. No long high whooshes, no micro-bursts.
import subprocess,numpy as np,wave,math
O='/tmp/claude-0/-home-user-costruzione/f8f5e66a-bca6-52b8-a8d5-01ec917fceb6/scratchpad/v3/';X='/tmp/claude-0/-home-user-costruzione/f8f5e66a-bca6-52b8-a8d5-01ec917fceb6/scratchpad/om/sfx48/'
DUR=38.4;SR=48000;N=int(DUR*SR)
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
_RAW=[]
def A(t,n,g,l=.5,pre=.05,lp=None,pan=0.0):_RAW.append((t,n,g,l,pre,lp,pan))
AIR=lambda t,g=-15,i=1:A(t,f'whoosh_airy_{i}',g,.35,.3,900)
# ---------------- HOOK: cinema camera ----------------
A(.04,'boom_heavy',-11,.9,.02,700)                 # the lens lights up
A(.55,'whoosh_low_1',-13,.9,.55,800)               # camera pulls back (low air)
A(K:=1.74,'switch_panel_1',-8,.3,.03,pan=-.5);A(1.86,'switch_panel_2',-8,.3,.03,pan=.5)   # spotlights
A(1.75,'thump_soft_1',-12,.2)
for i in range(4):A(2.02+i*.11,f'camera_shutter_{i+1}',-14-i,.2,.03,pan=(-1)**i*.4)       # film ribbons = frames
A(3.10,'rise_reverse',-12,.02,1.2,2500)            # dive into the lens, riser ends on the cut
A(3.12,'hit_drop_1',-9,.4,.02,1500)
# ---------------- NAME: clapperboard ----------------
A(3.42,'whoosh_plank',-14,.25,.25,1200);A(3.58,'hit_wood',-12,.3)
A(4.03,'clapperboard_clap_1',-3,.5,.02)            # SLAM on "Montage"
A(4.04,'thump_appear_1',-10,.3)
A(5.14,'stamp_press_1',-5,.4,.03)                  # GRATIS stamp
AIR(5.72,-17,2)                                   # repo card rises
A(6.3,'bubblewrap_pop_1',-15,.15);A(6.45,'tap_tone_1',-15,.15)
AIR(6.82,-16,3)
# ---------------- HOW ----------------
AIR(7.08,-17,4);A(7.48,'land_soft',-9,.3)          # folder drops
for i in range(6):A(7.35+i*.13,f'tick_wood_{i+1}',-21,.08)   # download ticking
A(8.2,'success_rise',-17,.6)
A(8.56,'toggle_up',-10,.2);A(8.98,'tap_tone_2',-12,.2)
for i,t in enumerate([9.36,9.5,9.64,9.78,9.92]):A(t,f'keyboard_mechanical_{i%8+1}',-19,.1)
txt='Fammi un trailer epico per il mio brand'
for j in range(len(txt)):
  if txt[j]!=' ' and j%2==0:A(10.06+(10.98-10.06)*j/len(txt),f'keyboard_mechanical_{j%8+1}',-18,.08)
A(10.99,'click_mouse',-8,.2);A(11.05,'send_lift',-15,.4)
A(11.52,'jump_heavy_1',-11,.4,.3,1000)              # flash cut into the film strip
# ---------------- CHAIN: film strip ----------------
STEP=[12.06,13.12,14.32,15.74,17.24,18.7]
for i,t in enumerate(STEP[:5]):AIR(t-.12,-17,(i%6)+1)
A(12.1,'count:1.0:1400:2400',-4,0,0)               # 25 searches counting
for i in range(4):A(13.2+i*.16,f'typewriter_key_{i%4+1}',-15,.15)
for k in range(6):A(14.32-.05+k*.083*1.3,f'bubblewrap_pop_{k+2}',-15,.12)   # storyboard frames pop
for k in range(4):A(15.74-.05+k*.159*1.3,f'camera_shutter_{k+3 if k<3 else 6}',-10,.25,.03,pan=(-1)**k*.3)  # flash = shutter
A(17.26,'toggle_shutter_shut',-14,.2);A(17.3,'thump_soft_2',-14,.2)
A(18.62,'whoosh_low_2',-13,.7,.45,800)             # pull back
for i in range(3):A(18.78+i*.12,f'dial_click_{i+1}',-12,.15)
A(19.15,'lock_latch_1',-9,.3)                       # pieces lock into one film
A(19.6,'tap_tone_3',-14,.15)
# ---------------- PAUSE ----------------
A(20.82,'impact_suck',-8,.5,.9,3000)                # everything freezes: suck + hit on "assurda"
A(20.9,'fall_sub',-11,.9,0,500)
A(21.64,'whoosh_heavy_1',-13,.25,.3,900)
# ---------------- APPROVE ----------------
for i in range(3):A(21.76+i*.1,f'tap_tone_{i+4}',-13,.15)
A(22.27,'thump_soft_3',-14,.2)
for i in range(3):A(22.56+i*.08,f'lock_latch_{i+2}',-11,.2)
A(23.45,'thump_appear_2',-9,.3);AIR(23.4,-18,5)
A(23.95,'click_mouse',-6,.2);A(24.05,'success_fifth',-16,.6)
A(24.62,'whoosh_heavy_2',-16,.25,.25,800)
for k in range(10):A(24.9+k*.11,f'stopwatch_tick_{k%3+1}',-22,.08)   # receipt printing
for i,t in enumerate([25.1,25.38,26.02]):A(t,f'tick_metal_{i+1}',-14,.3)    # amounts appear
A(26.45,'stamp_press_2',-3,.4,.03);A(26.46,'hit_drop_2',-11,.3)   # APPROVATO
A(26.78,'jump_heavy_2',-12,.35,.3,1000)
# ---------------- STARS ----------------
A(26.95,'sparkle_burst',-15,.5)
A(27.55,'count:1.08:1500:2900',-3,0,0)              # counter to 83.000
A(28.64,'boom_heavy',-9,1.0,.02,900);A(28.65,'thump_appear_1',-8,.3)
A(29.2,'whoosh_rope',-17,.5,.3,1000)                # ring speeds up
A(29.84,'whoosh_heavy_1',-14,.25,.3,900)
# ---------------- CTA ----------------
AIR(29.95,-17,6)
for i in range(6):A(30.19+i*.065,f'keyboard_mechanical_{i+1}',-10,.1)
A(30.8,'click_mouse',-9,.15);A(30.85,'send_lift',-12,.4)
A(30.99,'notify_pair',-14,.7)
A(31.33,'tap_tone_7',-13,.15);A(31.69,'tap_tone_8',-13,.15)
for i in range(4):A(31.2+i*.3,f'bubblewrap_pop_{i+5}',-24,.1,pan=.6)

MAPS=[(0,3.12,[[0,0],[2.98,1.72],[3.48,2.0],[4.85,2.78],[5.22,3.12]]),
 (3.12,7.02,[[5.22,3.12],[5.74,3.58],[6.12,4.0],[6.55,5.12],[6.86,5.68],[7.52,6.26],[8.2,6.75],[8.5,7.05]]),
 (7.02,11.55,[[8.5,7.02],[8.52,7.1],[9.04,7.66],[9.82,8.52],[9.92,8.58],[10.36,8.96],[10.64,9.28],[11.36,10.0],[11.46,10.06],[12.75,10.98],[13.45,11.3],[13.8,11.58]]),
 (11.55,21.66,[[13.8,11.55],[14.36,12.06],[15.48,13.12],[16.38,14.32],[17.5,15.74],[19.0,17.24],[20.42,18.7],[22.26,20.38],[22.7,20.82],[23.5,21.62]]),
 (26.75,29.86,[[30.85,26.8],[30.88,26.84],[31.7,27.92],[32.24,28.38],[32.6,28.68],[33.12,29.2],[33.85,29.86]]),
 (29.86,40,[[33.85,29.86],[33.9,29.92],[34.24,30.22],[35.04,30.98],[35.38,31.32],[35.78,31.68],[36.16,32.06],[38.4,34.4]])]
def remap(t):
  for a,b,m in MAPS:
    if a<=t<b:
      for i in range(1,len(m)):
        if t<=m[i][1] or i==len(m)-1:
          (n0,o0),(n1,o1)=m[i-1],m[i];return n0+(t-o0)/(o1-o0)*(n1-n0)
  return None
E=[]
for ev in _RAW:
  if 21.66<=ev[0]<26.75:continue      # old approval act: gone
  nt=remap(ev[0])
  if nt is not None:E.append((nt,)+ev[1:])
def B(t,n,g,l=.5,pre=.05,lp=None,pan=0.0):E.append((t,n,g,l,pre,lp,pan))
# ---- shatter
for k in range(6):B(22.84+k*.06,f'tick_glass_{k+1}',-17,.25,pan=(-1)**k*.5)
# ---- tools sphere
B(23.47,'whoosh_heavy_3',-12,.3,.3,900);B(23.5,'hit_drop_1',-11,.3)
for k in range(12):B(23.56+k*.07,f'tick_glass_{k%6+1}',-21,.2,pan=(-1)**k*.45)
B(24.0,'count:.5:1500:2600',-4,0,0);B(24.52,'hit_drop_2',-9,.3);B(24.53,'thump_appear_1',-9,.3)
B(25.95,'rise_reverse',-13,.02,1.0,2500);B(25.96,'hit_drop_1',-10,.3,.02,1500)
# ---- genre carousel
for t,g in [(26.36,0),(27.72,1),(28.4,2),(29.96,3)]:B(t-.3,f'whoosh_airy_{g+2}',-17,.3,.25,900)
B(26.37,'timpani_hit',-8,1.0,.02,1800);B(27.73,'page_turn',-11,.5);B(27.75,'camera_shutter_2',-14,.2)
B(28.41,'cork_bottle',-9,.4);B(29.97,'jump_soft_1',-8,.4)
B(30.45,'whoosh_low_3',-14,.5,.4,800)
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
subprocess.run(['ffmpeg','-v','error','-y','-i',O+'v.wav','-i',O+'sfx_safe.wav','-filter_complex','[0:a]apad=whole_dur=38.4[v];[v][1:a]amix=inputs=2:normalize=0:duration=longest,loudnorm=I=-14:TP=-1.5:LRA=11,alimiter=limit=0.84:level=false','-t','38.4','-ar','48000','-ac','2',O+'mix.wav'],check=True)
vm=v.mean(1);om=o.mean(1);n=N
for thr,lab in [(-40,'normale'),(-50,'bordi parole')]:
  bad=tot=0;worst=-99
  for i in range(0,n-4800,4800):
    rv=20*np.log10(np.sqrt(np.mean(vm[i:i+4800]**2))+1e-7);rs=20*np.log10(np.sqrt(np.mean(om[i:i+4800]**2))+1e-7)
    if rv>thr:tot+=1;worst=max(worst,rs-rv);bad+=rs>rv-6
  print(f'controllo {lab}: {tot} tratti, troppo vicini {bad}, peggiore {worst:+.1f} dB')
print('eventi',len(E))
