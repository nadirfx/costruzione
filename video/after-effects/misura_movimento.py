import subprocess,sys,numpy as np
def energy(path):
    w,h=90,160
    raw=subprocess.run(['ffmpeg','-v','error','-i',path,'-vf',f'fps=15,scale={w}:{h},format=gray','-f','rawvideo','-'],capture_output=True).stdout
    f=np.frombuffer(raw,np.uint8).reshape(-1,h,w).astype(np.float32)
    d=np.abs(np.diff(f,axis=0)).mean(axis=(1,2))  # mean pixel change per frame
    sec=[d[i*15:(i+1)*15].mean() for i in range(len(d)//15)]
    return np.array(sec)
for name,p in [('Nostro v2',sys.argv[1]),('Tuo riferimento',sys.argv[2]),('WhatsApp originale',sys.argv[3])]:
    e=energy(p);still=(e<1.0).sum()
    print(f"{name:20s} media {e.mean():5.2f} | secondi quasi fermi (<1.0): {still}/{len(e)} | per secondo: "+' '.join(f'{v:.1f}' for v in e))
