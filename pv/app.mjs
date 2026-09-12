import {geometry} from './geometry.mjs';
import {API_BASE} from './config.js';
const $=id=>document.getElementById(id), form=$('design'), field=n=>form.elements.namedItem(n);
const numNames=['width','depth','height','tilt','azimuth','setback','gap','row_gap','module_length','module_width','modules_per_string','inverter_count','soiling','dc_loss','ac_loss'];
const sizingFields=['design_tmin', 'design_tmax', 'beta_vmp_pct', 'module_system_max_v', 'inverter_dc_max_v', 'mppt_min_v', 'mppt_max_v', 'mppt_count', 'inputs_per_mppt', 'operating_current_mppt', 'short_circuit_current_mppt', 'inverter_dc_current_a', 'max_dc_power_kw', 'current_factor'];
const fmt=(v,n=1)=>new Intl.NumberFormat('id-ID',{maximumFractionDigits:n}).format(v);
let catalog=null, current=null, result=null, draw=null, busy=false, catalogBase=null;
let layoutVersion=0,layoutTimer=null,layoutReady=false,resolvedSizing=null;
function read(){const d=Object.fromEntries(new FormData(form));numNames.forEach(k=>d[k]=Number(d[k]));sizingFields.forEach(k=>d[k]=d[k]===''?null:Number(d[k]));return d;}
function status(message,error=false){$('status').textContent=message;$('status').classList.toggle('error',error);}
function invalidate(){result=null;$('result-content').hidden=true;$('empty').hidden=false;$('csv').disabled=true;}
function update(){
 invalidate();$('calculations-body').replaceChildren();$('calculation-state').textContent='Revisi input: menunggu perhitungan terbaru.';layoutReady=false;resolvedSizing=null;layoutVersion++;clearTimeout(layoutTimer);
 field('modules_per_string').readOnly=field('sizing_mode').value!=='manual';field('inverter_count').readOnly=field('sizing_mode').value==='maximize';
 const upload=field('weather').value==='upload';$('epw-label').hidden=!upload;$('epw-file').required=upload;$('epw-file').disabled=!upload;
 $('faces-label').hidden=field('roof').value!=='gable';
 $('row-gap-label').hidden=field('roof').value!=='flat';
 if(!catalog){$('run').disabled=true;return;}
 if(!form.checkValidity()){
  $('run').disabled=true;
  const invalid=Array.from(form.elements).find(el=>el.willValidate&&!el.validity.valid);
  const label=invalid?.labels?.[0]?.firstChild?.textContent?.trim()||invalid?.name||'Input';
  status(`${label}: ${invalid?.validationMessage||'Periksa nilai yang dimasukkan.'}`,true);
  return;
 }
 const d=read(),g=geometry(d),m=catalog.modules.find(x=>x.name===d.module),i=catalog.inverters.find(x=>x.name===d.inverter);
 $('faces-label').hidden=d.roof!=='gable';$('row-gap-label').hidden=d.roof!=='flat';
 const count=g.modules_per_face*g.face_ids.length,dc=m?count*m.power_w/1000:0,ac=i?d.inverter_count*i.power_w/1000:0;
 $('panel-count').textContent=fmt(count,0);$('dc-capacity').textContent=m?`${fmt(dc)} kWp`:'—';$('ac-capacity').textContent=i?`${fmt(ac)} kW`:'—';$('ratio').textContent=ac?fmt(dc/ac,2):'—';$('ac-equation').textContent=i?`${d.inverter_count} inverter total × ${fmt(i.power_w/1000,3)} kW = ${fmt(ac,3)} kW`:'Pilih inverter CEC.';
 $('layout-info').textContent=`${g.face_ids.length} bidang aktif · ${g.strings_per_face} string/bidang · ${g.capacity_per_face-g.modules_per_face} posisi tersisa/bidang agar string utuh. Panel biru: bidang pertama; hijau: bidang kedua.`;
 current=d;$('roof-positions').textContent=fmt(g.capacity_per_face*g.face_ids.length,0);if(draw&&count<=10000)draw(d,g);$('run').disabled=true;
 if(!m||!i)status('Pilih nama lengkap modul dan inverter dari katalog.',true);

 else if(!count)status('Atap tidak memuat satu string penuh. Ubah dimensi atau modul/string.',true);
 else status('Menghitung susunan panel dan batas listrik…');
 if(m&&i){const version=layoutVersion;layoutTimer=setTimeout(()=>refreshLayout(version),300);}
}
async function refreshLayout(version){
 try{
  const base=endpoint();if(catalogBase!==base)throw Error('Klik Periksa koneksi untuk menghitung susunan dari CSV backend.');
  const d=read();const r=await fetch(base+'/layout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d),signal:AbortSignal.timeout(30000)});
  const p=await r.json();if(version!==layoutVersion)return;if(r.status===404)throw Error('Backend masih versi lama. Perbarui pv-backend lalu restart Python.');
  if(!r.ok)throw Error(typeof p.detail==='string'?p.detail:'Perbarui backend dan periksa data desain.');
  if(!Array.isArray(p.calculations)||typeof p.inverter_count!=='number')throw Error('Perbarui backend ke versi 1.3.0 agar jumlah inverter total dan tabel perhitungan tersedia.');
  renderCalculations(p);
  if(!p.can_simulate){$('panel-count').textContent='—';$('dc-capacity').textContent='—';$('ac-capacity').textContent=fmt(p.ac_kw,3)+' kW';$('ratio').textContent='—';throw Error(p.errors.join(' '));}
  const resolved={...d,modules_per_string:p.modules_per_string,inverter_count:p.inverter_count};
  const g=geometry(resolved);g.modules_per_face=p.modules_per_face;g.strings_per_face=p.strings_per_face;
  current=resolved;layoutReady=true;resolvedSizing=p;
  const faces=g.face_ids.length,m=catalog.modules.find(x=>x.name===d.module),i=catalog.inverters.find(x=>x.name===d.inverter);
  const count=p.modules_per_face*faces,dc=count*m.power_w/1000,ac=p.ac_kw;
  $('panel-count').textContent=fmt(count,0);$('dc-capacity').textContent=fmt(dc)+' kWp';$('ac-capacity').textContent=fmt(ac)+' kW';$('ratio').textContent=fmt(dc/ac,2);
  $('layout-info').textContent=`${p.positions_per_face*faces} posisi atap · ${count} panel terpasang · ${p.unused_per_face*faces} posisi tersisa. ${p.modules_per_string} modul/string · ${p.strings_per_face} string/bidang · ${p.inverter_count} inverter TOTAL sistem. Pembatas: ${p.reason}.`;
  $('sizing-info').textContent=`Rentang string: ${p.string_min}–${p.string_max} modul. ${p.validation==='incomplete'?'Validasi listrik belum lengkap. Lihat tabel perhitungan di ruang desain.':'Pemeriksaan awal lulus untuk data yang dimasukkan.'} `+p.groups.map((x,i)=>`Kelompok ${i+1}: ${x.inverter_count} inverter × ${x.strings_per_inverter} string; `+x.mppt_allocation.map((e,j)=>`MPPT ${j+1}: bidang ${e.face_id+1}, ${e.strings} string`).join(' / ')).join('; ');

  if(draw&&count<=10000){$('three-status').hidden=true;draw(resolved,g);}else if(count>10000){$('three-status').hidden=false;$('three-status').textContent='Desain >10.000 panel: tampilan 3D tidak diperbarui. Jumlah numerik dan simulasi tetap tersedia.';}
  $('run').disabled=busy;status(p.validation==='incomplete'?'Desain siap untuk simulasi energi awal. Validasi listrik belum lengkap.':'Susunan siap. Jalankan simulasi PySAM.');
 }catch(e){if(version===layoutVersion){layoutReady=false;$('run').disabled=true;$('sizing-info').textContent=e.message;status(e.message,true);}}
}
function renderCalculations(p){
 $('ac-equation').textContent=p.calculations.find(r=>r.label==='Kapasitas AC total')?.formula+` = ${fmt(p.ac_kw,3)} kW`;
 $('calculation-state').textContent=p.validation==='invalid'?'Konfigurasi belum valid. Periksa batas dan pesan di bawah.':p.validation==='incomplete'?'Validasi listrik belum lengkap. Nilai STC dan asumsi tetap ditampilkan; arus desain bukan arus operasi aktual per jam.':'Pemeriksaan awal berdasarkan data desain. Arus operasi aktual berubah mengikuti cuaca; tabel ini menunjukkan STC dan batas desain.';
 const body=$('calculations-body');body.replaceChildren();
 const labels={pass:'Lulus awal',fail:'Melebihi batas',incomplete:'Belum lengkap',info:'Informasi'};
 for(const r of p.calculations){
  const tr=document.createElement('tr');tr.dataset.status=r.status;
  const values=[r.label,r.formula,r.value==null?'Belum tersedia':`${fmt(r.value,3)} ${r.unit}`,r.limit==null?'—':`${r.comparison} ${fmt(r.limit,3)} ${r.unit}`,r.margin==null?'—':`${fmt(r.margin,3)} ${r.unit}`,r.source,labels[r.status]||r.status];
  for(const value of values){const td=document.createElement('td');td.textContent=value;tr.append(td);}body.append(tr);
 }
}
function options(kind,text){const list=$(kind);list.replaceChildren();catalog[kind].filter(x=>x.name.toLowerCase().includes(text.toLowerCase())).slice(0,60).forEach(x=>{const o=document.createElement('option');o.value=x.name;o.label=`${fmt(x.power_w,0)} W · ${x.name}`;list.append(o);});}
form.addEventListener('input',e=>{if(catalog&&['module','inverter'].includes(e.target.name))options(e.target.name==='module'?'modules':'inverters',e.target.value);update();});
field('module').addEventListener('change',()=>{const m=catalog?.modules.find(x=>x.name===field('module').value);if(m?.length>0&&m?.width>0){field('module_length').value=m.length;field('module_width').value=m.width;$('dimensions-note').textContent='Dimensi dari katalog CEC; cocokkan dengan datasheet.';}else{$('dimensions-note').textContent='Katalog tidak menyediakan dimensi model ini. Isi panjang/lebar dari datasheet; nilai sekarang tetap asumsi pengguna.';}update();});
field('inverter').addEventListener('change',()=>{for(const k of ['inverter_dc_max_v','mppt_min_v','mppt_max_v','mppt_count','inputs_per_mppt','operating_current_mppt','short_circuit_current_mppt','inverter_dc_current_a','max_dc_power_kw'])field(k).value='';update();});
field('module').addEventListener('change',()=>{field('beta_vmp_pct').value='';field('module_system_max_v').value='';update();});
try{$('api').value=API_BASE||localStorage.getItem('rooftop-api')||'';}catch{$('api').value=API_BASE;}
function endpoint(){const value=$('api').value.trim().replace(/\/+$/,'');const u=new URL(value);if(u.protocol!=='https:'&&!(u.protocol==='http:'&&['localhost','127.0.0.1'].includes(u.hostname)))throw Error('Gunakan URL HTTPS untuk backend.');if(u.pathname!=='/'||u.search||u.hash||u.username||u.password)throw Error('Isi URL utama backend saja, tanpa /health, /simulate, atau parameter tambahan.');return value;}
let connectionAttempt=0;
async function connect(){
 const attempt=++connectionAttempt;
 try{
  const base=endpoint();catalogBase=null;$('connection-state').textContent='Menghubungkan dan membaca CSV CEC…';
  const r=await fetch(base+'/health',{signal:AbortSignal.timeout(120000)});
  if(!r.ok)throw Error('Backend belum siap.');const data=await r.json();
  if(data.status!=='ok')throw Error('Respons backend tidak dikenali.');
  const response=await fetch(base+'/catalog',{cache:'no-store',signal:AbortSignal.timeout(120000)});
  if(!response.ok)throw Error('Backend terhubung tetapi katalog tidak tersedia. Pasang pembaruan pv-backend lalu restart Python.');
  const next=await response.json();if(!next.modules?.length||!next.inverters?.length)throw Error('CSV CEC kosong atau tidak valid.');
  if(attempt!==connectionAttempt||base!==endpoint())return;
  catalog=next;catalogBase=base;
  options('modules',field('module').value);options('inverters',field('inverter').value);
  $('catalog-state').textContent=`CSV backend: ${fmt(catalog.modules.length,0)} modul · ${fmt(catalog.inverters.length,0)} inverter. Ketik merek/model untuk mencari.`;
  try{localStorage.setItem('rooftop-api',base);}catch{}
  update();$('connection-state').textContent='Terhubung ke '+data.engine+' · katalog CSV siap.';
 }catch(e){if(attempt===connectionAttempt){catalogBase=null;$('connection-state').textContent=e.message;}}
}
$('connect').onclick=connect;
$('api').addEventListener('input',()=>{connectionAttempt++;catalogBase=null;layoutReady=false;resolvedSizing=null;layoutVersion++;$('calculations-body').replaceChildren();$('calculation-state').textContent='Alamat backend berubah. Periksa koneksi kembali.';$('run').disabled=true;invalidate();$('connection-state').textContent='Alamat berubah. Klik Periksa koneksi untuk memuat katalog backend ini.';});
$('epw-file').addEventListener('change',()=>{
 const file=$('epw-file').files[0];
 $('epw-file').setCustomValidity(file&&(!file.name.toLowerCase().endsWith('.epw')||file.size>10*1024*1024)?'Pilih file .epw berukuran maksimum 10 MB.':'');update();
});
form.addEventListener('submit',async e=>{
 e.preventDefault();if(!form.reportValidity()||busy||!layoutReady)return;let base;try{base=endpoint();}catch{document.querySelector('.connection').open=true;$('api').focus();status('Isi alamat backend pada Koneksi simulator terlebih dahulu.',true);return;}
 const design=read(),weatherFile=$('epw-file').files[0];busy=true;$('run').disabled=true;invalidate();status('Menjalankan PySAM… jika backend sedang tidur, proses awal dapat memerlukan sekitar satu menit.');
 try{
  if(catalogBase!==base){await connect();if(catalogBase!==base)throw Error($('connection-state').textContent);}
  let url=base+'/simulate',body=JSON.stringify(design),headers={'Content-Type':'application/json'};
  if(design.weather==='upload'){
   if(!weatherFile)throw Error('Pilih file EPW terlebih dahulu.');
   body=new FormData();body.append('design',JSON.stringify(design));body.append('weather_file',weatherFile);headers={};url=base+'/simulate/epw';
  }
  const r=await fetch(url,{method:'POST',headers,body,signal:AbortSignal.timeout(180000)});
  const data=await r.json();if(!r.ok)throw Error(typeof data.detail==='string'?data.detail:'Parameter tidak valid. Periksa input desain.');
  if(JSON.stringify(design)!==JSON.stringify(read())||weatherFile!==$('epw-file').files[0]||base!==endpoint()){status('Desain berubah selama simulasi. Jalankan kembali untuk desain terbaru.');return;}
  renderCalculations(data.sizing);result=data;$('empty').hidden=true;$('result-content').hidden=false;$('csv').disabled=false;
  $('annual').textContent=fmt(data.annual_kwh/1000,2)+' MWh';$('yield').textContent=fmt(data.specific_yield,0)+' kWh/kWp';$('cf').textContent=fmt(data.capacity_factor_dc,1)+'%';
  const names=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];const max=Math.max(...data.monthly_kwh,1);$('monthly').replaceChildren();
  data.monthly_kwh.forEach((v,i)=>{const el=document.createElement('div');el.className='month';const b=document.createElement('b');b.textContent=fmt(v,0);const bar=document.createElement('div');bar.className='bar';bar.style.setProperty('--bar',`${Math.max(2,v/max*150)}px`);const label=document.createElement('span');label.textContent=names[i];el.append(b,bar,label);el.title=`${names[i]}: ${fmt(v)} kWh`;$('monthly').append(el);});
  $('weather-info').textContent=`File: ${data.weather_source||design.weather} · Cuaca: ${data.weather_location.join(', ')} · 8.760 interval × 1 jam · ${data.engine}`;
  $('warnings').replaceChildren();data.warnings.forEach(w=>{const li=document.createElement('li');li.textContent=w;$('warnings').append(li);});
  status('Simulasi selesai. Hasil sesuai dengan desain yang tampil.');
 }catch(e){status(e.name==='TimeoutError'?'Waktu tunggu habis. Periksa koneksi dan coba kembali.':e.message==='Failed to fetch'?'Backend tidak dapat dihubungi. Periksa URL backend, status layanan, dan pengaturan CORS.':e.message,true);}
 finally{busy=false;$('run').disabled=!layoutReady||!form.checkValidity();}
});
function download(name,text,type){const u=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
$('save').onclick=()=>{if(!form.reportValidity())return;download('rooftop-design.json',JSON.stringify({inputs:read(),resolved_sizing:resolvedSizing},null,2),'application/json');};
$('csv').onclick=()=>{if(result)download('pysam-hourly.csv','interval,timestep_hours,pv_power_kw\n'+result.hourly_kw.map((v,i)=>`${i+1},1,${v}`).join('\n'),'text/csv');};
try{const r=await fetch('./catalog.json');if(!r.ok)throw Error();catalog=await r.json();$('catalog-state').textContent='Katalog pratinjau. Klik Periksa koneksi untuk membaca CSV backend terbaru.';field('module').value='LONGi Green Energy Technology Co Ltd LR5-72HPH-550M';field('inverter').value='Fronius International GmbH: Fronius Primo 100-1 208-240 {240V}';options('modules','LONGi');options('inverters','Fronius');update();}catch{status('Katalog bawaan gagal dimuat. Hubungkan backend untuk membaca CSV CEC.',true);}
if($('api').value.trim())void connect();
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
