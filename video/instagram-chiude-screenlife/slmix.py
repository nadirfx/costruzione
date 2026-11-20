import subprocess,sys
D=sys.argv[1];out=sys.argv[2];DUR=0
PK={'mk546':.14,'mk1143':.62,'mk2295':.22,'mk2290':1.12,'mk168':.32,'mk1478':.18,'mk1484':.58,'mk3161':1.2,'mk1021':.24,'mk2951':0,'mk1022':.12,'mk2568':0,'mk1119':.14,'mk2356':.04,'mk1113':.12,'mk2575':.12,'mk2867':.24,'mk3124':0,'mk871':.26,'mk2342':.68,'mk2779':1.06,'mk2320':.96,'mk2152':.02,'s04':0,'s08':0,'s01':.06,'s02':.04,'s03':.26,'s05':.24,'s06':.16,'s07':.74,'s09':.04,'s10':.06}
# (event_time, sound, gain_dB[, trim_start, trim_len])  -> the sound's own peak is aligned to event_time
import re
K={k:float(v) for k,v in re.findall(r'(\w+):([\d.]+)',re.search(r'const K=\{(.*?)\};',open(sys.argv[3]).read(),re.S).group(1))}
DUR=K['end'];PK['rw']=0
k=K;E=[(0.0,'s06',-6),(0.15,'mk2356',-12),(.25,'mk1478',-14),(k['a1'],'mk2910',-12,3.9,.5),(k['a2'],'s02',1),(k['a2'],'s03',-1),(k['a2']+.02,'mk2342',-8),
 (k['b1'],'mk168',-8),(k['b2'],'s06',-4),(k['b2'],'s03',-3),
 (k['c1'],'mk1478',-9),*[(k['c1']+i*.12,'mk2568',-17) for i in range(6)],(k['c2'],'s06',-11),(k['c3']-.1,'mk168',-10),*[(k['c3']+.1+i*.1,'mk2568',-17) for i in range(6)],(k['c4t'],'mk2356',-10),(k['c4'],'s08',-2),(k['c4'],'s02',-2),
 (k['d1'],'mk1478',-9),*[(k['d1']+.3+i*.09,'mk2568',-17) for i in range(12)],(k['d2'],'s05',-2),(k['d2'],'s02',-4),
 (k['e1'],'mk168',-9),(k['e2'],'s01',-5,.6,1.3),(k['e3'],'s03',-2),(k['e3']+.05,'s09',-6),(k['e3']+.5,'s09',-4),(k['e3']+.65,'s08',-6),(k['e3']+1.0,'mk2342',-10),
 (k['rw0'],'rw',-2,0,.75),(k['rw1'],'mk871',-7),(k['f2'],'s06',-5),(k['f2']+.15,'s10',-6),
 (k['g1'],'mk1478',-9),(k['g2'],'mk2320',-9),*[(k['g2']+.25+i*.22,'s06',-11) for i in range(3)],(k['h0']+1.0,'s06',-8),(k['h0']+1.3,'s03',-6),
 (k['h1'],'mk168',-8),(k['h1']+.15,'s06',-10),(k['h2'],'s06',-7),(k['h2'],'mk871',-8),(k['h3'],'s06',-8),*[(k['j1']+.1+d,'mk3124',-12) for d in (0,.3,.6)],(k['j1a'],'s09',-3),*[(k[q],'s06',-8) for q in ('j2','j3','j4')],
 (k['k1'],'mk1478',-9),*[(k['k1']+.25+i*.2,'s06',-15) for i in range(10)],
 (k['m1'],'mk168',-9),(k['m2'],'s09',-4),(k['m2c'],'mk3124',-10),(k['m2c']+.55,'s09',-3),(k['m2c']+.6,'s06',-6),(k['m3'],'s06',-4),(k['m3']+.05,'s10',-6)]
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
