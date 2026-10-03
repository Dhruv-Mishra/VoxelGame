try {
const O=AF.outland,I=AF.PLAN.world.island,S=AF.island={sites:[],palms:0,walkers:0,paths:[],trail:[]};
const route=I.ferry;
const F=S.ferry={dock:0,from:0,to:1,elapsed:0,rider:false,waiting:-1,acc:0,x:0,z:277,y:-2.25,yaw:Math.atan2(-20,128),speed:0};
const chase=new THREE.Vector3(),target=new THREE.Vector3();
const ridePrompt={label:'Skip crossing',act:()=>F.skip()};
const rideHud={mode:'drive',speed:0,car:'Solace Belle'};
function feetY(x,z){let y=-Infinity;for(const dx of [-0.35,0,0.35])for(const dz of [-0.35,0,0.35]){const ground=AF.W.groundY(x+dx,z+dz);y=Math.max(y,AF.surfaceBelow(x+dx,z+dz,Math.max(3,ground+1),8));}return y;}
const paint=hex=>AF.col(hex,{jitter:0.25,edge:0.15}),white=paint(0xf2efdf),mint=paint(0x75b8a5),coral=paint(0xd87966),teal=paint(0x326e75),wood=AF.col(0xb18b60,{pat:'plank',jitter:0.4,edge:0.2}),rock=AF.col(0x45464a,{pat:'stone',jitter:0.6,edge:0}),gold=paint(0xd6b96f),dark=paint(0x30383d),win=AF.col(0x536f77,{win:'hotel',emit:0xffd4a0,emitK:1.3,mode:'night',edge:0.1}),glow=AF.col(0xffe2ab,{emit:0xffce80,emitK:2.4,mode:'night'}),cache=new Map();
function geometry(key,width,height,depth,build){if(cache.has(key))return cache.get(key);const model=new AF.Model(width,height,depth);build(model);const geo=AF.meshModel(model,{vs:0.5,flat:true}),coarse=new AF.Model(Math.ceil(width/2),Math.ceil(height/2),Math.ceil(depth/2));for(let x=0;x<coarse.w;x++)for(let y=0;y<coarse.h;y++)for(let z=0;z<coarse.d;z++){let value=0;for(let dx=0;dx<2&&!value;dx++)for(let dy=0;dy<2&&!value;dy++)for(let dz=0;dz<2&&!value;dz++)value=model.get(x*2+dx,y*2+dy,z*2+dz);if(value)coarse.set(x,y,z,value);}geo.userData.lod=AF.meshModel(coarse,{vs:1,flat:true});cache.set(key,geo);return geo;}
const block=(key,width,height,depth,col)=>geometry(key,width,height,depth,model=>model.box(0,0,0,width,height,depth,col));
function site(name,x,z,rx,rz,y){const entry={name,x,z,y:y??Math.round(O.h(x,z)*4)/4,rx,rz,bank:5,props:[]};S.sites.push(entry);O.pads.push(entry);AF.addLabel(name,x,z,'place');return entry;}
function prop(site,geo,dx=0,dz=0,opts={}){const item=O.addProp(geo,site.x+dx,opts.y??site.y,site.z+dz,opts.rot??0,{tag:'island:'+site.name,collide:opts.collide!==false});site.props.push(item);return item;}
function sign(site,text,dx,dz,y=site.y+3){const geo=AF.hbLib.sign(text,teal,white,0.09);prop(site,geo,dx,dz,{y,collide:false});}
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
 prop(air,geometry('hangar',48,18,28,model=>{model.box(0,0,0,48,14,28,teal);model.box(2,0,26,46,12,28,dark);for(let layer=0;layer<5;layer++)model.box(layer*3,14+layer,0,48-layer*3,15+layer,28,white);}));sign(air,'SERENA AIR',0,-7.1,8);
 const runway=I.airstrip;for(let x=runway.x0+4;x<runway.x1-4;x+=8)O.addProp(block('runway',16,1,44,dark),x,runway.y-0.48,runway.z,0,{collide:false});for(let x=runway.x0+20;x<runway.x1-12;x+=20)O.addProp(block('runway-dash',12,1,1,white),x,runway.y+0.04,runway.z,0,{collide:false});for(const x of [runway.x0+10,runway.x1-10])for(const dz of [-7,-4,4,7])O.addProp(block('runway-threshold',10,1,2,white),x,runway.y+0.05,runway.z+dz,0,{collide:false});
 prop(air,geometry('windsock',14,15,3,model=>{model.box(1,0,1,2,14,2,dark);for(let x=2;x<14;x++)model.box(x,11,0,x+1,14-Math.floor(x/5),3,x%4<2?coral:white);}),25,0);
 for(let index=0;index<=240;index++){const progress=index/240,angle=Math.PI-progress*Math.PI/2+Math.sin(progress*Math.PI*6)*0.18,radius=85-67*progress,x=I.cone.x+Math.cos(angle)*radius,z=I.cone.z+Math.sin(angle)*radius,y=Math.round(O.h(x,z)*4)/4;S.trail.push([x,y+0.25,z]);O.addProp(block('trail-step',6,1,6,gold),x,y+0.04,z,0,{tag:'island:trail'});if(index%9===0)O.addProp(block('lava-rock',3,2,3,rock),x+3,y,z+2,0,{collide:false});}
 furniture(look,-2,0);prop(look,block('lookout-deck',16,1,12,wood),0,0,{y:look.y-0.5});
 const points=[],indices=[];waterRect(points,indices,-170,663,20,10,3.16);const start=points.length/3;points.push(I.cone.x,41.5,I.cone.z);for(let index=0;index<=32;index++){const angle=index/32*Math.PI*2;points.push(I.cone.x+Math.cos(angle)*9,41.5,I.cone.z+Math.sin(angle)*9);if(index)indices.push(start,start+index+1,start+index);}const water=new THREE.BufferGeometry();water.setAttribute('position',new THREE.Float32BufferAttribute(points,3));water.setIndex(indices);water.computeVertexNormals();water.computeBoundingSphere();water.userData.kind='lake';water.userData.waterY=3.16;water.userData.outland=true;AF.addWater(water);
 for(let index=0;index<210;index++){const angle=index/210*Math.PI*2,radius=0.78+AF.hash2(index,92)*0.17,x=I.cx+Math.cos(angle)*I.rx*radius,z=I.cz+Math.sin(angle)*I.rz*radius;if(Math.abs(z-runway.z)<22||Math.hypot(x-light.x,z-light.z)<15||S.sites.some(site=>Math.abs(x-site.x)<site.rx+4&&Math.abs(z-site.z)<site.rz+4))continue;if(AF.flora.add('palm',x,z,{scale:0.65+AF.hash2(index,41)*0.5,rot:angle,planted:true,biome:'island'}))S.palms++;}
 for(let index=0;index<24;index++){const x=-207+(index%8)*10,z=652+Math.floor(index/8)*13;if(Math.abs(x+170)<24&&z<674)continue;if(AF.flora.add('palm',x,z,{scale:0.8+AF.hash2(index,9)*0.3,planted:true,biome:'island'}))S.palms++;}
 AF.flora.scatter('shrub',{x0:-260,z0:584,x1:-231,z1:644,spacing:7,density:0.7,planted:true,biome:'island'});AF.flora.scatter('rock',{x0:108,z0:610,x1:146,z1:669,spacing:8,density:0.6,planted:true,biome:'island'});
});
AF.onBuild('island-life',666,()=>{
 function path(name,points,count,mode='loop',speed=0.9){const dense=[];for(let index=0;index<points.length-(mode==='loop'?0:1);index++){const from=points[index],to=points[(index+1)%points.length],steps=Math.max(1,Math.ceil(Math.hypot(to[0]-from[0],to[1]-from[1])/1.5));for(let part=0;part<steps;part++){const x=AF.lerp(from[0],to[0],part/steps),z=AF.lerp(from[1],to[1],part/steps);dense.push([x,feetY(x,z)+0.1,z]);}}if(mode!=='loop'){const [x,z]=points.at(-1);dense.push([x,feetY(x,z)+0.1,z]);}const entry=AF.walkers.addPath(name,dense,{count,speed,mode,activeRadius:150});S.paths.push(entry);S.walkers+=count;}
 path('Serena promenade',[[-209,679],[-115,679]],22,'pingpong');path('Serena beach',[[-214,686],[-170,695],[-100,695]],18,'pingpong');path('Serena hotel guests',[[-194,651],[-146,651],[-146,675],[-194,675]],16);path('Landing villagers',[[-25,486],[-25,500],[-15,500],[-15,486]],12);path('Serena fishermen',[[-21,430],[-21,456]],6,'pingpong',0.5);
 const deckhand={skin:0xd7a078,hair:0x463629,top:{col:0x326e75},bottom:{col:0xf2efdf},yaw:0},concierge={skin:0xa77754,hair:0x252a29,top:{col:0xf2efdf},bottom:{col:0x326e75},yaw:Math.PI};
 AF.walkers.addPath('Serena deckhand',[[2,AF.surfaceBelow(2,250,4,8),250]],{count:1,speed:0,activeRadius:150,looks:[deckhand]});AF.walkers.addPath('Serena concierge',[[-145,3,644]],{count:1,speed:0,activeRadius:150,looks:[concierge]});S.walkers+=2;
 AF.npc.spawn({id:'serena-deckhand',name:'Ellis',role:'Solace Belle deckhand',x:2,y:AF.surfaceBelow(2,250,4,8),z:250,visual:false,lines:[['Solace Belle waits twenty-five seconds at each pier. The crossing takes forty seconds. Serena is just across the water.']]});
 AF.npc.spawn({id:'serena-concierge',name:'Alma',role:'Hotel Serena concierge',x:-145,y:3,z:644,visual:false,lines:[['Welcome to Hotel Serena. The pool terrace faces the beach; the trail winds up to the crater pond. The airstrip is north of the hotel.']]});
 const cub=AF.planes.list.find(plane=>plane.id==='cub');if(cub)O.addProp(cub.G.geo,-145,2,563,1,{tag:'island:parked-cub'});
 const original=AF.sea.lighthouses[0];if(original?.beam){const beam=original.beam.clone();beam.position.set(S.light.x,S.light.y+20,S.light.z);beam.traverse(mesh=>{if(mesh.isMesh)mesh.frustumCulled=true;});AF.scene.add(beam);S.beam=beam;}
});
AF.onTick('island-light',334,(dt,time)=>{if(!S.beam)return;S.beam.visible=AF.time.night>0.2&&(AF.camera.position.x-S.light.x)**2+(AF.camera.position.z-S.light.z)**2<90000;if(S.beam.visible)S.beam.rotation.y=time*0.55+1.3;});
function dockY(dock){const point=dock?route.islandPier:route.cityPier;return AF.surfaceBelow(point[0],point[1],4,8);}
function land(dock){const point=dock?route.islandPier:route.cityPier;AF.setMode('walk',{x:point[0],y:dockY(dock),z:point[1],yaw:dock?0:Math.PI,snap:true});AF.emit('toast',dock?'Welcome to Serena Isle':'Welcome back to Port Solace');}
F.reset=dock=>{F.dock=F.from=dock;F.to=1-dock;F.elapsed=0;F.acc=0;F.waiting=-1;F.speed=0;const point=route.path[dock];F.x=point[0];F.z=point[1];if(AF.harbour.ferry){AF.harbour.ferry.st.dwell=25;place(0);}return F;};
F.board=dock=>{if(AF.mode==='ferry-ride')return;F.waiting=dock;if(F.dock===dock){F.waiting=-1;AF.setMode('ferry-ride');}else AF.emit('toast','Solace Belle is on her way.');};
F.skip=()=>{if(!F.rider)return;F.dock=F.from=F.to;F.to=1-F.dock;F.elapsed=0;AF.harbour.ferry.st.dwell=25;place(AF.clock.t);land(F.dock);};
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
AF.test('island: Cub runway is flat and clear for takeoff',()=>{const strip=I.airstrip;let lo=Infinity,hi=-Infinity,hits=0;for(let x=strip.x0+3;x<=strip.x1-3;x+=2)for(const dz of [-8,0,8]){const y=AF.W.groundY(x,strip.z+dz);lo=Math.min(lo,y);hi=Math.max(hi,y);if(AF.boxBlocked(x,y+0.1,strip.z+dz,1,2))hits++;}return{ok:strip.x1-strip.x0>=300&&hi-lo<=0.25&&!hits,info:(strip.x1-strip.x0)+' m, elevation '+lo+'..'+hi+', obstructions '+hits};});
AF.test('island: island walkers stay on clear surfaces',()=>{const hits=[];for(const path of S.paths)for(const point of path.points)if(AF.boxBlocked(point[0],point[1]+0.1,point[2],0.18,1.4)&&hits.length<8)hits.push({path:path.name,point});return{ok:!hits.length&&S.walkers<=120,info:JSON.stringify(hits)};});
AF.test('island: sea routes clear terrain and yield to ferry lane',()=>{let dry=0,samples=0;for(const ship of AF.sea.ships)for(let index=0;index<ship.route.N;index+=2){const x=ship.route.pts[index*2],z=ship.route.pts[index*2+1];samples++;if(O.h(x,z)>-1.25)dry++;}for(const yacht of AF.land.yachts)for(let x=-700;x<=700;x+=20){samples++;if(O.h(x,yacht.z+6)>-1.25)dry++;}return{ok:!dry&&AF.sea.ships.every(ship=>ship.name!=='island ferry'),info:dry+'/'+samples+' dry route samples; ornamental ferry removed, yachts hold outside lane during crossing'};});
AF.test('island: ferry round trip and safe pier height',()=>{
 const saved={mode:AF.mode,x:AF.player.x,y:AF.player.y,z:AF.player.z,yaw:AF.player.yaw},rows=[];
 try{for(const dock of [0,1]){F.reset(dock);const point=dock?route.islandPier:route.cityPier;AF.setMode('walk',{x:point[0],y:dockY(dock),z:point[1],snap:true});F.board(dock);let frames=0;while(AF.mode==='ferry-ride'&&frames++<3600)AF.step(1,1/30);const end=dock?route.cityPier:route.islandPier;rows.push(AF.mode==='walk'&&Math.hypot(AF.player.x-end[0],AF.player.z-end[1])<0.5&&Math.abs(AF.player.y-dockY(1-dock))<0.1&&!AF.boxBlocked(AF.player.x,AF.player.y+0.05,AF.player.z,0.3,1.7));}return{ok:rows.every(Boolean),info:'outbound/return '+rows.join('/')};}
 finally{F.reset(0);AF.setMode(saved.mode==='walk'?'walk':'aerial',saved);}
});
}catch(error){AF.partError('44-island.js',error);}