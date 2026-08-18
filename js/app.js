(function () {
  'use strict';

  var products = (window.PRODUCTS || []).slice().sort(function (a, b) {
    return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
  });
  var activeFilter = 'all';
  var picks = loadPicks();
  var activeProduct = null;
  var imageIndex = 0;
  var previousFocus = null;
  var touchStartX = null;

  var grid = document.getElementById('product-grid');
  var filters = document.getElementById('filters');
  var lightbox = document.getElementById('lightbox');
  var lightboxImage = document.getElementById('lightbox-image');
  var lightboxPick = document.getElementById('lightbox-pick');
  var tray = document.getElementById('picks-tray');
  var headerPicks = document.getElementById('header-picks');
  var picksSummary = document.getElementById('picks-summary');
  var picksPanel = document.getElementById('picks-panel');
  var picksList = document.getElementById('picks-list');

  function loadPicks() {
    try {
      var saved = JSON.parse(localStorage.getItem('glideline:picks') || '[]');
      return Array.isArray(saved) ? saved.filter(function (id) { return products.some(function (p) { return p.id === id; }); }) : [];
    } catch (error) {
      return [];
    }
  }

  function savePicks() {
    try { localStorage.setItem('glideline:picks', JSON.stringify(picks)); } catch (error) { /* Storage can be unavailable in private contexts. */ }
  }

  function renderFilters() {
    window.CONFIG.categories.forEach(function (category) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'filter-button';
      button.textContent = category.label;
      button.dataset.filter = category.key;
      button.setAttribute('aria-pressed', String(category.key === activeFilter));
      button.addEventListener('click', function () { setFilter(category.key); });
      filters.appendChild(button);
    });
  }

  function productCard(product) {
    var article = document.createElement('article');
    article.className = 'product-card';
    article.dataset.category = product.category;
    article.dataset.id = product.id;
    article.innerHTML = '<button class="product-open" type="button" aria-label="View ' + product.name + '">' +
      '<span class="product-media"><img src="' + product.images[0] + '" alt="' + product.name + '" width="900" height="1200" loading="lazy">' +
      (product.images[1] ? '<img class="alternate" src="' + product.images[1] + '" alt="" width="900" height="1200" loading="lazy">' : '') + '</span>' +
      '<span class="product-caption"><span class="product-name">' + product.name + '</span><span class="product-code">' + product.id + '</span></span></button>' +
      '<button class="product-pick" type="button" aria-label="Add ' + product.name + ' to picks" aria-pressed="false"><span aria-hidden="true">+</span></button>';
    article.querySelector('.product-open').addEventListener('click', function () { openLightbox(product); });
    article.querySelector('.product-pick').addEventListener('click', function () { togglePick(product.id); });
    return article;
  }

  function renderProducts() {
    products.forEach(function (product) { grid.appendChild(productCard(product)); });
    syncPickButtons();
  }

  function setFilter(filter) {
    activeFilter = filter;
    var visible = 0;
    grid.querySelectorAll('.product-card').forEach(function (card) {
      var show = filter === 'all' || card.dataset.category === filter;
      card.classList.toggle('filtered-out', !show);
      if (show) visible += 1;
    });
    filters.querySelectorAll('button').forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.filter === filter));
    });
    document.getElementById('empty-state').hidden = visible !== 0;
  }

  function togglePick(id) {
    var index = picks.indexOf(id);
    if (index === -1) picks.push(id); else picks.splice(index, 1);
    savePicks();
    syncPickButtons();
  }

  function syncPickButtons() {
    grid.querySelectorAll('.product-card').forEach(function (card) {
      var picked = picks.indexOf(card.dataset.id) !== -1;
      var product = products.find(function (item) { return item.id === card.dataset.id; });
      var button = card.querySelector('.product-pick');
      button.setAttribute('aria-pressed', String(picked));
      button.setAttribute('aria-label', (picked ? 'Remove ' : 'Add ') + product.name + (picked ? ' from picks' : ' to picks'));
    });
    if (activeProduct) {
      var activePicked = picks.indexOf(activeProduct.id) !== -1;
      lightboxPick.textContent = activePicked ? 'Remove from picks' : 'Add to picks';
      lightboxPick.setAttribute('aria-pressed', String(activePicked));
    }
    var count = picks.length;
    tray.hidden = count === 0;
    headerPicks.hidden = count === 0;
    headerPicks.querySelector('span').textContent = count;
    picksSummary.textContent = count + (count === 1 ? ' pick' : ' picks') + ' — View';
    var selected = picks.map(function (id) { return products.find(function (p) { return p.id === id; }); }).filter(Boolean);
    document.getElementById('send-picks').href = window.CONTACT.picksUrl(selected);
    renderPicksList(selected);
    if (count === 0) setPicksOpen(false);
  }

  function renderPicksList(selected) {
    picksList.innerHTML = '';
    selected.forEach(function (product) {
      var item = document.createElement('li');
      item.innerHTML = '<img class="pick-thumbnail" src="' + product.images[0] + '" alt="' + product.name + '" width="48" height="64"><span><span class="picked-name">' + product.name + '</span><span class="picked-code">' + product.id + '</span></span><button class="remove-pick" type="button">Remove</button>';
      var removeButton = item.querySelector('.remove-pick');
      removeButton.setAttribute('aria-label', 'Remove ' + product.name + ' from picks');
      removeButton.addEventListener('click', function () { togglePick(product.id); });
      picksList.appendChild(item);
    });
  }

  function setPicksOpen(open) {
    picksPanel.hidden = !open;
    picksSummary.setAttribute('aria-expanded', String(open));
    headerPicks.setAttribute('aria-expanded', String(open));
  }

  function togglePicksPanel() {
    setPicksOpen(picksPanel.hidden);
    if (!picksPanel.hidden) document.getElementById('close-picks').focus();
  }

  function renderVideos() {
    var videoGrid = document.getElementById('video-grid');
    (window.VIDEOS || []).forEach(function (video) {
      var article = document.createElement('article');
      article.className = 'video-card';
      article.innerHTML = '<a class="video-image" href="' + video.url + '" target="_blank" rel="noopener" aria-label="Watch ' + video.title + '"><img src="' + video.thumb + '" alt="" width="800" height="600" loading="lazy"><span class="play" aria-hidden="true">▶</span></a><h3>' + video.title + '</h3><p class="video-note">' + video.note + '</p>';
      videoGrid.appendChild(article);
    });
  }

  function updateLightboxImage() {
    lightboxImage.src = activeProduct.images[imageIndex];
    lightboxImage.alt = activeProduct.name + (activeProduct.images.length > 1 ? ', view ' + (imageIndex + 1) : '');
    document.getElementById('image-count').textContent = (imageIndex + 1) + ' / ' + activeProduct.images.length;
    var multiple = activeProduct.images.length > 1;
    lightbox.querySelectorAll('.lightbox-arrow').forEach(function (arrow) { arrow.hidden = !multiple; });
  }

  function openLightbox(product, fromHash) {
    activeProduct = product;
    imageIndex = 0;
    previousFocus = document.activeElement;
    document.getElementById('lightbox-code').textContent = product.id;
    document.getElementById('lightbox-name').textContent = product.name;
    document.getElementById('lightbox-note').textContent = product.note || '';
    document.getElementById('lightbox-enquire').href = window.CONTACT.enquireUrl(product);
    updateLightboxImage();
    syncPickButtons();
    lightbox.hidden = false;
    document.body.classList.add('modal-open');
    if (!fromHash) history.pushState(null, '', '#' + product.id);
    lightbox.querySelector('.lightbox-close').focus();
  }

  function closeLightbox(fromHistory) {
    if (!activeProduct) return;
    lightbox.hidden = true;
    document.body.classList.remove('modal-open');
    activeProduct = null;
    if (!fromHistory && location.hash) history.pushState(null, '', location.pathname + location.search);
    if (previousFocus && document.contains(previousFocus)) previousFocus.focus();
  }

  function changeImage(direction) {
    if (!activeProduct) return;
    imageIndex = (imageIndex + direction + activeProduct.images.length) % activeProduct.images.length;
    updateLightboxImage();
  }

  function handleHash() {
    var id = decodeURIComponent(location.hash.slice(1)).toUpperCase();
    var product = products.find(function (item) { return item.id.toUpperCase() === id; });
    if (product && (!activeProduct || activeProduct.id !== product.id)) openLightbox(product, true);
    if (!product && activeProduct) closeLightbox(true);
  }

  function focusTrap(event) {
    var focusable = Array.prototype.slice.call(lightbox.querySelectorAll('button:not([hidden]), a[href], [tabindex]:not([tabindex="-1"])'));
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  document.querySelector('.lightbox-close').addEventListener('click', function () { closeLightbox(false); });
  lightbox.querySelector('.previous').addEventListener('click', function () { changeImage(-1); });
  lightbox.querySelector('.next').addEventListener('click', function () { changeImage(1); });
  lightboxPick.addEventListener('click', function () { if (activeProduct) togglePick(activeProduct.id); });
  lightbox.addEventListener('click', function (event) { if (event.target === lightbox) closeLightbox(false); });
  lightbox.addEventListener('touchstart', function (event) { touchStartX = event.changedTouches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend', function (event) { var delta = event.changedTouches[0].clientX - touchStartX; if (Math.abs(delta) > 50) changeImage(delta > 0 ? -1 : 1); }, { passive: true });
  document.addEventListener('keydown', function (event) {
    if (!activeProduct) return;
    if (event.key === 'Escape') closeLightbox(false);
    if (event.key === 'ArrowLeft') changeImage(-1);
    if (event.key === 'ArrowRight') changeImage(1);
    if (event.key === 'Tab') focusTrap(event);
  });
  headerPicks.setAttribute('aria-expanded', 'false');
  headerPicks.addEventListener('click', togglePicksPanel);
  picksSummary.addEventListener('click', togglePicksPanel);
  document.getElementById('close-picks').addEventListener('click', function () { setPicksOpen(false); picksSummary.focus(); });
  window.addEventListener('hashchange', handleHash);

  function setContactLinks() {
    document.getElementById('whatsapp-link').href = window.CONTACT.helloUrl();
    document.getElementById('footer-whatsapp').href = window.CONTACT.helloUrl();
    document.getElementById('instagram-link').href = window.CONTACT.instagramUrl();
    document.getElementById('footer-instagram').href = window.CONTACT.instagramUrl();
  }

  renderFilters();
  renderProducts();
  renderVideos();
  setContactLinks();
  syncPickButtons();
  handleHash();
}());
