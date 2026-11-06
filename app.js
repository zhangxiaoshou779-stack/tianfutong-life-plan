(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const amount = value => '¥' + value.toLocaleString('zh-CN', {maximumFractionDigits:2});
  const inputValue = id => {
    const element = $(id);
    const value = Number(element.value);
    return Number.isFinite(value) ? Math.min(Number(element.max) || Infinity, Math.max(0, value)) : 0;
  };
  function paint(prefix, revenue, cost) {
    const profit = revenue - cost;
    $(prefix + '-profit').textContent = (profit < 0 ? '−' : '') + amount(Math.abs(profit));
    $(prefix + '-total').classList.toggle('negative', profit < 0);
    $(prefix + '-revenue').textContent = amount(revenue);
    $(prefix + '-cost').textContent = amount(cost);
    const ceiling = Math.max(revenue, cost, 1);
    $(prefix + '-revenue-bar').style.width = (revenue / ceiling * 100) + '%';
    $(prefix + '-cost-bar').style.width = (cost / ceiling * 100) + '%';
  }
  function recycle() {
    const count = Math.floor(inputValue('r-orders'));
    const fee = inputValue('r-fee');
    const variable = inputValue('r-variable');
    const fixed = inputValue('r-fixed');
    const campaign = inputValue('r-campaign');
    const campaignCost = inputValue('r-campaign-cost');
    const byWeight = $('r-mode').value === 'weight';
    const weight = inputValue('r-weight');
    $('r-weight-field').hidden = !byWeight;
    $('r-weight').disabled = !byWeight;
    $('r-unit-label').textContent = byWeight ? '每公斤渠道费 / 元（未知按0）' : '单均渠道费 / 元（未知按0）';
    const cost = count * variable + fixed + campaignCost;
    const quantity = byWeight ? weight : count;
    paint('r', quantity * fee + campaign, cost);
    if (fee === 0) {
      const gap = Math.max(0, cost - campaign);
      $('r-comment').textContent = '当前渠道费按0，扣除已填活动收入后的服务净投入为' + amount(gap) + '。' + (quantity > 0
        ? '仅以渠道费用补足该缺口，约需每' + (byWeight ? '公斤' : '有效订单') + amount(gap / quantity) + '；此为成本反推，不是合作报价。'
        : '请先填写有效订单或验收重量，再比较费用情景。');
    } else if (byWeight) {
      const required = Math.max(0, cost - campaign) / fee;
      $('r-comment').textContent = '保持当前订单数和成本假设，覆盖成本约需' + required.toLocaleString('zh-CN', {maximumFractionDigits:1}) + '公斤可结算验收重量。预估重量、物流计费重和可结算重量不默认相同。';
    } else {
      const margin = fee - variable;
      $('r-comment').textContent = margin > 0
        ? '按当前假设，单均边际贡献' + amount(margin) + '；计入已填活动收支后，覆盖其余成本约需' + Math.ceil(Math.max(0, fixed + campaignCost - campaign) / margin).toLocaleString('zh-CN') + '个有效订单。合同定义和异常扣减仍须核对。'
        : margin === 0
          ? '单均渠道费恰好覆盖单均变动成本，增加订单不能补足剩余固定成本。'
          : '单均渠道费低于单均自担成本，扩大订单会扩大渠道业务亏损；先核对收费和成本责任。';
    }
  }
  function event() {
    const cpa = $('e-mode').value === 'cpa';
    $('e-fixed-field').hidden = cpa;
    $('e-count-field').hidden = !cpa;
    $('e-unit-field').hidden = !cpa;
    $('e-fixed').disabled = cpa;
    $('e-count').disabled = !cpa;
    $('e-unit').disabled = !cpa;
    const cost = inputValue('e-delivery') + inputValue('e-media') + inputValue('e-subsidy');
    const revenue = cpa ? Math.floor(inputValue('e-count')) * inputValue('e-unit') : inputValue('e-fixed');
    paint('e', revenue, cost);
    $('e-comment').textContent = cpa
      ? inputValue('e-unit') > 0
        ? '按当前单次服务费，覆盖本项目成本约需' + Math.ceil(cost / inputValue('e-unit')).toLocaleString('zh-CN') + '次有效核销。此为演示测算，真实可结算条件以合同为准。'
        : '单次服务费为0，无法通过增加核销获得收入。'
      : '按当前成本，固定项目服务费至少需' + amount(cost) + '才能覆盖本项目直接成本。权益补贴预算与平台服务费分别核算。';
  }
  document.querySelectorAll('#recycle-calculator input').forEach(element => element.addEventListener('input', recycle));
  $('r-mode').addEventListener('change', recycle);
  document.querySelectorAll('#event-calculator input').forEach(element => element.addEventListener('input', event));
  $('e-mode').addEventListener('change', event);
  recycle(); event();

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
    let active = chapterSections[0];
    chapterSections.forEach(section => { if (section.getBoundingClientRect().top <= 150) active = section; });
    if(currentChapter.id==='life-home'){
      active=chapterSections.find(section=>'#'+section.id===location.hash)||chapterSections[0];
    }
    navigation.forEach(link => {
      const selected = link.hash === '#' + active.id;
      link.classList.toggle('active', selected);
      if (selected) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    const chapter=active.closest('.chapter').dataset.chapterLabel||(active.closest('.chapter').id==='family'?'家庭生活':'下班去耍');
    $('reading-location').textContent=chapter+' / '+active.querySelector('h2').textContent.split('：')[0];
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
