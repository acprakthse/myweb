import {geometry} from './geometry.mjs';
import {API_BASE} from './config.js';
const $=id=>document.getElementById(id), form=$('design'), field=n=>form.elements.namedItem(n);
const numNames=['width','depth','height','tilt','azimuth','setback','gap','row_gap','module_length','module_width','modules_per_string','inverters_per_face','soiling','dc_loss','ac_loss'];
const fmt=(v,n=1)=>new Intl.NumberFormat('id-ID',{maximumFractionDigits:n}).format(v);
let catalog=null, current=null, result=null, draw=null, busy=false;
function read(){const d=Object.fromEntries(new FormData(form));numNames.forEach(k=>d[k]=Number(d[k]));return d;}
function status(message,error=false){$('status').textContent=message;$('status').classList.toggle('error',error);}
function invalidate(){result=null;$('result-content').hidden=true;$('empty').hidden=false;$('csv').disabled=true;}
function update(){
 invalidate();if(!form.checkValidity()||!catalog){$('run').disabled=true;return;}
 const d=read(),g=geometry(d),m=catalog.modules.find(x=>x.name===d.module),i=catalog.inverters.find(x=>x.name===d.inverter);
 $('faces-label').hidden=d.roof!=='gable';$('row-gap-label').hidden=d.roof!=='flat';
 const count=g.modules_per_face*g.face_ids.length,dc=m?count*m.power_w/1000:0,ac=i?d.inverters_per_face*g.face_ids.length*i.power_w/1000:0;
 $('panel-count').textContent=fmt(count,0);$('dc-capacity').textContent=m?`${fmt(dc)} kWp`:'—';$('ac-capacity').textContent=i?`${fmt(ac)} kW`:'—';$('ratio').textContent=ac?fmt(dc/ac,2):'—';
 $('layout-info').textContent=`${g.face_ids.length} bidang aktif · ${g.strings_per_face} string/bidang · ${g.capacity_per_face-g.modules_per_face} posisi tersisa/bidang agar string utuh. Panel biru: bidang pertama; hijau: bidang kedua.`;
 current=d;if(draw&&count<=3000)draw(d,g);$('run').disabled=busy||!m||!i||!count||count>3000;
 if(!m||!i)status('Pilih nama lengkap modul dan inverter dari katalog.',true);
 else if(count>3000)status('Batasi desain hingga 3.000 modul untuk versi ini.',true);
 else if(!count)status('Atap tidak memuat satu string penuh. Ubah dimensi atau modul/string.',true);
 else status('Desain diperbarui. Jalankan simulasi untuk menghitung produksi. Bayangan belum diperhitungkan.');
}
function options(kind,text){const list=$(kind);list.replaceChildren();catalog[kind].filter(x=>x.name.toLowerCase().includes(text.toLowerCase())).slice(0,60).forEach(x=>{const o=document.createElement('option');o.value=x.name;list.append(o);});}
form.addEventListener('input',e=>{if(catalog&&['module','inverter'].includes(e.target.name))options(e.target.name==='module'?'modules':'inverters',e.target.value);update();});
field('module').addEventListener('change',()=>{const m=catalog?.modules.find(x=>x.name===field('module').value);if(m?.length>0&&m?.width>0){field('module_length').value=m.length;field('module_width').value=m.width;$('dimensions-note').textContent='Dimensi dari katalog CEC; cocokkan dengan datasheet.';}else{$('dimensions-note').textContent='Katalog tidak menyediakan dimensi model ini. Isi panjang/lebar dari datasheet; nilai sekarang tetap asumsi pengguna.';}update();});
try{$('api').value=API_BASE||localStorage.getItem('rooftop-api')||'';}catch{$('api').value=API_BASE;}
function endpoint(){const value=$('api').value.trim().replace(/\/+$/,'');const u=new URL(value);if(u.protocol!=='https:'&&!(u.protocol==='http:'&&['localhost','127.0.0.1'].includes(u.hostname)))throw Error('Gunakan URL HTTPS untuk backend.');return value;}
$('connect').onclick=async()=>{try{const base=endpoint();$('connection-state').textContent='Menghubungkan… Render mungkin perlu bangun sekitar satu menit.';const r=await fetch(base+'/health',{signal:AbortSignal.timeout(120000)});if(!r.ok)throw Error('Backend belum siap.');const data=await r.json();if(data.status!=='ok')throw Error('Respons backend tidak dikenali.');try{localStorage.setItem('rooftop-api',base);}catch{}$('connection-state').textContent='Terhubung ke '+data.engine;}catch(e){$('connection-state').textContent=e.message;}};
form.addEventListener('submit',async e=>{
 e.preventDefault();if(!form.reportValidity()||busy)return;let base;try{base=endpoint();}catch{document.querySelector('.connection').open=true;$('api').focus();status('Isi alamat backend Render pada Koneksi simulator terlebih dahulu.',true);return;}
 const design=read();busy=true;$('run').disabled=true;invalidate();status('Menjalankan PySAM… jika backend sedang tidur, proses awal dapat memerlukan sekitar satu menit.');
 try{
  const r=await fetch(base+'/simulate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(design),signal:AbortSignal.timeout(180000)});
  const data=await r.json();if(!r.ok)throw Error(typeof data.detail==='string'?data.detail:'Parameter tidak valid. Periksa input desain.');
  if(JSON.stringify(design)!==JSON.stringify(read())){status('Desain berubah selama simulasi. Jalankan kembali untuk desain terbaru.');return;}
  result=data;$('empty').hidden=true;$('result-content').hidden=false;$('csv').disabled=false;
  $('annual').textContent=fmt(data.annual_kwh/1000,2)+' MWh';$('yield').textContent=fmt(data.specific_yield,0)+' kWh/kWp';$('cf').textContent=fmt(data.capacity_factor_dc,1)+'%';
  const names=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];const max=Math.max(...data.monthly_kwh,1);$('monthly').replaceChildren();
  data.monthly_kwh.forEach((v,i)=>{const el=document.createElement('div');el.className='month';const b=document.createElement('b');b.textContent=fmt(v,0);const bar=document.createElement('div');bar.className='bar';bar.style.setProperty('--bar',`${Math.max(2,v/max*150)}px`);const label=document.createElement('span');label.textContent=names[i];el.append(b,bar,label);el.title=`${names[i]}: ${fmt(v)} kWh`;$('monthly').append(el);});
  $('weather-info').textContent=`Cuaca: ${data.weather_location.join(', ')} · 8.760 interval × 1 jam · ${data.engine}`;
  $('warnings').replaceChildren();data.warnings.forEach(w=>{const li=document.createElement('li');li.textContent=w;$('warnings').append(li);});
  status('Simulasi selesai. Hasil sesuai dengan desain yang tampil.');
 }catch(e){status(e.name==='TimeoutError'?'Waktu tunggu habis. Periksa koneksi dan coba kembali.':e.message==='Failed to fetch'?'Backend tidak dapat dihubungi. Periksa URL Render, status layanan, dan pengaturan CORS.':e.message,true);}
 finally{busy=false;$('run').disabled=!current||!form.checkValidity();}
});
function download(name,text,type){const u=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
$('save').onclick=()=>{if(!form.reportValidity())return;download('rooftop-design.json',JSON.stringify(read(),null,2),'application/json');};
$('csv').onclick=()=>{if(result)download('pysam-hourly.csv','interval,timestep_hours,pv_power_kw\n'+result.hourly_kw.map((v,i)=>`${i+1},1,${v}`).join('\n'),'text/csv');};
try{const r=await fetch('./catalog.json');if(!r.ok)throw Error();catalog=await r.json();field('module').value='LONGi Green Energy Technology Co Ltd LR5-72HPH-550M';field('inverter').value='Fronius International GmbH: Fronius Primo 100-1 208-240 {240V}';options('modules','LONGi');options('inverters','Fronius');update();}catch{status('Katalog peralatan gagal dimuat. Muat ulang halaman melalui server web.',true);}
try{
 const THREE=await import('three'),{OrbitControls}=await import('three/addons/controls/OrbitControls.js');
 const host=$('viewer'),scene=new THREE.Scene();scene.background=new THREE.Color('#eaf0eb');
 const camera=new THREE.PerspectiveCamera(42,1,.1,1000),renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));host.append(renderer.domElement);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxPolarAngle=Math.PI*.49;
 scene.add(new THREE.HemisphereLight(0xffffff,0x788a7a,2.4));const sun=new THREE.DirectionalLight(0xffffff,3);sun.position.set(20,35,15);scene.add(sun);
 const grid=new THREE.GridHelper(200,100,0xa9bdad,0xd1ddd3);scene.add(grid);
 let model=new THREE.Group();scene.add(model);
 function box(w,h,l,color){return new THREE.Mesh(new THREE.BoxGeometry(w,h,l),new THREE.MeshStandardMaterial({color,roughness:.72,metalness:.1}));}
 function reset(){const d=current||{width:16,depth:12,height:5};const size=Math.max(d.width,d.depth,d.height)*1.55;camera.position.set(size,size*.8,size);controls.target.set(0,d.height*.65,0);controls.update();}
 $('reset-view').onclick=reset;
 draw=(d,g)=>{
  model.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of [o.material].flat())m.dispose();});scene.remove(model);model=new THREE.Group();scene.add(model);model.rotation.y=(180-d.azimuth)*Math.PI/180;
  const body=box(d.width,d.height,d.depth,0xc2cabc);body.position.y=d.height/2;model.add(body);
  const faceCount=d.roof==='gable'?2:1;
  for(let face=0;face<faceCount;face++){
   const sign=face===0?1:-1,roofTilt=d.roof==='flat'?0:g.angle;
   const roof=box(d.width+.08,.12,g.length,0xe2e3d4);roof.rotation.x=sign*roofTilt;
   roof.position.set(0,d.height+(d.roof==='flat'?0:g.span*Math.tan(g.angle)/2),d.roof==='gable'?sign*g.span/2:0);model.add(roof);
   // End-wall wedges close the pitched roof volume at both building ends.
   if(d.roof!=='flat'){
    for(const side of [-1,1]){
     const x=side*d.width/2,z0=d.roof==='gable'?0:-d.depth/2,z1=d.roof==='gable'?sign*g.span:d.depth/2;
     const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([x,d.height,z0,x,d.height+g.span*Math.tan(g.angle),z0,x,d.height,z1],3));geo.computeVertexNormals();model.add(new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0xc2cabc,side:THREE.DoubleSide})));
    }
   }
   if(!g.face_ids.includes(face))continue;
   const local=new THREE.Group();local.position.copy(roof.position);local.rotation.x=sign*roofTilt;model.add(local);
   const geom=new THREE.BoxGeometry(g.w,.045,g.l),mat=new THREE.MeshStandardMaterial({color:face===0?0x204b70:0x2a6c60,metalness:.35,roughness:.36});
   const panels=new THREE.InstancedMesh(geom,mat,g.modules_per_face),dummy=new THREE.Object3D();
   for(let n=0;n<g.modules_per_face;n++){
    const col=n%g.cols,row=Math.floor(n/g.cols);
    const x=-d.width/2+d.setback+g.w/2+col*(g.w+d.gap);
    const z=-g.length/2+d.setback+g.footprint/2+row*(g.footprint+g.gap);
    dummy.position.set(x,d.roof==='flat'?.14+g.l*Math.sin(g.angle)/2:.12,z);dummy.rotation.set(d.roof==='flat'?g.angle:0,0,0);dummy.updateMatrix();panels.setMatrixAt(n,dummy.matrix);
   }
   local.add(panels);
  }
 };
 new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);}).observe(host);
 $('three-status').hidden=true;if(current)draw(current,geometry(current));reset();renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera);});
}catch(e){$('three-status').textContent='Tampilan 3D tidak tersedia. Pastikan WebGL aktif dan CDN Three.js dapat diakses. Konfigurasi numerik tetap dapat digunakan.';}
