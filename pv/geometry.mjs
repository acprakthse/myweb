export function geometry(d){
 const angle=d.tilt*Math.PI/180;
 const [w,l]=d.orientation==='portrait'?[d.module_width,d.module_length]:[d.module_length,d.module_width];
 const span=d.depth/(d.roof==='gable'?2:1);
 const length=d.roof==='flat'?span:span/Math.cos(angle);
 const footprint=d.roof==='flat'?l*Math.cos(angle):l;
 const gap=d.roof==='flat'?d.row_gap:d.gap;
 const cols=Math.max(0,Math.floor((d.width-2*d.setback+d.gap)/(w+d.gap)+1e-9));
 const rows=Math.max(0,Math.floor((length-2*d.setback+gap)/(footprint+gap)+1e-9));
 const capacity=cols*rows,count=Math.floor(capacity/d.modules_per_string)*d.modules_per_string;
 const ids=d.roof==='gable'&&d.faces==='both'?[0,1]:[d.roof==='gable'&&d.faces==='second'?1:0];
 return {cols,rows,capacity_per_face:capacity,modules_per_face:count,strings_per_face:count/d.modules_per_string,face_ids:ids,w,l,span,length,footprint,gap,angle};
}
