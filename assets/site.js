// Armory.Reel: the phone menu, and on weapon pages the gallery tabs and lightbox.
// The gallery grid is written by scripts/build.py; the lightbox reads the same list
// from the #gallery-data JSON (photos: src, cap, meta; videos: yt, cap, meta, dur).
(function(){
  var menu = document.querySelector('.menu');
  if (menu) menu.onclick = function(e){ e.preventDefault(); document.querySelector('header').classList.toggle('open'); };

  var data = document.getElementById('gallery-data');
  if (!data) return;
  var GALLERY = JSON.parse(data.textContent);

  document.querySelectorAll('.gtabs button').forEach(function(b){ b.onclick = function(){
    document.querySelectorAll('.gtabs button').forEach(function(x){ x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); });
    document.getElementById('galPhotos').classList.toggle('hide', b.dataset.t !== 'photos');
    document.getElementById('galVideos').classList.toggle('hide', b.dataset.t !== 'videos');
  }; });
  var chip = document.querySelector('.galchip');
  if (chip) chip.onclick = function(e){ e.preventDefault(); document.getElementById('gallery').scrollIntoView({behavior: 'smooth'}); };

  function slot(i, label){ return '<span class="slot"><b>' + (i + 1) + '</b>' + label + '</span>'; }
  var lb = document.getElementById('lb'), cur = null;
  function open(k, i){
    var list = GALLERY[k]; i = (i + list.length) % list.length; cur = {k: k, i: i};
    var it = list[i], m = document.getElementById('lbMedia');
    if (k === 'videos') m.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + it.yt + '?autoplay=1" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
    else m.innerHTML = slot(i, 'Photo') + '<img src="' + it.src + '" alt="">';
    document.getElementById('lbCap').textContent = it.cap;
    document.getElementById('lbMeta').textContent = it.meta + (it.dur ? ' · ' + it.dur : '') + ' · ' + (i + 1) + ' of ' + list.length;
    lb.classList.remove('hide'); document.body.style.overflow = 'hidden';
  }
  function close(){ lb.classList.add('hide'); document.getElementById('lbMedia').innerHTML = ''; document.body.style.overflow = ''; cur = null; }
  document.querySelectorAll('.gi').forEach(function(b){ b.onclick = function(){ open(b.dataset.k, +b.dataset.i); }; });
  lb.querySelector('.lb-x').onclick = close;
  lb.querySelector('.prev').onclick = function(){ open(cur.k, cur.i - 1); };
  lb.querySelector('.next').onclick = function(){ open(cur.k, cur.i + 1); };
  lb.onclick = function(e){ if (e.target === lb) close(); };
  document.addEventListener('keydown', function(e){
    if (!cur) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') open(cur.k, cur.i - 1);
    if (e.key === 'ArrowRight') open(cur.k, cur.i + 1);
  });
})();
