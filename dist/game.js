(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const canvas = $('game'), ctx = canvas.getContext('2d', {alpha:false});
  const radar = $('minimap'), rctx = radar.getContext('2d');
  const TAU = Math.PI * 2, clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const rand=(a,b)=>a+Math.random()*(b-a);
  const hypot=(x,y)=>Math.hypot(x,y);
  const normAngle=a=>Math.atan2(Math.sin(a),Math.cos(a));
  let W=960,H=540,last=0,elapsed=0,mouseLocked=false,pointerLockUnavailable=false,muted=false,actx=null;
  let mode='menu',selectedTab='weapons',shopFromWave=false,shake=0,flash=0,hitTime=0,messageTime=0;
  let gunKick=0,shotsGlow=0,spawnDelay=0,waveTotal=0,wave=0,worldTime=0;
  let enemies=[],pickups=[],particles=[],blasts=[],sentries=[],grenades=[],worldTracers=[];
  const keys={}, mouse={fire:false,aim:false};
  const weapons=[
    {id:'sidearm',name:'MK.45 SIDEARM',class:'STANDARD SIDEARM',short:'MK.45',damage:29,rate:3.7,mag:12,reserve:108,reload:1.3,spread:.020,range:24,cost:0,pellets:1,tag:'SEMI AUTO',graphic:'▰━━'},
    {id:'smg',name:'VEX-9 SMG',class:'CLOSE-QUARTERS SMG',short:'VEX-9',damage:15,rate:11.5,mag:42,reserve:294,reload:1.7,spread:.056,range:19,cost:350,pellets:1,tag:'HIGH FIRE RATE',graphic:'▰━━━'},
    {id:'rifle',name:'ARX-7 RIFLE',class:'TACTICAL ASSAULT RIFLE',short:'ARX-7',damage:31,rate:7.0,mag:30,reserve:210,reload:1.9,spread:.029,range:29,cost:650,pellets:1,tag:'VERSATILE',graphic:'▰━━━━'},
    {id:'shotgun',name:'BREACH-12',class:'PUMP COMBAT SHOTGUN',short:'BREACH-12',damage:15,rate:1.15,mag:8,reserve:64,reload:2.25,spread:.16,range:13,cost:900,pellets:8,tag:'8 PELLET SPREAD',graphic:'▰━━━━━'},
    {id:'rail',name:'ION RAIL',class:'EXPERIMENTAL ENERGY RIFLE',short:'ION RAIL',damage:120,rate:.85,mag:6,reserve:36,reload:2.6,spread:.006,range:45,cost:1350,pellets:1,tag:'HIGH IMPACT',graphic:'◈━━━━━'}
  ];
  const enemyTypes={
    scout:{name:'STALKER',hp:63,speed:1.86,damage:9,rate:1.7,range:8,reward:45,radius:.28,color:'#f7b267',bullet:'#ffbd6a'},
    trooper:{name:'SENTINEL',hp:118,speed:1.16,damage:13,rate:1.28,range:12,reward:75,radius:.34,color:'#f27783',bullet:'#ff687e'},
    brute:{name:'JUGGERNAUT',hp:265,speed:.77,damage:23,rate:2.3,range:9,reward:145,radius:.44,color:'#bb91ff',bullet:'#d29aff'}
  };
  const SIZE=27,map=Array.from({length:SIZE},()=>Array(SIZE).fill(0));
  for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++)if(!x||!y||x===SIZE-1||y===SIZE-1)map[y][x]=1;
  // Four interconnected outer galleries and a generous central combat zone.
  for(let i=3;i<24;i++){
    if(i<11||i>15){map[5][i]=1;map[21][i]=1;map[i][5]=1;map[i][21]=1;}
  }
  const block=(x,y,w,h,t=2)=>{for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)if(i>0&&j>0&&i<SIZE-1&&j<SIZE-1)map[j][i]=t;};
  [[8,8],[18,8],[8,18],[18,18]].forEach(([x,y])=>block(x,y,1,1,3));
  [[11,9,2,1],[14,17,2,1],[9,13,1,2],[17,12,1,2],[12,12,1,1],[14,14,1,1],
   [2,9,2,1],[23,16,2,1],[10,23,1,2],[16,2,1,2],[3,3,1,1],[23,23,1,1],
   [3,17,1,2],[23,7,1,2],[7,3,2,1],[18,23,2,1]].forEach(a=>block(...a));
  const wallTextures={};
  function makeWallTexture(type){
    const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');
    const pal=type===1?['#273747','#142535','#101a2b']:type===2?['#5e5147','#393d40','#292e37']:['#1b535a','#18343d','#102431'];
    const grad=g.createLinearGradient(0,0,128,0);grad.addColorStop(0,pal[2]);grad.addColorStop(.32,pal[0]);grad.addColorStop(.62,pal[1]);grad.addColorStop(1,pal[2]);g.fillStyle=grad;g.fillRect(0,0,128,128);
    g.fillStyle='#020a13';g.fillRect(0,5,128,4);g.fillRect(0,116,128,8);
    g.fillStyle='rgba(255,255,255,.035)';for(let x=0;x<128;x+=19)g.fillRect(x,12,2,100);
    g.strokeStyle='rgba(0,0,0,.4)';g.lineWidth=3;g.strokeRect(8,17,112,95);g.strokeRect(17,24,94,80);
    g.fillStyle=type===2?'#eeb66f':type===3?'#65e8dc':'#4e8e9a';g.fillRect(0,32,128,4);g.fillRect(0,36,128,1);
    g.fillStyle=type===2?'rgba(255,191,88,.27)':'rgba(100,255,224,.19)';g.fillRect(0,39,128,9);
    g.fillStyle='rgba(255,255,255,.13)';for(let y of [23,99])for(let x of [20,105]){g.fillRect(x,y,4,4);g.fillStyle='#050c15';g.fillRect(x+1,y+1,2,2);g.fillStyle='rgba(255,255,255,.13)'}
    if(type===2){g.fillStyle='#111c28';for(let x=24;x<115;x+=28)g.fillRect(x,59,14,27);g.fillStyle='#f2b65a';g.font='bold 15px Arial';g.fillText('⚠',52,84)}
    if(type===3){g.fillStyle='#54ebdc';g.fillRect(54,48,15,54);g.fillStyle='rgba(83,255,230,.38)';g.fillRect(47,47,27,58)}
    return c;
  }
  [1,2,3].forEach(t=>wallTextures[t]=makeWallTexture(t));

  function robotSprite(type){
    const c=document.createElement('canvas');c.width=160;c.height=208;const g=c.getContext('2d');
    const color=enemyTypes[type].color,brute=type==='brute',scout=type==='scout';
    const poly=(pts,fill,stroke='#06131e',line=4)=>{g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=fill;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=line;g.stroke()}};
    g.shadowColor=color;g.shadowBlur=14;
    g.fillStyle='#070e1a';g.beginPath();g.ellipse(80,199,47,7,0,0,TAU);g.fill();g.shadowBlur=0;
    poly([[49,132],[70,132],[76,184],[66,200],[48,196],[41,166]],'#1b2c3a');
    poly([[89,132],[111,132],[117,167],[108,198],[89,201],[82,182]],'#172738');
    poly([[45,186],[74,188],[72,203],[38,205]],'#293a47');poly([[89,189],[115,187],[121,205],[89,205]],'#293a47');
    poly([[26,63],[51,62],[61,116],[50,151],[29,145],[22,104]],brute?'#495060':'#263647');
    poly([[107,62],[130,63],[137,106],[131,147],[109,152],[100,117]],brute?'#495060':'#263647');
    poly([[22,125],[47,129],[43,153],[25,151]],'#172532');poly([[113,130],[138,125],[138,151],[117,156]],'#172532');
    poly([[47,57],[112,57],[124,94],[115,143],[86,158],[44,140],[35,93]],brute?'#526073':'#304554');
    poly([[49,69],[111,69],[116,107],[91,126],[49,109]],'#182a3a');
    poly([[57,74],[103,74],[103,105],[80,115],[57,105]],brute?'#35384e':'#1b3340');
    g.fillStyle=color;g.shadowColor=color;g.shadowBlur=12;g.fillRect(60,91,40,5);g.fillRect(78,78,4,9);g.shadowBlur=0;
    poly([[55,16],[107,16],[118,33],[112,62],[101,77],[59,77],[45,62],[42,36]],brute?'#667185':'#384d60');
    poly([[53,36],[106,35],[110,55],[101,66],[59,66],[50,54]],'#0b1724');
    g.fillStyle=color;g.shadowColor=color;g.shadowBlur=18;g.fillRect(54,47,51,8);g.shadowBlur=0;
    g.fillStyle='#f3f8fc';g.globalAlpha=.5;g.fillRect(56,48,18,2);g.globalAlpha=1;
    poly([[41,20],[55,11],[62,15],[57,35],[45,38]],'#435b70');poly([[102,15],[111,11],[121,22],[115,38],[104,34]],'#435b70');
    g.strokeStyle=color;g.lineWidth=3;g.globalAlpha=.55;g.beginPath();g.moveTo(80,4);g.lineTo(80,15);g.stroke();g.globalAlpha=1;
    if(brute){poly([[19,55],[44,47],[57,64],[42,83],[16,75]],'#657181');poly([[108,64],[122,47],[146,55],[146,75],[119,83]],'#657181')}
    if(scout){g.strokeStyle=color;g.lineWidth=3;g.beginPath();g.moveTo(65,18);g.lineTo(57,3);g.moveTo(97,17);g.lineTo(106,3);g.stroke()}
    return c;
  }
  const robotImages=Object.fromEntries(Object.keys(enemyTypes).map(t=>[t,robotSprite(t)]));
  function pickupSprite(kind){
    const c=document.createElement('canvas');c.width=c.height=96;const g=c.getContext('2d');
    const col=kind==='health'?'#84f4ab':kind==='ammo'?'#79c8ff':'#ffe286';
    g.shadowColor=col;g.shadowBlur=24;g.strokeStyle=col;g.lineWidth=4;g.beginPath();g.arc(48,48,29,0,TAU);g.stroke();g.fillStyle='rgba(5,27,41,.88)';g.fill();
    g.shadowBlur=8;g.fillStyle=col;g.textAlign='center';g.textBaseline='middle';g.font='bold 40px Arial';g.fillText(kind==='health'?'✚':kind==='ammo'?'▥':'✦',48,47);return c;
  }
  const pickupImages=Object.fromEntries(['health','ammo','credits'].map(k=>[k,pickupSprite(k)]));
  function gunSprite(index){
    const c=document.createElement('canvas');c.width=620;c.height=400;const g=c.getContext('2d'),gun=weapons[index];
    const accent=index===4?'#e8caff':index===3?'#f6bb73':index===2?'#86ffe4':index===1?'#66d4ff':'#a0c7c7';
    const poly=(pts,fill,stroke='#0a1220',th=5)=>{g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fillStyle=fill;g.fill();g.strokeStyle=stroke;g.lineWidth=th;g.stroke()};
    // Forearm, padded glove and three-quarter-view futuristic receiver.
    poly([[428,271],[570,280],[620,400],[402,400],[370,331]],'#233c4a');
    poly([[353,264],[420,240],[466,289],[427,351],[350,330]],'#364b55');
    poly([[366,288],[405,267],[439,297],[411,325],[374,317]],'#121e2a');
    poly([[183,152],[290,158],[317,188],[281,211],[161,187]],'#151f2b');
    poly([[128,121],[295,143],[311,181],[117,155]],'#4d6472');
    poly([[126,128],[276,151],[276,161],[119,148]],'#111d2d');
    poly([[111,119],[142,123],[142,157],[101,159]],'#121c2b');
    poly([[199,137],[318,142],[374,193],[357,270],[286,295],[239,222]],'#475e69');
    poly([[242,155],[335,169],[349,211],[308,249],[231,210]],'#1a2b3b');
    poly([[304,225],[376,204],[416,251],[390,303],[331,291]],'#273b49');
    poly([[327,281],[372,278],[377,354],[341,374],[310,333]],'#162532');
    poly([[239,148],[317,157],[305,176],[245,170]],'#77949b');
    poly([[181,155],[284,172],[278,192],[177,173]],'#1e3444');
    g.fillStyle=accent;g.shadowColor=accent;g.shadowBlur=12;g.fillRect(198,174,64,5);g.fillRect(327,204,29,4);g.shadowBlur=0;
    for(let i=0;i<4;i++){g.fillStyle='#091726';g.fillRect(260+i*15,179+i*2,8,7)}
    poly([[271,120],[297,119],[303,155],[276,152]],'#182735');poly([[278,113],[298,112],[298,124],[278,126]],'#6a8697');
    g.fillStyle=accent;g.shadowColor=accent;g.shadowBlur=10;g.fillRect(283,118,10,4);g.shadowBlur=0;
    if(index===1){poly([[328,249],[382,244],[381,353],[345,376]],'#1a2f3c');g.fillStyle='#6eb3c6';g.fillRect(343,263,9,70)}
    if(index===2){poly([[185,164],[325,171],[329,181],[185,175]],'#607e88');poly([[300,245],[350,244],[350,333],[309,341]],'#172734')}
    if(index===3){poly([[107,123],[293,145],[293,161],[102,149]],'#a48c73');for(let x=159;x<252;x+=17){g.strokeStyle='#ddbd81';g.lineWidth=3;g.beginPath();g.moveTo(x,141);g.lineTo(x+12,161);g.stroke()}}
    if(index===4){poly([[105,120],[298,146],[300,166],[102,151]],'#506080');g.strokeStyle='#da9dff';g.shadowColor='#d38cff';g.shadowBlur=22;g.lineWidth=8;g.beginPath();g.moveTo(142,145);g.lineTo(284,164);g.stroke();g.shadowBlur=0;poly([[283,133],[327,141],[336,163],[284,159]],'#7e6b9b')}
    if(index===0){g.fillStyle='#101d27';g.fillRect(150,161,80,19)}
    // Foreground trigger-hand gauntlet.
    poly([[365,279],[426,271],[451,314],[421,361],[368,339]],'#54656c');
    poly([[366,280],[399,279],[418,311],[381,323]],'#263a46');
    g.strokeStyle='#759ca4';g.lineWidth=3;g.beginPath();g.moveTo(383,326);g.lineTo(423,336);g.stroke();
    return c;
  }
  const gunImages=weapons.map((_,i)=>gunSprite(i));
  const stars=Array.from({length:110},()=>({x:Math.random(),y:Math.random()*.7,r:rand(.2,1.6),a:rand(.1,.65)}));
  const skylines=Array.from({length:48},(_,i)=>({x:i/48,h:rand(.05,.29),w:rand(.018,.045)}));
  function makePlayer(){return {x:13.5,y:13.5,angle:-Math.PI/2,pitch:0,jump:0,vz:0,bob:0,health:100,maxHealth:100,armor:50,maxArmor:100,credits:250,score:0,kills:0,weapon:0,owned:new Set([0]),mags:weapons.map(g=>g.mag),reserves:weapons.map(g=>g.reserve),reloading:0,fireCooldown:0,grenadeCount:1,medkitCount:1,sentryCount:0,damageLevel:0,fireLevel:0,speedLevel:0,armorLevel:0,alive:true};}
  let player=makePlayer();
  function resize(){let cssW=window.innerWidth,cssH=window.innerHeight;W=Math.round(Math.min(1080,Math.max(520,cssW*.78)));H=Math.round(W*cssH/cssW);H=Math.min(720,H);canvas.width=W;canvas.height=H;ctx.imageSmoothingEnabled=true;}
  window.addEventListener('resize',resize);resize();
  function wall(x,y){let ix=Math.floor(x),iy=Math.floor(y);return ix<0||iy<0||ix>=SIZE||iy>=SIZE?1:map[iy][ix];}
  function free(x,y,r=.28){return !wall(x-r,y-r)&&!wall(x+r,y-r)&&!wall(x-r,y+r)&&!wall(x+r,y+r);}
  function moveWithCollision(entity,dx,dy,r=.26){if(free(entity.x+dx,entity.y,r))entity.x+=dx;if(free(entity.x,entity.y+dy,r))entity.y+=dy;}
  function clearLine(x1,y1,x2,y2){const d=hypot(x2-x1,y2-y1),steps=Math.ceil(d*7);for(let i=1;i<steps;i++){const t=i/steps;if(wall(x1+(x2-x1)*t,y1+(y2-y1)*t))return false;}return true;}
  function pathStep(ex,ey,px,py){
    const sx=Math.floor(ex),sy=Math.floor(ey),tx=Math.floor(px),ty=Math.floor(py);
    if(sx===tx&&sy===ty)return {x:px,y:py};
    const seen=new Uint8Array(SIZE*SIZE),prev=new Int16Array(SIZE*SIZE).fill(-1),queue=new Int16Array(SIZE*SIZE);
    let head=0,tail=0,start=sy*SIZE+sx,end=ty*SIZE+tx;queue[tail++]=start;seen[start]=1;
    while(head<tail){const cur=queue[head++];if(cur===end)break;const x=cur%SIZE,y=Math.floor(cur/SIZE);
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=SIZE||ny>=SIZE||map[ny][nx])continue;const n=ny*SIZE+nx;if(!seen[n]){seen[n]=1;prev[n]=cur;queue[tail++]=n;}}}
    if(!seen[end])return {x:px,y:py};let next=end;while(prev[next]!==start&&prev[next]!==-1)next=prev[next];return {x:next%SIZE+.5,y:Math.floor(next/SIZE)+.5};
  }
  function tone(freq,duration=.08,type='sawtooth',volume=.045,slide=0){
    if(muted)return;try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();if(actx.state==='suspended')actx.resume();const o=actx.createOscillator(),g=actx.createGain(),t=actx.currentTime;o.type=type;o.frequency.setValueAtTime(freq,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(25,freq+slide),t+duration);g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g).connect(actx.destination);o.start(t);o.stop(t+duration+.01);}catch(_){/* Audio is optional. */}
  }
  function project(x,y,fov=Math.PI*.47){
    const dx=x-player.x,dy=y-player.y,co=Math.cos(player.angle),si=Math.sin(player.angle),tan=Math.tan(fov/2);
    const depth=dx*co+dy*si,side=-dx*si+dy*co;
    if(depth<=.08)return null;return {x:W*.5*(1+side/(depth*tan)),d:depth,size:H/depth};
  }
  function drawBackdrop(horizon){
    const sky=ctx.createLinearGradient(0,0,0,Math.max(1,horizon));sky.addColorStop(0,'#071023');sky.addColorStop(.55,'#14233f');sky.addColorStop(1,'#214558');ctx.fillStyle=sky;ctx.fillRect(0,0,W,Math.max(H,horizon));
    const glowX=W*(.75-player.angle/TAU%1);const glow=ctx.createRadialGradient(glowX,horizon*.5,3,glowX,horizon*.5,W*.42);glow.addColorStop(0,'rgba(65,204,213,.14)');glow.addColorStop(1,'rgba(65,204,213,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,W,horizon);
    for(const s of stars){const x=((s.x-player.angle/TAU*.6+3)%1)*W,y=s.y*Math.max(1,horizon*.85);ctx.fillStyle=`rgba(182,249,245,${s.a})`;ctx.fillRect(x,y,s.r,s.r);}
    for(let i=0;i<skylines.length;i++){const b=skylines[i],x=((b.x-player.angle/TAU*.27+3)%1)*W;ctx.fillStyle='#10263b';ctx.fillRect(x,horizon-b.h*H,b.w*W,b.h*H);if(i%3===0){ctx.fillStyle='#2a7a86';ctx.fillRect(x+3,horizon-b.h*H+6,2,3);}}
  }
  function drawFloor(horizon,fov){
    ctx.fillStyle='#111c2a';ctx.fillRect(0,horizon,W,H-horizon);
    const co=Math.cos(player.angle),si=Math.sin(player.angle),tan=Math.tan(fov/2);
    const lx=co+si*tan,ly=si-co*tan,rx=co-si*tan,ry=si+co*tan;
    for(let y=Math.max(0,Math.floor(horizon));y<H;y+=4){
      const dist=(.49*H)/(y-horizon+.65),dx=dist*(rx-lx)/W,dy=dist*(ry-ly)/W;
      let fx=player.x+dist*lx,fy=player.y+dist*ly;
      for(let x=0;x<W;x+=6){
        const cx=fx-Math.floor(fx),cy=fy-Math.floor(fy),edge=cx<.029||cy<.029;
        const q=(Math.floor(fx)+Math.floor(fy))&1,fade=clamp(1-dist/31,.12,.88),decor=(Math.floor(fx*4)*7+Math.floor(fy*4)*13)%43===0;
        ctx.fillStyle=edge?`rgba(50,142,150,${fade*.30})`:decor?`rgba(88,216,208,${fade*.30})`:q?'#16283a':'#132435';
        ctx.fillRect(x,y,6,4);fx+=dx*6;fy+=dy*6;
      }
    }
    const shade=ctx.createLinearGradient(0,horizon,0,H);shade.addColorStop(0,'rgba(6,17,28,.55)');shade.addColorStop(1,'rgba(0,4,12,.20)');ctx.fillStyle=shade;ctx.fillRect(0,horizon,W,H-horizon);
  }
  function drawWalls(horizon,fov){
    const dirX=Math.cos(player.angle),dirY=Math.sin(player.angle),tan=Math.tan(fov/2),planeX=-dirY*tan,planeY=dirX*tan;
    const zbuffer=new Float32Array(W).fill(100);
    for(let x=0;x<W;x+=2){
      const cameraX=2*x/W-1,rdX=dirX+planeX*cameraX,rdY=dirY+planeY*cameraX;
      let mx=Math.floor(player.x),my=Math.floor(player.y),sideDistX,sideDistY;
      const deltaX=Math.abs(1/(rdX||1e-9)),deltaY=Math.abs(1/(rdY||1e-9));
      const stepX=rdX<0?-1:1,stepY=rdY<0?-1:1;
      sideDistX=(rdX<0?player.x-mx:mx+1-player.x)*deltaX;
      sideDistY=(rdY<0?player.y-my:my+1-player.y)*deltaY;
      let side=0,hit=1,type=1;
      while(hit<48){if(sideDistX<sideDistY){sideDistX+=deltaX;mx+=stepX;side=0;}else{sideDistY+=deltaY;my+=stepY;side=1;}
        if(mx<0||my<0||mx>=SIZE||my>=SIZE){type=1;break;}if(map[my][mx]){type=map[my][mx];break;}hit++;}
      const depth=Math.max(.07,side?(my-player.y+(1-stepY)/2)/(rdY||1e-9):(mx-player.x+(1-stepX)/2)/(rdX||1e-9));
      const ht=H/Math.max(.09,depth),top=horizon-ht*.51,bottom=horizon+ht*.49;
      let wx=side?player.x+depth*rdX:player.y+depth*rdY;wx-=Math.floor(wx);if((side&&rdY<0)||(!side&&rdX>0))wx=1-wx;
      const texX=clamp(Math.floor(wx*128),0,127);
      ctx.drawImage(wallTextures[type],texX,0,1,128,x,top,3,ht);
      const shade=Math.min(.77,depth*.019+(side?.18:0));ctx.fillStyle=`rgba(2,6,16,${shade})`;ctx.fillRect(x,top,3,ht);
      if(type!==2&&depth<19){const glow=.20*(1-depth/24);ctx.fillStyle=`rgba(90,255,224,${glow})`;ctx.fillRect(x,top+ht*.25,3,Math.max(1,ht*.018));}
      zbuffer[x]=zbuffer[Math.min(W-1,x+1)]=depth;
    }
    return zbuffer;
  }
  function drawBillboard(img,x,y,scale,feetScale,horizon,zbuffer,fov,health=null,maxHealth=null,bob=0){
    const p=project(x,y,fov);if(!p||p.d>34||p.x<-W||p.x>W*2)return;
    const sh=Math.max(1,p.size*scale),sw=sh*(img.width/img.height),left=p.x-sw/2,top=horizon+p.size*feetScale-sh+bob;
    if(left>W||left+sw<0||top>H||top+sh<0)return;
    for(let xx=Math.max(0,Math.floor(left));xx<Math.min(W,Math.ceil(left+sw));xx+=2){if(p.d<zbuffer[xx]+.04){const u=Math.floor((xx-left)/sw*img.width);ctx.drawImage(img,clamp(u,0,img.width-1),0,2,img.height,xx,top,2,sh);}}
    if(health!=null&&health<maxHealth){const bw=clamp(sw*.73,20,60),bh=4,bx=p.x-bw/2,by=top-11;
      if(p.d<zbuffer[clamp(Math.floor(p.x),0,W-1)]+.04){ctx.fillStyle='#201f2b';ctx.fillRect(bx,by,bw,bh);ctx.fillStyle='#fb7786';ctx.fillRect(bx,by,bw*(health/maxHealth),bh);}}
  }
  function drawWorldEffects(horizon,zbuffer,fov){
    const things=[];
    for(const e of enemies)if(e.hp>0)things.push({x:e.x,y:e.y,t:'enemy',obj:e});
    for(const p of pickups)things.push({x:p.x,y:p.y,t:'pickup',obj:p});
    for(const s of sentries)things.push({x:s.x,y:s.y,t:'sentry',obj:s});
    for(const g of grenades)things.push({x:g.x,y:g.y,t:'grenade',obj:g});
    things.sort((a,b)=>hypot(b.x-player.x,b.y-player.y)-hypot(a.x-player.x,a.y-player.y));
    for(const t of things){
      if(t.t==='enemy'){const e=t.obj,animation=Math.sin(worldTime*4.1+e.seed)*1.5;drawBillboard(robotImages[e.type],e.x,e.y,e.type==='brute'?1.03:.88,.49,horizon,zbuffer,fov,e.hp,e.maxHp,animation);}
      if(t.t==='pickup'){drawBillboard(pickupImages[t.obj.kind],t.x,t.y,.33,.43,horizon,zbuffer,fov,null,null,Math.sin(worldTime*4+t.obj.seed)*5);}
      if(t.t==='sentry'){const p=project(t.x,t.y,fov);if(!p||p.d>zbuffer[clamp(Math.floor(p.x),0,W-1)])continue;const size=p.size*.36;ctx.shadowBlur=13;ctx.shadowColor='#6efce2';ctx.fillStyle='#1e4255';ctx.fillRect(p.x-size*.42,horizon+p.size*.45-size,size*.84,size);ctx.fillStyle='#8bfff0';ctx.fillRect(p.x-size*.29,horizon+p.size*.48-size*.8,size*.58,size*.16);ctx.shadowBlur=0;}
      if(t.t==='grenade'){const p=project(t.x,t.y,fov);if(!p||p.d>zbuffer[clamp(Math.floor(p.x),0,W-1)])continue;ctx.fillStyle='#eaff9b';ctx.shadowColor='#bfff79';ctx.shadowBlur=15;ctx.beginPath();ctx.arc(p.x,horizon+p.size*.25,clamp(p.size*.065,3,15),0,TAU);ctx.fill();ctx.shadowBlur=0;}
    }
    for(const blast of blasts){const p=project(blast.x,blast.y,fov);if(!p)continue;const rad=clamp(p.size*blast.radius,8,200)*(1-blast.life/blast.maxLife*.45);ctx.strokeStyle=`rgba(255,220,125,${blast.life/blast.maxLife*.8})`;ctx.lineWidth=4;ctx.shadowColor='#ffa657';ctx.shadowBlur=20;ctx.beginPath();ctx.ellipse(p.x,horizon,rad,rad*.45,0,0,TAU);ctx.stroke();ctx.shadowBlur=0;}
    for(const tr of worldTracers){const a=project(tr.x1,tr.y1,fov),b=project(tr.x2,tr.y2,fov);if(!a||!b)continue;ctx.strokeStyle=tr.color;ctx.globalAlpha=clamp(tr.life/.18,0,1);ctx.lineWidth=2;ctx.shadowColor=tr.color;ctx.shadowBlur=10;ctx.beginPath();ctx.moveTo(a.x,horizon+.12*a.size);ctx.lineTo(b.x,horizon+.12*b.size);ctx.stroke();ctx.globalAlpha=1;ctx.shadowBlur=0;}
    for(const p of particles){ctx.fillStyle=p.color;ctx.globalAlpha=clamp(p.life/p.maxLife,0,1);ctx.fillRect(p.x,p.y,p.size,p.size);ctx.globalAlpha=1;}
  }
  function drawWeapon(){
    if(mode==='menu'||mode==='dead')return;
    const g=gunImages[player.weapon],scale=player.weapon===0?.69:.77;
    const bob=Math.sin(player.bob*2)*4*(keys.KeyW||keys.KeyS||keys.KeyA||keys.KeyD?1:.13),aim=mouse.aim;
    const width=W*scale,height=width*(400/620),x=W*(aim?.29:.40),y=H-height*(aim?.60:.73)+bob+gunKick*H*.10;
    ctx.save();ctx.translate((Math.random()-.5)*shake*8,(Math.random()-.5)*shake*5);
    ctx.drawImage(g,x,y,width,height);
    if(shotsGlow>0){const sx=x+width*.16,sy=y+height*.35,r=clamp(W*.085,32,92)*shotsGlow;
      ctx.globalCompositeOperation='lighter';const grad=ctx.createRadialGradient(sx,sy,1,sx,sy,r);grad.addColorStop(0,'rgba(255,255,229,.96)');grad.addColorStop(.14,'rgba(255,237,142,.85)');grad.addColorStop(.5,'rgba(255,149,58,.32)');grad.addColorStop(1,'rgba(255,95,15,0)');ctx.fillStyle=grad;ctx.beginPath();ctx.arc(sx,sy,r,0,TAU);ctx.fill();ctx.globalCompositeOperation='source-over';}
    ctx.restore();
  }
  function render(){
    const fov=(mouse.aim&&mode==='playing')?Math.PI*.33:Math.PI*.47;
    const horizon=clamp(H*.51+player.pitch*H*.68+player.jump*H*.115,H*.1,H*.9);
    ctx.save();if(shake>.05)ctx.translate(rand(-shake,shake)*4,rand(-shake,shake)*3);
    drawBackdrop(horizon);drawFloor(horizon,fov);const z=drawWalls(horizon,fov);drawWorldEffects(horizon,z,fov);drawWeapon();ctx.restore();
  }
  function spawnEnemy(type){
    let x=7.5,y=7.5;
    for(let i=0;i<100;i++){x=rand(1.6,SIZE-1.6);y=rand(1.6,SIZE-1.6);
      if(free(x,y,.47)&&hypot(x-player.x,y-player.y)>7&&enemies.every(e=>hypot(e.x-x,e.y-y)>1.1))break;}
    const def=enemyTypes[type],mult=1+Math.max(0,wave-1)*.115;
    enemies.push({x,y,type,hp:Math.round(def.hp*mult),maxHp:Math.round(def.hp*mult),fireWait:rand(.7,2.0),pathWait:0,pathTarget:null,seed:rand(0,12),strafe:Math.random()<.5?-1:1,turnWait:rand(1.5,3),flinch:0});
  }
  function spawnWave(){
    wave++;enemies=[];pickups=[];sentries=[];grenades=[];blasts=[];worldTracers=[];
    const count=Math.min(25,3+wave*2);waveTotal=count;
    for(let i=0;i<count;i++){let type='scout';if(wave>=3&&i%Math.max(3,7-Math.floor(wave/2))===0)type='brute';else if(wave>=2&&i%3===0)type='trooper';spawnEnemy(type);}
    if(wave>1){player.health=Math.min(player.maxHealth,player.health+18);player.armor=Math.min(player.maxArmor,player.armor+15);player.reserves[player.weapon]+=Math.round(weapons[player.weapon].mag*.65);}
    spawnDelay=1.5;mode='playing';hideOverlays();$('hud').classList.remove('hidden');
    showMessage(`WAVE ${String(wave).padStart(2,'0')} INBOUND`,'ELIMINATE ALL HOSTILE UNITS',2.9);
    tone(550,.24,'sine',.08,-380);tone(330,.4,'triangle',.04,-220);
    syncHud();
  }
  function showMessage(title,sub='',duration=2){$('centerMessage').innerHTML=`${title}<small>${sub}</small>`;$('centerMessage').style.opacity='1';messageTime=duration;}
  function killfeed(text,reward){const el=document.createElement('div');el.innerHTML=`${text} <b>+${reward} CR</b>`;$('killfeed').prepend(el);setTimeout(()=>el.remove(),2500);if($('killfeed').children.length>4)$('killfeed').lastElementChild.remove();}
  function sparkAt(x,y,color='#ffbc69',count=13){const p=project(x,y);if(!p)return;for(let i=0;i<count;i++)particles.push({x:p.x+rand(-6,6),y:H*.51+player.pitch*H*.68+rand(-15,15),vx:rand(-110,110),vy:rand(-130,40),life:rand(.18,.6),maxLife:.6,size:rand(1.8,4.7),color});}
  function dropPickup(x,y){const r=Math.random();if(r>.40)return;const kind=r<.13?'health':r<.28?'ammo':'credits';pickups.push({x,y,kind,seed:rand(0,8),life:24});}
  function hitEnemy(e,damage){if(e.hp<=0)return;e.hp-=damage;e.flinch=.16;sparkAt(e.x,e.y,enemyTypes[e.type].color,Math.min(16,5+Math.floor(damage/10)));hitTime=.15;$('hitmarker').style.opacity='1';$('crosshair').classList.add('active');
    if(e.hp<=0){player.kills++;const reward=enemyTypes[e.type].reward;player.credits+=reward;player.score+=reward*10+100;dropPickup(e.x,e.y);killfeed(enemyTypes[e.type].name+' ELIMINATED',reward);tone(690,.11,'triangle',.045,-360);}
    else{player.score+=Math.round(damage*2);tone(970,.042,'square',.018,-470);}
  }
  function damagePlayer(amount){if(!player.alive||mode!=='playing')return;
    const absorbed=Math.min(player.armor,amount*.65);player.armor-=absorbed;player.health=Math.max(0,player.health-(amount-absorbed));
    flash=Math.min(.84,flash+.46);shake=Math.max(shake,1.65);tone(125,.18,'sawtooth',.08,-90);
    if(player.health<=0)onDeath();
  }
  function shoot(){
    if(mode!=='playing'||!player.alive||player.fireCooldown>0||player.reloading>0||spawnDelay>.2)return;
    const gun=weapons[player.weapon];if(player.mags[player.weapon]<=0){reload();tone(110,.065,'square',.025,-60);return;}
    player.mags[player.weapon]--;player.fireCooldown=1/(gun.rate*(1+player.fireLevel*.12));gunKick=.65;shotsGlow=1;shake=Math.max(shake,.36);
    tone(gun.id==='rail'?115:gun.id==='shotgun'?93:gun.id==='smg'?215:gun.id==='rifle'?153:185,gun.id==='rail'?.24:.105,gun.id==='rail'?'sine':'sawtooth',gun.id==='rail'?.12:.055,gun.id==='rail'?-60:-100);
    const spread=gun.spread*(mouse.aim?.48:1)*(keys.ShiftLeft?1.55:1),damage=gun.damage*(1+player.damageLevel*.18),hitSet=new Set();
    for(let i=0;i<gun.pellets;i++){
      const ang=player.angle+rand(-spread,spread),dx=Math.cos(ang),dy=Math.sin(ang);
      let target=null,targetD=Infinity;
      for(const e of enemies){if(e.hp<=0)continue;const dist=hypot(e.x-player.x,e.y-player.y);if(dist>gun.range||dist>targetD)continue;
        const delta=Math.abs(normAngle(Math.atan2(e.y-player.y,e.x-player.x)-ang));
        if(delta>Math.atan2(enemyTypes[e.type].radius*.98,dist)+.010)continue;
        if(Math.abs(player.pitch)>.14+.28/dist)continue;
        if(!clearLine(player.x,player.y,e.x,e.y))continue;
        target=e;targetD=dist;
      }
      if(target){const falloff=gun.id==='shotgun'?clamp(1-targetD/18,.22,1):1;hitEnemy(target,damage*falloff);hitSet.add(target);}
      else if(i===0){worldTracers.push({x1:player.x+dx*.4,y1:player.y+dy*.4,x2:player.x+dx*Math.min(14,gun.range),y2:player.y+dy*Math.min(14,gun.range),life:.065,color:gun.id==='rail'?'#d6b4ff':'#f9e3a3'});}
    }
    if(gun.id==='rail'&&hitSet.size){const e=[...hitSet][0];blasts.push({x:e.x,y:e.y,radius:.45,life:.23,maxLife:.23});}
    if(player.mags[player.weapon]===0&&player.reserves[player.weapon]>0)setTimeout(()=>{if(mode==='playing'&&player.mags[player.weapon]===0)reload();},180);
    syncHud();
  }
  function reload(){const i=player.weapon,g=weapons[i];if(player.reloading>0||player.mags[i]>=g.mag||player.reserves[i]<=0)return;
    player.reloading=g.reload;shotsGlow=0;tone(390,.11,'triangle',.025,-200);syncHud();}
  function finishReload(){const i=player.weapon,g=weapons[i],n=Math.min(g.mag-player.mags[i],player.reserves[i]);player.mags[i]+=n;player.reserves[i]-=n;tone(520,.1,'triangle',.03,-100);}
  function switchWeapon(index){if(!player.owned.has(index)||index===player.weapon)return;player.weapon=index;player.reloading=0;player.fireCooldown=.24;gunKick=.1;tone(340,.09,'triangle',.028,170);syncHud();}
  function cycleWeapon(dir){const have=[...player.owned].sort((a,b)=>a-b),i=have.indexOf(player.weapon);switchWeapon(have[(i+dir+have.length)%have.length]);}
  function useMedkit(){if(mode!=='playing'||player.medkitCount<=0||player.health>=player.maxHealth)return;player.medkitCount--;player.health=Math.min(player.maxHealth,player.health+55);tone(780,.25,'sine',.05,290);showMessage('FIELD REPAIR +55','MEDKIT CONSUMED',1.3);syncHud();}
  function throwGrenade(){if(mode!=='playing'||player.grenadeCount<=0)return;player.grenadeCount--;grenades.push({x:player.x+Math.cos(player.angle)*.55,y:player.y+Math.sin(player.angle)*.55,vx:Math.cos(player.angle)*6,vy:Math.sin(player.angle)*6,timer:1.05});tone(360,.08,'triangle',.04,-220);syncHud();}
  function deploySentry(){if(mode!=='playing'||player.sentryCount<=0)return;let x=player.x+Math.cos(player.angle)*1.25,y=player.y+Math.sin(player.angle)*1.25;if(!free(x,y,.28)){x=player.x;y=player.y;}player.sentryCount--;sentries.push({x,y,life:27,cooldown:.2});tone(470,.24,'sine',.06,230);showMessage('SENTRY ONLINE','AUTOMATED DEFENSE ACTIVE',1.4);syncHud();}
  function explode(x,y){blasts.push({x,y,radius:2.7,life:.62,maxLife:.62});sparkAt(x,y,'#ffba6b',30);shake=2.6;tone(75,.38,'sawtooth',.13,-50);
    for(const e of enemies){if(e.hp<=0)continue;const d=hypot(e.x-x,e.y-y);if(d<3.3)hitEnemy(e,Math.round(135*(1-d/4)));}}
  function updateEnemies(dt){
    for(const e of enemies){if(e.hp<=0)continue;
      const def=enemyTypes[e.type],dx=player.x-e.x,dy=player.y-e.y,dist=hypot(dx,dy),visible=dist<18&&clearLine(e.x,e.y,player.x,player.y);
      e.fireWait-=dt;e.pathWait-=dt;e.turnWait-=dt;e.flinch=Math.max(0,e.flinch-dt);
      if(e.turnWait<=0){e.strafe*=-1;e.turnWait=rand(1.8,3.5);}
      let tx=player.x,ty=player.y;
      if(!visible){if(e.pathWait<=0||!e.pathTarget){e.pathTarget=pathStep(e.x,e.y,player.x,player.y);e.pathWait=rand(.55,1.05);}tx=e.pathTarget.x;ty=e.pathTarget.y;}
      if(dist>(def.range*.58)||!visible){const vx=tx-e.x,vy=ty-e.y,d=Math.max(.001,hypot(vx,vy)),speed=def.speed*(1+Math.min(wave,14)*.018);moveWithCollision(e,vx/d*speed*dt,vy/d*speed*dt,def.radius);}
      else if(dist>2.5){const v=def.speed*.37*e.strafe*dt;moveWithCollision(e,-dy/dist*v,dx/dist*v,def.radius);}
      if(visible&&dist<def.range&&e.fireWait<=0){e.fireWait=def.rate*rand(.82,1.22);worldTracers.push({x1:e.x,y1:e.y,x2:player.x,y2:player.y,life:.16,color:def.bullet});
        if(Math.random()<.83)damagePlayer(def.damage+Math.min(8,Math.floor(wave/3)));}
    }
    enemies=enemies.filter(e=>e.hp>0);
    if(!enemies.length&&spawnDelay<=0&&mode==='playing')endWave();
  }
  function updatePickups(dt){
    for(const p of pickups){p.life-=dt;if(hypot(p.x-player.x,p.y-player.y)<.7){p.life=0;
      if(p.kind==='health')player.health=Math.min(player.maxHealth,player.health+30);
      else if(p.kind==='ammo')player.reserves[player.weapon]+=weapons[player.weapon].mag*2;
      else player.credits+=95;
      tone(880,.16,'sine',.04,540);}
    }pickups=pickups.filter(p=>p.life>0);
  }
  function updateEquipment(dt){
    for(const g of grenades){g.timer-=dt;let nx=g.x+g.vx*dt,ny=g.y+g.vy*dt;if(free(nx,ny,.1)){g.x=nx;g.y=ny;}else{g.vx=-g.vx*.22;g.vy=-g.vy*.22;}g.vx*=Math.max(0,1-dt*2.3);g.vy*=Math.max(0,1-dt*2.3);if(g.timer<=0)explode(g.x,g.y);}
    grenades=grenades.filter(g=>g.timer>0);
    for(const s of sentries){s.life-=dt;s.cooldown-=dt;if(s.cooldown>0)continue;let chosen=null,nearest=9;
      for(const e of enemies){const d=hypot(e.x-s.x,e.y-s.y);if(e.hp>0&&d<nearest&&clearLine(s.x,s.y,e.x,e.y)){chosen=e;nearest=d;}}
      if(chosen){s.cooldown=.32;worldTracers.push({x1:s.x,y1:s.y,x2:chosen.x,y2:chosen.y,life:.17,color:'#8ffff1'});hitEnemy(chosen,22*(1+player.damageLevel*.1));tone(390,.06,'square',.015,-80);}
    }sentries=sentries.filter(s=>s.life>0);
  }
  function updateMovement(dt){
    // Keyboard aiming keeps the shooter playable in browsers that disallow pointer lock.
    if(keys.ArrowLeft)player.angle-=dt*1.7;
    if(keys.ArrowRight)player.angle+=dt*1.7;
    if(keys.ArrowUp)player.pitch=clamp(player.pitch+dt*.85,-.36,.36);
    if(keys.ArrowDown)player.pitch=clamp(player.pitch-dt*.85,-.36,.36);
    const forward=(keys.KeyW?1:0)-(keys.KeyS?1:0),strafe=(keys.KeyD?1:0)-(keys.KeyA?1:0),moving=!!(forward||strafe);
    const length=Math.max(1,hypot(forward,strafe)),speed=(keys.ShiftLeft||keys.ShiftRight?5.35:3.55)*(1+player.speedLevel*.09)*(mouse.aim?.68:1);
    const co=Math.cos(player.angle),si=Math.sin(player.angle);
    moveWithCollision(player,(forward*co-strafe*si)/length*speed*dt,(forward*si+strafe*co)/length*speed*dt,.26);
    if(moving)player.bob+=dt*(keys.ShiftLeft?14:10);else player.bob+=dt*1.0;
    if(player.jump>0||player.vz>0){player.jump+=player.vz*dt;player.vz-=14.0*dt;if(player.jump<=0){player.jump=0;player.vz=0;}}
  }
  function update(dt){
    elapsed+=dt;worldTime+=dt;
    if(mode==='playing'){
      spawnDelay=Math.max(0,spawnDelay-dt);player.fireCooldown=Math.max(0,player.fireCooldown-dt);
      if(player.reloading>0){player.reloading-=dt;if(player.reloading<=0){player.reloading=0;finishReload();}}
      updateMovement(dt);if(mouse.fire)shoot();updateEnemies(dt);updatePickups(dt);updateEquipment(dt);
      for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=230*dt;p.life-=dt;}
      particles=particles.filter(p=>p.life>0);
      for(const b of blasts)b.life-=dt;blasts=blasts.filter(b=>b.life>0);
      for(const t of worldTracers)t.life-=dt;worldTracers=worldTracers.filter(t=>t.life>0);
      flash=Math.max(0,flash-dt*2.3);shake=Math.max(0,shake-dt*5);gunKick=Math.max(0,gunKick-dt*3.1);shotsGlow=Math.max(0,shotsGlow-dt*13);
      hitTime=Math.max(0,hitTime-dt);if(hitTime===0){$('hitmarker').style.opacity='0';$('crosshair').classList.remove('active');}
      messageTime=Math.max(0,messageTime-dt);if(!messageTime)$('centerMessage').style.opacity='0';
      $('damageFlash').style.opacity=flash.toFixed(2);syncHud();
    }else{player.bob+=dt*.3;gunKick=Math.max(0,gunKick-dt*3);}
  }
  function hideOverlays(){for(const id of ['startScreen','pauseScreen','shopScreen','deathScreen'])$(id).classList.remove('visible');}
  function grabMouse(){
    if(pointerLockUnavailable)return;
    const fallback=()=>{pointerLockUnavailable=true;$('lockHint').textContent='MOVE CURSOR TO AIM · ARROW KEYS ALSO WORK';$('lockHint').classList.remove('hidden');setTimeout(()=>$('lockHint').classList.add('hidden'),2600);};
    try{const lock=canvas.requestPointerLock?.();if(lock?.catch)lock.catch(fallback);else if(!canvas.requestPointerLock)fallback();}catch(_){fallback();}
  }
  function releaseMouse(){if(document.pointerLockElement===canvas)document.exitPointerLock?.();mouse.fire=false;mouse.aim=false;}
  function startRun(){
    player=makePlayer();wave=0;worldTime=0;shake=0;flash=0;particles=[];blasts=[];sentries=[];grenades=[];
    $('damageFlash').style.opacity='0';spawnWave();grabMouse();
  }
  function onDeath(){
    if(mode==='dead')return;player.alive=false;mode='dead';releaseMouse();hideOverlays();$('deathScreen').classList.add('visible');
    $('finalWave').textContent=String(wave).padStart(2,'0');$('finalKills').textContent=String(player.kills).padStart(2,'0');$('finalScore').textContent=player.score.toLocaleString();
    const best=getBest(),isBest=wave>best.wave||(wave===best.wave&&player.score>best.score);
    if(isBest){saveBest({wave,score:player.score});$('bestMessage').textContent='NEW PERSONAL BEST // MISSION RECORD UPDATED';}
    else $('bestMessage').textContent=`Personal best: Wave ${String(best.wave).padStart(2,'0')} · ${best.score.toLocaleString()} points`;
    tone(190,.55,'sawtooth',.09,-165);updateBestDisplay();
  }
  function endWave(){
    const bonus=120+wave*55;player.credits+=bonus;player.score+=bonus*3;
    showMessage('SECTOR CLEARED',`WAVE ${wave} COMPLETE · +${bonus} CREDITS`,3);
    openShop(true);tone(720,.28,'sine',.065,140);
  }
  function pause(){if(mode!=='playing')return;mode='paused';releaseMouse();hideOverlays();$('pauseScreen').classList.add('visible');}
  function resume(){if(mode!=='paused')return;mode='playing';hideOverlays();grabMouse();}
  function openShop(isWaveBreak=false){
    if(mode!=='playing'&&!isWaveBreak)return;shopFromWave=isWaveBreak;mode='shop';releaseMouse();hideOverlays();$('shopScreen').classList.add('visible');
    $('shopWave').textContent=isWaveBreak?`WAVE ${String(wave).padStart(2,'0')} COMPLETE`:`WAVE ${String(wave).padStart(2,'0')} IN PROGRESS`;
    $('nextWaveLabel').textContent=isWaveBreak?'START NEXT WAVE':'RETURN TO BATTLE';
    $('shopSubtitle').textContent=isWaveBreak?`WAVE ${wave} CLEARED — REFIT FOR THE NEXT ASSAULT`:'YOUR BATTLE IS PAUSED WHILE YOU REQUIP';
    selectTab(selectedTab);syncHud();
  }
  function closeShop(){if(mode!=='shop')return;if(shopFromWave){spawnWave();}else{mode='playing';hideOverlays();}grabMouse();}
  function getBest(){try{return JSON.parse(localStorage.getItem('neonstrike-record')||'{"wave":0,"score":0}');}catch(_){return {wave:0,score:0};}}
  function saveBest(best){try{localStorage.setItem('neonstrike-record',JSON.stringify(best));}catch(_){/* Session still works without storage. */}}
  function updateBestDisplay(){const b=getBest();$('bestDisplay').innerHTML=`WAVE ${String(b.wave).padStart(2,'0')} <span>·</span> ${b.score.toLocaleString()} PTS`;}
  function itemData(tab){
    if(tab==='weapons')return weapons.map((w,i)=>({id:`weapon-${i}`,tag:w.tag,graphic:w.graphic,gun:true,name:w.name,desc:[
      'Reliable semi-auto. Accurate and dependable under pressure.',
      'Rapid fire for dealing with swarms up close.',
      'Balanced, hard-hitting rifle with impressive range.',
      'Massive point-blank damage across eight pellets.',
      'Devastating experimental weapon. Precision over speed.'
    ][i],cost:w.cost,owned:player.owned.has(i),equipped:player.weapon===i}));
    if(tab==='upgrades')return [
      {id:'damage',tag:'WEAPON SYSTEM',graphic:'◎',name:'AMPLIFIED ROUNDS',desc:'All weapons deal +18% damage per upgrade.',cost:230+player.damageLevel*170,level:player.damageLevel,max:5},
      {id:'fire',tag:'WEAPON SYSTEM',graphic:'↯',name:'OVERCLOCKED TRIGGER',desc:'Fire rate +12% per upgrade. Faster takedowns.',cost:260+player.fireLevel*180,level:player.fireLevel,max:4},
      {id:'speed',tag:'MOBILITY SYSTEM',graphic:'≫',name:'SERVO BOOTS',desc:'Move and sprint 9% faster per upgrade.',cost:200+player.speedLevel*150,level:player.speedLevel,max:4},
      {id:'armor',tag:'DEFENSE SYSTEM',graphic:'⬡',name:'NANO ARMOR',desc:'+25 maximum armor and +40 armor instantly.',cost:220+player.armorLevel*145,level:player.armorLevel,max:5},
      {id:'health',tag:'BIOMETRIC SYSTEM',graphic:'✚',name:'VITALITY CORE',desc:'+20 maximum health and heal 35 instantly.',cost:240+Math.floor((player.maxHealth-100)/20)*160,level:Math.floor((player.maxHealth-100)/20),max:4}
    ];
    return [
      {id:'grenade',tag:'EXPLOSIVES',graphic:'✹',name:'FRAG GRENADE ×2',desc:'Area blast that can take down several enemies. Press G.',cost:130},
      {id:'medkit',tag:'SURVIVAL',graphic:'✚',name:'FIELD MEDKIT ×2',desc:'Restore 55 health instantly. Press H.',cost:130},
      {id:'sentry',tag:'DEPLOYABLE',graphic:'⌖',name:'AUTO SENTRY ×1',desc:'Deploy a turret to fight with you for 27 seconds. Press T.',cost:310},
      {id:'ammo',tag:'SUPPLIES',graphic:'▥',name:'AMMO RESUPPLY',desc:'Restock 3 full magazines for every owned weapon.',cost:145},
      {id:'plating',tag:'SUPPLIES',graphic:'⬡',name:'ARMOR PLATES',desc:'Restore 65 armor immediately.',cost:115}
    ];
  }
  function selectTab(tab){selectedTab=tab;document.querySelectorAll('.shop-tabs .tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));renderShop();}
  function renderShop(){
    $('shopCredits').textContent=player.credits.toLocaleString();const items=itemData(selectedTab);
    $('shopItems').innerHTML=items.map(item=>{
      const maxed=item.level!=null&&item.level>=item.max,afford=item.cost<=player.credits;
      let label=item.equipped?'EQUIPPED':item.owned?'EQUIP':maxed?'MAXED':'PURCHASE';
      const disabled=item.equipped||maxed||(!afford&&!item.owned);const price=item.owned?'<small>UNLOCKED</small>':maxed?'<small>COMPLETE</small>':`${item.cost} <small>CR</small>`;
      return `<article class="item ${item.owned?'owned':''}"><div class="item-top"><span class="item-tag">${item.tag}</span><span class="item-level">${item.level!=null?`LVL ${item.level} / ${item.max}`:item.owned?'✓ OWNED':''}</span></div><div class="item-graphic ${item.gun?'gun':''}">${item.graphic}</div><h3>${item.name}</h3><p>${item.desc}</p><div class="item-bottom"><span class="item-price">${price}</span><button class="buy-btn" data-buy="${item.id}" ${disabled?'disabled':''}>${label}</button></div></article>`;
    }).join('');
  }
  function buyItem(id){
    const item=[...itemData('weapons'),...itemData('upgrades'),...itemData('equipment')].find(v=>v.id===id);
    if(!item)return;
    if(item.owned){switchWeapon(Number(id.split('-')[1]));renderShop();return;}
    if(item.cost>player.credits||(item.level!=null&&item.level>=item.max)){tone(110,.10,'triangle',.025,-40);return;}
    player.credits-=item.cost;
    if(id.startsWith('weapon-')){const i=Number(id.split('-')[1]);player.owned.add(i);player.mags[i]=weapons[i].mag;player.reserves[i]=weapons[i].reserve;player.weapon=i;player.reloading=0;}
    else if(id==='damage')player.damageLevel++;
    else if(id==='fire')player.fireLevel++;
    else if(id==='speed')player.speedLevel++;
    else if(id==='armor'){player.armorLevel++;player.maxArmor+=25;player.armor=Math.min(player.maxArmor,player.armor+40);}
    else if(id==='health'){player.maxHealth+=20;player.health=Math.min(player.maxHealth,player.health+35);}
    else if(id==='grenade')player.grenadeCount+=2;
    else if(id==='medkit')player.medkitCount+=2;
    else if(id==='sentry')player.sentryCount++;
    else if(id==='ammo')for(const i of player.owned)player.reserves[i]+=weapons[i].mag*3;
    else if(id==='plating')player.armor=Math.min(player.maxArmor,player.armor+65);
    tone(780,.12,'triangle',.05,340);renderShop();syncHud();
  }
  function drawRadar(){
    const n=radar.width,unit=n/SIZE;rctx.clearRect(0,0,n,n);rctx.fillStyle='#071622';rctx.fillRect(0,0,n,n);
    rctx.fillStyle='#234552';for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++)if(map[y][x])rctx.fillRect(x*unit,y*unit,unit+.3,unit+.3);
    rctx.strokeStyle='rgba(110,230,220,.12)';rctx.lineWidth=.5;for(let i=0;i<=SIZE;i+=5){rctx.beginPath();rctx.moveTo(i*unit,0);rctx.lineTo(i*unit,n);rctx.moveTo(0,i*unit);rctx.lineTo(n,i*unit);rctx.stroke();}
    rctx.strokeStyle='rgba(107,242,223,.10)';rctx.lineWidth=1;rctx.beginPath();rctx.arc(player.x*unit,player.y*unit,Math.min(n*.27,53),0,TAU);rctx.stroke();
    for(const e of enemies){rctx.fillStyle=enemyTypes[e.type].color;rctx.beginPath();rctx.arc(e.x*unit,e.y*unit,e.type==='brute'?3:2.2,0,TAU);rctx.fill();}
    for(const p of pickups){rctx.fillStyle='#fff68b';rctx.fillRect(p.x*unit-1.5,p.y*unit-1.5,3,3);}
    rctx.save();rctx.translate(player.x*unit,player.y*unit);rctx.rotate(player.angle);rctx.fillStyle='#8bffee';rctx.shadowColor='#6affde';rctx.shadowBlur=9;rctx.beginPath();rctx.moveTo(8,0);rctx.lineTo(-5,-4.5);rctx.lineTo(-3,0);rctx.lineTo(-5,4.5);rctx.closePath();rctx.fill();rctx.restore();
  }
  let lastHud=0;
  function syncHud(){
    if(worldTime-lastHud<.065&&mode==='playing')return;lastHud=worldTime;
    $('waveText').textContent=String(wave).padStart(2,'0');$('enemyText').textContent=String(enemies.length).padStart(2,'0');
    $('objective').textContent=mode==='shop'?'UPGRADE YOUR LOADOUT':'ELIMINATE HOSTILES';
    $('roundProgress').style.width=`${waveTotal?enemies.length/waveTotal*100:100}%`;
    $('creditText').textContent=String(Math.round(player.credits)).padStart(3,'0');$('scoreText').textContent=String(player.score).padStart(6,'0');
    $('healthValue').textContent=Math.ceil(player.health);$('armorValue').textContent=Math.ceil(player.armor);
    $('healthBar').style.width=`${player.health/player.maxHealth*100}%`;$('armorBar').style.width=`${player.armor/player.maxArmor*100}%`;
    const g=weapons[player.weapon];$('weaponName').textContent=g.name;$('weaponClass').textContent=g.class;
    $('ammoValue').textContent=player.mags[player.weapon];$('reserveValue').textContent=player.reserves[player.weapon];
    $('reloadText').textContent=player.reloading>0?`RELOADING ${player.reloading.toFixed(1)}S`:'R TO RELOAD';
    const notches=18,full=Math.round(player.mags[player.weapon]/g.mag*notches);$('ammoNotches').innerHTML=Array.from({length:notches},(_,i)=>`<i class="${i>=full?'off':''}"></i>`).join('');
    for(const [kind,id] of [['grenade','grenadeCount'],['medkit','medkitCount'],['sentry','sentryCount']]){
      const count=player[kind+'Count'];$(id).textContent=`${count} LEFT`;$(`${kind}Ability`).classList.toggle('empty',count<=0);
    }
    drawRadar();
  }
  $('startBtn').addEventListener('click',startRun);
  $('retryBtn').addEventListener('click',startRun);
  $('resumeBtn').addEventListener('click',resume);
  $('restartPauseBtn').addEventListener('click',startRun);
  $('nextWaveBtn').addEventListener('click',closeShop);
  document.querySelectorAll('.shop-tabs .tab').forEach(b=>b.addEventListener('click',()=>selectTab(b.dataset.tab)));
  $('shopItems').addEventListener('click',e=>{const btn=e.target.closest('[data-buy]');if(btn&&!btn.disabled)buyItem(btn.dataset.buy);});
  canvas.addEventListener('mousedown',e=>{if(mode==='playing'){if(!mouseLocked)grabMouse();if(e.button===0){mouse.fire=true;shoot();}if(e.button===2)mouse.aim=true;}});
  document.addEventListener('mouseup',e=>{if(e.button===0)mouse.fire=false;if(e.button===2)mouse.aim=false;});
  document.addEventListener('contextmenu',e=>e.preventDefault());
  document.addEventListener('mousemove',e=>{if(mode==='playing'&&(mouseLocked||e.target===canvas)){
    player.angle+=e.movementX*.00225*(mouse.aim?.62:1);
    player.pitch=clamp(player.pitch-e.movementY*.0021,-.36,.36);
  }});
  canvas.addEventListener('wheel',e=>{if(mode==='playing'){e.preventDefault();cycleWeapon(e.deltaY>0?1:-1);}}, {passive:false});
  document.addEventListener('pointerlockchange',()=>{mouseLocked=document.pointerLockElement===canvas;$('lockHint').classList.toggle('hidden',mouseLocked||mode!=='playing');if(!mouseLocked&&mode==='playing')pause();});
  document.addEventListener('keydown',e=>{
    if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys[e.code]=true;
    if(e.repeat&&['KeyB','KeyR','KeyG','KeyH','KeyT','Space','Escape'].includes(e.code))return;
    if(e.code==='Escape'){if(mode==='playing')pause();else if(mode==='shop'&&!shopFromWave)closeShop();return;}
    if(mode==='playing'){
      if(e.code==='Space'&&player.jump<=0&&player.vz===0){player.vz=5.8;player.jump=.01;tone(160,.07,'sine',.018,80);}
      if(e.code==='KeyR')reload();
      if(e.code==='KeyG')throwGrenade();
      if(e.code==='KeyH')useMedkit();
      if(e.code==='KeyT')deploySentry();
      if(e.code==='KeyB')openShop(false);
      if(e.code==='KeyQ')cycleWeapon(1);
      if(/^Digit[1-5]$/.test(e.code))switchWeapon(Number(e.code.slice(-1))-1);
    }else if(mode==='paused'&&e.code==='KeyB'){resume();openShop(false);}
  });
  document.addEventListener('keyup',e=>keys[e.code]=false);
  window.addEventListener('blur',()=>{for(const k of Object.keys(keys))keys[k]=false;mouse.fire=false;if(mode==='playing')pause();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing')pause();});
  updateBestDisplay();syncHud();
  function loop(t){const dt=Math.min(.09,(t-last)/1000||.016);last=t;update(dt);render();requestAnimationFrame(loop);}
  requestAnimationFrame(loop);
})();
