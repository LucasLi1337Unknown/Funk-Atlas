'use strict';
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let data,filter='all',limit=24,saved=new Set();
try{saved=new Set(JSON.parse(localStorage.getItem('funk-atlas-saved')||'[]'));}catch{}
const colors=['#a58bf6','#d5f65c','#e9b0cf','#9ccdd0','#e0b876'];
function key(s){return s.track;}
function notify(t){$('#toast').textContent=t;$('#toast').classList.add('visible');clearTimeout(notify.timer);notify.timer=setTimeout(()=>$('#toast').classList.remove('visible'),1800);}
function renderSongs(){
 const q=$('#search').value.trim().toLocaleLowerCase();let a=data.songs.filter(s=>(filter!=='core'||s.core)&&(filter!=='saved'||saved.has(key(s)))&&(!q||(s.title+' '+s.artists.join(' ')).toLocaleLowerCase().includes(q)));
 const sort=$('#sort').value;a.sort(sort==='az'?(a,b)=>a.title.localeCompare(b.title):sort==='newest'?(a,b)=>(b.date||'').localeCompare(a.date||''):(a,b)=>b.sources.length-a.sources.length||a.title.localeCompare(b.title));
 $('#result-count').textContent=a.length+' tracks · showing '+Math.min(limit,a.length);
 $('#songs').innerHTML=a.length?a.slice(0,limit).map((s,i)=>`<article class="song-card"><div class="song-top"><div class="mini-art" style="--card-color:${colors[i%colors.length]}" aria-hidden="true">${['◉','✳','↗','≋','✦'][i%5]}</div><button class="save ${saved.has(key(s))?'saved':''}" data-save="${esc(key(s))}" aria-label="${saved.has(key(s))?'Unsave':'Save'} ${esc(s.title)}" aria-pressed="${saved.has(key(s))}">${saved.has(key(s))?'♥':'♡'}</button></div><h3>${esc(s.title)}</h3><p class="artist-line">${esc(s.artists.join(' · '))}</p><div class="song-bottom"><span class="tag">${s.sources.length} SOURCE${s.sources.length===1?'':'S'}${s.core?' / CROSS-PLAYLIST':''}</span><a href="https://open.spotify.com/track/${encodeURIComponent(s.track)}" target="_blank" rel="noopener">Listen on Spotify ↗</a></div></article>`).join(''):'<p class="empty">'+(filter==='saved'?'Your collection starts here. Tap ♡ on a track to save it.':'No tracks found. Try another song or artist.')+'</p>';
 $('#load-more').hidden=limit>=a.length;
}
function showArtist(name){
 const ranks=$('#ranking-mode').value==='core'?data.ranking:data.broadRanking;const artist=ranks.find(r=>r.artist===name);if(!artist)return;
 $('#dialog-title').textContent=name;$('#dialog-count').textContent=artist.count+' distinct songs in the selected set';
 $('#dialog-songs').innerHTML=artist.songs.map(t=>{const s=data.songs.find(s=>s.title===t&&s.artists.includes(name));return `<div class="dialog-song"><span>${esc(t)}</span>${s?`<a href="https://open.spotify.com/track/${encodeURIComponent(s.track)}" target="_blank" rel="noopener">Listen ↗</a>`:''}</div>`;}).join('');$('#artist-dialog').showModal();
}
function renderRanking(){
 const core=$('#ranking-mode').value==='core';const ranks=core?data.ranking:data.broadRanking;
 $('#rank-description').textContent=core?'One appearance per distinct song in the cross-playlist set. A transparent sample count—not a worldwide popularity chart.':'All collected candidates, including single-source songs and older releases with unverified revival dates. This count is especially sensitive to playlist selection.';
 $('#podium').innerHTML=ranks.slice(0,3).map((r,i)=>`<div class="podium-card"><button data-artist="${esc(r.artist)}"><span class="number">0${i+1}</span><span class="arrow">↗</span><h3>${esc(r.artist)}</h3><p>${r.count} DISTINCT SONGS · RANK ${r.rank}${ranks.filter(x=>x.count===r.count).length>1?' (TIED)':''}</p></button></div>`).join('');
 $('#rankings').innerHTML=ranks.slice(0,100).map(r=>`<tr><td>${String(r.rank).padStart(2,'0')}</td><td>${esc(r.artist)}</td><td>${r.count}</td><td><button data-artist="${esc(r.artist)}">View songs ↗</button></td></tr>`).join('');
}
async function init(){try{
 const r=await fetch('data.json');if(!r.ok)throw Error('Dataset unavailable');data=await r.json();
 $('#song-total').textContent=data.songs.length;$('#core-total').textContent=data.songs.filter(s=>s.core).length;$('#source-total').textContent=Object.keys(data.sources).length;
 $('#sources').innerHTML=Object.entries(data.sources).map(([id,n])=>`<li><a href="https://open.spotify.com/playlist/${encodeURIComponent(id)}" target="_blank" rel="noopener">${esc(n)} ↗</a></li>`).join('');renderSongs();renderRanking();
}catch(e){$('#songs').innerHTML='<p class="empty">The collection could not load. Please refresh to try again.</p>';$('#load-more').hidden=true;}}
$('#search').addEventListener('input',()=>{limit=24;if(data)renderSongs();});$('#sort').addEventListener('change',()=>{limit=24;if(data)renderSongs();});
document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;limit=24;document.querySelectorAll('[data-filter]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b?'true':'false');});if(data)renderSongs();}));
$('#load-more').addEventListener('click',()=>{limit+=24;renderSongs();});$('#ranking-mode').addEventListener('change',()=>{if(data)renderRanking();});
document.addEventListener('click',e=>{const save=e.target.closest('[data-save]');if(save){const k=save.dataset.save;const was=saved.has(k);was?saved.delete(k):saved.add(k);try{localStorage.setItem('funk-atlas-saved',JSON.stringify([...saved]));}catch{}renderSongs();notify(was?'Removed from saved tracks':'Saved to your collection');}const artist=e.target.closest('[data-artist]');if(artist)showArtist(artist.dataset.artist);});
$('#close-dialog').addEventListener('click',()=>$('#artist-dialog').close());$('#artist-dialog').addEventListener('click',e=>{if(e.target===$('#artist-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!$('#artist-dialog').open){e.preventDefault();$('#search').focus();}});init();
