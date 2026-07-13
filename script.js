// CTA endpoint — TODO: подставить ссылку на бота/Calendly/Tally, если форма не нужна
  const FORM_ENDPOINT = ""; // если пусто — заявка логируется в консоль

  /* ── Career progress rail: заполнение по скроллу ── */
  const rail = document.getElementById('rail');
  if (rail) {
    const railFill = document.getElementById('railFill');
    const nodes = Array.prototype.slice.call(rail.querySelectorAll('.rail-node'));
    const labels = Array.prototype.slice.call(rail.querySelectorAll('.rail-lb'));
    const sections = Array.prototype.slice.call(document.querySelectorAll('section'));
    const stops = [0, 0.5, 1]; // Исполнитель / Старший специалист / Руководитель
    const SHOW_AT = 60; // px прокрутки, после которых бар выезжает
    let ticking = false;

    function updateRail() {
      ticking = false;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;

      rail.classList.toggle('visible', window.scrollY > SHOW_AT);
      railFill.style.width = (p * 100).toFixed(2) + '%';
      for (let i = 0; i < nodes.length; i++) {
        const on = p >= stops[i] - 0.001;
        nodes[i].classList.toggle('is-active', on);
        if (labels[i]) labels[i].classList.toggle('is-active', on);
      }

      // цвет полосы под текущей секцией
      const y = rail.offsetHeight + 2;
      let dark = true;
      for (let j = 0; j < sections.length; j++) {
        const r = sections[j].getBoundingClientRect();
        if (r.top <= y && r.bottom >= y) { dark = sections[j].classList.contains('s-dark'); break; }
      }
      rail.classList.toggle('on-light', !dark);
    }

    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(updateRail); }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateRail);
    updateRail();
  }

  /* ── Reveal on scroll ── */
  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e, i) {
      if (e.isIntersecting) {
        e.target.style.transitionDelay = (e.target.dataset.stagger || 0) + 'ms';
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  // stagger checklists within each list
  document.querySelectorAll('.checklist').forEach(function (list) {
    list.querySelectorAll('.reveal').forEach(function (li, i) { li.dataset.stagger = i * 80; });
  });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  /* ── Modals (форма, политика, согласие) ── */
  const formWrap = document.getElementById('formWrap');
  const successMsg = document.getElementById('successMsg');
  const formModal = document.getElementById('modal');
  const modalStack = [];
  let lastFocus = null;

  function openModal(target, e) {
    if (e) e.preventDefault();
    const m = typeof target === 'string' ? document.getElementById(target) : target;
    if (!m || m.classList.contains('open')) return;
    if (modalStack.length === 0) lastFocus = document.activeElement;
    m.classList.add('open');
    document.body.style.overflow = 'hidden';
    modalStack.push(m);
    const focusEl = m.querySelector('input, textarea') || m.querySelector('.modal-close');
    if (focusEl) setTimeout(function () { focusEl.focus(); }, 220);
  }
  function closeModal(m) {
    if (!m) return;
    const i = modalStack.indexOf(m);
    if (i > -1) modalStack.splice(i, 1);
    m.classList.remove('open');
    // прокрутка модалки — наверх, чтобы при повторном открытии начиналась сначала
    const sc = m.querySelector('.modal-scroll');
    if (sc) sc.scrollTop = 0;
    if (modalStack.length === 0) {
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    }
  }

  // триггеры открытия
  document.querySelectorAll('.js-open').forEach(function (b) {
    b.addEventListener('click', function (e) { openModal(formModal, e); });
  });
  document.querySelectorAll('.js-modal').forEach(function (b) {
    b.addEventListener('click', function (e) { openModal(b.dataset.modal, e); });
  });
  // закрытие: клик по фону и по кнопке ×
  document.querySelectorAll('.modal-backdrop').forEach(function (bd) {
    bd.addEventListener('click', function (e) { if (e.target === bd) closeModal(bd); });
    const btn = bd.querySelector('.modal-close');
    if (btn) btn.addEventListener('click', function () { closeModal(bd); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modalStack.length) closeModal(modalStack[modalStack.length - 1]);
  });

  /* ── Form validation + submit ── */
  const form = document.getElementById('leadForm');
  const consentField = form.querySelector('[data-field-consent]');
  const consentInput = document.getElementById('f-consent');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const fields = form.querySelectorAll('[data-field]');
    let ok = true;
    fields.forEach(function (f) {
      const input = f.querySelector('input');
      if (!input.value.trim()) { f.classList.add('invalid'); ok = false; }
      else { f.classList.remove('invalid'); }
    });

    // согласие на обработку ПДн обязательно (152-ФЗ)
    if (!consentInput.checked) { consentField.classList.add('invalid'); ok = false; }
    else { consentField.classList.remove('invalid'); }

    if (!ok) return;

    const data = {
      name: form.name.value.trim(),
      contact: form.contact.value.trim(),
      message: form.message.value.trim(),
      consent: true,
      consent_at: new Date().toISOString()
    };

    if (FORM_ENDPOINT) {
      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(function (err) { console.error(err); });
    } else {
      console.log('Заявка:', data);
    }

    formWrap.style.display = 'none';
    successMsg.style.display = 'block';
  });

  // clear invalid state on input
  form.querySelectorAll('[data-field] input').forEach(function (i) {
    i.addEventListener('input', function () { i.closest('[data-field]').classList.remove('invalid'); });
  });
  consentInput.addEventListener('change', function () {
    if (consentInput.checked) consentField.classList.remove('invalid');
  });

  /* ── Cookie-баннер (первый заход) ── */
  const cookieBar = document.getElementById('cookieBar');
  if (cookieBar) {
    let accepted = false;
    try { accepted = localStorage.getItem('cookie_consent') === 'yes'; } catch (e) {}
    if (!accepted) {
      cookieBar.hidden = false;
      requestAnimationFrame(function () { cookieBar.classList.add('show'); });
    }
    document.getElementById('cookieOk').addEventListener('click', function () {
      try { localStorage.setItem('cookie_consent', 'yes'); } catch (e) {}
      cookieBar.classList.remove('show');
      setTimeout(function () { cookieBar.hidden = true; }, 300);
    });
  }
