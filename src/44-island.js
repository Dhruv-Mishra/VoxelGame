try {
const O=AF.outland,I=AF.PLAN.world.island,S=AF.island={sites:[],palms:0,walkers:0,paths:[],trail:[],spots:{}};
// the island's props were authored with it at z 600: Z() carries those coordinates to where it lies now (05-plan IZ)
const IZ=I.cz-600,Z=z=>z+IZ;
const route=I.ferry;
const F=S.ferry={dock:0,from:0,to:1,elapsed:0,rider:false,waiting:-1,acc:0,x:0,z:277,y:-2.25,yaw:Math.atan2(route.path[1][0]-route.path[0][0],route.path[1][1]-route.path[0][1]),speed:0,len:Math.hypot(route.path[1][0]-route.path[0][0],route.path[1][1]-route.path[0][1])};
const chase=new THREE.Vector3(),target=new THREE.Vector3();
const ridePrompt={label:'Skip crossing',act:()=>F.skip()};
const rideHud={mode:'drive',speed:0,car:'Solace Belle'};
function feetY(x,z){let y=-Infinity;for(const dx of [-0.35,0,0.35])for(const dz of [-0.35,0,0.35]){const ground=AF.W.groundY(x+dx,z+dz);y=Math.max(y,AF.surfaceBelow(x+dx,z+dz,Math.max(3,ground+1),8));}return y;}
const paint=hex=>AF.col(hex,{jitter:0.25,edge:0.15}),white=paint(0xf2efdf),mint=paint(0x75b8a5),coral=paint(0xd87966),teal=paint(0x326e75),wood=AF.col(0xb18b60,{pat:'plank',jitter:0.4,edge:0.2}),rock=AF.col(0x45464a,{pat:'stone',jitter:0.6,edge:0}),gold=paint(0xd6b96f),dark=paint(0x30383d),win=AF.col(0x536f77,{win:'hotel',emit:0xffd4a0,emitK:1.3,mode:'night',edge:0.1}),glow=AF.col(0xffe2ab,{emit:0xffce80,emitK:2.4,mode:'night'}),cache=new Map();
function geometry(key,width,height,depth,build,vs=0.5){if(cache.has(key))return cache.get(key);const model=new AF.Model(width,height,depth);build(model);const geo=AF.meshModel(model,{vs,flat:true}),coarse=new AF.Model(Math.ceil(width/2),Math.ceil(height/2),Math.ceil(depth/2));for(let x=0;x<coarse.w;x++)for(let y=0;y<coarse.h;y++)for(let z=0;z<coarse.d;z++){let value=0;for(let dx=0;dx<2&&!value;dx++)for(let dy=0;dy<2&&!value;dy++)for(let dz=0;dz<2&&!value;dz++)value=model.get(x*2+dx,y*2+dy,z*2+dz);if(value)coarse.set(x,y,z,value);}geo.userData.lod=AF.meshModel(coarse,{vs:vs*2,flat:true});geo.userData.small=Math.max(width,height,depth)*vs<3;cache.set(key,geo);return geo;}
const block=(key,width,height,depth,col)=>geometry(key,width,height,depth,model=>model.box(0,0,0,width,height,depth,col));
function site(name,x,z,rx,rz,y){const entry={name,x,z,y:y??Math.round(O.h(x,z)*4)/4,rx,rz,bank:5,props:[]};S.sites.push(entry);O.pads.push(entry);AF.addLabel(name,x,z,'place');return entry;}
function prop(site,geo,dx=0,dz=0,opts={}){const item=O.addProp(geo,site.x+dx,opts.y??site.y,site.z+dz,opts.rot??0,{tag:'island:'+site.name,collide:opts.collide!==false});site.props.push(item);return item;}
function sign(site,text,dx,dz,y=site.y+3,rot=0){const geo=AF.hbLib.sign(text,teal,white,0.09);prop(site,geo,dx,dz,{y,rot,collide:false});}
function furniture(site,dx,dz){prop(site,AF.hbLib.benchGeo(),dx,dz);}
function canopy(key,col){return geometry(key,12,7,10,model=>{for(const x of [0,11])for(const z of [0,9])model.box(x,0,z,x+1,6,z+1,wood);model.box(0,6,0,12,7,10,col);model.box(1,1,8,11,2,10,white);});}
function openCanopy(site,geo,dx,dz){prop(site,geo,dx,dz,{collide:false});for(const offset of [-2.75,2.75])AF.addCollider(site.x+dx+offset-0.25,site.y,site.z+dz-2.5,site.x+dx+offset+0.25,site.y+3,site.z+dz-2,'island:'+site.name);}
// cottage: same 14x12x12 footprint as before (Corsair Key reuses it) - shutters, side + rear windows, a porch step and chimney, corner quoins
function cottage(col){return geometry('cottage-'+col,14,12,12,model=>{model.box(1,0,1,13,1,11,rock);model.box(1,1,1,13,8,11,col);for(const x of [1,12])for(const z of [1,10])model.box(x,1,z,x+1,8,z+1,white);for(let layer=0;layer<4;layer++)model.box(0,8+layer,layer,14,9+layer,12-layer,teal);model.box(0,8,0,14,9,1,white);model.box(0,8,11,14,9,12,white);model.box(10,8,3,12,12,5,rock);model.box(6,1,10,9,6,11,wood);model.box(5,0,11,10,1,12,wood);model.box(5,6,11,10,7,12,teal);for(const x of [2,10]){model.box(x,3,10,x+2,6,11,win);model.box(x,6,11,x+2,7,12,white);model.box(x-1,3,11,x,6,12,teal);model.box(x+2,3,11,x+3,6,12,teal);model.box(x,3,1,x+2,6,2,win);}for(const x of [1,12])model.box(x,3,5,x+1,6,7,win);return model;});}
// hero broadleaf (zoo Treetop-Trail style): flared trunk, limbs and a lumpy multi-lobe crown - one cached merged mesh per variant
function heroTree(variant){const bark=AF.col(0x5e4632,{jitter:0.45,edge:0.1}),greens=[[0x3f7a3a,0x4f8c40,0x2f5f2e],[0x4a8a3a,0x5c9c46,0x376a2c],[0x3a6e40,0x4c8450,0x2a5632]][variant%3].map(hex=>AF.col(hex,{jitter:0.35,edge:0.08}));return geometry('hero-tree-'+variant,28,34,28,model=>{const h=(a,b,c)=>AF.hash2(a*131+b*7+variant*977,c*53+b);for(let y=0;y<16;y++){const r=2.1-y*0.07+(y<3?(3-y)*0.55:0);for(let x=0;x<28;x++)for(let z=0;z<28;z++)if(Math.hypot(x-13.5,z-13.5)<r)model.set(x,y,z,bark);}const lobes=[[13.5,25,13.5,7]];for(let k=0;k<5;k++){const a=k*1.2566+variant*0.7+h(k,1,2)*0.5,d=5.5+h(k,3,4)*2,cx=13.5+Math.cos(a)*d,cz=13.5+Math.sin(a)*d,cy=20+h(k,5,6)*5;lobes.push([cx,cy,cz,4.6+h(k,7,8)*1.2]);for(let t=0;t<1;t+=0.08){const bx=13.5+(cx-13.5)*t,by=12+(cy-12)*t,bz=13.5+(cz-13.5)*t;model.box(Math.floor(bx),Math.floor(by),Math.floor(bz),Math.floor(bx)+1,Math.floor(by)+1,Math.floor(bz)+1,bark);}}for(let x=0;x<28;x++)for(let y=12;y<34;y++)for(let z=0;z<28;z++){if(model.get(x,y,z))continue;let best=9;for(const [cx,cy,cz,r] of lobes){const q=Math.hypot(x+0.5-cx,(y+0.5-cy)*1.25,z+0.5-cz)/r;if(q<best)best=q;}const n=h(x,y,z);if(best<0.82||best<1&&n>0.35+best*0.25)model.set(x,y,z,greens[y<20?2:n>0.66?1:0]);}return model;});}
function waterRect(points,indices,x,z,width,depth,y){const start=points.length/3;points.push(x-width/2,y,z-depth/2,x-width/2,y,z+depth/2,x+width/2,y,z+depth/2,x+width/2,y,z-depth/2);indices.push(start,start+1,start+2,start,start+2,start+3);}
// no trees or palms on the smugglers' tube, in its cleft, or on the cove's ledge and dock (44-flora asks)
S.noFlora=(x,z)=>{const k=O.tunnelAt?O.tunnelAt(x,z):0,t=O.tunnelInfo;if(k&&(t.end?t.s<0&&t.s>-10:t.d<t.hw+3))return true;const c=I.cove;return !!c&&x>c.ledge.x0-3&&x<c.dock.x1+3&&z>c.ledge.z0-3&&z<c.ledge.z1+3;};
AF.onBuild('island-sites',496.4,()=>{
 const hotel=site('Hotel Serena',-170,Z(631),22,14,3),village=site("Fisher's Landing",-20,Z(486),20,18,2),light=site('Serena Point Light',-256,Z(610),6,6,7),air=site('Serena Airstrip',-182,Z(561),19,8,2),look=site('Crater Lookout',-10,Z(643),4,3,Math.round(O.h(-10,Z(643))*4)/4),bar=site('Palm Beach Bar',-226,Z(665),7,7);
 S.hotel=hotel;S.village=village;S.light=light;S.lookout=look;
 // Grand Hotel Serena: stone plinth, hollow walk-in lobby (desk, columns, chandeliers), columned portico + pediment, domed crown.
 // One merged prop (collide:false) + explicit colliders so the lobby stays enterable; the terrace in front is where Kit waits.
 const PORTICO=[28,32,50,54],LOBBY_COLS=[[14,14],[26,14],[56,14],[68,14],[14,30],[26,30],[56,30],[68,30]],SOFAS=[10,66];
 const hotelProp=prop(hotel,geometry('hotel',84,36,48,model=>{
  model.box(1,0,1,83,1,47,rock);model.box(24,0,47,60,1,48,rock);model.box(2,1,2,82,9,46,white);model.box(4,1,4,80,9,44,0);model.box(4,0,4,80,1,44,white);model.box(40,0,10,44,1,47,coral);
  model.box(36,1,44,48,7,46,0);model.box(35,7,44,49,8,46,gold);model.box(35,1,44,36,7,46,gold);model.box(48,1,44,49,7,46,gold);
  for(const x of [8,14,20,26,56,62,68,74]){model.box(x,2,45,x+3,7,46,win);model.box(x,2,2,x+3,7,3,win);}
  for(let z=8;z<40;z+=8){model.box(2,2,z,3,7,z+3,win);model.box(81,2,z,82,7,z+3,win);}
  for(const [x,z] of LOBBY_COLS){model.box(x,1,z,x+2,9,z+2,white);model.box(x-1,8,z-1,x+3,9,z+3,gold);model.box(x-1,1,z-1,x+3,2,z+3,gold);}
  model.box(30,1,6,54,3,9,wood);model.box(29,3,5,55,4,10,gold);model.box(28,2,4,56,8,5,teal);model.box(34,6,4,50,7,5,gold);
  for(const x of SOFAS){model.box(x,1,20,x+8,2,25,mint);model.box(x,2,20,x+8,3,21,mint);}
  for(const [x,z] of [[42,24],[20,22],[62,22]]){model.box(x-2,7,z-2,x+2,8,z+2,glow);model.box(x,8,z,x+1,9,z+1,gold);}
  model.box(1,9,1,83,10,47,gold);
  for(let level=1;level<4;level++){const inset=[0,3,8][level-1],y=9+(level-1)*8;model.box(2+inset,y+1,2+inset,82-inset,y+8,46-inset,white);model.box(1+inset,y+7,1+inset,83-inset,y+8,47-inset,mint);for(let x=6+inset;x<78-inset;x+=7)for(const z of [2+inset,45-inset]){model.box(x,y+2,z,x+4,y+6,z+1,win);model.box(x-1,y+1,z,x+5,y+2,z+1,gold);}for(let z=7+inset;z<39-inset;z+=7)for(const x of [2+inset,81-inset])model.box(x,y+2,z,x+1,y+6,z+4,win);}
  // first-floor Sky Lounge (east end): carpeted room, bar, sofa, lamps; a glazed door opens onto the Sky Terrace
  model.box(66,10,6,80,16,42,0);model.box(80,10,18,82,15,24,0);model.box(67,9,7,79,10,41,coral);model.box(80,10,17,83,15,18,gold);model.box(80,10,24,83,15,25,gold);model.box(79,15,17,83,16,25,gold);
  model.box(67,10,10,69,12,30,wood);model.box(67,11,10,70,12,30,gold);model.box(66,12,10,67,15,30,teal);for(let z=12;z<30;z+=4)model.box(66,13,z,67,14,z+2,glow);
  model.box(72,10,34,78,11,38,mint);model.box(72,11,37,78,12,38,mint);model.box(74,10,30,76,11,32,wood);for(const z of [12,24,36])model.box(73,15,z,75,16,z+2,glow);
  model.box(10,33,10,74,34,38,gold);model.box(11,33,11,73,34,37,0);for(let i=0;i<3;i++)model.box(34+i*2,33+i,16+i*2,50-i*2,34+i,32-i*2,i===2?gold:mint);
  for(const x of PORTICO){model.box(x,1,46,x+2,12,48,white);model.box(x,1,46,x+2,2,48,gold);model.box(x,11,46,x+2,12,48,gold);}
  model.box(26,12,44,58,14,48,white);model.box(25,14,43,59,15,48,gold);for(let i=0;i<5;i++)model.box(27+i*3,15+i,44,57-i*3,16+i,48,i===4?gold:white);
 }),0,0,{collide:false});
 {const hx=hotel.x-21,hz=hotel.z-12,cols=[],c=(x0,y0,z0,x1,y1,z1)=>cols.push(AF.addCollider(hx+x0*0.5,hotel.y+y0*0.5,hz+z0*0.5,hx+x1*0.5,hotel.y+y1*0.5,hz+z1*0.5,'island:'+hotel.name));
  c(1,0,1,83,1,47);c(24,0,47,60,1,48);c(2,1,2,82,9,4);c(2,1,4,4,9,44);c(80,1,4,82,9,44);c(2,1,44,36,9,46);c(48,1,44,82,9,46);c(36,7,44,48,9,46);c(1,9,1,83,10,47);c(1,10,1,66,36,47);c(66,10,1,83,36,6);c(66,10,42,83,36,47);c(80,10,6,83,16,18);c(80,10,24,83,16,42);c(80,15,18,83,16,24);c(66,16,6,83,36,42);c(67,10,10,70,12,30);c(72,10,34,78,12,38);
  for(const x of PORTICO)c(x,1,46,x+2,12,48);c(25,12,43,59,21,48);for(const [x,z] of LOBBY_COLS)c(x,1,z,x+2,9,z+2);c(29,1,5,55,4,10);for(const x of SOFAS)c(x,1,20,x+8,3,25);hotelProp.col=cols[0];}
 sign(hotel,'HOTEL SERENA',0,12.1,hotel.y+6.6);
 // The terrace: a raised stone deck before the portico (floor 0.5 m, the lobby's level), balustrade, planters, café tables; open to the east (the pier walk)
 const TABLES=[6,14,22];S.hotelTerraceY=hotel.y+0.5;
 prop(hotel,geometry('hotel-terrace',68,4,13,model=>{
  model.box(0,0,0,68,1,13,white);model.box(0,0,12,68,1,13,gold);for(let x=2;x<66;x+=4)model.box(x,0,5,x+2,1,7,mint);
  for(const [a,b] of [[0,30],[38,62]]){for(let x=a;x<b;x+=2)model.box(x,1,12,x+1,2,13,white);model.box(a,2,12,b,3,13,gold);}
  for(let z=0;z<12;z+=2)model.box(0,1,z,1,2,z+1,white);model.box(0,2,0,1,3,12,gold);
  for(const a of [26,38]){model.box(a,1,9,a+4,2,12,rock);model.box(a,2,9,a+4,3,12,mint);model.box(a+1,3,10,a+3,4,11,mint);}
  for(const x of TABLES){model.box(x,1,5,x+1,2,6,dark);model.box(x-1,2,4,x+2,3,7,white);model.box(x-3,1,5,x-2,2,6,wood);model.box(x+3,1,5,x+4,2,6,wood);}
 }),1,15.25,{collide:false});
 {const tx=hotel.x-16,tz=hotel.z+12,c=(x0,y0,z0,x1,y1,z1)=>AF.addCollider(tx+x0*0.5,hotel.y+y0*0.5,tz+z0*0.5,tx+x1*0.5,hotel.y+y1*0.5,tz+z1*0.5,'island:'+hotel.name);
  c(0,0,0,68,1,13);c(0,1,12,30,3,13);c(38,1,12,62,3,13);c(0,1,0,1,3,12);for(const a of [26,38])c(a,1,9,a+4,4,12);for(const x of TABLES)c(x-3,1,4,x+4,3,7);}
 // The Sky Terrace: a colonnaded deck one floor up on the hotel's east side, level with the Sky Lounge (its glazed door opens onto it),
 // reached by a balustraded stair down to the front lawn. Model origin (-149.5, 3, hotel.z-8), 0.5 m voxels; the pier walk (x -145) passes beneath.
 S.hotelSkyTerraceY=hotel.y+5;
 {const STEPS=10,SKY_TABLES=[[9,6],[9,12]];
  prop(hotel,geometry('hotel-sky-terrace',19,13,42,model=>{
   for(const [x,z] of [[17,0],[17,15],[17,30],[0,0],[0,30]]){model.box(x,0,z,x+2,1,z+2,rock);model.box(x,1,z,x+2,8,z+2,white);model.box(x,8,z,x+2,9,z+2,gold);}
   model.box(0,9,0,19,10,32,white);model.box(1,8,0,19,9,1,gold);model.box(18,8,0,19,9,32,gold);model.box(7,8,31,19,9,32,gold);
   for(let x=2;x<18;x+=4)for(let z=2;z<30;z+=4)model.box(x,9,z,x+2,10,z+2,mint);
   for(let z=0;z<32;z+=2)model.box(18,10,z,19,12,z+1,white);model.box(18,12,0,19,13,32,gold);
   for(let x=1;x<18;x+=2){model.box(x,10,0,x+1,12,1,white);if(x>6)model.box(x,10,31,x+1,12,32,white);}model.box(1,12,0,19,13,1,gold);model.box(6,12,31,19,13,32,gold);
   for(const [x,z] of [[15,2],[15,27]]){model.box(x,10,z,x+3,11,z+3,rock);model.box(x,11,z,x+3,12,z+3,mint);model.box(x+1,12,z+1,x+2,13,z+2,mint);}
   for(const [x,z] of SKY_TABLES){model.box(x,10,z,x+1,11,z+1,dark);model.box(x-1,11,z-1,x+2,12,z+2,white);model.box(x-3,10,z,x-2,11,z+1,wood);model.box(x+3,10,z,x+4,11,z+1,wood);}
   for(let i=0;i<STEPS;i++){const z=32+(STEPS-1-i);if(i)model.box(2,0,z,6,i,z+1,white);model.box(2,i,z,6,i+1,z+1,wood);for(const x of [1,6]){model.box(x,0,z,x+1,i+2,z+1,white);model.box(x,i+2,z,x+1,i+3,z+1,gold);}}
  }),25.25,2.5,{y:hotel.y,collide:false});
  const sx=-149.5,sz=hotel.z-8,c=(x0,y0,z0,x1,y1,z1)=>AF.addCollider(sx+x0*0.5,hotel.y+y0*0.5,sz+z0*0.5,sx+x1*0.5,hotel.y+y1*0.5,sz+z1*0.5,'island:'+hotel.name);
  c(0,9,0,19,10,32);for(const [x,z] of [[17,0],[17,15],[17,30],[0,0],[0,30]])c(x,0,z,x+2,9,z+2);
  c(18,10,0,19,13,32);c(1,10,0,18,13,1);c(6,10,31,18,13,32);for(const [x,z] of [[15,2],[15,27]])c(x,10,z,x+3,12,z+3);for(const [x,z] of SKY_TABLES)c(x-3,10,z-1,x+4,12,z+2);
  for(let i=0;i<STEPS;i++){const z=32+(STEPS-1-i);c(2,0,z,6,i+1,z+1);for(const x of [1,6])c(x,0,z,x+1,i+3,z+1);}
  sign(hotel,'SKY TERRACE',25.5,8.1,hotel.y+4.1);}
 const poolSite={...hotel,name:'Hotel Serena Pool',x:-170,z:Z(663),props:[]};S.sites.push(poolSite);
 for(const dz of [-6,6])prop(poolSite,block('pool-edge-long',44,1,3,white),0,dz);for(const dx of [-10.5,10.5])prop(poolSite,block('pool-edge-short',3,1,22,white),dx,0);
 prop(poolSite,block('pool-floor',40,1,20,teal),0,0,{y:2.4,collide:false});
 const lounger=geometry('lounger',3,3,5,model=>{model.box(0,1,0,3,2,5,white);model.box(0,2,0,3,3,2,mint);model.box(0,0,1,1,1,4,wood);model.box(2,0,1,3,1,4,wood);}),umbrella=geometry('umbrella',9,7,9,model=>{model.box(4,0,4,5,6,5,wood);for(let layer=0;layer<3;layer++)model.box(layer,4+layer,layer,9-layer,5+layer,9-layer,layer%2?white:coral);});
 for(let index=0;index<8;index++){const dx=-14+(index%4)*9,dz=index<4?10:-10;prop(poolSite,lounger,dx,dz);if(index%2===0)prop(poolSite,umbrella,dx+2,dz+1,{collide:false});}
 const cabana=canopy('cabana',mint);for(let index=0;index<5;index++){const beach=site('Serena Cabana '+(index+1),-205+index*17,Z(690),4,4);openCanopy(beach,cabana,0,0);}
 openCanopy(bar,geometry('bar',24,9,14,model=>{model.box(0,0,8,24,3,12,coral);model.box(0,3,7,24,4,13,wood);for(const x of [0,23])model.box(x,0,0,x+1,8,14,wood);model.box(0,8,0,24,9,14,teal);for(let x=2;x<23;x+=3)model.box(x,7,0,x+1,8,1,glow);}),0,0);sign(bar,'BEACH BAR',0,3.6,bar.y+4.6);AF.addLight({x:bar.x,y:bar.y+3,z:bar.z,color:0xffc878,intensity:1.3,range:15,kind:'street'});
 const board=block('boardwalk',12,1,8,wood),post=geometry('boardwalk-post',1,4,1,model=>{model.box(0,0,0,1,3,1,wood);model.box(0,3,0,1,4,1,white);});for(let x=-214;x<=-112;x+=6){const by=Math.round(O.h(x,Z(679))*4)/4+0.05;O.addProp(board,x,by,Z(679),0,{tag:'island:boardwalk'});if((x+214)%12===0)O.addProp(post,x,by+0.5,Z(679)+1.75,0,{collide:false});}
 for(const [x,z,index]of [[-37,477,0],[-4,477,1],[-38,491,2],[-3,491,3],[-36,503,4],[-4,503,5],[-50,491,6]]){const house=site('Landing Cottage '+(index+1),x,Z(z),4,4,2);prop(house,cottage(index%2?mint:coral));}
 const market=canopy('market',coral);for(const dx of [-11,11])openCanopy(village,market,dx,3);sign(village,"FISHER'S LANDING",0,-3,4.5);
 const net=geometry('fishing-net',12,5,1,model=>{for(let x=0;x<12;x++)for(let y=0;y<5;y++)if((x+y)%2===0)model.set(x,y,0,wood);model.box(0,0,0,1,5,1,wood);model.box(11,0,0,12,5,1,wood);});prop(village,net,17,-12,{collide:false});
 const boat=geometry('fishing-skiff',6,4,16,model=>{model.box(1,0,1,5,1,15,wood);for(const x of [0,5])model.box(x,1,1,x+1,3,15,coral);for(const z of [0,15])model.box(1,1,z,5,3,z+1,coral);model.box(1,2,6,5,3,7,white);});for(let index=0;index<3;index++)prop(village,boat,10+index*5,-38-index*3,{y:-1.2,collide:false});
 const pier=I.landing.pier,deck=block('island-jetty-deck',16,1,16,wood);for(let z=pier.z0;z<pier.z1;z+=8){O.addProp(deck,-20,1.75,z+4,0,{tag:'island:jetty'});for(const x of [-23.5,-16.5]){O.addProp(block('jetty-pile',1,9,1,wood),x,-2,z+1,0,{collide:false});O.addProp(block('jetty-rail',1,1,15,white),x,3,z+4,0,{tag:'island:jetty-rail'});}}
 furniture(village,17,-7);sign(village,'SOLACE BELLE',0,-60,3.5);
 prop(light,geometry('lighthouse',16,46,16,model=>{for(let y=0;y<36;y++)for(let x=2;x<14;x++)for(let z=2;z<14;z++)if(Math.hypot(x-8,z-8)<5.7-y*0.045)model.set(x,y,z,Math.floor(y/7)%2?coral:white);model.box(0,36,0,16,37,16,dark);model.box(5,37,5,11,43,11,win);model.box(7,38,7,9,42,9,glow);model.box(3,43,3,13,44,13,coral);model.box(5,44,5,11,46,11,coral);model.box(7,0,13,10,5,14,teal);}));prop(light,cottage(white),0,-11);AF.addLight({x:light.x,y:light.y+20,z:light.z,color:0xffe2ae,intensity:2,range:18,kind:'street'});
 prop(air,geometry('hangar',48,18,28,model=>{model.box(0,0,0,48,14,28,teal);model.box(0,0,0,48,1,28,rock);for(let x=0;x<48;x+=6)model.box(x,1,0,x+1,14,28,white);model.box(2,0,26,46,12,28,dark);for(let x=2;x<46;x+=4)model.box(x,0,27,x+1,12,28,teal);model.box(2,12,26,46,13,28,coral);for(let x=3;x<45;x+=6)model.box(x,9,0,x+4,11,1,win);for(const x of [0,47])for(let z=4;z<24;z+=6)model.box(x,9,z,x+1,11,z+3,win);for(let layer=0;layer<5;layer++)model.box(layer*3,14+layer,0,48-layer*3,15+layer,28,white);model.box(15,19,0,33,20,28,coral);}),0,0,{rot:2});sign(air,'SERENA AIR',0,-7.1,8,2);
 // the strip is asphalt in the terrain colours (07-outland); markings are 6 cm paint props 3 cm above it (no coplanar faces)
 const runway=I.airstrip,mark=(key,w,d,col,h=1)=>{if(cache.has(key))return cache.get(key);const m=new AF.Model(w,h,d);m.box(0,0,0,w,h,d,col);const geo=AF.meshModel(m,{vs:1/16,flat:true});geo.userData.lod=geo;geo.userData.small=h>1;cache.set(key,geo);return geo;};
 const stripe=AF.col(0xf2f0e6,{jitter:0.08,edge:0,pat:'none'}),lamp=AF.col(0xfff0c8,{emit:0xffe2a0,emitK:3,mode:'night',jitter:0,edge:0}),lampG=AF.col(0x9cffb0,{emit:0x60ff90,emitK:3,mode:'night',jitter:0,edge:0}),ry=runway.y+0.03;
 for(let x=runway.x0+40;x<runway.x1-40;x+=24)O.addProp(mark('rw-dash',192,10,stripe),x,ry,runway.z,0,{collide:false});
 for(const x of [runway.x0+9,runway.x1-9])for(const dz of [-8.4,-6.6,-4.8,-3,3,4.8,6.6,8.4])O.addProp(mark('rw-key',160,14,stripe),x,ry,runway.z+dz,0,{collide:false});
 for(const [x,text,rot] of [[runway.x0+24,'09',0],[runway.x1-24,'27',2]]){const t=AF.textModel(text,stripe,{pad:0}),k=12,m=new AF.Model(t.h*k,1,t.w*k);for(let tx=0;tx<t.w;tx++)for(let ty=0;ty<t.h;ty++)if(t.get(tx,ty,0))m.box(ty*k,0,tx*k,ty*k+k,1,tx*k+k,stripe);const geo=AF.meshModel(m,{vs:1/16,flat:true});geo.userData.lod=geo;O.addProp(geo,x,ry,runway.z,rot,{collide:false});}
 for(let x=runway.x0+12;x<=runway.x1-12;x+=12)for(const dz of [-10.3,10.3])O.addProp(mark('rw-edge',192,12,stripe),x,ry,runway.z+dz,0,{collide:false});
 for(let x=runway.x0+2;x<=runway.x1-2;x+=20)for(const dz of [-11.7,11.7]){const end=x<runway.x0+6||x>runway.x1-6;O.addProp(mark(end?'rw-end-light':'rw-light',4,4,end?lampG:lamp,4),x,runway.y,runway.z+dz,0,{collide:false});}
 const apron=site('Serena Apron',-150,Z(556),22,5,2);apron.face=[0,-1];
 prop(air,geometry('windsock',14,15,3,model=>{model.box(1,0,1,2,14,2,dark);for(let x=2;x<14;x++)model.box(x,11,0,x+1,14-Math.floor(x/5),3,x%4<2?coral:white);}),25,0);
 for(let index=0;index<=240;index++){const progress=index/240,angle=Math.PI-progress*Math.PI/2+Math.sin(progress*Math.PI*6)*0.18,radius=85-67*progress,x=I.cone.x+Math.cos(angle)*radius,z=I.cone.z+Math.sin(angle)*radius,y=Math.round(O.h(x,z)*8)/8;S.trail.push([x,y+0.25,z]);
  if(index%20===0&&index>0&&index<230)O.addProp(block('lava-rock',2,1,2,rock),x+Math.cos(angle+1.5)*1.2,y,z+Math.sin(angle+1.5)*1.2,0,{collide:false});}
 // hero broadleaves (cached merged meshes, 3 variants): deterministic inner-ring spots clear of sites, trail, runway, boardwalk and the cone
 S.heroTrees=[];for(let index=0;index<48&&S.heroTrees.length<12;index++){const angle=index/48*Math.PI*2+AF.hash2(index,311)*0.08,radius=0.6+AF.hash2(index,312)*0.12,x=I.cx+Math.cos(angle)*I.rx*radius,z=I.cz+Math.sin(angle)*I.rz*radius,gy=O.h(x,z);if(!(gy>2.5&&gy<22)||Math.abs(z-runway.z)<26||Math.abs(z-Z(679))<12||Math.hypot(x-light.x,z-light.z)<20||Math.hypot(x-I.cone.x,z-I.cone.z)<60||S.noFlora(x,z)||S.sites.some(site=>Math.abs(x-site.x)<site.rx+9&&Math.abs(z-site.z)<site.rz+9)||S.trail.some(p=>Math.abs(p[0]-x)<9&&Math.abs(p[2]-z)<9)||S.heroTrees.some(t=>Math.hypot(t.x-x,t.z-z)<24))continue;const variant=index%3,ty=Math.round(gy*8)/8-0.4;O.addProp(heroTree(variant),x,ty,z,index&3,{tag:'island:tree',collide:false});AF.addCollider(x-0.9,ty,z-0.9,x+0.9,ty+6,z+0.9,'island:tree');S.heroTrees.push({x,y:ty,z,variant});}
 furniture(look,-2,0);prop(look,block('lookout-deck',16,1,12,wood),0,0,{y:look.y-0.5});
 const points=[],indices=[];waterRect(points,indices,-170,Z(663),20,10,3.16);const start=points.length/3;
 // the crater lake fills the bowl's floor: its rim tucks just under the bank where the ground rises through 41.5 (07-outland's bowl)
 let lakeR=6;while(lakeR<14&&O.h(I.cone.x+lakeR,I.cone.z)<41.5)lakeR+=0.1;lakeR+=0.5;
 points.push(I.cone.x,41.5,I.cone.z);for(let index=0;index<=32;index++){const angle=index/32*Math.PI*2;points.push(I.cone.x+Math.cos(angle)*lakeR,41.5,I.cone.z+Math.sin(angle)*lakeR);if(index)indices.push(start,start+index+1,start+index);}
 // the plunge pool under Serena Falls (07-outland carves it at the foot of the stream's steepest reach)
 const PL=O.isleStream&&O.isleStream.pool;if(PL){const s0=points.length/3;points.push(PL.x,PL.y,PL.z);for(let index=0;index<=20;index++){const angle=index/20*Math.PI*2;points.push(PL.x+Math.cos(angle)*(PL.r+0.3),PL.y,PL.z+Math.sin(angle)*(PL.r+0.3));if(index)indices.push(s0,s0+index+1,s0+index);}}
 const water=new THREE.BufferGeometry();water.setAttribute('position',new THREE.Float32BufferAttribute(points,3));water.setIndex(indices);water.computeVertexNormals();water.computeBoundingSphere();water.userData.kind='lake';water.userData.waterY=3.16;water.userData.outland=true;AF.addWater(water);
 for(let index=0;index<210;index++){const angle=index/210*Math.PI*2,radius=0.78+AF.hash2(index,92)*0.17,x=I.cx+Math.cos(angle)*I.rx*radius,z=I.cz+Math.sin(angle)*I.rz*radius;if(Math.abs(z-runway.z)<22||Math.hypot(x-light.x,z-light.z)<15||S.sites.some(site=>Math.abs(x-site.x)<site.rx+4&&Math.abs(z-site.z)<site.rz+4))continue;if(AF.flora.add('palm',x,z,{scale:0.65+AF.hash2(index,41)*0.5,rot:angle,planted:true,biome:'island'}))S.palms++;}
 for(let index=0;index<24;index++){const x=-207+(index%8)*10,z=Z(652)+Math.floor(index/8)*13;if(Math.abs(x+170)<24&&z<Z(674))continue;if(AF.flora.add('palm',x,z,{scale:0.8+AF.hash2(index,9)*0.3,planted:true,biome:'island'}))S.palms++;}
 AF.flora.scatter('shrub',{x0:-260,z0:Z(584),x1:-231,z1:Z(644),spacing:7,density:0.7,planted:true,biome:'island'});AF.flora.scatter('rock',{x0:108,z0:Z(610),x1:146,z1:Z(669),spacing:8,density:0.6,planted:true,biome:'island'});
 // the wreck of the Lucky Marlin, heeled over on the south-west reef (jet skis bump off it; the shallows glow turquoise round it)
 const R=I.reef;if(R){const hull=AF.col(0x4a3527,{pat:'plank',jitter:0.5,edge:0.25}),keel=AF.col(0x2b2420,{jitter:0.4}),algae=AF.col(0x4f6b3a,{jitter:0.6});
  const wreck=geometry('wreck',44,16,14,m=>{for(let x=0;x<44;x++){if(x>34&&AF.hash2(x,3)<0.6)continue;const t=x/43,half=Math.max(1,Math.round(6.5*Math.sin(Math.min(1,t*1.15+0.08)*Math.PI)**0.6));for(let z=7-half;z<7+half;z++){const lean=Math.round((z-7)*0.55);for(let y=0;y<8;y++){const edge=z===7-half||z===7+half-1||y===0;if(!edge&&y<7)continue;if(x>30&&y>4&&AF.hash2(x,y*7+z)<0.5)continue;m.set(x,y+lean+4,z,y<2?algae:y===0?keel:hull);}}}m.box(16,8,6,17,16,7,keel);m.box(12,13,6,22,14,7,keel);},0.5);
  O.addProp(wreck,R.x,-4.6,R.z,0,{tag:'island:wreck'});AF.addLabel('Wreck of the Lucky Marlin',R.x,R.z,'place');}
});
// ---------------------------------------------------------------- the Moretti smugglers' tunnel (heist act II)
// 07-outland cuts the hollow out of the ground for physics (O.h) but keeps drawing the hillside over it (O.hNat) and leaves the
// tube's open cells undrawn; this lines it: a 0.5 m basalt shell per 32 m outland tile (floor, rough walls, roof, the rock over both
// mouths; merged into the tile meshes, so no draws of its own), roof colliders that carry the hillside above, lanterns (pooled
// lights), crates, nets, an old mine track, the arms cache, boulders hiding the cleft, and the cove's dock with its moored skis.
const TUN=S.tunnelStats={chunks:0,cells:0,colliders:0,triangles:0,lights:0};
AF.onBuild('island-tunnel',496.42,()=>{
 const T=O.tunnel;if(!T)return;
 const stone=(hex,k)=>AF.col(hex,{pat:'stone',jitter:k,edge:0.12});
 const wallC=[stone(0x3a3531,0.7),stone(0x2c2826,0.6),stone(0x47403a,0.7),stone(0x35302c,0.8)],floorC=[AF.col(0x52473c,{jitter:0.6,edge:0.04}),AF.col(0x463c33,{jitter:0.6,edge:0.04})];
 const lampC=AF.col(0xffb24d,{emit:0xff9b30,emitK:3.2,mode:'always',jitter:0.2,edge:0}),mossC=stone(0x4a5636,0.6),iron=AF.col(0x3b3d40,{metal:0.6,rough:0.5,jitter:0.2}),rust=AF.col(0x7a4a32,{jitter:0.5}),olive=AF.col(0x4d5a35,{jitter:0.3,edge:0.2}),rope=AF.col(0xb9a27a,{jitter:0.3,edge:0});
 const q2=v=>Math.round(v*2)/2,f2=v=>Math.floor(v*2)/2,ti=O.tunnelInfo,BAND=T.band;
 let x0=Infinity,x1=-Infinity,z0=Infinity,z1=-Infinity;for(const [x,z] of T.pts){x0=Math.min(x0,x);x1=Math.max(x1,x);z0=Math.min(z0,z);z1=Math.max(z1,z);}
 x0=Math.floor(x0-9);x1=Math.ceil(x1+9);z0=Math.floor(z0-9);z1=Math.ceil(z1+9);
 const NI=(x1-x0)*2,NK=(z1-z0)*2,N=NI*NK,kind=new Uint8Array(N),fl=new Float32Array(N),ce=new Float32Array(N),na=new Float32Array(N),ss=new Float32Array(N),lamp=new Map();
 const cx=i=>x0+i*0.5+0.25,cz=k=>z0+k*0.5+0.25,mouth=s=>s<T.MZ||s>T.L-T.MZ;
 for(let i=0;i<NI;i++)for(let k=0;k<NK;k++){const t=O.tunnelAt(cx(i),cz(k));if(!t||ti.end||t===1&&ti.d>=ti.hw+BAND)continue;const n=i*NK+k;kind[n]=t;fl[n]=ti.floor;ce[n]=ti.ceil;ss[n]=ti.s;}
 for(let n=0;n<N;n++)if(kind[n])na[n]=Math.round(O.hNat(cx(Math.floor(n/NK)),cz(n%NK))*4)/4;
 // centre-line samples: point, tangent, floor at s
 const along=s=>{s=AF.clamp(s,0,T.L);let i=1;while(i<T.cs.length-1&&T.cs[i]<s)i++;const a=T.pts[i-1],b=T.pts[i],len=T.cs[i]-T.cs[i-1],u=(s-T.cs[i-1])/len,dx=(b[0]-a[0])/len,dz=(b[1]-a[1])/len,x=a[0]+(b[0]-a[0])*u,z=a[1]+(b[1]-a[1])*u;O.tunnelAt(x,z);return{x,z,dx,dz,y:ti.floor,hw:ti.hw,ceil:ti.ceil};};
 const cellOf=(x,z)=>{const i=Math.floor((x-x0)*2),k=Math.floor((z-z0)*2);return i<0||k<0||i>=NI||k>=NK?-1:i*NK+k;};
 // lanterns: every 12 m, alternate walls, an emissive block 2 m up the first wall cell, each with a pooled light
 const lights=[],sMaze=T.chambers[1]?T.chambers[1].s:-1e9;
 for(let s=5,side=1;s<T.L-2;s+=12,side=-side){if(Math.abs(s-sMaze)<18)continue;const c=along(s);for(let d=c.hw-0.75;d<c.hw+2;d+=0.25){const x=c.x-c.dz*side*d,z=c.z+c.dx*side*d,n=cellOf(x,z);if(n>=0&&kind[n]===1){lamp.set(n,fl[n]+2);lights.push([c.x-c.dz*side*(c.hw-0.6),c.y+2.3,c.z+c.dx*side*(c.hw-0.6)]);break;}}}
 for(const l of lights){AF.addLight({x:l[0],y:l[1],z:l[2],color:0xffb060,intensity:1.6,range:12,kind:'street',night:false});TUN.lights++;}
 // the shell, one model per 32 m outland tile (the quadtree's level-0 grid)
 const RX=-1484,RZ=-1708;
 for(let tx=RX+Math.floor((x0-RX)/32)*32;tx<x1;tx+=32)for(let tz=RZ+Math.floor((z0-RZ)/32)*32;tz<z1;tz+=32){
  let lo=Infinity,hi=-Infinity,deep=-1;const cells=[];
  for(let i=Math.max(0,(tx-x0)*2);i<Math.min(NI,(tx+32-x0)*2);i++)for(let k=Math.max(0,(tz-z0)*2);k<Math.min(NK,(tz+32-z0)*2);k++){
   const n=i*NK+k,t=kind[n];if(!t)continue;const s=ss[n],m=mouth(s);let a=fl[n]-1,b;
   if(t===2){const top=m||na[n]<=ce[n]+1?q2(na[n]):ce[n]+1;b=Math.max(fl[n],top);if(deep<0&&na[n]>ce[n]+3)deep=n;}
   else b=m?q2(na[n]):Math.min(ce[n]+1,f2(na[n]));
   if(b<=a)continue;cells.push(n,a,b);lo=Math.min(lo,a);hi=Math.max(hi,b);
  }
  if(!cells.length)continue;
  const mw=64,mh=Math.round((hi-lo)*2),md=64,model=new AF.Model(mw,mh,md);
  for(let c=0;c<cells.length;c+=3){
   const n=cells[c],i=Math.floor(n/NK),k=n%NK,mx=Math.round((x0+i*0.5-tx)*2),mz=Math.round((z0+k*0.5-tz)*2),ya=Math.round((cells[c+1]-lo)*2),yb=Math.round((cells[c+2]-lo)*2),x=cx(i),z=cz(k),h=AF.hash2(i*7+3,k*5+1);
   const skin=mouth(ss[n])||kind[n]===2&&na[n]<=ce[n]+1?O.colTop(x,z,na[n],0,1):0;
   if(kind[n]===2){
    const floorY=Math.round((fl[n]-lo)*2),ceilY=Math.round((ce[n]-lo)*2);
    for(let y=ya;y<floorY;y++)model.set(mx,y,mz,floorC[h<0.5?0:1]);
    for(let y=Math.max(ceilY,floorY);y<yb;y++)model.set(mx,y,mz,y===yb-1&&skin?skin:wallC[(h*4)|0]);
   }else{
    const lit=lamp.get(n);
    for(let y=ya;y<yb;y++)model.set(mx,y,mz,lit!==undefined&&Math.abs(y/2+lo-lit)<0.3?lampC:y===yb-1&&skin?skin:y===ya+2&&AF.hash2(i+y,k)<0.25?mossC:wallC[(AF.hash2(i*3+y,k*3-y)*4)|0]);
   }
  }
  const geo=AF.meshModel(model,{vs:0.5,anchor:[0,0,0],flat:true});delete geo.userData.src;
  // far LOD (level >= 1 tiles draw the hillside whole): one voxel buried under the deepest stretch of floor
  const dn=deep>=0?deep:cells[0],di=Math.floor(dn/NK),dk=dn%NK,lodM=new AF.Model(1,1,1).set(0,0,0,wallC[0]);
  const lod=AF.meshModel(lodM,{vs:0.5,anchor:[-Math.round((x0+di*0.5-tx)*2),-Math.round((fl[dn]-1-lo)*2),-Math.round((z0+dk*0.5-tz)*2)],flat:true});delete lod.userData.src;
  geo.userData.lod=lod;geo.userData.lod2=lod;geo.userData.small=true;
  O.addProp(geo,tx,lo,tz,0,{collide:false});TUN.chunks++;TUN.cells+=cells.length/3;TUN.triangles+=geo.index.count/3;
 }
 // roof colliders over the hollow (from the ceiling up to the drawn hillside), merged into runs along x, then along z
 const runs=new Map(),boxes=[];
 for(let k=0;k<NK;k++){let i=0;while(i<NI){const n=i*NK+k;if(kind[n]!==2||na[n]<=ce[n]){i++;continue;}let j=i+1;while(j<NI){const m=j*NK+k;if(kind[m]!==2||ce[m]!==ce[n]||na[m]!==na[n])break;j++;}
  const key=i+','+j+','+ce[n]+','+na[n],prev=runs.get(key);if(prev&&prev.k1===k)prev.k1=k+1;else{if(prev)boxes.push(prev);runs.set(key,{i,j,k0:k,k1:k+1,y0:ce[n],y1:na[n]});}i=j;}}
 for(const r of [...boxes,...runs.values()]){AF.addCollider(x0+r.i*0.5,r.y0,z0+r.k0*0.5,x0+r.j*0.5,r.y1,z0+r.k1*0.5,'island:tunnel-roof');TUN.colliders++;}
 // ---- dressing: crates, barrels, nets, lanterns, the mine track, the arms cache
 const crate=geometry('t-crate',8,6,6,m=>{m.box(0,0,0,8,6,6,wood);for(const x of [0,7])m.box(x,0,0,x+1,6,6,dark);m.box(0,5,0,8,6,6,dark);m.box(3,2,0,5,4,1,gold);},0.25);
 const crateS=geometry('t-crate-s',5,5,5,m=>{m.box(0,0,0,5,5,5,wood);m.box(0,4,0,5,5,5,dark);m.box(0,0,0,1,5,5,dark);},0.25);
 const barrel=geometry('t-barrel',4,5,4,m=>{m.box(0,0,1,4,5,3,rust);m.box(1,0,0,3,5,4,rust);for(const y of [1,3])m.box(0,y,1,4,y+1,3,iron);},0.25);
 const netG=geometry('t-net',14,10,1,m=>{for(let x=0;x<14;x++)for(let y=0;y<10;y++)if((x+y)%2===0||y===9)m.set(x,y,0,rope);},0.25);
 const pole=geometry('t-lamp-pole',3,18,3,m=>{m.box(1,0,1,2,15,2,dark);m.box(0,15,0,3,17,3,iron);m.box(1,15,1,2,17,2,lampC);},1/8);
 const cart=geometry('t-mine-track',32,8,14,m=>{for(let x=0;x<32;x+=6)m.box(x,0,0,x+2,1,14,wood);for(const z of [3,10])m.box(0,1,z,32,2,z+1,iron);m.box(8,2,1,24,3,13,iron);m.box(8,3,1,24,8,2,rust);m.box(8,3,12,24,8,13,rust);m.box(8,3,1,9,8,13,rust);m.box(23,3,1,24,8,13,rust);for(let x=10;x<22;x++)for(let z=2;z<12;z++)if(AF.hash2(x,z)<0.6)m.set(x,4+((x*z)%3),z,wallC[1]);},1/8);
 const table=geometry('t-cache-table',12,4,6,m=>{m.box(0,3,0,12,4,6,wood);for(const x of [0,11])for(const z of [0,5])m.box(x,0,z,x+1,3,z+1,wood);},0.25);
 const cacheBox=geometry('t-cache-crate',20,10,12,m=>{m.box(0,0,0,20,10,12,olive);for(const x of [0,19])m.box(x,0,0,x+1,10,12,dark);m.box(0,9,0,20,10,12,dark);for(let x=3;x<17;x+=4)m.box(x,6,0,x+2,7,1,white);m.box(8,3,0,12,6,1,dark);m.box(9,3,0,11,5,0,gold);m.set(9,4,0,gold);m.set(10,4,0,gold);m.box(9,1,0,11,3,1,gold);},1/8);
 const place=(geo,x,z,rot=0,collide=true)=>{O.tunnelAt(x,z);return O.addProp(geo,x,ti.floor,z,rot,{tag:'island:tunnel',collide});};
 const chamber=j=>{const c=T.chambers[j],p=along(c.s),nx=-p.dz,nz=p.dx;return{...p,nx,nz,s:c.s,r:c.hw};};
 const A=chamber(0),B=chamber(1),C=chamber(2);
 // props stand in a chamber's side pockets: every footprint corner inside the hollow and out of the 3.2 m walking lane round the
 // centre-line (where the guards walk); pocket() takes the free spot farthest from the lane
 const taken=[];
 const fits=(x,z,hx,hz)=>{for(const [ox,oz] of [[0,0],[-hx,-hz],[hx,-hz],[-hx,hz],[hx,hz]])if(O.tunnelAt(x+ox,z+oz)!==2||ti.end||ti.d<1.6||ti.d>ti.hw-0.25)return false;return true;};
 const pocket=(ch,hx,hz)=>{let best=null,bd=-1;for(let a=0;a<32;a++)for(let r=1.6;r<=ch.r+1;r+=0.25){const x=ch.x+Math.cos(a/32*Math.PI*2)*r,z=ch.z+Math.sin(a/32*Math.PI*2)*r;if(taken.some(t=>Math.abs(t[0]-x)<t[2]+hx+0.3&&Math.abs(t[1]-z)<t[3]+hz+0.3)||!fits(x,z,hx,hz))continue;O.tunnelAt(x,z);if(ti.d>bd){bd=ti.d;best=[x,z];}}if(best)taken.push([best[0],best[1],hx,hz]);return best;};
 const face=(x,z)=>{O.tunnelAt(x,z);const p=along(ti.s),fx=p.x-x,fz=p.z-z,l=Math.hypot(fx,fz)||1;return{fx:fx/l,fz:fz/l,rot:Math.abs(fz)>=Math.abs(fx)?(fz<0?0:2):(fx<0?1:3)};};
 const put=(ch,geo,hx,hz,rot=0,collide=true)=>{const p=pocket(ch,rot%2?hz:hx,rot%2?hx:hz);if(p)place(geo,p[0],p[1],rot,collide);return p;};
 // A: the guard room behind the cleft: crates, a barrel, a lamp post
 put(A,crate,1,0.75);put(A,crate,1,0.75,1);put(A,crateS,0.65,0.65);put(A,barrel,0.5,0.5);put(A,pole,0.25,0.25,0,false);
 // C: the old mine depot by the sea cave: a stub of track with an ore cart, nets hung to dry, crates, barrels
 const trackRot=Math.abs(C.dx)>Math.abs(C.dz)?0:1,tp=put(C,cart,2.05,0.95,trackRot,false);
 if(tp)AF.addCollider(tp[0]-(trackRot?0.95:2.05),C.y,tp[1]-(trackRot?2.05:0.95),tp[0]+(trackRot?0.95:2.05),C.y+1,tp[1]+(trackRot?2.05:0.95),'island:tunnel');
 if(!put(C,netG,1.75,0.2,0,false))put(C,netG,1.75,0.2,1,false);put(C,crate,1,0.75);put(C,barrel,0.5,0.5);put(C,crateS,0.65,0.65);put(C,pole,0.25,0.25,0,false);
 // ---- the Moretti stash hall (chamber B, a wide flat cavern): a maze of crate stacks and rock walls on a 4 m grid round the arms cache.
 // The rest of the cavern is filled with rock, so the only way through is the maze (in from the mouth side, out towards the sea cave).
 // Walls stand 2.75 m: nobody sees or jumps over them. Two outland props (walls at 1/4 m, the rock fill at 1/2 m: merged into the tile
 // meshes, no draws of their own), colliders merged per run. 81-heist-sets walks the guards through it on the maze graph (S.heist.nav).
 const MZ=(()=>{
  const CS=4,NG=7,half=CS*NG/2,sIn=B.s-17,sOut=B.s+17,gx0=Math.round((B.x-half)*2)/2,gz0=Math.round((B.z-half)*2)/2,rng=AF.rng(7311),m=CS/2-0.1;
  const id=(i,k)=>i*NG+k,cc=n=>[gx0+(((n/NG)|0)+0.5)*CS,gz0+(n%NG+0.5)*CS];
  const okCell=n=>{const [x,z]=cc(n);for(const [ox,oz] of [[0,0],[-m,-m],[m,-m],[-m,m],[m,m],[0,-m],[0,m],[-m,0],[m,0]])if(O.tunnelAt(x+ox,z+oz)!==2||ti.end||ti.d>ti.hw-0.5||ti.s<sIn+1.5||ti.s>sOut-1.5)return false;return true;};
  const on=new Uint8Array(NG*NG);for(let n=0;n<NG*NG;n++)on[n]=okCell(n)?1:0;
  const nb=n=>{const i=(n/NG)|0,k=n%NG,o=[];if(i>0&&on[id(i-1,k)])o.push(id(i-1,k));if(i<NG-1&&on[id(i+1,k)])o.push(id(i+1,k));if(k>0&&on[id(i,k-1)])o.push(id(i,k-1));if(k<NG-1&&on[id(i,k+1)])o.push(id(i,k+1));return o;};
  // keep the largest 4-connected group of cells
  {const comp=new Int16Array(NG*NG).fill(-1);let best=-1,bestN=0;for(let n=0;n<NG*NG;n++){if(!on[n]||comp[n]>=0)continue;const q=[n];comp[n]=n;for(let h=0;h<q.length;h++)for(const v of nb(q[h]))if(comp[v]<0){comp[v]=n;q.push(v);}if(q.length>bestN){bestN=q.length;best=n;}}for(let n=0;n<NG*NG;n++)if(comp[n]!==best)on[n]=0;}
  const cells=[];for(let n=0;n<NG*NG;n++)if(on[n])cells.push(n);
  const nearCell=(x,z)=>{let b=-1,bd=1e9;for(const n of cells){const [cx,cz]=cc(n),d=(cx-x)**2+(cz-z)**2;if(d<bd){bd=d;b=n;}}return b;};
  const pIn=along(sIn-0.5),pOut=along(sOut+0.5),entry=nearCell(pIn.x,pIn.z),exit=nearCell(pOut.x,pOut.z);
  // every edge starts closed; a randomised depth-first walk opens a spanning tree, then a few extra openings make loops (two ways
  // round a guard, room to flank in a gunfight)
  const open=new Set(),ek=(a,b)=>a<b?a+','+b:b+','+a,isOpen=(a,b)=>open.has(ek(a,b));
  {const seen=new Set([entry]),st=[entry];while(st.length){const u=st[st.length-1],c=nb(u).filter(v=>!seen.has(v));if(!c.length){st.pop();continue;}const v=c[(rng()*c.length)|0];open.add(ek(u,v));seen.add(v);st.push(v);}}
  for(const u of cells)for(const v of nb(u))if(u<v&&!isOpen(u,v)&&rng()<0.16)open.add(ek(u,v));
  const bfs=a=>{const dd=new Int16Array(NG*NG).fill(-1),prev=new Int16Array(NG*NG).fill(-1),q=[a];dd[a]=0;for(let h=0;h<q.length;h++){const u=q[h];for(const v of nb(u))if(dd[v]<0&&isOpen(u,v)){dd[v]=dd[u]+1;prev[v]=u;q.push(v);}}return{dd,prev};};
  const path=(a,b)=>{const {prev}=bfs(a),out=[];for(let u=b;u>=0&&u!==a;u=prev[u])out.push(u);out.push(a);return out.reverse();};
  // the cache: the farthest dead end from the way in (never the way out)
  const D0=bfs(entry).dd;let cache=-1,cd=-1;
  for(const n of cells){if(n===exit||n===entry||D0[n]<0)continue;const deg=nb(n).filter(v=>isOpen(n,v)).length,sc=D0[n]+(deg===1?3:0);if(sc>cd){cd=sc;cache=n;}}
  let far=-1,fd=-1;{const Dc=bfs(cache).dd;for(const n of cells){const sc=Math.min(Dc[n],D0[n]);if(n!==exit&&sc>fd){fd=sc;far=n;}}}
  return{CS,NG,gx0,gz0,sIn,sOut,on,cells,isOpen,nb,cc,id,entry,exit,cache,far,pIn,pOut,path};
 })();
 const mzFloor=(x,z)=>{O.tunnelAt(x,z);return ti.floor;};
 const segD=(x,z,a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],l2=dx*dx+dz*dz||1,t=AF.clamp(((x-a[0])*dx+(z-a[1])*dz)/l2,0,1);return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);};
 const corIn=[[MZ.pIn.x,MZ.pIn.z],MZ.cc(MZ.entry)],corOut=[MZ.cc(MZ.exit),[MZ.pOut.x,MZ.pOut.z]];
 const inMaze=(x,z)=>{const i=Math.floor((x-MZ.gx0)/MZ.CS),k=Math.floor((z-MZ.gz0)/MZ.CS);return i>=0&&k>=0&&i<MZ.NG&&k<MZ.NG&&!!MZ.on[MZ.id(i,k)];};
 // the rock fill: every hollow column of the hall outside the maze and its two corridors, floor to roof
 {const fill=[];let lo=Infinity,hi=-Infinity,fi0=Infinity,fi1=-Infinity,fk0=Infinity,fk1=-Infinity;
  for(let i=0;i<NI;i++)for(let k=0;k<NK;k++){const n=i*NK+k;if(kind[n]!==2||ss[n]<=MZ.sIn||ss[n]>=MZ.sOut)continue;const x=cx(i),z=cz(k);
   if(inMaze(x,z)||segD(x,z,corIn[0],corIn[1])<1.35||segD(x,z,corOut[0],corOut[1])<1.35)continue;
   fill.push(n);lo=Math.min(lo,fl[n]);hi=Math.max(hi,ce[n]);fi0=Math.min(fi0,i);fi1=Math.max(fi1,i);fk0=Math.min(fk0,k);fk1=Math.max(fk1,k);}
  if(fill.length){
   const model=new AF.Model(fi1-fi0+1,Math.round((hi-lo)*2)+1,fk1-fk0+1),is=new Uint8Array(N);
   for(const n of fill){is[n]=1;const i=Math.floor(n/NK),k=n%NK,ya=Math.round((fl[n]-lo)*2),yb=Math.round((ce[n]-lo)*2);for(let y=ya;y<yb;y++)model.set(i-fi0,y,k-fk0,y===ya&&AF.hash2(i,k)<0.3?mossC:wallC[(AF.hash2(i*5+y,k*3-y)*4)|0]);}
   const geo=AF.meshModel(model,{vs:0.5,anchor:[0,0,0],flat:true});delete geo.userData.src;
   const lodM=new AF.Model(1,1,1).set(0,0,0,wallC[0]),lod=AF.meshModel(lodM,{vs:0.5,anchor:[0,1,0],flat:true});delete lod.userData.src;geo.userData.lod=lod;geo.userData.lod2=lod;geo.userData.small=true;
   O.addProp(geo,x0+fi0*0.5,lo,z0+fk0*0.5,0,{collide:false});TUN.chunks++;TUN.triangles+=geo.index.count/3;
   // colliders: runs along x, merged across z while they match
   const open=new Map();
   for(let k=fk0;k<=fk1;k++){const row=new Map();let i=fi0;while(i<=fi1){const n=i*NK+k;if(!is[n]){i++;continue;}let j=i+1;while(j<=fi1&&is[j*NK+k]&&fl[j*NK+k]===fl[n]&&ce[j*NK+k]===ce[n])j++;row.set(i+','+j+','+fl[n]+','+ce[n],{i,j,k0:k,k1:k+1,y0:fl[n],y1:ce[n]});i=j;}
    for(const [key,r] of open){const m=row.get(key);if(m){r.k1=k+1;row.delete(key);}else{AF.addCollider(x0+r.i*0.5,r.y0,z0+r.k0*0.5,x0+r.j*0.5,r.y1,z0+r.k1*0.5,'island:stash-rock');TUN.colliders++;open.delete(key);}}
    for(const [key,r] of row)open.set(key,r);}
   for(const r of open.values()){AF.addCollider(x0+r.i*0.5,r.y0,z0+r.k0*0.5,x0+r.j*0.5,r.y1,z0+r.k1*0.5,'island:stash-rock');TUN.colliders++;}
  }}
 // the walls: closed edges between maze cells and round its rim (but for the way in and the way out), crate stacks or rough rock
 {const {CS,NG,gx0,gz0,on,id,isOpen}=MZ,WV=4,WH=11,walls=[];
  const doorOf=(n,p)=>{const [x,z]=MZ.cc(n),dx=p[0]-x,dz=p[1]-z;return Math.abs(dx)>Math.abs(dz)?(dx>0?'E':'W'):(dz>0?'S':'N');};
  const dIn=doorOf(MZ.entry,corIn[0]),dOut=doorOf(MZ.exit,corOut[1]);
  for(let i=0;i<NG;i++)for(let k=0;k<NG;k++){const n=id(i,k);if(!on[n])continue;
   // east edge (x = gx0+(i+1)CS) and south edge (z = gz0+(k+1)CS) of every cell; the west / north rim only where the cell has no neighbour
   const e=i<NG-1&&on[id(i+1,k)]?id(i+1,k):-1,s=k<NG-1&&on[id(i,k+1)]?id(i,k+1):-1;
   if(e<0?!(n===MZ.entry&&dIn==='E'||n===MZ.exit&&dOut==='E'):!isOpen(n,e))walls.push([gx0+(i+1)*CS,gz0+k*CS,0,n]);
   if(s<0?!(n===MZ.entry&&dIn==='S'||n===MZ.exit&&dOut==='S'):!isOpen(n,s))walls.push([gx0+i*CS,gz0+(k+1)*CS,1,n]);
   if((i===0||!on[id(i-1,k)])&&!(n===MZ.entry&&dIn==='W'||n===MZ.exit&&dOut==='W'))walls.push([gx0+i*CS,gz0+k*CS,0,n]);
   if((k===0||!on[id(i,k-1)])&&!(n===MZ.entry&&dIn==='N'||n===MZ.exit&&dOut==='N'))walls.push([gx0+i*CS,gz0+k*CS,1,n]);}
  let lo=Infinity,hi=-Infinity;for(const n of MZ.cells){const [x,z]=MZ.cc(n);for(const [ox,oz] of [[-1.5,-1.5],[1.5,1.5],[1.5,-1.5],[-1.5,1.5]]){const f=mzFloor(x+ox,z+oz);lo=Math.min(lo,f);hi=Math.max(hi,f);}}
  // the model starts two voxels west / north of the grid (the corner posts reach 0.5 m out); every voxel is floor()ed from its centre,
  // so a wall spans exactly its collider (edge ± 0.25 m) and never shares a face with the rock fill behind the rim
  const NX=NG*CS*WV+4,NZ=NX,model=new AF.Model(NX,Math.round((hi-lo)*WV)+WH+2,NZ),ox0=gx0-2/WV,oz0=gz0-2/WV;
  const wood2=AF.col(0x8a6a44,{pat:'plank',jitter:0.35,edge:0.2}),band=dark,ammo=olive,stencilC=AF.col(0xe8e0c0,{jitter:0.1,edge:0});
  const put1=(x,z,h,style,u)=>{const mi=Math.floor((x-ox0)*WV),mk=Math.floor((z-oz0)*WV),f=Math.round((mzFloor(x,z)-lo)*WV);if(mi<0||mk<0||mi>=NX||mk>=NZ)return;
   for(let y=0;y<h;y++){let c;if(style===0)c=y===0&&AF.hash2(mi,mk)<0.4?mossC:wallC[(AF.hash2(mi*3+y,mk*5-y)*4)|0];
    else{const b=y%4===3||u%4===0;c=b?band:style===1?wood2:ammo;if(style===2&&!b&&y%4===1&&u%4===2)c=stencilC;}
    model.set(mi,f+y,mk,c);}};
  for(const [x,z,dir,n] of walls){const style=AF.hash2(Math.round(x*3),Math.round(z*7))<0.45?0:AF.hash2(Math.round(z*3),Math.round(x*5))<0.5?1:2,h=style?WH-((AF.hash2(Math.round(x),Math.round(z))*2)|0):WH+1;
   for(let u=0;u<CS*WV;u++)for(let t=-1;t<1;t++){const wx=dir?x+(u+0.5)/WV:x+(t+0.5)/WV,wz=dir?z+(t+0.5)/WV:z+(u+0.5)/WV;put1(wx,wz,h,style,u);}
   const f0=Math.min(mzFloor(x,z),mzFloor(dir?x+CS:x,dir?z:z+CS)),f1=Math.max(mzFloor(x,z),mzFloor(dir?x+CS:x,dir?z:z+CS));
   AF.addCollider(dir?x:x-0.25,f0-0.5,dir?z-0.25:z,dir?x+CS:x+0.25,f1+WH/WV,dir?z+0.25:z+CS,'island:stash-wall');TUN.colliders++;void n;}
  // rock posts where walls meet
  const posts=new Set();for(const [x,z,dir] of walls){posts.add(x+','+z);posts.add((dir?x+CS:x)+','+(dir?z:z+CS));}
  for(const key of posts){const [x,z]=key.split(',').map(Number);for(let a=-2;a<2;a++)for(let b=-2;b<2;b++)put1(x+(a+0.5)/WV,z+(b+0.5)/WV,WH+2,0,0);const f=mzFloor(x,z);AF.addCollider(x-0.5,f-0.5,z-0.5,x+0.5,f+3.25,z+0.5,'island:stash-wall');TUN.colliders++;}
  const geo=AF.meshModel(model,{vs:1/WV,anchor:[0,0,0],flat:true});delete geo.userData.src;
  const lodM=new AF.Model(1,1,1).set(0,0,0,wallC[0]),lod=AF.meshModel(lodM,{vs:0.25,anchor:[0,1,0],flat:true});delete lod.userData.src;geo.userData.lod=lod;geo.userData.lod2=lod;geo.userData.small=true;
  O.addProp(geo,ox0,lo,oz0,0,{collide:false});TUN.chunks++;TUN.triangles+=geo.index.count/3;
  MZ.walls=walls.length;}
 // the arms cache: a big padlocked crate on a table in the maze's farthest dead end, facing its way in; the armoury racks one cell back
 const [cacheX,cacheZ]=MZ.cc(MZ.cache),cacheY=mzFloor(cacheX,cacheZ),cachePath=MZ.path(MZ.entry,MZ.cache),cprev=cachePath.length>1?cachePath[cachePath.length-2]:MZ.entry;
 const [px0,pz0]=MZ.cc(cprev),cfx=Math.sign(Math.round(px0-cacheX)),cfz=Math.sign(Math.round(pz0-cacheZ)),cf={fx:cfx,fz:cfz,rot:Math.abs(cfz)>=Math.abs(cfx)?(cfz<0?0:2):(cfx<0?1:3)};
 const cacheYaw=Math.atan2(cf.fx,cf.fz),cb=-0.9;   // table + crate pushed to the back of the dead end (0.1 m off its wall)
 O.addProp(table,cacheX+cf.fx*cb,cacheY,cacheZ+cf.fz*cb,cf.rot,{tag:'island:tunnel'});O.addProp(cacheBox,cacheX+cf.fx*cb,cacheY+1,cacheZ+cf.fz*cb,cf.rot,{tag:'island:tunnel-cache'});
 const rack=geometry('t-gun-rack',12,15,4,m=>{m.box(0,0,0,12,1,4,wood);m.box(0,0,0,1,15,4,wood);m.box(11,0,0,12,15,4,wood);m.box(0,14,0,12,15,4,wood);m.box(0,7,0,12,8,4,dark);for(let x=2;x<11;x+=3){m.box(x,1,1,x+1,13,2,dark);m.box(x,9,1,x+2,11,2,iron);m.box(x,3,2,x+1,5,3,wood);}},1/8);
 const racks=[];{const [rx,rz]=MZ.cc(cprev),i=Math.floor((rx-MZ.gx0)/MZ.CS),k=Math.floor((rz-MZ.gz0)/MZ.CS);
  for(const [dx,dz,rot] of [[1,0,3],[-1,0,1],[0,1,2],[0,-1,0]]){if(racks.length>=2)break;
   // against a closed side of the armoury cell (no open neighbour that way)
   const ni=i+dx,nk=k+dz,nn=ni>=0&&nk>=0&&ni<MZ.NG&&nk<MZ.NG&&MZ.on[MZ.id(ni,nk)]?MZ.id(ni,nk):-1;
   if(nn>=0&&MZ.isOpen(cprev,nn))continue;const x=rx+dx*(MZ.CS/2-0.55),z=rz+dz*(MZ.CS/2-0.55);O.addProp(rack,x,mzFloor(x,z),z,rot,{tag:'island:gun-rack'});racks.push({x:+x.toFixed(2),y:mzFloor(x,z),z:+z.toFixed(2),yaw:Math.atan2(-dx,-dz)});}}
 for(const n of [MZ.entry,MZ.cache,MZ.far,MZ.exit]){const [x,z]=MZ.cc(n);AF.addLight({x,y:mzFloor(x,z)+3.2,z,color:0xffb060,intensity:1.5,range:11,kind:'street',night:false});TUN.lights++;}
 place(pole,cacheX+cf.fx*1.3-cf.fz*1.45,cacheZ+cf.fz*1.3+cf.fx*1.45,0,false);
 for(const ch of [A,C]){AF.addLight({x:ch.x,y:ch.y+3,z:ch.z,color:0xffb868,intensity:1.4,range:11,kind:'street',night:false});TUN.lights++;}
 // the cleft: two boulders screen the mouth from the hillside (the way in weaves between them)
 const boulder=geometry('t-boulder',9,6,8,m=>{m.sphere(4.5,1.5,4,4.4,wallC[0],(x,y,z)=>y<6?wallC[(AF.hash2(x*3+y,z)*4)|0]:0);});
 const out=T.out,mx0=T.pts[0][0],mz0=T.pts[0][1],yE=T.yE;
 for(const [d,side] of [[8.5,1],[11,-1]]){const x=mx0+out[0]*d-out[1]*side*3.4,z=mz0+out[1]*d+out[0]*side*3.4;O.addProp(boulder,x,Math.min(O.h(x,z),yE)-0.5,z,side>0?0:1,{tag:'island:tunnel-boulder'});}
 // the cove: a plank dock on piles from the cave ledge into the basin, a lantern post at its end
 const CV=I.cove;if(CV){const D=CV.dock,len=D.x1-D.x0,deck=geometry('cove-dock',Math.round(len*4),1,Math.round(D.w*4),m=>{for(let x=0;x<m.w;x++)m.box(x,0,0,x+1,1,m.d,x%3?wood:dark);},0.25),piles=geometry('cove-piles',Math.round(len*4),24,Math.round(D.w*4),m=>{for(let x=1;x<m.w;x+=10)for(const z of [0,m.d-1])m.box(x,0,z,x+1,24,z+1,dark);},0.25);
  O.addProp(deck,(D.x0+D.x1)/2,D.y-0.25,D.z,0,{tag:'island:cove-dock'});O.addProp(piles,(D.x0+D.x1)/2,D.y-6.25,D.z,0,{collide:false});O.addProp(pole,D.x1-0.6,D.y,D.z+D.w/2-0.4,0,{collide:false});
  AF.addLight({x:D.x1-0.6,y:D.y+2,z:D.z+D.w/2-0.4,color:0xffc070,intensity:1.2,range:10,kind:'street',night:false});TUN.lights++;}
 // ---- the heist's spots (81-heist): centre-line, guard routes and posts, cache, mouths, cove, moored skis, Kit on the hotel terrace
 const line=(sa,sb,step=1.5)=>{const pts=[];for(let s=sa;s<=sb+1e-6;s+=step){const p=along(s);pts.push([+p.x.toFixed(2),p.y,+p.z.toFixed(2)]);}return pts;};
 const entry=along(0),exit=along(T.L);
 // the walkable way through: the tube to the hall, the maze from its way in to its way out, the tube on to the sea cave; and the
 // guards' nav graph (the tube's two chains + every maze cell, linked through the maze's open edges)
 const cellP=n=>{let [x,z]=MZ.cc(n);if(n===MZ.cache){x+=cf.fx*0.8;z+=cf.fz*0.8;}return[+x.toFixed(2),mzFloor(x,z),+z.toFixed(2)];};   // the cache's cell: the spot in front of the crate
 const pre=line(0,MZ.sIn-1,2).concat([[+MZ.pIn.x.toFixed(2),MZ.pIn.y,+MZ.pIn.z.toFixed(2)]]),post=[[+MZ.pOut.x.toFixed(2),MZ.pOut.y,+MZ.pOut.z.toFixed(2)]].concat(line(MZ.sOut+1,T.L,2));
 const walk=pre.concat(MZ.path(MZ.entry,MZ.exit).map(cellP),post);
 const nav={pts:[],links:[]};{const P=nav.pts,Lk=nav.links,idx=new Map();
  for(const p of pre){P.push(p);if(P.length>1)Lk.push([P.length-2,P.length-1]);}const preEnd=P.length-1;
  for(const n of MZ.cells){idx.set(n,P.length);P.push(cellP(n));}
  for(const u of MZ.cells)for(const v of MZ.nb(u))if(u<v&&MZ.isOpen(u,v))Lk.push([idx.get(u),idx.get(v)]);
  Lk.push([preEnd,idx.get(MZ.entry)]);
  for(let i=0;i<post.length;i++){P.push(post[i]);Lk.push([i?P.length-2:idx.get(MZ.exit),P.length-1]);}}
 const H=S.heist={
  tunnelEntry:{x:+(mx0+out[0]*2.5).toFixed(2),y:AF.W.groundY(mx0+out[0]*2.5,mz0+out[1]*2.5),z:+(mz0+out[1]*2.5).toFixed(2),yaw:Math.atan2(-out[0],-out[1])},
  tunnel:walk,length:T.L,nav,
  cache:{x:+(cacheX+cf.fx*cb).toFixed(2),y:cacheY+1,z:+(cacheZ+cf.fz*cb).toFixed(2),yaw:cacheYaw},
  cacheStand:{x:+(cacheX+cf.fx*0.8).toFixed(2),y:cacheY,z:+(cacheZ+cf.fz*0.8).toFixed(2),yaw:Math.atan2(-cf.fx,-cf.fz)},
  // where the Moretti men hold once the alarm is up (80-stealth zone.holds): the tube past the way out first, then the way in
  holds:[2,4,6,-2,-4].flatMap(ds=>[-0.9,0.9].map(o=>{const p=along(ds>0?MZ.sOut+ds:MZ.sIn+ds),x=p.x-p.dz*o,z=p.z+p.dx*o;O.tunnelAt(x,z);return[+x.toFixed(2),ti.floor,+z.toFixed(2)];})),
  racks,maze:{cells:MZ.cells.length,walls:MZ.walls,entry:cellP(MZ.entry),exit:cellP(MZ.exit),cache:cellP(MZ.cache),far:cellP(MZ.far)},
  // the Moretti reinforcements pour in from both ends of the tube
  waveSpawns:[line(MZ.sIn-9,MZ.sIn-9)[0],line(MZ.sIn-5,MZ.sIn-5)[0],post[Math.min(post.length-1,3)],post[Math.min(post.length-1,5)]],
  guardPosts:[A,C].map(ch=>{const p=pocket(ch,0.35,0.35)||[ch.x,ch.z],f=face(p[0],p[1]);O.tunnelAt(p[0],p[1]);return{x:+p[0].toFixed(2),y:ti.floor,z:+p[1].toFixed(2),yaw:Math.atan2(f.fx,f.fz)};}),
  // every guard patrols: the tube legs, three beats through the maze, the depot, the dock
  guardRoutes:[line(3,A.s+3),line(A.s+6,MZ.sIn-1),MZ.path(MZ.entry,MZ.cache).map(cellP),MZ.path(MZ.cache,MZ.far).map(cellP),MZ.path(MZ.far,MZ.exit).map(cellP),line(MZ.sOut+1,C.s-2),line(C.s+2,T.L-3)],
  caveExit:{x:+exit.x.toFixed(2),y:exit.y,z:+exit.z.toFixed(2),yaw:Math.atan2(exit.dx,exit.dz)},
  cove:CV?{x:(CV.ledge.x0+CV.ledge.x1)/2,y:CV.ledge.y,z:(CV.ledge.z0+CV.ledge.z1)/2}:null,
  skis:fun.docks.filter(d=>d.cove).map(d=>({x:d.x,z:d.z,yaw:d.yaw})),
  kit:null,
 };
 void entry;
 if(CV){H.guardPosts.push({x:CV.dock.x0+3,y:CV.dock.y,z:CV.dock.z,yaw:-Math.PI/2});H.guardRoutes.push([[CV.dock.x0+1.5,CV.dock.y,CV.dock.z],[CV.dock.x1-1.2,CV.dock.y,CV.dock.z]]);}
 // Kit waits on the Hotel Serena terrace, between the hotel and the pool (the nearest free standing spot)
 const free=(x,z,y0)=>{for(let r=0;r<8;r+=0.5)for(let a=0;a<16;a++){const px=x+Math.cos(a/16*Math.PI*2)*r,pz=z+Math.sin(a/16*Math.PI*2)*r,py=AF.surfaceBelow(px,pz,y0+3,8);if(!AF.boxBlocked(px,py+0.05,pz,0.45,1.9))return{x:+px.toFixed(2),y:py,z:+pz.toFixed(2)};if(!r)break;}return{x,y:y0,z};};
 // Kit waits on the Sky Terrace (one floor up), facing the stair head / lounge door; the meet point 2.2 m ahead stays on the deck.
 const kit=free(-143.5,Z(631)+3,S.hotelSkyTerraceY);kit.yaw=-Math.PI/4;H.kit=kit;
 S.spots.strip={x:(I.airstrip.x0+I.airstrip.x1)/2,y:I.airstrip.y,z:I.airstrip.z};
 S.spots.tunnel=H.tunnelEntry;S.spots.cove=H.cove;S.spots.kit=kit;S.spots.kitTerrace=kit;S.spots.kitUpperTerrace=kit;S.spots.skyTerraceStair={x:-147.5,y:S.hotelSkyTerraceY-5,z:Z(631)+13};
});
// ---------------------------------------------------------------- Serena fun: a sunset beach party, bonfire, beach volleyball, umbrellas,
// a swim raft with a slide, tiki torches, hammocks and the jet-ski hire. Static parts are merged outland props (built before the
// resort's palm ring, which keeps clear of these pads, and before the outland tiles); people, jet skis and riders are added in island-life.
const fun=S.fun={party:null,bonfire:null,court:null,hire:null,docks:[]};
const glowC=(hex,k=1.6)=>AF.col(hex,{emit:hex,emitK:k,mode:'night',jitter:0.05,edge:0}),pink=glowC(0xff4fb8),cyan=glowC(0x3fe0ff),lime=glowC(0xb8ff4a),amber=glowC(0xffb03a,2.2);
const fire=AF.col(0xff7a2a,{emit:0xff6a1a,emitK:3,mode:'always',jitter:0.5,edge:0}),ember=AF.col(0xffc04a,{emit:0xffa030,emitK:3.5,mode:'always',jitter:0.4,edge:0});
const blue=paint(0x2f5f9e),yellow=paint(0xf2c84a),black=paint(0x1f2326),grey=paint(0x8f979c),net=AF.col(0xf4f1e6,{jitter:0.05,edge:0,solid:false});
AF.onBuild('island-fun',496.35,()=>{
 // the party: stage + DJ booth on the sand with the sea behind it, a lit dance floor, speaker stacks, string lights on four poles
 const party=fun.party=site('Serena Sunset Party',-25,Z(717),16,9,2.25);party.bank=6;
 prop(party,geometry('party-stage',40,18,12,m=>{m.box(0,0,0,40,2,12,wood);m.box(0,2,10,40,3,12,dark);for(const x of [0,38])m.box(x,2,8,x+2,16,12,dark);m.box(0,16,8,40,18,12,dark);for(let x=2;x<38;x+=2)m.box(x,15,8,x+1,16,9,[pink,cyan,lime,amber][(x/2)%4]);m.box(2,3,11,38,15,12,teal);for(let y=4;y<14;y+=3)m.box(4,y,10,36,y+1,11,[pink,cyan][(y/3)%2|0]);m.box(14,2,3,26,5,6,white);m.box(14,5,3,26,6,6,dark);m.box(15,3,2,25,4,3,cyan);for(const x of [1,33])for(let y=2;y<12;y++)m.box(x,y,1,x+6,y+1,6,y%3===0?grey:black);}),0,4);
 sign(party,'SERENA SUNSET PARTY',0,4.9,party.y+9.1,2);
 const floor=geometry('party-floor',64,1,40,m=>{for(let x=0;x<64;x+=8)for(let z=0;z<40;z+=8)m.box(x,0,z,x+8,1,z+8,[pink,cyan,lime,amber][((x+z)/8)%4]);},1/4);prop(party,floor,0,-4,{y:party.y+0.02});
 prop(party,geometry('party-lights',72,24,52,m=>{for(const x of [0,71])for(const z of [0,51])m.box(x,0,z,x+1,22,z+1,wood);for(let i=0;i<72;i++){const sag=Math.round(Math.sin(i/71*Math.PI)*3);for(const z of [0,51])m.set(i,21-sag,z,i%3?dark:[amber,pink,cyan][(i/3)%3|0]);}for(let i=0;i<52;i++){const sag=Math.round(Math.sin(i/51*Math.PI)*3);for(const x of [0,71])m.set(x,21-sag,i,i%3?dark:[lime,amber,pink][(i/3)%3|0]);}},1/4),0,-4,{collide:false});
 prop(party,geometry('party-drinks',10,6,4,m=>{m.box(0,0,0,10,4,4,coral);m.box(0,4,0,10,5,4,wood);for(let x=1;x<10;x+=2)m.box(x,5,1,x+1,6,2,[lime,amber,pink][x%3]);}),13,-6);
 AF.addLight({x:party.x,y:party.y+5,z:party.z+2,color:0xff6ad5,intensity:1.6,range:20,kind:'street'});AF.addLight({x:party.x,y:party.y+4,z:party.z-6,color:0x5fd8ff,intensity:1.3,range:18,kind:'street'});
 // bonfire on the beach: a stone ring, logs, flames; log benches round it
 const bonfire=fun.bonfire=site('Serena Bonfire',-85,Z(719),6,6,1.75);
 prop(bonfire,geometry('bonfire',12,10,12,m=>{for(let x=0;x<12;x++)for(let z=0;z<12;z++){const d=Math.hypot(x-5.5,z-5.5);if(d>4.2&&d<5.8)m.set(x,0,z,rock);}m.box(3,0,5,9,1,7,wood);m.box(5,1,3,7,2,9,wood);for(let y=1;y<9;y++){const r=Math.max(0.6,2.6-y*0.3);for(let x=0;x<12;x++)for(let z=0;z<12;z++)if(Math.hypot(x-5.5,z-5.5)<r&&AF.hash3(x,y,z)<0.8-y*0.05)m.set(x,y,z,y<3?ember:fire);}}),0,0,{collide:false});
 const bench=geometry('log-bench',10,2,3,m=>{m.box(0,0,0,10,2,3,wood);});for(const [dx,dz,rot] of [[0,-4.5,0],[0,4.5,0],[-4.5,0,1],[4.5,0,1]])prop(bonfire,bench,dx,dz,{rot});
 AF.addLight({x:bonfire.x,y:bonfire.y+1.5,z:bonfire.z,color:0xff8a3a,intensity:1.8,range:16,kind:'street'});
 // beach volleyball: court lines (paint on the sand), net on two posts
 const court=fun.court=site('Serena Volleyball',-122,Z(709),10,6,1.5);
 prop(court,geometry('volley-lines',64,1,32,m=>{m.box(0,0,0,64,1,1,white);m.box(0,0,31,64,1,32,white);m.box(0,0,0,1,1,32,white);m.box(63,0,0,64,1,32,white);m.box(31,0,0,33,1,32,white);},1/4),0,0,{y:court.y+0.03,collide:false});
 prop(court,geometry('volley-net',2,20,36,m=>{for(const z of [0,35])m.box(0,0,z,2,20,z+1,grey);for(let y=11;y<19;y++)for(let z=1;z<35;z++)if((y+z)%2===0||y===18)m.set(1,y,z,net);},1/8),0,0,{collide:false});
 // umbrellas, loungers and towels along the south beach; hammocks by the beach bar; tiki torches on the boardwalk
 const lounger=geometry('lounger',3,3,5,m=>{m.box(0,1,0,3,2,5,white);m.box(0,2,0,3,3,2,mint);m.box(0,0,1,1,1,4,wood);m.box(2,0,1,3,1,4,wood);}),towel=geometry('towel',4,1,8,m=>{for(let z=0;z<8;z++)m.box(0,0,z,4,1,z+1,z%2?white:coral);},1/4),umbrellaB=geometry('umbrella-b',9,7,9,m=>{m.box(4,0,4,5,6,5,wood);for(let l=0;l<3;l++)m.box(l,4+l,l,9-l,5+l,9-l,l%2?white:blue);});
 let placed=0;for(let x=-200;x<=-140;x+=10){const z=Z(704)+(x%20?2:0),y=Math.round(O.h(x,z)*4)/4;if(y<0.8||y>3)continue;O.addProp(umbrellaB,x,y,z,0,{tag:'island:beach',collide:false});O.addProp(placed%2?towel:lounger,x+2,y+(placed%2?0.03:0),z+1.5,1,{tag:'island:beach',collide:false});placed++;}
 const hammock=geometry('hammock',26,10,4,m=>{for(const x of [0,25])m.box(x,0,1,x+1,10,3,wood);for(let x=1;x<25;x++){const y=Math.round(7-Math.sin(x/25*Math.PI)*3);m.box(x,y,0,x+1,y+1,4,x%3?coral:white);}},1/8);
 for(const [x,z] of [[-238,Z(676)],[-232,Z(684)]])O.addProp(hammock,x,Math.round(O.h(x,z)*4)/4,z,0,{tag:'island:beach',collide:false});
 const torch=geometry('tiki-torch',3,16,3,m=>{m.box(1,0,1,2,13,2,wood);m.box(0,12,0,3,13,3,dark);m.box(0,13,0,3,15,3,amber);m.set(1,15,1,amber);},1/8);
 for(let x=-210;x<=-112;x+=14)for(const z of [Z(674),Z(684)]){const y=Math.round(O.h(x,z)*4)/4;if(y>0.6)O.addProp(torch,x,y,z,0,{tag:'island:torch',collide:false});}
 // the swim raft off the party beach: floats, a deck, a ladder and a slide
 O.addProp(geometry('swim-raft',14,12,14,m=>{for(const x of [0,10])for(const z of [0,10])m.box(x,0,z,x+4,2,z+4,blue);m.box(0,2,0,14,3,14,wood);m.box(1,3,1,5,10,2,white);m.box(1,10,1,5,11,5,wood);for(let i=0;i<8;i++)m.box(1,10-i,5+i,5,11-i,6+i,yellow);for(let y=0;y<3;y++)m.box(9,y,13,12,y+1,14,grey);}),-30,-2.25,Z(758),0,{tag:'island:raft'});
 // jet-ski hire on the south beach: hut, sign, kayaks, a surfboard rack; four docks round the island (land point + outward direction)
 const hire=fun.hire=site('Serena Jet Skis',8,Z(721),6,4,1.75);
 openCanopy(hire,canopy('jetski-hut',yellow),0,0);sign(hire,'JET SKI HIRE',0,-2.6,hire.y+3.8,2);
 const kayak=geometry('kayak',3,2,12,m=>{m.box(0,0,1,3,1,11,coral);m.box(1,0,0,2,1,12,coral);m.box(1,1,4,2,2,7,dark);},1/4),board=geometry('surf-rack',12,9,3,m=>{m.box(0,0,1,12,1,2,wood);for(let x=1;x<12;x+=3)m.box(x,1,0,x+2,9,3,[coral,cyan,yellow,mint][(x/3)|0]);},1/4);
 for(let i=0;i<3;i++)prop(hire,kayak,-5+i*1.2,3.5,{collide:false});prop(hire,board,5,2,{collide:false});
 AF.addLight({x:hire.x,y:hire.y+3,z:hire.z,color:0xffd28a,intensity:1.1,range:12,kind:'street'});
 for(const [x,z,dx,dz] of [[8,Z(727),0,1],[-70,Z(471),0,-1],[-286,Z(600),-1,0]]){
  let ox=x,oz=z;for(let i=0;i<60&&O.h(ox,oz)>-1.9;i++){ox+=dx;oz+=dz;}
  fun.docks.push({land:[x-dx*1.5,z-dz*1.5],y:Math.max(0.5,Math.round(O.h(x-dx*1.5,z-dz*1.5)*4)/4),x:ox+dx*2,z:oz+dz*2,yaw:Math.atan2(dx,dz)});
 }
 // Moretti's cove: three skis moored along the dock (the heist's getaway), boarded from its deck
 const CV=I.cove;if(CV){const D=CV.dock,side=D.w/2+1.25;for(const [x,z,lx,lz] of [[D.x0+4.5,D.z-side,D.x0+4.5,D.z-0.6],[D.x0+8.5,D.z+side,D.x0+8.5,D.z+0.6],[D.x1+2.4,D.z,D.x1-0.6,D.z]])fun.docks.push({land:[lx,lz],y:D.y,x,z,yaw:Math.PI/2,cove:true});}
});
AF.onBuild('island-life',666,()=>{
 function path(name,points,count,mode='loop',speed=0.9){const dense=[];for(let index=0;index<points.length-(mode==='loop'?0:1);index++){const from=points[index],to=points[(index+1)%points.length],steps=Math.max(1,Math.ceil(Math.hypot(to[0]-from[0],to[1]-from[1])/1.5));for(let part=0;part<steps;part++){const x=AF.lerp(from[0],to[0],part/steps),z=AF.lerp(from[1],to[1],part/steps);dense.push([x,feetY(x,z)+0.1,z]);}}if(mode!=='loop'){const [x,z]=points.at(-1);dense.push([x,feetY(x,z)+0.1,z]);}const entry=AF.walkers.addPath(name,dense,{count,speed,mode,activeRadius:150});S.paths.push(entry);S.walkers+=count;}
 path('Serena promenade',[[-209,Z(679)],[-115,Z(679)]],14,'pingpong');path('Serena beach',[[-214,Z(686)],[-170,Z(695)],[-100,Z(695)]],12,'pingpong');path('Serena hotel guests',[[-194,Z(651)],[-146,Z(651)],[-146,Z(675)],[-194,Z(675)]],12);path('Landing villagers',[[-25,Z(486)],[-25,Z(500)],[-15,Z(500)],[-15,Z(486)]],12);path('Serena fishermen',[[-21,Z(430)],[-21,Z(456)]],6,'pingpong',0.5);
 const deckhand={skin:0xd7a078,hair:0x463629,top:{col:0x326e75},bottom:{col:0xf2efdf},yaw:0},concierge={skin:0xa77754,hair:0x252a29,top:{col:0xf2efdf},bottom:{col:0x326e75},yaw:Math.PI};
 AF.walkers.addPath('Serena deckhand',[[2,AF.surfaceBelow(2,250,4,8),250]],{count:1,speed:0,activeRadius:150,looks:[deckhand]}); AF.walkers.addPath('Serena concierge',[[-145,3,Z(644)]],{count:1,speed:0,activeRadius:150,looks:[concierge]});S.walkers+=2;
  AF.npc.spawn({id:'serena-deckhand',name:'Ellis',role:'Solace Belle deckhand',x:2,y:AF.surfaceBelow(2,250,4,8),z:250,visual:false,lines:[['The Solace Belle waits twenty-five seconds at each pier, then it is a '+Math.round(route.crossing/60*10)/10+' minute run out to Serena Isle. Open sea all the way.']]});
  AF.npc.spawn({id:'serena-concierge',name:'Alma',role:'Hotel Serena concierge',x:-145,y:3,z:Z(644),visual:false,lines:[['Welcome to Hotel Serena. The pool terrace faces the beach; the trail winds up to the crater rim and the falls are just past the bonfire. The airstrip is north of the hotel.']]});
 // a flyable Cub on the Serena apron (crashes tow it back here); the planes' approach guidance knows this strip too
  if(AF.planes.make){S.cub=AF.planes.make('cub',-140,Z(555),Math.PI);AF.planes.runways.push(I.airstrip);}
 const original=AF.sea.lighthouses[0];if(original?.beam){const beam=original.beam.clone();beam.position.set(S.light.x,S.light.y+20,S.light.z);beam.traverse(mesh=>{if(mesh.isMesh)mesh.frustumCulled=true;});AF.scene.add(beam);S.beam=beam;}
 // the people of the fun spots (shared walker batches): dancers + DJ, a bonfire circle, bar patrons, volleyball, swimmers, hire staff
 const rng=AF.rng(6060),tops=[0xff6f61,0x2ec4b6,0xffbf47,0x9b5de5,0xf15bb5,0x00bbf9,0x43aa8b,0xfee440],bottoms=[0x1d3557,0xf1faee,0xe76f51,0x264653,0xffffff];
 const look=(pose,yaw)=>{const l=AF.peopleKit.makeLook('traveler',rng()<0.5?'m':'f','adult',rng);l.top={...(l.top||{}),col:tops[(rng()*tops.length)|0]};l.bottom={...(l.bottom||{}),col:bottoms[(rng()*bottoms.length)|0]};l.pose=pose;l.yaw=yaw;return l;};
 const one=(name,x,y,z,l)=>{AF.walkers.addPath(name,[[x,y,z]],{count:1,speed:0,activeRadius:170,looks:[l]});S.walkers++;};
 const P=fun.party;for(let i=0;i<26;i++){const a=i*2.399,r=0.8+Math.sqrt(i/26)*3.9;one('Serena party '+i,P.x+Math.cos(a)*r*1.7,P.y+0.27,P.z-4+Math.sin(a)*r*1.05,look('dance',(rng()-0.5)*1.2));}
 one('Serena DJ',P.x,P.y+1,P.z+4.6,look('dance',Math.PI));
 const B=fun.bonfire;for(let i=0;i<8;i++){const a=i/8*Math.PI*2+0.3,x=B.x+Math.cos(a)*3.3,z=B.z+Math.sin(a)*3.3;one('Serena bonfire '+i,x,B.y,z,look('stand',Math.atan2(B.x-x,B.z-z)));}
 const bar=S.sites.find(site=>site.name==='Palm Beach Bar');if(bar)for(let i=0;i<5;i++){const x=bar.x-4+i*2;one('Serena bar '+i,x,feetY(x,bar.z+3.8)+0.05,bar.z+3.8,look('stand',Math.PI));}
 const C=fun.court;for(const [dx,lane] of [[-4.5,0],[-10.5,1],[4.5,2],[10.5,3]]){const x=C.x+dx*0.6,pts=[[x,C.y,C.z-3+lane*0.4],[x,C.y,C.z+3-lane*0.4]];AF.walkers.addPath('Serena volleyball '+lane,pts,{count:1,speed:1.5,mode:'pingpong',activeRadius:170,dwell:[{i:0,t:0.6+lane*0.3},{i:1,t:0.4+lane*0.2}],looks:[look('stand',0)]});S.walkers++;}
 AF.walkers.addPath('Serena swimmers',[[-62,-2.45,Z(748)],[-36,-2.45,Z(751)],[-10,-2.45,Z(747)]],{count:8,speed:0.45,mode:'pingpong',activeRadius:170,looks:[look(),look(),look(),look()]});S.walkers+=8;
 one('Serena hire staff',fun.hire.x+2,fun.hire.y,fun.hire.z-1,look('stand',Math.PI));
 // jet skis: the rideable four (one per dock) and three riders racing the coast (AI hulls follow their walker seats)
 JS.mesh=new THREE.InstancedMesh(skiGeo(),AF.mat.voxelInst,20);JS.mesh.name='island-jetskis';JS.mesh.count=0;JS.mesh.frustumCulled=false;JS.mesh.castShadow=true;JS.mesh.receiveShadow=true;JS.mesh.customDepthMaterial=AF.mat.depthInst;JS.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);JS.mesh.layers.set(31);AF.scene.add(JS.mesh);
 fun.docks.forEach((d,i)=>JS.skis.push(new JetSki(d,i)));
 const lap=[];for(let a=-50;a<=230;a+=3){const r=a*Math.PI/180;let s=1+Math.sin(r*5)*0.04,x=0,z=0;for(let i=0;i<30;i++){x=I.cx+Math.cos(r)*290*s;z=I.cz+Math.sin(r)*190*s;if(O.h(x,z)<-2.4)break;s+=0.03;}lap.push([x,-1.12,z]);}
 JS.riders=AF.walkers.addPath('Serena jet-ski riders',lap,{count:3,speed:16*AF.vehicles.SPEED_K*0.7,mode:'pingpong',activeRadius:420,looks:[look('ride',0),look('ride',0),look('ride',0)]});S.walkers+=3;
});
AF.onTick('island-light',334,(dt,time)=>{if(!S.beam)return;S.beam.visible=AF.time.night>0.2&&(AF.camera.position.x-S.light.x)**2+(AF.camera.position.z-S.light.z)**2<90000;if(S.beam.visible)S.beam.rotation.y=time*0.55+1.3;});
// ---------------------------------------------------------------- jet skis ('jetski' mode): W/S throttle, A/D steer, Shift burst, E hops off at a beach
const JS=S.jetski={skis:[],extra:[],cur:null,mesh:null,riders:null,cam:new THREE.Vector3(),want:new THREE.Vector3(),look:new THREE.Vector3(),camInit:false,seat:{x:0,y:0,z:0,yaw:0,roll:0,pitch:0,seatH:0.55,lean:0.35},bumpT:0};
const SEA=AF.PLAN.harbour.waterY,wet=(x,z)=>AF.W.groundY(x,z)<SEA-0.45&&!AF.solidAt(x,SEA+0.35,z);
function skiGeo(){const m=new AF.Model(9,9,26);for(let z=0;z<26;z++){const t=z>17?Math.min(4,Math.floor((z-17)/2)):0;m.box(t,0,z,9-t,z>19?3:2,z+1,white);}m.box(0,2,1,9,3,16,coral);m.box(2,3,4,7,4,13,dark);m.box(2,2,14,7,5,19,teal);m.box(0,5,15,9,6,16,dark);m.box(3,6,15,6,7,16,dark);return AF.meshModel(m,{vs:1/8,anchor:[0.5,0,0.5]});}
const skiY=(k,t)=>SEA-0.1+Math.sin(t*2.1+k.ph)*0.05+Math.sin(t*3.3+k.ph*2)*0.02*Math.min(1,Math.abs(k.v)/4);
const jm=new THREE.Matrix4(),jq=new THREE.Quaternion(),je=new THREE.Euler(0,0,0,'YXZ'),jp=new THREE.Vector3(),one1=new THREE.Vector3(1,1,1);
function skiAt(index,x,y,z,yaw,pitch,roll){jp.set(x,y,z);je.set(-pitch,yaw,roll,'YXZ');jq.setFromEuler(je);jm.compose(jp,jq,one1);JS.mesh.setMatrixAt(index,jm);}
// ride feel: nominal top speed 21.5 m/s (holds ~19.5 on throttle, ~24 on a burst; was 13.1 / 17 nominal, ~8.7 / 11.5 held),
// punchy thrust, carving lean, chop + swell to skip over on open water (airtime off crests at speed), spray from the pooled AF.fx
const SK={vmax:21.5,boost:1.28,acc:10.5,accB:13.5,g:9,pop:1.45,swell:0.46,drawR2:600*600};
// the surface the hull rides: three swell trains with sharp crests (grouped, so some crests stand taller) + a little chop over the
// flat sea (the flat water is the trough). Calm over the shelf near a shore (the floor slopes up within ~40 m of land). At ~19 m/s
// a big crest throws the hull (0.5-0.7 s air every few seconds), on a burst more often and longer; slowly you just ride them.
// skiOpen = how much swell a spot gets (the floor is voxel-stepped, so riders ease toward it rather than read it raw)
const skiOpen=(x,z)=>AF.smooth(1.2,2.7,SEA-AF.W.groundY(x,z));
function skiSea(x,z,t,open){
 if(!(open>0.001))return SEA-0.1;
 const p=x*0.62+z*0.78,q=z*0.56-x*0.83,r=z*0.95+x*0.31,
  a=Math.max(0,Math.sin(p*0.19-t*0.65)),ga=0.25+0.75*Math.max(0,Math.sin(q*0.05+p*0.021-t*0.3)),
  b=Math.max(0,Math.sin(q*0.21-t*0.7+2.1)),gb=0.25+0.75*Math.max(0,Math.sin(p*0.047-q*0.017-t*0.27+1.3)),
  e=Math.max(0,Math.sin(r*0.17+t*0.6+4.4)),ge=0.25+0.75*Math.max(0,Math.sin(q*0.039+r*0.012+t*0.22+2.6)),
  c=Math.max(0,Math.sin((x*0.95+z*0.31)*1.25-t*2.9+4.1));
 return SEA-0.1+open*(SK.swell*Math.max(ga*a*a*a,gb*b*b*b,ge*e*e*e)+0.012*c);
}
// spray from the pooled AF.fx smoke points (dithered, no new draws or programs): a rooster tail from the jet and fans off a carve.
// The wake + hull foam on the water come from the water shader (62) through the ski's hull proxy. Particles carry part of the ski's
// own speed (the jet leaves at about hull speed), so the plume hangs behind the stern instead of streaking away; each one starts at
// a random point of the frame interval so a low frame rate draws a stream, not clumps.
function spray(k,dt){
 const P=AF.fx&&AF.fx.smoke,G=AF.fx&&AF.fx.glow,cp=AF.camera.position;if(!P||!(dt>0)||(k.x-cp.x)**2+(k.z-cp.z)**2>25600)return;
 const v=Math.abs(k.v),air=k===JS.cur?k.air>0:k.y>SEA+0.25;if(v<2.5||air){k.sprA=k.sprS=0;return;}
 const hx=Math.sin(k.yaw),hz=Math.cos(k.yaw),rx=-hz,rz=hx,mob=AF.MOBILE?0.5:1,sp=AF.smooth(3,22,v),N=AF.time.night||0,L=0.98-0.7*N,cr=0.93*L,cg=0.96*L,cb=L,fv=k.v*0.55,mist=0.2-0.15*N;
 // droplets (dithered smoke points) and, every other one, a soft additive mist puff (glow points) round the same stream
 k.sprA+=dt*150*sp*mob;
 while(k.sprA>=1){k.sprA--;const r=Math.random(),j=Math.random()-0.5,f=Math.random()*dt,vx=hx*(fv-1-r*1.5)+rx*j*2.4,vy=4+v*0.18+r*1.6,vz=hz*(fv-1-r*1.5)+rz*j*2.4,x=k.x-hx*1.3+rx*j*0.25+vx*f,y=k.y+0.2+vy*f,z=k.z-hz*1.3+rz*j*0.25+vz*f;
  if(G&&r<0.35)G.spawn(x,y,z,vx,vy*0.85,vz,0.9+r,0.55+v*0.02,2.2,-6,mist,mist*1.03,mist*1.08);
  else P.spawn(x,y,z,vx,vy,vz,0.7+r*0.5,0.3+v*0.014,1.1+r*0.7,-9.8,cr,cg,cb);}
 const turn=k===JS.cur?k.w:k.roll*2,carve=Math.min(1,Math.abs(turn))*AF.smooth(5,18,v),side=turn>0?-1:1;
 k.sprS+=dt*90*carve*mob;
 while(k.sprS>=1){k.sprS--;const r=Math.random(),out=2.5+v*0.2+r*1.6,fw=v*0.6+(Math.random()-0.5),f=Math.random()*dt,vx=rx*side*out+hx*fw,vy=1.8+r*2.2+v*0.07,vz=rz*side*out+hz*fw,x=k.x+hx*(r*0.6-0.2)+rx*side*0.55+vx*f,z=k.z+hz*(r*0.6-0.2)+rz*side*0.55+vz*f;
  if(G&&r<0.3)G.spawn(x,k.y+0.15,z,vx,vy,vz,0.7+r,0.5,1.8,-6,mist,mist*1.03,mist*1.08);
  else P.spawn(x,k.y+0.12,z,vx,vy,vz,0.55+r*0.4,0.28,1.1+r*0.5,-9.8,cr,cg,cb);}
}
// a slap of water round the hull (landings, the shallows)
function splashAt(k,impact){
 const P=AF.fx&&AF.fx.smoke;if(!P)return;
 const n=Math.min(30,6+impact*6)*(AF.MOBILE?0.5:1),L=0.94-0.66*(AF.time.night||0),hx=Math.sin(k.yaw),hz=Math.cos(k.yaw),f=k.v*0.4;
 for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,r=Math.random(),out=1.5+impact*0.6+r*1.5;
  P.spawn(k.x+Math.sin(a)*0.6,SEA+0.05,k.z+Math.cos(a)*0.9,Math.sin(a)*out+hx*f,1.8+impact*0.7+r*2,Math.cos(a)*out+hz*f,0.6+r*0.5,0.3,1.1,-9.8,0.86*L,0.91*L,0.95*L);}
}
AF.onTick('island-jetskis',307,(dt,t)=>{
 const M=JS.mesh;if(!M)return;const cp=AF.camera.position;
 let n=0;
 // each ski draws (and coasts) within 600 m of the camera: they can be left anywhere, the liner's pontoon included
 for(const k of JS.skis){
  const mine=JS.cur===k;if(!mine&&(k.x-cp.x)**2+(k.z-cp.z)**2>SK.drawR2)continue;
  if(!mine&&k.net==null)k.drift(dt);
  skiAt(n++,k.x,mine||k.net!=null?k.y:skiY(k,t),k.z,k.yaw,k.pitch,k.roll);
  const W=k.wake;if(W&&(W.position.x!==k.x||W.position.z!==k.z||W.rotation.y!==k.yaw)){W.position.set(k.x,SEA,k.z);W.rotation.y=k.yaw;W.updateMatrixWorld();}
  if(mine||k.net!=null)spray(k,dt);
 }
 const R=JS.riders;if(R&&R.active)for(const a of R.actors)skiAt(n++,a.x,SEA-0.1+Math.sin(t*2.6+a.ph)*0.06,a.z,a.yaw,0.08,Math.sin(t*0.9+a.ph)*0.12);
 // hulls other systems steer (81-heist's chasers): {x, y, z, yaw, pitch, roll, on}
 for(const e of JS.extra)if(e.on&&n<JS.mesh.instanceMatrix.count)skiAt(n++,e.x,e.y,e.z,e.yaw,e.pitch||0,e.roll||0);
 if(!n&&!M.count)return;
 M.count=n;M.layers.set(n?0:31);if(n)M.instanceMatrix.needsUpdate=true;
});
// a rideable jet ski (AF.Vehicle): boarded from its dock, or wherever it was left (the prompt follows it, reaching up the beach)
class JetSki extends AF.Vehicle{
 constructor(d,i){super({name:'Serena jet ski',x:d.x,z:d.z,yaw:d.yaw});this.y=SEA;this.w=0;this.ph=i*1.7;this.home=d;
  this.vy=0;this.sy=SEA-0.1;this.air=0;this.rpm=0;this.load=0;this.land=0;this.sprA=0;this.sprS=0;this.wt=0;this.open=0;
  // an invisible hull proxy (never in the scene, never drawn): the water shader (62) gives it hull foam + a Kelvin wake (uniforms only)
  this.wake=new THREE.Mesh(JS.wakeGeo||(JS.wakeGeo=new THREE.BoxGeometry(0.9,0.5,2.6)));this.wake.name='jetski-wake';this.wake.position.set(this.x,SEA,this.z);this.wake.rotation.y=this.yaw;this.wake.updateMatrixWorld();
  if(AF.water2&&AF.water2.addBoat)AF.water2.addBoat(this.wake);
  this.attach({label:'Ride a jet ski',r:5,prio:0.3,dist:(px,pz)=>{const it=this.interact;return Math.min(Math.hypot(it.x-px,it.z-pz),Math.max(0,Math.hypot(this.x-px,this.z-pz)-1));},can:()=>AF.mode==='walk'&&JS.cur!==this&&this.net==null,act:()=>AF.setMode('jetski',{ski:this})});this.sync();}
 // the prompt: at its dock's landing while berthed, else on the ski with a wide reach that ignores height (a beach above it, a swimmer
 // beside it); dist also measures to the hull, so a swimmer at a berthed ski can climb back on
 sync(){const it=this.interact,d=this.home;if(Math.hypot(this.x-d.x,this.z-d.z)<4){it.x=d.land[0];it.z=d.land[1];it.y=undefined;it.r=5;}else{it.x=this.x;it.z=this.z;it.y=undefined;it.r=11;}}
 // coasting with nobody aboard
 drift(dt){if(Math.abs(this.v)<=0.05)return;this.v*=Math.exp(-dt*0.9);const nx=this.x+Math.sin(this.yaw)*this.v*dt,nz=this.z+Math.cos(this.yaw)*this.v*dt;if(wet(nx,nz)){this.x=nx;this.z=nz;}else this.v=0;this.roll*=Math.exp(-dt*2);this.pitch*=Math.exp(-dt*2);this.sync();}
 step(dt,inp){
  const air=this.air>0,top=SK.vmax*SK.boost,vmax=SK.vmax*(inp.boost?SK.boost:1),thr=inp.thr,steer=inp.steer,av=Math.abs(this.v),x=Math.max(0,this.v)/vmax;
  // the jet only bites with the nozzle in the water; thrust falls off with the square of the speed fraction (a punchy launch)
  if(!air){
   if(thr>0)this.v+=thr*(inp.boost?SK.accB:SK.acc)*Math.max(0,1-x*x)*dt;else if(thr<0)this.v+=thr*(this.v>0?9:2.5)*dt;
   this.v-=this.v*0.05*dt+(thr?0:Math.sign(this.v)*Math.min(Math.abs(this.v),(0.9+av*0.06)*dt));
   this.v-=Math.sign(this.v)*Math.min(Math.abs(this.v),Math.abs(this.w)*AF.smooth(6,20,av)*1.4*dt);   // a hard carve scrubs speed
  }else this.v-=this.v*0.02*dt;
  this.v=AF.clamp(this.v,-4,top);
  this.w+=(steer-this.w)*Math.min(1,dt*6);this.yaw-=this.w*(0.55+Math.min(1,av/7)*1.25)*(1-0.22*AF.smooth(16,26,av))*(air?0.25:1)*dt*(this.v<-0.2?-1:1);
  const hx=Math.sin(this.yaw),hz=Math.cos(this.yaw),s=this.v<0?-1:1,nx=this.x+hx*this.v*dt,nz=this.z+hz*this.v*dt,Bd=AF.PLAN.world.bounds;
  JS.bumpT-=dt;this.hitT=(this.hitT||0)-dt;
  if(wet(nx+hx*1.8*s,nz+hz*1.8*s)&&wet(nx,nz)&&nx>Bd.x0+20&&nx<Bd.x1-20&&nz>Bd.z0+20&&nz<Bd.z1-20){this.x=nx;this.z=nz;}
  else{
  const hit=Math.abs(this.v);if(hit>4&&JS.bumpT<=0){AF.emit('toast','Bump! Too shallow \u2014 back out, or hop off with E.');JS.bumpT=3;}
   if(hit>3&&this.hitT<=0){this.hitT=0.6;splashAt(this,hit*0.3);if(AF.camfx)AF.camfx.shake(Math.min(0.06,hit*0.004),0.45,9);if(AF.audio)AF.audio.play('splash',{x:this.x,y:SEA,z:this.z,vol:Math.min(1,0.3+hit*0.04)});}
   this.v*=-0.3;
  }
  // riding the chop: glued to the surface while it rises, ballistic once it falls away faster than gravity (crests at speed)
  this.open+=(skiOpen(this.x,this.z)-this.open)*Math.min(1,dt*1.5);
  const sea=skiSea(this.x,this.z,AF.clock.t,this.open),sr=AF.clamp((sea-this.sy)/Math.max(dt,1e-3),-6,6);this.sy=sea;
  this.vy-=SK.g*dt;this.y+=this.vy*dt;
  if(this.y<=sea){
   if(this.air>0.08){const imp=sr-this.vy;if(imp>0.8)this.land=Math.max(this.land,imp);}
   this.air=0;this.y=sea;this.vy=sr;this.wt+=dt;
  }else{if(!this.air&&this.vy>0.8&&this.wt>0.15)this.vy=Math.min(4.5,this.vy*SK.pop);if(!this.air)this.wt=0;this.air+=dt;}   // the pop once per crest, whatever the frame rate
  const plane=AF.smooth(3,9,av)*(1-0.45*AF.smooth(12,22,av)),slope=Math.atan(AF.clamp((this.air>0?this.vy:sr)/Math.max(4,av),-0.4,0.4));
  const want=this.air>0?slope*0.8:0.02+plane*0.09+slope*0.9+(thr>0?0.035*Math.max(0,1-x):0);
  this.pitch+=(want-this.pitch)*Math.min(1,dt*(this.air>0?2.5:6));
  if(!this.air)this.roll+=(this.w*AF.smooth(1.5,14,av)*0.5-this.roll)*Math.min(1,dt*5);
  // engine revs: load follows throttle + speed, the jet screams when it leaves the water
  const rw=this.air>0?(thr>0?1.1:0.5):0.16+0.84*Math.max(Math.max(0,this.v)/top*1.08,thr>0?0.35+0.45*thr*(1-x*0.5):0);
  this.rpm+=(rw-this.rpm)*Math.min(1,dt*(rw>this.rpm?6:2.5));this.load=!this.air&&thr>0?Math.max(0,1-x):0;
  this.sync();
 }
}
const skiCam=new AF.Vehicle.Chase();
AF.modes.jetski={
 enter(o={}){const k=o.ski;if(!k){AF.setMode('walk');return;}JS.cur=k;k.v=0;k.w=0;k.vy=0;k.air=0;k.land=0;k.open=skiOpen(k.x,k.z);k.sy=skiSea(k.x,k.z,AF.clock.t,k.open);k.y=k.sy;skiCam.set({dist:6.4,height:1.6,ahead:2,shadow:50,floor:()=>SEA+1.2});AF.player.setVisible(true);AF.emit('toast',AF.touch?'Push the stick to ride. Tap EXIT to hop off.':'Jet ski! W throttle, A/D steer, Shift for a burst, E to hop off (into the water if no beach is near).');AF.emit('hint',AF.touch?'':'W/S throttle \u00b7 A/D steer \u00b7 Shift burst \u00b7 right mouse / Z aim \u00b7 E hop off');},
 exit(){const k=JS.cur;JS.cur=null;if(k){k.vy=0;k.air=0;k.land=0;k.rpm=0;k.y=SEA;k.sync();}AF.PL.seat=null;AF.emit('hud',{speed:null});AF.emit('hint','');},
 update(dt){
  const k=JS.cur;if(!k)return;dt=Math.min(dt,0.05);
  const inp=AF.Vehicle.input();k.step(dt,inp);
  const hx=Math.sin(k.yaw),hz=Math.cos(k.yaw),seat=JS.seat;seat.x=k.x-hx*0.15;seat.y=k.y-0.05;seat.z=k.z-hz*0.15;seat.yaw=k.yaw;seat.roll=k.roll;seat.pitch=-k.pitch;AF.PL.seat=seat;
  // the camera eases out with speed; shake, wind streaks and a wider view sell the pace
  const av=Math.abs(k.v),sp=AF.smooth(6,24,av),CF=AF.camfx;skiCam.dist0=6.4+sp*2.4;
  skiCam.update(dt,k.x,k.y,k.z,k.yaw,0,-k.roll*0.6);
  if(CF){CF.rumble('ski',k.air>0?0.0012:0.0007+sp*0.0045,k.air>0?5:9+sp*7);CF.wind(AF.smooth(12,25,av)*0.6);CF.fov(sp*7);}
  if(k.land){const L=k.land;k.land=0;k.v*=1-Math.min(0.08,L*0.016);splashAt(k,L);
   if(CF)CF.shake(Math.min(0.045,0.006+L*0.007),0.3+Math.min(0.3,L*0.05),9);
   if(AF.audio)AF.audio.play(L>2.2?'splash':'step_water',{x:k.x,y:SEA,z:k.z,vol:Math.min(1,0.35+L*0.15),rate:0.9+Math.random()*0.2});}
  AF.Vehicle.hud(k.v,k.name,(inp.boost?' \u00b7 burst':'')+(k.air>0.25?' \u00b7 air!':'')+' \u00b7 E hop off');
  // hop off anywhere: onto a beach / jetty within 10 m, else into the water beside the ski (it stops and floats there to swim back to)
  if(inp.exit){const spot=AF.Vehicle.landing(k.x,k.z,SEA+0.35),hx2=Math.sin(k.yaw),hz2=Math.cos(k.yaw);k.v=0;k.w=0;
   if(spot)AF.setMode('walk',{x:spot.x,y:spot.y,z:spot.z,yaw:k.yaw});
   else{AF.setMode('walk',{x:k.x-hz2*1.4,y:SEA,z:k.z+hx2*1.4,yaw:k.yaw});if(AF.audio)AF.audio.play('splash',{x:k.x,y:SEA,z:k.z,vol:0.5});}}
 }
};
function dockY(dock){const point=dock?route.islandPier:route.cityPier;return AF.surfaceBelow(point[0],point[1],4,8);}
function land(dock){const point=dock?route.islandPier:route.cityPier;AF.setMode('walk',{x:point[0],y:dockY(dock),z:point[1],yaw:dock?0:Math.PI,snap:true});AF.emit('toast',dock?'Welcome to Serena Isle':'Welcome back to Port Solace');}
// the Solace Belle keeps a timetable on the shared world clock (01-core): dwell at the city pier, cross, dwell at the island, cross back.
// F.off is only ever non-zero in tests (F.reset(dock) puts her alongside that dock; F.reset() restores the shared schedule).
F.off=0;F.P=2*(route.dwell+route.crossing);
F.reset=dock=>{F.waiting=-1;F.acc=0;if(dock==null){F.off=0;}else{const P=F.P,want=dock?route.dwell+route.crossing:0;F.off=((want-AF.clock.w)%P+P)%P;}F.at(AF.clock.w);if(AF.harbour.ferry)place(AF.clock.w);return F;};
F.at=w=>{const D=route.dwell,X=route.crossing,P=F.P,tau=((w+F.off)%P+P)%P,ship=AF.harbour.ferry;
 if(tau<D||(tau>=D+X&&tau<2*D+X)){const d=tau<D?0:1;F.dock=F.from=d;F.to=1-d;F.elapsed=0;F.speed=0;if(ship){ship.st.dwell=(d?2*D+X:D)-tau;ship.st.v=0;}}
 else{const back=tau>=2*D+X;F.dock=-1;F.from=back?1:0;F.to=1-F.from;F.elapsed=tau-(back?2*D+X:D);F.speed=F.len*6*(F.elapsed/X)*(1-F.elapsed/X)/X;if(ship){ship.st.dwell=0;ship.st.v=F.speed;}}};
F.board=dock=>{if(AF.mode==='ferry-ride')return;F.waiting=dock;if(F.dock===dock){F.waiting=-1;AF.setMode('ferry-ride');}else AF.emit('toast','Solace Belle is on her way.');};
// skipping takes the rider across at once (never during a mission that forbids travel); the boat itself keeps the shared timetable
F.skip=()=>{if(!F.rider||AF.stream.traveling)return;if(AF.noTravel&&AF.noTravel()){AF.emit('toast','No skipping the crossing right now \u2014 enjoy the ride.');return;}const dock=F.dock>=0?1-F.dock:F.to;AF.stream.travel({label:dock?'Serena Isle':'Port Solace',go:()=>land(dock)});};
function place(time){
 const mesh=AF.harbour.ferry.mesh,progress=F.dock<0?AF.smooth(0,1,F.elapsed/route.crossing):0,start=route.path[F.from],end=route.path[F.to];
 F.x=F.dock<0?AF.lerp(start[0],end[0],progress):route.path[F.dock][0];F.z=F.dock<0?AF.lerp(start[1],end[1],progress):route.path[F.dock][1];
 F.y=AF.PLAN.harbour.waterY-1+(F.dock<0?Math.sin(time*0.8)*0.06:0);F.yaw=Math.atan2(end[0]-start[0],end[1]-start[1]);
 mesh.position.set(F.x,F.y,F.z);mesh.rotation.set(0,F.yaw,F.dock<0?Math.sin(time*0.6)*0.012:0);mesh.castShadow=(AF.camera.position.x-F.x)**2+(AF.camera.position.z-F.z)**2<6400;
}
F.update=(dt,time)=>{
 const ship=AF.harbour.ferry;if(!ship)return;
 if(F.waiting>=0&&(AF.mode!=='walk'||Math.hypot(AF.player.x-(F.waiting?route.islandPier:route.cityPier)[0],AF.player.z-(F.waiting?route.islandPier:route.cityPier)[1])>7))F.waiting=-1;
 const wasDock=F.dock;F.at(time);
 if(F.dock>=0&&F.waiting===F.dock){F.waiting=-1;AF.setMode('ferry-ride');}
 if(F.dock>=0&&wasDock<0){place(time);if(F.rider)land(F.dock);}
 F.acc+=dt;if(F.rider||F.acc>=0.25||(AF.camera.position.x-F.x)**2+(AF.camera.position.z-F.z)**2<90000){place(time);F.acc=0;}
 if(F.cityPrompt){F.cityPrompt.label=F.dock===0?'Board the ferry to Serena Isle':'Wait for the ferry to Serena Isle';F.islandPrompt.label=F.dock===1?'Board the ferry to Port Solace':'Wait for the ferry to Port Solace';}
};
AF.modes['ferry-ride']={
 enter(){F.rider=true;AF.interactTarget=ridePrompt;AF.player.setVisible(false);AF.PL.seat=null;AF.emit('hint','Solace Belle');},
 exit(){F.rider=false;AF.interactTarget=null;AF.player.setVisible(true);AF.emit('hint','');},
 update(dt){
  if(AF.ui?.modalOpen())return;
  if(AF.input.hit('Space')){F.skip();return;}if(AF.input.hit('KeyE')&&F.dock>=0){land(F.dock);return;}
  const player=AF.player;player.x=player.body.x=F.x;player.y=player.body.y=F.y+7;player.z=player.body.z=F.z;player.body.vy=0;
  const sn=Math.sin(F.yaw),cs=Math.cos(F.yaw);chase.set(F.x-sn*32+cs*15,F.y+17,F.z-cs*32-sn*15);AF.camera.position.lerp(chase,1-Math.exp(-dt*3));target.set(F.x,F.y+4,F.z);AF.camTarget.copy(target);AF.camera.lookAt(target);AF.shadowFocus.set(F.x,0,F.z);
    rideHud.speed=F.speed*2.237;rideHud.car=F.to?'Solace Belle to Serena Isle':'Solace Belle to Port Solace';AF.emit('hud',rideHud);
 }
};
AF.onBuild('island-ferry',675,()=>{
 F.reset();
 const decorative=AF.sea.ships.find(ship=>ship.name==='island ferry');if(decorative){AF.scene.remove(decorative.grp);AF.sea.ships.splice(AF.sea.ships.indexOf(decorative),1);}
 // yachts lap the bay in whole fractions of the ferry cycle, timed to sail through her lane (x -50..30) only while she is far out
 // (she is near their lane, z < 400, for the first / last F.nearT seconds of a crossing): no runtime give-way, so every co-op
 // player sees the same boats
 let near=0;for(let e=0;e<=route.crossing;e+=0.5){if(route.path[0][1]+(route.path[1][1]-route.path[0][1])*AF.smooth(0,1,e/route.crossing)>400)break;near=e+0.5;}F.nearT=near;
 const lo=route.dwell+near,hi=F.P-near;
 for(let index=0;index<AF.land.yachts.length;index++){const y=AF.land.yachts[index],m=index%2?1:2,period=F.P/m,v=1400/period,half=40/v+2,span=Math.max(0,hi-lo-2*half-(m-1)*period),tc=lo+half+span*((index*0.37+0.15)%1);y.z=318+index*12;y.v=(y.v<0?-1:1)*v;y.x0=-10-y.v*tc;}
 for(const dock of [0,1]){const point=dock?route.islandPier:route.cityPier,prompt=AF.addInteract({x:point[0],y:dockY(dock)+1,z:point[1],r:4,prio:0.7,label:'Board the ferry',can:()=>AF.mode==='walk',act:()=>F.board(dock)});if(dock)F.islandPrompt=prompt;else F.cityPrompt=prompt;}
});
AF.onTick('island-ferry',145,F.update);
AF.test('island: yachts never sail through the ferry lane while she crosses',()=>{let bad=0,checked=0;const saved=F.off;F.off=0;try{for(let t=0;t<F.P*20;t+=0.5){F.at(t);if(F.dock>=0||(F.from===0?F.elapsed>F.nearT:F.elapsed<route.crossing-F.nearT))continue;checked++;for(const y of AF.land.yachts){const x=((y.x0+y.v*t+700)%1400+1400)%1400-700;if(x>-50&&x<30)bad++;}}}finally{F.off=saved;F.at(AF.clock.w);}return{ok:!bad&&checked>0,info:bad+' conflicting of '+checked+' samples near the lane over '+Math.round(F.P*20)+' s (near '+F.nearT+' s)'};});
S.hotelWalk=[[-20,Z(424)],[-20,Z(478)],[-20,Z(514)],[-90,Z(514)],[-130,Z(580)],[-145,Z(610)],[-145,Z(651)]];
AF.test('island: sites have solid colliders and beach palms',()=>{const names=['Hotel Serena',"Fisher's Landing",'Serena Point Light','Serena Airstrip','Crater Lookout'],missing=names.filter(name=>!S.sites.find(site=>site.name===name)?.props.some(prop=>prop.col));return{ok:!missing.length&&S.palms>=100&&S.walkers<=120,info:S.palms+' palms, '+S.walkers+' actors, missing '+missing.join(',')};});
AF.test('island: pier to hotel walk is unobstructed',()=>{let blocked=0,samples=0;const hits=[];for(let index=1;index<S.hotelWalk.length;index++){const from=S.hotelWalk[index-1],to=S.hotelWalk[index],steps=Math.ceil(Math.hypot(to[0]-from[0],to[1]-from[1])/0.5);for(let part=0;part<=steps;part++){const x=AF.lerp(from[0],to[0],part/steps),z=AF.lerp(from[1],to[1],part/steps),y=feetY(x,z);samples++;if(AF.boxBlocked(x,y+0.05,z,0.3,1.7)){blocked++;if(hits.length<5)hits.push([x,y,z]);}}}return{ok:!blocked,info:blocked+'/'+samples+' blocked '+JSON.stringify(hits)};});
AF.test('island: party, bonfire, volleyball and jet-ski hire are furnished and lit',()=>{
 const spots=[fun.party,fun.bonfire,fun.court,fun.hire],bare=spots.filter(site=>!site||!site.props.length).length,lit=AF.lights.filter(light=>spots.some(site=>site&&Math.hypot(light.x-site.x,light.z-site.z)<12)).length;
 const dancers=AF.walkers.paths.filter(path=>/^Serena party/.test(path.name)&&path.actors[0].look.pose==='dance').length;
 const pub=fun.docks.filter(d=>!d.cove),cove=fun.docks.filter(d=>d.cove);
 return{ok:!bare&&lit>=4&&dancers>=20&&pub.length===3&&cove.length===3&&pub.every(d=>O.h(d.x,d.z)<-1.9&&O.h(d.land[0],d.land[1])>-1.25)&&cove.every(d=>O.h(d.x,d.z)<-1.9&&Math.abs(AF.surfaceBelow(d.land[0],d.land[1],d.y+1,3)-d.y)<0.3),info:'bare '+bare+', lights '+lit+', dancers '+dancers+', docks '+JSON.stringify(fun.docks.map(d=>[Math.round(d.x),Math.round(d.z),+O.h(d.land[0],d.land[1]).toFixed(1)]))};
});
AF.test('island: jet ski rides on open water, bumps off the shallows, hops off at a beach',()=>{
 const k=JS.skis[0];if(!k)return{ok:false,info:'no jet skis'};
 const I=AF.input,saved={mode:AF.mode,x:AF.player.x,y:AF.player.y,z:AF.player.z,yaw:AF.player.yaw},home={x:k.x,z:k.z,yaw:k.yaw},cam=AF.camera.position.clone(),modal=AF.ui&&AF.ui.modalOpen;
 let wetAll=true,moved=0,stopped=false,landed=false,reboard=false;
 try{
  if(AF.ui)AF.ui.modalOpen=()=>false;
  AF.setMode('jetski',{ski:k});k.yaw=0;
  I.down.clear();I.down.add('KeyW');for(let f=0;f<150;f++){AF.modes.jetski.update(1/30);if(!wet(k.x,k.z))wetAll=false;}moved=Math.hypot(k.x-home.x,k.z-home.z);
  k.yaw=Math.PI;for(let f=0;f<900&&!stopped;f++){const before=k.z;AF.modes.jetski.update(1/30);if(!wet(k.x,k.z))wetAll=false;if(f>30&&Math.abs(k.z-before)<0.01)stopped=true;}
  I.down.clear();for(let f=0;f<60;f++)AF.modes.jetski.update(1/30);
  I.pressed.add('KeyE');AF.modes.jetski.update(1/30);I.pressed.clear();landed=AF.mode==='walk'&&AF.player.y>SEA+0.3;
  // the ski stays where it was left and its prompt follows it: board it again from the beach
  const it=k.interact;reboard=landed&&Math.hypot(it.x-AF.player.x,it.z-AF.player.z)<=it.r&&it.can();if(reboard){it.act();reboard=AF.mode==='jetski'&&JS.cur===k;}
 }finally{if(AF.ui)AF.ui.modalOpen=modal;I.down.clear();I.pressed.clear();k.x=home.x;k.z=home.z;k.yaw=home.yaw;k.v=0;AF.setMode(saved.mode==='walk'?'walk':'aerial',saved);k.sync();AF.camera.position.copy(cam);}
 return{ok:wetAll&&moved>20&&stopped&&landed&&reboard,info:'moved '+moved.toFixed(0)+' m, stayed wet '+wetAll+', stopped at the shallows '+stopped+', hopped off '+landed+', boarded again '+reboard};
});
AF.test('island: Cub runway is flat and clear for takeoff',()=>{const strip=I.airstrip;let lo=Infinity,hi=-Infinity,hits=0;for(let x=strip.x0+3;x<=strip.x1-3;x+=2)for(const dz of [-8,0,8]){const y=AF.W.groundY(x,strip.z+dz);lo=Math.min(lo,y);hi=Math.max(hi,y);if(AF.boxBlocked(x,y+0.1,strip.z+dz,1,2))hits++;}return{ok:strip.x1-strip.x0>=300&&hi-lo<=0.25&&!hits,info:(strip.x1-strip.x0)+' m, elevation '+lo+'..'+hi+', obstructions '+hits};});
AF.test('island: island walkers stay on clear surfaces',()=>{const hits=[];for(const path of S.paths)for(const point of path.points)if(AF.boxBlocked(point[0],point[1]+0.1,point[2],0.18,1.4)&&hits.length<8)hits.push({path:path.name,point});return{ok:!hits.length&&S.walkers<=120,info:JSON.stringify(hits)};});
AF.test('island: sea routes clear terrain and yield to ferry lane',()=>{let dry=0,samples=0;for(const ship of AF.sea.ships)for(let index=0;index<ship.route.N;index+=2){const x=ship.route.pts[index*2],z=ship.route.pts[index*2+1];samples++;if(O.h(x,z)>-1.25)dry++;}for(const yacht of AF.land.yachts)for(let x=-700;x<=700;x+=20){samples++;if(O.h(x,yacht.z+6)>-1.25)dry++;}return{ok:!dry&&AF.sea.ships.every(ship=>ship.name!=='island ferry'),info:dry+'/'+samples+' dry route samples; ornamental ferry removed, yachts hold outside lane during crossing'};});
// the island kit for 44-key (Corsair Key): the same cached, LOD'd prop models, pads and palette
AF.test('island: smugglers\u2019 tunnel walks end to end under a roof; posts, routes, cache and cove skis are usable',()=>{
 const H=S.heist;if(!H)return{ok:false,info:'no heist spots'};
 const clear=p=>{let g=-1e9;for(const dx of [-0.3,0,0.29])for(const dz of [-0.3,0,0.29])g=Math.max(g,AF.W.groundY(p[0]+dx,p[2]+dz));return!AF.boxBlocked(p[0],g+0.05,p[2],0.3,1.7);};
 const body={x:H.tunnelEntry.x,y:H.tunnelEntry.y,z:H.tunnelEntry.z,vy:0,r:0.3,h:1.7,onGround:true};let stuck=0,roofed=0;
 for(const p of [...H.tunnel,[H.caveExit.x+2,H.caveExit.y,H.caveExit.z],[H.cove.x+3,H.cove.y,H.cove.z]]){for(let k=0;k<240;k++){const dx=p[0]-body.x,dz=p[2]-body.z,d=Math.hypot(dx,dz);if(d<0.35)break;const sp=Math.min(d,0.15);AF.moveBody(body,dx/d*sp,dz/d*sp,1/30,{step:0.55});}if(Math.hypot(p[0]-body.x,p[2]-body.z)>0.6)stuck++;}
 for(const p of H.tunnel.slice(2,-2))if([2.9,3.6,4.6,6,7.5,9].some(h=>AF.solidAt(p[0],p[1]+h,p[2])))roofed++;
 const posts=H.guardPosts.filter(p=>!clear([p.x,p.y,p.z])).length,routes=H.guardRoutes.reduce((n,r)=>n+r.filter(p=>!clear(p)).length,0),stand=clear([H.cacheStand.x,H.cacheStand.y,H.cacheStand.z]);
 const skis=H.skis.filter(k=>O.h(k.x,k.z)<-1.9).length,len=H.length;
 return{ok:!stuck&&roofed===H.tunnel.length-4&&!posts&&!routes&&stand&&skis>=2&&len>=150&&len<=250&&!!H.kit&&!!S.spots.strip,info:Math.round(len)+' m, stuck '+stuck+', roofed '+roofed+'/'+(H.tunnel.length-4)+', blocked posts '+posts+' / route points '+routes+', cache stand '+stand+', wet skis '+skis};
});
S.kit={geometry,block,site,prop,sign,cottage,canopy,openCanopy,paint,cache,col:{white,mint,coral,teal,wood,rock,gold,dark,win,glow}};
AF.test('island: ferry round trip and safe pier height',()=>{
 const saved={mode:AF.mode,x:AF.player.x,y:AF.player.y,z:AF.player.z,yaw:AF.player.yaw},rows=[];
 try{for(const dock of [0,1]){F.reset(dock);const point=dock?route.islandPier:route.cityPier;AF.setMode('walk',{x:point[0],y:dockY(dock),z:point[1],snap:true});F.board(dock);let t=AF.clock.w,steps=0;while(AF.mode==='ferry-ride'&&steps++<Math.ceil((route.dwell+route.crossing)*2)+20){t+=0.5;F.update(0.5,t);}const end=dock?route.cityPier:route.islandPier;rows.push(AF.mode==='walk'&&Math.hypot(AF.player.x-end[0],AF.player.z-end[1])<0.5&&Math.abs(AF.player.y-dockY(1-dock))<0.1&&!AF.boxBlocked(AF.player.x,AF.player.y+0.05,AF.player.z,0.3,1.7));}return{ok:rows.every(Boolean),info:'outbound/return '+rows.join('/')};}
 finally{F.reset();AF.setMode(saved.mode==='walk'?'walk':'aerial',saved);}
});
}catch(error){AF.partError('44-island.js',error);}