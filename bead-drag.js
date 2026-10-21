/* Pointer-based editing: preview is temporary; a completed gesture is one undo step. */
window.createBeadDrag = function ({ stage, getBeads, geometry, swatch, material, commit, announce }) {
  let drag = null, swallowClick = false, swallowTimer;
  const marker = document.createElement('span');
  marker.className = 'drop-marker'; marker.setAttribute('aria-hidden', 'true'); stage.append(marker);
  const bin = document.createElement('div');
  bin.className = 'bead-drop-bin'; bin.textContent = 'Drag away from the ring to remove'; bin.setAttribute('aria-hidden', 'true'); document.body.append(bin);
  const inside = (r,x,y) => x>=r.left && x<=r.right && y>=r.top && y<=r.bottom;
  function layout(entries) {
    const g = geometry(entries.map(e=>e.id));
    entries.forEach((entry,i)=>{
      const angle = g.angles[i]-Math.PI/2;
      const el = entry.moving ? marker : stage.querySelector(`[data-bead-index="${entry.index}"]`);
      if(!el) return;
      el.style.left=`${50+34*Math.cos(angle)}%`; el.style.top=`${50+34*Math.sin(angle)}%`;
      if(!entry.moving) { const size=Math.min(21,34*material(entry.id).size/g.displayRadius); el.style.width=`${size}%`; el.style.height=`${size}%`; }
    });
  }
  function preview() {
    if(!drag?.active) return;
    const d=drag, r=stage.getBoundingClientRect();
    d.ghost.style.left=`${d.x}px`; d.ghost.style.top=`${d.y}px`;
    const radius=Math.min(r.width,r.height)*.34;
    const distance=Math.hypot(d.x-r.left-r.width/2,d.y-r.top-r.height/2);
    const g=geometry(d.original);
    const largest=Math.max(...d.original.map(id=>material(id).size),material(d.id).size);
    const halfBead=Math.min(r.width*.21,r.width*.34*largest/g.displayRadius)/2;
    const onRing=Math.abs(distance-radius)<=Math.max(24,halfBead+12);
    // Existing beads are removed on either side of the ring, including its hole.
    // Tray additions keep the whole canvas as a forgiving target, especially when empty.
    d.remove=d.index!==null && !onRing;
    d.over=d.index!==null ? onRing : inside(r,d.x,d.y);
    d.ghost.classList.toggle('will-remove',d.remove);
    bin.textContent=d.remove?'Release to remove · Undo brings it back':'Drag away from the ring to remove';
    bin.classList.toggle('is-over',d.remove); stage.classList.toggle('drop-ready',d.over);
    marker.classList.toggle('visible',d.over);
    const base=d.original.map((id,index)=>({id,index})).filter(e=>e.index!==d.index);
    if(d.over) {
      const angle=(Math.atan2(d.y-r.top-r.height/2,d.x-r.left-r.width/2)+Math.PI/2+Math.PI*2)%(Math.PI*2);
      const angles=geometry(base.map(e=>e.id)).angles;
      d.slot=angles.findIndex(a=>a>=angle); if(d.slot<0)d.slot=base.length;
      const entries=base.slice(); entries.splice(d.slot,0,{id:d.id,moving:true});
      layout(entries); d.result=entries.map(e=>e.id);
    } else {
      layout(d.remove?base:d.original.map((id,index)=>({id,index}))); d.result=null;
    }
  }
  function tick() {
    if(!drag?.active)return;
    // Edge scrolling lets a touch drag travel between the tray and the canvas.
    const y=drag.y, edge=65;
    const delta=y<edge?-10:y>innerHeight-edge?10:0;
    if(delta && drag.index===null) { window.scrollBy(0,delta); preview(); }
    drag.frame=requestAnimationFrame(tick);
  }
  function cleanup() {
    if(!drag)return;
    const d=drag; drag=null;
    cancelAnimationFrame(d.frame); d.ghost?.remove(); d.source.classList.remove('drag-source');
    if(d.source.hasPointerCapture(d.pointerId))d.source.releasePointerCapture(d.pointerId);
    document.body.classList.remove('bead-dragging'); stage.classList.remove('drop-ready');
    marker.classList.remove('visible'); bin.classList.remove('visible','is-over');
    layout(d.original.map((id,index)=>({id,index})));
  }
  function finish(cancel=false) {
    if(!drag)return;
    const d=drag;
    if(d.active) {
      swallowClick=true;clearTimeout(swallowTimer);swallowTimer=setTimeout(()=>swallowClick=false,400);
    }
    cleanup();
    if(!d.active)return;
    if(cancel) { announce('Drag cancelled.'); return; }
    if(d.remove) {
      const next=d.original.slice();next.splice(d.index,1);commit(next,-1);announce('Bead removed. Undo to bring it back.');
    } else if(d.over && d.result) {
      if(d.result.length>60) {announce('The tray holds up to 60 beads. Remove one before adding another.');return;}
      if(JSON.stringify(d.result)!==JSON.stringify(d.original)) {if(commit(d.result,d.slot)!==false)announce(d.index===null?'Bead added.':'Bead moved.');}
    } else announce('Dropped outside the bracelet. Design unchanged.');
  }
  function bind(source,id,index=null) {
    source.addEventListener('dragstart',e=>e.preventDefault());
    source.addEventListener('pointerdown',e=>{
      if(drag || !e.isPrimary || e.button!==0)return;
      // A material card remains scrollable on touch; only its bead is a drag handle.
      if(e.pointerType==='touch' && index===null && !e.target.closest('.bead-swatch'))return;
      drag={source,id,index,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,original:getBeads().slice(),active:false};
      source.setPointerCapture(e.pointerId);
    });
    source.addEventListener('pointermove',e=>{
      if(!drag || e.pointerId!==drag.pointerId)return;
      drag.x=e.clientX;drag.y=e.clientY;
      if(!drag.active && Math.hypot(drag.x-drag.startX,drag.y-drag.startY)<7)return;
      if(!drag.active) {
        drag.active=true;
        drag.ghost=document.createElement('div');drag.ghost.className='bead-drag-ghost';drag.ghost.setAttribute('aria-hidden','true');drag.ghost.append(swatch(material(id)));document.body.append(drag.ghost);
        source.classList.add('drag-source');document.body.classList.add('bead-dragging');
        bin.classList.toggle('visible',index!==null);announce('Drag to a position on the bracelet. Escape cancels.');tick();
      }
      e.preventDefault();preview();
    });
    source.addEventListener('pointerup',e=>{if(drag?.pointerId===e.pointerId){drag.x=e.clientX;drag.y=e.clientY;preview();finish();}});
    source.addEventListener('pointercancel',()=>finish(true));
    source.addEventListener('lostpointercapture',()=>finish(true));
  }
  document.addEventListener('click',e=>{if(swallowClick && e.detail!==0){e.preventDefault();e.stopImmediatePropagation();swallowClick=false;}},true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape' && drag){e.preventDefault();finish(true);}});
  window.addEventListener('blur',()=>finish(true));
  window.addEventListener('resize',()=>finish(true));
  return {bind,cancel:()=>finish(true)};
};
