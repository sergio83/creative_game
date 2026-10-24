'use strict';

/*
 * Procedural pixel-art sprites. Every character is painted pixel by pixel on a
 * 24x52 grid and exported as a 5-frame sprite sheet:
 *   0 idle · 1 blink · 2 walk A · 3 walk B · 4 talk
 */
const Sprites = (() => {
  const W = 24;
  const H = 52;
  const FRAMES = 5;
  const SCALE = 3;
  const sheets = {};

  function painter(ctx, ox, oy = 0) {
    const r = (x, y, w, h, c) => {
      if (!c) return;
      ctx.fillStyle = c;
      ctx.fillRect(ox + x, oy + y, w, h);
    };
    r.checker = (x, y, w, h, c, parity = 0) => {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if ((x + i + y + j) % 2 === parity) r(x + i, y + j, 1, 1, c);
    };
    return r;
  }

  // ------------------------------------------------------------------ body

  function drawLegs(r, s, f) {
    const spread = f === 2;
    if (s.bottom === 'skirt') return drawSkirt(r, s, spread);
    const lx = spread ? 6 : 7;
    const rx = spread ? 14 : 13;
    r(lx, 34, 4, 14, s.pants);
    r(rx, 34, 4, 14, s.pants);
    r(lx + 3, 34, 1, 14, s.pantsShade);
    r(rx + 3, 34, 1, 14, s.pantsShade);
    r(lx - 1, 48, 5, 2, s.shoes);
    r(rx, 48, 5, 2, s.shoes);
    r(lx - 1, 49, 5, 1, s.sole);
    r(rx, 49, 5, 1, s.sole);
  }

  function drawSkirt(r, s, spread) {
    const lx = spread ? 7 : 8;
    const rx = spread ? 14 : 13;
    const legs = s.legs || s.skinShade;
    r(lx, 41, 3, 7, legs);                 // tights below the knee
    r(rx, 41, 3, 7, legs);
    r(lx - 1, 48, 4, 2, s.shoes);          // flats
    r(rx, 48, 4, 2, s.shoes);
    r(lx - 1, 49, 4, 1, s.sole);
    r(rx, 49, 4, 1, s.sole);
    const c = s.skirt;
    const shadeC = shade(c, -22);
    r(6, 34, 12, 2, c);                    // A-line skirt
    r(5, 36, 14, 3, c);
    r(4, 39, 16, 3, c);
    r(4, 41, 16, 1, shadeC);
    [8, 12, 15].forEach(x => r(x, 37, 1, 4, shadeC));
  }

  function drawTorso(r, s, y) {
    // torso with rounded shoulders
    r(6, y, 12, 1, s.shirt);
    r(5, y + 1, 14, 15, s.shirt);
    r(5, y + 1, 1, 15, s.shirtShade);
    r(18, y + 1, 1, 15, s.shirtShade);
    r(5, y + 15, 14, 1, s.shirtShade);

    // arms
    const armTop = y + 1;
    if (s.sleeves === 'short') {
      r(3, armTop, 2, 5, s.shirt);
      r(19, armTop, 2, 5, s.shirt);
      r(3, armTop + 5, 2, 8, s.skin);
      r(19, armTop + 5, 2, 8, s.skin);
    } else {
      r(3, armTop, 2, 13, s.sleeve || s.shirt);
      r(19, armTop, 2, 13, s.sleeve || s.shirt);
      r(3, armTop, 1, 13, s.shirtShade);
      r(20, armTop, 1, 13, s.shirtShade);
    }
    r(3, armTop + 13, 2, 2, s.skin);
    r(19, armTop + 13, 2, 2, s.skin);

    switch (s.top) {
      case 'blazer':                       // Alex: grey blazer, striped blue shirt
        r(10, y, 4, 9, s.inner);
        r.checker(10, y, 4, 9, s.innerShade);
        r(9, y, 1, 9, s.shirtShade);
        r(14, y, 1, 9, s.shirtShade);
        r(12, y + 10, 1, 1, '#2b2f36');
        r(12, y + 13, 1, 1, '#2b2f36');
        break;
      case 'vneck':                        // Diego: sweater with white collar
        r(10, y, 4, 2, s.inner);
        r(11, y + 2, 2, 2, s.inner);
        r(9, y, 1, 1, s.inner);
        r(14, y, 1, 1, s.inner);
        break;
      case 'hoodie':                       // protagonist
        r(7, y, 10, 2, s.shirtShade);
        r(10, y + 2, 1, 6, '#e8e2f4');
        r(13, y + 2, 1, 6, '#e8e2f4');
        r(8, y + 10, 8, 5, s.shirtShade);
        r(9, y + 11, 6, 3, s.shirt);
        break;
      case 'blouse':                       // scoop neck + necklace
        r(10, y, 4, 2, s.skin);
        r(11, y + 2, 2, 1, s.skin);
        r(10, y + 2, 1, 1, s.necklace || '#e8c45a');
        r(13, y + 2, 1, 1, s.necklace || '#e8c45a');
        r(11, y + 3, 2, 1, s.necklace || '#e8c45a');
        r(6, y + 14, 12, 1, s.shirtShade); // tucked waist
        break;
      case 'collar':                       // Sergio: dark shirt
        r(9, y, 2, 2, s.shirtShade);
        r(13, y, 2, 2, s.shirtShade);
        r(11, y, 2, 1, s.skinShade);
        [y + 4, y + 8, y + 12].forEach(by => r(12, by, 1, 1, '#555'));
        break;
      default:                             // crew neck
        r(10, y, 4, 1, s.shirtShade);
    }
  }

  // ------------------------------------------------------------------ head

  function drawHead(r, s, f, y) {
    const talk = f === 4;
    const blink = f === 1;
    // neck
    r(10, y + 14, 4, 3, s.skinShade);
    // face
    r(8, y, 8, 1, s.skin);
    r(7, y + 1, 10, 12, s.skin);
    r(8, y + 13, 8, 1, s.skin);
    r(16, y + 2, 1, 10, s.skinShade);
    r(9, y + 14, 6, 1, s.skinShade);
    // ears
    r(6, y + 5, 1, 3, s.skin);
    r(17, y + 5, 1, 3, s.skinShade);

    // brows
    r(8, y + 4, 3, 1, s.brow || s.hair);
    r(13, y + 4, 3, 1, s.brow || s.hair);
    // eyes
    if (blink) {
      r(8, y + 6, 3, 1, s.skinShade);
      r(13, y + 6, 3, 1, s.skinShade);
    } else {
      r(8, y + 6, 2, 1, '#fff');
      r(14, y + 6, 2, 1, '#fff');
      r(9, y + 6, 1, 1, '#1d1a22');
      r(14, y + 6, 1, 1, '#1d1a22');
    }
    // nose
    r(11, y + 7, 2, 2, s.skinShade);

    drawBeard(r, s, y);

    // mouth
    if (talk) {
      r(10, y + 10, 4, 2, '#4a1a16');
      r(10, y + 10, 4, 1, '#f4f1ea');
    } else if (s.smile) {
      r(9, y + 10, 6, 1, '#7a2e26');
      r(10, y + 10, 4, 1, '#f4f1ea');
      r(9, y + 9, 1, 1, s.beard === 'full' ? s.beardColor : s.skinShade);
      r(14, y + 9, 1, 1, s.beard === 'full' ? s.beardColor : s.skinShade);
    } else {
      r(10, y + 10, 4, 1, '#8a3a32');
    }

    if (s.glasses) drawGlasses(r, s, y);
    drawHair(r, s, y);
  }

  function drawBeard(r, s, y) {
    const c = s.beardColor;
    switch (s.beard) {
      case 'full':
        r(7, y + 5, 1, 8, c);
        r(16, y + 5, 1, 8, c);
        r(8, y + 9, 8, 1, c);
        r(8, y + 11, 8, 3, c);
        r(8, y + 10, 1, 1, c);
        r(15, y + 10, 1, 1, c);
        r(9, y + 14, 6, 1, c);
        break;
      case 'short':
        r(7, y + 7, 1, 6, c);
        r(16, y + 7, 1, 6, c);
        r(9, y + 9, 6, 1, c);
        r(8, y + 11, 8, 3, c);
        r(8, y + 10, 1, 1, c);
        r(15, y + 10, 1, 1, c);
        r(9, y + 14, 6, 1, c);
        break;
      case 'goatee':
        r(9, y + 9, 6, 1, c);
        r(9, y + 10, 1, 2, c);
        r(14, y + 10, 1, 2, c);
        r(10, y + 11, 4, 3, c);
        r(7, y + 8, 1, 3, s.skinShade);
        r(16, y + 8, 1, 3, s.skinShade);
        break;
      case 'stubble':
        r.checker(7, y + 8, 10, 6, c);
        break;
      default:
        break;
    }
  }

  function drawGlasses(r, s, y) {
    const c = s.glassesColor || '#15141a';
    if (s.glassesStyle === 'thin') {        // light frame: rims only, no heavy bars
      for (const x of [7, 13]) {
        r(x, y + 5, 4, 1, c);
        r(x, y + 6, 1, 1, c);
        r(x + 3, y + 6, 1, 1, c);
        r(x + 1, y + 7, 2, 1, c);
      }
      r(11, y + 5, 2, 1, c);
      return;
    }
    for (const x of [7, 12]) {
      r(x, y + 5, 5, 1, c);
      r(x, y + 8, 5, 1, c);
      r(x, y + 5, 1, 4, c);
      r(x + 4, y + 5, 1, 4, c);
    }
    r(6, y + 6, 1, 1, c);
    r(17, y + 6, 1, 1, c);
  }

  function drawHair(r, s, y) {
    const h = s.hair;
    const hs = s.hairShade || h;
    switch (s.hairStyle) {
      case 'spiky':                        // Alex
        r(7, y - 2, 10, 4, h);
        r(6, y, 1, 7, h);
        r(17, y, 1, 6, h);
        [7, 9, 11, 13, 15].forEach(x => r(x, y - 3, 1, 1, h));
        r(8, y + 2, 2, 1, h);
        r(14, y + 2, 2, 1, h);
        r(7, y - 1, 10, 1, hs);
        break;
      case 'bald':                         // Diego
        r(9, y - 1, 6, 1, s.skin);
        r(8, y, 2, 1, s.skin);
        r(10, y + 1, 2, 1, s.skinLight);
        r(6, y + 3, 1, 4, h);
        r(17, y + 3, 1, 4, h);
        r(7, y + 2, 1, 3, h);
        r(16, y + 2, 1, 3, h);
        break;
      case 'bangs':                        // Flor, with ponytail
        r(7, y - 2, 10, 3, h);
        r(6, y - 1, 1, 13, h);
        r(17, y - 1, 1, 13, h);
        r(5, y + 2, 1, 9, hs);
        r(7, y + 1, 6, 1, h);
        r(7, y + 2, 4, 1, h);
        r(7, y + 3, 2, 1, h);
        r(13, y + 1, 4, 1, hs);
        r(18, y + 6, 2, 9, h);
        r(19, y + 14, 1, 4, hs);
        r(6, y + 9, 1, 1, '#d8b04a');      // earring
        break;
      case 'receding':                     // Fede: high forehead, thin top
        r(9, y - 1, 6, 1, s.skin);
        r(10, y, 2, 1, s.skinLight);
        r(9, y - 2, 6, 1, h);
        r(7, y - 1, 2, 2, h);
        r(15, y - 1, 2, 2, h);
        r(6, y + 1, 1, 5, h);
        r(17, y + 1, 1, 5, h);
        break;
      case 'messy':                        // Sergio
        r(7, y - 2, 10, 4, h);
        r(6, y - 1, 1, 9, h);
        r(17, y - 1, 1, 9, h);
        r(8, y + 2, 3, 2, h);
        r(13, y + 2, 2, 1, h);
        r(9, y - 3, 2, 1, h);
        r(13, y - 3, 3, 1, h);
        r(7, y - 1, 10, 1, hs);
        break;
      case 'player':
        r(7, y - 2, 10, 3, h);
        r(6, y - 1, 1, 6, h);
        r(17, y - 1, 1, 6, h);
        r(7, y + 1, 5, 1, h);
        r(7, y + 2, 2, 1, h);
        r(8, y - 3, 7, 1, h);
        break;
      default:
        break;
    }
  }

  function drawExtras(r, s, y) {
    if (s.headphones) {                    // around the neck
      r(6, y + 15, 2, 3, '#222');
      r(16, y + 15, 2, 3, '#222');
      r(8, y + 16, 8, 1, '#333');
    }
    if (s.lanyard) {
      r(9, y + 17, 1, 6, s.lanyard);
      r(14, y + 17, 1, 6, s.lanyard);
      r(10, y + 23, 4, 3, '#f2d24b');
    }
  }

  function drawFrame(ctx, s, f, ox) {
    const r = painter(ctx, ox);
    const lift = f === 3 ? -1 : 0;        // body bob on the second walk frame
    drawLegs(r, s, f);
    const rr = painter(ctx, ox, lift);
    drawTorso(rr, s, 18);
    drawHead(rr, s, f, 3);
    drawExtras(rr, s, 3);
  }

  function withDefaults(spec) {
    return {
      skinShade: shade(spec.skin, -22),
      skinLight: shade(spec.skin, 18),
      shirtShade: shade(spec.shirt, -24),
      pantsShade: shade(spec.pants, -18),
      innerShade: spec.inner ? shade(spec.inner, -20) : null,
      hairShade: shade(spec.hair, 14),
      shoes: '#17151b',
      sole: '#0b0a0d',
      ...spec,
      ...(spec.bottom === 'skirt' && !spec.shoes ? { shoes: '#7a2e3a', sole: '#4a1820' } : {}),
    };
  }

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const c = v => Math.max(0, Math.min(255, v + amt));
    const rr = c(n >> 16);
    const g = c((n >> 8) & 255);
    const b = c(n & 255);
    return `#${((1 << 24) | (rr << 16) | (g << 8) | b).toString(16).slice(1)}`;
  }

  /* Returns { url, canvas } for a 5-frame sheet (cached by id). */
  function sheet(id, spec) {
    if (sheets[id]) return sheets[id];
    const s = withDefaults(spec);
    const canvas = document.createElement('canvas');
    canvas.width = W * FRAMES;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    for (let f = 0; f < FRAMES; f++) drawFrame(ctx, s, f, f * W);
    sheets[id] = { url: canvas.toDataURL(), canvas };
    return sheets[id];
  }

  /* Full-body sprite element animated purely with CSS classes. */
  function element(id, spec) {
    const el = document.createElement('div');
    el.className = 'sprite';
    el.style.backgroundImage = `url(${sheet(id, spec).url})`;
    return el;
  }

  /* Head-and-shoulders portrait, pixel-scaled onto a canvas. */
  function portrait(id, spec, { frame = 0, scale = 5, rows = 28 } = {}) {
    const src = sheet(id, spec).canvas;
    const c = document.createElement('canvas');
    c.width = W * scale;
    c.height = rows * scale;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(src, frame * W, 0, W, rows, 0, 0, W * scale, rows * scale);
    return c;
  }

  // -------------------------------------------------------------- critters

  function dogSheet() {
    if (sheets.__dog) return sheets.__dog;
    const c = document.createElement('canvas');
    c.width = 40;
    c.height = 14;
    const ctx = c.getContext('2d');
    for (let f = 0; f < 2; f++) {
      const r = painter(ctx, f * 20);
      const fur = '#c98a4b';
      const dark = '#7a4f27';
      r(3, 6, 11, 5, fur);                  // body
      r(3, 10, 11, 1, shade(fur, -20));
      r(12, 2, 6, 6, fur);                  // head
      r(12, 1, 2, 3, dark);                 // ear
      r(18, 5, 1, 1, '#111');               // nose
      r(16, 4, 1, 1, '#111');               // eye
      r(4, 11, 2, 3, dark);                 // legs
      r(11, 11, 2, 3, dark);
      r(7, 11, 1, 2, dark);
      r(14, 7, 3, 1, '#fff');               // collar tag area
      if (f === 0) r(0, 4, 3, 2, dark);     // tail up
      else r(0, 6, 3, 1, dark);             // tail down
    }
    sheets.__dog = { url: c.toDataURL(), canvas: c };
    return sheets.__dog;
  }

  function duckUrl(color = '#ffd23f') {
    const key = `__duck${color}`;
    if (sheets[key]) return sheets[key].url;
    const c = document.createElement('canvas');
    c.width = 10;
    c.height = 8;
    const r = painter(c.getContext('2d'), 0);
    r(1, 4, 7, 3, color);
    r(0, 3, 2, 2, color);
    r(5, 1, 4, 4, color);
    r(9, 3, 1, 1, '#ff8c1a');
    r(7, 2, 1, 1, '#111');
    r(2, 7, 6, 1, shade(color, -40));
    sheets[key] = { url: c.toDataURL(), canvas: c };
    return sheets[key].url;
  }

  /* Pixelates the real isotipo PNG into a canvas (drawn at low-res, scaled with CSS). */
  function logo(canvas, img, w, h) {
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const paint = () => {
      ctx.imageSmoothingEnabled = true;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
    };
    if (img.complete && img.naturalWidth) paint();
    else img.addEventListener('load', paint, { once: true });
  }

  return { sheet, element, portrait, dogSheet, duckUrl, logo, W, H, SCALE, FRAMES };
})();
