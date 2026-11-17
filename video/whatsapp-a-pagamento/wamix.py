import subprocess,sys
D=sys.argv[1];out=sys.argv[2];DUR=0
PK={'mk546':.14,'mk1143':.62,'mk2295':.22,'mk2290':1.12,'mk168':.32,'mk1478':.18,'mk1484':.58,'mk3161':1.2,'mk1021':.24,'mk2951':0,'mk1022':.12,'mk2568':0,'mk1119':.14,'mk2356':.04,'mk1113':.12,'mk2575':.12,'mk2867':.24,'mk3124':0,'mk871':.26,'mk2342':.68,'mk2779':1.06,'mk2320':.96,'mk2152':.02,'s04':0,'s08':0,'s01':.06,'s02':.04,'s03':.26,'s05':.24,'s06':.16,'s07':.74,'s09':.04,'s10':.06}
# (event_time, sound, gain_dB[, trim_start, trim_len])  -> the sound's own peak is aligned to event_time
import re
K={k:float(v) for k,v in re.findall(r'(\w+):([\d.]+)',re.search(r'const K=\{(.*?)\};',open(sys.argv[3]).read(),re.S).group(1))}
DUR=K['end'];PK['rw']=0
k=K;E=[(0.05,'mk871',-8),(0.0,'s02',-3),(k['h1b'],'mk3124',-13),(k['h1b']+.5,'mk3124',-14),
 (k['h2'],'s03',-1),(k['h2'],'s02',-3),(k['h2']+.3,'s06',-8),
 *[(k[q],'s06',-7) for q in ('h3','h3b','h3c')],*[(k[q]+.25,'mk2568',-15) for q in ('h3','h3b','h3c')],(k['h3d'],'s05',-3),
 (k['h4'],'mk168',-8),(k['h4']+.1,'mk3124',-13),(k['h5'],'s08',-6),*[(k['h5']+.35+i*.24,'mk2568',-16) for i in range(5)],
 (k['h5b'],'s02',-4),(k['h5b'],'s04',-6,0,1.4),
 (k['t1'],'mk1478',-8),(k['t1']+.05,'s06',-10),(k['t1b'],'s06',-10),(k['t1c'],'s03',-2),(k['t1c']+.55,'s05',-5),
 (k['t2'],'s07',-9),(k['t2']+.3,'mk1021',-7),(k['rw']-1.3,'mk2910',-8,3.5,1.3),
 (k['rw'],'rw',-2,0,.75),(k['r1'],'mk871',-6),(k['r1']+.05,'s10',-6),(k['r2']+.45,'s06',-6),
 (k['c1'],'mk1478',-8),(k['c1']+.3,'s06',-10),(k['c2b']-.58,'s01',-2,1.45,.6),(k['c2b'],'s07',1),(k['c2b'],'s02',-2),
 (k['c3'],'mk168',-8),*[(k[q],'s03',-6) for q in ('c3','c3b','c3c')],*[(k[q]+.5,'s06',-9) for q in ('c3','c3b','c3c')],
 (k['c4'],'s07',-9),*[(k['c4']+d,'mk3124',-12) for d in (.15,.55,.95)],(k['c4a'],'s09',-3),*[(k[q],'s06',-7) for q in ('c4b','c4c','c4d')],
 (k['e1'],'mk1478',-8),(k['e1b'],'s04',-7,0,1.6),(k['e1c'],'s05',-3),(k['e1c']+.05,'s10',-6),
 (k['e2'],'mk168',-8),(k['e2']+1.1,'s02',-3),(k['e2']+1.1,'mk871',-7),(k['e3']+.2,'mk3124',-10),(k['e3']+.75,'s09',-3),(k['e3']+.82,'s06',-5),(k['e3b'],'s05',-6)]
E=[(t+.033,*r) for (t,*r) in E]
args=['ffmpeg','-v','error','-y'];fc=[];lb=[]
for i,e in enumerate(E):
    t,n,g=e[0],e[1],e[2];args+=['-i',f'{D}/{n}.wav'];f=[]
    if len(e)>3:
        f.append(f'atrim=start={e[3]}:duration={e[4]},asetpts=PTS-STARTPTS,afade=t=out:st={max(0,e[4]-.12):.2f}:d=0.12');start=t
    else: start=max(0,t-PK.get(n,0))
    f+= [f'volume={g}dB',f'adelay={int(start*1000)}|{int(start*1000)}']
    fc.append(f'[{i}:a]'+','.join(f)+f'[a{i}]');lb.append(f'[a{i}]')
fc.append(''.join(lb)+f'amix=inputs={len(E)}:normalize=0:duration=longest,apad,atrim=duration={DUR},bass=g=3:f=90:w=0.7,alimiter=limit=0.95[m]')
args+=['-filter_complex',';'.join(fc),'-map','[m]','-ar','48000','-ac','2',out];subprocess.run(args,check=True);print('ok',len(E),'effetti')
