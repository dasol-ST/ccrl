const $ = (selector) => document.querySelector(selector);
const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const heroVideo = $('#hero-video');
const videoToggle = $('#video-toggle');
const videoSkip = $('#video-skip');
const videoReplay = $('#video-replay');
const finalImage = $('#hero-end-image');
let videoWanted = !reducedMotion;
let videoFinished = false;
const filmTitleLayer = $('#film-title-layer');
const titleMotionPreference = matchMedia('(prefers-reduced-motion: reduce)');
// Original warming-v3.html: 162 sixteenth-notes at 128 BPM precede the final shot.
const titleSceneStart = 162 * (60 / 128 / 4);
let titleFrame = null;
let titleRaf = null;
function renderFilmTitle(time=heroVideo.currentTime){
  const elapsed=videoFinished?3:time-titleSceneStart;
  filmTitleLayer.hidden=elapsed<0;
  if(elapsed<0)return;
  const q=(start,duration)=>Math.min(1,Math.max(0,(elapsed-start)/duration));
  const ease=x=>1-(1-x)**3;
  const instant=videoFinished||titleMotionPreference.matches;
  const p1=instant?1:ease(q(.35,.9)), p2=instant?1:ease(q(1.3,.7));
  filmTitleLayer.style.setProperty('--title-opacity',instant?1:q(.35,.5));
  filmTitleLayer.style.setProperty('--title-tracking',`${.06+(1-p1)*.1}em`);
  filmTitleLayer.style.setProperty('--title-y',`${(1-p1)*12}px`);
  filmTitleLayer.style.setProperty('--subtitle-opacity',p2);
  filmTitleLayer.style.setProperty('--subtitle-y',`${(1-p2)*14}px`);
}
function stopTitleFrames(){
  if(titleFrame!==null){heroVideo.cancelVideoFrameCallback(titleFrame);titleFrame=null;}
  if(titleRaf!==null){cancelAnimationFrame(titleRaf);titleRaf=null;}
}
function trackTitleFrames(){
  stopTitleFrames();
  renderFilmTitle();
  if(heroVideo.paused||videoFinished)return;
  if(heroVideo.requestVideoFrameCallback){
    titleFrame=heroVideo.requestVideoFrameCallback((now,frame)=>{
      titleFrame=null;renderFilmTitle(frame.mediaTime);scheduleNextTitleFrame();
    });
  }else titleRaf=requestAnimationFrame(()=>{titleRaf=null;trackTitleFrames();});
}
function scheduleNextTitleFrame(){
  if(heroVideo.paused||videoFinished)return;
  titleFrame=heroVideo.requestVideoFrameCallback((now,frame)=>{
    titleFrame=null;renderFilmTitle(frame.mediaTime);scheduleNextTitleFrame();
  });
}
function loadHeroVideo(){if(!heroVideo.getAttribute('src'))heroVideo.src=heroVideo.dataset.src;}
function updateVideoButton(){
  const playing=!heroVideo.paused && !videoFinished;
  videoToggle.hidden=videoFinished;
  videoToggle.setAttribute('aria-label',playing?'Pause background video':'Play background video');
  videoToggle.firstElementChild.textContent=playing?'Ⅱ':'▶';
  $('.video-toggle-label').textContent=playing?'Pause':'Play';
  videoSkip.disabled=videoFinished;
}
function finishHeroVideo(){
  videoWanted=false;
  videoFinished=true;
  heroVideo.pause();
  finalImage.hidden=false;
  stopTitleFrames();renderFilmTitle();
  updateVideoButton();
  $('#video-status').textContent='Video finished. Select Replay to watch again.';
}
async function playHeroVideo(){
  loadHeroVideo();heroVideo.muted=true;
  try{await heroVideo.play();if(!videoWanted||videoFinished||document.hidden)heroVideo.pause();}catch{updateVideoButton();}
}
function replayHeroVideo(){
  videoFinished=false;videoWanted=true;finalImage.hidden=true;
  loadHeroVideo();heroVideo.currentTime=0;
  renderFilmTitle(0);
  $('#video-status').textContent='Video restarted.';
  updateVideoButton();playHeroVideo();
}
$('#video-controls').hidden=false;
heroVideo.addEventListener('play',updateVideoButton);
heroVideo.addEventListener('play',trackTitleFrames);
heroVideo.addEventListener('pause',()=>{stopTitleFrames();renderFilmTitle();});
heroVideo.addEventListener('seeked',trackTitleFrames);
heroVideo.addEventListener('loadedmetadata',()=>renderFilmTitle());
heroVideo.addEventListener('timeupdate',()=>{if(heroVideo.paused)renderFilmTitle();});
heroVideo.addEventListener('pause',updateVideoButton);
heroVideo.addEventListener('ended',finishHeroVideo);
heroVideo.addEventListener('error',()=>{finishHeroVideo();$('#video-controls').hidden=true;});
videoToggle.addEventListener('click',()=>{videoWanted=heroVideo.paused;if(videoWanted)playHeroVideo();else heroVideo.pause();});
videoSkip.addEventListener('click',finishHeroVideo);
videoReplay.addEventListener('click',replayHeroVideo);
document.addEventListener('visibilitychange',()=>{if(document.hidden)heroVideo.pause();else if(videoWanted&&!videoFinished)playHeroVideo();});
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',event=>{if(event.matches){videoWanted=false;heroVideo.pause();}});
if(videoWanted)playHeroVideo();else finishHeroVideo();
const shortTitles = ['Greenhouse gas monitoring & carbon neutrality','Renewable energy optimization','Extreme weather & air quality','Climate risk assessment','Climate intervention technology'];
const header = $('#header');
function updateHeader(){ header.classList.toggle('scrolled', scrollY > 30); }
addEventListener('scroll',updateHeader,{passive:true}); updateHeader();
const menuButton = $('.menu-toggle');
function closeMenu(){menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open navigation');$('#navigation').classList.remove('open');}
menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Close navigation':'Open navigation');$('#navigation').classList.toggle('open',open);});
$('#navigation').addEventListener('click',event=>{if(event.target.closest('a'))closeMenu();});
addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
const dialog=$('#detail-dialog');
let returnFocus=null;
function openDialog(html){returnFocus=document.activeElement;$('#dialog-content').innerHTML=html;dialog.showModal();document.body.style.overflow='hidden';dialog.scrollTop=0;$('.dialog-close').focus();}
function closeDialog(){dialog.close();}
$('.dialog-close').addEventListener('click',closeDialog);
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeDialog();}});
dialog.addEventListener('close',()=>{document.body.style.overflow='';returnFocus?.focus({preventScroll:true});});
$('#current-year').textContent = new Date().getFullYear();
async function init(){
  const response=await fetch('assets/content.json?v=20261104g');if(!response.ok)throw new Error('Could not load lab content');const data=await response.json();
  const track=$('#research-track');
  track.innerHTML=data.research.map((item,index)=>`<article class="research-card"><div class="research-image"><img src="${escapeHTML(item.image)}" alt="${escapeHTML(shortTitles[index])}" loading="lazy"><span class="research-number">0${index+1}</span></div><div class="research-card-copy">${item.tag?`<p class="research-tag">${escapeHTML(item.tag)}</p>`:''}<h3>${escapeHTML(shortTitles[index])}</h3><p>${escapeHTML(item.summary)}</p></div></article>`).join('');
  const visiblePeople=[data.professor,...data.members];
  $('#people-grid').innerHTML=visiblePeople.map((person,index)=>`<article class="person-card"><div class="person-image"><img src="${escapeHTML(person.image)}" alt="${escapeHTML(person.name)}" loading="lazy"></div><h3>${escapeHTML(person.name)}</h3><p class="person-role">${escapeHTML(person.role)}</p><p class="person-field">${escapeHTML(person.field)}</p><a class="person-email" href="mailto:${escapeHTML(person.email)}">${escapeHTML(person.email)}</a></article>`).join('');
  $('#team-button').addEventListener('click',()=>openDialog(`<p class="eyebrow">THE PEOPLE OF CCRL</p><h2 id="dialog-title">Meet our team</h2><p>Diverse backgrounds, shared curiosity, and a commitment to understanding our changing climate.</p><a class="text-link" href="${escapeHTML(data.professor.cv)}" target="_blank" rel="noopener">Download Dasol Kim’s CV</a><div class="team-list">${[data.professor,...data.members].map(person=>`<article class="team-member"><h3>${escapeHTML(person.name)}</h3><p>${escapeHTML(person.role)}${person.field?` · ${escapeHTML(person.field)}`:''}</p><a href="mailto:${escapeHTML(person.email)}">${escapeHTML(person.email)}</a></article>`).join('')}</div>`));
  let year='all',query='',expanded=false;
  function renderPublications(){const filtered=data.publications.filter(p=>(year==='all'||(year==='earlier'?Number(p.year)<2023:String(p.year)===year))&&`${p.title} ${p.citation} ${p.journal}`.toLowerCase().includes(query));const visible=expanded?filtered:filtered.slice(0,4);$('#publication-status').textContent=`${filtered.length} publications found. Showing ${visible.length}.`;$('#publication-list').innerHTML=visible.length?visible.map(p=>{const url=p.doi?`https://doi.org/${p.doi}`:`https://scholar.google.com/scholar?q=${encodeURIComponent(p.title)}`;const where=p.doi?'the publisher':'Google Scholar';return `<article class="publication-row"><span class="pub-year">${escapeHTML(p.year)}</span><div><h3><a href="${escapeHTML(url)}" target="_blank" rel="noopener" aria-label="Read ${escapeHTML(p.title)} at ${where}">${escapeHTML(p.title)}</a></h3><p>${escapeHTML(p.citation)}</p></div></article>`;}).join(''):'<p class="empty-state">No publications found. Try another keyword or year.</p>';$('#publications-more').hidden=filtered.length<=4;$('#publications-more').style.display=filtered.length<=4?'none':'flex';$('#publications-more').innerHTML=expanded?'Show fewer publications <span aria-hidden="true">↑</span>':`View all ${filtered.length} publications <span aria-hidden="true">↓</span>`;}
  $('.year-filters').addEventListener('click',event=>{const button=event.target.closest('[data-year]');if(!button)return;year=button.dataset.year;expanded=false;document.querySelectorAll('[data-year]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});renderPublications();});
  $('#publication-search').addEventListener('input',event=>{query=event.target.value.trim().toLowerCase();expanded=false;renderPublications();});
  $('#publications-more').addEventListener('click',()=>{expanded=!expanded;renderPublications();if(!expanded)$('#publications').scrollIntoView({behavior:reducedMotion?'instant':'smooth'});});renderPublications();
}
init().catch(error=>{console.error(error);$('#research-track').innerHTML='<p>Unable to load research content. Please refresh the page.</p>';$('#publication-list').innerHTML='<p>Unable to load publications. Please refresh the page.</p>';});
