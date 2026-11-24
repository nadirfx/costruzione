import numpy as np,wave,subprocess
from scipy.signal import butter,sosfilt
S='/tmp/claude-0/-home-user-costruzione/f8f5e66a-bca6-52b8-a8d5-01ec917fceb6/scratchpad/';SR=48000;DUR=17.6
rng=np.random.default_rng(3)
def rd(f):
    w=wave.open(f);a=np.frombuffer(w.readframes(w.getnframes()),np.int16).astype(np.float32)/32768;a=a.reshape(-1,w.getnchannels())
    if w.getframerate()!=SR:
        subprocess.run(['ffmpeg','-v','error','-y','-i',f,'-ar',str(SR),'-ac','2',S+'tmp_rs.wav'],check=True);return rd(S+'tmp_rs.wav')
    return a if a.shape[1]==2 else np.repeat(a,2,1)
bp=lambda x,a,b:sosfilt(butter(2,[a,b],'band',fs=SR,output='sos'),x)
hp=lambda x,f:sosfilt(butter(2,f,'high',fs=SR,output='sos'),x)
t=lambda d:np.arange(int(d*SR))/SR
# sizzle: crackling hot grill
d=1.6;tt=t(d);n=hp(rng.standard_normal(len(tt)),3000)*.25;cr=np.zeros(len(tt))
for i in rng.integers(0,len(tt)-400,220):cr[i:i+300]+=rng.standard_normal(300)*np.exp(-np.arange(300)/40)*rng.uniform(.3,1)
siz=(n+hp(cr,1500))*np.minimum(1,tt/.08)*np.exp(-np.maximum(0,tt-.6)*2.2)
# crunch: a few bright bursts
d=.45;tt=t(d);cru=np.zeros(len(tt))
for k,o in enumerate([0,.05,.11,.16,.24]):
    i=int(o*SR);L=int(.07*SR);b=bp(rng.standard_normal(L),1200,7000)*np.exp(-np.arange(L)/(SR*.012))*(1-k*.12);cru[i:i+L]+=b
lib={'siz':np.stack([siz,siz],1),'cru':np.stack([cru,np.roll(cru,60)],1)}
for n_ in ['s01','s02','s03','s04','s06','s08','s09','s10']:lib[n_]=rd(S+f'mkw/{n_}.wav')
for n_ in ['braam','subdrop','whoosh','revswell']:lib[n_]=rd(S+f'synth/{n_}.wav')
PK={'s01':.09,'s02':.01,'s03':.28,'s04':1.71,'s06':.12,'s08':1.97,'s09':.05,'s10':.01,'braam':.03,'subdrop':.01,'whoosh':.3,'revswell':1.6,'siz':.05,'cru':0}
SB=dict(b=1.4,c=3.8,d=5.0,e=7.4,f=9.6,g=12.2,h=13.4,i=15.6)
E=[(.25,'s06',-14),(.3,'siz',-10)]
E+=[(SB[k]+.12,'whoosh',-9) for k in 'bcdefghi']
E+=[(2.45,'subdrop',-9),(2.45,'s06',-8),(2.4,'s10',-15)]
E+=[(3.95,'cru',-6),(4.2,'cru',-10),(5.55,'s06',-10),(5.9,'s10',-16),(6.3,'cru',-14)]
# exploded burger: top bun flies up, fillings follow, hover, snap closed
E+=[(7.55,'whoosh',-11),(7.6,'s06',-9),(7.85,'s06',-11),(7.88,'s09',-12),(8.2,'s10',-16),(9.45,'s03',-6),(9.45,'subdrop',-8),(9.47,'s09',-8)]
E+=[(9.6+1.1,'revswell',-9),(10.7,'subdrop',-10),(10.8,'s03',-9)]
E+=[(12.3,'s09',-12),(12.48,'s09',-12),(12.66,'s09',-12),(12.82,'s06',-9)]
E+=[(13.42,'braam',-6),(13.9,'subdrop',-7),(13.95,'s06',-8),(14.1,'s06',-10),(14.5,'s01',-9),(14.1,'s10',-16)]
E+=[(15.7,'s10',-12),(16.05,'s09',-10),(16.6,'subdrop',-8),(16.62,'s06',-8),(16.7,'s10',-14),(0.06,'s06',-12)]
out=np.zeros((int(DUR*SR),2),np.float32)
for tm,n_,g in E:
    x=lib[n_]*10**(g/20);st=int(max(0,tm-PK[n_])*SR);e=min(len(out),st+len(x));out[st:e]+=x[:e-st]
out*=.9/max(1e-6,np.abs(out).max())
w=wave.open(S+'mc_sfx_raw.wav','wb');w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((out*32767).astype(np.int16).tobytes());w.close()
subprocess.run(['ffmpeg','-v','error','-y','-i',S+'mc_sfx_raw.wav','-af','loudnorm=I=-16:TP=-1.5:LRA=11','-ar','48000',S+'mc_sfx.wav'],check=True);print('eventi',len(E))
