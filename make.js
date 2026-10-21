(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const KEY = 'uzuki-bracelet-v1';
  const materials = window.UZUKI_BEADS.flatMap(m => m.image
    ? [6, 8, 10].map(size => ({ ...m, baseId:m.id, size, id:size===8?m.id:`${m.id}-${size}` }))
    : [{ ...m, baseId:m.id }]);
  const imageCache = new Map();
  function loadImage(src) {
    if (!imageCache.has(src)) imageCache.set(src, new Promise(resolve => {
      const img = new Image(); img.onload = () => resolve(img); img.onerror = () => resolve(null); img.src = src;
    }));
    return imageCache.get(src);
  }
  const byId = Object.fromEntries(materials.map(m => [m.id,m]));
  const patterns = {
    rose: { name:'Rose garden', pattern:['rose','rose','moonstone','jade','rose','moonstone'] },
    forest: { name:'Forest walk', pattern:['jade','jade','clear','prehnite','jade','moonstone'] },
    moon: { name:'Moonlight', pattern:['amethyst','aqua','clear','moonstone','amethyst','clear'] },
  };
  const makeTemplate = key => key === 'blank' ? { name:'My little ritual', wrist:15, beads:[] } : { name:patterns[key].name, wrist:15, beads:Array.from({length:24},(_,i)=>patterns[key].pattern[i%6]) };
  let state = makeTemplate('rose'), selected = -1, category = 'all', family = 'all', beadSize = 8, savedJSON = '', undo = [], redo = [];
  const snapshot = () => JSON.stringify(state);
  const dragEditor = window.createBeadDrag({
    stage:document.querySelector('.bracelet-stage'), getBeads:()=>state.beads,
    geometry, swatch, material:id=>byId[id],
    commit:(beads)=>change(()=>{state.beads=beads;selected=-1;}),
    announce:text=>{$('drag-status').textContent=text;}
  });
  function valid(value) {
    return value && typeof value.name === 'string' && value.name.length <= 48 && typeof value.wrist === 'number' && value.wrist >= 12 && value.wrist <= 22 && Array.isArray(value.beads) && value.beads.length <= 60 && value.beads.every(id => Object.hasOwn(byId,id));
  }
  let initialMessage = '';
  try { const raw = localStorage.getItem(KEY); if(raw) { const restored = JSON.parse(raw); if(valid(restored)) { state=restored; savedJSON=snapshot(); initialMessage='Your saved design is back. Make yourself at home.'; } else initialMessage='Your saved design could not be read. Start a fresh one here.'; } }
  catch { initialMessage='Browser storage is unavailable or unreadable. You can still download a design card.'; }
  function message(text) { $('save-status').textContent=text; }
  function dirty() { message(snapshot() === savedJSON ? 'Saved in this browser.' : 'Unsaved changes · save your design to keep it.'); }
  function canEditBeads(before, after, wrist) {
    if(after.length>60)return false;
    const length=beads=>beads.reduce((sum,id)=>sum+byId[id].size,0);
    // Existing oversized drafts can always be reduced or rearranged.
    if(after.length<=before.length && length(after)<=length(before))return true;
    return (geometry(after).inner ?? 0)<=wrist+2;
  }
  function change(fn) {
    const before=snapshot(), oldSelection=selected;
    fn();
    if(!canEditBeads(JSON.parse(before).beads,state.beads,state.wrist)) {
      state=JSON.parse(before);selected=oldSelection;
      const warning=`Size limit reached · maximum ${(state.wrist+2).toFixed(1)} cm inside for a ${state.wrist.toFixed(1)} cm wrist. Remove a bead or choose a smaller size.`;
      message(warning);$('drag-status').textContent=warning;
      return false;
    }
    undo.push(before);if(undo.length>80)undo.shift();redo=[];render();dirty();return true;
  }
  function swatch(material) {
    const el=document.createElement('span'); el.className='bead-swatch'; el.style.setProperty('--bead-color',material.color); el.dataset.texture=material.texture; el.setAttribute('aria-hidden','true');
    if (material.image) {
      el.classList.add('sample-swatch');
      const img = document.createElement('img'), [x,y,w,h] = material.crop;
      img.src=material.image; img.alt=''; img.draggable=false;
      Object.assign(img.style,{width:`${100/w}%`,height:`${100/h}%`,left:`${-100*x/w}%`,top:`${-100*y/h}%`});
      img.addEventListener('error',()=>{img.remove();el.classList.remove('sample-swatch');},{once:true});
      el.append(img);
    }
    return el;
  }
  // Fit tangent beads around a circle; inner circumference subtracts bead radius.
  function geometry(beads) {
    const sizes=beads.map(id=>byId[id].size);
    if(sizes.length<3) return {radius:30,displayRadius:30,angles:sizes.map((_,i)=>i*Math.PI),inner:null};
    const chords=sizes.map((d,i)=>(d+sizes[(i+1)%sizes.length])/2);
    let low=Math.max(...chords)/2, high=sizes.reduce((a,b)=>a+b,0);
    for(let i=0;i<70;i++) { const r=(low+high)/2; const total=chords.reduce((sum,c)=>sum+2*Math.asin(Math.min(1,c/(2*r))),0); if(total>2*Math.PI) low=r; else high=r; }
    const radius=(low+high)/2, angles=[0];
    for(let i=1;i<sizes.length;i++) angles.push(angles[i-1]+2*Math.asin(Math.min(1,chords[i-1]/(2*radius))));
    return {radius,displayRadius:Math.max(30,radius),angles,inner:Math.max(0,2*Math.PI*(radius-Math.max(...sizes)/2)/10)};
  }
  function counts(beads = state.beads) { return materials.map(m=>({...m,count:beads.filter(id=>id===m.id).length})).filter(m=>m.count); }
  function renderMaterials() {
    $('material-grid').replaceChildren();
    const visible = materials.filter(m=>(category==='all'||m.category===category) && (family==='all'||m.family===family) && m.size===beadSize);
    $('material-results').textContent=`${visible.length} choices · ${beadSize} mm sample size`;
    if(!visible.length) { const empty=document.createElement('p');empty.className='empty-materials';empty.textContent='No matches. Try All colors or another category.';$('material-grid').append(empty); }
    visible.forEach(m=>{
      const card=document.createElement('div');card.className='material-item';
      const button=document.createElement('button'); button.className='material-card'; button.setAttribute('aria-label',`${selected<0?'Add':'Replace selected bead with'} ${m.name}, ${m.size} mm`);
      const name=document.createElement('span'); name.textContent=m.name;
      const size=document.createElement('small'); size.textContent=`${m.size} mm`;
      button.append(swatch(m),name,size);
      dragEditor.bind(button,m.id);
      button.addEventListener('click',()=>{
        if(selected<0 && state.beads.length>=60) { message('The tray holds up to 60 beads. Remove a bead before adding another.'); return; }
        change(()=>{ if(selected<0) state.beads.push(m.id); else state.beads[selected]=m.id; });
      });
      const info=document.createElement('button');info.className='material-info';info.textContent='i';info.setAttribute('aria-label',`About ${m.name}`);info.setAttribute('aria-haspopup','dialog');info.addEventListener('click',()=>showInfo(m));
      card.append(button,info);$('material-grid').append(card);
    });
    $('material-help').textContent=selected<0?'Drag a bead onto the bracelet, or tap to add. On touch, drag from the bead image.':'Tap a material to replace the selected bead.';
  }
  function showInfo(m) {
    $('info-title').textContent=m.name;
    $('info-subtitle').textContent=`${m.nameZh ? m.nameZh+' · ' : ''}${m.size} mm · ${m.image?'Sample image':'Illustrated accent'}`;
    $('info-image').replaceChildren(swatch(m));
    $('info-description').textContent=m.description;
    $('info-intention').textContent=m.intention;
    $('info-pairing').textContent=m.pairing;
    $('info-source-link').hidden=!m.image;
    if(m.image) $('info-source-link').href=m.image;
    $('bead-info').showModal();
  }
  $('close-info').addEventListener('click',()=>$('bead-info').close());
  $('bead-info').addEventListener('click',event=>{if(event.target===$('bead-info')) { const r=$('bead-info').getBoundingClientRect(); if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)$('bead-info').close(); }});
  $('color-filter').addEventListener('change',event=>{family=event.target.value;renderMaterials();});
  $('size-filter').addEventListener('change',event=>{beadSize=Number(event.target.value);renderMaterials();});
  function render() {
    if(selected>=state.beads.length) selected=-1;
    $('design-name').value=state.name; $('wrist').value=state.wrist; $('wrist-value').value=`${state.wrist.toFixed(1)} cm`;
    const g=geometry(state.beads); $('bracelet').replaceChildren();
    state.beads.forEach((id,i)=>{
      const m=byId[id], angle=g.angles[i]-Math.PI/2;
      const bead=document.createElement('button'); bead.className='placed-bead'; bead.style.left=`${50+34*Math.cos(angle)}%`; bead.style.top=`${50+34*Math.sin(angle)}%`;
      const size=Math.min(21,34*m.size/g.displayRadius); bead.style.width=`${size}%`; bead.style.height=`${size}%`;
      bead.setAttribute('aria-label',`Bead ${i+1}: ${m.name}, ${m.size} mm`); bead.setAttribute('aria-pressed',String(i===selected)); bead.append(swatch(m));
      bead.dataset.beadIndex=i; dragEditor.bind(bead,id,i);
      bead.addEventListener('keydown',event=>{
        if(!['ArrowLeft','ArrowRight','Delete','Backspace','Escape'].includes(event.key))return;
        event.preventDefault();selected=i;
        if(event.key==='ArrowLeft'||event.key==='ArrowRight')move(event.key==='ArrowLeft'?-1:1);
        else if(event.key==='Escape'){selected=-1;render();}
        else change(()=>{state.beads.splice(i,1);selected=-1;});
        $('bracelet').children[Math.max(0,selected<0?Math.min(i,state.beads.length-1):selected)]?.focus();
      });
      bead.addEventListener('click',()=>{selected=selected===i?-1:i; render(); $('bracelet').children[i]?.focus();}); $('bracelet').append(bead);
    });
    $('center-label').textContent=state.beads.length?'made of little moments':'your first bead starts a little story';
    $('capacity-note').textContent=`${g.inner===null?'—':g.inner.toFixed(1)+' cm'} / ${(state.wrist+2).toFixed(1)} cm max inside`;
    $('capacity-note').classList.toggle('over-limit',g.inner!==null&&g.inner>state.wrist+2);
    $('bead-count').textContent=`${state.beads.length} ${state.beads.length===1?'bead':'beads'}`;
    $('edit-tools').hidden=selected<0;
    $('selection-label').textContent=selected<0?'Add a bead, or select one to edit.':`Bead ${selected+1} · ${byId[state.beads[selected]].name} · Choose a material to replace it.`;
    ['move-left','move-right','remove-bead','deselect'].forEach(id=>$(id).disabled=selected<0);
    $('move-left').disabled=selected<0||state.beads.length<2; $('move-right').disabled=selected<0||state.beads.length<2;
    $('undo').disabled=!undo.length; $('redo').disabled=!redo.length;
    $('inner-size').textContent=g.inner===null?'—':`${g.inner.toFixed(1)} cm`;
    const allowance=g.inner===null?null:g.inner-state.wrist;
    $('fit-note').textContent=allowance===null?'Add at least 3 beads to estimate the fit.':allowance<0?'A little tight · add a few more beads.':allowance<0.5?'A close fit · add a bead for more room.':allowance<=1.5?'A little breathing room · a comfortable fit.':'A loose fit · remove a few beads for a closer fit.';
    $('material-list').replaceChildren(); const totals=counts(); $('summary-count').textContent=`${state.beads.length} beads`;
    totals.forEach(m=>{const li=document.createElement('li'),name=document.createElement('span'),qty=document.createElement('span');name.textContent=`${m.name} · ${m.size} mm`;qty.className='quantity';qty.textContent=`× ${m.count}`;li.append(swatch(m),name,qty);$('material-list').append(li);});
    if(!totals.length) { const li=document.createElement('li');li.textContent='Your bead tray is ready when you are.';$('material-list').append(li); }
    $('export-design').disabled=!state.beads.length; renderMaterials();
  }
  document.querySelectorAll('[data-category]').forEach(button=>button.addEventListener('click',()=>{category=button.dataset.category;document.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));renderMaterials();}));
  document.querySelectorAll('[data-template]').forEach(button=>button.addEventListener('click',()=>change(()=>{const wrist=state.wrist;state=makeTemplate(button.dataset.template);state.wrist=wrist;while(state.beads.length>2 && geometry(state.beads).inner>wrist+2)state.beads.pop();selected=-1;})));
  $('deselect').addEventListener('click',()=>{selected=-1;render();});
  $('remove-bead').addEventListener('click',()=>{if(selected>=0) change(()=>{state.beads.splice(selected,1);selected=-1;});});
  function move(direction) { if(selected<0||state.beads.length<2)return; change(()=>{const next=(selected+direction+state.beads.length)%state.beads.length;[state.beads[selected],state.beads[next]]=[state.beads[next],state.beads[selected]];selected=next;}); }
  $('move-left').addEventListener('click',()=>move(-1)); $('move-right').addEventListener('click',()=>move(1));
  function history(from,to) { if(!from.length)return;to.push(snapshot());state=JSON.parse(from.pop());selected=-1;render();dirty(); }
  $('undo').addEventListener('click',()=>history(undo,redo));$('redo').addEventListener('click',()=>history(redo,undo));
  let nameBefore='',wristBefore='';
  $('design-name').addEventListener('focus',()=>{nameBefore=snapshot();});
  $('design-name').addEventListener('input',()=>{state.name=$('design-name').value;dirty();});
  $('design-name').addEventListener('change',()=>{if(nameBefore && nameBefore!==snapshot()){undo.push(nameBefore);redo=[];render();}});
  $('wrist').addEventListener('input',()=>{if(!wristBefore)wristBefore=snapshot();state.wrist=Number($('wrist').value);render();dirty();});
  $('wrist').addEventListener('change',()=>{if(wristBefore&&wristBefore!==snapshot()){undo.push(wristBefore);redo=[];}wristBefore='';render();});
  $('save-design').addEventListener('click',()=>{try {localStorage.setItem(KEY,snapshot());savedJSON=snapshot();message('Saved in this browser · come back whenever you like.');}catch{message('Saving is unavailable in this browser. Download a design card to keep your creation.');}});
  $('export-design').addEventListener('click',async ()=>{
    const exportState=JSON.parse(snapshot());
    const totals=counts(exportState.beads);
    const rows=Math.ceil(totals.length/2), footerY=Math.max(1360,1100+rows*53);
    $('export-design').disabled=true;message('Preparing your design card…');
    try {
    const sources=[...new Set(exportState.beads.map(id=>byId[id].image).filter(Boolean))];
    const images=new Map(await Promise.all(sources.map(async src=>[src,await loadImage(src)])));

    const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=footerY+180;const ctx=canvas.getContext('2d');
    if(!ctx){message('Image export is unavailable in this browser. Try saving your design instead.');return;}
    ctx.fillStyle='#f8f5ee';ctx.fillRect(0,0,1200,canvas.height);ctx.fillStyle='#53614d';ctx.font='46px Georgia';ctx.fillText('uzuki。',80,95);ctx.font='18px sans-serif';ctx.fillText('THE BEAD STUDIO / MADE BY YOU',80,143);
    ctx.font='italic 51px Georgia';let title=exportState.name.trim()||'My little ritual';while(ctx.measureText(title).width>1040&&title.length>1)title=title.slice(0,-2)+'…';ctx.fillText(title,80,230);
    ctx.fillStyle='#edf0e5';ctx.fillRect(80,280,1040,650);const g=geometry(exportState.beads),scale=235/g.displayRadius;
    ctx.strokeStyle='#c7cfbb';ctx.lineWidth=2;ctx.beginPath();ctx.arc(600,605,235,0,Math.PI*2);ctx.stroke();
    exportState.beads.forEach((id,i)=>{const m=byId[id],a=g.angles[i]-Math.PI/2,x=600+235*Math.cos(a),y=605+235*Math.sin(a),r=m.size*scale/2;const grad=ctx.createRadialGradient(x-r*.4,y-r*.4,r*.05,x,y,r);grad.addColorStop(0,'#fffdf4');grad.addColorStop(.5,m.color);grad.addColorStop(1,m.color);ctx.fillStyle=grad;ctx.shadowColor='#59605230';ctx.shadowBlur=9;ctx.shadowOffsetY=5;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
      const image=images.get(m.image);
      if(image){const [sx,sy,sw,sh]=m.crop;ctx.save();ctx.shadowBlur=0;ctx.shadowOffsetY=0;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.clip();ctx.drawImage(image,sx*image.width,sy*image.height,sw*image.width,sh*image.height,x-r,y-r,2*r,2*r);ctx.restore();}
    });
    ctx.shadowBlur=0;ctx.shadowOffsetY=0;ctx.fillStyle='#829174';ctx.font='italic 29px Georgia';ctx.textAlign='center';ctx.fillText('made of little moments',600,615);ctx.textAlign='left';ctx.fillStyle='#53614d';ctx.font='20px sans-serif';ctx.fillText(`${exportState.beads.length} beads  ·  Wrist ${exportState.wrist.toFixed(1)} cm  ·  Estimated inside ${g.inner===null?'—':g.inner.toFixed(1)+' cm'}`,80,990);
    ctx.font='17px sans-serif';totals.forEach((m,i)=>{const x=i%2?640:80,y=1060+Math.floor(i/2)*53;ctx.fillStyle=m.color;ctx.beginPath();ctx.arc(x+10,y-6,10,0,Math.PI*2);ctx.fill();ctx.fillStyle='#53614d';ctx.fillText(`${m.name} · ${m.size} mm × ${m.count}`,x+35,y);});
    ctx.font='italic 24px Georgia';ctx.fillText('Designed slowly. Kept close.',80,footerY);ctx.font='16px sans-serif';ctx.fillText('AI reference imagery · simulated sizes · not verified product photos.',80,footerY+48);ctx.fillText('Bring your design to a Uzuki workshop.',80,footerY+80);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    ((blob)=>{if(!blob){message('The image could not be created. Please try again.');return;}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`uzuki-${(exportState.name||'bracelet').replace(/[^a-z0-9_-]+/gi,'-').slice(0,48)}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message('Design card downloaded · your colors, beads & little details.');})(blob);
    } catch { message('Image export could not finish. Please try again from the local preview server.'); }
    finally { $('export-design').disabled=!state.beads.length; }
  });
  render();if(initialMessage)message(initialMessage);
})();
