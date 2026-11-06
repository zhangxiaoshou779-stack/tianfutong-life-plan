(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  $('print-report').addEventListener('click', () => window.print());
  let previousPrintDetails=[];
  window.addEventListener('beforeprint', () => {
    previousPrintDetails=[...document.querySelectorAll('details')].filter(element => !element.open);
    previousPrintDetails.forEach(element => {element.open=true;});
  });
  window.addEventListener('afterprint', () => previousPrintDetails.forEach(element => {element.open=false;}));
  const mobileToc=window.matchMedia('(max-width:900px)');
  const setToc = open => {
    document.body.classList.toggle('toc-open',open);
    $('toc-toggle').setAttribute('aria-expanded',String(open));
    $('toc-backdrop').hidden=!open;
    $('report-toc').inert=mobileToc.matches&&!open;
    if(open) $('toc-close').focus();
  };
  mobileToc.addEventListener('change',()=>setToc(false));
  setToc(false);
  $('toc-toggle').addEventListener('click',()=>setToc(!document.body.classList.contains('toc-open')));
  $('toc-close').addEventListener('click',()=>{setToc(false);$('toc-toggle').focus();});
  $('toc-backdrop').addEventListener('click',()=>setToc(false));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.body.classList.contains('toc-open'))setToc(false);});
  document.querySelectorAll('.sidebar a').forEach(link=>link.addEventListener('click',()=>setToc(false)));
  const navigation = [...document.querySelectorAll('.toc-group li a')];
  const sections = navigation.map(link => document.querySelector(link.hash)).filter(Boolean);
  const chapters=[...document.querySelectorAll('main > .chapter')];
  let scheduled = false;
  function updateNavigation() {
    let currentChapter=chapters[0];
    chapters.forEach(chapter=>{if(chapter.getBoundingClientRect().top<=150)currentChapter=chapter;});
    const chapterSections=sections.filter(section=>section.closest('.chapter')===currentChapter);
    const businesses=[...currentChapter.querySelectorAll(':scope > .business')];
    let currentBusiness=businesses[0];
    businesses.forEach(business=>{if(business.getBoundingClientRect().top<=180)currentBusiness=business;});
    const visibleSections=currentBusiness?chapterSections.filter(section=>section.closest('.business')===currentBusiness):chapterSections;
    let active=visibleSections[0];
    visibleSections.forEach(section=>{if(section.getBoundingClientRect().top<=150)active=section;});
    if(currentChapter.id==='life-home')active=chapterSections.find(section=>'#'+section.id===location.hash)||chapterSections[0];
    if(!active){scheduled=false;return;}
    navigation.forEach(link=>{const selected=link.hash==='#'+active.id;link.classList.toggle('active',selected);if(selected)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
    document.querySelectorAll('.toc-business').forEach(group=>group.classList.toggle('current',group.dataset.business===currentBusiness?.id));
    const chapter=currentChapter.dataset.chapterLabel||(currentChapter.id==='family'?'家庭生活':'下班去耍');
    const heading=active.querySelector('h2,h3').textContent.replace(/^\d+(?:\.\d+)*\s*/, '');
    $('reading-location').textContent=chapter+' / '+(currentBusiness?currentBusiness.dataset.businessLabel+' / ':'')+heading;
    scheduled = false;
  }
  window.addEventListener('scroll', () => {
    if (!scheduled) { requestAnimationFrame(updateNavigation); scheduled = true; }
  }, {passive:true});
  updateNavigation();
  window.addEventListener('hashchange', updateNavigation);

  const viewer=$('diagram-viewer');
  const viewerImage=$('diagram-image');
  let zoom=1,trigger=null;
  function setZoom(value){
    zoom=Math.max(.15,Math.min(2.5,value));
    viewerImage.style.width=Math.round(viewerImage.naturalWidth*zoom)+'px';
    $('diagram-zoom').textContent=Math.round(zoom*100)+'%';
  }
  function fitDiagram(){setZoom(Math.min(1,($('diagram-stage').clientWidth-48)/viewerImage.naturalWidth,($('diagram-stage').clientHeight-48)/viewerImage.naturalHeight));}
  document.querySelectorAll('[data-open-diagram]').forEach(button=>button.addEventListener('click',()=>{
    trigger=button;
    const figure=button.closest('figure');
    const source=figure.querySelector('img');
    $('diagram-title').textContent=figure.querySelector('figcaption strong').textContent;
    viewerImage.alt=source.alt;
    viewerImage.onload=fitDiagram;
    viewerImage.src=source.currentSrc||source.src;
    viewer.showModal();
    document.body.style.overflow='hidden';
    if(viewerImage.complete&&viewerImage.naturalWidth) fitDiagram();
  }));
  $('diagram-plus').addEventListener('click',()=>setZoom(zoom*1.25));
  $('diagram-minus').addEventListener('click',()=>setZoom(zoom/1.25));
  $('diagram-actual').addEventListener('click',()=>setZoom(1));
  $('diagram-fit').addEventListener('click',fitDiagram);
  $('diagram-close').addEventListener('click',()=>viewer.close());
  viewer.addEventListener('close',()=>{document.body.style.overflow='';trigger?.focus();});
})();
