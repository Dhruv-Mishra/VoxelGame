try {
{
  // Reusable local pedestrian paths: explicit [x,y,z] waypoints, shared articulated peopleKit bodies and rolling luggage.
  const WK = AF.walkers = { paths: [], meshes: [], stats: { active:0, visible:0, draws:0 }, capacity:640 };
  const matrix=new THREE.Matrix4(), rotation=new THREE.Quaternion(), euler=new THREE.Euler(0,0,0,'YXZ'), position=new THREE.Vector3(), scale=new THREE.Vector3();
  let ready=false, material, bodyPlan, visibleBefore=false,torchLight,torchGuard=null,torchAcc=0,torchDist=0,torchProp=0;
  const weaponProps=new Map();
  const palette=(look)=>new Float32Array([AF.col(look.skin??0xefc19f),AF.col(look.top?.col??0x3f7f7c),AF.col(look.bottom?.col??0x45464b),AF.col(look.hair??0x3f2a1c)]);
  WK.addPath=(name,points,{count=8,speed=1.1,mode='loop',activeRadius=180,dwell=[],luggage=0,looks=null}={})=>{
    if(!points.length||!['loop','pingpong','flow'].includes(mode)||!Number.isFinite(speed)||speed<0||!Number.isFinite(activeRadius)||activeRadius<0||!Number.isFinite(count)||count<0||!Number.isFinite(luggage)||luggage<0||luggage>1)throw new Error('Invalid walker path');
    if(WK.paths.reduce((sum,path)=>sum+path.count,0)+(count|0)>WK.capacity)throw new Error('Walker capacity exceeded');
    const pts=points.map(point=>{if(point.length!==3||!point.every(Number.isFinite))throw new Error('Walker points need [x,y,z]');return point.slice();});
    if(mode==='loop'&&pts.length>1&&pts[0].some((value,index)=>value!==pts[pts.length-1][index]))pts.push(pts[0].slice());
    const lengths=new Float64Array(pts.length),waits=new Float64Array(pts.length);
    for(let index=1;index<pts.length;index++){lengths[index]=lengths[index-1]+Math.hypot(pts[index][0]-pts[index-1][0],pts[index][1]-pts[index-1][1],pts[index][2]-pts[index-1][2]);if(lengths[index]===lengths[index-1])throw new Error('Duplicate walker waypoint');}
    for(const stop of dwell){if(!Number.isInteger(stop.i)||stop.i<0||stop.i>=pts.length||!Number.isFinite(stop.t)||stop.t<0)throw new Error('Invalid walker dwell');waits[stop.i]=stop.t;}
    const path={name,idx:WK.paths.length,points:pts,lengths,waits,length:lengths[lengths.length-1],count:count|0,speed,mode,activeRadius,active:false,enabled:true,actors:[],minX:Infinity,minY:Infinity,minZ:Infinity,maxX:-Infinity,maxY:-Infinity,maxZ:-Infinity};
    for(const point of pts){path.minX=Math.min(path.minX,point[0]);path.maxX=Math.max(path.maxX,point[0]);path.minY=Math.min(path.minY,point[1]);path.maxY=Math.max(path.maxY,point[1]+2);path.minZ=Math.min(path.minZ,point[2]);path.maxZ=Math.max(path.maxZ,point[2]);}
    const rng=AF.rng(WK.paths.length*733+541);
    for(let index=0;index<path.count;index++){
      const look=looks?.length?looks[index%looks.length]:AF.peopleKit.makeLook('traveler',index%3?'m':'f','adult',rng);
      const actor=new Actor({s:path.length*index/Math.max(1,path.count),dir:1,wait:0,gap:0,gap0:2+(index*1.7)%4,idx:index,lag:0,ph:index*1.7,x:0,y:0,z:0,yaw:0,look,pal:palette(look),bag:rng()<luggage,moving:false,frame:0});
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
  // Ambient progress along a path is a pure function of the shared world clock (01-core), so every co-op player sees the same
  // passengers in the same places: one pass (loop / flow) or there-and-back (pingpong) with its dwells is a timetable, each actor
  // offset by its share of it. Reactions (shoved, down, scared) are local and only shift that actor's clock (a.lag), which eases back.
  function timeline(path){
    if(path.tl)return path.tl;
    const L=path.lengths,n=L.length,t=[],s0=[],s1=[],dur=[],dc=[];let T=0,D=0;
    const seg=(a,b,d)=>{t.push(T);s0.push(a);s1.push(b);dur.push(d);dc.push(D);T+=d;D+=Math.abs(b-a);};
    for(let i=1;i<n;i++){seg(L[i-1],L[i],(L[i]-L[i-1])/path.speed);if(path.waits[i]>0)seg(L[i],L[i],path.waits[i]);}
    if(path.mode==='pingpong')for(let i=n-2;i>=0;i--){seg(L[i+1],L[i],(L[i+1]-L[i])/path.speed);if(path.waits[i]>0)seg(L[i],L[i],path.waits[i]);}
    return path.tl={t:Float64Array.from(t),s0:Float64Array.from(s0),s1:Float64Array.from(s1),dur:Float64Array.from(dur),dc:Float64Array.from(dc),T};
  }
  function placeAt(path,actor,W){
    // actor.ctl = {x,y,z,yaw,moving,ph}: someone else steers this actor (82-stealth guards investigating / chasing); the timetable waits
    if(actor.ctl){const c=actor.ctl;actor.x=c.x;actor.y=c.y;actor.z=c.z;actor.yaw=c.yaw;actor.moving=!!c.moving;actor.ph=c.ph||0;actor.gap=0;actor.wait=0;return;}
    actor.moving=false;
    if(!path.speed||!path.length){locate(path,actor);return;}
    const tl=timeline(path),P=tl.T+(path.mode==='flow'?actor.gap0:0),ph0=AF.whash(path.idx,54)*tl.T;
    const tau=((W-(actor.lag||0)+P*actor.idx/Math.max(1,path.count)+ph0)%P+P)%P;
    if(tau>=tl.T){actor.gap=P-tau;actor.s=0;actor.dir=1;locate(path,actor);return;}   // flow: off stage between passes
    actor.gap=0;
    let lo=0,hi=tl.t.length-1;while(lo<hi){const m=(lo+hi+1)>>1;if(tl.t[m]<=tau)lo=m;else hi=m-1;}
    const u=Math.min(1,(tau-tl.t[lo])/tl.dur[lo]),a=tl.s0[lo],b=tl.s1[lo];
    actor.s=a+(b-a)*u;actor.moving=b!==a;actor.dir=b<a?-1:1;actor.wait=actor.moving?0:tl.dur[lo]*(1-u);actor.ph=(tl.dc[lo]+Math.abs(b-a)*u)*4;
    locate(path,actor);
  }
  const easeLag=(a,dt)=>{if(a.lag)a.lag-=Math.sign(a.lag)*Math.min(Math.abs(a.lag),dt*0.4);};
  WK.distance2=(path,camera)=>Math.max(path.minX-camera.x,0,camera.x-path.maxX)**2+Math.max(path.minY-camera.y,0,camera.y-path.maxY)**2+Math.max(path.minZ-camera.z,0,camera.z-path.maxZ)**2;
  // reactions to the player (77-combat): shoved (stagger), knocked flat (down s, then they get up), scared (run along the path, or cower
  // in place when the path has no speed). Offsets from the path ease back once they walk on. State lives on the actor (actor.rx), made once.
  class Actor {
    constructor(o={}){
      this.s=o.s??0;this.dir=o.dir??1;this.wait=o.wait??0;this.gap=o.gap??0;this.gap0=o.gap0??2;this.idx=o.idx??0;this.lag=o.lag??0;this.ph=o.ph??0;
      this.x=o.x??0;this.y=o.y??0;this.z=o.z??0;this.yaw=o.yaw??0;this.look=o.look??null;this.pal=o.pal??null;this.bag=!!o.bag;
      this.moving=false;this.frame=0;this.dead=false;this.unconscious=false;this.rx=null;this.rxOn=false;this.tilt=0;this.lift=0;
    }
    getRx(){if(!this.rx)this.rx={down:0,fall:0,st:0,fear:0,ox:0,oz:0,vx:0,vz:0,yaw:0};this.rxOn=true;return this.rx;}
    knock(fx,fz,v,t){if(this.dead||this.unconscious)return;const R=this.getRx();R.down=Math.max(R.down,t);R.vx=fx*v;R.vz=fz*v;R.yaw=Math.atan2(-fx,-fz);R.st=0;R.fear=0;R.hold=0;}
    sleep(fx=0,fz=1,v=1.3){if(this.dead)return;this.knock(fx,fz,v,Infinity);this.unconscious=true;this.getRx().down=Infinity;}
    kill(fx=0,fz=1,v=1.3){if(this.dead)return;if(this.unconscious)this.unconscious=false;this.knock(fx,fz,v,Infinity);this.dead=true;this.unconscious=false;}
    revive(){this.dead=this.unconscious=false;if(this.rx)Object.assign(this.rx,{down:0,fall:0,st:0,fear:0,hold:0,ox:0,oz:0,vx:0,vz:0});this.rxOn=false;this.tilt=this.lift=0;}
    stagger(fx,fz){if(this.dead||this.unconscious)return;const R=this.getRx();if(R.down>0||R.fall>0)return;R.st=0.7;R.vx=fx*1.8;R.vz=fz*1.8;R.yaw=Math.atan2(-fx,-fz);R.fear=Math.max(R.fear,3);}
    scare(t){if(this.dead||this.unconscious)return;const R=this.getRx();if(!(R.down>0))R.fear=Math.max(R.fear,t);}
    hold(yaw,t){if(this.dead||this.unconscious)return;const R=this.getRx();if(R.down>0||R.fall>0)return;R.hold=Math.max(R.hold||0,t);R.yaw=yaw;}
    isDown(){return !!(this.dead||this.unconscious||(this.rxOn&&(this.rx.down>0||this.rx.fall>0.4)));}
  }
  WK.Actor=Actor;AF.Actor=Actor;
  const rx=(a)=>a.getRx?a.getRx():(!a.rx?(a.rx={down:0,fall:0,st:0,fear:0,ox:0,oz:0,vx:0,vz:0,yaw:0},a.rxOn=true,a.rx):(a.rxOn=true,a.rx));
  const reacts=(a)=>!!a.chase||a.look.pose!=='dance'&&a.look.pose!=='ride';
  WK.knock=(a,fx,fz,v,t)=>{if(a.knock)a.knock(fx,fz,v,t);else{if(a.dead||a.unconscious)return;const R=rx(a);R.down=Math.max(R.down,t);R.vx=fx*v;R.vz=fz*v;R.yaw=Math.atan2(-fx,-fz);R.st=0;R.fear=0;R.hold=0;}};
  // Persistent lifecycle is separate from a timed knock/stagger; only an explicit mission reset/spawn revives it.
  WK.sleep=(a,fx=0,fz=1,v=1.3)=>{if(a.sleep)a.sleep(fx,fz,v);else{if(a.dead)return;WK.knock(a,fx,fz,v,Infinity);a.unconscious=true;rx(a).down=Infinity;}};
  WK.kill=(a,fx=0,fz=1,v=1.3)=>{if(a.kill)a.kill(fx,fz,v);else{if(a.dead)return;if(a.unconscious)a.unconscious=false;WK.knock(a,fx,fz,v,Infinity);a.dead=true;a.unconscious=false;}};
  WK.revive=(a)=>{if(a.revive)a.revive();else{a.dead=a.unconscious=false;if(a.rx)Object.assign(a.rx,{down:0,fall:0,st:0,fear:0,hold:0,ox:0,oz:0,vx:0,vz:0});a.rxOn=false;a.tilt=a.lift=0;}};
  WK.stagger=(a,fx,fz)=>{if(a.stagger)a.stagger(fx,fz);else{if(a.dead||a.unconscious)return;const R=rx(a);if(R.down>0||R.fall>0)return;R.st=0.7;R.vx=fx*1.8;R.vz=fz*1.8;R.yaw=Math.atan2(-fx,-fz);R.fear=Math.max(R.fear,3);}};
  WK.scare=(a,t)=>{if(a.scare)a.scare(t);else{if(a.dead||a.unconscious)return;const R=rx(a);if(!(R.down>0))R.fear=Math.max(R.fear,t);}};
  // stop and face yaw for t seconds (a chat: the heist's distraction), then walk on and catch up with the schedule
  WK.hold=(a,yaw,t)=>{if(a.hold)a.hold(yaw,t);else{if(a.dead||a.unconscious)return;const R=rx(a);if(R.down>0||R.fall>0)return;R.hold=Math.max(R.hold||0,t);R.yaw=yaw;}};
  WK.isDown=(a)=>a.isDown?a.isDown():!!(a.dead||a.unconscious||a.rxOn&&(a.rx.down>0||a.rx.fall>0.4));
  // actors of active paths within r of (x, z) that can react (a shared scratch array: copy it before calling near() again)
  const NEAR=[];
  WK.near=(x,z,r)=>{
    NEAR.length=0;const r2=r*r;
    for(const path of WK.paths){if(!path.active)continue;const out=x<path.minX-r||x>path.maxX+r||z<path.minZ-r||z>path.maxZ+r;
      // an actor someone else steers (a guard off his beat, a chaser) can be anywhere: test it even outside its path's bounds
      for(const a of path.actors)if((!out||a.ctl)&&!(a.gap>0)&&(a.x-x)**2+(a.z-z)**2<r2&&reacts(a))NEAR.push(a);}
    return NEAR;
  };
  function react(path,a,dt,W){
    const R=a.rx;let still=false;
    if(a.dead||a.unconscious||R.down>0){if(!a.dead&&!a.unconscious)R.down-=dt;R.fall=Math.min(1,R.fall+dt*5);still=true;}
    else if(R.fall>0){R.fall=Math.max(0,R.fall-dt*1.4);still=true;}
    else if(R.hold>0){R.hold-=dt;still=true;}
    if(R.st>0)R.st=Math.max(0,R.st-dt);
    if(R.fear>0)R.fear-=dt;
    if(still)a.lag=(a.lag||0)+dt;else if(R.fear>0)a.lag=(a.lag||0)-dt*1.6;else easeLag(a,dt);
    placeAt(path,a,W);if(still)a.moving=false;
    const k=Math.exp(-dt*5);R.ox+=R.vx*dt;R.oz+=R.vz*dt;R.vx*=k;R.vz*=k;
    if(!still&&!(R.st>0)){const e=Math.exp(-dt*0.7);R.ox*=e;R.oz*=e;}
    a.x+=R.ox;a.z+=R.oz;
    if(still||R.st>0)a.yaw=a.ctl&&(a.dead||a.unconscious)?a.ctl.yaw:R.yaw;
    a.tilt=-R.fall*Math.PI/2-(R.st>0?Math.sin(R.st/0.7*Math.PI)*0.38:0);a.lift=0.13*R.fall;
    if(!still&&!(R.st>0)&&!(R.fear>0)&&Math.abs(R.ox)+Math.abs(R.oz)<0.02){a.rxOn=false;a.tilt=a.lift=0;R.ox=R.oz=R.vx=R.vz=0;}
  }
  // Active mission guards may be simulated by an off-site host; this evaluates only that actor, not ambient paths.
  WK.step=(path,a,dt,W)=>{if(a.dead||a.unconscious)rx(a);if(a.rxOn)react(path,a,dt,W);else{easeLag(a,dt);placeAt(path,a,W);}};
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
    // Only configured firearm models share the luggage/torch batch; its draw and instance capacity do not grow.
    const props=[geometries[3]],CB=AF.combat;
    if(CB&&CB.heldGeo)for(const path of WK.paths)for(const a of path.actors){
      const id=CB.npcGun(a.weapon);if(!id||weaponProps.has(id))continue;
      const gun=CB.heldGeo(id);if(gun){weaponProps.set(id,props.length);props.push(gun.clone());}
    }
    const torch=new AF.Model(4,12,4),metal=AF.col(0x29323a),lens=AF.col(0xffe6a0,{emit:0.7});
    torch.box(1,3,1,3,12,3,metal);torch.box(0,0,0,4,4,4,metal);torch.box(0,0,0,4,1,4,lens);
    const torchGeo=AF.meshModel(torch,{vs:1/16,anchor:[0.5,1,0.5]});torchProp=props.length;props.push(torchGeo);
    for(let i=0;i<props.length;i++){
      const g=props[i],pal=g.attributes.aPal;
      g.setAttribute('aPal',new THREE.BufferAttribute(new Float32Array(pal.array),pal.itemSize,pal.normalized));
      g.setAttribute('walkerPart',new THREE.BufferAttribute(new Float32Array(g.attributes.position.count).fill(i),1));
    }
    geometries[3]=AF.addons.BGU.mergeGeometries(props);for(const g of props)g.dispose();
    for(let i=0;i<3;i++)geometries[i].setAttribute('walkerPart',new THREE.BufferAttribute(new Float32Array(geometries[i].attributes.position.count),1));
    material=AF.mat.patchVoxel(AF.mat.voxelInst.clone(),'walker-palette');const compile=material.onBeforeCompile;
    material.onBeforeCompile=(shader,renderer)=>{compile(shader,renderer);shader.vertexShader=shader.vertexShader.replace('attribute float aPal;','attribute float aPal; attribute vec4 walkerPalette; attribute float walkerPart; attribute float walkerProp;').replace('#include <begin_vertex>','#include <begin_vertex>\nif(abs(walkerPart-walkerProp)>0.1) transformed=vec3(0.0);').replace('vec2 pUV =','float walkerPal = aPal < -3.5 ? walkerPalette.w : aPal < -2.5 ? walkerPalette.z : aPal < -1.5 ? walkerPalette.y : aPal < -0.5 ? walkerPalette.x : aPal;\nvec2 pUV =').replace('mod(aPal,','mod(walkerPal,').replace('floor(aPal /','floor(walkerPal /');};
    material.customProgramCacheKey=()=> 'walker-palette';
    for(let index=0;index<geometries.length;index++){
      const geometry=geometries[index],capacity=WK.capacity*(index===0?1:index===3?3:2),attribute=new THREE.InstancedBufferAttribute(new Float32Array(capacity*4),4);
      attribute.setUsage(THREE.DynamicDrawUsage);geometry.setAttribute('walkerPalette',attribute);
      const prop=new THREE.InstancedBufferAttribute(new Float32Array(capacity),1);prop.setUsage(THREE.DynamicDrawUsage);geometry.setAttribute('walkerProp',prop);
      const mesh=new THREE.InstancedMesh(geometry,material,capacity);mesh.name='path-walkers-'+index;mesh.count=0;mesh.visible=false;mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=true;mesh.customDepthMaterial=AF.mat.depthInst;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);AF.scene.add(mesh);WK.meshes.push(mesh);
    }
    AF.addLight({x:1e6,y:-1000,z:1e6,color:0xffe6a0,intensity:0,range:1.2,night:false,kind:'guard-torch',enabled:false});
    torchLight=AF.lights[AF.lights.length-1];ready=true;
  };
  function put(mesh,index,actor,lx,ly,lz,angle=0,sx=1,sy=1,sz=1,prop=0){
    const t=actor.tilt;if(t){const c=Math.cos(t),s=Math.sin(t),y=ly*c-lz*s;lz=ly*s+lz*c;ly=y+actor.lift;angle+=t;}   // tipped about the feet (Rx)
    const sn=actor.sin,cs=actor.cos;position.set(actor.x+lx*cs+lz*sn,actor.y+ly,actor.z-lx*sn+lz*cs);
    euler.set(angle,actor.yaw,0,'YXZ');rotation.setFromEuler(euler);scale.set(sx,sy,sz);matrix.compose(position,rotation,scale);mesh.setMatrixAt(index,matrix);
    mesh.geometry.attributes.walkerPalette.array.set(actor.pal,index*4);
    mesh.geometry.attributes.walkerProp.array[index]=prop;
  }
  const update=WK.update=(dt,time)=>{
    // WK.reach (77-combat: 2.2 through a sniper scope) widens every path's active / drawn radius, so a scoped target far off is there to hit
    if(!ready)return;const camera=AF.camera.position,reach=WK.reach>1?WK.reach:1;let active=0;
    for(const path of WK.paths){
      const R2=(path.activeRadius*reach)**2;
      path.active=path.enabled&&WK.distance2(path,camera)<=R2;
      if(path.enabled&&!path.active)for(const a of path.actors)if(a.ctl&&(a.ctl.x-camera.x)**2+(a.ctl.y-camera.y)**2+(a.ctl.z-camera.z)**2<=R2){path.active=true;break;}
      if(path.active)active++;
    }
    WK.stats.active=active;
    if(!active){if(visibleBefore)for(const mesh of WK.meshes){mesh.count=0;mesh.visible=false;}visibleBefore=false;WK.stats.visible=WK.stats.draws=0;return;}
    let count=0,bags=0;
    for(const path of WK.paths){if(!path.active)continue;
      const R2=(path.activeRadius*reach)**2;
      for(const actor of path.actors){WK.step(path,actor,dt,time);if(actor.gap>0)continue;
        const distance2=(actor.x-camera.x)**2+(actor.y-camera.y)**2+(actor.z-camera.z)**2;if(distance2>R2)continue;
        actor.sin=Math.sin(actor.yaw);actor.cos=Math.cos(actor.yaw);
        if(distance2<3600||Math.floor(time*5)!==actor.frame){actor.frame=Math.floor(time*5);actor.stride=actor.moving?Math.sin(actor.ph)*0.42:0;actor.wave=Math.sin(time*3)*0.35;}
        const pose=actor.look.pose;
        // look.pose 'dance' (bounce, arms up, sway; full rate near, 5 Hz far) and 'ride' (seated astride: legs forward, hands on the bars)
        if(pose==='dance'){
          const beat=distance2<3600?time:actor.frame/5,b=beat*7.6+actor.ph,sway=actor.yaw+Math.sin(beat*1.3+actor.ph)*0.55,bob=Math.abs(Math.sin(b))*0.1,hip=bodyPlan.lh/16+bob,shoulder=hip+bodyPlan.th/16,arm=(bodyPlan.tw+bodyPlan.aw)/32,leg=(bodyPlan.lw+1)/32,up=-2.55+Math.sin(b)*0.45;
          actor.sin=Math.sin(sway);actor.cos=Math.cos(sway);
          put(WK.meshes[0],count,actor,0,hip,0,Math.sin(b*0.5)*0.08);put(WK.meshes[1],count*2,actor,arm,shoulder,0,up);put(WK.meshes[1],count*2+1,actor,-arm,shoulder,0,(actor.ph%2>1?up:-2.55-Math.sin(b)*0.45));
          put(WK.meshes[2],count*2,actor,leg,hip,0,Math.sin(b)*0.28);put(WK.meshes[2],count*2+1,actor,-leg,hip,0,-Math.sin(b)*0.28);count++;continue;
        }
        if(pose==='ride'){
          const hip=bodyPlan.lh/16*0.55,shoulder=hip+bodyPlan.th/16,arm=(bodyPlan.tw+bodyPlan.aw)/32,leg=(bodyPlan.lw+1)/32+0.04;
          const prop=actor.weapon?weaponProps.get(AF.combat.npcGun(actor.weapon)):undefined;
          if(prop!=null){const ar=-1.25,s=Math.sin(ar),c=Math.cos(ar);put(WK.meshes[3],bags++,actor,arm,shoulder-0.05-0.52*c-0.03*s,0.12-0.52*s+0.03*c,ar,1,1,1,prop);}
          put(WK.meshes[0],count,actor,0,hip,0,0.25);put(WK.meshes[1],count*2,actor,arm,shoulder-0.05,0.12,-1.25);put(WK.meshes[1],count*2+1,actor,-arm,shoulder-0.05,0.12,-1.25);
          put(WK.meshes[2],count*2,actor,leg,hip,0,-1.2);put(WK.meshes[2],count*2+1,actor,-leg,hip,0,-1.2);count++;continue;
        }
        const stride=actor.stride||0,hip=bodyPlan.lh/16,shoulder=hip+bodyPlan.th/16,arm=(bodyPlan.tw+bodyPlan.aw)/32,leg=(bodyPlan.lw+1)/32,work=actor.look.pose==='marshal',cower=actor.rxOn&&actor.rx.fear>0&&!actor.moving&&!actor.tilt;
        // actor.aim (82-stealth): an armed guard raises a pistol two-handed (0 = lowered .. 1 = aimed); actor.torch: a lamp held out
        const aim=actor.tilt?0:(actor.aim||0);
        const right=-0.35-1.15*aim,left=actor.torch?-1.35:right;
        const prop=actor.weapon?weaponProps.get(AF.combat.npcGun(actor.weapon)):undefined;
        if(prop!=null){const ar=aim>0?right:-stride*0.8,s=Math.sin(ar),c=Math.cos(ar);put(WK.meshes[3],bags++,actor,aim>0?arm*0.8:arm,shoulder-0.52*c-0.03*s,-0.52*s+0.03*c,ar,1,1,1,prop);}
        if(actor.torch){const s=Math.sin(left),c=Math.cos(left);put(WK.meshes[3],bags++,actor,-arm*0.75,shoulder-0.52*c,-0.52*s,left,1,1,1,torchProp);}
        if(aim>0){put(WK.meshes[0],count,actor,0,hip,0);put(WK.meshes[1],count*2,actor,arm*0.8,shoulder,0,-0.35-1.15*aim);put(WK.meshes[1],count*2+1,actor,-arm*0.75,shoulder,0,-0.3-1.2*aim);
          put(WK.meshes[2],count*2,actor,leg,hip,0,stride);put(WK.meshes[2],count*2+1,actor,-leg,hip,0,-stride);
          count++;continue;}
        put(WK.meshes[0],count,actor,0,hip,0);put(WK.meshes[1],count*2,actor,arm,shoulder,0,cower?-2.9:work?-1.5+(actor.wave||0):-stride*0.8);put(WK.meshes[1],count*2+1,actor,-arm,shoulder,0,actor.torch?left:cower?-2.9:work?-1.5-(actor.wave||0):actor.bag?-0.22:stride*0.8);
        put(WK.meshes[2],count*2,actor,leg,hip,0,stride);put(WK.meshes[2],count*2+1,actor,-leg,hip,0,-stride);
        if(actor.bag&&!(actor.lift>0.03))put(WK.meshes[3],bags++,actor,-0.48,0,-0.45,-0.18);
        if(work){put(WK.meshes[3],bags++,actor,-0.4,shoulder-0.1,0.5,-Math.PI/2,0.12,0.65,0.12);put(WK.meshes[3],bags++,actor,0.4,shoulder-0.1,0.5,-Math.PI/2,0.12,0.65,0.12);}
        count++;
      }
    }
    for(let index=0;index<WK.meshes.length;index++){const mesh=WK.meshes[index];mesh.count=index===3?bags:index===0?count:count*2;mesh.visible=mesh.count>0;mesh.instanceMatrix.needsUpdate=true;const palette=mesh.geometry.attributes.walkerPalette;palette.clearUpdateRanges();palette.addUpdateRange(0,Math.max(1,mesh.count)*4);palette.needsUpdate=true;const prop=mesh.geometry.attributes.walkerProp;prop.clearUpdateRanges();prop.addUpdateRange(0,Math.max(1,mesh.count));prop.needsUpdate=true;}
    visibleBefore=count>0;WK.stats.visible=count;WK.stats.draws=count?3+(bags>0?1:0):0;
  };
  AF.onBuild('path-walkers',960,build);AF.onTick('path-walkers',305,update);
  AF.onTick('walker-torch',710,(dt)=>{
    if(!torchLight)return;
    if((torchAcc-=dt)<=0){
      torchAcc=1/15;torchGuard=null;let best=90*90;const cp=AF.camera.position;
      for(const path of WK.paths)if(path.active)for(const a of path.actors)if(a.torch&&!WK.isDown(a)){
        const d=(a.x-cp.x)**2+(a.y-cp.y)**2+(a.z-cp.z)**2;if(d<best){best=d;torchGuard=a;}
      }
      if(torchGuard){
        const a=torchGuard,t=a.torch,s=Math.sin(a.yaw),c=Math.cos(a.yaw);torchDist=Math.min(3.5,(t.range??9)*0.42);
        while(torchDist>0.6&&!AF.segClear(a.x,a.y+(t.eye??1.35),a.z,a.x+s*torchDist,a.y+0.18,a.z+c*torchDist))torchDist-=0.4;
      }
    }
    const a=torchGuard;
    if(!a||WK.isDown(a)){torchLight.enabled=false;torchLight.intensity=0;torchLight.x=torchLight.z=1e6;}
    else{
      const t=a.torch,s=Math.sin(a.yaw),c=Math.cos(a.yaw),range=t.range??9,cone=AF.clamp(t.cone??0.8,0.1,0.99),d=torchDist;
      torchLight.enabled=d>0.6;torchLight.intensity=d>0.6?0.85:0;
      torchLight.x=a.x+s*d;torchLight.y=a.y+0.18;torchLight.z=a.z+c*d;
      torchLight.range=Math.min(1.2,d*Math.sqrt(1-cone*cone)*0.85/1.6,(range-d)/1.6);
      if(!torchLight.enabled)torchLight.x=torchLight.z=1e6;
    }
    // The pool only repositions a fixture when reassigning it; this one follows its existing slot without another light/program.
    if(AF.atmos&&AF.atmos.pool)for(const pl of AF.atmos.pool)if(pl.userData.src===torchLight){
      pl.position.set(torchLight.x,torchLight.y,torchLight.z);pl.distance=torchLight.range*1.6;
      if(!torchLight.enabled)pl.intensity=0;
    }
  });
  AF.test('walkers: local activation, far freeze and four shared batches',()=>{
    const camera=AF.camera.position.clone(),path=WK.paths[0];if(!path)return{ok:false,info:'no paths'};
    try{AF.camera.position.set(path.minX,2,path.minZ);update(0.1,1);const active=path.active&&WK.stats.visible>0,actor=path.actors[0],before=actor.s;AF.camera.position.set(10000,10000,10000);update(0.1,2);return{ok:active&&!path.active&&actor.s===before&&WK.stats.draws===0&&WK.meshes.length===4&&WK.meshes[3].geometry.attributes.aPal.array instanceof Float32Array,info:'near '+active+', far frozen '+(actor.s===before)+', batches '+WK.meshes.length};}
    finally{AF.camera.position.copy(camera);update(0,AF.clock.w);}
  });
  AF.test('walkers: dwell, pingpong and flow keep the shared timetable',()=>{
    const path={idx:999,points:[[0,0,0],[1,0,0],[2,0,0]],lengths:new Float64Array([0,1,2]),waits:new Float64Array([0,1,1]),speed:1,length:2,mode:'pingpong',count:1},actor={s:0,dir:1,wait:0,gap:0,gap0:3,idx:0,lag:0,ph:0,look:{}};
    const tl=timeline(path),w0=-AF.whash(999,54)*tl.T;   // tau 0 at w0
    placeAt(path,actor,w0+0.5);const half=Math.abs(actor.s-0.5)<1e-6&&actor.moving;placeAt(path,actor,w0+1.5);const dwell=actor.s===1&&!actor.moving;
    placeAt(path,actor,w0+4.5);const reverse=actor.dir===-1&&actor.moving,s1=actor.s;placeAt(path,actor,w0+4.5);const same=actor.s===s1;
    path.mode='flow';path.tl=null;const T=timeline(path).T,w1=-AF.whash(999,54)*T;placeAt(path,actor,w1+T+1);
    return{ok:half&&dwell&&reverse&&same&&actor.gap>0,info:'mid-leg '+half+', dwell '+dwell+', reverse '+reverse+', repeatable '+same+', flow gap '+actor.gap.toFixed(2)};
  });
  AF.test('walkers: death and unconsciousness persist separately from a timed knock',()=>{
    const path={points:[[0,0,0]],speed:0,length:0},a={s:0,look:{},lag:0};
    WK.knock(a,0,1,0,0.1);for(let i=0;i<20;i++)WK.step(path,a,0.1,i/10);
    const temporary=!WK.isDown(a);
    WK.sleep(a);WK.step(path,a,100,100);const sleep=a.unconscious&&!a.dead&&WK.isDown(a);
    WK.kill(a);WK.knock(a,1,0,2,0.1);WK.stagger(a,1,0);WK.step(path,a,3600,3700);
    const dead=a.dead&&!a.unconscious&&WK.isDown(a)&&a.tilt<-1.5;
    WK.revive(a);WK.step(path,a,0.1,3700.1);
    return{ok:temporary&&sleep&&dead&&!WK.isDown(a),info:`timed ${temporary}, unconscious ${sleep}, permanent dead ${dead}, explicit revive ${!WK.isDown(a)}`};
  });
  AF.test('walkers: an airport passenger is knocked flat, gets up and rejoins the path',()=>{
    const path=WK.paths.find(p=>/^airport-/.test(p.name)&&p.speed>0&&p.actors.some(a=>!a.look.pose));if(!path)return{ok:false,info:'no airport path'};
    const camera=AF.camera.position.clone();
    try{
      AF.camera.position.set(path.minX,2,path.minZ);update(0.1,1);
      const a=path.actors.find(q=>!q.look.pose&&!(q.gap>0))||path.actors[0],found=WK.near(a.x,a.z,1).includes(a);
      WK.knock(a,1,0,3,1);for(let i=0;i<8;i++)update(0.1,1+i*0.1);const down=WK.isDown(a)&&a.tilt<-1.2;
      for(let i=0;i<90;i++)update(0.1,2+i*0.1);const up=!a.rxOn&&!a.tilt;
      return{ok:found&&down&&up,info:'near '+found+', down '+down+', back on path '+up};
    }finally{AF.camera.position.copy(camera);update(0,AF.clock.w);}
  });
}
}catch(error){AF.partError('54-walkers.js',error);}