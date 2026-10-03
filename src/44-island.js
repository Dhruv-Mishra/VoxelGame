try {
const O=AF.outland,I=AF.PLAN.world.island,S=AF.island={sites:[],palms:0,walkers:0,paths:[],trail:[]};
const route=I.ferry;
const F=S.ferry={dock:0,from:0,to:1,elapsed:0,rider:false,waiting:-1,acc:0,x:0,z:277,y:-2.25,yaw:Math.atan2(-20,128),speed:0};
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
function cottage(col){return geometry('cottage-'+col,14,12,12,model=>{model.box(1,0,1,13,1,11,rock);model.box(1,1,1,13,8,11,col);for(let layer=0;layer<4;layer++)model.box(0,8+layer,layer,14,9+layer,12-layer,teal);model.box(6,1,10,9,6,11,wood);for(const x of [2,10]){model.box(x,3,10,x+2,6,11,win);model.box(x,6,11,x+2,7,12,white);}return model;});}
function waterRect(points,indices,x,z,width,depth,y){const start=points.length/3;points.push(x-width/2,y,z-depth/2,x-width/2,y,z+depth/2,x+width/2,y,z+depth/2,x+width/2,y,z-depth/2);indices.push(start,start+1,start+2,start,start+2,start+3);}
AF.onBuild('island-sites',496.4,()=>{
 const hotel=site('Hotel Serena',-170,631,22,14,3),village=site("Fisher's Landing",-20,486,20,18,2),light=site('Serena Point Light',-256,610,6,6,7),air=site('Serena Airstrip',-182,561,19,8,2),look=site('Crater Lookout',-10,643,4,3,Math.round(O.h(-10,643)*4)/4),bar=site('Palm Beach Bar',-226,665,7,7);
 S.hotel=hotel;S.village=village;S.light=light;S.lookout=look;
 prop(hotel,geometry('hotel',84,36,48,model=>{
  for(let level=0;level<4;level++){const inset=level===3?8:level===2?3:0,y=level*8;model.box(2+inset,y,2+inset,82-inset,y+8,44-inset,white);model.box(inset,y+7,inset,84-inset,y+8,46-inset,mint);for(let x=6+inset;x<78-inset;x+=7)for(const z of [2+inset,43-inset]){model.box(x,y+2,z,x+4,y+6,z+1,win);model.box(x-1,y+1,z,x+5,y+2,z+1,gold);}for(let z=7+inset;z<39-inset;z+=7)for(const x of [2+inset,81-inset])model.box(x,y+2,z,x+1,y+6,z+4,win);}
  for(let x=0;x<12;x++)for(let z=34;z<48;z++)if(Math.hypot(x-12,z-34)>12)model.box(x,0,z,x+1,32,z+1,0);
  model.box(36,0,43,49,5,45,teal);model.box(33,6,42,52,7,48,mint);model.box(38,32,12,46,36,27,coral);for(const x of [10,72])model.box(x,0,43,x+2,27,45,mint);
 }));sign(hotel,'HOTEL SERENA',0,12,hotel.y+14);
 const poolSite={...hotel,name:'Hotel Serena Pool',x:-170,z:663,props:[]};S.sites.push(poolSite);
 for(const dz of [-6,6])prop(poolSite,block('pool-edge-long',44,1,3,white),0,dz);for(const dx of [-10.5,10.5])prop(poolSite,block('pool-edge-short',3,1,22,white),dx,0);
 prop(poolSite,block('pool-floor',40,1,20,teal),0,0,{y:2.4,collide:false});
 const lounger=geometry('lounger',3,3,5,model=>{model.box(0,1,0,3,2,5,white);model.box(0,2,0,3,3,2,mint);model.box(0,0,1,1,1,4,wood);model.box(2,0,1,3,1,4,wood);}),umbrella=geometry('umbrella',9,7,9,model=>{model.box(4,0,4,5,6,5,wood);for(let layer=0;layer<3;layer++)model.box(layer,4+layer,layer,9-layer,5+layer,9-layer,layer%2?white:coral);});
 for(let index=0;index<8;index++){const dx=-14+(index%4)*9,dz=index<4?10:-10;prop(poolSite,lounger,dx,dz);if(index%2===0)prop(poolSite,umbrella,dx+2,dz+1,{collide:false});}
 const cabana=canopy('cabana',mint);for(let index=0;index<5;index++){const beach=site('Serena Cabana '+(index+1),-205+index*17,690,4,4);openCanopy(beach,cabana,0,0);}
 openCanopy(bar,geometry('bar',24,9,14,model=>{model.box(0,0,8,24,3,12,coral);model.box(0,3,7,24,4,13,wood);for(const x of [0,23])model.box(x,0,0,x+1,8,14,wood);model.box(0,8,0,24,9,14,teal);for(let x=2;x<23;x+=3)model.box(x,7,0,x+1,8,1,glow);}),0,0);sign(bar,'BEACH BAR',0,3.6,bar.y+4.6);AF.addLight({x:bar.x,y:bar.y+3,z:bar.z,color:0xffc878,intensity:1.3,range:15,kind:'street'});
 const board=block('boardwalk',12,1,8,wood);for(let x=-214;x<=-112;x+=6)O.addProp(board,x,Math.round(O.h(x,679)*4)/4+0.05,679,0,{tag:'island:boardwalk'});
 for(const [x,z,index]of [[-37,477,0],[-4,477,1],[-38,491,2],[-3,491,3],[-36,503,4],[-4,503,5],[-50,491,6]]){const house=site('Landing Cottage '+(index+1),x,z,4,4,2);prop(house,cottage(index%2?mint:coral));}
 const market=canopy('market',coral);for(const dx of [-11,11])openCanopy(village,market,dx,3);sign(village,"FISHER'S LANDING",0,-3,4.5);
 const net=geometry('fishing-net',12,5,1,model=>{for(let x=0;x<12;x++)for(let y=0;y<5;y++)if((x+y)%2===0)model.set(x,y,0,wood);model.box(0,0,0,1,5,1,wood);model.box(11,0,0,12,5,1,wood);});prop(village,net,17,-12,{collide:false});
 const boat=geometry('fishing-skiff',6,4,16,model=>{model.box(1,0,1,5,1,15,wood);for(const x of [0,5])model.box(x,1,1,x+1,3,15,coral);for(const z of [0,15])model.box(1,1,z,5,3,z+1,coral);model.box(1,2,6,5,3,7,white);});for(let index=0;index<3;index++)prop(village,boat,10+index*5,-38-index*3,{y:-1.2,collide:false});
 const pier=I.landing.pier,deck=block('island-jetty-deck',16,1,16,wood);for(let z=pier.z0;z<pier.z1;z+=8){O.addProp(deck,-20,1.75,z+4,0,{tag:'island:jetty'});for(const x of [-23.5,-16.5]){O.addProp(block('jetty-pile',1,9,1,wood),x,-2,z+1,0,{collide:false});O.addProp(block('jetty-rail',1,1,15,white),x,3,z+4,0,{tag:'island:jetty-rail'});}}
 furniture(village,17,-7);sign(village,'SOLACE BELLE',0,-60,3.5);
 prop(light,geometry('lighthouse',16,46,16,model=>{for(let y=0;y<36;y++)for(let x=2;x<14;x++)for(let z=2;z<14;z++)if(Math.hypot(x-8,z-8)<5.7-y*0.045)model.set(x,y,z,Math.floor(y/7)%2?coral:white);model.box(0,36,0,16,37,16,dark);model.box(5,37,5,11,43,11,win);model.box(7,38,7,9,42,9,glow);model.box(3,43,3,13,44,13,coral);model.box(5,44,5,11,46,11,coral);model.box(7,0,13,10,5,14,teal);}));prop(light,cottage(white),0,-11);AF.addLight({x:light.x,y:light.y+20,z:light.z,color:0xffe2ae,intensity:2,range:18,kind:'street'});
 prop(air,geometry('hangar',48,18,28,model=>{model.box(0,0,0,48,14,28,teal);model.box(2,0,26,46,12,28,dark);for(let layer=0;layer<5;layer++)model.box(layer*3,14+layer,0,48-layer*3,15+layer,28,white);}),0,0,{rot:2});sign(air,'SERENA AIR',0,-7.1,8,2);
 // the strip is asphalt in the terrain colours (07-outland); markings are 6 cm paint props 3 cm above it (no coplanar faces)
 const runway=I.airstrip,mark=(key,w,d,col,h=1)=>{if(cache.has(key))return cache.get(key);const m=new AF.Model(w,h,d);m.box(0,0,0,w,h,d,col);const geo=AF.meshModel(m,{vs:1/16,flat:true});geo.userData.lod=geo;geo.userData.small=h>1;cache.set(key,geo);return geo;};
 const stripe=AF.col(0xf2f0e6,{jitter:0.08,edge:0,pat:'none'}),lamp=AF.col(0xfff0c8,{emit:0xffe2a0,emitK:3,mode:'night',jitter:0,edge:0}),lampG=AF.col(0x9cffb0,{emit:0x60ff90,emitK:3,mode:'night',jitter:0,edge:0}),ry=runway.y+0.03;
 for(let x=runway.x0+40;x<runway.x1-40;x+=24)O.addProp(mark('rw-dash',192,10,stripe),x,ry,runway.z,0,{collide:false});
 for(const x of [runway.x0+9,runway.x1-9])for(const dz of [-8.4,-6.6,-4.8,-3,3,4.8,6.6,8.4])O.addProp(mark('rw-key',160,14,stripe),x,ry,runway.z+dz,0,{collide:false});
 for(const [x,text,rot] of [[runway.x0+24,'09',0],[runway.x1-24,'27',2]]){const t=AF.textModel(text,stripe,{pad:0}),k=12,m=new AF.Model(t.h*k,1,t.w*k);for(let tx=0;tx<t.w;tx++)for(let ty=0;ty<t.h;ty++)if(t.get(tx,ty,0))m.box(ty*k,0,tx*k,ty*k+k,1,tx*k+k,stripe);const geo=AF.meshModel(m,{vs:1/16,flat:true});geo.userData.lod=geo;O.addProp(geo,x,ry,runway.z,rot,{collide:false});}
 for(let x=runway.x0+2;x<=runway.x1-2;x+=20)for(const dz of [-11.7,11.7]){const end=x<runway.x0+6||x>runway.x1-6;O.addProp(mark(end?'rw-end-light':'rw-light',4,4,end?lampG:lamp,4),x,runway.y,runway.z+dz,0,{collide:false});}
 const apron=site('Serena Apron',-150,556,22,5,2);apron.face=[0,-1];
 prop(air,geometry('windsock',14,15,3,model=>{model.box(1,0,1,2,14,2,dark);for(let x=2;x<14;x++)model.box(x,11,0,x+1,14-Math.floor(x/5),3,x%4<2?coral:white);}),25,0);
 for(let index=0;index<=240;index++){const progress=index/240,angle=Math.PI-progress*Math.PI/2+Math.sin(progress*Math.PI*6)*0.18,radius=85-67*progress,x=I.cone.x+Math.cos(angle)*radius,z=I.cone.z+Math.sin(angle)*radius,y=Math.round(O.h(x,z)*4)/4;S.trail.push([x,y+0.25,z]);O.addProp(block('trail-step',6,1,6,gold),x,y+0.04,z,0,{tag:'island:trail'});if(index%9===0)O.addProp(block('lava-rock',3,2,3,rock),x+3,y,z+2,0,{collide:false});}
 furniture(look,-2,0);prop(look,block('lookout-deck',16,1,12,wood),0,0,{y:look.y-0.5});
 const points=[],indices=[];waterRect(points,indices,-170,663,20,10,3.16);const start=points.length/3;points.push(I.cone.x,41.5,I.cone.z);for(let index=0;index<=32;index++){const angle=index/32*Math.PI*2;points.push(I.cone.x+Math.cos(angle)*9,41.5,I.cone.z+Math.sin(angle)*9);if(index)indices.push(start,start+index+1,start+index);}const water=new THREE.BufferGeometry();water.setAttribute('position',new THREE.Float32BufferAttribute(points,3));water.setIndex(indices);water.computeVertexNormals();water.computeBoundingSphere();water.userData.kind='lake';water.userData.waterY=3.16;water.userData.outland=true;AF.addWater(water);
 for(let index=0;index<210;index++){const angle=index/210*Math.PI*2,radius=0.78+AF.hash2(index,92)*0.17,x=I.cx+Math.cos(angle)*I.rx*radius,z=I.cz+Math.sin(angle)*I.rz*radius;if(Math.abs(z-runway.z)<22||Math.hypot(x-light.x,z-light.z)<15||S.sites.some(site=>Math.abs(x-site.x)<site.rx+4&&Math.abs(z-site.z)<site.rz+4))continue;if(AF.flora.add('palm',x,z,{scale:0.65+AF.hash2(index,41)*0.5,rot:angle,planted:true,biome:'island'}))S.palms++;}
 for(let index=0;index<24;index++){const x=-207+(index%8)*10,z=652+Math.floor(index/8)*13;if(Math.abs(x+170)<24&&z<674)continue;if(AF.flora.add('palm',x,z,{scale:0.8+AF.hash2(index,9)*0.3,planted:true,biome:'island'}))S.palms++;}
 AF.flora.scatter('shrub',{x0:-260,z0:584,x1:-231,z1:644,spacing:7,density:0.7,planted:true,biome:'island'});AF.flora.scatter('rock',{x0:108,z0:610,x1:146,z1:669,spacing:8,density:0.6,planted:true,biome:'island'});
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
 const party=fun.party=site('Serena Sunset Party',-25,717,16,9,2.25);party.bank=6;
 prop(party,geometry('party-stage',40,18,12,m=>{m.box(0,0,0,40,2,12,wood);m.box(0,2,10,40,3,12,dark);for(const x of [0,38])m.box(x,2,8,x+2,16,12,dark);m.box(0,16,8,40,18,12,dark);for(let x=2;x<38;x+=2)m.box(x,15,8,x+1,16,9,[pink,cyan,lime,amber][(x/2)%4]);m.box(2,3,11,38,15,12,teal);for(let y=4;y<14;y+=3)m.box(4,y,10,36,y+1,11,[pink,cyan][(y/3)%2|0]);m.box(14,2,3,26,5,6,white);m.box(14,5,3,26,6,6,dark);m.box(15,3,2,25,4,3,cyan);for(const x of [1,33])for(let y=2;y<12;y++)m.box(x,y,1,x+6,y+1,6,y%3===0?grey:black);}),0,4);
 sign(party,'SERENA SUNSET PARTY',0,4.9,party.y+9.1,2);
 const floor=geometry('party-floor',64,1,40,m=>{for(let x=0;x<64;x+=8)for(let z=0;z<40;z+=8)m.box(x,0,z,x+8,1,z+8,[pink,cyan,lime,amber][((x+z)/8)%4]);},1/4);prop(party,floor,0,-4,{y:party.y+0.02});
 prop(party,geometry('party-lights',72,24,52,m=>{for(const x of [0,71])for(const z of [0,51])m.box(x,0,z,x+1,22,z+1,wood);for(let i=0;i<72;i++){const sag=Math.round(Math.sin(i/71*Math.PI)*3);for(const z of [0,51])m.set(i,21-sag,z,i%3?dark:[amber,pink,cyan][(i/3)%3|0]);}for(let i=0;i<52;i++){const sag=Math.round(Math.sin(i/51*Math.PI)*3);for(const x of [0,71])m.set(x,21-sag,i,i%3?dark:[lime,amber,pink][(i/3)%3|0]);}},1/4),0,-4,{collide:false});
 prop(party,geometry('party-drinks',10,6,4,m=>{m.box(0,0,0,10,4,4,coral);m.box(0,4,0,10,5,4,wood);for(let x=1;x<10;x+=2)m.box(x,5,1,x+1,6,2,[lime,amber,pink][x%3]);}),13,-6);
 AF.addLight({x:party.x,y:party.y+5,z:party.z+2,color:0xff6ad5,intensity:1.6,range:20,kind:'street'});AF.addLight({x:party.x,y:party.y+4,z:party.z-6,color:0x5fd8ff,intensity:1.3,range:18,kind:'street'});
 // bonfire on the beach: a stone ring, logs, flames; log benches round it
 const bonfire=fun.bonfire=site('Serena Bonfire',-85,719,6,6,1.75);
 prop(bonfire,geometry('bonfire',12,10,12,m=>{for(let x=0;x<12;x++)for(let z=0;z<12;z++){const d=Math.hypot(x-5.5,z-5.5);if(d>4.2&&d<5.8)m.set(x,0,z,rock);}m.box(3,0,5,9,1,7,wood);m.box(5,1,3,7,2,9,wood);for(let y=1;y<9;y++){const r=Math.max(0.6,2.6-y*0.3);for(let x=0;x<12;x++)for(let z=0;z<12;z++)if(Math.hypot(x-5.5,z-5.5)<r&&AF.hash3(x,y,z)<0.8-y*0.05)m.set(x,y,z,y<3?ember:fire);}}),0,0,{collide:false});
 const bench=geometry('log-bench',10,2,3,m=>{m.box(0,0,0,10,2,3,wood);});for(const [dx,dz,rot] of [[0,-4.5,0],[0,4.5,0],[-4.5,0,1],[4.5,0,1]])prop(bonfire,bench,dx,dz,{rot});
 AF.addLight({x:bonfire.x,y:bonfire.y+1.5,z:bonfire.z,color:0xff8a3a,intensity:1.8,range:16,kind:'street'});
 // beach volleyball: court lines (paint on the sand), net on two posts
 const court=fun.court=site('Serena Volleyball',-122,709,10,6,1.5);
 prop(court,geometry('volley-lines',64,1,32,m=>{m.box(0,0,0,64,1,1,white);m.box(0,0,31,64,1,32,white);m.box(0,0,0,1,1,32,white);m.box(63,0,0,64,1,32,white);m.box(31,0,0,33,1,32,white);},1/4),0,0,{y:court.y+0.03,collide:false});
 prop(court,geometry('volley-net',2,20,36,m=>{for(const z of [0,35])m.box(0,0,z,2,20,z+1,grey);for(let y=11;y<19;y++)for(let z=1;z<35;z++)if((y+z)%2===0||y===18)m.set(1,y,z,net);},1/8),0,0,{collide:false});
 // umbrellas, loungers and towels along the south beach; hammocks by the beach bar; tiki torches on the boardwalk
 const lounger=geometry('lounger',3,3,5,m=>{m.box(0,1,0,3,2,5,white);m.box(0,2,0,3,3,2,mint);m.box(0,0,1,1,1,4,wood);m.box(2,0,1,3,1,4,wood);}),towel=geometry('towel',4,1,8,m=>{for(let z=0;z<8;z++)m.box(0,0,z,4,1,z+1,z%2?white:coral);},1/4),umbrellaB=geometry('umbrella-b',9,7,9,m=>{m.box(4,0,4,5,6,5,wood);for(let l=0;l<3;l++)m.box(l,4+l,l,9-l,5+l,9-l,l%2?white:blue);});
 let placed=0;for(let x=-200;x<=-140;x+=10){const z=704+(x%20?2:0),y=Math.round(O.h(x,z)*4)/4;if(y<0.8||y>3)continue;O.addProp(umbrellaB,x,y,z,0,{tag:'island:beach',collide:false});O.addProp(placed%2?towel:lounger,x+2,y+(placed%2?0.03:0),z+1.5,1,{tag:'island:beach',collide:false});placed++;}
 const hammock=geometry('hammock',26,10,4,m=>{for(const x of [0,25])m.box(x,0,1,x+1,10,3,wood);for(let x=1;x<25;x++){const y=Math.round(7-Math.sin(x/25*Math.PI)*3);m.box(x,y,0,x+1,y+1,4,x%3?coral:white);}},1/8);
 for(const [x,z] of [[-238,676],[-232,684]])O.addProp(hammock,x,Math.round(O.h(x,z)*4)/4,z,0,{tag:'island:beach',collide:false});
 const torch=geometry('tiki-torch',3,16,3,m=>{m.box(1,0,1,2,13,2,wood);m.box(0,12,0,3,13,3,dark);m.box(0,13,0,3,15,3,amber);m.set(1,15,1,amber);},1/8);
 for(let x=-210;x<=-112;x+=14)for(const z of [674,684]){const y=Math.round(O.h(x,z)*4)/4;if(y>0.6)O.addProp(torch,x,y,z,0,{tag:'island:torch',collide:false});}
 // the swim raft off the party beach: floats, a deck, a ladder and a slide
 O.addProp(geometry('swim-raft',14,12,14,m=>{for(const x of [0,10])for(const z of [0,10])m.box(x,0,z,x+4,2,z+4,blue);m.box(0,2,0,14,3,14,wood);m.box(1,3,1,5,10,2,white);m.box(1,10,1,5,11,5,wood);for(let i=0;i<8;i++)m.box(1,10-i,5+i,5,11-i,6+i,yellow);for(let y=0;y<3;y++)m.box(9,y,13,12,y+1,14,grey);}),-30,-2.25,758,0,{tag:'island:raft'});
 // jet-ski hire on the south beach: hut, sign, kayaks, a surfboard rack; four docks round the island (land point + outward direction)
 const hire=fun.hire=site('Serena Jet Skis',8,721,6,4,1.75);
 openCanopy(hire,canopy('jetski-hut',yellow),0,0);sign(hire,'JET SKI HIRE',0,-2.6,hire.y+3.8,2);
 const kayak=geometry('kayak',3,2,12,m=>{m.box(0,0,1,3,1,11,coral);m.box(1,0,0,2,1,12,coral);m.box(1,1,4,2,2,7,dark);},1/4),board=geometry('surf-rack',12,9,3,m=>{m.box(0,0,1,12,1,2,wood);for(let x=1;x<12;x+=3)m.box(x,1,0,x+2,9,3,[coral,cyan,yellow,mint][(x/3)|0]);},1/4);
 for(let i=0;i<3;i++)prop(hire,kayak,-5+i*1.2,3.5,{collide:false});prop(hire,board,5,2,{collide:false});
 AF.addLight({x:hire.x,y:hire.y+3,z:hire.z,color:0xffd28a,intensity:1.1,range:12,kind:'street'});
 for(const [x,z,dx,dz] of [[8,727,0,1],[-70,471,0,-1],[150,650,1,0],[-286,600,-1,0]]){
  let ox=x,oz=z;for(let i=0;i<60&&O.h(ox,oz)>-1.9;i++){ox+=dx;oz+=dz;}
  fun.docks.push({land:[x-dx*1.5,z-dz*1.5],y:Math.max(0.5,Math.round(O.h(x-dx*1.5,z-dz*1.5)*4)/4),x:ox+dx*2,z:oz+dz*2,yaw:Math.atan2(dx,dz)});
 }
});
AF.onBuild('island-life',666,()=>{
 function path(name,points,count,mode='loop',speed=0.9){const dense=[];for(let index=0;index<points.length-(mode==='loop'?0:1);index++){const from=points[index],to=points[(index+1)%points.length],steps=Math.max(1,Math.ceil(Math.hypot(to[0]-from[0],to[1]-from[1])/1.5));for(let part=0;part<steps;part++){const x=AF.lerp(from[0],to[0],part/steps),z=AF.lerp(from[1],to[1],part/steps);dense.push([x,feetY(x,z)+0.1,z]);}}if(mode!=='loop'){const [x,z]=points.at(-1);dense.push([x,feetY(x,z)+0.1,z]);}const entry=AF.walkers.addPath(name,dense,{count,speed,mode,activeRadius:150});S.paths.push(entry);S.walkers+=count;}
 path('Serena promenade',[[-209,679],[-115,679]],14,'pingpong');path('Serena beach',[[-214,686],[-170,695],[-100,695]],12,'pingpong');path('Serena hotel guests',[[-194,651],[-146,651],[-146,675],[-194,675]],12);path('Landing villagers',[[-25,486],[-25,500],[-15,500],[-15,486]],12);path('Serena fishermen',[[-21,430],[-21,456]],6,'pingpong',0.5);
 const deckhand={skin:0xd7a078,hair:0x463629,top:{col:0x326e75},bottom:{col:0xf2efdf},yaw:0},concierge={skin:0xa77754,hair:0x252a29,top:{col:0xf2efdf},bottom:{col:0x326e75},yaw:Math.PI};
 AF.walkers.addPath('Serena deckhand',[[2,AF.surfaceBelow(2,250,4,8),250]],{count:1,speed:0,activeRadius:150,looks:[deckhand]});AF.walkers.addPath('Serena concierge',[[-145,3,644]],{count:1,speed:0,activeRadius:150,looks:[concierge]});S.walkers+=2;
 AF.npc.spawn({id:'serena-deckhand',name:'Ellis',role:'Solace Belle deckhand',x:2,y:AF.surfaceBelow(2,250,4,8),z:250,visual:false,lines:[['Solace Belle waits twenty-five seconds at each pier. The crossing takes forty seconds. Serena is just across the water.']]});
 AF.npc.spawn({id:'serena-concierge',name:'Alma',role:'Hotel Serena concierge',x:-145,y:3,z:644,visual:false,lines:[['Welcome to Hotel Serena. The pool terrace faces the beach; the trail winds up to the crater pond. The airstrip is north of the hotel.']]});
 // a flyable Cub on the Serena apron (crashes tow it back here); the planes' approach guidance knows this strip too
 if(AF.planes.make){S.cub=AF.planes.make('cub',-140,555,Math.PI);AF.planes.runways.push(I.airstrip);}
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
 AF.walkers.addPath('Serena swimmers',[[-62,-2.45,748],[-36,-2.45,751],[-10,-2.45,747]],{count:8,speed:0.45,mode:'pingpong',activeRadius:170,looks:[look(),look(),look(),look()]});S.walkers+=8;
 one('Serena hire staff',fun.hire.x+2,fun.hire.y,fun.hire.z-1,look('stand',Math.PI));
 // jet skis: the rideable four (one per dock) and three riders racing the coast (AI hulls follow their walker seats)
 JS.mesh=new THREE.InstancedMesh(skiGeo(),AF.mat.voxelInst,8);JS.mesh.name='island-jetskis';JS.mesh.count=0;JS.mesh.frustumCulled=false;JS.mesh.castShadow=true;JS.mesh.receiveShadow=true;JS.mesh.customDepthMaterial=AF.mat.depthInst;JS.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);JS.mesh.layers.set(31);AF.scene.add(JS.mesh);
 fun.docks.forEach((d,i)=>JS.skis.push(new JetSki(d,i)));
 const lap=[];for(let a=-50;a<=230;a+=3){const r=a*Math.PI/180;let s=1+Math.sin(r*5)*0.04,x=0,z=0;for(let i=0;i<30;i++){x=I.cx+Math.cos(r)*290*s;z=I.cz+Math.sin(r)*190*s;if(O.h(x,z)<-2.4)break;s+=0.03;}lap.push([x,-1.12,z]);}
 JS.riders=AF.walkers.addPath('Serena jet-ski riders',lap,{count:3,speed:16*AF.vehicles.SPEED_K*0.7,mode:'pingpong',activeRadius:420,looks:[look('ride',0),look('ride',0),look('ride',0)]});S.walkers+=3;
});
AF.onTick('island-light',334,(dt,time)=>{if(!S.beam)return;S.beam.visible=AF.time.night>0.2&&(AF.camera.position.x-S.light.x)**2+(AF.camera.position.z-S.light.z)**2<90000;if(S.beam.visible)S.beam.rotation.y=time*0.55+1.3;});
// ---------------------------------------------------------------- jet skis ('jetski' mode): W/S throttle, A/D steer, Shift burst, E hops off at a beach
const JS=S.jetski={skis:[],cur:null,mesh:null,riders:null,cam:new THREE.Vector3(),want:new THREE.Vector3(),look:new THREE.Vector3(),camInit:false,seat:{x:0,y:0,z:0,yaw:0,roll:0,pitch:0,seatH:0.55,lean:0.35},bumpT:0};
const SEA=AF.PLAN.harbour.waterY,wet=(x,z)=>AF.W.groundY(x,z)<SEA-0.45&&!AF.solidAt(x,SEA+0.35,z);
function skiGeo(){const m=new AF.Model(9,9,26);for(let z=0;z<26;z++){const t=z>17?Math.min(4,Math.floor((z-17)/2)):0;m.box(t,0,z,9-t,z>19?3:2,z+1,white);}m.box(0,2,1,9,3,16,coral);m.box(2,3,4,7,4,13,dark);m.box(2,2,14,7,5,19,teal);m.box(0,5,15,9,6,16,dark);m.box(3,6,15,6,7,16,dark);return AF.meshModel(m,{vs:1/8,anchor:[0.5,0,0.5]});}
const skiY=(k,t)=>SEA-0.1+Math.sin(t*2.1+k.ph)*0.05+Math.sin(t*3.3+k.ph*2)*0.02*Math.min(1,Math.abs(k.v)/4);
const jm=new THREE.Matrix4(),jq=new THREE.Quaternion(),je=new THREE.Euler(0,0,0,'YXZ'),jp=new THREE.Vector3(),one1=new THREE.Vector3(1,1,1);
function skiAt(index,x,y,z,yaw,pitch,roll){jp.set(x,y,z);je.set(-pitch,yaw,roll,'YXZ');jq.setFromEuler(je);jm.compose(jp,jq,one1);JS.mesh.setMatrixAt(index,jm);}
AF.onTick('island-jetskis',307,(dt,t)=>{
 const M=JS.mesh;if(!M)return;const cp=AF.camera.position;
 if(!JS.cur&&((cp.x-I.cx)/520)**2+((cp.z-I.cz)/430)**2>1){if(M.count){M.count=0;M.layers.set(31);}return;}
 let n=0;
 for(const k of JS.skis){if(JS.cur!==k)k.drift(dt);skiAt(n++,k.x,skiY(k,t),k.z,k.yaw,k.pitch,k.roll);}
 const R=JS.riders;if(R&&R.active)for(const a of R.actors)skiAt(n++,a.x,SEA-0.1+Math.sin(t*2.6+a.ph)*0.06,a.z,a.yaw,0.08,Math.sin(t*0.9+a.ph)*0.12);
 M.count=n;M.layers.set(n?0:31);M.instanceMatrix.needsUpdate=true;
});
// a rideable jet ski (AF.Vehicle): boarded from its dock, or wherever it was left (the prompt follows it, reaching up the beach)
class JetSki extends AF.Vehicle{
 constructor(d,i){super({name:'Serena jet ski',x:d.x,z:d.z,yaw:d.yaw});this.y=SEA;this.w=0;this.ph=i*1.7;this.home=d;
  this.attach({label:'Ride a jet ski',r:5,prio:0.3,can:()=>AF.mode==='walk'&&JS.cur!==this,act:()=>AF.setMode('jetski',{ski:this})});this.sync();}
 sync(){const it=this.interact,d=this.home;if(Math.hypot(this.x-d.x,this.z-d.z)<4){it.x=d.land[0];it.z=d.land[1];it.y=d.y+1;it.r=5;}else{it.x=this.x;it.z=this.z;it.y=undefined;it.r=11;}}
 // coasting with nobody aboard
 drift(dt){if(Math.abs(this.v)<=0.05)return;this.v*=Math.exp(-dt*0.9);const nx=this.x+Math.sin(this.yaw)*this.v*dt,nz=this.z+Math.cos(this.yaw)*this.v*dt;if(wet(nx,nz)){this.x=nx;this.z=nz;}else this.v=0;this.roll*=Math.exp(-dt*2);this.pitch*=Math.exp(-dt*2);this.sync();}
 step(dt,inp){
  const vmax=16*AF.vehicles.SPEED_K*(inp.boost?1.3:1),thr=inp.thr,steer=inp.steer;
  if(thr>0)this.v+=thr*(inp.boost?9:6.5)*Math.max(0,1-Math.max(0,this.v)/vmax)*dt;else if(thr<0)this.v+=thr*(this.v>0?9:2.5)*dt;
  this.v-=this.v*0.25*dt+(thr?0:Math.sign(this.v)*Math.min(Math.abs(this.v),0.8*dt));this.v=AF.clamp(this.v,-3,vmax);
  this.w+=(steer-this.w)*Math.min(1,dt*5);this.yaw-=this.w*(0.5+Math.min(1,Math.abs(this.v)/7)*1.1)*dt*(this.v<-0.2?-1:1);
  const hx=Math.sin(this.yaw),hz=Math.cos(this.yaw),s=this.v<0?-1:1,nx=this.x+hx*this.v*dt,nz=this.z+hz*this.v*dt,Bd=AF.PLAN.world.bounds;
  JS.bumpT-=dt;
  if(wet(nx+hx*1.8*s,nz+hz*1.8*s)&&wet(nx,nz)&&nx>Bd.x0+20&&nx<Bd.x1-20&&nz>Bd.z0+20&&nz<Bd.z1-20){this.x=nx;this.z=nz;}
  else{if(Math.abs(this.v)>4&&JS.bumpT<=0){AF.emit('toast','Bump! Too shallow \u2014 hop off with E or back out.');JS.bumpT=3;}this.v*=-0.3;}
  this.roll+=(this.w*Math.min(1,Math.abs(this.v)/8)*0.4-this.roll)*Math.min(1,dt*4);this.pitch+=(Math.min(0.14,Math.max(0,this.v)*0.009)-this.pitch)*Math.min(1,dt*3);
  this.y=skiY(this,AF.clock.t);this.sync();
 }
}
const skiCam=new AF.Vehicle.Chase();
AF.modes.jetski={
 enter(o={}){const k=o.ski;if(!k){AF.setMode('walk');return;}JS.cur=k;k.v=0;k.w=0;skiCam.set({dist:6.4,height:1.6,ahead:2,shadow:50,floor:()=>SEA+1.2});AF.player.setVisible(true);AF.emit('toast',AF.touch?'Push the stick to ride. Tap EXIT beside a beach to hop off.':'Jet ski! W throttle, A/D steer, Shift for a burst, E to hop off beside a beach.');AF.emit('hint',AF.touch?'':'W/S throttle \u00b7 A/D steer \u00b7 Shift burst \u00b7 E hop off at a beach');},
 exit(){const k=JS.cur;JS.cur=null;if(k)k.sync();AF.PL.seat=null;AF.emit('hud',{speed:null});AF.emit('hint','');},
 update(dt){
  const k=JS.cur;if(!k)return;dt=Math.min(dt,0.05);
  const inp=AF.Vehicle.input();k.step(dt,inp);
  const hx=Math.sin(k.yaw),hz=Math.cos(k.yaw),seat=JS.seat;seat.x=k.x-hx*0.15;seat.y=k.y-0.05;seat.z=k.z-hz*0.15;seat.yaw=k.yaw;seat.roll=k.roll;seat.pitch=-k.pitch;AF.PL.seat=seat;
  skiCam.update(dt,k.x,k.y,k.z,k.yaw);
  AF.Vehicle.hud(k.v,k.name,(inp.boost?' \u00b7 burst':'')+' \u00b7 E hop off at a beach');
  if(inp.exit){const spot=AF.Vehicle.landing(k.x,k.z,SEA+0.35);if(spot){k.v=0;AF.setMode('walk',{x:spot.x,y:spot.y,z:spot.z,yaw:k.yaw});}else AF.emit('toast','Ride up to a beach or a jetty to hop off.');}
 }
};
function dockY(dock){const point=dock?route.islandPier:route.cityPier;return AF.surfaceBelow(point[0],point[1],4,8);}
function land(dock){const point=dock?route.islandPier:route.cityPier;AF.setMode('walk',{x:point[0],y:dockY(dock),z:point[1],yaw:dock?0:Math.PI,snap:true});AF.emit('toast',dock?'Welcome to Serena Isle':'Welcome back to Port Solace');}
F.reset=dock=>{F.dock=F.from=dock;F.to=1-dock;F.elapsed=0;F.acc=0;F.waiting=-1;F.speed=0;const point=route.path[dock];F.x=point[0];F.z=point[1];if(AF.harbour.ferry){AF.harbour.ferry.st.dwell=25;place(0);}return F;};
F.board=dock=>{if(AF.mode==='ferry-ride')return;F.waiting=dock;if(F.dock===dock){F.waiting=-1;AF.setMode('ferry-ride');}else AF.emit('toast','Solace Belle is on her way.');};
F.skip=()=>{if(!F.rider||AF.stream.traveling)return;F.dock=F.from=F.to;F.to=1-F.dock;F.elapsed=0;AF.harbour.ferry.st.dwell=25;place(AF.clock.t);const dock=F.dock;AF.stream.travel({label:dock?'Serena Isle':'Port Solace',go:()=>land(dock)});};
function place(time){
 const mesh=AF.harbour.ferry.mesh,progress=F.dock<0?AF.smooth(0,1,F.elapsed/route.crossing):0,start=route.path[F.from],end=route.path[F.to];
 F.x=F.dock<0?AF.lerp(start[0],end[0],progress):route.path[F.dock][0];F.z=F.dock<0?AF.lerp(start[1],end[1],progress):route.path[F.dock][1];
 F.y=AF.PLAN.harbour.waterY-1+(F.dock<0?Math.sin(time*0.8)*0.06:0);F.yaw=Math.atan2(end[0]-start[0],end[1]-start[1]);
 mesh.position.set(F.x,F.y,F.z);mesh.rotation.set(0,F.yaw,F.dock<0?Math.sin(time*0.6)*0.012:0);mesh.castShadow=(AF.camera.position.x-F.x)**2+(AF.camera.position.z-F.z)**2<6400;
}
F.update=(dt,time)=>{
 const ship=AF.harbour.ferry;if(!ship)return;
 if(F.waiting>=0&&(AF.mode!=='walk'||Math.hypot(AF.player.x-(F.waiting?route.islandPier:route.cityPier)[0],AF.player.z-(F.waiting?route.islandPier:route.cityPier)[1])>7))F.waiting=-1;
 if(F.dock>=0){if(F.waiting===F.dock){F.waiting=-1;AF.setMode('ferry-ride');}ship.st.dwell-=dt;if(ship.st.dwell<=0){let occupied=false;for(const yacht of AF.land.yachts)if(yacht.me.position.x>-45&&yacht.me.position.x<25)occupied=true;if(occupied)ship.st.dwell=0.1;else{F.from=F.dock;F.to=1-F.from;F.dock=-1;F.elapsed=0;}}}
 else {F.elapsed=Math.min(route.crossing,F.elapsed+dt);F.speed=Math.hypot(20,128)*6*(F.elapsed/40)*(1-F.elapsed/40)/40;ship.st.v=F.speed;if(F.elapsed>=route.crossing){F.dock=F.from=F.to;F.to=1-F.dock;ship.st.dwell=25;F.speed=ship.st.v=0;place(time);if(F.rider)land(F.dock);}}
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
 F.reset(0);
 const decorative=AF.sea.ships.find(ship=>ship.name==='island ferry');if(decorative){AF.scene.remove(decorative.grp);AF.sea.ships.splice(AF.sea.ships.indexOf(decorative),1);}
 for(let index=0;index<AF.land.yachts.length;index++)AF.land.yachts[index].z=318+index*12;
 for(const dock of [0,1]){const point=dock?route.islandPier:route.cityPier,prompt=AF.addInteract({x:point[0],y:dockY(dock)+1,z:point[1],r:4,prio:0.7,label:'Board the ferry',can:()=>AF.mode==='walk',act:()=>F.board(dock)});if(dock)F.islandPrompt=prompt;else F.cityPrompt=prompt;}
});
AF.onTick('island-ferry',145,F.update);
AF.onTick('island-sea-lane',329,(dt,time)=>{const yachts=AF.land.yachts;if(!yachts)return;for(const yacht of yachts){const x=((yacht.x0+yacht.v*time+700)%1400+1400)%1400-700,previous=x-yacht.v*dt,entry=yacht.v>0?-45:25;if(F.dock<0&&((yacht.v>0&&previous<=entry&&x>=entry)||(yacht.v<0&&previous>=entry&&x<=entry)))yacht.x0-=x-entry;}});
S.hotelWalk=[[-20,424],[-20,478],[-20,514],[-90,514],[-130,580],[-145,610],[-145,651]];
AF.test('island: sites have solid colliders and beach palms',()=>{const names=['Hotel Serena',"Fisher's Landing",'Serena Point Light','Serena Airstrip','Crater Lookout'],missing=names.filter(name=>!S.sites.find(site=>site.name===name)?.props.some(prop=>prop.col));return{ok:!missing.length&&S.palms>=100&&S.walkers<=120,info:S.palms+' palms, '+S.walkers+' actors, missing '+missing.join(',')};});
AF.test('island: pier to hotel walk is unobstructed',()=>{let blocked=0,samples=0;const hits=[];for(let index=1;index<S.hotelWalk.length;index++){const from=S.hotelWalk[index-1],to=S.hotelWalk[index],steps=Math.ceil(Math.hypot(to[0]-from[0],to[1]-from[1])/0.5);for(let part=0;part<=steps;part++){const x=AF.lerp(from[0],to[0],part/steps),z=AF.lerp(from[1],to[1],part/steps),y=feetY(x,z);samples++;if(AF.boxBlocked(x,y+0.05,z,0.3,1.7)){blocked++;if(hits.length<5)hits.push([x,y,z]);}}}return{ok:!blocked,info:blocked+'/'+samples+' blocked '+JSON.stringify(hits)};});
AF.test('island: party, bonfire, volleyball and jet-ski hire are furnished and lit',()=>{
 const spots=[fun.party,fun.bonfire,fun.court,fun.hire],bare=spots.filter(site=>!site||!site.props.length).length,lit=AF.lights.filter(light=>spots.some(site=>site&&Math.hypot(light.x-site.x,light.z-site.z)<12)).length;
 const dancers=AF.walkers.paths.filter(path=>/^Serena party/.test(path.name)&&path.actors[0].look.pose==='dance').length;
 return{ok:!bare&&lit>=4&&dancers>=20&&fun.docks.length===4&&fun.docks.every(d=>O.h(d.x,d.z)<-1.9&&O.h(d.land[0],d.land[1])>-1.25),info:'bare '+bare+', lights '+lit+', dancers '+dancers+', docks '+JSON.stringify(fun.docks.map(d=>[Math.round(d.x),Math.round(d.z),+O.h(d.land[0],d.land[1]).toFixed(1)]))};
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
AF.test('island: ferry round trip and safe pier height',()=>{
 const saved={mode:AF.mode,x:AF.player.x,y:AF.player.y,z:AF.player.z,yaw:AF.player.yaw},rows=[];
 try{for(const dock of [0,1]){F.reset(dock);const point=dock?route.islandPier:route.cityPier;AF.setMode('walk',{x:point[0],y:dockY(dock),z:point[1],snap:true});F.board(dock);let frames=0;while(AF.mode==='ferry-ride'&&frames++<3600)AF.step(1,1/30);const end=dock?route.cityPier:route.islandPier;rows.push(AF.mode==='walk'&&Math.hypot(AF.player.x-end[0],AF.player.z-end[1])<0.5&&Math.abs(AF.player.y-dockY(1-dock))<0.1&&!AF.boxBlocked(AF.player.x,AF.player.y+0.05,AF.player.z,0.3,1.7));}return{ok:rows.every(Boolean),info:'outbound/return '+rows.join('/')};}
 finally{F.reset(0);AF.setMode(saved.mode==='walk'?'walk':'aerial',saved);}
});
}catch(error){AF.partError('44-island.js',error);}