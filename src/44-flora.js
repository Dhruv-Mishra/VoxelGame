try {
const O=AF.outland,W=AF.W,hash=AF.hash2;
const F=AF.flora={kinds:{},records:[],meshes:[],stats:{total:0,biomes:{},near:0,far:0,draws:0,triangles:0,workMs:0,maxSliceMs:0,generated:false}};
const buckets=new Map(),batches=[],matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),position=new THREE.Vector3(),scale=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
const frustum=new THREE.Frustum(),projection=new THREE.Matrix4(),sphere=new THREE.Sphere();
const group=new THREE.Group();group.name='flora';AF.scene.add(group);
const uniforms={floraEye:{value:AF.camera.position},floraNear:{value:160},floraFar:{value:800},floraShadow:{value:55}};
let generator=null,selection=null,lastX=Infinity,lastY=Infinity,lastZ=Infinity,lastQ=new THREE.Quaternion(),revision=0,selected=-1,ready=false;
const palette=colors=>colors.map(hex=>AF.col(hex,{jitter:0.7,edge:0.15,solid:false,pat:'none'}));
for(const spec of AF.land.treeSpecs)F.kinds[spec.id]={shape:spec.shape==='pine'||spec.shape==='cone'?1:0,palette:palette(spec.leaves),spec};
F.kinds.palm={shape:2,palette:palette([0x36754e,0x53935c,0x275a42,0x74a567])};
F.kinds.shrub={shape:0,palette:palette([0x477344,0x689452,0x365739,0x7b9e57]),scale:0.13};
F.kinds.rock={shape:3,palette:palette([0x8a8c82,0xa3a296,0x6f756b,0xb2ac9d])};
const blocked=(x,z)=>O.roadDistance(x,z)<14||O.waterY(x,z)!==null||O.pads.some(pad=>Math.abs(x-pad.x)<pad.rx+4&&Math.abs(z-pad.z)<pad.rz+4);
F.add=(kind,x,z,opts={})=>{
 const design=F.kinds[kind];if(!design)throw new Error('Unknown flora kind: '+kind);
 if(!Number.isFinite(x)||!Number.isFinite(z)||!Number.isFinite(opts.scale??1)||(opts.scale??1)<=0||!Number.isFinite(opts.rot??0)||!Number.isFinite(opts.y??0))throw new Error('Invalid flora position/scale');
 if(O.roadDistance(x,z)<14||O.waterY(x,z)!==null)return null;
 if(opts.planted!==true&&(O.pads.some(pad=>Math.abs(x-pad.x)<pad.rx+4&&Math.abs(z-pad.z)<pad.rz+4)||O.biome(x,z)==='farmland'&&O.fieldEdge(x,z)>5))return null;
 const y=opts.y??(W.col(x,z)>=0?W.groundY(x,z):Math.round(O.h(x,z)*4)/4),biome=opts.biome??O.biome(x,z);
 const entry={kind,shape:design.shape,x,y,z,scale:(opts.scale??1)*(design.scale??1),rot:opts.rot??hash(x*4,z*4)*Math.PI*2,pal:design.palette,biome,planted:!!opts.planted};
 const key=Math.floor(x/64)*10000+Math.floor(z/64);let bucket=buckets.get(key);if(!bucket){bucket=[];buckets.set(key,bucket);}bucket.push(entry);F.records.push(entry);
 F.stats.total++;F.stats.biomes[biome]=(F.stats.biomes[biome]??0)+1;revision++;
 if(opts.collide)entry.col=AF.addCollider(x-0.3,y,z-0.3,x+0.3,y+entry.scale*3,z+0.3,'flora-trunk');
 return entry;
};
F.scatter=(kind,{x0,z0,x1,z1,spacing=12,density=0.5,seed=44,...opts})=>{
 if(!(spacing>0)||!Number.isFinite(spacing)||![x0,z0,x1,z1,density].every(Number.isFinite))throw new Error('Invalid flora scatter');
 let count=0;for(let x=x0;x<x1;x+=spacing)for(let z=z0;z<z1;z+=spacing){if(hash(x+seed,z)>density)continue;const px=x+(hash(x,z+seed)-0.5)*spacing*0.7,pz=z+(hash(x+seed,z+7)-0.5)*spacing*0.7;if(F.add(kind,px,pz,opts))count++;}return count;
};
function palm(){
 const m=new AF.Model(25,32,25),bark=AF.col(0x786348,{jitter:0.6,edge:0.2}),leaves=F.kinds.palm.palette;
 for(let height=0;height<25;height++)m.box(12+Math.floor(height/12),height,12,13+Math.floor(height/12),height+1,13,bark);
 for(let branch=0;branch<8;branch++){const angle=branch*Math.PI/4;for(let length=0;length<11;length++){const x=14+Math.cos(angle)*length,z=12+Math.sin(angle)*length,y=27+Math.sin(length/11*Math.PI)*2-length*0.35;m.box(x-1,y,z-1,x+2,y+1,z+2,leaves[branch%4]);}}
 return {m,vs:0.4};
}
function hull(shape,design){
 const leaf=design.palette[0],bark=AF.col(0x594736,{jitter:0.5,pat:'none'}),m=new AF.Model(12,20,12);
 if(shape===3){m.box(3,0,2,9,2,10,leaf);m.box(2,1,3,10,3,9,leaf);return{m,vs:0.5};}
 m.box(5,0,5,6,shape===2?16:13,6,bark);
 if(shape===1){for(let layer=0;layer<3;layer++){const inset=layer*2;m.box(inset+1,4+layer*5,inset+1,11-inset,9+layer*5,11-inset,leaf);}}
 else if(shape===2){m.box(1,16,5,11,17,7,leaf);m.box(5,17,1,7,18,11,leaf);m.box(3,17,3,9,18,9,leaf);}
 else {m.box(2,6,2,10,13,10,leaf);m.box(3,5,3,9,15,9,leaf);}
 return{m,vs:shape===2?0.6:0.85};
}
function remap(geo,pal){const attr=geo.attributes.aPal,values=new Float32Array(attr.count),colors=pal.map(value=>AF.PAL.hex[value]);for(let index=0;index<values.length;index++){const value=attr.getX(index),slot=colors.indexOf(AF.PAL.hex[value]);values[index]=slot<0?value:-slot-1;}geo.setAttribute('aPal',new THREE.BufferAttribute(values,1));return geo;}
function material(lod){
 const mat=AF.mat.patchVoxel(AF.mat.voxelInst.clone(),'flora-'+lod),compile=mat.onBeforeCompile;
 mat.onBeforeCompile=(shader,renderer)=>{
  compile(shader,renderer);Object.assign(shader.uniforms,uniforms);
  shader.vertexShader='attribute vec4 floraPalette; uniform vec3 floraEye; varying float floraDistance;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('vec2 pUV =','float floraPal=aPal < -3.5 ? floraPalette.w : aPal < -2.5 ? floraPalette.z : aPal < -1.5 ? floraPalette.y : aPal < -0.5 ? floraPalette.x : aPal;\nvec2 pUV =').replace('mod(aPal,','mod(floraPal,').replace('floor(aPal /','floor(floraPal /').replace('#include <begin_vertex>','#include <begin_vertex>\nfloraDistance=distance((modelMatrix * instanceMatrix * vec4(0.,0.,0.,1.)).xyz,floraEye);');
  shader.fragmentShader='uniform float floraNear; uniform float floraFar; varying float floraDistance;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\n{float floraD=fract(52.9829189*fract(dot(floor(gl_FragCoord.xy),vec2(0.06711056,0.00583715))));float floraN=1.-smoothstep(floraNear-16.,floraNear+16.,floraDistance);float floraF=1.-smoothstep(floraFar-55.,floraFar,floraDistance);if('+ (lod===0?'floraD>=min(floraN,floraF)':'floraD<floraN||floraD>=floraF') +')discard;}');
 };
 mat.customProgramCacheKey=()=> 'flora-'+lod;return mat;
}
function* models(){
 const designs=[F.kinds['maple-orange'],F.kinds.pine,F.kinds.palm,F.kinds.rock],materials=[material(0),material(1)];
 const depth=AF.mat.depthInst.clone();depth.onBeforeCompile=shader=>{Object.assign(shader.uniforms,uniforms);shader.vertexShader='uniform vec3 floraEye; varying float floraDistance;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nfloraDistance=distance((modelMatrix * instanceMatrix * vec4(0.,0.,0.,1.)).xyz,floraEye);');shader.fragmentShader='uniform float floraShadow; varying float floraDistance;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(floraDistance>floraShadow)discard;');};depth.customProgramCacheKey=()=> 'flora-depth';
 for(let shape=0;shape<4;shape++){
  const design=designs[shape],source=shape<2?{m:AF.land.makeTree(design.spec,44+shape,0.75).m,vs:0.75}:shape===2?palm():{m:AF.land.makeBoulder(44,4,true),vs:0.25},far=hull(shape,design);
  yield;
  const geometry=remap(yield* AF.meshModelG(source.m,{vs:source.vs,flat:true}),design.palette);
  yield;
  const farGeo=remap(yield* AF.meshModelG(far.m,{vs:far.vs,flat:true}),design.palette);
  yield;
  for(let lod=0;lod<2;lod++){
   const geo=lod?farGeo:geometry,capacity=lod?6000:1400,pal=new THREE.InstancedBufferAttribute(new Float32Array(capacity*4),4);pal.setUsage(THREE.DynamicDrawUsage);geo.setAttribute('floraPalette',pal);
   const mesh=new THREE.InstancedMesh(geo,materials[lod],capacity);mesh.name='flora-'+shape+'-'+lod;mesh.count=0;mesh.frustumCulled=false;mesh.castShadow=lod===0&&shape!==3;mesh.receiveShadow=true;mesh.customDepthMaterial=depth;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);group.add(mesh);F.meshes.push(mesh);batches.push({shape,lod,mesh,capacity,write:0});
  }
  yield;
 }
}
function* generate(){
 yield* models();
 const choices=['maple-scarlet','maple-orange','maple-gold','elm-green','maple-turning','birch','oak'];
 for(let x=-1260;x<1080;x+=13){for(let z=-1150;z<270;z+=13){
  const px=x+(hash(x,z+11)-0.5)*9,pz=z+(hash(x+13,z)-0.5)*9;
  yield;
  if(W.col(px,pz)>=0||blocked(px,pz))continue;
  const biome=O.biome(px,pz),height=O.h(px,pz);if(height<3)continue;
  const slope=Math.max(Math.abs(O.h(px+4,pz)-O.h(px-4,pz)),Math.abs(O.h(px,pz+4)-O.h(px,pz-4)))/8;
  const rnd=hash(x+991,z),density=biome==='farmland'?(O.fieldEdge(px,pz)<4.5?0.6:0):O.forestDensity(px,pz)*0.9+(height<78?0.035:0);
  if(height<118&&slope<1.1&&rnd<density){const conifer=biome==='range'&&hash(x+91,z)>0.18;F.add(conifer?'pine':choices[Math.floor(hash(x,z+55)*choices.length)],px,pz,{scale:0.8+hash(x+4,z)*0.45,biome});}
  else if((biome==='range'&&height>48&&slope>0.35||biome==='forest')&&rnd>0.91)F.add('rock',px,pz,{scale:0.65+hash(x,z+98)*1.1,biome});
 }yield;}
 F.stats.generated=true;
}
function put(batch,entry){
 if(batch.write>=batch.capacity)return;const index=batch.write++,mesh=batch.mesh;
 position.set(entry.x,entry.y,entry.z);rotation.setFromAxisAngle(up,entry.rot);scale.setScalar(entry.scale);matrix.compose(position,rotation,scale);mesh.setMatrixAt(index,matrix);mesh.geometry.attributes.floraPalette.array.set(entry.pal,index*4);
}
function* select(){
 const cp=AF.camera.position,cx=cp.x,cy=cp.y,cz=cp.z,near=AF.MOBILE||AF.GFX.tier==='low'?80:AF.GFX.lite?125:190,far=AF.MOBILE||AF.GFX.tier==='low'?480:AF.GFX.lite?720:880;
 uniforms.floraNear.value=near;uniforms.floraFar.value=far;uniforms.floraShadow.value=AF.MOBILE?25:55;
 AF.camera.updateMatrixWorld();projection.multiplyMatrices(AF.camera.projectionMatrix,AF.camera.matrixWorldInverse);frustum.setFromProjectionMatrix(projection);
 for(const batch of batches)batch.write=0;
 const radius=Math.ceil((far+64)/64),bx=Math.floor(cx/64),bz=Math.floor(cz/64);
 for(let ix=bx-radius;ix<=bx+radius;ix++)for(let iz=bz-radius;iz<=bz+radius;iz++){
  const bucket=buckets.get(ix*10000+iz);if(!bucket)continue;
    for(const entry of bucket){const distance=Math.hypot(entry.x-cx,entry.y-cy,entry.z-cz);if(distance>far+64)continue;sphere.center.set(entry.x,entry.y+8*entry.scale,entry.z);sphere.radius=32+12*entry.scale;if(distance>80&&!frustum.intersectsSphere(sphere))continue;const offset=entry.shape*2;if(distance<near+48)put(batches[offset],entry);if(distance>near-48)put(batches[offset+1],entry);}
  yield;
 }
 F.stats.near=F.stats.far=F.stats.draws=F.stats.triangles=0;
 for(const batch of batches){const mesh=batch.mesh;mesh.count=batch.write;mesh.layers.set(mesh.count?0:31);mesh.instanceMatrix.needsUpdate=true;const attr=mesh.geometry.attributes.floraPalette;attr.clearUpdateRanges();attr.addUpdateRange(0,Math.max(1,mesh.count)*4);attr.needsUpdate=true;F.stats[batch.lod?'far':'near']+=mesh.count;if(mesh.count){F.stats.draws++;F.stats.triangles+=mesh.count*mesh.geometry.index.count/3;}}
 lastX=cx;lastY=cy;lastZ=cz;lastQ.copy(AF.camera.quaternion);selected=revision;
}
const work=F.work=ms=>{
 if(!AF.ready)return false;const start=performance.now(),end=start+Math.min(ms,AF.MOBILE?2.5:4);
 while(performance.now()<end){
  const slice=performance.now();
  if(!F.stats.generated){if(!generator)generator=generate();if(generator.next().done){generator=null;ready=true;}}
    else {if(!selection&&(selected!==revision||Math.hypot(AF.camera.position.x-lastX,AF.camera.position.y-lastY,AF.camera.position.z-lastZ)>24||Math.abs(lastQ.dot(AF.camera.quaternion))<0.995))selection=select();if(!selection)break;if(selection.next().done)selection=null;}
  F.stats.maxSliceMs=Math.max(F.stats.maxSliceMs,performance.now()-slice);
 }
 F.stats.workMs+=performance.now()-start;return !ready||!!selection||selected!==revision;
};
F.settle=()=>{if(AF.outlandSites)AF.outlandSites.settle();while(work(6));};
AF.onIdle('flora-build',work);
AF.test('flora: biome populations and reusable palm/shrub API',()=>{
 F.settle();const counts={range:0,forest:0,farmland:0,valley:0};for(const entry of F.records)if(entry.kind!=='rock'&&counts[entry.biome]!==undefined)counts[entry.biome]++;
 return{ok:!!(counts.range>100&&counts.range<7000&&counts.forest>150&&counts.forest<4000&&counts.farmland>30&&counts.farmland<2000&&counts.valley>5&&F.kinds.palm&&F.kinds.shrub),info:JSON.stringify(counts)};
});
AF.test('flora: natural trees avoid roads, water and crop interiors',()=>{
 F.settle();let bad=0,checked=0;for(const entry of F.records){if(entry.kind==='rock')continue;checked++;if(O.roadDistance(entry.x,entry.z)<14||O.waterY(entry.x,entry.z)!==null||!entry.planted&&entry.biome==='farmland'&&O.fieldEdge(entry.x,entry.z)>5)bad++;}return{ok:checked>300&&!bad,info:checked+' trees/shrubs, '+bad+' exclusions violated'};
});
AF.test('flora: eight shared LOD draws with bounded triangle load',()=>{
 F.settle();return{ok:F.meshes.length===8&&F.stats.draws<=8&&F.stats.triangles<350000&&F.meshes.every(mesh=>mesh.frustumCulled===false&&mesh.material.customProgramCacheKey().startsWith('flora-')),info:F.stats.draws+' draws, '+F.stats.triangles+' triangles'};
});
}catch(e){AF.partError('44-flora.js',e);}