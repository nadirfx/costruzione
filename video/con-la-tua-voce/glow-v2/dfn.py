import sys,types
import torchaudio
m=types.ModuleType('torchaudio.backend');c=types.ModuleType('torchaudio.backend.common')
class AudioMetaData: pass
c.AudioMetaData=AudioMetaData;m.common=c;sys.modules['torchaudio.backend']=m;sys.modules['torchaudio.backend.common']=c
import numpy as np,wave,torch
from df.enhance import enhance, init_df
model,state,_=init_df()
w=wave.open(sys.argv[1]);sr=w.getframerate();a=np.frombuffer(w.readframes(w.getnframes()),np.int16).astype(np.float32)/32768
assert sr==state.sr(),(sr,state.sr())
x=torch.from_numpy(a)[None]
y=enhance(model,state,x,atten_lim_db=float(sys.argv[3]))
y=y[0].numpy();y=np.clip(y,-1,1)
o=wave.open(sys.argv[2],'wb');o.setnchannels(1);o.setsampwidth(2);o.setframerate(sr);o.writeframes((y*32767).astype(np.int16).tobytes());o.close();print('ok',sr)
