import subprocess,sys
D=sys.argv[1];out=sys.argv[2];DUR=35.9
PK={'mk546':.14,'mk1143':.62,'mk2295':.22,'mk2290':1.12,'mk168':.32,'mk1478':.18,'mk1484':.58,'mk3161':1.2,'mk1021':.24,'mk2951':0,'mk1022':.12,'mk2568':0,'mk1119':.14,'mk2356':.04,'mk1113':.12,'mk2575':.12,'mk2867':.24,'mk3124':0,'mk871':.26,'mk2342':.68,'mk2779':1.06,'mk2320':.96,'mk2152':.02,'s04':0,'s08':0,'s01':.06,'s02':.04,'s03':.26,'s05':.24,'s06':.16,'s07':.74,'s09':.04,'s10':.06}
# (event_time, sound, gain_dB[, trim_start, trim_len])  -> the sound's own peak is aligned to event_time
E=[(t+.033,*r) for (t,*r) in [(0,'s02',-1),(4.9,'mk168',-8),(7.8,'mk1478',-8),(10.4,'s07',-9),(16.9,'mk1478',-8),(19.6,'s07',-9),(23.2,'mk168',-8),(25.2,'mk1478',-8),(28.8,'s07',-9),(32.5,'mk168',-8),(0.15,'mk3124',-13),(.6,'mk3124',-14),(1.9,'s03',-1),(1.9,'s02',-4),(4.24,'s05',-5),(6.3,'s05',-3),(7.0,'s06',-11),(7.4,'s06',-9),(9.0,'s04',-5,0,1.4),(12.4,'s08',-3),(14.16,'s03',-2),(14.6,'s01',-2,1.45,0.6),(15.18,'s07',1),(15.18,'s02',-2),(17.1,'s10',-6),(18.82,'s06',-6),(19.8,'mk3124',-12),(21.24,'s06',-6),(22.66,'s06',-5),(24.9,'s05',-5),(27.78,'s03',-3),(28.3,'s05',-4),(30.9,'s02',0),(30.9,'s06',-5),(31.72,'s06',-6),(33.9,'s02',-3),(34.05,'mk3124',-11),(34.55,'s09',-3),(34.62,'s06',-5)]]
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
