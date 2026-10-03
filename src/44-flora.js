try {
const O=AF.outland,W=AF.W,hash=AF.hash2;
const F=AF.flora={kinds:{},records:[],meshes:[],stats:{total:0,biomes:{},near:0,far:0,draws:0,triangles:0,workMs:0,maxSliceMs:0,generated:false}};
const buckets=new Map(),batches=[],slots=[],matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),position=new THREE.Vector3(),scale=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
const frustum=new THREE.Frustum(),projection=new THREE.Matrix4(),sphere=new THREE.Sphere();
const group=new THREE.Group();group.name='flora';AF.scene.add(group);
const uniforms={floraEye:{value:AF.camera.position},floraNear:{value:160},floraFar:{value:800},floraShadow:{value:55}};
let generator=null,selection=null,lastX=Infinity,lastY=Infinity,lastZ=Infinity,lastQ=new THREE.Quaternion(),revision=0,selected=-1,ready=false;
const palette=colors=>colors.map(hex=>AF.col(hex,{jitter:0.7,edge:0.15,solid:false,pat:'none'}));
for(const spec of AF.land.treeSpecs)F.kinds[spec.id]={shape:spec.shape==='pine'||spec.shape==='cone'?1:0,palette:palette(spec.leaves),spec};
F.kinds.palm={shape:2,palette:palette([0x36754e,0x53935c,0x275a42,0x74a567])};
F.kinds.shrub={shape:5,palette:palette([0x477344,0x689452,0x365739,0x7b9e57])};
F.kinds['dry-bush']={shape:5,palette:palette([0x8e955c,0xa5a46b,0x747b4f,0xb4ad7b])};
F.kinds.cactus={shape:4,palette:palette([0x568864,0x73976b,0x3c6d50,0x96a579])};
F.kinds.rock={shape:3,palette:palette([0x8a8c82,0xa3a296,0x6f756b,0xb2ac9d])};
const blocked=(x,z)=>O.roadDistance(x,z)<14||O.waterY(x,z)!==null||O.pads.some(pad=>Math.abs(x-pad.x)<pad.rx+4&&Math.abs(z-pad.z)<pad.rz+4);
F.add=(kind,x,z,opts={})=>{
 const design=F.kinds[kind];if(!design)throw new Error('Unknown flora kind: '+kind);
 if(!Number.isFinite(x)||!Number.isFinite(z)||!Number.isFinite(opts.scale??1)||(opts.scale??1)<=0||!Number.isFinite(opts.rot??0)||!Number.isFinite(opts.y??0))throw new Error('Invalid flora position/scale');
 if(O.roadDistance(x,z)<14||O.waterY(x,z)!==null)return null;
 const beach=x<-660&&x-O.coastX(z)<55;
 if(opts.planted!==true&&(O.pads.some(pad=>Math.abs(x-pad.x)<pad.rx+4&&Math.abs(z-pad.z)<pad.rz+4)||!beach&&O.biome(x,z)==='farmland'&&O.fieldEdge(x,z)>5&&!(design.shape===5&&O.fieldMeadow(x,z))))return null;
 const y=opts.y??(W.col(x,z)>=0?W.groundY(x,z):Math.round(O.h(x,z)*4)/4),biome=opts.biome??O.biome(x,z);
 const base=(opts.scale??1)*(design.scale??1),sx=base*(0.85+hash(x+109,z)*0.3),sy=base*(0.85+hash(x,z+211)*0.45);
 const entry={kind,shape:design.shape,x,y,z,scale:base,sx,sy,rot:opts.rot??hash(x*4,z*4)*Math.PI*2,pal:design.palette,biome,planted:!!opts.planted,range:design.shape===5?145:hash(x+371,z+89)<0.28?0:300};
 const key=Math.floor(x/64)*10000+Math.floor(z/64);let bucket=buckets.get(key);if(!bucket){bucket=[];buckets.set(key,bucket);}bucket.push(entry);F.records.push(entry);
 F.stats.total++;F.stats.biomes[biome]=(F.stats.biomes[biome]??0)+1;revision++;
 if(opts.collide)entry.col=AF.addCollider(x-0.3,y,z-0.3,x+0.3,y+entry.scale*3,z+0.3,'flora-trunk');
 return entry;
};
F.scatter=(kind,{x0,z0,x1,z1,spacing=12,density=0.5,seed=44,...opts})=>{
 if(!(spacing>0)||!Number.isFinite(spacing)||![x0,z0,x1,z1,density].every(Number.isFinite))throw new Error('Invalid flora scatter');
 let count=0;for(let x=x0;x<x1;x+=spacing)for(let z=z0;z<z1;z+=spacing){if(hash(x+seed,z)>density)continue;const px=x+(hash(x,z+seed)-0.5)*spacing*0.7,pz=z+(hash(x+seed,z+7)-0.5)*spacing*0.7;if(F.add(kind,px,pz,opts))count++;}return count;
};
function crown(shape,design){
 const leaves=design.palette,bark=AF.col(shape===2?0x786348:0x594736,{jitter:0.5,pat:'none'}),m=new AF.Model(shape===2?24:20,shape===1?34:28,shape===2?24:20);
 if(shape===0){m.box(9,0,9,11,13,11,bark);m.box(3,10,4,17,18,16,leaves[2]);m.box(1,14,6,19,21,14,leaves[0]);m.box(5,13,2,15,22,18,leaves[0]);m.box(4,21,5,16,24,15,leaves[1]);m.box(7,24,7,13,26,13,leaves[3]);}
 else if(shape===1){m.box(9,0,9,11,30,11,bark);for(let layer=0;layer<5;layer++){const inset=2+layer;m.box(inset,6+layer*5,inset,20-inset,10+layer*5,20-inset,leaves[layer%4]);m.box(inset+2,10+layer*5,inset+2,18-inset,12+layer*5,18-inset,leaves[layer%4]);}}
 else {m.box(11,0,11,13,14,13,bark);m.box(12,14,11,14,24,13,bark);m.box(3,24,10,21,25,14,leaves[0]);m.box(10,25,3,14,26,21,leaves[1]);m.box(6,25,6,18,27,18,leaves[2]);for(const edge of [3,18]){m.box(edge,22,10,edge+3,24,14,leaves[0]);m.box(10,23,edge,14,25,edge+3,leaves[1]);}}
 return {m,vs:shape===1?0.5:shape===2?0.4:0.45};
}
function hull(shape,design){
 const leaf=design.palette[0],bark=AF.col(0x594736,{jitter:0.5,pat:'none'}),m=new AF.Model(12,20,12);
 if(shape===3){m.box(3,0,2,9,2,10,leaf);m.box(2,1,3,10,3,9,leaf);return{m,vs:0.5};}
 if(shape===4){m.box(5,0,5,7,14,7,leaf);m.box(2,6,5,10,8,7,leaf);m.box(2,7,5,4,11,7,leaf);m.box(8,7,5,10,13,7,leaf);return{m,vs:0.3};}
 if(shape===5){m.box(2,0,3,10,2,9,design.palette[2]);m.box(3,2,2,9,4,10,leaf);m.box(4,4,4,8,5,8,design.palette[1]);return{m,vs:0.3};}
 m.box(5,0,5,6,shape===2?16:13,6,bark);
 if(shape===1){m.box(1,5,1,11,12,11,leaf);m.box(3,12,3,9,19,9,leaf);}
 else if(shape===2){m.box(1,16,5,11,17,7,leaf);m.box(5,17,1,7,18,11,leaf);m.box(3,17,3,9,18,9,leaf);}
 else {m.box(2,6,2,10,14,10,leaf);}
 return{m,vs:shape===2?0.6:0.85};
}
function remap(geo,pal){const attr=geo.attributes.aPal,values=new Float32Array(attr.count),colors=pal.map(value=>AF.PAL.hex[value]);for(let index=0;index<values.length;index++){const value=attr.getX(index),slot=colors.indexOf(AF.PAL.hex[value]);values[index]=slot<0?value:-slot-1;}geo.setAttribute('aPal',new THREE.BufferAttribute(values,1));return geo;}
function material(lod){
 const mat=AF.mat.patchVoxel(AF.mat.voxelInst.clone(),'flora-'+lod),compile=mat.onBeforeCompile;
 mat.onBeforeCompile=(shader,renderer)=>{
  compile(shader,renderer);Object.assign(shader.uniforms,uniforms);
  shader.vertexShader='attribute vec4 floraPalette; attribute float floraLimit; uniform vec3 floraEye; varying float floraDistance; varying float floraExtent;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('vec2 pUV =','float floraPal=aPal < -3.5 ? floraPalette.w : aPal < -2.5 ? floraPalette.z : aPal < -1.5 ? floraPalette.y : aPal < -0.5 ? floraPalette.x : aPal;\nvec2 pUV =').replace('mod(aPal,','mod(floraPal,').replace('floor(aPal /','floor(floraPal /').replace('#include <begin_vertex>','#include <begin_vertex>\nfloraExtent=floraLimit;floraDistance=distance((modelMatrix * instanceMatrix * vec4(0.,0.,0.,1.)).xyz,floraEye);');
  shader.fragmentShader='uniform float floraNear; uniform float floraFar; varying float floraDistance; varying float floraExtent;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\n{float floraD=fract(52.9829189*fract(dot(floor(gl_FragCoord.xy),vec2(0.06711056,0.00583715))));float floraN=1.-smoothstep(floraNear-16.,floraNear+16.,floraDistance);float floraEnd=min(floraFar,floraExtent);float floraF=1.-smoothstep(floraEnd-55.,floraEnd,floraDistance);if('+ (lod===0?'floraD>=min(floraN,floraF)':lod===1?'floraD<floraN||floraD>=floraF':'floraD>=floraF') +')discard;}');
 };
 mat.customProgramCacheKey=()=> 'flora-'+lod;return mat;
}
function* models(){
 const designs=[F.kinds['maple-orange'],F.kinds.pine,F.kinds.palm,F.kinds.rock,F.kinds.cactus,F.kinds.shrub],materials=[material(0),material(1),material(2)];
 const depth=AF.mat.depthInst.clone();depth.onBeforeCompile=shader=>{Object.assign(shader.uniforms,uniforms);shader.vertexShader='uniform vec3 floraEye; varying float floraDistance;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nfloraDistance=distance((modelMatrix * instanceMatrix * vec4(0.,0.,0.,1.)).xyz,floraEye);');shader.fragmentShader='uniform float floraShadow; varying float floraDistance;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(floraDistance>floraShadow)discard;');};depth.customProgramCacheKey=()=> 'flora-depth';
 for(let shape=0;shape<6;shape++){
  const design=designs[shape],source=shape<3?crown(shape,design):hull(shape,design),far=hull(shape,design),single=shape===3||shape===5;
  slots[shape]={near:null,far:null,single:null};
  yield;
  const geometry=remap(yield* AF.meshModelG(source.m,{vs:source.vs,flat:true}),design.palette);
  yield;
  const farGeo=single?geometry:remap(yield* AF.meshModelG(far.m,{vs:far.vs,flat:true}),design.palette);
  yield;
  for(let lod=0;lod<2;lod++){
    if(single&&lod===1)continue;
    const geo=lod?farGeo:geometry,capacity=lod?6000:2200,pal=new THREE.InstancedBufferAttribute(new Float32Array(capacity*4),4),limit=new THREE.InstancedBufferAttribute(new Float32Array(capacity),1);pal.setUsage(THREE.DynamicDrawUsage);limit.setUsage(THREE.DynamicDrawUsage);geo.setAttribute('floraPalette',pal);geo.setAttribute('floraLimit',limit);
    const mesh=new THREE.InstancedMesh(geo,materials[single?2:lod],capacity);mesh.name='flora-'+shape+'-'+lod;mesh.count=0;mesh.frustumCulled=false;mesh.castShadow=lod===0&&!single;mesh.receiveShadow=true;mesh.customDepthMaterial=depth;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);group.add(mesh);F.meshes.push(mesh);const batch={shape,lod,mesh,capacity,write:0};batches.push(batch);slots[shape][single?'single':lod?'far':'near']=batch;
  }
  yield;
 }
}
function* generate(){
 F.stats.phase='models';
 yield* models();
 F.stats.phase='scatter';
 const choices=['maple-scarlet','maple-orange','maple-gold','elm-green','maple-turning','birch','oak'];
 for(let x=-1280;x<1080;x+=7){for(let z=-1150;z<270;z+=7){
  const px=x+(hash(x,z+11)-0.5)*5,pz=z+(hash(x+13,z)-0.5)*5;
  yield;
  if(W.col(px,pz)>=0||blocked(px,pz))continue;
  const biome=O.biome(px,pz),height=O.h(px,pz);if(height<3)continue;
  const slope=Math.max(Math.abs(O.h(px+4,pz)-O.h(px-4,pz)),Math.abs(O.h(px,pz+4)-O.h(px,pz-4)))/8;
  const rnd=hash(x+991,z),beach=px<-660&&px-O.coastX(pz)<55;
  if(beach){if(rnd<0.45)F.add('palm',px,pz,{scale:0.7+hash(x,z+83)*0.3,biome:'beach'});else if(rnd>0.8)F.add('shrub',px,pz,{scale:0.65,biome:'beach'});continue;}
  if(biome==='desert'){if(rnd<0.13&&slope<0.6)F.add('cactus',px,pz,{scale:0.85+hash(x+4,z)*0.45,biome});else if(rnd<0.42)F.add('dry-bush',px,pz,{scale:0.6+hash(x,z+98)*0.7,biome});else if(rnd>0.91)F.add('rock',px,pz,{scale:0.35+hash(x,z+98)*0.5,biome});continue;}
  const density=biome==='farmland'?(O.fieldEdge(px,pz)<4.5?0.68:0):O.forestDensity(px,pz)*0.9+(height<78?0.035:0);
  if(biome==='farmland'&&O.fieldMeadow(px,pz)&&rnd<0.035&&slope<0.5){F.add('shrub',px,pz,{scale:0.6,biome});continue;}
  if(height<118&&slope<1.1&&rnd<density){const conifer=biome==='range'&&hash(x+91,z)>0.18;F.add(biome==='farmland'&&rnd>0.32?'shrub':conifer?'pine':choices[Math.floor(hash(x,z+55)*choices.length)],px,pz,{scale:0.8+hash(x+4,z)*0.45,biome});}
  else if(height<100&&slope<0.7&&biome!=='farmland'&&rnd<density+0.13)F.add('shrub',px,pz,{scale:0.65+hash(x,z+39)*0.4,biome});
  else if((biome==='range'&&height>48&&slope>0.35||biome==='forest')&&rnd>0.91)F.add('rock',px,pz,{scale:0.65+hash(x,z+98)*1.1,biome});
 }yield;}
 F.stats.phase='island';
 const isle=AF.PLAN.world.island;
 for(let x=isle.cx-isle.rx;x<isle.cx+isle.rx;x+=14)for(let z=isle.cz-isle.rz;z<isle.cz+isle.rz;z+=14){
  yield;
  if(hash(x+47,z)>0.18||Math.abs(z-isle.airstrip.z)<20||blocked(x,z)||(x-isle.resort.x)**2+(z-isle.resort.z)**2<(isle.resort.r+8)**2)continue;
  const height=O.h(x,z);if(height>3&&height<12)F.add('palm',x,z,{scale:0.7+hash(x,z+38)*0.25,biome:'island'});
 }
 F.stats.generated=true;
}
function put(batch,entry){
 if(batch.write>=batch.capacity)return;const index=batch.write++,mesh=batch.mesh;
 position.set(entry.x,entry.y,entry.z);rotation.setFromAxisAngle(up,entry.rot);scale.set(entry.sx,entry.sy,entry.sx);matrix.compose(position,rotation,scale);mesh.setMatrixAt(index,matrix);mesh.geometry.attributes.floraPalette.array.set(entry.pal,index*4);mesh.geometry.attributes.floraLimit.array[index]=entry.range||uniforms.floraFar.value;
}
function upload(attr,count){attr.clearUpdateRanges();attr.addUpdateRange(0,Math.max(1,count)*attr.itemSize);attr.needsUpdate=true;}
function* select(){
 F.stats.phase='select';
 const cp=AF.camera.position,cx=cp.x,cy=cp.y,cz=cp.z,near=AF.MOBILE||AF.GFX.tier==='low'?80:AF.GFX.lite?125:190,far=AF.MOBILE||AF.GFX.tier==='low'?480:AF.GFX.lite?720:880;
 uniforms.floraNear.value=near;uniforms.floraFar.value=far;uniforms.floraShadow.value=AF.MOBILE?25:55;
 AF.camera.updateMatrixWorld();projection.multiplyMatrices(AF.camera.projectionMatrix,AF.camera.matrixWorldInverse);frustum.setFromProjectionMatrix(projection);
 for(const batch of batches)batch.write=0;
 const radius=Math.ceil((far+64)/64),bx=Math.floor(cx/64),bz=Math.floor(cz/64);
 for(let ix=bx-radius;ix<=bx+radius;ix++)for(let iz=bz-radius;iz<=bz+radius;iz++){
  const bucket=buckets.get(ix*10000+iz);if(!bucket)continue;
    let processed=0;
    for(const entry of bucket){if(++processed%16===0)yield;const dx=entry.x-cx,dy=entry.y-cy,dz=entry.z-cz,distance=dx*dx+dy*dy+dz*dz,range=entry.range?Math.min(entry.range,far):far;if(distance>range*range)continue;sphere.center.set(entry.x,entry.y+8*entry.sy,entry.z);sphere.radius=24+10*entry.sx;if(distance>6400&&!frustum.intersectsSphere(sphere))continue;const slot=slots[entry.shape];if(slot.single)put(slot.single,entry);else {if(distance<(near+32)**2)put(slot.near,entry);if(distance>(near-32)**2)put(slot.far,entry);}}
  yield;
 }
 F.stats.near=F.stats.far=F.stats.draws=F.stats.triangles=0;
 for(const batch of batches){const mesh=batch.mesh;mesh.count=batch.write;mesh.layers.set(mesh.count?0:31);mesh.instanceMatrix.needsUpdate=true;upload(mesh.geometry.attributes.floraPalette,mesh.count);upload(mesh.geometry.attributes.floraLimit,mesh.count);F.stats[batch.lod?'far':'near']+=mesh.count;if(mesh.count){F.stats.draws++;F.stats.triangles+=mesh.count*mesh.geometry.index.count/3;}}
 lastX=cx;lastY=cy;lastZ=cz;lastQ.copy(AF.camera.quaternion);selected=revision;
}
const work=F.work=ms=>{
 if(!AF.ready)return false;const start=performance.now(),end=start+Math.min(ms,AF.MOBILE?1.5:2);
 while(performance.now()<end){
  const slice=performance.now();
  if(!F.stats.generated){if(!generator)generator=generate();if(generator.next().done){generator=null;ready=true;}}
    else {if(!selection&&(selected!==revision||(AF.camera.position.x-lastX)**2+(AF.camera.position.y-lastY)**2+(AF.camera.position.z-lastZ)**2>576||Math.abs(lastQ.dot(AF.camera.quaternion))<0.995))selection=select();if(!selection)break;if(selection.next().done)selection=null;}
  const elapsed=performance.now()-slice;if(elapsed>F.stats.maxSliceMs){F.stats.maxSliceMs=elapsed;F.stats.maxSlicePhase=F.stats.phase;}
 }
 const elapsed=performance.now()-start;F.stats.workMs+=elapsed;F.stats.maxWorkMs=Math.max(F.stats.maxWorkMs??0,elapsed);return !ready||!!selection||selected!==revision;
};
F.settle=()=>{if(AF.outlandSites)AF.outlandSites.settle();while(work(6));};
AF.onIdle('flora-build',work);
AF.test('flora: biome populations and reusable palm/shrub API',()=>{
 F.settle();const counts={range:0,forest:0,farmland:0,valley:0};for(const entry of F.records)if(entry.kind!=='rock'&&counts[entry.biome]!==undefined)counts[entry.biome]++;
 return{ok:!!(counts.range>100&&counts.range<13000&&counts.forest>150&&counts.forest<6000&&counts.farmland>30&&counts.farmland<2000&&counts.valley>5&&F.kinds.palm&&F.kinds.shrub&&F.kinds.cactus&&F.records.some(entry=>entry.sx!==entry.sy)),info:JSON.stringify(counts)};
});
AF.test('flora: natural trees avoid roads, water and crop interiors',()=>{
 F.settle();let bad=0,checked=0;for(const entry of F.records){if(entry.kind==='rock')continue;checked++;if(O.roadDistance(entry.x,entry.z)<14||O.waterY(entry.x,entry.z)!==null||!entry.planted&&entry.biome==='farmland'&&O.fieldEdge(entry.x,entry.z)>5&&!(entry.shape===5&&O.fieldMeadow(entry.x,entry.z)))bad++;}return{ok:checked>300&&!bad,info:checked+' trees/shrubs, '+bad+' exclusions violated'};
});
AF.test('flora: ten shared draws for six shapes with bounded triangle load',()=>{
 F.settle();return{ok:F.meshes.length===10&&F.stats.draws<=10&&F.stats.triangles<350000&&F.meshes.every(mesh=>mesh.frustumCulled===false&&mesh.material.customProgramCacheKey().startsWith('flora-')),info:F.stats.draws+' draws, '+F.stats.triangles+' triangles'};
});
}catch(e){AF.partError('44-flora.js',e);}