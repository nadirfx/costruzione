import subprocess,sys
S=sys.argv[1];out=sys.argv[2];DUR=34.4
# (time_s, file, gain_dB, trim_start, trim_len)  -- one sound per visible action, big hits only on key beats
EV=[(0.03,2,0),(1.12,3,-1),(3.80,6,-5),(3.76,7,-12),(5.66,5,-3),(6.75,6,-8),(6.95,6,-5),
(7.85,2,-1),(9.15,4,-4,0,1.5),(9.76,7,-12),(11.34,6,-5),(12.6,8,-3),(13.75,9,-6),
(14.62,1,-2,1.45,0.9),(14.71,7,1),(15.5,2,-3),(16.1,6,-5),(18.3,6,-4),
(19.3,9,-15),(19.44,9,-16),(19.6,9,-15),(19.75,9,-16),(19.9,9,-15),(20.15,9,-5),(20.69,6,-6),(21.14,6,-5),(21.69,6,-4),
(21.65,7,-12),(23.9,9,-4),(23.76,5,-7),(24.2,6,-6),(24.21,7,-12),(25.44,6,-5),(27.0,3,-2),(27.91,5,-4),
(28.9,10,-1),(30.22,2,0),(30.66,7,-12),(32.7,9,-16),(32.8,9,-15),(32.9,9,-16),(33.0,9,-15),(33.22,9,-3),(33.3,6,-4),(33.5,5,-6)]
args=['ffmpeg','-v','error','-y'];fc=[];lbl=[]
for i,e in enumerate(EV):
    t,f,g=e[0],e[1],e[2];args+=['-i',f'{S}/sfx{f:02d}.wav'];chain=f'[{i}:a]'
    flt=[]
    if len(e)>3:flt.append(f'atrim=start={e[3]}:duration={e[4]},asetpts=PTS-STARTPTS,afade=t=out:st={max(0,e[4]-.15):.2f}:d=0.15')
    flt.append(f'volume={g}dB');flt.append(f'adelay={int(t*1000)}|{int(t*1000)}')
    fc.append(chain+','.join(flt)+f'[s{i}]');lbl.append(f'[s{i}]')
fc.append(''.join(lbl)+f'amix=inputs={len(EV)}:normalize=0:duration=longest,apad,atrim=duration={DUR}[mix]')
args+=['-filter_complex',';'.join(fc),'-map','[mix]','-ar','48000','-ac','2',out]
subprocess.run(args,check=True);print('ok',len(EV),'effetti')
