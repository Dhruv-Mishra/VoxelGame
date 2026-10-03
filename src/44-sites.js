try {
const O=AF.outland,F=AF.flora,S=AF.outlandSites={sites:[],windmills:[],stats:{ready:false,workMs:0,props:0,walkers:0,hamlets:0,houses:0}},cache=new Map();
const color=(hex,opts={})=>AF.col(hex,{jitter:0.45,edge:0.2,...opts});
const wood=color(0x72513b,{pat:'plank'}),trim=color(0xe9e2cd),stone=color(0x8a8981,{pat:'stone'}),red=color(0x9e3e35),slate=color(0x52676a),gold=color(0xc4a25a),dark=color(0x313a3c),pane=color(0x9aaea9),grass=color(0x637d4b),glow=color(0xffdf9a,{emit:0xffbf69,emitK:2,mode:'night'});
const adobe=color(0xcbb58d),clay=color(0xb27655);
const specs=[
 ['Alder Farm','farm',-944,-145,32,24],['Foxglove Farm','farm',-1110,-250,32,24],['Southfield Farm','farm',-820,48,32,24],['Bramble Farm','farm',-1100,108,32,24],['Hollin Farm','farm',-1096,-96,32,24],['Larkspur Farm','farm',-940,152,32,24],['Westmoor Vineyard','winery',-820,-210,28,20],
 ['Westmoor Windmill','windmill',-1145,-38,6,6],['Southfield Windmill','windmill',-780,126,6,6],['Mill Pond Mill','mill',-938,90,9,7],
 ['St Agnes Church','church',-1030,-65,8,12],['The Red Fox','pub',-1024,-14,10,7],['Coast Road Cottages','cottage',-1065,-24,7,6],['Rose Cottage','cottage',-1055,12,7,6],['Westmoor Fuel','fuel',-980,-16,9,7],
 ['Tamsin Lodge','lodge',-10,-575,13,8],['Tamsin Boathouse','boathouse',40,-610,7,5],['Tamsin Picnic','picnic',-98,-596,10,7],
 ['Eastwood Cabin','cabin',720,-112,7,6],['Birch Cabin','cabin',924,-246,7,6],['Eastwood Lookout','tower',910,-342,6,6],['Mirror Lake Camp','camp',780,-147,13,9],
 ['Reedwick','hamlet',-1170,-110,22,18],['Dune End','hamlet',-1178,14,22,18],['Willow Green','hamlet',-1020,120,22,18],['Mallow Cross','hamlet',-850,105,22,18],
 ['Ash Hollow','hamlet',660,-85,22,18],['Birch Fold','hamlet',988,-215,22,18],['Ochre Wells','hamlet',882,58,22,18],['Saltbush','hamlet',988,105,22,18]
];
let generator=null,sails=null,sailAngle=0;
function pad(name,kind,x,z,rx,rz,y){
 if(y===undefined){const values=[];for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)values.push(O.h(x+dx*rx*0.6,z+dz*rz*0.6));values.sort((a,b)=>a-b);y=Math.round(values[4]*4)/4;}
 const entry={name,kind,x,z,rx,rz,y:Math.max(y,(O.waterY(x,z)??-4)+0.75),bank:12,props:[]};S.sites.push(entry);O.pads.push(entry);AF.addLabel(name,x,z,'place');return entry;
}
AF.onBuild('outland-site-pads',496.2,()=>{
 for(const entry of specs)pad(...entry);
 let best={x:200,z:-820,y:0};for(let x=120;x<=340;x+=20)for(let z=-900;z<=-720;z+=20){const y=O.h(x,z);if(y>best.y)best={x,z,y};}pad('Ridge Refuge','hut',best.x,best.z,7,5,best.y);
 // night pools snapshot AF.lights once after build, so lamp lights must exist before the idle site builder runs
 const lamps={church:[10,12],fuel:[11,8],pub:[12,8]};
 for(const site of S.sites){const at=lamps[site.kind]??(site.kind==='hamlet'&&['Reedwick','Dune End','Ochre Wells','Saltbush'].includes(site.name)?[0,0]:null);if(at)AF.addLight({x:site.x+at[0],y:site.y+5,z:site.z+at[1],color:0xffc878,intensity:1,range:12,kind:'street'});}
});
// a coarse cell takes an exposed child's colour (shopfronts, signs and trims stay visible instead of the wall behind them)
function downsample(model){const coarse=new AF.Model(Math.ceil(model.w/2),Math.ceil(model.h/2),Math.ceil(model.d/2)),g=(x,y,z)=>model.get(x,y,z),open=(x,y,z)=>!g(x+1,y,z)||!g(x-1,y,z)||!g(x,y+1,z)||!g(x,y-1,z)||!g(x,y,z+1)||!g(x,y,z-1);for(let x=0;x<coarse.w;x++)for(let y=0;y<coarse.h;y++)for(let z=0;z<coarse.d;z++){let value=0,mixed=false;for(let dx=0;dx<2;dx++)for(let dy=0;dy<2;dy++)for(let dz=0;dz<2;dz++){const v=g(x*2+dx,y*2+dy,z*2+dz);if(v&&!value)value=v;else if(v&&v!==value)mixed=true;}if(mixed){let shown=0;for(let dx=0;dx<2&&!shown;dx++)for(let dy=0;dy<2&&!shown;dy++)for(let dz=0;dz<2&&!shown;dz++){const v=g(x*2+dx,y*2+dy,z*2+dz);if(v&&v!==value&&open(x*2+dx,y*2+dy,z*2+dz))shown=v;}if(shown)value=shown;}if(value)coarse.set(x,y,z,value);}return coarse;}
// three LODs per prop: full, 2x (outland level 1-2) and 4x (level >= 3, large props only; small ones drop out there).
// o.outer builds the model the coarse LODs start from (enterable shells: no interior); o.keep reuses the full mesh (text)
function* geometry(key,build,vs=0.5,o={}){let geo=cache.get(key);if(geo)return geo;const model=build();yield;geo=yield* AF.meshModelG(model,{vs,flat:true});const size=Math.max(model.w,model.h,model.d)*vs;geo.userData.small=size<3;if(o.keep){geo.userData.lod=geo;cache.set(key,geo);return geo;}const coarse=downsample(o.outer?o.outer():model);yield;geo.userData.lod=yield* AF.meshModelG(coarse,{vs:vs*2,flat:true});if(size>=8){yield;geo.userData.lod2=yield* AF.meshModelG(downsample(coarse),{vs:vs*4,flat:true});}cache.set(key,geo);return geo;}
function* house(key,width,depth,height,wall=trim,roof=slate){return yield* geometry(key,()=>{
 const m=new AF.Model(width+4,height+10,depth+6);m.box(2,0,2,width+2,1,depth+2,stone);m.box(2,1,2,width+2,height,depth+2,wall);
 for(let level=0;level<Math.min(width/2,depth/2);level++)m.box(1+level,height+level,1,width+3-level,height+level+1,depth+3,roof);
 m.box(width-2,height-1,4,width,height+8,6,red);m.box(width-3,height+8,3,width+1,height+9,7,stone);
 for(let x=4;x<width;x+=5){m.box(x,3,depth+1,x+2,6,depth+2,pane);m.box(x,6,depth+2,x+2,7,depth+3,trim);m.box(x,3,2,x+2,6,3,pane);}
 for(let z=5;z<depth;z+=5){m.box(2,3,z,3,6,z+2,pane);m.box(width+1,3,z,width+2,6,z+2,pane);}
 const middle=(width/2)|0;m.box(middle,1,depth+1,middle+3,6,depth+2,dark);m.box(middle-2,0,depth+2,middle+5,1,depth+6,stone);m.box(middle-2,7,depth+2,middle+5,8,depth+6,roof);for(const x of [middle-2,middle+4])m.box(x,1,depth+5,x+1,7,depth+6,trim);return m;
});}
function prop(site,geo,dx=0,dz=0,rot=0,opts={}){const placed=O.addProp(geo,site.x+dx,opts.y??site.y,site.z+dz,rot,{tag:'outland-site:'+site.name,...opts});site.props.push(placed);S.stats.props++;return placed;}
const box=function* (key,width,height,depth,col){return yield* geometry(key,()=>new AF.Model(width,height,depth).box(0,0,0,width,height,depth,col));};
function* fence(site,dx,dz,rot=0){return prop(site,yield* geometry('fence',()=>{const m=new AF.Model(32,4,1);for(let x=0;x<32;x+=8)m.box(x,0,0,x+1,4,1,wood);m.box(0,1,0,32,2,1,wood);m.box(0,3,0,32,4,1,wood);return m;}),dx,dz,rot);}
function* lamp(site,dx,dz){const geo=yield* geometry('lamp',()=>{const m=new AF.Model(4,12,4);m.box(1,0,1,2,10,2,dark);m.box(0,9,0,3,11,3,glow);m.box(0,11,0,3,12,3,dark);return m;});prop(site,geo,dx,dz);}
function* jetty(site,x,z,y,rot=0){
 const geo=yield* geometry('jetty',()=>{const m=new AF.Model(6,9,32);m.box(0,7,0,6,8,32,wood);for(const zz of [0,15,30])for(const xx of [0,5])m.box(xx,0,zz,xx+1,9,zz+1,wood);return m;});
 const entry=O.addProp(geo,x,y-3.5,z,rot,{tag:'outland-site:'+site.name});site.props.push(entry);S.stats.props++;
}
function* boat(){return yield* geometry('rowboat',()=>{const m=new AF.Model(5,3,10);m.box(1,0,1,4,1,9,wood);m.box(0,1,1,1,3,9,red);m.box(4,1,1,5,3,9,red);m.box(1,1,0,4,3,1,red);m.box(1,1,9,4,3,10,red);m.box(1,1,3,4,2,4,wood);m.box(1,1,6,4,2,7,wood);return m;});}
function* picnic(site){
 const table=yield* geometry('picnic-table',()=>{const m=new AF.Model(7,4,6);m.box(0,3,1,7,4,5,wood);for(const x of [1,5])m.box(x,0,2,x+1,3,4,dark);m.box(0,1,0,7,2,1,wood);m.box(0,1,5,7,2,6,wood);return m;});for(const dx of [-5,3])prop(site,table,dx,1);
}
function* farm(site){
 prop(site,yield* house('farmhouse',22,16,11));yield;prop(site,yield* house('barn',26,18,12,red,dark),18,-3,1);yield;
 prop(site,yield* geometry('silo',()=>{const m=new AF.Model(10,24,10);for(let y=0;y<21;y++)for(let x=0;x<10;x++)for(let z=0;z<10;z++)if(Math.hypot(x-4.5,z-4.5)<4.8)m.set(x,y,z,y%4?stone:trim);for(let layer=0;layer<3;layer++)m.box(layer,21+layer,layer,10-layer,22+layer,10-layer,slate);return m;}),26,-12);yield;
 const hay=yield* box('hay',5,3,4,gold);for(let index=0;index<6;index++){prop(site,hay,14+(index%3)*3,12+Math.floor(index/3)*2.5,0,{y:site.y+(index>3?0.5:0)});yield;}
 // sheds, bins, machines, coop, well, hives (44-farms)
 if(AF.farms)yield* AF.farms.farmstead(site);yield;
 for(const dz of [-22,22])for(const dx of [-22,-6,18]){yield* fence(site,dx,dz);yield;}yield* fence(site,-30,0,1);yield;
 for(let dx=-24;dx<=-10;dx+=7)for(let dz=-14;dz<=7;dz+=7){F.add('maple-gold',site.x+dx,site.z+dz,{y:site.y,scale:0.5,planted:true,biome:'orchard'});yield;}
 for(let index=0;index<5;index++){F.add('shrub',site.x-29,site.z-16+index*8,{y:site.y,planted:true});yield;}
}
function* windmill(site){
 prop(site,yield* geometry('windmill-tower',()=>{const m=new AF.Model(14,34,14);for(let level=0;level<28;level++){const inset=Math.floor(level/9);m.box(inset+1,level,inset+1,13-inset,level+1,13-inset,level%5?trim:stone);}for(let layer=0;layer<6;layer++)m.box(layer,28+layer,layer,14-layer,29+layer,14-layer,slate);m.box(5,0,12,9,6,13,dark);return m;}));S.windmills.push({x:site.x,y:site.y+11,z:site.z+3.8});
}
function* hamlet(site){
 const dry=O.biome(site.x,site.z)==='desert',layouts=[[-11,-5,0],[7,-5,0],[0,9,2]];
 for(let index=0;index<layouts.length;index++){
  const [dx,dz,rot]=layouts[index],small=index===2;
  prop(site,yield* house('hamlet-'+(dry?'adobe':'rural')+'-'+(small?'small':'large'),small?14:18,small?12:14,small?8:10,dry?adobe:trim,dry?clay:slate),dx,dz,rot);S.stats.houses++;yield;
 }
 if(['Reedwick','Dune End','Ochre Wells','Saltbush'].includes(site.name))yield* lamp(site,0,0);
 yield* picnic(site);
 for(const dx of [-18,18])for(const dz of [-12,12]){F.add(dry?'dry-bush':'shrub',site.x+dx,site.z+dz,{y:site.y,planted:true,scale:0.8});yield;}
 S.stats.hamlets++;
}
S.lib={geometry,house,prop,lamp,picnic,fence,color,palette:{wood,trim,stone,red,slate,gold,dark,pane,grass,glow,adobe,clay}};
function* build(){
 for(const site of S.sites){
    if(site.kind==='farm')yield* farm(site);
  else if(site.kind==='hamlet')yield* hamlet(site);
  else if(site.kind==='windmill')yield* windmill(site);
  else if(site.kind==='winery'){if(AF.farms)yield* AF.farms.winery(site);}
  else if(site.kind==='church'){prop(site,yield* house('church',14,28,14,stone,slate));prop(site,yield* geometry('church-tower',()=>{const m=new AF.Model(10,37,10);m.box(1,0,1,9,26,9,stone);m.box(3,20,8,7,24,9,dark);for(let layer=0;layer<7;layer++)m.box(1+Math.floor(layer/2),26+layer,1+Math.floor(layer/2),9-Math.floor(layer/2),27+layer,9-Math.floor(layer/2),slate);m.box(4,32,4,5,37,5,trim);m.box(3,34,4,6,35,5,trim);return m;}),0,10);yield* lamp(site,10,12);}
  else if(site.kind==='fuel'){prop(site,yield* house('fuel-office',12,8,7,trim,red),-5,-2);prop(site,yield* geometry('fuel-canopy',()=>{const m=new AF.Model(24,12,16);m.box(0,10,0,24,12,16,red);for(const x of [1,22])for(const z of [1,14])m.box(x,0,z,x+1,10,z+1,trim);for(const x of [8,15]){m.box(x,0,7,x+2,5,9,trim);m.box(x,3,9,x+2,4,10,dark);}return m;}),4,3,0,{collide:false});for(const dx of [2,6])prop(site,yield* box('fuel-pump',2,5,2,trim),dx,3);yield* lamp(site,11,8);}
  else if(site.kind==='tower'){prop(site,yield* geometry('lookout',()=>{const m=new AF.Model(14,40,14);for(const x of [1,12])for(const z of [1,12]){m.box(x,0,z,x+1,28,z+1,wood);m.line(x,1,z,13-x,26,z,wood);}m.box(0,27,0,14,28,14,wood);m.box(2,28,2,12,35,12,wood);m.box(3,30,11,11,33,12,pane);m.box(1,35,1,13,37,13,slate);for(let y=1;y<28;y+=2)m.box(6,y,12,9,y+1,13,trim);return m;}));}
  else if(site.kind==='camp'){const tent=yield* geometry('tent',()=>{const m=new AF.Model(8,7,12);for(let layer=0;layer<6;layer++)m.box(Math.floor(layer/2),layer,0,8-Math.floor(layer/2),layer+1,12,layer%2?gold:red);m.box(3,0,11,5,4,12,dark);return m;});for(const dx of [-7,0,7])prop(site,tent,dx,-2);prop(site,yield* box('camp-fire',3,1,3,stone),0,5,0,{collide:false});yield* picnic(site);yield* jetty(site,797,-168,13.75,1);}
  else if(site.kind==='picnic')yield* picnic(site);
  else {const kind=site.kind;prop(site,yield* house(kind,kind==='lodge'?42:kind==='pub'?30:kind==='mill'?24:20,kind==='lodge'?22:16,kind==='pub'?15:11,kind==='cottage'?trim:wood,kind==='pub'?red:slate));if(kind==='mill'){prop(site,yield* geometry('mill-wheel',()=>{const m=new AF.Model(2,16,16);for(let y=0;y<16;y++)for(let z=0;z<16;z++){const radius=Math.hypot(y-7.5,z-7.5);if(radius>5.5&&radius<7.5||Math.abs(y-7.5)<0.8||Math.abs(z-7.5)<0.8)m.box(0,y,z,2,y+1,z+1,wood);}return m;}),7,0,0,{y:site.y-1});}if(kind==='lodge'){yield* picnic(site);yield* jetty(site,-35,-608,22.75);for(let index=0;index<2;index++)prop(site,yield* boat(),-36-index*5,-48,0,{y:22,collide:false});}if(kind==='boathouse')yield* jetty(site,site.x-4,site.z-4,22.75,1);if(kind==='pub'){yield* lamp(site,12,8);prop(site,yield* geometry('pub-sign',()=>AF.textModel('THE RED FOX',gold,{bg:red,pad:2,depth:1}),0.07,{keep:true}),0,5,0,{y:site.y+4,collide:false});}}
  if(site.kind!=='camp'&&site.kind!=='picnic'&&site.kind!=='tower')for(const dx of [-site.rx-2,site.rx+2])F.add(O.biome(site.x,site.z)==='desert'?'cactus':'elm-green',site.x+dx,site.z+site.rz+2,{planted:true,scale:0.7});
  yield;
 }
 for(const [x,z]of [[-230,-785],[290,-880],[475,-715],[-1180,225],[930,235]]){O.addProp(yield* box('cairn',3,4,3,stone),x,O.h(x,z),z,0,{tag:'outland-cairn'});yield;}
 const signGreen=color(0x2f6b46,{jitter:0.1}),signInk=color(0xf4f2e8,{jitter:0.05});
 for(const road of AF.PLAN.world.roads){if(road.driveway)continue;
  // a green name board on two posts (1/20 m voxels: legible letters, full mesh at every LOD), facing oncoming traffic
  const sign=yield* geometry('signpost-'+road.name,()=>{const text=AF.textModel(road.name,signInk,{bg:signGreen,pad:1,depth:1}),m=new AF.Model(text.w,40+text.h,3);for(const x of [3,text.w-5])m.box(x,0,0,x+2,40,1,dark);for(let x=0;x<text.w;x++)for(let y=0;y<text.h;y++)for(let z=0;z<text.d;z++){const v=text.get(x,y,z);if(v)m.set(x,40+y,1+z,v);}return m;},0.05,{keep:true});
  const ctrl=road.ctrl??road.points;for(let index=1;index<ctrl.length;index+=2){const [x,z]=ctrl[index],next=ctrl[Math.min(ctrl.length-1,index+1)],prev=ctrl[index-1],tx=next[0]-prev[0],tz=next[1]-prev[1],length=Math.hypot(tx,tz)||1,offset=road.w/2+5,sx=x-tz/length*offset,sz=z+tx/length*offset;if(O.roadInfo(x,z).flag||O.roadDistance(sx,sz)<7||O.waterY(sx,sz)!==null)continue;O.addProp(sign,sx,O.h(sx,sz),sz,Math.abs(tx)>Math.abs(tz)?(tx>0?3:1):(tz>0?2:0),{tag:'outland-signpost'});yield;}}
 const sailGeo=(yield* geometry('windmill-sails',()=>{const m=new AF.Model(30,30,1);m.box(13,0,0,16,30,1,trim);m.box(0,13,0,30,16,1,trim);for(let index=0;index<30;index+=3){m.box(12,index,0,17,index+1,1,wood);m.box(index,12,0,index+1,17,1,wood);}return m;})).clone().translate(0,-7.5,0);
 sails=new THREE.InstancedMesh(sailGeo,AF.mat.voxelInst,2);sails.name='outland-windmill-sails';sails.count=0;sails.frustumCulled=false;sails.castShadow=false;sails.customDepthMaterial=AF.mat.depthInst;AF.scene.add(sails);
 S.stats.ready=true;
}
const work=S.work=ms=>{if(!AF.ready||S.stats.ready)return false;const start=performance.now(),end=start+Math.min(ms,AF.MOBILE?2:3);if(!generator)generator=build();while(performance.now()<end&&!S.stats.ready){const slice=performance.now();generator.next();S.stats.maxStepMs=Math.max(S.stats.maxStepMs??0,performance.now()-slice);}const elapsed=performance.now()-start;S.stats.workMs+=elapsed;S.stats.maxSliceMs=Math.max(S.stats.maxSliceMs??0,elapsed);return !S.stats.ready;};
S.settle=()=>{while(work(4));};AF.stream.register('outland-sites',{order:25,gen:true,work,near:()=>AF.ready&&!S.stats.ready});
const matrix=new THREE.Matrix4(),pos=new THREE.Vector3(),rot=new THREE.Quaternion(),unit=new THREE.Vector3(1,1,1),axis=new THREE.Vector3(0,0,1);
AF.onTick('outland-windmills',332,dt=>{if(!sails)return;const cp=AF.camera.position;let count=0,local=false;for(const mill of S.windmills)if((mill.x-cp.x)**2+(mill.y-cp.y)**2+(mill.z-cp.z)**2<=160000)local=true;if(!local){if(sails.count){sails.count=0;sails.layers.set(31);}return;}sailAngle+=dt*0.4;for(const mill of S.windmills){if((mill.x-cp.x)**2+(mill.y-cp.y)**2+(mill.z-cp.z)**2>160000)continue;pos.set(mill.x,mill.y,mill.z);rot.setFromAxisAngle(axis,sailAngle);matrix.compose(pos,rot,unit);sails.setMatrixAt(count++,matrix);}sails.count=count;sails.layers.set(count?0:31);sails.instanceMatrix.needsUpdate=true;});
AF.onBuild('outland-walkers',665,()=>{
 const add=(name,points,count,mode='loop')=>{
  const path=[],height=(x,z)=>Math.ceil(Math.max(O.h(x-0.35,z-0.35),O.h(x+0.35,z-0.35),O.h(x-0.35,z+0.35),O.h(x+0.35,z+0.35))*4)/4+0.25;
  for(let index=0;index<points.length;index++){const before=points[index],at=points[(index+1)%points.length];if(mode!=='loop'&&index===points.length-1){path.push([before[0],height(...before),before[1]]);break;}const steps=Math.ceil(Math.hypot(at[0]-before[0],at[1]-before[1])/1.5);for(let part=0;part<steps;part++){const x=AF.lerp(before[0],at[0],part/steps),z=AF.lerp(before[1],at[1],part/steps);path.push([x,height(x,z),z]);}}
  AF.walkers.addPath(name,path,{count,mode,speed:0.85,activeRadius:140,luggage:0});S.stats.walkers+=count;
 };
 const road=AF.PLAN.world.roads.find(road=>road.name==='Lake Road');if(road){const points=[];for(let index=1;index<road.points.length;index++){const before=road.points[index-1],at=road.points[index],steps=Math.ceil(Math.hypot(at[0]-before[0],at[1]-before[1])/5);for(let part=0;part<steps;part++){const x=AF.lerp(before[0],at[0],part/steps),z=AF.lerp(before[1],at[1],part/steps);if(z<-316)points.push([x,z]);}}points.push(road.points[road.points.length-1]);add('Lake Road hikers',points,6,'pingpong');}
 const shore=[];for(let index=0;index<48;index++){const angle=index/48*Math.PI*2,sin=Math.sin(angle);shore.push([-40+Math.cos(angle)*98+10*Math.max(0,sin),-650+sin*(sin>0?96:68)]);}add('Tamsin hikers',shore,8);
 add('Westmoor villagers',[[-1004,-39],[-992,-39],[-992,-28],[-1004,-28]],8);
});
AF.test('outland-sites: named rural sites have merged solid colliders',()=>{S.settle();const bad=S.sites.filter(site=>!site.props.length||!site.props.some(prop=>prop.col));return{ok:S.sites.length>=20&&!bad.length&&S.windmills.length===2,info:S.sites.length+' sites, '+S.stats.props+' merged props, missing solids '+bad.map(site=>site.name).join(',')};});
AF.test('outland: wheat fields carry shared instanced crops; hamlets furnished',()=>{
 S.settle();const FM=AF.farms;if(FM)FM.settle();const wheat=FM?FM.stats.kinds[0]:0;
 return{ok:wheat>500&&FM.meshes.length===5&&S.stats.hamlets===8&&S.stats.houses===24,info:wheat+' wheat segments (44-farms), '+S.stats.hamlets+' hamlets / '+S.stats.houses+' houses'};
});
AF.test('outland-sites: hikers and villagers leave island walker capacity',()=>{
 S.settle();const used=AF.walkers.paths.reduce((sum,path)=>sum+path.count,0),hits=[];let blocked=0,samples=0;
 for(const path of AF.walkers.paths){if(!/^(Lake Road hikers|Tamsin hikers|Westmoor villagers)$/.test(path.name))continue;for(let index=1;index<path.points.length;index++){const before=path.points[index-1],at=path.points[index],steps=Math.ceil(Math.hypot(at[0]-before[0],at[2]-before[2])/2);for(let part=0;part<=steps;part++){const fraction=part/steps,x=AF.lerp(before[0],at[0],fraction),z=AF.lerp(before[2],at[2],fraction),y=Math.max(AF.W.groundY(x,z),AF.lerp(before[1],at[1],fraction));samples++;if(AF.boxBlocked(x,y+0.4,z,0.18,1.2)){blocked++;if(hits.length<8){const boxes=AF.colliders.get(Math.floor(x/8)*100000+Math.floor(z/8))??[];hits.push({path:path.name,x:+x.toFixed(1),z:+z.toFixed(1),y:+y.toFixed(1),tags:boxes.filter(box=>x+0.18>box.x0&&x-0.18<box.x1&&z+0.18>box.z0&&z-0.18<box.z1&&y+1.6>box.y0&&y+0.4<box.y1).map(box=>box.tag??'untagged')});}}}}}
 return{ok:S.stats.walkers===22&&used<=AF.walkers.capacity-160&&!blocked,info:used+'/'+AF.walkers.capacity+', outland '+S.stats.walkers+', path obstructions '+blocked+'/'+samples+' '+JSON.stringify(hits)};
});
}catch(e){AF.partError('44-sites.js',e);}