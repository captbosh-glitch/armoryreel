// Armory.Reel: the phone menu, search, and on weapon and film pages the gallery tabs,
// film filters and lightbox. The gallery grid is written by scripts/build.py; the lightbox
// reads the same list from the #gallery-data JSON (photos: src, cap, meta, f; videos: yt,
// cap, meta, dur, f; f is the film's slug).
(function(){
  var menu = document.querySelector('.menu');
  if (menu) menu.onclick = function(e){ e.preventDefault(); document.querySelector('header').classList.toggle('open'); };

  // Search: every .sbox has an input and a .sresults list; the index (assets/search-index.json,
  // written by the build) loads on first use. Every word typed must start a word in the entry.
  var ROOT = document.body.dataset.root || '', INDEX = null, loading = null;
  var KIND = {Weapon: 0, Character: 1, Film: 2, Category: 3};
  function norm(t){ return (t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim(); }
  function load(){
    if (!loading) loading = fetch(ROOT + 'assets/search-index.json', {cache: 'no-cache'}).then(function(r){ return r.json(); }).then(function(rows){
      INDEX = rows.map(function(r){ r.tw = norm(r.t).split(' '); r.aw = (norm(r.t) + ' ' + norm(r.s) + ' ' + norm(r.w)).split(' '); return r; });
    });
    return loading;
  }
  function find(q){
    var qw = norm(q).split(' ').filter(Boolean), nq = norm(q);
    if (!qw.length) return [];
    function has(words, w){ return words.some(function(x){ return x.indexOf(w) === 0; }); }
    return INDEX.filter(function(r){ return qw.every(function(w){ return has(r.aw, w); }); }).map(function(r){
      var score = norm(r.t).indexOf(nq) === 0 ? 0 : qw.every(function(w){ return has(r.tw, w); }) ? 1 : 2;
      return {r: r, score: score};
    }).sort(function(a, b){ return a.score - b.score || KIND[a.r.k] - KIND[b.r.k] || a.r.t.localeCompare(b.r.t); })
      .slice(0, 8).map(function(x){ return x.r; });
  }
  function escHtml(t){ return t.replace(/[&<>"]/g, function(c){ return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); }
  document.querySelectorAll('.sbox').forEach(function(box){
    var input = box.querySelector('input'), list = box.querySelector('.sresults'), btn = box.querySelector('button'), on = -1;
    if (input.dataset.short && matchMedia('(max-width:720px)').matches) input.placeholder = input.dataset.short;
    function links(){ return list.querySelectorAll('a'); }
    function mark(i){ var a = links(); on = a.length ? (i + a.length) % a.length : -1; a.forEach(function(x, j){ x.classList.toggle('on', j === on); }); }
    function render(){
      var q = input.value.trim();
      if (!q){ list.classList.add('hide'); return; }
      load().then(function(){
        if (input.value.trim() !== q) return;
        var rows = find(q);
        list.innerHTML = rows.length ? rows.map(function(r){
          var ic = r.i ? '<img src="' + ROOT + r.i + '" alt="">' : escHtml(r.t.replace(/^the /i, '').charAt(0));
          return '<a href="' + ROOT + r.u + '" role="option"><span class="ic">' + ic + '</span><span class="tx"><b>' + escHtml(r.t) +
            '</b><span class="sb">' + escHtml(r.s) + '</span></span><span class="k mono">' + r.k + '</span></a>';
        }).join('') : '<div class="none">Nothing matches “' + escHtml(q) + '” yet.</div>';
        list.classList.remove('hide'); mark(0);
      });
    }
    function go(){ var a = links(); if (on >= 0 && a[on]) location.href = a[on].href; else if (input.value.trim()) render(); else input.focus(); }
    input.addEventListener('focus', function(){ load(); if (input.value.trim()) render(); });
    input.addEventListener('input', render);
    input.addEventListener('keydown', function(e){
      if (e.key === 'ArrowDown'){ e.preventDefault(); mark(on + 1); }
      else if (e.key === 'ArrowUp'){ e.preventDefault(); mark(on - 1); }
      else if (e.key === 'Enter'){ e.preventDefault(); go(); }
      else if (e.key === 'Escape'){ list.classList.add('hide'); input.blur(); }
    });
    if (btn) btn.onclick = go;
    document.addEventListener('click', function(e){ if (!box.contains(e.target)) list.classList.add('hide'); });
  });

  var data = document.getElementById('gallery-data');
  if (!data) return;
  var GALLERY = JSON.parse(data.textContent);

  var tabs = document.querySelectorAll('.gtabs button'), film = '';
  function show(t){
    tabs.forEach(function(x){ x.classList.toggle('on', x.dataset.t === t); x.setAttribute('aria-selected', x.dataset.t === t); });
    document.getElementById('galPhotos').classList.toggle('hide', t !== 'photos');
    document.getElementById('galVideos').classList.toggle('hide', t !== 'videos');
  }
  tabs.forEach(function(b){ b.onclick = function(){ show(b.dataset.t); }; });
  // indexes into GALLERY[k] that the film filter lets through
  function vis(k){ return GALLERY[k].map(function(_, i){ return i; }).filter(function(i){ return !film || GALLERY[k][i].f === film; }); }
  // Film filter: hide the other films' tiles, renumber, recount the tabs, and keep the
  // big first photo and the lone-video width on whatever is now first or alone.
  function filter(f){
    film = f;
    var counts = {};
    ['photos', 'videos'].forEach(function(k){
      var box = document.getElementById(k === 'photos' ? 'galPhotos' : 'galVideos'), tiles = box.querySelectorAll('.gi'), n = vis(k).length, j = 0;
      tiles.forEach(function(t){
        var on = !film || t.dataset.f === film;
        t.hidden = !on; t.classList.remove('big', 'solo');
        if (!on) return;
        t.querySelector('.slot b').textContent = ++j;
        if (j === 1 && n >= 5) t.classList.add('big');
        if (n === 1) t.classList.add('solo');
      });
      if (k === 'photos') box.classList.toggle('few', n < 5);
      counts[k] = n;
    });
    tabs.forEach(function(b){ b.hidden = !counts[b.dataset.t]; b.querySelector('span').textContent = counts[b.dataset.t]; });
    var on = document.querySelector('.gtabs button.on');
    if (!on || !counts[on.dataset.t]) show(counts.photos ? 'photos' : 'videos');
  }
  document.querySelectorAll('.gfilms button').forEach(function(b){ b.onclick = function(){
    document.querySelectorAll('.gfilms button').forEach(function(x){ x.classList.toggle('on', x === b); });
    filter(b.dataset.f);
  }; });
  var chip = document.querySelector('.galchip');
  if (chip) chip.onclick = function(e){ e.preventDefault(); document.getElementById('gallery').scrollIntoView({behavior: 'smooth'}); };

  function slot(i, label){ return '<span class="slot"><b>' + (i + 1) + '</b>' + label + '</span>'; }
  var lb = document.getElementById('lb'), cur = null;
  // i indexes GALLERY[k]; the arrows and the count only cover what the film filter shows
  function open(k, i){
    var v = vis(k), pos = v.indexOf(i); cur = {k: k, i: i};
    var it = GALLERY[k][i], m = document.getElementById('lbMedia');
    if (k === 'videos') m.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + it.yt + '?autoplay=1" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
    else m.innerHTML = slot(pos, 'Photo') + '<img src="' + it.src + '" alt="">';
    document.getElementById('lbCap').textContent = it.cap;
    document.getElementById('lbMeta').textContent = it.meta + (it.dur ? ' · ' + it.dur : '') + ' · ' + (pos + 1) + ' of ' + v.length;
    lb.classList.remove('hide'); document.body.style.overflow = 'hidden';
  }
  function close(){ lb.classList.add('hide'); document.getElementById('lbMedia').innerHTML = ''; document.body.style.overflow = ''; cur = null; }
  document.querySelectorAll('.gi').forEach(function(b){ b.onclick = function(){ open(b.dataset.k, +b.dataset.i); }; });
  lb.querySelector('.lb-x').onclick = close;
  function step(d){ var v = vis(cur.k), p = v.indexOf(cur.i); open(cur.k, v[(p + d + v.length) % v.length]); }
  lb.querySelector('.prev').onclick = function(){ step(-1); };
  lb.querySelector('.next').onclick = function(){ step(1); };
  lb.onclick = function(e){ if (e.target === lb) close(); };
  document.addEventListener('keydown', function(e){
    if (!cur) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
})();
