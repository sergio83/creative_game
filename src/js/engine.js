'use strict';

/*
 * Engine: stage scaling, input, walking camera, turn-based clock with scheduled
 * events, knowledge that survives loops, dialog, modals and endings.
 * The story (js/story.js) plugs in content through Engine.boot(story).
 */
const Engine = (() => {
  const VIEW_W = 960;
  const START = 16 * 60 + 42;
  const END = 17 * 60;
  const SPEED = 330;            // px per second
  const REACH = 78;             // interaction distance
  const STORAGE_KEY = 'odoo-loop-memory-v1';

  const $ = (sel, root = document) => root.querySelector(sel);

  let story = null;
  let run = null;
  let busy = false;
  let started = false;
  let soundOn = true;
  let memory = loadMemory();

  const player = { x: 0, facing: 1, target: null, walking: false };
  const keys = { left: false, right: false };
  let nearId = null;

  // ------------------------------------------------------------------ memory

  function emptyMemory() {
    return { loops: 0, knowledge: [], endings: [], eggs: [] };
  }

  function loadMemory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...emptyMemory(), ...JSON.parse(raw) } : emptyMemory();
    } catch {
      return emptyMemory();
    }
  }

  function saveMemory() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(memory)); } catch { /* storage unavailable */ }
  }

  function resetMemory() {
    memory = emptyMemory();
    saveMemory();
  }

  const knows = key => memory.knowledge.includes(key);

  function learn(key) {
    if (knows(key)) return false;
    memory.knowledge.push(key);
    saveMemory();
    toast(`📓 ${story.knowledge[key]}`);
    sfx('learn');
    return true;
  }

  function egg(key, label) {
    if (memory.eggs.includes(key)) return;
    memory.eggs.push(key);
    saveMemory();
    toast(`🥚 Easter egg: ${label}`);
  }

  // --------------------------------------------------------------- run state

  const flag = key => run.flags.has(key);
  const time = () => run.time;
  const over = () => run.over;
  const interrupted = () => run.interrupted;

  function setFlag(key) {
    run.flags.add(key);
    render();
  }

  function count(key) {
    run.counters[key] = (run.counters[key] || 0) + 1;
    return run.counters[key];
  }

  /*
   * Advances the clock and fires every scheduled event that is now due.
   * Returns false when the loop ended. `interrupted()` tells whether an event fired.
   */
  async function spend(minutes) {
    if (run.over) return false;
    run.interrupted = false;
    run.time = Math.min(END, run.time + minutes);
    render();
    if (run.processing) return !run.over;

    run.processing = true;
    try {
      let ev;
      while (!run.over && (ev = story.events.find(e => e.at <= run.time && !run.fired.has(e.id)))) {
        run.fired.add(ev.id);
        if (ev.when && !ev.when()) continue;
        await ev.run();
        run.interrupted = true;
        render();
      }
      if (!run.over && run.time >= END) {
        run.interrupted = true;
        await story.timeout();
      }
    } finally {
      run.processing = false;
    }
    return !run.over;
  }

  // ----------------------------------------------------------------- sprites

  /* Pixel head-and-shoulders portrait of a cast member (canvas). */
  function face(id, opts) {
    return Sprites.portrait(id, story.cast[id].sprite, opts);
  }

  function sprite(id) {
    return Sprites.element(id, story.cast[id].sprite);
  }

  function buildChar(id) {
    const c = story.cast[id];
    const el = document.createElement('div');
    el.className = 'char' + (id === 'you' ? ' is-player' : ' spot');
    el.dataset.spot = id;
    el.innerHTML = `<div class="char-bubble"></div><div class="char-name">${c.name}</div>`;
    el.appendChild(sprite(id));
    el.insertAdjacentHTML('beforeend', '<div class="char-shadow"></div>');
    return el;
  }

  function buildDog() {
    const el = document.createElement('div');
    el.className = 'dog spot is-gone';
    el.dataset.spot = 'dog';
    el.style.backgroundImage = `url(${Sprites.dogSheet().url})`;
    return el;
  }

  function setTalking(who, on) {
    document.querySelectorAll('#world .char.is-talking').forEach(el => el.classList.remove('is-talking'));
    dlg.portrait.classList.toggle('is-talking', on);
    if (on) $(`[data-spot="${who}"]`, $('#world'))?.classList.add('is-talking');
  }

  // ------------------------------------------------------------------ dialog

  const dlg = {};

  function initDialog() {
    dlg.root = $('#dialog');
    dlg.portrait = $('#dialog-portrait');
    dlg.name = $('#dialog-name');
    dlg.role = $('#dialog-role');
    dlg.text = $('#dialog-text');
    dlg.choices = $('#dialog-choices');
    dlg.next = $('#dialog-next');
    dlg.root.addEventListener('click', e => {
      if (e.target.closest('.choice')) return;
      if (dlg.onAdvance) dlg.onAdvance();
    });
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  }

  function format(s) {
    return escapeHtml(s)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  }

  function setSpeaker(who) {
    const c = story.cast[who];
    dlg.root.classList.remove('hidden');
    dlg.root.dataset.speaker = who;
    dlg.portrait.innerHTML = '';
    if (c.sprite) {
      const idle = face(who);
      const talk = face(who, { frame: 4 });
      idle.className = 'p-idle';
      talk.className = 'p-talk';
      dlg.portrait.append(idle, talk);
    } else {
      dlg.portrait.innerHTML = `<span class="emoji">${c.emoji || ''}</span>`;
    }
    dlg.speaker = who;
    dlg.name.textContent = c.name;
    dlg.role.textContent = c.role || '';
  }

  function typeText(text) {
    const plain = text.replace(/[`*]/g, '');
    let i = 0;
    dlg.text.textContent = '';
    setTalking(dlg.speaker, true);
    return new Promise(resolve => {
      const finish = () => {
        clearInterval(timer);
        setTalking(dlg.speaker, false);
        dlg.typing = null;
        dlg.text.innerHTML = format(text);
        resolve();
      };
      const timer = setInterval(() => {
        i += 2;
        dlg.text.textContent = plain.slice(0, i);
        if (i % 8 === 0) sfx('blip');
        if (i >= plain.length) finish();
      }, 16);
      dlg.typing = finish;
    });
  }

  async function say(who, text) {
    if (run.over && !run.epilogue) return;
    setSpeaker(who);
    dlg.choices.innerHTML = '';
    dlg.next.hidden = true;
    dlg.onAdvance = () => dlg.typing && dlg.typing();
    await typeText(text);
    dlg.next.hidden = false;
    await new Promise(resolve => {
      dlg.onAdvance = () => { dlg.onAdvance = null; resolve(); };
    });
  }

  /* options: [{ label, cost?, when?, done?, tone?, ...anything }]. Resolves the picked option. */
  async function choose(who, text, options) {
    if (run.over && !run.epilogue) return null;
    const opts = options.filter(o => o && o.when !== false);
    setSpeaker(who);
    dlg.choices.innerHTML = '';
    dlg.next.hidden = true;
    dlg.onAdvance = () => dlg.typing && dlg.typing();
    if (text) await typeText(text);
    else dlg.text.textContent = '';
    dlg.onAdvance = null;

    return new Promise(resolve => {
      const pick = idx => {
        const o = opts[idx];
        if (!o) return;
        dlg.choices.innerHTML = '';
        dlg.pick = dlg.move = dlg.confirm = null;
        resolve(o);
      };
      opts.forEach((o, idx) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'choice' + (o.done ? ' is-done' : '') + (o.tone ? ` tone-${o.tone}` : '');
        b.innerHTML = `<span class="choice-key">${idx + 1}</span><span class="choice-label">${format(o.label)}</span>` +
          (o.cost ? `<span class="choice-cost">⏱ ${o.cost} min</span>` : '');
        b.addEventListener('click', ev => { ev.stopPropagation(); pick(idx); });
        b.addEventListener('mouseenter', () => setActive(idx));
        dlg.choices.appendChild(b);
      });
      let active = 0;
      const setActive = idx => {
        active = (idx + opts.length) % opts.length;
        [...dlg.choices.children].forEach((b, i) => b.classList.toggle('is-active', i === active));
      };
      setActive(0);
      dlg.pick = pick;
      dlg.move = delta => setActive(active + delta);
      dlg.confirm = () => pick(active);
    });
  }

  function hideDialog() {
    dlg.root.classList.add('hidden');
    dlg.onAdvance = dlg.pick = dlg.move = dlg.confirm = null;
  }

  async function runScript(fn) {
    if (busy || !run || run.over) return;
    busy = true;
    keys.left = keys.right = false;
    player.target = null;
    document.body.classList.add('is-busy');
    try {
      await fn();
    } catch (err) {
      console.error(err);
    } finally {
      busy = false;
      document.body.classList.remove('is-busy');
      hideDialog();
      render();
    }
  }

  // ------------------------------------------------------------------ modals

  function modal({ className = '', html, onMount, closable = true }) {
    return new Promise(resolve => {
      const wrap = document.createElement('div');
      wrap.className = 'modal';
      wrap.innerHTML = `<div class="modal-card ${className}">${closable ? '<button class="modal-close" type="button" aria-label="Cerrar">✕</button>' : ''}${html}</div>`;
      $('#modal-root').appendChild(wrap);
      const close = value => {
        if (!wrap.isConnected) return;
        wrap.remove();
        resolve(value);
      };
      wrap.close = close;
      wrap.closable = closable;
      wrap.querySelector('.modal-close')?.addEventListener('click', () => close());
      if (onMount) onMount(wrap, close);
    });
  }

  function topModal() {
    const all = document.querySelectorAll('#modal-root > .modal');
    return all[all.length - 1] || null;
  }

  function toast(text) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = format(text);
    $('#toast-root').appendChild(el);
    setTimeout(() => el.remove(), 4800);
  }

  // ----------------------------------------------------------------- endings

  /* e: { code, title, text[], lesson?, kind: 'bad'|'good'|'secret', onContinue? } */
  function ending(e) {
    if (run.over) return;
    run.over = true;
    hideDialog();
    if (!memory.endings.includes(e.code)) {
      memory.endings.push(e.code);
      saveMemory();
    }
    if (e.lesson) learn(e.lesson);
    sfx(e.kind === 'good' ? 'win' : e.kind === 'secret' ? 'ping' : 'fail');
    $('#stage').classList.add('is-frozen');
    setTimeout(() => showEndingCard(e), e.kind === 'secret' ? 300 : 1100);
  }

  function showEndingCard(e) {
    const el = document.createElement('div');
    el.className = `ending is-${e.kind}`;
    const lesson = e.lesson ? `<div class="ending-lesson"><b>Te llevás al próximo loop:</b> ${format(story.knowledge[e.lesson])}</div>` : '';
    el.innerHTML = `
      <div class="ending-title">${format(e.title)}</div>
      <div class="ending-code">${e.kind === 'good' ? '' : 'GAME OVER: '}${escapeHtml(e.code)}</div>
      <div class="ending-text">${e.text.map(format).join('<br>')}</div>
      ${lesson}
      <div class="btn-row">
        <button class="btn" type="button" data-act="go">${e.kind === 'good' ? 'Ver créditos ▶' : '◀◀ Volver a las 16:42'}</button>
        <button class="btn" type="button" data-act="notebook">📓 Cuaderno</button>
      </div>`;
    $('#modal-root').appendChild(el);
    el.querySelector('[data-act="go"]').addEventListener('click', () => {
      el.remove();
      if (e.onContinue) e.onContinue();
      else rewind();
    });
    el.querySelector('[data-act="notebook"]').addEventListener('click', () => notebook());
  }

  function fmt(t) {
    return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
  }

  function rewind() {
    $('#modal-root').innerHTML = '';
    const ov = document.createElement('div');
    ov.className = 'rewind';
    ov.innerHTML = `<div class="rewind-text">◀◀ <span>${fmt(run.time)}</span></div>`;
    $('#stage').appendChild(ov);
    sfx('rewind');
    const from = run.time;
    const t0 = performance.now();
    const span = ov.querySelector('span');
    const step = now => {
      const p = Math.min(1, (now - t0) / 1500);
      span.textContent = fmt(Math.round(from - (from - START) * p));
      if (p < 1) requestAnimationFrame(step);
      else setTimeout(() => { ov.remove(); newLoop(); }, 300);
    };
    requestAnimationFrame(step);
  }

  // ------------------------------------------------------------------- loops

  function newLoop() {
    memory.loops += 1;
    saveMemory();
    run = {
      time: START, flags: new Set(), fired: new Set(), counters: {},
      over: false, epilogue: false, processing: false, interrupted: false,
    };
    player.x = story.playerStart;
    player.facing = -1;
    player.target = null;
    $('#stage').classList.remove('is-frozen');
    render();

    const splash = document.createElement('div');
    splash.className = 'splash';
    splash.innerHTML = `<div>LOOP #${memory.loops}<small>Viernes 23/10 · 16:42</small></div>`;
    $('#stage').appendChild(splash);
    setTimeout(() => {
      splash.remove();
      runScript(story.intro);
    }, 1500);
  }

  function epilogue(on) {
    run.epilogue = on;
  }

  // ------------------------------------------------------------------ render

  function render() {
    if (!run) return;
    const clock = $('#clock');
    clock.textContent = fmt(run.time);
    clock.classList.toggle('is-urgent', run.time >= END - 5 && !run.over);
    $("#loop-badge").textContent = `LOOP #${memory.loops} · ${story.zoneAt(player.x)}`;
    $('#banner').innerHTML = story.banner();

    for (const a of story.actors()) {
      const el = $(`[data-spot="${a.id}"]`, $('#world'));
      if (!el) continue;
      el.style.left = `${a.x}px`;
      el.classList.toggle('is-gone', !!a.gone);
      el.classList.toggle('facing-left', a.facing ? a.facing < 0 : player.x < a.x);
      for (const cls of a.classes || []) el.classList.toggle(cls[0], cls[1]);
      const bubble = el.querySelector('.char-bubble');
      if (bubble) bubble.textContent = a.bubble || '';
    }
    story.renderScene();
  }

  function updateNear() {
    let best = null;
    let bestD = Infinity;
    if (!busy && run && !run.over) {
      for (const s of story.spots()) {
        const d = Math.abs(s.x - player.x);
        if (d < REACH && d < bestD) { best = s; bestD = d; }
      }
    }
    const id = best ? best.id : null;
    if (id === nearId) return;
    nearId = id;
    document.querySelectorAll('#world .is-near').forEach(el => el.classList.remove('is-near'));
    const prompt = $('#prompt');
    if (!best) {
      prompt.classList.add('hidden');
      return;
    }
    $(`[data-spot="${id}"]`, $('#world'))?.classList.add('is-near');
    prompt.textContent = `[E] ${best.label}`;
    prompt.classList.remove('hidden');
  }

  function interact(id) {
    if (busy || !run || run.over) return;
    const handler = story.handlers[id];
    if (!handler) return;
    const spot = story.spots().find(s => s.id === id);
    if (spot) player.facing = spot.x < player.x ? -1 : 1;
    runScript(handler);
  }

  function walkTo(id) {
    const spot = story.spots().find(s => s.id === id);
    if (!spot) return;
    if (Math.abs(spot.x - player.x) < REACH) {
      interact(id);
      return;
    }
    const side = player.x < spot.x ? -1 : 1;
    player.target = { x: spot.x + side * (REACH - 24), id };
  }

  let last = 0;
  function frame(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0);
    last = ts;

    if (run && !busy && !run.over && !topModal()) {
      let dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      if (dir) player.target = null;
      if (!dir && player.target) {
        const dx = player.target.x - player.x;
        if (Math.abs(dx) < 6) {
          const id = player.target.id;
          player.target = null;
          interact(id);
        } else {
          dir = Math.sign(dx);
        }
      }
      if (dir) {
        player.x = Math.max(40, Math.min(story.worldWidth - 40, player.x + dir * SPEED * dt));
        player.facing = dir;
      }
      player.walking = !!dir;
    } else {
      player.walking = false;
    }

    const pEl = $('[data-spot="you"]', $('#world'));
    if (pEl) {
      pEl.style.left = `${player.x}px`;
      pEl.classList.toggle('is-walking', player.walking);
      pEl.classList.toggle('facing-left', player.facing < 0);
    }
    const cam = Math.max(0, Math.min(story.worldWidth - VIEW_W, player.x - VIEW_W / 2));
    $('#world').style.transform = `translateX(${-Math.round(cam)}px)`;
    if (run && !busy && player.walking) render();
    updateNear();
    requestAnimationFrame(frame);
  }

  // ------------------------------------------------------------------- input

  function waitMinute() {
    runScript(async () => {
      await say('narrator', 'Mirás el reloj. Esperás un minuto.');
      await spend(1);
    });
  }

  function advanceDialog() {
    if (dlg.confirm) dlg.confirm();
    else if (dlg.onAdvance) dlg.onAdvance();
  }

  function onKey(e, down) {
    if (e.target.tagName === 'INPUT') return;
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') { keys.left = down; if (down && dlg.move) dlg.move(-1); }
    if (k === 'arrowright' || k === 'd') { keys.right = down; if (down && dlg.move) dlg.move(1); }
    if (!down) return;
    if (!started) return;

    const m = topModal();
    if (k === 'escape' && m && m.closable) { m.close(); return; }
    if (k === 'arrowup' && dlg.move) { dlg.move(-1); e.preventDefault(); return; }
    if (k === 'arrowdown' && dlg.move) { dlg.move(1); e.preventDefault(); return; }
    if (/^[1-9]$/.test(k) && dlg.pick) { dlg.pick(Number(k) - 1); return; }

    if (k === ' ' || k === 'enter' || k === 'e') {
      e.preventDefault();
      if (!dlg.root.classList.contains('hidden')) advanceDialog();
      else if (!busy && nearId && !m) interact(nearId);
      return;
    }
    if (k === 't' && !busy && !m) waitMinute();
    if (k === 'n' && !m) notebook();
    if (k === 'm') toggleSound();
    if (k === 'p') $('#stage').classList.toggle('crt');
  }

  function toggleSound() {
    soundOn = !soundOn;
    toast(soundOn ? '🔊 Sonido activado' : '🔇 Silencio');
  }

  function bindInput() {
    window.addEventListener('keydown', e => onKey(e, true));
    window.addEventListener('keyup', e => onKey(e, false));
    $('#prompt').addEventListener('click', () => nearId && interact(nearId));
    $('#world').addEventListener('click', e => {
      const spot = e.target.closest('[data-spot]');
      if (!spot || busy || !run || run.over || spot.dataset.spot === 'you') return;
      walkTo(spot.dataset.spot);
    });
    document.querySelectorAll('[data-touch]').forEach(btn => {
      const act = btn.dataset.touch;
      const set = v => { if (act === 'left') keys.left = v; if (act === 'right') keys.right = v; };
      btn.addEventListener('pointerdown', e => {
        e.preventDefault();
        set(true);
        if (act === 'act') {
          if (!dlg.root.classList.contains('hidden')) advanceDialog();
          else if (nearId) interact(nearId);
        }
        if (act === 'wait' && !busy) waitMinute();
        if (act === 'notebook' && !topModal()) notebook();
      });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => btn.addEventListener(t, () => set(false)));
    });
    window.addEventListener('blur', () => { keys.left = keys.right = false; });
  }

  function fit() {
    const s = Math.min(window.innerWidth / 960, window.innerHeight / 540);
    $('#viewport').style.transform = `translate(-50%, -50%) scale(${s})`;
  }

  // ---------------------------------------------------------------- notebook

  function notebook() {
    const objectives = run ? story.objectives().filter(o => o.visible) : [];
    const knowledge = memory.knowledge.map(k => `<li>${format(story.knowledge[k])}</li>`).join('') ||
      '<li class="is-locked">Todavía nada. Explorá, hablá con la gente, equivocate.</li>';
    const endings = story.endingsCatalog.map(en => memory.endings.includes(en.code)
      ? `<li class="is-done">${escapeHtml(en.title)} — <code>${escapeHtml(en.code)}</code></li>`
      : `<li class="is-locked">${en.secret ? '??? (secreto)' : '???'}</li>`).join('');
    modal({
      html: `
        <h2>📓 Cuaderno del loop</h2>
        <div>Loops vividos: <b>${memory.loops}</b> · Finales: <b>${memory.endings.length}/${story.endingsCatalog.length}</b> · Easter eggs: <b>${memory.eggs.length}</b></div>
        <h3>Para salvar este loop</h3>
        <ul class="list">${objectives.map(o => `<li class="${o.done ? 'is-done' : ''}">${format(o.label)}</li>`).join('')}</ul>
        <h3>Lo que sabés (sobrevive a los loops)</h3>
        <ul class="list">${knowledge}</ul>
        <h3>Finales</h3>
        <ul class="list">${endings}</ul>
        <div class="btn-row"><button class="btn danger" type="button" data-act="reset">Borrar memoria y empezar de cero</button></div>`,
      onMount(wrap, close) {
        wrap.querySelector('[data-act="reset"]').addEventListener('click', () => {
          resetMemory();
          close();
          location.reload();
        });
      },
    });
  }

  // ------------------------------------------------------------------- audio

  let ctx = null;
  function tone(freq, dur, type = 'square', delay = 0, vol = 0.05) {
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    return osc;
  }

  function sfx(name) {
    if (!soundOn) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return;
    }
    switch (name) {
      case 'blip': tone(520, 0.03, 'square', 0, 0.012); break;
      case 'learn': tone(880, 0.08, 'triangle'); tone(1320, 0.14, 'triangle', 0.08); break;
      case 'ping': tone(1046, 0.1, 'sine', 0, 0.08); tone(1568, 0.2, 'sine', 0.1, 0.08); break;
      case 'fail': tone(220, 0.3, 'sawtooth', 0, 0.05); tone(150, 0.5, 'sawtooth', 0.3, 0.05); break;
      case 'win': [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, 'square', i * 0.12, 0.04)); break;
      case 'fall': [600, 450, 300, 180].forEach((f, i) => tone(f, 0.08, 'square', i * 0.09, 0.04)); break;
      case 'type': for (let i = 0; i < 10; i++) tone(300 + Math.random() * 400, 0.03, 'square', i * 0.06, 0.02); break;
      case 'rewind': {
        const osc = tone(1400, 1.5, 'sawtooth', 0, 0.04);
        osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 1.5);
        break;
      }
      default: break;
    }
  }

  // -------------------------------------------------------------------- boot

  function titleScreen() {
    const el = document.createElement('div');
    el.className = 'title-screen';
    const cont = memory.loops > 0;
    el.innerHTML = `
      <div class="title-logo"><canvas data-logo="26x24"></canvas><img src="assets/cc-wordmark.svg" alt="Creative Coefficient"></div>
      <h1>SAVE DEVELOPER DAY<br>THE ODOO LOOP</h1>
      <div class="title-cast"></div>
      <div class="tagline">«Todo estaba funcionando. Hasta que se actualizó Odoo.»</div>
      <div class="btn-row">
        <button class="btn" type="button" data-act="play">${cont ? `▶ Continuar (recordás ${memory.loops} loop${memory.loops > 1 ? 's' : ''})` : '▶ Empezar el viernes'}</button>
        ${cont ? '<button class="btn danger" type="button" data-act="reset">Empezar de cero</button>' : ''}
      </div>`;
    const cast = el.querySelector('.title-cast');
    for (const id of story.titleCast) {
      const fig = document.createElement('figure');
      fig.appendChild(sprite(id));
      fig.insertAdjacentHTML('beforeend', `<figcaption>${story.cast[id].name}</figcaption>`);
      cast.appendChild(fig);
    }
    $('#stage').appendChild(el);
    decorate(el);
    const go = () => {
      el.remove();
      started = true;
      sfx('learn');
      newLoop();
    };
    el.querySelector('[data-act="play"]').addEventListener('click', go);
    el.querySelector('[data-act="reset"]')?.addEventListener('click', () => { resetMemory(); go(); });
  }

  /* Fills placeholders: [data-face] portraits, [data-logo] pixel isotipos, [data-duck] ducks. */
  const isotipo = new Image();
  isotipo.src = 'assets/cc-isotipo.png';
  function decorate(root) {
    for (const holder of root.querySelectorAll('[data-face]')) {
      if (holder.dataset.done) continue;
      holder.dataset.done = '1';
      holder.appendChild(face(holder.dataset.face, { scale: 1 }));
    }
    for (const c of root.querySelectorAll('canvas[data-logo]')) {
      const [w, h] = c.dataset.logo.split('x').map(Number);
      Sprites.logo(c, isotipo, w, h);
    }
    for (const d of root.querySelectorAll('[data-duck]')) d.style.backgroundImage = `url(${Sprites.duckUrl(d.dataset.duck || undefined)})`;
  }

  function boot(s) {
    story = s;
    const world = $('#world');
    world.style.width = `${story.worldWidth}px`;
    world.innerHTML = story.worldHTML();
    for (const id of story.onStage) world.appendChild(buildChar(id));
    world.appendChild(buildDog());
    world.appendChild(buildChar('you'));
    decorate(document);
    initDialog();
    bindInput();
    fit();
    window.addEventListener('resize', fit);
    requestAnimationFrame(frame);
    titleScreen();
  }

  return {
    boot, interact, say, choose, spend, learn, knows, egg, flag, setFlag, count, time, over, interrupted,
    ending, epilogue, rewind, modal, toast, sfx, face, sprite, decorate, format, escapeHtml, fmt, notebook,
    get memory() { return memory; },
    player,
    resetMemory,
    T: m => 16 * 60 + m,
    END,
  };
})();
