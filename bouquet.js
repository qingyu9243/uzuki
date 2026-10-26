'use strict';
const flowers = [
 ['tulip','Pink Tulip',8,'hero','Crochet'],['rose','Blush Rose',9,'hero','Crochet'],['peony','Peony',10,'hero','Crochet'],['lily','Lily',10,'hero','Crochet'],['sunflower','Sunflower',9,'hero','Crochet'],['hydrangea','Hydrangea',9,'hero','Crochet'],['daisy','White Daisy',6,'accent','Fuzzy Stem'],['breath',"Baby’s Breath",4,'accent','Fuzzy Stem'],['lavender','Lavender Sprig',5,'accent','Fuzzy Stem'],['eucalyptus','Eucalyptus',4,'foliage','Fuzzy Stem'],['olive','Olive Leaf',4,'foliage','Fuzzy Stem'],['fern','Fern',4,'foliage','Fuzzy Stem']
].map(([id,name,price,group,material],index)=>({id,name,price,group,material,index}));
const wraps=[['pink','Cream Pink','#e6bac0'],['sage','Sage Green','#aeb78d'],['lavender','Lavender','#c7bed7'],['ivory','Ivory','#e8dcc5']];
const ribbons=[['pink','Organza Pink','#d099a4'],['ivory','Satin Ivory','#dfd1b4'],['sage','Satin Sage','#98a276'],['lavender','Lilac Silk','#b2a0bf']];
const presets={blush:{counts:{tulip:1,rose:1,daisy:2,lavender:3,eucalyptus:2},wrap:'pink',ribbon:'pink'},sunshine:{counts:{sunflower:3,lily:1,daisy:2,olive:2},wrap:'ivory',ribbon:'ivory'},meadow:{counts:{hydrangea:1,lavender:3,breath:2,fern:2,eucalyptus:1},wrap:'sage',ribbon:'sage'}};
const $=selector=>document.querySelector(selector);
let state={...structuredClone(presets.blush),message:'A little bouquet\nfor a brighter day ♡',seed:0,positions:{},layerOrder:[],artwork:{}};
let category='all',material='all',activePreset='blush',bag=[];
const storageKey='uzuki-bouquet-studio-v1';
const spriteStyle=f=>`background-position:${(f.index%4)*100/3}% ${Math.floor(f.index/4)*50}%`;
const total=()=>flowers.reduce((sum,f)=>sum+f.price*(state.counts[f.id]||0),0);
const count=()=>Object.values(state.counts).reduce((a,b)=>a+b,0);
const announce=text=>{$('#status').textContent=text;};
function sanitize(raw){
 if(!raw||typeof raw!=='object'||!raw.counts||typeof raw.counts!=='object')return null;
 const counts={};let available=36;
 flowers.forEach(f=>{const n=raw.counts[f.id];if(Number.isInteger(n)&&n>0){counts[f.id]=Math.min(n,12,available);available-=counts[f.id];}});
 const positions=cleanPositions(raw.positions,counts);
 return {counts,positions,layerOrder:cleanOrder(raw.layerOrder,counts),artwork:cleanArtwork(raw.artwork,counts),wrap:wraps.some(w=>w[0]===raw.wrap)?raw.wrap:'pink',ribbon:ribbons.some(r=>r[0]===raw.ribbon)?raw.ribbon:'pink',message:typeof raw.message==='string'?raw.message.slice(0,180):'',seed:Number.isInteger(raw.seed)?Math.abs(raw.seed)%100:0};
}
function read(key){try{return JSON.parse(localStorage.getItem(key));}catch{return null;}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{announce('Browser storage is unavailable. Your current design is still here.');return false;}}
function renderCatalog(){
 $('#catalog').innerHTML=['hero','accent','foliage'].map(group=>{
 const items=flowers.filter(f=>f.group===group&&(category==='all'||category===group)&&(material==='all'||material===f.material));
 if(!items.length)return '';
 return `<section class="catalog-group"><h3>${{hero:'Hero Flowers',accent:'Accent Flowers',foliage:'Foliage & Greenery'}[group]}</h3><div class="flower-grid">${items.map(f=>`<article class="flower-card"><button class="flower-image" data-add="${f.id}" aria-label="Add ${f.name}, $${f.price}"><span class="sprite" style="${spriteStyle(f)}"></span></button><span class="flower-name">${f.name.replace('Pink ','').replace('Blush ','').replace('White ','').replace(' Sprig','')}</span><span class="flower-price">$${f.price}</span><button class="add-flower" data-add="${f.id}" aria-label="Add ${f.name}">+</button></article>`).join('')}</div></section>`;
 }).join('')||'<p class="intro">No flowers in this material. Try another filter.</p>';
}
function renderSwatches(){
 for(const [type,options] of [['wrap',wraps],['ribbon',ribbons]]){
 $(`#${type}-options`).innerHTML=options.map(([id,name,color])=>`<button class="swatch" data-${type}="${id}" aria-label="${name} ${type}" aria-pressed="${state[type]===id}"><span class="swatch-art"><span class="${type}-sample" style="--color:${color}">${type==='ribbon'?'୨୧':''}</span></span>${name}</button>`).join('');
 }
}
// Stable per-instance candidates; nearby flowers can move to resolve overlap.
const stemProfiles={tulip:112,rose:150,peony:168,lily:162,sunflower:158,hydrangea:166,daisy:135,breath:145,lavender:100,eucalyptus:128,olive:118,fern:144};
// Starting design preferences, ready to tune with florist feedback.
const arrangementRules={
 headBounds:{left:80,right:360,top:95,bottom:295},keyboardStep:6,
 crown:{heroReach:105,accentReach:137,heroHeight:67,accentHeight:89},
 spacing:{hero:.25,accent:.19},lean:{minimum:.10,variation:.16}
};
let arrangementHistory=[],selectedStem=null,selectionLift=true,drag=null,suppressStageClick=false;
function constrainHead(x,y){
 const b=arrangementRules.headBounds;
 return {x:Math.max(b.left,Math.min(b.right,x)),y:Math.max(b.top,Math.min(b.bottom,y))};
}
function cleanPositions(positions,counts){
 const result={};
 for(const f of flowers)for(let i=0;i<(counts[f.id]||0);i++){
 const key=`${f.id}-${i}`,point=positions?.[key];
 if(point&&Number.isFinite(point.x)&&Number.isFinite(point.y))result[key]=constrainHead(point.x,point.y);
 }
 return result;
}
function stemKeys(counts){return flowers.flatMap(f=>Array.from({length:counts[f.id]||0},(_,i)=>`${f.id}-${i}`));}
function cleanOrder(order,counts){const valid=new Set(stemKeys(counts));return Array.isArray(order)?[...new Set(order.filter(key=>valid.has(key)))]:[];}
function cleanArtwork(artwork,counts){
 const result={};for(const key of stemKeys(counts)){const size=artwork?.[key];
 if(size&&Number.isFinite(size.width)&&size.width>=80&&size.width<=200&&Number.isFinite(size.height)&&size.height>=100&&size.height<=500)result[key]={width:size.width,height:size.height};}
 return result;
}
function arrangementSnapshot(){return {seed:state.seed,counts:structuredClone(state.counts),positions:structuredClone(state.positions||{}),layerOrder:[...(state.layerOrder||[])],artwork:structuredClone(state.artwork||{}),selectedStem};}
function restoreArrangement(previous){
 state.seed=previous.seed;state.counts=structuredClone(previous.counts);state.positions=cleanPositions(previous.positions,state.counts);
 state.layerOrder=cleanOrder(previous.layerOrder,state.counts);state.artwork=cleanArtwork(previous.artwork,state.counts);selectedStem=previous.selectedStem;selectionLift=false;
}
function rememberArrangement(snapshot=arrangementSnapshot()){
 arrangementHistory.push(snapshot);if(arrangementHistory.length>30)arrangementHistory.shift();
}
function displayedLayout(){
 return bouquetLayout(state.counts,state.seed).map(item=>{
 const {x,y}=state.positions?.[item.key]||item,dx=x-item.rootX,dy=item.rootY-y;
 // Keep the artwork dimensions fixed; only the connecting stem changes length.
 return {...item,...state.artwork?.[item.key],x,y,depth:state.layerOrder?.includes(item.key)?500+state.layerOrder.indexOf(item.key):item.depth,stemLength:Math.hypot(dx,dy),angle:Math.atan2(dx,dy)*180/Math.PI};
 });
}
function freezePositions(){const layout=displayedLayout();state.positions=Object.fromEntries(layout.map(item=>[item.key,{x:item.x,y:item.y}]));state.artwork=Object.fromEntries(layout.map(item=>[item.key,{width:item.width,height:item.height}]));}
function selectStem(key){selectedStem=key;selectionLift=true;renderArrangement();}
function editSelected(action){
 const layout=displayedLayout(),item=layout.find(item=>item.key===selectedStem);if(!item)return false;
 const id=item.f.id,n=state.counts[id];
 if(action==='copy'&&(count()>=36||n>=12)){announce('A bouquet holds up to 36 stems, with up to 12 of each flower.');return false;}
 if(!['copy','delete','front','back'].includes(action))return false;
 rememberArrangement();freezePositions();
 const order=layout.slice().sort((a,b)=>a.depth-b.depth).map(item=>item.key);
 if(action==='copy'){
 const key=`${id}-${n}`;state.counts[id]++;
 state.positions[key]=constrainHead(item.x+(item.x>325?-22:22),item.y+(item.y>265?-16:16));
 state.artwork[key]={width:item.width,height:item.height};state.layerOrder=[...order,key];selectedStem=key;selectionLift=true;
 }else if(action==='delete'){
 const removed=Number(item.key.split('-').pop());
 const remap=key=>{if(!key.startsWith(`${id}-`))return key;const i=Number(key.split('-').pop());return i===removed?null:`${id}-${i>removed?i-1:i}`;};
 for(const field of ['positions','artwork'])state[field]=Object.fromEntries(Object.entries(state[field]).flatMap(([key,value])=>{const next=remap(key);return next?[[next,value]]:[];}));
 state.layerOrder=order.map(remap).filter(Boolean);state.counts[id]--;if(!state.counts[id])delete state.counts[id];selectedStem=null;
 }else{
 const others=order.filter(key=>key!==item.key);state.layerOrder=action==='front'?[...others,item.key]:[item.key,...others];selectionLift=false;
 }
 activePreset='';return true;
}


function noise(key,seed){
 let h=2166136261;
 for(const c of `${key}:${seed}`){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}
 h^=h>>>16;h=Math.imul(h,0x45d9f3b);h^=h>>>16;
 return (h>>>0)/4294967296;
}
function bouquetLayout(counts,seed){
 const layout=[];
 for(const f of [...flowers].sort((a,b)=>['hero','accent','foliage'].indexOf(a.group)-['hero','accent','foliage'].indexOf(b.group))){
 for(let i=0;i<(counts[f.id]||0);i++){
 const key=`${f.id}-${i}`,r=n=>noise(`${key}-${n}`,seed);
 // A low-discrepancy spiral distributes repeated flowers without straight rows.
 const phase=noise(f.id,seed)*Math.PI*2+i*2.399963;
 const radius=Math.sqrt(.12+.88*((i*.618034+noise(f.id+'radius',seed))%1));
 let x,y;
 if(f.group==='foliage'){
 const side=r(1)<.5?-1:1;
 x=220+side*(85+r(2)*51);y=133+r(3)*108;
 }else{
 const reach=f.group==='hero'?arrangementRules.crown.heroReach:arrangementRules.crown.accentReach;
 x=220+Math.cos(phase)*radius*reach;
 y=191+Math.sin(phase)*radius*(f.group==='hero'?arrangementRules.crown.heroHeight:arrangementRules.crown.accentHeight);
 }
 // Prefer open pockets, allowing petal overlap without stacking flower centers.
 if(f.group!=='foliage'){
 const baseX=x,baseY=y;
 let bestScore=Infinity;
 for(let attempt=0;attempt<25;attempt++){
 const a=attempt*2.399963,reach=attempt===0?0:14*Math.sqrt(attempt);
 const cx=Math.max(96,Math.min(344,baseX+Math.cos(a)*reach));
 const cy=Math.max(115,Math.min(264,baseY+Math.sin(a)*reach));
 let score=reach*.09;
 for(const other of layout.filter(item=>item.f.group!=='foliage')){
 const clearance=(stemProfiles[f.id]+other.width)*arrangementRules.spacing[f.group];
 const distance=Math.hypot(cx-other.x,(cy-other.y)*1.15);
 score+=Math.max(0,clearance-distance)**2;
 }
 if(score<bestScore){bestScore=score;x=cx;y=cy;}
 }
 }
 // Slightly tilted crown; stems still meet underneath the ribbon.
 y+=(x-220)*(arrangementRules.lean.minimum+noise('lean',seed)*arrangementRules.lean.variation);
 const rootX=220+(r(4)-.5)*14,rootY=425+(r(5)-.5)*8;
 const dx=x-rootX,dy=rootY-y;
 const height=Math.hypot(dx,dy)/.76;
 layout.push({key,f,x,y,rootX,rootY,height,width:stemProfiles[f.id]*(.94+r(6)*.12),angle:Math.atan2(dx,dy)*180/Math.PI,
 depth:f.group==='foliage'?Math.round(5+r(7)*12):Math.round(y)+(f.group==='hero'?100:0)});
 }
 }
 return layout;
}
function renderArrangement(){
 const container=$('#stems'),layout=displayedLayout();
 if(!layout.some(item=>item.key===selectedStem))selectedStem=null;
 const remaining=new Map([...container.children].map(el=>[el.dataset.key,el]));
 for(const item of layout){
 let el=remaining.get(item.key);
 if(!el){el=document.createElement('div');el.className='stem';el.dataset.key=item.key;
 const sprite=document.createElement('div');sprite.className='sprite';sprite.style.cssText=spriteStyle(item.f);el.append(sprite);
 const handle=document.createElement('button');handle.className='stem-handle';handle.type='button';handle.dataset.stem=item.key;
 handle.setAttribute('aria-label',`Move ${item.f.name} ${Number(item.key.split('-').pop())+1}`);
 handle.setAttribute('aria-describedby','arrange-help');el.append(handle);container.append(el);}
 remaining.delete(item.key);
 el.classList.toggle('is-selected',selectedStem===item.key);el.classList.toggle('is-dragging',drag?.key===item.key);
 el.querySelector('.stem-handle').setAttribute('aria-pressed',String(selectedStem===item.key));
 el.style.cssText=`--head-x:${item.x}px;--head-y:${item.y}px;--stem-length:${item.stemLength}px;--height:${item.height}px;--width:${item.width}px;--angle:${item.angle}deg;z-index:${selectedStem===item.key&&selectionLift?1000:item.depth}`;
 }
 for(const el of remaining.values())el.remove();
 $('#undo-arrange').disabled=!arrangementHistory.length;
 const selected=layout.find(item=>item.key===selectedStem);
 $('#stem-tools-name').textContent=selected?selected.f.name:'Select a flower';
 for(const button of document.querySelectorAll('[data-stem-action]'))button.disabled=!selected||(button.dataset.stemAction==='copy'&&(count()>=36||state.counts[selected.f.id]>=12));
}
function render(){
 state.layerOrder=cleanOrder(state.layerOrder,state.counts);state.artwork=cleanArtwork(state.artwork,state.counts);
 const selected=flowers.filter(f=>state.counts[f.id]);
 $('#selection').innerHTML=selected.map(f=>`<div class="selected-row"><div class="mini-image sprite" style="${spriteStyle(f)}"></div><div class="selected-info"><strong>${f.name}</strong><small>${f.material} · $${f.price}</small></div><div class="quantity"><button data-change="${f.id}" data-delta="-1" aria-label="Decrease ${f.name}">−</button><output aria-label="${f.name} quantity">${state.counts[f.id]}</output><button data-change="${f.id}" data-delta="1" aria-label="Increase ${f.name}">+</button></div><button class="remove" data-remove="${f.id}" aria-label="Remove all ${f.name}">×</button></div>`).join('')||'<p class="intro">Your bouquet is a blank canvas.<br>Choose a flower to begin.</p>';
 $('#total').textContent=`$${total()}`;
 $('#message-preview').textContent=state.message||'A little space for your words…';
 $('#add-bag').disabled=!count();
 $('#save').disabled=!count();
 $('#shuffle').disabled=!count();
 $('#arrangement').hidden=!count();$('#empty-stage').hidden=!!count();
 $('#arrangement').style.setProperty('--wrap',wraps.find(w=>w[0]===state.wrap)[2]);
 $('#arrangement').style.setProperty('--ribbon',ribbons.find(r=>r[0]===state.ribbon)[2]);
 renderArrangement();
 $('#arrangement').setAttribute('aria-label',`Bouquet with ${selected.map(f=>`${state.counts[f.id]} ${f.name}`).join(', ')}`);
 $('#preview-list').innerHTML=`<h3>${count()} stems, a little happiness.</h3><ul>${selected.map(f=>`<li>${state.counts[f.id]} × ${f.name} <span style="float:right">$${state.counts[f.id]*f.price}</span></li>`).join('')}</ul>`;
 renderSwatches();
 document.querySelectorAll('[data-preset]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.preset===activePreset)));
}
function change(id,delta){if(!flowers.some(f=>f.id===id))return;if(delta>0&&(count()>=36||(state.counts[id]||0)>=12)){announce('A bouquet holds up to 36 stems, with up to 12 of each flower.');return;}arrangementHistory=[];freezePositions();state.counts[id]=Math.max(0,(state.counts[id]||0)+delta);if(!state.counts[id])delete state.counts[id];state.positions=cleanPositions(state.positions,state.counts);activePreset='';render();announce(`${count()} stems in your bouquet · estimated total $${total()}`);}
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.stemAction){if(editSelected(b.dataset.stemAction)){render();announce({copy:'Flower copied. Quantity and total updated.',delete:'Selected flower removed. Undo restores it.',front:'Flower brought to the front.',back:'Flower sent to the back.'}[b.dataset.stemAction]);if(b.dataset.stemAction==='delete')$('#undo-arrange').focus({preventScroll:true});}return;}
 if(b.dataset.add)change(b.dataset.add,1);
 if(b.dataset.change)change(b.dataset.change,Number(b.dataset.delta));
 if(b.dataset.remove){arrangementHistory=[];freezePositions();delete state.counts[b.dataset.remove];state.positions=cleanPositions(state.positions,state.counts);activePreset='';render();announce('Flower removed.');}
 if(b.dataset.category){category=b.dataset.category;document.querySelectorAll('[data-category]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderCatalog();}
 if(b.dataset.material){material=b.dataset.material;document.querySelectorAll('[data-material]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderCatalog();}
 if(b.dataset.wrap||b.dataset.ribbon){const type=b.dataset.wrap?'wrap':'ribbon';state[type]=b.dataset[type];activePreset='';render();}
 if(b.dataset.jump){const el=$(`#${b.dataset.jump}`);el.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});el.querySelector('button').focus({preventScroll:true});}
 if(b.dataset.view){document.querySelectorAll('[data-view]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('#stage').hidden=b.dataset.view!=='preview';$('#preview-list').hidden=b.dataset.view!=='list';}
 if(b.dataset.preset){arrangementHistory=[];selectedStem=null;activePreset=b.dataset.preset;state={...state,...structuredClone(presets[activePreset]),seed:0,positions:{},layerOrder:[],artwork:{}};render();announce('A fresh starting point. Make it your own.');}
});
$('#clear').onclick=()=>{arrangementHistory=[];selectedStem=null;state.counts={};state.positions={};state.layerOrder=[];state.artwork={};activePreset='';render();announce('A fresh canvas. Add a flower to begin.');};
$('#reset').onclick=()=>{arrangementHistory=[];selectedStem=null;state={...state,...structuredClone(presets.blush),seed:0,positions:{},layerOrder:[],artwork:{}};activePreset='blush';$('#arrangement').style.setProperty('--zoom',1);$('#zoom').setAttribute('aria-pressed','false');render();announce('Returned to the Blush garden arrangement.');};
$('#shuffle').onclick=()=>{rememberArrangement();state.seed=(state.seed+1)%100;state.positions={};state.layerOrder=[];state.artwork={};selectedStem=null;render();announce('A new arrangement. Undo brings your previous placement back.');};
$('#undo-arrange').onclick=()=>{const previous=arrangementHistory.pop();if(!previous)return;restoreArrangement(previous);render();announce('Previous arrangement restored.');};
$('#zoom').onclick=()=>{const zoom=$('#zoom').getAttribute('aria-pressed')!=='true';$('#zoom').setAttribute('aria-pressed',String(zoom));$('#arrangement').style.setProperty('--zoom',zoom?1.2:1);};
// Pointer coordinates are mapped back into the unscaled bouquet canvas, including zoom.
function canvasPoint(event){const rect=$('#arrangement').getBoundingClientRect();return {x:(event.clientX-rect.left)*440/rect.width,y:(event.clientY-rect.top)*590/rect.height};}
$('#stems').addEventListener('pointerdown',event=>{
 const handle=event.target.closest('.stem-handle');if(!handle||event.button!==0||drag)return;
 suppressStageClick=false;
 const key=handle.dataset.stem,item=displayedLayout().find(item=>item.key===key);
 drag={key,handle,pointerId:event.pointerId,start:canvasPoint(event),head:{x:item.x,y:item.y},before:arrangementSnapshot(),moved:false};
 handle.setPointerCapture(event.pointerId);handle.focus({preventScroll:true});selectStem(key);event.preventDefault();
});
$('#stems').addEventListener('pointermove',event=>{
 if(!drag||event.pointerId!==drag.pointerId)return;
 const point=canvasPoint(event),dx=point.x-drag.start.x,dy=point.y-drag.start.y;
 if(!drag.moved&&Math.hypot(dx,dy)<3)return;
 if(!drag.moved){freezePositions();drag.moved=true;}
 state.positions[drag.key]=constrainHead(drag.head.x+dx,drag.head.y+dy);renderArrangement();
});
function endDrag(cancel=false){
 if(!drag)return;const current=drag;drag=null;suppressStageClick=current.moved;
 if(cancel){restoreArrangement(current.before);}
 else if(current.moved){rememberArrangement(current.before);activePreset='';announce('Flower placed. You can undo this move.');}
 if(current.handle.hasPointerCapture(current.pointerId))current.handle.releasePointerCapture(current.pointerId);
 render();
}
$('#stems').addEventListener('pointerup',event=>{if(event.pointerId===drag?.pointerId)endDrag();});
$('#stems').addEventListener('pointercancel',()=>endDrag(true));
$('#stems').addEventListener('lostpointercapture',()=>endDrag(true));
window.addEventListener('blur',()=>endDrag(true));
$('#stems').addEventListener('click',event=>{const handle=event.target.closest('.stem-handle');if(handle)selectStem(handle.dataset.stem);});
$('#stems').addEventListener('keydown',event=>{
 const handle=event.target.closest('.stem-handle');if(!handle)return;
 if(event.key==='Escape'){event.preventDefault();endDrag(true);selectedStem=null;renderArrangement();return;}
 const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];if(!delta||drag)return;
 event.preventDefault();rememberArrangement();freezePositions();const key=handle.dataset.stem,point=state.positions[key],step=arrangementRules.keyboardStep*(event.shiftKey?3:1);
 state.positions[key]=constrainHead(point.x+delta[0]*step,point.y+delta[1]*step);selectedStem=key;activePreset='';render();announce('Flower moved. Use arrow keys to adjust, or Undo.');
});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){if(drag)endDrag(true);else {selectedStem=null;renderArrangement();}}});
$('#stage').addEventListener('click',event=>{if(suppressStageClick){suppressStageClick=false;return;}if(!event.target.closest('button')&&!drag){selectedStem=null;renderArrangement();}});
$('#edit-message').onclick=()=>{$('#message-input').value=state.message;$('#message-dialog').showModal();$('#message-input').focus();};
$('#apply-message').onclick=()=>{state.message=$('#message-input').value.trim().slice(0,180);$('#message-dialog').close();render();announce('Your message card is ready.');};
$('#save').onclick=()=>{if(write(storageKey,state))announce('Design saved in this browser. Use ♡ at the top to load it.');};
$('#load-design').onclick=()=>{const saved=sanitize(read(storageKey));if(!saved){announce('No saved bouquet yet. Create one and choose Save Design.');return;}arrangementHistory=[];selectedStem=null;state=saved;activePreset='';render();announce('Your saved bouquet is back.');};
function renderBag(){
 $('#bag-count').textContent=bag.length;
 const content=$('#bag-content');content.replaceChildren();
 if(!bag.length){const p=document.createElement('p');p.textContent='Your design bag is waiting for its first bouquet.';content.append(p);}
 bag.forEach((design,i)=>{const div=document.createElement('div');div.className='bag-item';const title=document.createElement('strong');title.textContent=`Bouquet ${i+1}`;const remove=document.createElement('button');remove.textContent='Remove';remove.setAttribute('aria-label',`Remove bouquet ${i+1} from bag`);remove.onclick=()=>{const next=bag.filter((_,n)=>n!==i);if(write(`${storageKey}-bag`,next)){bag=next;renderBag();}};const p=document.createElement('p');p.textContent=flowers.filter(f=>design.counts[f.id]).map(f=>`${design.counts[f.id]} × ${f.name}`).join(' · ');const note=document.createElement('p');note.textContent=design.message;div.append(title,remove,p,note);content.append(div);});
}
$('#add-bag').onclick=()=>{if(!count())return;if(bag.length>=20){announce('Your bag holds 20 designs. Remove one to make room.');return;}const next=[...bag,structuredClone(state)];if(write(`${storageKey}-bag`,next)){bag=next;renderBag();$('#bag-dialog').showModal();announce('Your bouquet was added to your design bag.');}};
$('#open-bag').onclick=()=>{renderBag();$('#bag-dialog').showModal();};$('#close-bag').onclick=()=>$('#bag-dialog').close();
const saved=sanitize(read(storageKey));if(saved){state=saved;activePreset='';}
const storedBag=read(`${storageKey}-bag`);if(Array.isArray(storedBag))bag=storedBag.slice(0,20).map(sanitize).filter(Boolean);
renderCatalog();render();renderBag();
