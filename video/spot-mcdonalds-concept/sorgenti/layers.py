import cv2,numpy as np
D='/tmp/claude-0/-home-user-costruzione/f8f5e66a-bca6-52b8-a8d5-01ec917fceb6/scratchpad/t3d/www/mc/'
im=cv2.imread(D+'hero.png',cv2.IMREAD_UNCHANGED);h,w=im.shape[:2];A=im[:,:,3]>30
def poly(pts):m=np.zeros((h,w),np.uint8);cv2.fillPoly(m,[np.array(pts,np.int32)],1);return m>0
B1=[(150,300),(170,345),(185,390),(215,420),(260,440),(330,455),(400,468),(500,478),(600,482),(700,478),(800,468),(900,452),(980,435),(1040,415),(1090,385),(1130,345),(1150,300)]
top=A&poly([(0,0),(w,0),(w,300)]+B1[::-1]+[(0,300)])
B2=[(1075,398),(1100,420),(1125,470),(1138,505),(1120,517),(1075,505),(1062,540),(1058,600),(1000,613),(900,619),(850,624),(800,636),(750,645),(708,660),(718,700),(706,738),(684,766),(600,778),(545,772),(530,740),(520,690),(505,664),(450,652),(400,632),(360,602),(335,560),(300,552),(250,548),(232,520),(228,470),(150,300)]
fill=A&~top&poly(B1[:14]+B2)
base=A&~top&~fill
P1=[(255,560),(330,548),(450,552),(600,560),(750,585),(850,612),(1045,600)]
belowP1=poly(P1+[(1045,760),(255,760)])
R=fill&belowP1&(np.arange(h)[:,None]<745)
img=im[:,:,:3].copy()
# patty texture from visible right patty, tiled with mirroring
don=img[630:706,760:1000].astype(np.float32);hpd=don-cv2.GaussianBlur(don,(0,0),6)
ys,xs=np.where(R);bx0,bx1,by0,by1=xs.min(),xs.max(),ys.min(),ys.max();BH,BW=by1-by0+1,bx1-bx0+1
low=cv2.inpaint(img,(cv2.dilate(R.astype(np.uint8),np.ones((7,7),np.uint8))*255),15,cv2.INPAINT_NS).astype(np.float32)
low=cv2.GaussianBlur(low,(0,0),5)
det=np.zeros((BH,BW,3),np.float32);rng=np.random.default_rng(9);th,tw=hpd.shape[:2]
for i in range(900):
    y0=rng.integers(-th//2,BH);x0=rng.integers(-tw//2,BW);sy=rng.integers(0,th-24);sx=rng.integers(0,tw-40);hh=24;ww=40
    oy,ox=max(0,y0),max(0,x0);e1=min(BH,y0+hh);e2=min(BW,x0+ww)
    if e1<=oy or e2<=ox:continue
    det[oy:e1,ox:e2]=hpd[sy+(oy-y0):sy+(e1-y0),sx+(ox-x0):sx+(e2-x0)]
det=cv2.GaussianBlur(det,(3,3),0)
topd=np.zeros((BH,BW))
for x in range(BW):
    col=R[by0:by1+1,bx0+x];idx=np.where(col)[0]
    if len(idx):topd[:,x]=np.arange(BH)-idx[0]
patchL=low[by0:by1+1,bx0:bx1+1]
base_col=np.array([48,60,82],np.float32)  # dark patty (BGR)
mix=np.clip(topd/40,0,1)[...,None]
col=patchL*(1-mix)*.6+base_col*(mix*.4+.4)+det*.85
shade=np.clip(.7+topd/50*.3,.7,1.0)[...,None];hl=np.exp(-((topd-5)/4)**2)[...,None]*18
patch=np.clip(col*shade+hl,0,255)
fe=cv2.GaussianBlur(R.astype(np.float32),(9,9),0)[by0:by1+1,bx0:bx1+1][...,None]
rebuilt=img.astype(np.float32);sub=rebuilt[by0:by1+1,bx0:bx1+1];sub[:]=sub*(1-fe)+patch*fe;rebuilt=rebuilt.astype(np.uint8)
# mayo strip under the drip and lettuce holes: inpaint
rest=fill&~R&(base|poly([(230,470),(330,470),(330,560),(230,560)])|poly([(1035,420),(1150,420),(1150,530),(1035,530)])|poly([(520,740),(680,740),(680,790),(520,790)]))
rest&=~poly(B1+[(1150,300)])|True
holes=(fill&~R)&poly([(520,742),(690,742),(690,790),(520,790)])
rebuilt=cv2.inpaint(rebuilt,(holes*255).astype(np.uint8),9,cv2.INPAINT_TELEA)
baseA=base|R|holes
def save(name,rgb,m):
    o=np.dstack([rgb,(m*255).astype(np.uint8)]);o[...,3]=np.minimum(o[...,3],im[:,:,3]) if name!='base' else np.where(R|holes,255,np.minimum(o[...,3],im[:,:,3]));o[...,3]=cv2.GaussianBlur(o[...,3],(3,3),0)
    cv2.imwrite(D+f'l_{name}.png',o)
save('top',img,top);save('fill',img,fill);save('base',rebuilt,baseA)
# debug: exploded preview on grey
bgc=np.full((h+520,w,3),70,np.uint8)
for name,dy in [('base',380),('fill',200),('top',0)]:
    L=cv2.imread(D+f'l_{name}.png',cv2.IMREAD_UNCHANGED);a=L[...,3:4]/255.;sl=bgc[dy:dy+h];sl[:]=(L[...,:3]*a+sl*(1-a)).astype(np.uint8)
cv2.imwrite(D+'../../../explode_dbg.jpg',cv2.resize(bgc,None,fx=.55,fy=.55))
print('ok',top.sum(),fill.sum(),base.sum(),R.sum(),holes.sum())
