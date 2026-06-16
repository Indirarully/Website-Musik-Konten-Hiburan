// ── SIDEBAR v3 FINAL ──
function buildSidebar(activePage){
  const pages=[
    {href:'index.html',icon:'ti-layout-dashboard',label:'Dashboard',section:'Menu Utama'},
    {href:'profile.html',icon:'ti-user-circle',label:'Profil Saya'},
    {href:'history.html',icon:'ti-history',label:'Riwayat Pencarian',section:'Riwayat'},
    {href:'favorites.html',icon:'ti-heart',label:'Favorit Saya'},
    {href:'stats.html',icon:'ti-chart-bar',label:'Statistik',section:'Lainnya'},
    {href:'notifications.html',icon:'ti-bell',label:'Notifikasi'},
    {href:'settings.html',icon:'ti-settings',label:'Pengaturan'},
    {href:'about.html',icon:'ti-info-circle',label:'Tentang Aplikasi'},
  ];
  let html=`
  <div class="overlay" id="overlay" onclick="toggleSidebar()"></div>
  <div class="sidebar" id="sidebar">
    <div class="brand">
      <div class="brand-icon"><i class="ti ti-music"></i></div>
      <span class="brand-name">Music<span>Rec</span></span>
    </div>`;
  pages.forEach(p=>{
    if(p.section) html+=`<span class="nav-section">${p.section}</span>`;
    const a=activePage===p.href?'active':'';
    html+=`<a class="nav-item ${a}" href="${p.href}"><span class="nav-icon"><i class="ti ${p.icon}"></i></span><span>${p.label}</span></a>`;
  });
  html+=`<div class="sidebar-footer">
    <button class="logout-btn" onclick="logout()"><span class="nav-icon"><i class="ti ti-logout"></i></span><span>Keluar</span></button>
  </div></div>`;
  document.body.insertAdjacentHTML('afterbegin',html);
}

function buildTopbar(title, showSearch=false){
  const s=showSearch?`
    <div class="search-wrap">
      <div class="search-bar">
        <i class="ti ti-search" style="color:var(--pink);font-size:14px;flex-shrink:0"></i>
        <input type="text" id="searchInput" placeholder="Cari lagu Deezer..." autocomplete="off" oninput="onSearch(this.value)"/>
        <i class="ti ti-x" id="sClear" style="color:var(--sub);font-size:13px;cursor:pointer;display:none;flex-shrink:0" onclick="clearSearch()"></i>
      </div>
      <div id="searchDrop" class="search-dropdown"></div>
    </div>`:'';
  // Inject topbar into .main
  const main=document.querySelector('.main');
  if(!main){console.error('No .main found');return;}
  const topbarEl=document.createElement('div');
  topbarEl.className='topbar';
  topbarEl.innerHTML=`
    <button class="hamburger" id="hamburger" onclick="toggleSidebar()"><i class="ti ti-menu-2"></i></button>
    <h1>${title}</h1>
    ${s}
    <div class="avatar ripple" onclick="window.location.href='profile.html'" title="Profil"><i class="ti ti-user"></i></div>`;
  main.insertBefore(topbarEl, main.firstChild);
}

function toggleSidebar(){
  const sb=document.getElementById('sidebar');
  const ov=document.getElementById('overlay');
  const hb=document.getElementById('hamburger');
  if(!sb||!ov)return;
  sb.classList.toggle('open');
  ov.classList.toggle('show');
  if(hb) hb.style.transform=sb.classList.contains('open')?'rotate(90deg) scale(1.1)':'';
}

function logout(){if(confirm('Yakin mau keluar?'))window.location.href='login.html';}

// ── DEEZER SEARCH ──
let _st=null;
function onSearch(q){
  clearTimeout(_st);
  const drop=document.getElementById('searchDrop');
  const cl=document.getElementById('sClear');
  if(cl)cl.style.display=q?'block':'none';
  if(!q||!q.trim()){if(drop)drop.classList.remove('show');return;}
  drop.innerHTML='<div class="search-loading"><i class="ti ti-loader-2" style="display:inline-block;animation:spin 1s linear infinite"></i> Mencari...</div>';
  drop.classList.add('show');
  _st=setTimeout(()=>doSearch(q),600);
}
function clearSearch(){
  const inp=document.getElementById('searchInput');
  const drop=document.getElementById('searchDrop');
  const cl=document.getElementById('sClear');
  if(inp)inp.value='';
  if(drop)drop.classList.remove('show');
  if(cl)cl.style.display='none';
}
async function doSearch(q){
  const drop=document.getElementById('searchDrop');
  if(!drop)return;
  try{
    const res=await fetch(`https://corsproxy.io/?${encodeURIComponent('https://api.deezer.com/search?q='+q+'&limit=8')}`);
    const data=await res.json();
    const tracks=data.data||[];
    if(!tracks.length){drop.innerHTML='<div class="search-loading">Tidak ditemukan 😢</div>';return;}
    drop.innerHTML=tracks.map(t=>`
      <div class="search-item" onclick='playTrack(${JSON.stringify(t).replace(/'/g,"&#39;")})'>
        <img class="search-cover" src="${t.album?.cover_small||''}" onerror="this.style.display='none'"/>
        <div class="search-info">
          <div class="search-title">${t.title}</div>
          <div class="search-sub">${t.artist?.name||''} · 30s preview</div>
        </div>
        <i class="ti ti-player-play" style="color:var(--pink);font-size:14px;flex-shrink:0"></i>
      </div>`).join('');
  }catch(e){drop.innerHTML='<div class="search-loading">Gagal koneksi 😢</div>';}
}
function playTrack(t){
  clearSearch();
  const song={t:t.title,a:t.artist?.name||'',g:t.album?.title||'',url:t.preview||'',cover:t.album?.cover_medium||''};
  if(typeof openPlayer==='function') openPlayer(song);
  saveHistory({title:t.title,artist:t.artist?.name||'',genre:'',time:new Date().toLocaleString('id-ID')});
  if(typeof updateStats==='function') updateStats();
  if(typeof renderHistoryTable==='function') renderHistoryTable();
}
document.addEventListener('click',e=>{
  const drop=document.getElementById('searchDrop');
  if(drop&&!e.target.closest('.search-wrap'))drop.classList.remove('show');
});

// ── STORAGE ──
function saveHistory(item){
  let h=JSON.parse(localStorage.getItem('mr_history')||'[]');
  h=[item,...h.filter(x=>x.title!==item.title)].slice(0,50);
  localStorage.setItem('mr_history',JSON.stringify(h));
}
function getHistory(){return JSON.parse(localStorage.getItem('mr_history')||'[]');}
function saveFavorite(item){
  let f=JSON.parse(localStorage.getItem('mr_favs')||'[]');
  if(!f.find(x=>x.title===item.title)){f.unshift(item);localStorage.setItem('mr_favs',JSON.stringify(f));}
}
function removeFavorite(title){
  let f=JSON.parse(localStorage.getItem('mr_favs')||'[]');
  localStorage.setItem('mr_favs',JSON.stringify(f.filter(x=>x.title!==title)));
}
function getFavorites(){return JSON.parse(localStorage.getItem('mr_favs')||'[]');}
function saveRating(item){
  let r=JSON.parse(localStorage.getItem('mr_ratings')||'[]');
  r=[item,...r.filter(x=>x.title!==item.title)];
  localStorage.setItem('mr_ratings',JSON.stringify(r));
}
function getRatings(){return JSON.parse(localStorage.getItem('mr_ratings')||'[]');}
function getNotifs(){return JSON.parse(localStorage.getItem('mr_notifs')||'[]');}
function clearNotifs(){localStorage.removeItem('mr_notifs');}
