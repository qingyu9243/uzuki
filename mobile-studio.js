(() => {
  const query=window.matchMedia('(max-width: 800px)');
  const details=document.querySelector('.details');
  const home=details.parentElement;
  const sheet=document.getElementById('design-details-sheet');
  const slot=document.getElementById('mobile-details-slot');
  const open=document.getElementById('open-design-details');
  const close=document.getElementById('close-design-details');
  function sync() {
    if(query.matches)slot.append(details);
    else {if(sheet.open)sheet.close();home.append(details);}
  }
  open.addEventListener('click',()=>sheet.showModal());
  close.addEventListener('click',()=>sheet.close());
  sheet.addEventListener('click',event=>{
    if(event.target!==sheet)return;
    const r=sheet.getBoundingClientRect();
    if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)sheet.close();
  });
  query.addEventListener('change',sync);sync();
})();
