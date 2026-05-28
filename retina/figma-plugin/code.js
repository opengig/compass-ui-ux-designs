// ============================================================
// Store Manager — Design System Builder (Figma plugin)
// Generates the Retina AI Store Manager design system as
// Variables, Paint Styles, Text Styles, and a laid-out page.
// ============================================================

const COLORS = {
  // Primary (amber)
  'primary/base':        '#C68A1E',
  'primary/hover':       '#A8741A',
  'primary/background':  '#FBF3E0',
  'primary/border':      '#F4E4BC',
  'primary/soft':        '#F9F4EA',
  'primary/hover-bg':    '#F6E8C7',
  'brand/ink':           '#7A5310',

  // Neutrals
  'ink/primary':         '#2B2A26',
  'ink/secondary':       '#44403C',
  'ink/muted':           '#9C9B94',
  'ink/faint':           '#C5C4BC',
  'cream/canvas':        '#FBF8F0',
  'cream/2':             '#F1ECDD',
  'surface/sub':         '#F5F5F4',
  'surface/muted':       '#ECECEB',
  'surface/card':        '#FFFFFF',

  // Semantic
  'success/base':        '#5A8C1A',
  'success/2':           '#7DBD3B',
  'success/ink':         '#3B6D11',
  'success/bg':          '#EAF3DE',
  'scan/green':          '#97C459',
  'error/base':          '#A32D2D',
  'error/2':             '#E24B4A',
  'error/bg':            '#FDE7E7',
  'info/sso':            '#0067B8',

  // Camera stage
  'stage/black':         '#080808',
};

const SPACING = {
  'sp-1': 2, 'sp-2': 4, 'sp-3': 6, 'sp-4': 8,
  'sp-5': 12, 'sp-6': 14, 'sp-7': 16, 'sp-8': 24,
};

const RADIUS = {
  'r-1': 2, 'r-2': 4, 'r-3': 5, 'r-4': 8,
  'r-5': 10, 'r-6': 12, 'r-xl': 16, 'r-pill': 99,
};

const TYPE = [
  { name: 'Display',  size: 28, weight: 'Bold',     ls: -0.4, sample: 'Retina AI' },
  { name: 'Title XL', size: 22, weight: 'Semi Bold', ls: -0.3, sample: 'Review & Submit' },
  { name: 'Title L',  size: 17, weight: 'Semi Bold', ls: -0.2, sample: 'Capture flow' },
  { name: 'Title M',  size: 16, weight: 'Semi Bold', ls: -0.1, sample: 'Front label' },
  { name: 'Body',     size: 14, weight: 'Regular',   ls: 0,    sample: 'Tap a step below to start capturing this item.' },
  { name: 'Body S',   size: 13, weight: 'Regular',   ls: 0,    sample: 'Point at front label' },
  { name: 'Caption',  size: 11.5, weight: 'Regular', ls: 0,    sample: '3 / 4 captured' },
  { name: 'Micro',    size: 11,  weight: 'Medium',   ls: 1.98, sample: 'BY COMPASS GROUP', upper: true },
];

// ---------- helpers ----------
function hex(s) {
  const h = s.replace('#','');
  return {
    r: parseInt(h.slice(0,2), 16) / 255,
    g: parseInt(h.slice(2,4), 16) / 255,
    b: parseInt(h.slice(4,6), 16) / 255,
  };
}

function solid(color, opacity) {
  return { type: 'SOLID', color: typeof color === 'string' ? hex(color) : color, opacity: opacity == null ? 1 : opacity };
}

async function loadFonts() {
  const fonts = [
    ['Inter','Regular'], ['Inter','Medium'], ['Inter','Semi Bold'], ['Inter','Bold'],
    ['JetBrains Mono','Regular'], ['JetBrains Mono','Medium'],
  ];
  for (const [family, style] of fonts) {
    try {
      await figma.loadFontAsync({ family, style });
    } catch (e) {
      // Fallback to Inter if JetBrains Mono is unavailable
    }
  }
}

function setFill(node, color, opacity) {
  node.fills = [solid(color, opacity)];
}

function setStroke(node, color, weight) {
  node.strokes = [solid(color)];
  if (weight != null) node.strokeWeight = weight;
}

function makeText(chars, opts) {
  const t = figma.createText();
  const family = (opts && opts.mono) ? 'JetBrains Mono' : 'Inter';
  const style = (opts && opts.weight) || 'Regular';
  t.fontName = { family, style };
  t.characters = String(chars);
  if (opts && opts.size) t.fontSize = opts.size;
  if (opts && opts.color) setFill(t, opts.color);
  if (opts && opts.letterSpacing != null) t.letterSpacing = { value: opts.letterSpacing, unit: 'PIXELS' };
  if (opts && opts.lineHeight) t.lineHeight = { value: opts.lineHeight, unit: 'PIXELS' };
  if (opts && opts.upper) t.textCase = 'UPPER';
  return t;
}

function makeFrame(name, opts) {
  const f = figma.createFrame();
  f.name = name;
  if (opts) {
    if (opts.w != null) f.resize(opts.w, opts.h != null ? opts.h : 1);
    if (opts.w != null && opts.h != null) f.resize(opts.w, opts.h);
    if (opts.fill) setFill(f, opts.fill);
    else f.fills = [];
    if (opts.radius != null) f.cornerRadius = opts.radius;
    if (opts.stroke) {
      setStroke(f, opts.stroke, opts.strokeWeight || 1);
    }
    if (opts.layout) {
      f.layoutMode = opts.layout;
      f.primaryAxisSizingMode = opts.primarySize || 'AUTO';
      f.counterAxisSizingMode = opts.counterSize || 'AUTO';
      if (opts.padding != null) {
        f.paddingTop = f.paddingBottom = f.paddingLeft = f.paddingRight = opts.padding;
      }
      if (opts.pTop != null)    f.paddingTop = opts.pTop;
      if (opts.pBottom != null) f.paddingBottom = opts.pBottom;
      if (opts.pLeft != null)   f.paddingLeft = opts.pLeft;
      if (opts.pRight != null)  f.paddingRight = opts.pRight;
      if (opts.gap != null)     f.itemSpacing = opts.gap;
      if (opts.alignPrimary)    f.primaryAxisAlignItems = opts.alignPrimary;
      if (opts.alignCounter)    f.counterAxisAlignItems = opts.alignCounter;
    }
  }
  return f;
}

// ---------- Variables + Styles ----------
async function createVariablesAndStyles() {
  // Color variables
  try {
    const collection = figma.variables.createVariableCollection('SM / Tokens');
    const modeId = collection.modes[0].modeId;
    for (const [name, value] of Object.entries(COLORS)) {
      const v = figma.variables.createVariable(`color/${name}`, collection, 'COLOR');
      v.setValueForMode(modeId, hex(value));
    }
    for (const [name, value] of Object.entries(SPACING)) {
      const v = figma.variables.createVariable(`spacing/${name}`, collection, 'FLOAT');
      v.setValueForMode(modeId, value);
    }
    for (const [name, value] of Object.entries(RADIUS)) {
      const v = figma.variables.createVariable(`radius/${name}`, collection, 'FLOAT');
      v.setValueForMode(modeId, value);
    }
  } catch (e) {
    console.warn('Variables API not available; skipping. ' + e.message);
  }

  // Paint styles
  for (const [name, value] of Object.entries(COLORS)) {
    const s = figma.createPaintStyle();
    s.name = `SM/${name}`;
    s.paints = [solid(value)];
  }

  // Text styles
  for (const t of TYPE) {
    const ts = figma.createTextStyle();
    ts.name = `SM/${t.name}`;
    ts.fontName = { family: 'Inter', style: t.weight };
    ts.fontSize = t.size;
    if (t.ls) ts.letterSpacing = { value: t.ls, unit: 'PIXELS' };
    if (t.upper) ts.textCase = 'UPPER';
  }
}

// ---------- Section builders ----------
function sectionHeader(parent, eyebrow, title) {
  const wrap = makeFrame(`header / ${title}`, {
    layout: 'VERTICAL', primarySize: 'AUTO', counterSize: 'AUTO', gap: 6,
  });
  const eb = makeText(eyebrow, { size: 11, weight: 'Semi Bold', color: '#C68A1E', letterSpacing: 1.98, upper: true });
  const t = makeText(title, { size: 32, weight: 'Bold', color: '#2B2A26', letterSpacing: -0.6 });
  wrap.appendChild(eb);
  wrap.appendChild(t);
  parent.appendChild(wrap);
  return wrap;
}

function swatch(name, hexVal, role) {
  const card = makeFrame(`swatch/${name}`, {
    w: 200, layout: 'VERTICAL', primarySize: 'FIXED', counterSize: 'FIXED',
    fill: '#FFFFFF', radius: 10, stroke: '#F1ECDD', strokeWeight: 1,
  });
  card.resize(200, 130);
  card.clipsContent = true;

  const chip = makeFrame('chip', { w: 200, h: 64, fill: hexVal });
  chip.x = 0; chip.y = 0;
  card.appendChild(chip);

  const meta = makeFrame('meta', {
    layout: 'VERTICAL', primarySize: 'AUTO', counterSize: 'AUTO',
    padding: 10, gap: 2,
  });
  meta.x = 0; meta.y = 64;
  meta.resize(200, 66);
  meta.fills = [];

  meta.appendChild(makeText(name,   { size: 12, weight: 'Semi Bold', color: '#2B2A26' }));
  meta.appendChild(makeText(hexVal.toUpperCase(), { size: 10, weight: 'Regular', color: '#9C9B94', mono: true }));
  if (role) meta.appendChild(makeText(role, { size: 9.5, weight: 'Regular', color: '#9C9B94' }));

  card.appendChild(meta);
  return card;
}

function swatchGrid(parent, title, items) {
  const group = makeFrame(title, {
    layout: 'VERTICAL', primarySize: 'AUTO', counterSize: 'AUTO', gap: 10,
  });
  group.appendChild(makeText(title, { size: 14, weight: 'Semi Bold', color: '#2B2A26' }));

  const grid = makeFrame('grid', {
    layout: 'HORIZONTAL', primarySize: 'AUTO', counterSize: 'AUTO', gap: 10,
  });
  grid.layoutWrap = 'WRAP';
  grid.resize(880, 1);
  grid.primaryAxisSizingMode = 'FIXED';

  items.forEach(([n, v, role]) => grid.appendChild(swatch(n, v, role)));
  group.appendChild(grid);
  parent.appendChild(group);
}

function typeRow(name, size, weight, sample, mono) {
  const row = makeFrame(`type/${name}`, {
    layout: 'HORIZONTAL', primarySize: 'FIXED', counterSize: 'AUTO',
    pTop: 12, pBottom: 12, pLeft: 14, pRight: 14, gap: 18,
    alignCounter: 'CENTER',
  });
  row.resize(880, 1);
  row.fills = [];
  row.strokes = [solid('#F1ECDD')];
  row.strokeWeight = 1;
  row.strokeAlign = 'INSIDE';
  row.strokeTopWeight = 0;
  row.strokeLeftWeight = 0;
  row.strokeRightWeight = 0;
  row.strokeBottomWeight = 1;

  const label = makeText(name.toUpperCase(), { size: 10, weight: 'Medium', color: '#9C9B94', letterSpacing: 0.4 });
  label.resize(100, label.height);

  const samp = makeText(sample, { size: size, weight: weight, color: '#2B2A26', mono });
  samp.layoutGrow = 1;
  samp.resize(560, samp.height);

  const meta = makeText(`${size}px · ${weight}`, { size: 10, weight: 'Regular', color: '#9C9B94', mono: true });

  row.appendChild(label);
  row.appendChild(samp);
  row.appendChild(meta);
  return row;
}

function makeButton(label, kind) {
  const f = makeFrame(`btn/${kind}/${label}`, {
    layout: 'HORIZONTAL', primarySize: 'AUTO', counterSize: 'AUTO',
    pTop: 14, pBottom: 14, pLeft: 18, pRight: 18, gap: 8,
    alignPrimary: 'CENTER', alignCounter: 'CENTER',
    radius: 8,
  });
  let bg = '#C68A1E', fg = '#FFFFFF', stroke = '#C68A1E';
  if (kind === 'secondary') { bg = '#FFFFFF'; fg = '#2B2A26'; stroke = '#C5C4BC'; }
  if (kind === 'disabled')  { bg = '#C68A1E'; fg = '#FFFFFF'; stroke = '#C68A1E'; }
  setFill(f, bg);
  setStroke(f, stroke, 1);
  if (kind === 'disabled') f.opacity = 0.55;
  const t = makeText(label, { size: 14, weight: 'Medium', color: fg });
  f.appendChild(t);
  f.minWidth = 140;
  return f;
}

function makePill(label, on) {
  const f = makeFrame(`pill/${label}`, {
    layout: 'HORIZONTAL', primarySize: 'AUTO', counterSize: 'AUTO',
    pTop: 4, pBottom: 4, pLeft: 11, pRight: 11,
    radius: 4, alignCounter: 'CENTER', alignPrimary: 'CENTER',
  });
  if (on) {
    setFill(f, '#C68A1E');
    setStroke(f, '#C68A1E', 1);
  } else {
    setFill(f, '#FFFFFF');
    setStroke(f, '#C5C4BC', 1);
  }
  f.appendChild(makeText(label, {
    size: 11, weight: on ? 'Medium' : 'Regular',
    color: on ? '#FFFFFF' : '#9C9B94',
  }));
  return f;
}

function makeChip(label, isMore) {
  const f = makeFrame(`fchip/${label}`, {
    layout: 'HORIZONTAL', primarySize: 'AUTO', counterSize: 'AUTO',
    pTop: 3, pBottom: 3, pLeft: 10, pRight: 10,
    radius: 99, alignCounter: 'CENTER', alignPrimary: 'CENTER',
  });
  if (isMore) {
    setFill(f, '#C68A1E');
    setStroke(f, '#C68A1E', 1);
    f.appendChild(makeText(label, { size: 11, weight: 'Semi Bold', color: '#FFFFFF' }));
  } else {
    setFill(f, '#FBF3E0');
    setStroke(f, '#F4E4BC', 1);
    f.appendChild(makeText(label, { size: 11, weight: 'Medium', color: '#C68A1E' }));
  }
  return f;
}

function makeBadge(label, variant) {
  const f = makeFrame(`badge/${variant}/${label}`, {
    layout: 'HORIZONTAL', primarySize: 'AUTO', counterSize: 'AUTO',
    pTop: 4, pBottom: 4, pLeft: 9, pRight: 9, radius: 5,
    alignCounter: 'CENTER', alignPrimary: 'CENTER',
  });
  if (variant === 'success') {
    setFill(f, '#EAF3DE');
    f.appendChild(makeText(label, { size: 11, weight: 'Medium', color: '#3B6D11' }));
  } else if (variant === 'error') {
    setFill(f, '#FDE7E7');
    f.appendChild(makeText(label, { size: 11, weight: 'Medium', color: '#A32D2D' }));
  } else if (variant === 'count') {
    setFill(f, '#C68A1E');
    f.cornerRadius = 99;
    f.appendChild(makeText(label, { size: 10, weight: 'Bold', color: '#FFFFFF' }));
  } else {
    setFill(f, '#ECECEB');
    f.appendChild(makeText(label, { size: 11, weight: 'Regular', color: '#9C9B94' }));
  }
  return f;
}

function makeScanStage() {
  const stage = makeFrame('scan-stage', {
    w: 320, h: 170, fill: '#080808', radius: 12,
  });
  const frame = makeFrame('scan-frame', { w: 230, h: 118 });
  frame.x = (320 - 230) / 2;
  frame.y = (170 - 118) / 2;

  const cornerSize = 18, t = 2.5, color = '#97C459';
  function corner(name, x, y, sides) {
    const c = figma.createRectangle();
    c.name = name;
    c.resize(cornerSize, cornerSize);
    c.x = x; c.y = y;
    c.fills = [];
    c.strokes = [solid(color)];
    c.strokeWeight = t;
    c.strokeAlign = 'INSIDE';
    c.strokeTopWeight    = sides.top    ? t : 0;
    c.strokeBottomWeight = sides.bottom ? t : 0;
    c.strokeLeftWeight   = sides.left   ? t : 0;
    c.strokeRightWeight  = sides.right  ? t : 0;
    return c;
  }
  frame.appendChild(corner('tl', 0, 0, { top: true, left: true }));
  frame.appendChild(corner('tr', 230 - cornerSize, 0, { top: true, right: true }));
  frame.appendChild(corner('bl', 0, 118 - cornerSize, { bottom: true, left: true }));
  frame.appendChild(corner('br', 230 - cornerSize, 118 - cornerSize, { bottom: true, right: true }));

  const line = figma.createRectangle();
  line.name = 'scanline';
  line.resize(218, 2);
  line.x = 6; line.y = 58;
  line.fills = [solid('#97C459')];
  line.cornerRadius = 1;
  frame.appendChild(line);

  stage.appendChild(frame);
  return stage;
}

function makeThumb(kind, label) {
  const f = makeFrame(`thumb/${kind}`, {
    w: 60, h: 60, radius: 8,
    layout: 'VERTICAL', primarySize: 'FIXED', counterSize: 'FIXED',
    alignPrimary: 'CENTER', alignCounter: 'CENTER', gap: 3,
  });
  if (kind === 'done')   { setFill(f, '#EAF3DE'); setStroke(f, '#7DBD3B', 1); }
  else if (kind === 'active') { setFill(f, '#F5F5F4'); setStroke(f, '#C68A1E', 2); }
  else { setFill(f, '#F5F5F4'); setStroke(f, '#F1ECDD', 1); }

  const dot = figma.createEllipse();
  dot.resize(14, 14);
  setFill(dot, kind === 'done' ? '#3B6D11' : '#9C9B94');
  f.appendChild(dot);

  const lbl = makeText(label, { size: 9, weight: 'Regular',
    color: kind === 'done' ? '#3B6D11' : '#9C9B94' });
  f.appendChild(lbl);
  return f;
}

function makeQualityBar(pct) {
  const wrap = makeFrame('quality-bar', {
    layout: 'VERTICAL', primarySize: 'AUTO', counterSize: 'AUTO', gap: 4,
  });
  wrap.resize(280, 1);
  wrap.primaryAxisSizingMode = 'AUTO';
  wrap.counterAxisSizingMode = 'FIXED';

  const head = makeFrame('head', {
    layout: 'HORIZONTAL', primarySize: 'FIXED', counterSize: 'AUTO',
    alignPrimary: 'SPACE_BETWEEN', alignCounter: 'CENTER',
  });
  head.resize(280, 1);
  head.fills = [];
  head.appendChild(makeText('Quality', { size: 11.5, color: '#9C9B94' }));
  head.appendChild(makeText('Good',    { size: 11.5, color: '#5A8C1A', weight: 'Medium' }));
  wrap.appendChild(head);

  const track = makeFrame('track', { w: 280, h: 4, fill: '#F1ECDD', radius: 2 });
  const fill = makeFrame('fill', { w: 280 * (pct/100), h: 4, fill: '#5A8C1A', radius: 2 });
  fill.x = 0; fill.y = 0;
  track.appendChild(fill);
  wrap.appendChild(track);
  return wrap;
}

function makeToast(text) {
  const t = makeFrame('toast', {
    layout: 'HORIZONTAL', primarySize: 'AUTO', counterSize: 'AUTO',
    pTop: 9, pBottom: 9, pLeft: 14, pRight: 14, gap: 8, radius: 8,
    fill: '#C68A1E', alignCounter: 'CENTER',
  });
  t.effects = [{
    type: 'DROP_SHADOW', visible: true, blendMode: 'NORMAL',
    color: { r: 0, g: 0, b: 0, a: 0.25 },
    offset: { x: 0, y: 4 }, radius: 14, spread: 0,
  }];
  const dot = figma.createEllipse();
  dot.resize(10, 10);
  setFill(dot, '#97C459');
  t.appendChild(dot);
  t.appendChild(makeText(text, { size: 12, color: '#FFFFFF', weight: 'Medium' }));
  return t;
}

function makePhoneMock(title, builder) {
  const wrap = makeFrame(`mock/${title}`, {
    layout: 'VERTICAL', primarySize: 'AUTO', counterSize: 'AUTO', gap: 10,
  });
  wrap.appendChild(makeText(title, { size: 12, weight: 'Semi Bold', color: '#2B2A26' }));
  const phone = makeFrame('phone', {
    w: 240, h: 380, fill: '#FBF8F0', radius: 18,
    stroke: '#F1ECDD', strokeWeight: 1,
    layout: 'VERTICAL', primarySize: 'FIXED', counterSize: 'FIXED',
    padding: 10,
  });
  const screen = makeFrame('screen', {
    w: 220, h: 360, fill: '#FFFFFF', radius: 12,
    stroke: '#F1ECDD', strokeWeight: 1,
  });
  screen.clipsContent = true;
  builder(screen);
  phone.appendChild(screen);
  wrap.appendChild(phone);
  return wrap;
}

// ---------- Page assembly ----------
async function buildPage() {
  const page = figma.createPage();
  page.name = 'Store Manager — Design System';
  figma.currentPage = page;
  page.backgrounds = [solid('#FBF8F0')];

  const root = makeFrame('Design System', {
    layout: 'VERTICAL', primarySize: 'AUTO', counterSize: 'AUTO',
    padding: 64, gap: 56,
    fill: '#FBF8F0',
  });
  page.appendChild(root);
  root.x = 0; root.y = 0;

  // -- Cover --
  const cover = makeFrame('cover', {
    w: 980, h: 480, radius: 24,
    layout: 'VERTICAL', primarySize: 'FIXED', counterSize: 'FIXED',
    pTop: 56, pBottom: 56, pLeft: 56, pRight: 56, gap: 16,
    fill: '#F4E4BC', alignPrimary: 'SPACE_BETWEEN',
  });
  const top = makeFrame('cover/top', {
    layout: 'HORIZONTAL', primarySize: 'AUTO', counterSize: 'AUTO',
    gap: 14, alignCounter: 'CENTER',
  });
  const logoTile = makeFrame('logo-tile', { w: 64, h: 64, radius: 16, fill: '#C68A1E' });
  top.appendChild(logoTile);
  const brand = makeFrame('brand', {
    layout: 'VERTICAL', primarySize: 'AUTO', counterSize: 'AUTO', gap: 2,
  });
  brand.appendChild(makeText('RETINA  AI', { size: 18, weight: 'Bold', color: '#2B2A26', letterSpacing: -0.3 }));
  brand.appendChild(makeText('BY COMPASS GROUP', { size: 10, weight: 'Medium', color: '#9C9B94', letterSpacing: 1.8, upper: true }));
  top.appendChild(brand);
  cover.appendChild(top);

  const heroWrap = makeFrame('cover/hero', {
    layout: 'VERTICAL', primarySize: 'AUTO', counterSize: 'AUTO', gap: 14,
  });
  heroWrap.appendChild(makeText('DESIGN SYSTEM · v1.0', { size: 12, weight: 'Semi Bold', color: '#7A5310', letterSpacing: 2, upper: true }));
  heroWrap.appendChild(makeText('Store Manager Prototype', { size: 56, weight: 'Bold', color: '#2B2A26', letterSpacing: -1.6, lineHeight: 60 }));
  heroWrap.appendChild(makeText('Foundational visual & interaction language for the Retina AI mobile capture flow.', { size: 16, weight: 'Regular', color: '#44403C' }));
  cover.appendChild(heroWrap);
  root.appendChild(cover);

  // -- Colors --
  sectionHeader(root, '03 · Color', 'Color system');
  swatchGrid(root, 'Primary (amber)', [
    ['Primary',          '#C68A1E', 'Buttons, focus'],
    ['Primary / Hover',  '#A8741A', 'Hover, pressed'],
    ['Primary / Bg',     '#FBF3E0', 'Filter chips, accents'],
    ['Primary / Border', '#F4E4BC', 'Chip outlines'],
    ['Brand Ink',        '#7A5310', 'Text on amber tints'],
    ['Hover bg',         '#F6E8C7', 'Strip hover'],
    ['Soft',             '#F9F4EA', 'Icon press'],
    ['Canvas Cream',     '#FBF8F0', 'Phone background'],
  ]);
  swatchGrid(root, 'Neutrals — ink & surfaces', [
    ['Ink / Primary',   '#2B2A26', 'Headlines'],
    ['Ink / Secondary', '#44403C', 'Paragraph'],
    ['Ink / Muted',     '#9C9B94', 'Labels, hints'],
    ['Ink / Faint',     '#C5C4BC', 'Disabled'],
    ['Cream / 2',       '#F1ECDD', 'Dividers'],
    ['Surface / Sub',   '#F5F5F4', 'Inactive tiles'],
    ['Surface / Muted', '#ECECEB', 'Counters, pills'],
    ['Surface / Card',  '#FFFFFF', 'Sheets, cards'],
  ]);
  swatchGrid(root, 'Semantic', [
    ['Success',     '#5A8C1A', 'Quality bar'],
    ['Success / 2', '#7DBD3B', 'Done borders'],
    ['Scan',        '#97C459', 'Scanline + dot'],
    ['Success / Bg','#EAF3DE', 'Done tile fill'],
    ['Error',       '#A32D2D', 'Errors'],
    ['Error / 2',   '#E24B4A', 'Accent border'],
    ['Error / Bg',  '#FDE7E7', 'Banners'],
    ['Info / SSO',  '#0067B8', 'Microsoft Entra'],
  ]);

  // -- Typography --
  sectionHeader(root, '04 · Typography', 'Type system');
  const typeCard = makeFrame('type-specimen', {
    w: 880, fill: '#FFFFFF', radius: 12, stroke: '#F1ECDD', strokeWeight: 1,
    layout: 'VERTICAL', primarySize: 'AUTO', counterSize: 'FIXED',
    padding: 4,
  });
  for (const t of TYPE) {
    typeCard.appendChild(typeRow(t.name, t.size, t.weight, t.sample));
  }
  root.appendChild(typeCard);

  // -- Spacing & Radius --
  sectionHeader(root, '05 · Spacing & Shape', 'Spacing & radius');
  const shapeRow = makeFrame('shape', {
    layout: 'HORIZONTAL', primarySize: 'AUTO', counterSize: 'AUTO', gap: 24,
  });
  // spacing visualisation
  const spCol = makeFrame('spacing', {
    layout: 'VERTICAL', primarySize: 'AUTO', counterSize: 'AUTO', gap: 10,
  });
  spCol.appendChild(makeText('Spacing scale', { size: 14, weight: 'Semi Bold', color: '#2B2A26' }));
  for (const [name, val] of Object.entries(SPACING)) {
    const row = makeFrame(`sp/${name}`, {
      layout: 'HORIZONTAL', primarySize: 'AUTO', counterSize: 'AUTO',
      gap: 14, alignCounter: 'CENTER',
    });
    const bar = makeFrame('bar', { w: val * 4, h: 18, fill: '#C68A1E', radius: 2 });
    row.appendChild(bar);
    row.appendChild(makeText(`${name}  ·  ${val}px`, { size: 12, color: '#44403C', mono: true }));
    spCol.appendChild(row);
  }
  shapeRow.appendChild(spCol);

  const rdCol = makeFrame('radius', {
    layout: 'VERTICAL', primarySize: 'AUTO', counterSize: 'AUTO', gap: 10,
  });
  rdCol.appendChild(makeText('Radius scale', { size: 14, weight: 'Semi Bold', color: '#2B2A26' }));
  for (const [name, val] of Object.entries(RADIUS)) {
    const row = makeFrame(`r/${name}`, {
      layout: 'HORIZONTAL', primarySize: 'AUTO', counterSize: 'AUTO',
      gap: 14, alignCounter: 'CENTER',
    });
    const swatchR = makeFrame('swatch', {
      w: 40, h: 40, fill: '#FBF3E0', stroke: '#F4E4BC', strokeWeight: 1,
      radius: Math.min(val, 20),
    });
    row.appendChild(swatchR);
    row.appendChild(makeText(`${name}  ·  ${val}px`, { size: 12, color: '#44403C', mono: true }));
    rdCol.appendChild(row);
  }
  shapeRow.appendChild(rdCol);
  root.appendChild(shapeRow);

  // -- Buttons --
  sectionHeader(root, '07 · Components', 'Buttons');
  const btnRow = makeFrame('buttons', {
    layout: 'HORIZONTAL', primarySize: 'AUTO', counterSize: 'AUTO', gap: 14,
  });
  btnRow.appendChild(makeButton('Sign in with Compass SSO', 'primary'));
  btnRow.appendChild(makeButton('Cancel', 'secondary'));
  btnRow.appendChild(makeButton('Capture', 'disabled'));
  root.appendChild(btnRow);

  // -- Pills & chips --
  const pillsRow = makeFrame('pills', {
    layout: 'VERTICAL', primarySize: 'AUTO', counterSize: 'AUTO', gap: 14,
  });
  pillsRow.appendChild(makeText('Step pills', { size: 12, weight: 'Semi Bold', color: '#2B2A26' }));
  const pills = makeFrame('pills-row', {
    layout: 'HORIZONTAL', primarySize: 'AUTO', counterSize: 'AUTO', gap: 6,
  });
  pills.appendChild(makePill('Barcode', true));
  pills.appendChild(makePill('Front', false));
  pills.appendChild(makePill('Back', false));
  pills.appendChild(makePill('More', false));
  pillsRow.appendChild(pills);

  pillsRow.appendChild(makeText('Filter chips', { size: 12, weight: 'Semi Bold', color: '#2B2A26' }));
  const chips = makeFrame('chips-row', {
    layout: 'HORIZONTAL', primarySize: 'AUTO', counterSize: 'AUTO', gap: 6,
  });
  chips.appendChild(makeChip('Beverages'));
  chips.appendChild(makeChip('Snacks'));
  chips.appendChild(makeChip('Dairy & eggs'));
  chips.appendChild(makeChip('+4', true));
  pillsRow.appendChild(chips);

  pillsRow.appendChild(makeText('Badges', { size: 12, weight: 'Semi Bold', color: '#2B2A26' }));
  const badges = makeFrame('badges', {
    layout: 'HORIZONTAL', primarySize: 'AUTO', counterSize: 'AUTO', gap: 8,
  });
  badges.appendChild(makeBadge('3 / 4 captured', 'success'));
  badges.appendChild(makeBadge('Retry needed', 'error'));
  badges.appendChild(makeBadge('+3', 'count'));
  badges.appendChild(makeBadge('2 / 3', 'neutral'));
  pillsRow.appendChild(badges);
  root.appendChild(pillsRow);

  // -- Capture surfaces --
  sectionHeader(root, '08 · Capture', 'Capture surfaces');
  const capRow = makeFrame('cap', {
    layout: 'HORIZONTAL', primarySize: 'AUTO', counterSize: 'AUTO', gap: 24,
    alignCounter: 'MIN',
  });
  const stageCol = makeFrame('stage-col', {
    layout: 'VERTICAL', primarySize: 'AUTO', counterSize: 'AUTO', gap: 10,
  });
  stageCol.appendChild(makeText('Camera stage · Barcode framing', { size: 12, weight: 'Semi Bold', color: '#2B2A26' }));
  stageCol.appendChild(makeScanStage());
  capRow.appendChild(stageCol);

  const thumbsCol = makeFrame('thumbs-col', {
    layout: 'VERTICAL', primarySize: 'AUTO', counterSize: 'AUTO', gap: 10,
  });
  thumbsCol.appendChild(makeText('Thumbnail row', { size: 12, weight: 'Semi Bold', color: '#2B2A26' }));
  const thumbs = makeFrame('thumbs', {
    layout: 'HORIZONTAL', primarySize: 'AUTO', counterSize: 'AUTO', gap: 6,
  });
  thumbs.appendChild(makeThumb('done', 'Barcode'));
  thumbs.appendChild(makeThumb('active', 'Front'));
  thumbs.appendChild(makeThumb('idle', 'Back'));
  thumbs.appendChild(makeThumb('idle', 'More'));
  thumbsCol.appendChild(thumbs);

  thumbsCol.appendChild(makeText('Quality bar', { size: 12, weight: 'Semi Bold', color: '#2B2A26' }));
  thumbsCol.appendChild(makeQualityBar(78));

  thumbsCol.appendChild(makeText('Toast', { size: 12, weight: 'Semi Bold', color: '#2B2A26' }));
  thumbsCol.appendChild(makeToast('Barcode captured'));
  capRow.appendChild(thumbsCol);
  root.appendChild(capRow);

  // -- Screen patterns --
  sectionHeader(root, '11 · Layout', 'Screen patterns');
  const patternsRow = makeFrame('patterns', {
    layout: 'HORIZONTAL', primarySize: 'AUTO', counterSize: 'AUTO', gap: 24,
  });

  patternsRow.appendChild(makePhoneMock('A · Hero + CTA', (s) => {
    const hero = makeFrame('hero', {
      w: 220, h: 280, layout: 'VERTICAL', primarySize: 'FIXED', counterSize: 'FIXED',
      alignPrimary: 'CENTER', alignCounter: 'CENTER', gap: 8,
    });
    hero.fills = [];
    const tile = makeFrame('logo', { w: 56, h: 56, radius: 14, fill: '#C68A1E' });
    hero.appendChild(tile);
    hero.appendChild(makeText('RETINA  AI', { size: 18, weight: 'Bold', color: '#2B2A26', letterSpacing: -0.3 }));
    hero.appendChild(makeText('BY COMPASS GROUP', { size: 8, weight: 'Medium', color: '#9C9B94', letterSpacing: 1.4, upper: true }));
    s.appendChild(hero);
    const cta = makeButton('Sign in with Compass SSO', 'primary');
    cta.x = 12; cta.y = 300;
    cta.resize(196, 44);
    s.appendChild(cta);
  }));

  patternsRow.appendChild(makePhoneMock('B · Sub-bar + Stage + Action', (s) => {
    const sub = makeFrame('subbar', {
      w: 220, h: 56, fill: '#FFFFFF',
      stroke: '#F1ECDD', strokeWeight: 1,
      layout: 'HORIZONTAL', primarySize: 'FIXED', counterSize: 'FIXED',
      pTop: 10, pBottom: 10, pLeft: 12, pRight: 12, gap: 8, alignCounter: 'CENTER',
    });
    const back = makeFrame('back', { w: 24, h: 24, radius: 99, fill: '#F5F5F4' });
    sub.appendChild(back);
    const title = makeFrame('title', {
      layout: 'VERTICAL', primarySize: 'AUTO', counterSize: 'AUTO', gap: 2,
    });
    title.layoutGrow = 1;
    title.appendChild(makeText('Paneer 200g', { size: 12, weight: 'Semi Bold', color: '#2B2A26' }));
    title.appendChild(makeText('Front label', { size: 9, color: '#9C9B94' }));
    sub.appendChild(title);
    sub.appendChild(makeBadge('2 / 3', 'neutral'));
    s.appendChild(sub);

    const stage = makeFrame('stage', { w: 220, h: 220, fill: '#080808' });
    stage.x = 0; stage.y = 56;
    s.appendChild(stage);

    const action = makeFrame('action', {
      w: 220, h: 64, fill: '#FFFFFF',
      stroke: '#F1ECDD', strokeWeight: 1,
      layout: 'HORIZONTAL', primarySize: 'FIXED', counterSize: 'FIXED',
      padding: 10, gap: 8,
    });
    action.x = 0; action.y = 296;
    const cancel = makeButton('Cancel', 'secondary');
    cancel.resize(72, 44);
    const cap = makeButton('Capture', 'primary');
    cap.layoutGrow = 1;
    cap.resize(120, 44);
    action.appendChild(cancel);
    action.appendChild(cap);
    s.appendChild(action);
  }));

  patternsRow.appendChild(makePhoneMock('C · List + Filter strip', (s) => {
    const head = makeFrame('head', {
      w: 220, h: 72, fill: '#FFFFFF', stroke: '#F1ECDD', strokeWeight: 1,
      layout: 'VERTICAL', primarySize: 'FIXED', counterSize: 'FIXED',
      pTop: 12, pBottom: 12, pLeft: 12, pRight: 12, gap: 8,
    });
    head.appendChild(makeText('Articles', { size: 14, weight: 'Semi Bold', color: '#2B2A26' }));
    const cs = makeFrame('chips', {
      layout: 'HORIZONTAL', primarySize: 'AUTO', counterSize: 'AUTO', gap: 4,
    });
    cs.appendChild(makeChip('Beverages'));
    cs.appendChild(makeChip('Snacks'));
    cs.appendChild(makeChip('+4', true));
    head.appendChild(cs);
    s.appendChild(head);

    const list = makeFrame('list', {
      layout: 'VERTICAL', primarySize: 'AUTO', counterSize: 'AUTO',
      padding: 12, gap: 6,
    });
    list.x = 0; list.y = 72;
    list.fills = [];
    list.resize(220, 1);
    list.primaryAxisSizingMode = 'AUTO';
    list.counterAxisSizingMode = 'FIXED';
    for (let i = 0; i < 6; i++) {
      const item = makeFrame('item', { w: 196, h: 36, fill: '#F5F5F4', radius: 6 });
      list.appendChild(item);
    }
    s.appendChild(list);
  }));

  patternsRow.appendChild(makePhoneMock('D · Progress / status', (s) => {
    const pad = makeFrame('pad', {
      w: 220, h: 360, fill: '#FFFFFF',
      layout: 'VERTICAL', primarySize: 'FIXED', counterSize: 'FIXED',
      padding: 16, gap: 12,
    });
    pad.appendChild(makeText('Processing your items', { size: 14, weight: 'Semi Bold', color: '#2B2A26' }));
    pad.appendChild(makeQualityBar(60));
    const r1 = makeFrame('r1', {
      layout: 'HORIZONTAL', primarySize: 'AUTO', counterSize: 'AUTO', gap: 8, alignCounter: 'CENTER',
    });
    const d1 = figma.createEllipse(); d1.resize(8,8); setFill(d1, '#C68A1E');
    r1.appendChild(d1);
    r1.appendChild(makeText('Paneer 200g — analyzing…', { size: 11, color: '#44403C' }));
    pad.appendChild(r1);
    const r2 = makeFrame('r2', {
      layout: 'HORIZONTAL', primarySize: 'AUTO', counterSize: 'AUTO', gap: 8, alignCounter: 'CENTER',
    });
    const d2 = figma.createEllipse(); d2.resize(8,8); setFill(d2, '#5A8C1A');
    r2.appendChild(d2);
    r2.appendChild(makeText('Cola 330ml — done', { size: 11, color: '#5A8C1A' }));
    pad.appendChild(r2);
    s.appendChild(pad);
  }));

  root.appendChild(patternsRow);

  figma.viewport.scrollAndZoomIntoView([cover]);
}

// ---------- entry ----------
(async () => {
  try {
    await loadFonts();
    await createVariablesAndStyles();
    await buildPage();
    figma.notify('Store Manager design system built — see the new page.', { timeout: 3000 });
    figma.closePlugin();
  } catch (err) {
    figma.notify('Error: ' + err.message, { error: true });
    figma.closePlugin();
  }
})();
