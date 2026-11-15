(function () {
  'use strict';

  var D = window.CO2_DATA;
  var acts = D.acts;
  var byId = {};
  acts.forEach(function (a, i) { a.index = i; byId[a.id] = a; });

  var PINE_KG = 9.1; // 30년 된 소나무 1그루가 1년에 흡수하는 이산화 탄소(환경부 안내서 기준)
  var AREA_ICON = { move: 'a-move', power: 'a-power', temp: 'a-temp', water: 'a-water', food: 'a-food', stuff: 'a-stuff' };

  var $ = function (id) { return document.getElementById(id); };
  var html = document.documentElement;

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function use(id) { return '<svg aria-hidden="true"><use href="#' + id + '"/></svg>'; }

  /* ---------- 첫 화면 카드 ---------- */
  var grid = $('grid');
  grid.innerHTML = acts.map(function (a) {
    return '<li><a class="tile" href="#act=' + a.id + '" data-area="' + a.area + '" data-id="' + a.id + '" aria-haspopup="dialog">' +
      '<span class="swatch">' + use(a.icon) + '</span>' +
      '<span class="t-body">' +
        '<span class="t-area">' + esc(D.areas[a.area].name) + '</span>' +
        '<span class="t-name">' + esc(a.name) + '</span>' +
        '<span class="t-num">' + use('g-down') + esc(a.value) + '<small>' + esc(a.unit) + '</small></span>' +
        '<span class="t-per">' + esc(a.per) + '</span>' +
      '</span>' +
      '<span class="t-plus">' + use('g-plus') + '</span>' +
    '</a></li>';
  }).join('');

  /* ---------- 바닥글 출처 ---------- */
  $('srcList').innerHTML = Object.keys(D.sources).map(function (k) {
    var s = D.sources[k];
    return '<li>' + esc(s.text) + ' — <a href="' + esc(s.url) + '" target="_blank" rel="noopener">누리집</a></li>';
  }).join('');
  $('photoList').innerHTML = acts.map(function (a) {
    var p = a.photo;
    return '<li>' + esc(a.name) + ': ' + esc(p.caption) + ' — ' + esc(p.author) + ', ' + esc(p.license) +
      ' (<a href="' + esc(p.page) + '" target="_blank" rel="noopener">원본</a>)</li>';
  }).join('');

  /* ---------- 상세 ---------- */
  var dlg = $('detail');
  var sheet = $('sheet');
  var current = null;
  var opener = null;

  function treesLine(a) {
    if (!a.exact) return '';
    var n = Math.round(a.exact / PINE_KG);
    if (n < 1) return '';
    var shown = Math.min(n, 10);
    var icons = '';
    for (var i = 0; i < shown; i++) icons += use('g-tree');
    return '<span class="tree-row" aria-hidden="true">' + icons + '</span>' +
      '<span>30년 된 소나무 <b>약 ' + n + '그루</b>가 1년 동안 흡수하는 양이에요.</span>';
  }

  function chainHtml(a) {
    var bs = a.why.burners;
    var burnerSvgs = bs.map(function (b) { return use('b-' + b); }).join('');
    var names = bs.map(function (b) { return D.burners[b].name; }).join(' · ');
    var less = a.why.less || D.burners[bs[0]].less;
    return '<div class="node"><span class="disc">' + use(a.icon) + '</span><span class="cap">실천하면</span></div>' +
      '<svg class="arrow" aria-hidden="true"><use href="#g-right"/></svg>' +
      '<div class="node"><span class="burners' + (bs.length > 1 ? ' two' : '') + '">' + burnerSvgs + '</span>' +
        '<span class="cap"><b>' + esc(names) + '</b>' + esc(less) + '</span></div>' +
      '<svg class="arrow" aria-hidden="true"><use href="#g-right"/></svg>' +
      '<div class="node"><span class="co2">CO₂' + use('g-down') + '</span><span class="cap">이산화 탄소가 덜 나와요</span></div>';
  }

  function render(a) {
    sheet.setAttribute('data-area', a.area);
    $('dArea').innerHTML = use(AREA_ICON[a.area]) + esc(D.areas[a.area].name);

    var p = a.photo;
    $('dPhoto').innerHTML =
      '<div class="frame"><img src="' + esc(p.src) + '" alt="' + esc(p.alt) + '" width="960" height="720"></div>' +
      '<figcaption>' + esc(p.caption) +
        '<span class="credit">사진: <a href="' + esc(p.page) + '" target="_blank" rel="noopener">' + esc(p.author) + '</a> · ' + esc(p.license) + '</span>' +
      '</figcaption>';
    var img = $('dPhoto').querySelector('img');
    img.addEventListener('error', function () {
      img.parentNode.innerHTML = '<div class="fallback">' + use(a.icon) + '<span>사진을 불러오지 못했어요</span></div>';
    }, { once: true });

    $('dTitle').textContent = a.name;
    $('dReading').innerHTML = a.reading.map(function (paragraph) {
      return '<p>' + esc(paragraph) + '</p>';
    }).join('');
    $('dReadingNote').textContent = a.unit === 'kg'
      ? '이 글의 감축량은 안내서가 정한 조건으로 계산한 값이에요. 여러 온실가스가 지구를 덥히는 영향을 이산화 탄소의 양으로 바꾸어 나타냈어요. 실천하는 정도와 생활 환경에 따라 실제로 줄어드는 양은 달라질 수 있어요.'
      : '여기에서 24L는 샤워 한 번에 아끼는 물의 양이에요. 이산화 탄소 감축량과는 단위와 기준이 달라요.';
    $('dBig').innerHTML =
      '<span class="val">' + use('g-down') + (a.unit === 'kg' ? '<span class="approx">약</span>' : '') + esc(a.value) + '<small>' + esc(a.unit) + '</small></span>' +
      '<span class="per">' + esc(a.perLong) + '</span>';
    $('dBasis').textContent = a.basis;
    $('dTrees').innerHTML = treesLine(a);
    $('dQuote').innerHTML = '<span class="q-label">홍보 자료에 쓸 수 있는 한 문장</span><p>“' + esc(a.quote) + '”</p>';

    $('dChain').innerHTML = chainHtml(a);
    $('dCalc').innerHTML = a.calc.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('');
    $('dCalcNote').textContent = a.calcNote || '';
    $('dScroll').querySelectorAll('details').forEach(function (details) {
      details.open = false;
    });
    $('dSrc').innerHTML = a.sources.map(function (k) {
      var s = D.sources[k];
      return '<li>' + esc(s.text) + ' — <a href="' + esc(s.url) + '" target="_blank" rel="noopener">누리집</a></li>';
    }).join('') +
      '<li>사진: ' + esc(p.author) + ', ' + esc(p.license) + ' — <a href="' + esc(p.page) + '" target="_blank" rel="noopener">위키미디어 공용</a></li>';

    var prev = acts[(a.index + acts.length - 1) % acts.length];
    var next = acts[(a.index + 1) % acts.length];
    var bp = $('dPrev'), bn = $('dNext');
    bp.dataset.id = prev.id; bn.dataset.id = next.id;
    bp.querySelector('span').textContent = prev.name;
    bn.querySelector('span').textContent = next.name;
    bp.setAttribute('aria-label', '이전: ' + prev.name);
    bn.setAttribute('aria-label', '다음: ' + next.name);
    $('dScroll').scrollTop = 0;
  }

  function show(id) {
    var a = byId[id];
    if (!a) return;
    current = a;
    render(a);
    if (!dlg.open) {
      if (!opener) opener = document.activeElement;
      dlg.showModal();
      html.classList.add('modal-open');
    }
    $('dTitle').focus({ preventScroll: true });
  }

  function hideDialog() {
    if (dlg.open) dlg.close();
    html.classList.remove('modal-open');
    var target = current && grid.querySelector('[data-id="' + current.id + '"]');
    if (target) target.focus({ preventScroll: true });
    else if (opener && opener.focus) opener.focus({ preventScroll: true });
    opener = null;
  }

  function requestClose() {
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    hideDialog();
  }

  function go(id) { location.replace('#act=' + id); }

  function route() {
    var m = location.hash.match(/^#act=([a-z0-9-]+)$/);
    if (m && byId[m[1]]) show(m[1]);
    else if (dlg.open) hideDialog();
  }

  $('dClose').addEventListener('click', requestClose);
  $('dPrev').addEventListener('click', function () { go(this.dataset.id); });
  $('dNext').addEventListener('click', function () { go(this.dataset.id); });
  dlg.addEventListener('cancel', function (e) { e.preventDefault(); requestClose(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) requestClose(); });
  dlg.addEventListener('keydown', function (e) {
    if (e.target.closest && e.target.closest('summary, a')) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); go($('dPrev').dataset.id); }
    if (e.key === 'ArrowRight') { e.preventDefault(); go($('dNext').dataset.id); }
  });
  grid.addEventListener('click', function (e) {
    var t = e.target.closest('.tile');
    if (t) opener = t;
  });

  window.addEventListener('hashchange', route);
  route();
})();
