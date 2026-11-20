import subprocess,sys,numpy as np,wave
S='/tmp/claude-0/-home-user-costruzione/f8f5e66a-bca6-52b8-a8d5-01ec917fceb6/scratchpad/'
D=S+'mkw';concept=sys.argv[1];out=sys.argv[2];DUR=9.6
PK={'mk546':.14,'mk1143':.62,'mk168':.32,'mk1478':.18,'mk3161':1.2,'mk1021':.24,'mk2951':0,'mk1022':.12,'mk2568':0,'mk2356':.04,'mk3124':0,'mk871':.26,'mk2342':.68,'mk2320':.96,'mk2910':4.72,'s04':0,'s08':0,'s01':.06,'s02':.04,'s03':.26,'s05':.24,'s06':.16,'s07':.74,'s09':.04,'s10':.06,'rw':0}
K=dict(a1=2.54,a2=3.02,a3=3.34,b1=4.31,b2=5.6,c1=6.38,c2=6.85,c3=7.39,c4t=7.97,c4=8.63,d1=9.32)
k=K
common=[(k['c1'],'s06',-8),(k['c2'],'s06',-8),(k['c3'],'s06',-8),(k['c4t'],'mk2356',-10),(k['c4'],'s08',-2),(k['c4'],'s02',-2)]
EV={
 'c1':[(0.0,'mk871',-10),(k['a1'],'mk1478',-8),(k['a2'],'s09',-2),(k['a2']+.04,'s09',-5),(k['a2']+.1,'s02',-2),(k['a3'],'mk168',-8),(k['b1'],'mk1478',-8),(k['b2'],'mk168',-9),(k['b2']+.1,'s03',-3)]+common,
 'c2':[(0.0,'mk2320',-12),*[(k['a1']+i*.03,'mk2568',-16) for i in range(10)],*[(k['a2']+i*.025,'mk2568',-13) for i in range(16)],(k['a2']+.05,'s02',-2),(k['a3'],'mk168',-9),(k['b1'],'mk1478',-8),(k['b2'],'s08',-4),*[(k['b2']+i*.06,'mk2568',-15) for i in range(8)]]+common,
 'c3':[(0.0,'s09',-10),(.07,'s09',-12),(k['a1'],'mk1478',-10),*[(k['a2']+d,'s09',-3) for d in (0,.05,.1,.17,.25,.31)],(k['a2']+.05,'s08',-6),(k['a2']+.36,'s06',-4),*[(k['a3']+.15+i*.13,'s09',-9) for i in range(7)],(k['b1'],'mk168',-8),*[(k['b2']+d,'s09',-4) for d in (0,.06,.12,.2)],(k['b2']+.05,'s08',-6)]+[(k['c1'],'s09',-6),(k['c2'],'s09',-6),(k['c3'],'s09',-6),*[(k['c4t']+.05+d,'s09',-6) for d in (0,.08,.16,.3)],(k['c4'],'s08',-2),(k['c4'],'s02',-2)],
}
E=[(t+.033,*r) for (t,*r) in EV[concept]]
args=['ffmpeg','-v','error','-y'];fc=[];lb=[]
for i,(t,n,g) in enumerate(E):
  args+=['-i',f'{D}/{n}.wav'];st=max(0,t-PK.get(n,0));fc.append(f'[{i}:a]aresample=48000,aformat=channel_layouts=stereo,volume={g}dB,adelay={int(st*1000)}|{int(st*1000)}[a{i}]');lb.append(f'[a{i}]')
fc.append(''.join(lb)+f'amix=inputs={len(E)}:normalize=0:duration=longest,apad,atrim=duration={DUR},bass=g=3:f=90:w=0.7,volume=-4dB[m]')
args+=['-filter_complex',';'.join(fc),'-map','[m]','-ar','48000','-ac','2',S+'myvoice/pv_sfx.wav'];subprocess.run(args,check=True)
subprocess.run(['ffmpeg','-v','error','-y','-i',S+'igv/voice_edit.wav','-af',f'aformat=channel_layouts=stereo,aresample=48000,apad,atrim=duration={DUR}',S+'myvoice/pv_v.wav'],check=True)
def rd(f):
  w=wave.open(f);a=np.frombuffer(w.readframes(w.getnframes()),np.int16).astype(np.float32)/32768;return a.reshape(-1,w.getnchannels()),w.getframerate()
v,sr=rd(S+'myvoice/pv_v.wav');s,_=rd(S+'myvoice/pv_sfx.wav');n=min(len(v),len(s));v=v[:n];s=s[:n]
hop=240;win=960
def env(x):m=(x**2).mean(1);c=np.convolve(m,np.ones(win)/win,'same')[::hop];return 10*np.log10(c+1e-12)
ve=env(v);se=env(s);need=np.where(ve>-40,np.minimum(0,(ve-8)-se),0.0);la=8
need=np.array([need[max(0,i-la):i+la+1].min() for i in range(len(need))]);sm=np.minimum(np.convolve(need,np.ones(4)/4,'same'),0)
g=10**(np.repeat(sm,hop)[:n]/20);o=s*g[:,None]
w=wave.open(S+'myvoice/pv_sfx_safe.wav','wb');w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes((np.clip(o,-1,1)*32767).astype(np.int16).tobytes());w.close()
vm=v.mean(1);om=o.mean(1);bad=tot=0
for i in range(0,n-4800,4800):
  rv=20*np.log10(np.sqrt(np.mean(vm[i:i+4800]**2))+1e-7);rs=20*np.log10(np.sqrt(np.mean(om[i:i+4800]**2))+1e-7)
  if rv>-40:
    tot+=1;bad+=rs>rv-6
subprocess.run(['ffmpeg','-v','error','-y','-i',S+'myvoice/pv_v.wav','-i',S+'myvoice/pv_sfx_safe.wav','-filter_complex','[0:a][1:a]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11,volume=1.6dB,alimiter=limit=0.84:level=false','-ar','48000','-ac','2',out],check=True)
print(f'{concept}: tratti con voce {tot}, effetti troppo vicini alla voce {bad}')
