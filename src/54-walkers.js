try {
{
  // Reusable local pedestrian paths: explicit [x,y,z] waypoints, shared articulated peopleKit bodies and rolling luggage.
  const WK = AF.walkers = { paths: [], meshes: [], stats: { active:0, visible:0, draws:0 }, capacity:512 };
  const matrix=new THREE.Matrix4(), rotation=new THREE.Quaternion(), euler=new THREE.Euler(0,0,0,'YXZ'), position=new THREE.Vector3(), scale=new THREE.Vector3();
  let ready=false, material, bodyPlan, visibleBefore=false;
  const palette=(look)=>new Float32Array([AF.col(look.skin??0xefc19f),AF.col(look.top?.col??0x3f7f7c),AF.col(look.bottom?.col??0x45464b),AF.col(look.hair??0x3f2a1c)]);
  WK.addPath=(name,points,{count=8,speed=1.1,mode='loop',activeRadius=180,dwell=[],luggage=0,looks=null}={})=>{
    if(!points.length||!['loop','pingpong','flow'].includes(mode)||!Number.isFinite(speed)||speed<0||!Number.isFinite(activeRadius)||activeRadius<0||!Number.isFinite(count)||count<0||!Number.isFinite(luggage)||luggage<0||luggage>1)throw new Error('Invalid walker path');
    if(WK.paths.reduce((sum,path)=>sum+path.count,0)+(count|0)>WK.capacity)throw new Error('Walker capacity exceeded');
    const pts=points.map(point=>{if(point.length!==3||!point.every(Number.isFinite))throw new Error('Walker points need [x,y,z]');return point.slice();});
    if(mode==='loop'&&pts.length>1&&pts[0].some((value,index)=>value!==pts[pts.length-1][index]))pts.push(pts[0].slice());
    const lengths=new Float64Array(pts.length),waits=new Float64Array(pts.length);
    for(let index=1;index<pts.length;index++){lengths[index]=lengths[index-1]+Math.hypot(pts[index][0]-pts[index-1][0],pts[index][1]-pts[index-1][1],pts[index][2]-pts[index-1][2]);if(lengths[index]===lengths[index-1])throw new Error('Duplicate walker waypoint');}
    for(const stop of dwell){if(!Number.isInteger(stop.i)||stop.i<0||stop.i>=pts.length||!Number.isFinite(stop.t)||stop.t<0)throw new Error('Invalid walker dwell');waits[stop.i]=stop.t;}
    const path={name,points:pts,lengths,waits,length:lengths[lengths.length-1],count:count|0,speed,mode,activeRadius,active:false,enabled:true,actors:[],minX:Infinity,minY:Infinity,minZ:Infinity,maxX:-Infinity,maxY:-Infinity,maxZ:-Infinity};
    for(const point of pts){path.minX=Math.min(path.minX,point[0]);path.maxX=Math.max(path.maxX,point[0]);path.minY=Math.min(path.minY,point[1]);path.maxY=Math.max(path.maxY,point[1]+2);path.minZ=Math.min(path.minZ,point[2]);path.maxZ=Math.max(path.maxZ,point[2]);}
    const rng=AF.rng(WK.paths.length*733+541);
    for(let index=0;index<path.count;index++){
      const look=looks?.length?looks[index%looks.length]:AF.peopleKit.makeLook('traveler',index%3?'m':'f','adult',rng);
      const actor={s:path.length*index/Math.max(1,path.count),dir:1,wait:0,gap:0,ph:index*1.7,x:0,y:0,z:0,yaw:0,look,pal:palette(look),bag:rng()<luggage,moving:false,frame:0};
      locate(path,actor);path.actors.push(actor);
    }
    WK.paths.push(path);return path;
  };
  function locate(path,actor){
    if(path.points.length===1){const point=path.points[0];actor.x=point[0];actor.y=point[1];actor.z=point[2];actor.yaw=actor.look.yaw??Math.PI;return;}
    let index=1;while(index<path.points.length-1&&path.lengths[index]<actor.s)index++;
    const before=path.points[index-1],at=path.points[index],fraction=AF.clamp((actor.s-path.lengths[index-1])/(path.lengths[index]-path.lengths[index-1]),0,1);
    actor.x=before[0]+(at[0]-before[0])*fraction;actor.y=before[1]+(at[1]-before[1])*fraction;actor.z=before[2]+(at[2]-before[2])*fraction;
    actor.yaw=Math.atan2((at[0]-before[0])*actor.dir,(at[2]-before[2])*actor.dir);
  }
  function advance(path,actor,dt){
    actor.moving=false;
    if(!path.speed||!path.length)return;
    let remaining=dt;
    if(actor.gap>0){const used=Math.min(remaining,actor.gap);actor.gap-=used;remaining-=used;}
    if(actor.wait>0){const used=Math.min(remaining,actor.wait);actor.wait-=used;remaining-=used;}
    for(let hops=0;remaining>0&&hops<16;hops++){
      let next=actor.dir>0?1:path.lengths.length-2;
      if(actor.dir>0){while(next<path.lengths.length-1&&path.lengths[next]<=actor.s+1e-7)next++;}
      else {while(next>0&&path.lengths[next]>=actor.s-1e-7)next--;}
      const distance=Math.abs(path.lengths[next]-actor.s),travel=Math.min(distance,path.speed*remaining);
      actor.s+=travel*actor.dir;remaining-=travel/path.speed;actor.moving=travel>0;actor.ph+=travel*4;
      if(travel+1e-7<distance)break;
      actor.wait=path.waits[next];
      if(actor.s>=path.length-1e-7){
        if(path.mode==='pingpong')actor.dir=-1;
        else {actor.s=0;if(path.mode==='flow')actor.gap=2+actor.ph%4;}
      }else if(actor.s<=1e-7&&actor.dir<0)actor.dir=1;
      if(actor.wait>0||actor.gap>0)break;
    }
    locate(path,actor);
  }
  WK.distance2=(path,camera)=>Math.max(path.minX-camera.x,0,camera.x-path.maxX)**2+Math.max(path.minY-camera.y,0,camera.y-path.maxY)**2+Math.max(path.minZ-camera.z,0,camera.z-path.maxZ)**2;
  const build=()=>{
    const look=AF.peopleKit.makeLook('traveler','m','adult',AF.rng(54));
    Object.assign(look,{skin:0xefc19f,hair:0x3f2a1c,hairStyle:'part',hat:'fedora',hatCol:0x3f2a1c,hatCol2:0x3f2a1c,top:{style:'shirt',col:0x3f7f7c},bottom:{style:'pants',col:0x45464b},propR:null,propL:null,skirt:null,glasses:null,beard:false,moustache:false});
    const person=AF.peopleKit.buildPerson(look);bodyPlan=person.B;
    const head=person.head.geometry.clone().translate(0,bodyPlan.th/16,0),torso=AF.addons.BGU.mergeGeometries([person.torso.geometry,head]);head.dispose();
    const geometries=[torso,person.armL.geometry.clone(),person.legL.geometry.clone()];
    for(const geometry of geometries){const source=geometry.attributes.aPal,values=new Float32Array(source.count);for(let index=0;index<source.count;index++){const hex=AF.PAL.hex[source.getX(index)],slot=[look.skin,look.top.col,look.bottom.col,look.hair].indexOf(hex);values[index]=slot<0?source.getX(index):-slot-1;}geometry.setAttribute('aPal',new THREE.BufferAttribute(values,1));}
    const bag=new AF.Model(8,18,6),dark=AF.col(0x292c32),handle=AF.col(0xbcc7ca,{metal:0.8});
    bag.box(0,1,0,8,10,6,dark);bag.box(1,10,2,2,17,3,handle);bag.box(6,10,2,7,17,3,handle);bag.box(1,17,2,7,18,3,handle);bag.box(0,0,1,2,2,5,dark);bag.box(6,0,1,8,2,5,dark);
    geometries.push(AF.meshModel(bag,{vs:1/16,anchor:[0.5,0,0.5]}));
    const bagPal=geometries[3].attributes.aPal,bagValues=new Float32Array(bagPal.count);for(let index=0;index<bagPal.count;index++)bagValues[index]=bagPal.getX(index)===dark?-2:bagPal.getX(index);geometries[3].setAttribute('aPal',new THREE.BufferAttribute(bagValues,1));
    material=AF.mat.patchVoxel(AF.mat.voxelInst.clone(),'walker-palette');const compile=material.onBeforeCompile;
    material.onBeforeCompile=(shader,renderer)=>{compile(shader,renderer);shader.vertexShader=shader.vertexShader.replace('attribute float aPal;','attribute float aPal; attribute vec4 walkerPalette;').replace('vec2 pUV =','float walkerPal = aPal < -3.5 ? walkerPalette.w : aPal < -2.5 ? walkerPalette.z : aPal < -1.5 ? walkerPalette.y : aPal < -0.5 ? walkerPalette.x : aPal;\nvec2 pUV =').replace('mod(aPal,','mod(walkerPal,').replace('floor(aPal /','floor(walkerPal /');};
    material.customProgramCacheKey=()=> 'walker-palette';
    for(let index=0;index<geometries.length;index++){
      const geometry=geometries[index],capacity=WK.capacity*(index===0?1:index===3?3:2),attribute=new THREE.InstancedBufferAttribute(new Float32Array(capacity*4),4);
      attribute.setUsage(THREE.DynamicDrawUsage);geometry.setAttribute('walkerPalette',attribute);
      const mesh=new THREE.InstancedMesh(geometry,material,capacity);mesh.name='path-walkers-'+index;mesh.count=0;mesh.visible=false;mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=true;mesh.customDepthMaterial=AF.mat.depthInst;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);AF.scene.add(mesh);WK.meshes.push(mesh);
    }
    ready=true;
  };
  function put(mesh,index,actor,lx,ly,lz,angle=0,sx=1,sy=1,sz=1){
    const sn=actor.sin,cs=actor.cos;position.set(actor.x+lx*cs+lz*sn,actor.y+ly,actor.z-lx*sn+lz*cs);
    euler.set(angle,actor.yaw,0,'YXZ');rotation.setFromEuler(euler);scale.set(sx,sy,sz);matrix.compose(position,rotation,scale);mesh.setMatrixAt(index,matrix);
    mesh.geometry.attributes.walkerPalette.array.set(actor.pal,index*4);
  }
  const update=WK.update=(dt,time)=>{
    if(!ready)return;const camera=AF.camera.position;let active=0;
    for(const path of WK.paths){path.active=path.enabled&&WK.distance2(path,camera)<=path.activeRadius**2;if(path.active)active++;}
    WK.stats.active=active;
    if(!active){if(visibleBefore)for(const mesh of WK.meshes){mesh.count=0;mesh.visible=false;}visibleBefore=false;WK.stats.visible=WK.stats.draws=0;return;}
    let count=0,bags=0;
    for(const path of WK.paths){if(!path.active)continue;
      for(const actor of path.actors){advance(path,actor,dt);if(actor.gap>0)continue;
        const distance2=(actor.x-camera.x)**2+(actor.y-camera.y)**2+(actor.z-camera.z)**2;if(distance2>path.activeRadius**2)continue;
        actor.sin=Math.sin(actor.yaw);actor.cos=Math.cos(actor.yaw);
        if(distance2<3600||Math.floor(time*5)!==actor.frame){actor.frame=Math.floor(time*5);actor.stride=actor.moving?Math.sin(actor.ph)*0.42:0;actor.wave=Math.sin(time*3)*0.35;}
        const stride=actor.stride||0,hip=bodyPlan.lh/16,shoulder=hip+bodyPlan.th/16,arm=(bodyPlan.tw+bodyPlan.aw)/32,leg=(bodyPlan.lw+1)/32,work=actor.look.pose==='marshal';
        put(WK.meshes[0],count,actor,0,hip,0);put(WK.meshes[1],count*2,actor,arm,shoulder,0,work?-1.5+(actor.wave||0):-stride*0.8);put(WK.meshes[1],count*2+1,actor,-arm,shoulder,0,work?-1.5-(actor.wave||0):actor.bag?-0.22:stride*0.8);
        put(WK.meshes[2],count*2,actor,leg,hip,0,stride);put(WK.meshes[2],count*2+1,actor,-leg,hip,0,-stride);
        if(actor.bag)put(WK.meshes[3],bags++,actor,-0.48,0,-0.45,-0.18);
        if(work){put(WK.meshes[3],bags++,actor,-0.4,shoulder-0.1,0.5,-Math.PI/2,0.12,0.65,0.12);put(WK.meshes[3],bags++,actor,0.4,shoulder-0.1,0.5,-Math.PI/2,0.12,0.65,0.12);}
        count++;
      }
    }
    for(let index=0;index<WK.meshes.length;index++){const mesh=WK.meshes[index];mesh.count=index===3?bags:index===0?count:count*2;mesh.visible=mesh.count>0;mesh.instanceMatrix.needsUpdate=true;const palette=mesh.geometry.attributes.walkerPalette;palette.clearUpdateRanges();palette.addUpdateRange(0,Math.max(1,mesh.count)*4);palette.needsUpdate=true;}
    visibleBefore=count>0;WK.stats.visible=count;WK.stats.draws=count?3+(bags>0?1:0):0;
  };
  AF.onBuild('path-walkers',670,build);AF.onTick('path-walkers',305,update);
  AF.test('walkers: local activation, far freeze and six shared batches',()=>{
    const camera=AF.camera.position.clone(),path=WK.paths[0];if(!path)return{ok:false,info:'no paths'};
    try{AF.camera.position.set(path.minX,2,path.minZ);update(0.1,1);const active=path.active&&WK.stats.visible>0,actor=path.actors[0],before=actor.s;AF.camera.position.set(10000,10000,10000);update(0.1,2);return{ok:active&&!path.active&&actor.s===before&&WK.stats.draws===0&&WK.meshes.length<=6,info:'near '+active+', far frozen '+(actor.s===before)+', batches '+WK.meshes.length};}
    finally{AF.camera.position.copy(camera);update(0,AF.clock.t);}
  });
  AF.test('walkers: dwell, pingpong and flow obey dt',()=>{
    const path={points:[[0,0,0],[1,0,0],[2,0,0]],lengths:new Float64Array([0,1,2]),waits:new Float64Array([0,1,0]),speed:1,length:2,mode:'pingpong'},actor={s:0,dir:1,wait:0,gap:0,ph:0,look:{}};
    advance(path,actor,1);const dwell=actor.s===1&&actor.wait===1;advance(path,actor,0.5);const waiting=actor.s===1;advance(path,actor,1.5);const reverse=actor.dir===-1;path.mode='flow';actor.s=1.9;actor.dir=1;actor.wait=0;advance(path,actor,0.2);return{ok:dwell&&waiting&&reverse&&actor.s===0&&actor.gap>0,info:'dwell '+dwell+', reverse '+reverse+', flow gap '+actor.gap};
  });
}
}catch(error){AF.partError('54-walkers.js',error);}