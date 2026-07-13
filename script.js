// CTA endpoint — TODO: подставить ссылку на бота/Calendly/Tally, если форма не нужна
  const FORM_ENDPOINT = ""; // если пусто — заявка логируется в консоль

  /* ── Career ruler: запуск анимации при загрузке ── */
  window.addEventListener('load', function () {
    requestAnimationFrame(function () {
      document.getElementById('ruler').classList.add('run');
    });
  });

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

  /* ── Modal ── */
  const modal = document.getElementById('modal');
  const formWrap = document.getElementById('formWrap');
  const successMsg = document.getElementById('successMsg');
  let lastFocus = null;

  function openModal(e) {
    if (e) e.preventDefault();
    lastFocus = document.activeElement;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { document.getElementById('f-name').focus(); }, 220);
  }
  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  document.querySelectorAll('.js-open').forEach(function (b) { b.addEventListener('click', openModal); });
  document.getElementById('modalClose').addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });

  /* ── Form validation + submit ── */
  const form = document.getElementById('leadForm');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const fields = form.querySelectorAll('[data-field]');
    let ok = true;
    fields.forEach(function (f) {
      const input = f.querySelector('input');
      if (!input.value.trim()) { f.classList.add('invalid'); ok = false; }
      else { f.classList.remove('invalid'); }
    });
    if (!ok) return;

    const data = {
      name: form.name.value.trim(),
      contact: form.contact.value.trim(),
      message: form.message.value.trim()
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
