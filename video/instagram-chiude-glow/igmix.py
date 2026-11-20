import subprocess,sys
D=sys.argv[1];out=sys.argv[2];DUR=0
PK={'mk546':.14,'mk1143':.62,'mk2295':.22,'mk2290':1.12,'mk168':.32,'mk1478':.18,'mk1484':.58,'mk3161':1.2,'mk1021':.24,'mk2951':0,'mk1022':.12,'mk2568':0,'mk1119':.14,'mk2356':.04,'mk1113':.12,'mk2575':.12,'mk2867':.24,'mk3124':0,'mk871':.26,'mk2342':.68,'mk2779':1.06,'mk2320':.96,'mk2152':.02,'s04':0,'s08':0,'s01':.06,'s02':.04,'s03':.26,'s05':.24,'s06':.16,'s07':.74,'s09':.04,'s10':.06}
# (event_time, sound, gain_dB[, trim_start, trim_len])  -> the sound's own peak is aligned to event_time
import re
K={k:float(v) for k,v in re.findall(r'(\w+):([\d.]+)',re.search(r'const K=\{(.*?)\};',open(sys.argv[3]).read(),re.S).group(1))}
DUR=K['end'];PK['rw']=0
k=K;E=[(0.0,'mk2910',-14,0,1.2),(0.05,'mk871',-9),(.2,'s06',-14),(k['a1'],'mk3124',-13),(k['a1']+.4,'mk3124',-14),
 (k['a2'],'s02',1),(k['a2'],'s03',-1),(k['a2'],'s08',-6),(k['a2']+.02,'mk2342',-8),(k['a3'],'s06',-7),
 (k['b1'],'mk168',-8),(k['b1']+.1,'mk3124',-13),(k['b2'],'s03',-1),(k['b2'],'s02',-3),
 (k['c1'],'mk1478',-8),(k['c1'],'s06',-9),(k['c2'],'s06',-9),(k['c3'],'s06',-9),(k['c4t'],'mk3124',-13),(k['c4'],'s08',-2),(k['c4'],'s02',-1),(k['c4']+.05,'mk2342',-7),
 (k['d1'],'s07',-9),*[(k['d1']+.5+i*.11,'mk2568',-17) for i in range(12)],(k['d2'],'s05',-2),(k['d2'],'s02',-3),
 (k['e1'],'mk168',-8),(k['e3'],'s03',-2),(k['e3'],'s02',-3),*[(k['e1']+i*.07,'s06',-15) for i in range(0,10,3)],(k['wo']-1.0,'s01',-3,1.25,.85),(k['f1']-.05,'mk2320',-6),
 (k['f1']+.2,'mk871',-8),(k['f1']+1.4,'s10',-5),(k['f2']+.4,'s06',-6),(k['h3'],'s06',-9),
 (k['g1'],'mk1478',-8),(k['g1']+.3,'s06',-10),(k['g2'],'s06',-10),(k['h0'],'mk1478',-10),(k['h0']+1.3,'s03',-5),(k['h0']+1.45,'s06',-8),(k['h2']-.58,'s01',-2,1.45,.6),(k['h2'],'s07',1),(k['h2'],'s02',-2),
 (k['j1'],'mk168',-8),*[(k['j1']+d,'mk3124',-12) for d in (.15,.55,.95)],(k['j1a'],'s09',-3),*[(k[q],'s06',-7) for q in ('j2','j3','j4')],
 (k['k1'],'s07',-9),*[(k['k2']+i*.35,'s06',-8) for i in range(3)],
 (k['m1'],'mk1478',-8),(k['m1']+1.1,'s02',-3),(k['m1']+1.1,'mk871',-7),(k['m2c'],'mk3124',-10),(k['m2c']+.55,'s09',-3),(k['m2c']+.62,'s06',-5),(k['m3'],'s05',-6)]
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
