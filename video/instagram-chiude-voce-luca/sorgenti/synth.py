import numpy as np,wave
from scipy.signal import butter,sosfilt
SR=48000;OUT='/tmp/claude-0/-home-user-costruzione/f8f5e66a-bca6-52b8-a8d5-01ec917fceb6/scratchpad/synth/'
rng=np.random.default_rng(7)
def save(n,x):
    x=np.asarray(x,np.float32)
    if x.ndim==1:x=np.stack([x,x],1)
    x=x/max(1e-6,np.abs(x).max())*.89
    w=wave.open(OUT+n+'.wav','wb');w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((x*32767).astype(np.int16).tobytes());w.close()
def lp(x,f,o=2):return sosfilt(butter(o,f,'low',fs=SR,output='sos'),x)
def hp(x,f,o=2):return sosfilt(butter(o,f,'high',fs=SR,output='sos'),x)
def bp(x,a,b,o=2):return sosfilt(butter(o,[a,b],'band',fs=SR,output='sos'),x)
def sweep_filter(x,fc,kind='low',blk=512):
    y=np.zeros_like(x);zi=None
    for i in range(0,len(x),blk):
        f=float(np.clip(fc[min(i,len(fc)-1)],30,SR/2-100));sos=butter(2,f,kind,fs=SR,output='sos')
        from scipy.signal import sosfilt_zi
        if zi is None:zi=np.zeros((sos.shape[0],2))
        y[i:i+blk],zi=sosfilt(sos,x[i:i+blk],zi=zi)
    return y
t=lambda d:np.arange(int(d*SR))/SR
# 1) braam: dark brass-like stack, filter opens then closes, saturated
d=2.6;tt=t(d);f=43.65
saw=lambda fr,ph=0:2*((tt*fr+ph)%1)-1
x=sum(saw(f*k*(1+dt),rng.random())/k**.6 for k,dt in [(1,0),(1,.004),(2,-.003),(3,.002),(4,0)])
fc=200+2200*np.exp(-tt*2.2)*(1-np.exp(-tt*25))+120
x=sweep_filter(x,fc);x=np.tanh(x*2.2)
env=(1-np.exp(-tt*30))*np.exp(-tt*1.15);x*=env
sub=np.sin(2*np.pi*np.cumsum(55*np.exp(-tt*1.2)+27)/SR)*np.exp(-tt*1.6)
nz=hp(rng.standard_normal(len(tt)),1500)*np.exp(-tt*28)*.5
L=x+.9*sub+nz;R=np.roll(x,int(.011*SR))+.9*sub+nz;save('braam',np.stack([L,R],1))
# 2) sub drop with tight transient
d=1.4;tt=t(d);fr=26+60*np.exp(-tt*4.5);x=np.sin(2*np.pi*np.cumsum(fr)/SR)*np.exp(-tt*2.4)*(1-np.exp(-tt*200))
x+=lp(rng.standard_normal(len(tt)),900)*np.exp(-tt*40)*.6;save('subdrop',x)
# 3) short clean whoosh (no low rumble), stereo pan
d=.55;tt=t(d);n=rng.standard_normal(len(tt));u=tt/d
fc=500+4200*np.sin(np.pi*u)**2;x=sweep_filter(n,fc,'low');x=hp(x,350)
env=np.sin(np.pi*np.clip(u,0,1))**2.2;x*=env;pan=u
save('whoosh',np.stack([x*np.cos(pan*np.pi/2)*1.2,x*np.sin(pan*np.pi/2)*1.2],1))
# 4) reverse swell (reversed cymbal feel) that ends exactly at the end of the file
d=1.6;tt=t(d);u=tt/d;n=hp(rng.standard_normal(len(tt)),2500);n+=.4*bp(rng.standard_normal(len(tt)),600,2500)
x=n*(u**3.2);x[-int(.006*SR):]*=np.linspace(1,0,int(.006*SR));save('revswell',x)
# 5) tension bed: sub rumble + filtered low noise, slow pulse, no notes
d=16.0;tt=t(d);base=lp(rng.standard_normal(len(tt)),110,4)*3+.55*np.sin(2*np.pi*38*tt)+.35*np.sin(2*np.pi*38.6*tt)
air=hp(lp(rng.standard_normal(len(tt)),2400),900)*.05
puls=1+.18*np.sin(2*np.pi*.5*tt)
x=(base+air)*puls;save('tension',x)
# 6) final impact: braam-lite + sub
d=2.2;tt=t(d);x=sum(saw(55*k*(1+dt),rng.random())/k for k,dt in [(1,0),(1,.005),(2,0)]) if False else 0
print('ok')
