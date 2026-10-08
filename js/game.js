// ============================================
// LAS AVENTURAS DE BAMBI
// Sebastián debe rescatar a la princesa Pamela — 5 niveles
// Villanos: El Miedo, Las Dudas y EL PASADO
// Nivel 3: El Jardín de los Recuerdos (recolección, sin combate)
// Nivel 4: La Prueba del Corazón (2 preguntas de opción múltiple)
// Tras el FIN: epílogo "Su futuro juntos"
// Se vencen lanzando corazones de amor (ESPACIO)
// Gráficos: pack CC0 "Zelda-like" de ArMM1998 (ver assets/CREDITS.md)
// ============================================

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const SRC_TILE = 16;
const TILE = 32;
const COLS = 20;
const ROWS = 15;

// --- Carga de imágenes ---
const images = {};
function loadImage(name, src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { images[name] = img; resolve(); };
    img.onerror = reject;
    img.src = src;
  });
}

// --- ¿Dispositivo táctil? (o ?touch=1 para probar) ---
const IS_TOUCH = 'ontouchstart' in window ||
  (window.matchMedia && matchMedia('(pointer: coarse)').matches) ||
  new URLSearchParams(location.search).get('touch') === '1';
if (IS_TOUCH) document.body.classList.add('touch');

// Adapta los textos de ayuda al dispositivo
function uiText(text) {
  if (!IS_TOUCH) return text;
  return text.replace(/con ESPACIO/g, 'con el botón 💗').replace(/ESPACIO/g, 'el botón 💗');
}

// --- Entrada de teclado ---
const keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  // El navegador solo permite audio tras una interacción: aprovechamos cualquier tecla
  AudioSys.ensure();
  if (state === 'title') AudioSys.play('title');
  if (e.key.toLowerCase() === 'm') AudioSys.toggleMute();
  if (state === 'quiz') { handleQuizKey(e); return; }
  if (e.key === 'Enter') handleEnter();
  if (e.key === ' ') e.preventDefault();
});
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

// --- Controles táctiles ---
function bindTouchButton(id, key) {
  const el = document.getElementById(id);
  if (!el) return;
  const press = (e) => {
    e.preventDefault();
    keys[key] = true;
    AudioSys.ensure();
    if (state === 'title') AudioSys.play('title');
  };
  const release = (e) => { e.preventDefault(); keys[key] = false; };
  el.addEventListener('touchstart', press, { passive: false });
  el.addEventListener('touchend', release);
  el.addEventListener('touchcancel', release);
  el.addEventListener('mousedown', press);
  el.addEventListener('mouseup', release);
  el.addEventListener('mouseleave', () => { keys[key] = false; });
}
bindTouchButton('btnUp', 'arrowup');
bindTouchButton('btnDown', 'arrowdown');
bindTouchButton('btnLeft', 'arrowleft');
bindTouchButton('btnRight', 'arrowright');
bindTouchButton('btnHeart', ' ');

// Tocar la pantalla del juego = ENTER (comenzar / continuar)
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  AudioSys.ensure();
  if (state === 'title') AudioSys.play('title');
  if (state === 'quiz') { handleQuizPointer(e); return; }
  handleEnter();
}, { passive: false });

// Clic del ratón (PC): elegir opción en el quiz o continuar diálogos
canvas.addEventListener('mousedown', (e) => {
  AudioSys.ensure();
  if (state === 'title') { AudioSys.play('title'); handleEnter(); return; }
  if (state === 'quiz') { handleQuizPointer(e); return; }
  handleEnter();
});

// ============================================
// NIVELES
// T = sólido (árbol/pared), . = suelo, P = sendero/alfombra,
// W = agua, f = flores, b = roca, S = estatua, E = salida,
// M = princesa Pamela
// ============================================
const LEVELS = [
  {
    name: 'Nivel 1 — El Bosque',
    theme: 'forest',
    start: { col: 9, row: 12 },
    intro: 'Para llegar hasta la princesa Pamela, Sebastián debe cruzar el bosque. Pero EL MIEDO custodia el camino del este... Venza al miedo lanzando corazones de amor con ESPACIO.',
    villain: { name: 'El Miedo', img: 'miedo', hp: 4, speed: 48, scale: 2.1, col: 16, row: 7,
      defeat: 'El Miedo se desvanece... Cuando el amor es más grande que el miedo, ningún camino da miedo recorrerlo. ♥' },
    decor: [
      { e: '🐎', c: 15, r: 12, s: 34 },
      { e: '🦋', c: 3, r: 2, s: 20, bob: true },
      { e: '🦋', c: 14, r: 13, s: 18, bob: true },
      { e: '💗', c: 6, r: 5, s: 20, bob: true },
      { e: '💗', c: 17, r: 4, s: 20, bob: true },
      { e: '🌷', c: 2, r: 9, s: 20 },
    ],
    map: [
      'TTTTTTTTTTTTTTTTTTTT',
      'T..................T',
      'T..f....TT.....f...T',
      'T..PPPPPPPPPP......T',
      'T..PPPPPPPPPP..b...T',
      'T..PP......PP......T',
      'T..PP.WWWW.PP......T',
      'T.fPP.WWWW.PPPPPPPPE',
      'T..PP.WWWW.PPPPPPPPE',
      'T..PP......PP......T',
      'T..PPPPPPPPPP..TT..T',
      'T..PPPPPPPPPP..TT..T',
      'T..b....f..........T',
      'T...........f......T',
      'TTTTTTTTTTTTTTTTTTTT',
    ],
  },
  {
    name: 'Nivel 2 — La Cueva Oscura',
    theme: 'cave',
    start: { col: 2, row: 13 },
    intro: 'En la oscuridad de la cueva susurran LAS DUDAS: "¿y si no lo logra?"... Sebastián conoce la respuesta. Atraviese el laberinto y vénzalas con ESPACIO. La salida está al norte.',
    villain: { name: 'Las Dudas', img: 'dudas', hp: 6, speed: 62, scale: 2.2, col: 10, row: 3,
      defeat: 'Las Dudas se disipan... En el corazón de Sebastián nunca hubo pregunta: siempre fue ella. ♥' },
    decor: [
      { e: '✨', c: 2, r: 7, s: 18, bob: true },
      { e: '✨', c: 18, r: 6, s: 18, bob: true },
      { e: '✨', c: 5, r: 10, s: 16, bob: true },
      { e: '💎', c: 8, r: 12, s: 18 },
      { e: '💎', c: 12, r: 7, s: 18 },
      { e: '💗', c: 12, r: 4, s: 18, bob: true },
    ],
    map: [
      'TTTTTTTTTEETTTTTTTTT',
      'T..................T',
      'T.......S..S.......T',
      'T...TTT......TTT...T',
      'T...T..b..b....T...T',
      'T.b.T.TTTT.TTT.T...T',
      'T...T.T......T.T.b.T',
      'T.....T..bb..T.....T',
      'T.TTT.T......T.TT..T',
      'T.T...TTTTTT.T..T..T',
      'T.T.b........T..T..T',
      'T.TTTTTT.TTTTT..T..T',
      'T........T....b.T..T',
      'T..b.....T.........T',
      'TTTTTTTTTTTTTTTTTTTT',
    ],
  },
  {
    name: 'Nivel 3 — El Jardín de los Recuerdos',
    type: 'collect',
    pets: true,
    theme: 'forest',
    start: { col: 9, row: 13 },
    intro: 'Antes de la Prueba del Corazón, un pequeño paseo. Recoja los cinco corazones escondidos en el jardín: cada uno guarda un recuerdo. Muévase con las flechas y déjese llevar, mi amor. ♥',
    decor: [
      { e: '🦋', c: 5, r: 3, s: 20, bob: true },
      { e: '🦋', c: 14, r: 10, s: 18, bob: true },
      { e: '🌷', c: 2, r: 5, s: 20 },
      { e: '🌷', c: 17, r: 9, s: 20 },
      { e: '✨', c: 9, r: 5, s: 16, bob: true },
    ],
    collectibles: [
      { col: 9, row: 2, text: 'Un recuerdo dulce: aquella noche coreando con usted en el concierto de Bronco. Desde entonces, cada canción sabe a usted. ♥' },
      { col: 15, row: 6, text: 'El 19 de agosto sigue siendo el día favorito de Sebastián: el día en que todo empezó. ♥' },
      { col: 9, row: 8, text: 'Sasha, la perrita negra, siempre corre primero a recibirlo a usted. El amor también tiene cuatro patas. ♥' },
      { col: 3, row: 10, text: 'Ahora también está Apolo, un potrillo de apenas ocho meses, aprendiendo a correr igual de rápido que este corazón. ♥' },
      { col: 15, row: 12, text: 'Y en un rincón de la casa espera Balu_chón, el peluche gigante, guardando abrazos para cuando usted llegue. ♥' },
    ],
    map: [
      'TTTTTTTTTTTTTTTTTTTT',
      'T..................T',
      'T..f............f..T',
      'T..................T',
      'T....WWWW.......f..T',
      'T....WWWW..........T',
      'T..................T',
      'T..........b.......E',
      'T..................E',
      'T..f..........f....T',
      'T..................T',
      'T....f........f....T',
      'T..................T',
      'T..................T',
      'TTTTTTTTTTTTTTTTTTTT',
    ],
  },
  {
    name: 'Nivel 4 — La Prueba del Corazón',
    type: 'quiz',
    theme: 'title', // vals romántico para el momento tierno
    intro: 'Antes del último desafío, el corazón le pone dos pruebas a Sebastián. No son de espada ni de valor... son de amor. Responda desde el corazón, mi amor. ♥',
    questions: [
      {
        q: '¿Cuál fue nuestro primer concierto?',
        options: ['Bad Bunny', 'Aventura', 'Enanitos Verdes', 'Bronco'],
        correct: 3,
        onCorrect: '¡Exacto! Bronco... y desde esa noche, cada canción me recuerda a usted. ♥',
      },
      {
        q: '¿La fecha de nuestro aniversario?',
        options: ['25 de Diciembre', '19 de Agosto', '1 de Enero', '15 de Marzo'],
        correct: 1,
        onCorrect: '¡El 19 de Agosto! El día en que mi vida se volvió más bonita a su lado. ♥',
      },
    ],
  },
  {
    name: 'Nivel 5 — La Ruta del Café',
    type: 'collect',
    theme: 'forest',
    music: 'garden',
    start: { col: 9, row: 13 },
    intro: 'Antes del Castillo, un último respiro: La Ruta del Café. Recorra las cafeterías de la ciudad y recoja los cinco recuerdos, pero cuidado — LA PRISA no deja disfrutar ni una sola taza. Véncala con ESPACIO: la salida se abrirá cuando haya recogido todo y la haya vencido.',
    villain: { name: 'La Prisa', img: 'prisa', hp: 7, speed: 66, scale: 2.1, col: 14, row: 9,
      defeat: 'La Prisa se disuelve como vapor de café... el amor no tiene prisa: solo tiempo para saborearlo, a su lado. ♥' },
    decor: [
      { e: '☕', c: 6, r: 8, s: 20 },
      { e: '☕', c: 12, r: 8, s: 20 },
      { e: '🥐', c: 7, r: 12, s: 18 },
      { e: '🦋', c: 2, r: 3, s: 20, bob: true },
      { e: '✨', c: 13, r: 6, s: 16, bob: true },
      { e: '💗', c: 11, r: 10, s: 18, bob: true },
    ],
    collectibles: [
      { col: 16, row: 5, text: 'Entre el aroma del espresso recién hecho, hasta la cafetería más sencilla se sentía como una cita especial. ♥' },
      { col: 3, row: 9, text: 'No importaba cuál cafetería fuera: lo que de verdad sabía bien era el tiempo compartido con usted. ♥' },
      { col: 15, row: 11, text: 'Una taza caliente, una charla larga y las ganas de no levantarse nunca de esa mesa. ♥' },
      { col: 9, row: 2, text: 'Ninguna cafetería de la ciudad sabe tan bien como la que se visita de su mano, mi amor. ♥' },
    ],
    map: [
      'TTTTTTTTTTTTTTTTTTTT',
      'T..................T',
      'T....f.............T',
      'T...............f..T',
      'T..................T',
      'T...........WWW....T',
      'T.b.........WWW....T',
      'T........PPPPPPP...E',
      'T........P.........E',
      'T........P.......b.T',
      'T........P.........T',
      'T..f.....P.........T',
      'T........P....f....T',
      'T........P.........T',
      'TTTTTTTTTTTTTTTTTTTT',
    ],
  },
  {
    name: 'Nivel 6 — El Castillo',
    theme: 'castle',
    start: { col: 9, row: 13 },
    intro: 'La sala del trono. Pamela y su fiel perrita Sasha están tan cerca... pero el último guardián es EL PASADO, el más difícil de vencer: rápido, pesado y terco. No mire atrás, Sebastián: lance todo su amor con ESPACIO.',
    villain: { name: 'EL PASADO', img: 'pasado', hp: 10, speed: 78, scale: 2.4, col: 9, row: 6, dash: true,
      defeat: 'EL PASADO por fin descansa... Lo que fue ya no pesa. Lo que viene, brilla. ♥' },
    decor: [
      { e: '🌹', c: 5, r: 3, s: 22 },
      { e: '🌹', c: 14, r: 3, s: 22 },
      { e: '🕯️', c: 3, r: 2, s: 22 },
      { e: '🕯️', c: 16, r: 2, s: 22 },
      { e: '💗', c: 4, r: 7, s: 20, bob: true },
      { e: '💗', c: 15, r: 7, s: 20, bob: true },
      { e: '🦄', c: 16, r: 10, s: 34 },
      { e: '🐴', c: 3, r: 10, s: 30 },
      { e: '💗', c: 9, r: 12, s: 18, bob: true },
    ],
    map: [
      'TTTTTTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTTTTTTT',
      'T........M.........T',
      'T......PPPPPP......T',
      'T......PPPPPP......T',
      'T......PPPPPP......T',
      'T......PPPPPP......T',
      'T......PPPPPP......T',
      'T......PPPPPP......T',
      'T......PPPPPP......T',
      'T......PPPPPP......T',
      'T..................T',
      'T..................T',
      'T..................T',
      'TTTTTTTTTTTTTTTTTTTT',
    ],
  },
];

// --- Estado global ---
let state = 'title'; // title | intro | playing | msg | quiz | win | epilogue
let levelIndex = 0;
let level = LEVELS[0];
let pamela = null;
let villain = null;
let hearts = [];      // proyectiles de amor
let playerHp = 5;
const PLAYER_MAX_HP = 5;
let msgText = '';
let msgAfter = null;  // qué hacer al cerrar el mensaje
let time = 0;
let quiz = null;            // estado del nivel de preguntas
let quizOptionRects = [];   // cajas de las opciones (para tocar/clic)
let collected = [];         // recuerdos recogidos en el Jardín (booleans)
let particles = [];         // partículas de estallido (corazones)
let dust = [];               // polvillo de pasos y pequeños detalles ambientales
let motes = [];               // partículas ambientales flotantes (polen, polvo, brasas) por tema
let fade = 1;                // fundido entre escenas (1 = negro, 0 = visible)
let ambientTimer = 10, ambientText = '', ambientAlpha = 0; // mensajes dulces ambientales
let shakeTime = 0, shakeMag = 0; // sacudida de pantalla (impacto de combate)

function shake(mag, dur) {
  if (mag < shakeMag) return; // no interrumpir una sacudida más fuerte en curso
  shakeMag = mag;
  shakeTime = dur;
}

function tileAt(col, row) {
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return 'T';
  return level.map[row][col] || '.';
}

function isSolid(col, row) {
  const t = tileAt(col, row);
  if (t === 'E') {
    if (villain && !villain.dead) return true; // la salida se abre al vencer al villano
    if (level.type === 'collect' && collected.some((c) => !c)) return true; // faltan recuerdos por recoger
  }
  return 'TWSb'.includes(t);
}

function tileHash(col, row) {
  return ((col * 73856093) ^ (row * 19349663)) >>> 0;
}

function loadLevel(i) {
  levelIndex = i;
  level = LEVELS[i];
  fade = 1;
  particles = [];
  ambientTimer = 10;
  ambientAlpha = 0;

  // Nivel de preguntas: no hay mapa ni combate, solo la prueba del corazón
  if (level.type === 'quiz') {
    quiz = { qIndex: 0, selected: 0, locked: false };
    villain = null;
    pamela = null;
    hearts = [];
    entitiesStatic = [];
    collected = [];
    motes = [];
    state = 'intro';
    AudioSys.play(level.music || level.theme);
    return;
  }

  spawnMotes(level.theme);

  player.x = level.start.col * TILE + 5;
  player.y = level.start.row * TILE + 12;
  player.dir = 'up';
  player.iframes = 0;
  player.shootCd = 0;
  playerHp = PLAYER_MAX_HP;
  hearts = [];
  pamela = null;
  villain = null;
  collected = level.type === 'collect' ? level.collectibles.map(() => false) : [];

  if (level.villain) {
    const v = level.villain;
    villain = {
      ...v,
      x: v.col * TILE + TILE / 2,
      y: v.row * TILE + TILE / 2,
      maxHp: v.hp,
      dead: false,
      hitFlash: 0,
      dashTimer: 0,
      dashing: 0,
    };
  }

  entitiesStatic = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const t = tileAt(col, row);
      if (t === 'T' && level.theme === 'forest') {
        entitiesStatic.push({ baseline: row * TILE + TILE, draw: () => drawTree(col, row) });
      }
      if (t === 'S') {
        entitiesStatic.push({ baseline: row * TILE + TILE, draw: () => drawStatue(col, row) });
      }
      if (t === 'M') {
        pamela = { x: col * TILE + TILE / 2, y: row * TILE + TILE };
        entitiesStatic.push({ baseline: row * TILE + TILE, draw: drawPamela });
        entitiesStatic.push({ baseline: row * TILE + TILE, draw: drawSasha });
      }
    }
  }
  state = 'intro';
  AudioSys.play(level.music || level.theme);
}

function showMsg(text, after) {
  msgText = text;
  msgAfter = after || null;
  state = 'msg';
}

function handleEnter() {
  if (state === 'title') loadLevel(0);
  else if (state === 'intro') state = (level.type === 'quiz') ? 'quiz' : 'playing';
  else if (state === 'msg') {
    const after = msgAfter;
    msgAfter = null;
    state = 'playing';
    if (after) after();
  } else if (state === 'win') {
    state = 'epilogue';
    fade = 1;
    AudioSys.play('title');
  } else if (state === 'epilogue') {
    state = 'title';
    AudioSys.play('title');
  }
}

// ============================================
// NIVEL DE PREGUNTAS (La Prueba del Corazón)
// ============================================
function answerQuiz(index) {
  if (!quiz || quiz.locked) return;
  const q = level.questions[quiz.qIndex];
  quiz.selected = index;
  if (index === q.correct) {
    quiz.locked = true;
    AudioSys.sfx.villainDown(); // arpegio de acierto
    spawnBurst(canvas.width / 2, 200, '💖', 18);
    showMsg(q.onCorrect, () => {
      if (quiz.qIndex + 1 < level.questions.length) {
        quiz.qIndex++;
        quiz.selected = 0;
        quiz.locked = false;
        state = 'quiz';
      } else {
        AudioSys.sfx.exit();
        loadLevel(levelIndex + 1); // superada la prueba → La Ruta del Café
      }
    });
  } else {
    AudioSys.sfx.hurt();
    showMsg(q.onWrong || 'Mmm... esa no es. Pero está bien: piénselo otra vez, mi amor. ♥',
      () => { state = 'quiz'; });
  }
}

function handleQuizKey(e) {
  if (!quiz || quiz.locked) return;
  const q = level.questions[quiz.qIndex];
  const n = q.options.length;
  const k = e.key.toLowerCase();
  if (k === 'arrowup' || k === 'w') { quiz.selected = (quiz.selected - 1 + n) % n; AudioSys.sfx.shoot(); }
  else if (k === 'arrowdown' || k === 's') { quiz.selected = (quiz.selected + 1) % n; AudioSys.sfx.shoot(); }
  else if (k >= '1' && k <= '9') { const i = Number(k) - 1; if (i < n) answerQuiz(i); }
  else if (k === 'enter' || k === ' ') { e.preventDefault(); answerQuiz(quiz.selected); }
}

// Convierte un evento de puntero a coordenadas internas del canvas (640×480)
function canvasToXY(e) {
  const r = canvas.getBoundingClientRect();
  const p = e.touches && e.touches[0] ? e.touches[0] : e;
  return {
    x: (p.clientX - r.left) / r.width * canvas.width,
    y: (p.clientY - r.top) / r.height * canvas.height,
  };
}

function handleQuizPointer(e) {
  if (!quiz || quiz.locked) return;
  const { x, y } = canvasToXY(e);
  for (let i = 0; i < quizOptionRects.length; i++) {
    const b = quizOptionRects[i];
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
      answerQuiz(i);
      return;
    }
  }
}

// ============================================
// COORDENADAS EN LOS TILESETS
// ============================================
const T_GRASS = [0, 0];
const T_FLOWERS = [[0, 8], [1, 8]];
const T_ROCK = [7, 5];
const PATH_BLOCK = { col: 0, row: 3 };
const WATER_BLOCK = { col: 2, row: 6 };
const TREE = { x: 5 * SRC_TILE, y: 16 * SRC_TILE, w: 32, h: 32 };
const CAVE_FLOOR = [2, 1];
const CAVE_WALL_BLOCK = { col: 1, row: 3 };
const CAVE_BOULDER = [6, 4];
const STATUE = { x: 7 * SRC_TILE, y: 0, w: 16, h: 48 };
const IN_FLOOR = [2, 4];
const IN_WALL = [2, 1];
const CARPET_BLOCK = { col: 0, row: 7 };

function drawTile(img, sheetCol, sheetRow, dx, dy) {
  ctx.drawImage(img, sheetCol * SRC_TILE, sheetRow * SRC_TILE, SRC_TILE, SRC_TILE, dx, dy, TILE, TILE);
}

function drawAutoTile(img, block, types, col, row, x, y) {
  const up = !types.includes(tileAt(col, row - 1));
  const down = !types.includes(tileAt(col, row + 1));
  const left = !types.includes(tileAt(col - 1, row));
  const right = !types.includes(tileAt(col + 1, row));
  const sx = block.col + (left ? 0 : (right ? 2 : 1));
  const sy = block.row + (up ? 0 : (down ? 2 : 1));
  drawTile(img, sx, sy, x, y);
}

// ============================================
// JUGADOR (Sebastián)
// ============================================
const CHAR_W = 16, CHAR_H = 32;
const CHAR_DW = CHAR_W * 2, CHAR_DH = CHAR_H * 2;
const DIR_ROW = { down: 0, right: 1, up: 2, left: 3 };
const DIR_VEC = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };

const player = {
  x: 0, y: 0,
  w: 22, h: 10,
  speed: 150,
  dir: 'down',
  moving: false,
  animTime: 0,
  iframes: 0,   // invulnerabilidad tras recibir daño
  shootCd: 0,   // recarga del lanzacorazones
  stepTimer: 0, // para el polvillo de pasos
};

function moveAxis(dx, dy) {
  const nx = player.x + dx;
  const ny = player.y + dy;
  const corners = [
    [nx, ny], [nx + player.w, ny],
    [nx, ny + player.h], [nx + player.w, ny + player.h],
  ];
  for (const [cx, cy] of corners) {
    if (isSolid(Math.floor(cx / TILE), Math.floor(cy / TILE))) return;
  }
  player.x = nx;
  player.y = ny;
}

function updatePlayer(dt) {
  let dx = 0;
  let dy = 0;

  if (keys['w'] || keys['arrowup'])    { dy -= 1; player.dir = 'up'; }
  if (keys['s'] || keys['arrowdown'])  { dy += 1; player.dir = 'down'; }
  if (keys['a'] || keys['arrowleft'])  { dx -= 1; player.dir = 'left'; }
  if (keys['d'] || keys['arrowright']) { dx += 1; player.dir = 'right'; }

  player.moving = dx !== 0 || dy !== 0;

  if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; }

  moveAxis(dx * player.speed * dt, 0);
  moveAxis(0, dy * player.speed * dt);

  if (player.moving) {
    player.animTime += dt;
    player.stepTimer -= dt;
    if (player.stepTimer <= 0) {
      spawnDust(player.x + player.w / 2, player.y + player.h);
      player.stepTimer = 0.2;
    }
  } else {
    player.animTime = 0;
  }

  player.iframes = Math.max(0, player.iframes - dt);
  player.shootCd = Math.max(0, player.shootCd - dt);

  // Lanzar corazones de amor
  if (keys[' '] && player.shootCd <= 0) {
    const [vx, vy] = DIR_VEC[player.dir];
    hearts.push({
      x: player.x + player.w / 2,
      y: player.y - 14,
      vx: vx * 300,
      vy: vy * 300,
      life: 1.6,
    });
    player.shootCd = 0.35;
    AudioSys.sfx.shoot();
  }

  // ¿Recogió un recuerdo? (niveles de recolección: Jardín, Ruta del Café)
  if (level.type === 'collect') {
    level.collectibles.forEach((c, idx) => {
      if (collected[idx]) return;
      const cx = c.col * TILE + TILE / 2;
      const cy = c.row * TILE + TILE / 2;
      const px = player.x + player.w / 2;
      const py = player.y + player.h / 2;
      if (Math.hypot(px - cx, py - cy) < 20) {
        collected[idx] = true;
        spawnBurst(cx, cy, '💗', 14);
        AudioSys.sfx.collect();
        const allDone = collected.every(Boolean);
        // Sin villano (Jardín): avanza directo. Con villano (Ruta del Café): aún falta vencerlo y salir por 'E'.
        const after = allDone && !level.villain ? () => { AudioSys.sfx.exit(); loadLevel(levelIndex + 1); } : null;
        showMsg(c.text, after);
      }
    });
  }

  // ¿Pisamos una salida abierta?
  const centerCol = Math.floor((player.x + player.w / 2) / TILE);
  const centerRow = Math.floor((player.y + player.h / 2) / TILE);
  if (tileAt(centerCol, centerRow) === 'E') {
    AudioSys.sfx.exit();
    loadLevel(levelIndex + 1);
    return;
  }

  // ¿Llegamos con Pamela? (solo si EL PASADO fue vencido)
  if (pamela && (!villain || villain.dead)) {
    const dx2 = (player.x + player.w / 2) - pamela.x;
    const dy2 = (player.y + player.h) - pamela.y;
    if (Math.hypot(dx2, dy2) < 42) {
      showMsg('Sebastián: — Pamela... la voy a cuidar toda la vida y nunca la voy a soltar. ♥', () =>
        showMsg('Pamela lo abraza con fuerza. Y Sasha, la perrita negra, ladra de pura felicidad: ¡guau, guau!', () => {
          state = 'win';
          AudioSys.play('win');
        })
      );
    }
  }
}

function hurtPlayer() {
  if (player.iframes > 0) return;
  playerHp--;
  player.iframes = 1.2;
  AudioSys.sfx.hurt();
  shake(5, 0.25);
  // Empujón lejos del villano
  if (villain) {
    const ang = Math.atan2(player.y - villain.y, player.x - villain.x);
    moveAxis(Math.cos(ang) * 26, 0);
    moveAxis(0, Math.sin(ang) * 26);
  }
  if (playerHp <= 0) {
    showMsg('El amor nunca se rinde... ¡Inténtelo otra vez, Sebastián!', () => loadLevel(levelIndex));
  }
}

// ============================================
// MENSAJES AMBIENTALES DULCES (no bloquean el juego)
// ============================================
const AMBIENT_MESSAGES = [
  'Usted puede con todo, mi amor. ♥',
  'Un paso más, y estaré ahí. ♥',
  'Pamela y Sasha lo esperan con una sonrisa. ♥',
  'Cada corazón que lanza está lleno de usted. ♥',
];

function updateAmbient(dt) {
  if (!villain || villain.dead) {
    ambientAlpha = Math.max(0, ambientAlpha - dt);
    return;
  }
  ambientTimer -= dt;
  if (ambientTimer <= 0) {
    ambientText = AMBIENT_MESSAGES[Math.floor(Math.random() * AMBIENT_MESSAGES.length)];
    ambientAlpha = 1;
    ambientTimer = 22 + Math.random() * 14;
  }
  ambientAlpha = Math.max(0, ambientAlpha - dt / 3);
}

// ============================================
// VILLANOS (fantasmas: atraviesan paredes)
// ============================================
function updateVillain(dt) {
  if (!villain || villain.dead) return;

  villain.hitFlash = Math.max(0, villain.hitFlash - dt);

  // EL PASADO embiste periódicamente
  let speed = villain.speed;
  if (villain.dash) {
    villain.dashTimer += dt;
    if (villain.dashTimer > 2.6) { villain.dashing = 0.45; villain.dashTimer = 0; }
    if (villain.dashing > 0) { villain.dashing -= dt; speed *= 3.1; }
  }

  const px = player.x + player.w / 2;
  const py = player.y + player.h / 2;
  const ang = Math.atan2(py - villain.y, px - villain.x);
  villain.x += Math.cos(ang) * speed * dt;
  villain.y += Math.sin(ang) * speed * dt;

  // ¿Tocó a Sebastián?
  if (Math.hypot(px - villain.x, py - villain.y) < 14 * villain.scale) hurtPlayer();
}

function updateHearts(dt) {
  for (const h of hearts) {
    h.x += h.vx * dt;
    h.y += h.vy * dt;
    h.life -= dt;
    if (villain && !villain.dead &&
        Math.hypot(h.x - villain.x, h.y - (villain.y - 10 * villain.scale)) < 15 * villain.scale) {
      h.life = 0;
      villain.hp--;
      villain.hitFlash = 0.18;
      AudioSys.sfx.hitVillain();
      shake(2.5, 0.12);
      // Retrocede un poco al ser golpeado por el amor
      const ang = Math.atan2(villain.y - (player.y + player.h / 2), villain.x - (player.x + player.w / 2));
      villain.x += Math.cos(ang) * 22;
      villain.y += Math.sin(ang) * 22;
      if (villain.hp <= 0) {
        villain.dead = true;
        AudioSys.sfx.villainDown();
        spawnBurst(villain.x, villain.y - 10 * villain.scale, '💗', 26);
        shake(7, 0.3);
        showMsg(villain.defeat);
      }
    }
  }
  hearts = hearts.filter((h) => h.life > 0 && h.x > -20 && h.x < canvas.width + 20 && h.y > -20 && h.y < canvas.height + 20);
}

function drawVillain() {
  if (!villain || villain.dead) return;
  const img = images[villain.img];
  const bob = Math.sin(time * 3) * 4;
  const w = CHAR_W * villain.scale;
  const h = CHAR_H * villain.scale;
  const x = villain.x - w / 2;
  const y = villain.y - h + bob;

  // Hacia dónde mira (según el jugador)
  const dx = (player.x + player.w / 2) - villain.x;
  const dy = (player.y + player.h / 2) - villain.y;
  const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  const frame = Math.floor(time * 5) % 4;

  drawShadow(villain.x, villain.y, 15 * villain.scale, 5 * villain.scale);

  ctx.save();
  ctx.globalAlpha = villain.hitFlash > 0 ? 0.45 : 0.82 + Math.sin(time * 2.2) * 0.1;
  ctx.drawImage(img, frame * CHAR_W, DIR_ROW[dir] * CHAR_H, CHAR_W, CHAR_H, x, y, w, h);
  ctx.restore();

  // Nombre y barra de vida
  ctx.textAlign = 'center';
  ctx.font = 'bold 13px monospace';
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(villain.x - 42, y - 26, 84, 22);
  ctx.fillStyle = '#ff9fc8';
  ctx.fillText(villain.name, villain.x, y - 11);
  ctx.fillStyle = '#33112a';
  ctx.fillRect(villain.x - 30, y - 2, 60, 5);
  ctx.fillStyle = '#ff5f9e';
  ctx.fillRect(villain.x - 30, y - 2, 60 * (villain.hp / villain.maxHp), 5);
  ctx.textAlign = 'left';
}

function drawHearts() {
  ctx.font = '20px serif';
  ctx.textAlign = 'center';
  for (const h of hearts) {
    ctx.fillText('💗', h.x, h.y + Math.sin(h.life * 20) * 2);
  }
  ctx.textAlign = 'left';
}

// ============================================
// SISTEMA DE PARTÍCULAS (estallidos de corazones)
// ============================================
function spawnBurst(x, y, symbol, count = 12) {
  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = 40 + Math.random() * 90;
    particles.push({
      x, y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd - 30,
      life: 0.5 + Math.random() * 0.5,
      symbol: symbol || '💗',
      size: 14 + Math.random() * 10,
    });
  }
}

function updateParticles(dt) {
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 70 * dt;
    p.life -= dt;
  }
  particles = particles.filter((p) => p.life > 0);
}

function drawParticles() {
  ctx.textAlign = 'center';
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
    ctx.font = p.size + 'px serif';
    ctx.fillText(p.symbol, p.x, p.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

// Polvillo sutil bajo los pies al caminar
const DUST_LIFE = 0.4;
function spawnDust(x, y) {
  dust.push({
    x: x + (Math.random() - 0.5) * 6,
    y,
    vx: (Math.random() - 0.5) * 8,
    vy: -6 - Math.random() * 6,
    life: DUST_LIFE,
    size: 2 + Math.random() * 1.5,
  });
}

function updateDust(dt) {
  for (const d of dust) {
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    d.life -= dt;
  }
  dust = dust.filter((d) => d.life > 0);
}

function drawDust() {
  for (const d of dust) {
    ctx.globalAlpha = Math.max(0, d.life / DUST_LIFE) * 0.3;
    ctx.fillStyle = '#fffaf0';
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Partículas ambientales flotantes (polen/polvo/brasas), propias de cada tema
const MOTE_CONFIG = {
  forest: { count: 16, color: '255,250,210', vy: [-14, -6] },
  cave:   { count: 14, color: '190,220,255', vy: [-8, -3] },
  castle: { count: 12, color: '255,214,140', vy: [-12, -5] },
};

function spawnMotes(theme) {
  const cfg = MOTE_CONFIG[theme] || MOTE_CONFIG.forest;
  motes = [];
  for (let i = 0; i < cfg.count; i++) {
    motes.push({
      baseX: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      x: 0,
      vy: cfg.vy[0] + Math.random() * (cfg.vy[1] - cfg.vy[0]),
      swayAmp: 6 + Math.random() * 10,
      swaySpeed: 0.4 + Math.random() * 0.6,
      swayPhase: Math.random() * Math.PI * 2,
      size: 1.1 + Math.random() * 1.4,
      color: cfg.color,
    });
  }
}

function updateMotes(dt) {
  for (const m of motes) {
    m.y += m.vy * dt;
    if (m.y < -10) {
      m.y = canvas.height + 10;
      m.baseX = Math.random() * canvas.width;
    }
    m.swayPhase += dt * m.swaySpeed;
    m.x = m.baseX + Math.sin(m.swayPhase) * m.swayAmp;
  }
}

function drawMotes() {
  for (const m of motes) {
    const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(m.swayPhase * 1.3));
    ctx.globalAlpha = twinkle * 0.5;
    ctx.fillStyle = `rgba(${m.color},1)`;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Sombra ovalada suave bajo un personaje
function drawShadow(cx, feetY, rx, ry) {
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(cx, feetY - ry * 0.4, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ============================================
// SPRITES DE PERSONAJES
// ============================================
function drawSprite(img, dirKey, frame, cx, feetY) {
  const sx = frame * CHAR_W;
  const sy = DIR_ROW[dirKey] * CHAR_H;
  ctx.drawImage(img, sx, sy, CHAR_W, CHAR_H, cx - CHAR_DW / 2, feetY - CHAR_DH, CHAR_DW, CHAR_DH);
}

function drawPlayer() {
  const feetY = player.y + player.h;
  drawShadow(player.x + player.w / 2, feetY, 13, 5);
  // Parpadea mientras es invulnerable
  if (player.iframes > 0 && Math.floor(time * 12) % 2 === 0) return;
  const frame = player.moving ? (Math.floor(player.animTime * 8) % 4) : 0;
  const bob = player.moving ? Math.abs(Math.sin(time * 14)) * 2 : 0;
  drawSprite(images.character, player.dir, frame, player.x + player.w / 2, feetY - bob);
}

function drawSasha() {
  // La perrita Sasha (negra, collar rosa), siempre junto a Pamela
  const bob = Math.sin(time * 4) * 2;
  drawShadow(pamela.x + 38, pamela.y + 2, 12, 4);
  ctx.drawImage(images.sasha, pamela.x + 24, pamela.y - 28 + bob, 28, 28);
}

function drawPamela() {
  const frame = Math.floor(time * 2) % 2 === 0 ? 0 : 2;
  drawShadow(pamela.x, pamela.y, 13, 5);
  drawSprite(images.pamela, 'down', frame, pamela.x, pamela.y);
  // Corazoncito flotando sobre Pamela cuando el camino está libre
  if (!villain || villain.dead) {
    ctx.font = '16px serif';
    ctx.textAlign = 'center';
    ctx.fillText('💗', pamela.x, pamela.y - CHAR_DH - 6 + Math.sin(time * 3) * 3);
    ctx.textAlign = 'left';
  }
}

// ============================================
// ESCENARIO POR TEMA
// ============================================
let entitiesStatic = [];

function drawGroundForest() {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const t = tileAt(col, row);
      const x = col * TILE;
      const y = row * TILE;

      if (t === 'W') {
        drawAutoTile(images.overworld, WATER_BLOCK, 'W', col, row, x, y);
        drawWaterSparkle(col, row, x, y);
        continue;
      }
      if (t === 'P' || t === 'E') { drawAutoTile(images.overworld, PATH_BLOCK, 'PE', col, row, x, y); continue; }

      drawTile(images.overworld, T_GRASS[0], T_GRASS[1], x, y);
      if (t === 'f') {
        const [fc, fr] = T_FLOWERS[tileHash(col, row) % T_FLOWERS.length];
        drawTile(images.overworld, fc, fr, x, y);
      }
      if (t === 'b') drawTile(images.overworld, T_ROCK[0], T_ROCK[1], x, y);
      if (t === '.') drawGrassTuft(col, row, x, y);
    }
  }
}

// Matitas de pasto sutiles, para romper la repetición del tile de césped
function drawGrassTuft(col, row, x, y) {
  const h = tileHash(col, row);
  if (h % 4 !== 0) return; // solo ~1 de cada 4 tiles
  const tx = x + 6 + (h % 20);
  const ty = y + 10 + ((h >> 3) % 16);
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = '#2f6b1f';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(tx, ty + 4);
  ctx.lineTo(tx - 2, ty);
  ctx.moveTo(tx + 3, ty + 4);
  ctx.lineTo(tx + 3, ty - 1);
  ctx.stroke();
  ctx.restore();
}

// Destello suave y periódico sobre el agua, distinto por cada tile
function drawWaterSparkle(col, row, x, y) {
  const phase = (tileHash(col, row) % 1000) / 1000 * Math.PI * 2;
  const pulse = Math.max(0, Math.sin(time * 1.4 + phase));
  const glow = Math.pow(pulse, 6);
  if (glow < 0.04) return;
  const sx = x + 8 + (tileHash(col, row + 1) % 16);
  const sy = y + 8 + (tileHash(col + 1, row) % 16);
  ctx.save();
  ctx.globalAlpha = glow * 0.8;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(sx, sy, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGroundCave() {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const t = tileAt(col, row);
      const x = col * TILE;
      const y = row * TILE;

      if (t === 'T') { drawAutoTile(images.cave, CAVE_WALL_BLOCK, 'T', col, row, x, y); continue; }

      drawTile(images.cave, CAVE_FLOOR[0], CAVE_FLOOR[1], x, y);
      if (t === 'b') drawTile(images.cave, CAVE_BOULDER[0], CAVE_BOULDER[1], x, y);
    }
  }
}

function drawGroundCastle() {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const t = tileAt(col, row);
      const x = col * TILE;
      const y = row * TILE;

      if (t === 'T') { drawTile(images.inner, IN_WALL[0], IN_WALL[1], x, y); continue; }
      if (t === 'P') { drawAutoTile(images.inner, CARPET_BLOCK, 'P', col, row, x, y); continue; }

      drawTile(images.inner, IN_FLOOR[0], IN_FLOOR[1], x, y);
    }
  }
}

function drawDecor() {
  if (!level.decor) return;
  ctx.textAlign = 'center';
  level.decor.forEach((d, i) => {
    ctx.font = d.s + 'px serif';
    const bob = d.bob ? Math.sin(time * 2 + i * 1.7) * 3 : 0;
    ctx.fillText(d.e, d.c * TILE + TILE / 2, d.r * TILE + TILE * 0.8 + bob);
  });
  ctx.textAlign = 'left';
}

function drawTree(col, row) {
  const x = col * TILE;
  const y = row * TILE;
  const w = TREE.w * 2;
  const h = TREE.h * 2;
  const baseX = x - TILE / 2 + w / 2; // centro de la base del árbol (pivote del balanceo)
  const baseY = y + TILE;
  const phase = (tileHash(col, row) % 1000) / 1000 * Math.PI * 2;
  const angle = Math.sin(time * 0.8 + phase) * 0.025;

  ctx.save();
  ctx.translate(baseX, baseY);
  ctx.rotate(angle);
  ctx.drawImage(images.overworld, TREE.x, TREE.y, TREE.w, TREE.h, -w / 2, -h, w, h);
  ctx.restore();
}

function drawStatue(col, row) {
  const x = col * TILE;
  const y = row * TILE;
  ctx.drawImage(images.cave, STATUE.x, STATUE.y, STATUE.w, STATUE.h,
    x, y + TILE - STATUE.h * 2, STATUE.w * 2, STATUE.h * 2);
}

function drawApolo() {
  // Apolo, el potrillo de ocho meses: trota de un lado a otro del jardín
  const range = 90;
  const baseX = 10 * TILE;
  const baseY = 6 * TILE + TILE;
  const t = time * 0.7;
  const x = baseX + Math.sin(t) * range;
  const dir = Math.cos(t) >= 0 ? 1 : -1;
  const bob = Math.abs(Math.sin(t * 4)) * 3;
  drawShadow(x, baseY, 16, 5);
  ctx.save();
  ctx.font = '40px serif';
  ctx.textAlign = 'center';
  ctx.translate(x, baseY - bob);
  ctx.scale(dir, 1);
  ctx.fillText('🐴', 0, 0);
  ctx.restore();
}

function drawBaluChon() {
  // Balu_chón, el peluche gigante: sentado, meciéndose apenas
  const x = 15 * TILE + TILE / 2;
  const y = 9 * TILE + TILE;
  const bob = Math.sin(time * 1.5) * 3;
  drawShadow(x, y, 20, 6);
  ctx.font = '64px serif';
  ctx.textAlign = 'center';
  ctx.fillText('🧸', x, y + bob);
  ctx.textAlign = 'left';
}

function drawCollectibles() {
  if (level.type !== 'collect') return;
  ctx.font = '22px serif';
  ctx.textAlign = 'center';
  level.collectibles.forEach((c, idx) => {
    if (collected[idx]) return;
    const bob = Math.sin(time * 3 + idx) * 4;
    const cx = c.col * TILE + TILE / 2;
    const cy = c.row * TILE + TILE / 2 + bob;

    // Resplandor suave detrás del recuerdo, para que se note a distancia
    const glowPulse = 0.5 + 0.5 * Math.sin(time * 2.4 + idx * 1.9);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18);
    g.addColorStop(0, `rgba(255,170,210,${0.35 + glowPulse * 0.2})`);
    g.addColorStop(1, 'rgba(255,170,210,0)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - 18, cy - 18, 36, 36);

    ctx.fillText('💗', cx, cy);
  });
  ctx.textAlign = 'left';
}

function drawVignette() {
  if (level.theme !== 'cave') return;
  const cx = player.x + player.w / 2;
  const cy = player.y + player.h / 2;
  const g = ctx.createRadialGradient(cx, cy, 40, cx, cy, 260);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.75)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawHud() {
  // Panel del nombre de nivel (esquinas redondeadas + degradado)
  ctx.font = 'bold 14px monospace';
  const nameW = ctx.measureText(level.name).width + 20;
  roundRect(8, 8, nameW, 28, 8);
  const grad = ctx.createLinearGradient(8, 8, 8 + nameW, 8);
  grad.addColorStop(0, 'rgba(40,20,50,0.8)');
  grad.addColorStop(1, 'rgba(90,30,60,0.55)');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,159,200,0.45)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#ffe9a8';
  ctx.fillText(level.name, 18, 27);

  if (level.type === 'collect') {
    const done = collected.filter(Boolean).length;
    ctx.font = '12px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText('Recuerdos: ' + done + ' / ' + level.collectibles.length, 12, 50);
  }

  // Vidas de Sebastián (con pulso si está en peligro) — se muestran siempre que haya villano
  if (level.villain) {
    ctx.font = '18px serif';
    const lowHp = playerHp <= 2;
    const pulse = lowHp ? 0.75 + Math.sin(time * 8) * 0.25 : 1;
    for (let i = 0; i < PLAYER_MAX_HP; i++) {
      ctx.globalAlpha = i < playerHp ? pulse : 0.22;
      ctx.fillText('❤️', canvas.width - 130 + i * 24, 28);
    }
    ctx.globalAlpha = 1;
  }

  // Recordatorio de control
  if (villain && !villain.dead) {
    ctx.font = '12px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText(IS_TOUCH ? 'Botón 💗: lanzar corazones' : 'ESPACIO: lanzar corazones 💗', 12, canvas.height - 10);
  }

  // Mensaje ambiental dulce
  if (ambientAlpha > 0) {
    ctx.globalAlpha = ambientAlpha;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd9ea';
    ctx.font = 'italic 14px monospace';
    ctx.fillText(ambientText, canvas.width / 2, canvas.height - 34);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }
}

function drawScene() {
  ctx.save();
  if (shakeTime > 0) {
    ctx.translate((Math.random() - 0.5) * shakeMag, (Math.random() - 0.5) * shakeMag);
  }

  if (level.theme === 'forest') drawGroundForest();
  else if (level.theme === 'cave') drawGroundCave();
  else drawGroundCastle();

  drawDecor();
  drawCollectibles();
  drawDust();

  const entities = entitiesStatic.slice();
  entities.push({ baseline: player.y + player.h, draw: drawPlayer });
  if (villain && !villain.dead) {
    entities.push({ baseline: villain.y, draw: drawVillain });
  }
  if (level.pets) {
    entities.push({ baseline: 6 * TILE + TILE, draw: drawApolo });
    entities.push({ baseline: 9 * TILE + TILE, draw: drawBaluChon });
  }
  entities.sort((a, b) => a.baseline - b.baseline);
  entities.forEach((e) => e.draw());

  drawHearts();
  drawParticles();
  drawMotes();
  drawVignette();
  ctx.restore();

  drawHud();
}

// ============================================
// PANTALLAS (título, cajas de texto, victoria)
// ============================================
function wrapText(text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, y);
  return y;
}

function glowText(text, x, y, glowColor) {
  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 14;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawTwinkleStars() {
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 24; i++) {
    const sx = (i * 53 + 17) % canvas.width;
    const sy = (i * 37 + 11) % (canvas.height * 0.6);
    const tw = 0.3 + 0.7 * Math.abs(Math.sin(time * 1.3 + i * 2.1));
    ctx.globalAlpha = tw * 0.8;
    ctx.fillRect(sx, sy, 2, 2);
  }
  ctx.globalAlpha = 1;
}

function drawTitle() {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawTwinkleStars();

  // Corazones flotando de fondo
  ctx.font = '18px serif';
  ctx.textAlign = 'center';
  ctx.globalAlpha = 0.35;
  for (let i = 0; i < 10; i++) {
    const fx = (i * 137 + 40) % canvas.width;
    const fy = (canvas.height + 40 - ((time * (18 + i * 4) + i * 97) % (canvas.height + 80)));
    ctx.fillText('💗', fx, fy);
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 42px monospace';
  glowText('Las Aventuras', canvas.width / 2, 120, '#ffcf7a');
  glowText('de Bambi', canvas.width / 2, 170, '#ffcf7a');

  ctx.fillStyle = '#aaaacc';
  ctx.font = '16px monospace';
  ctx.fillText('Sebastián al rescate de la princesa Pamela', canvas.width / 2, 212);
  ctx.fillStyle = '#ff9fc8';
  ctx.font = 'bold 15px monospace';
  ctx.fillText('♥ Hecho con amor, para usted ♥', canvas.width / 2, 240);

  ctx.drawImage(images.character, 0, 0, CHAR_W, CHAR_H, canvas.width / 2 - 90, 275, 64, 128);
  ctx.drawImage(images.pamela, 0, 0, CHAR_W, CHAR_H, canvas.width / 2 + 26, 275, 64, 128);
  ctx.drawImage(images.sasha, canvas.width / 2 + 100, 367, 36, 36);

  if (Math.floor(time * 2) % 2 === 0) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(IS_TOUCH ? 'Toque la pantalla para comenzar' : 'Presione ENTER para comenzar', canvas.width / 2, 445);
  }
  ctx.textAlign = 'left';
}

function drawTextBox(title, text) {
  const boxY = canvas.height - 130;
  ctx.fillStyle = 'rgba(10,10,25,0.88)';
  ctx.fillRect(20, boxY, canvas.width - 40, 110);
  ctx.strokeStyle = '#ffe9a8';
  ctx.lineWidth = 2;
  ctx.strokeRect(24, boxY + 4, canvas.width - 48, 102);

  let textY = boxY + 28;
  if (title) {
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 15px monospace';
    ctx.fillText(title, 40, boxY + 28);
    textY = boxY + 52;
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = '14px monospace';
  wrapText(uiText(text), 40, textY, canvas.width - 80, 19);

  if (Math.floor(time * 2) % 2 === 0) {
    ctx.fillStyle = '#aaaacc';
    ctx.font = '13px monospace';
    const cont = IS_TOUCH ? 'Toque la pantalla para continuar ▶' : 'ENTER para continuar ▶';
    ctx.fillText(cont, canvas.width - ctx.measureText(cont).width - 40, boxY + 98);
  }
}

function drawWin() {
  drawScene();
  ctx.fillStyle = 'rgba(10,10,25,0.85)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawTwinkleStars();

  // Lluvia de corazones
  ctx.font = '22px serif';
  ctx.textAlign = 'center';
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 14; i++) {
    const fx = (i * 103 + 60) % canvas.width;
    const fy = (canvas.height + 40 - ((time * (22 + i * 5) + i * 71) % (canvas.height + 80)));
    ctx.fillText(i % 3 === 0 ? '💖' : '💗', fx, fy);
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#ff8fc0';
  ctx.font = 'bold 32px monospace';
  glowText('♥ ¡Sebastián rescató a Pamela! ♥', canvas.width / 2, 130, '#ff8fc0');

  ctx.drawImage(images.character, 0, 32, CHAR_W, CHAR_H, canvas.width / 2 - 74, 170, 64, 128);
  ctx.drawImage(images.pamela, 0, 96, CHAR_W, CHAR_H, canvas.width / 2 + 10, 170, 64, 128);
  ctx.drawImage(images.sasha, canvas.width / 2 + 88, 258, 40, 40);

  ctx.fillStyle = '#ffffff';
  ctx.font = '15px monospace';
  ctx.fillText('Venció al Miedo, a las Dudas y al Pasado.', canvas.width / 2, 336);
  ctx.fillStyle = '#ff9fc8';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('Porque el amor puede con todo.', canvas.width / 2, 362);
  ctx.fillStyle = '#ffffff';
  ctx.font = '14px monospace';
  ctx.fillText('Y junto a Sasha, vivieron felices para siempre.', canvas.width / 2, 386);

  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 26px monospace';
  glowText('FIN', canvas.width / 2, 415, '#ffe9a8');
  ctx.fillStyle = '#aaaacc';
  ctx.font = '14px monospace';
  if (Math.floor(time * 2) % 2 === 0) {
    ctx.fillText(IS_TOUCH ? 'Toque la pantalla para continuar' : 'ENTER para continuar', canvas.width / 2, 450);
  }
  ctx.textAlign = 'left';
}

function drawEpilogue() {
  ctx.fillStyle = '#241733';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawTwinkleStars();

  ctx.font = '20px serif';
  ctx.textAlign = 'center';
  ctx.globalAlpha = 0.4;
  for (let i = 0; i < 10; i++) {
    const fx = (i * 121 + 50) % canvas.width;
    const fy = (canvas.height + 40 - ((time * (16 + i * 3) + i * 61) % (canvas.height + 80)));
    ctx.fillText(i % 3 === 0 ? '💫' : '💗', fx, fy);
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#ffd9ea';
  ctx.font = 'bold 24px monospace';
  glowText('Su futuro juntos', canvas.width / 2, 55, '#ff9fc8');

  ctx.drawImage(images.character, 0, 32, CHAR_W, CHAR_H, canvas.width / 2 - 120, 90, 56, 112);
  ctx.drawImage(images.pamela, 0, 96, CHAR_W, CHAR_H, canvas.width / 2 - 40, 90, 56, 112);
  ctx.drawImage(images.sasha, canvas.width / 2 + 12, 172, 34, 34);

  ctx.font = '44px serif';
  ctx.fillText('🐴', canvas.width / 2 - 165, 195);
  ctx.font = '52px serif';
  ctx.fillText('🧸', canvas.width / 2 + 155, 200);

  ctx.fillStyle = '#ffffff';
  ctx.font = '13px monospace';
  wrapText(
    'Ahora, además de Sasha, tienen a Apolo, un potrillo de ocho meses que ya corre junto a ustedes, y a Balu_chón, un peluche gigante que guarda cada abrazo pendiente. Pequeñas señales de la vida que están construyendo juntos, un día a la vez, mi amor.',
    canvas.width / 2, 320, canvas.width - 140, 19
  );

  ctx.fillStyle = '#ff9fc8';
  ctx.font = 'bold 15px monospace';
  ctx.fillText('Y esto apenas comienza. ♥', canvas.width / 2, 415);

  ctx.fillStyle = '#aaaacc';
  ctx.font = '14px monospace';
  if (Math.floor(time * 2) % 2 === 0) {
    ctx.fillText(IS_TOUCH ? 'Toque la pantalla para volver al título' : 'ENTER para volver al título', canvas.width / 2, 450);
  }
  ctx.textAlign = 'left';
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); return; }
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawQuiz() {
  // Fondo romántico con corazones flotando
  ctx.fillStyle = '#2a1730';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = '18px serif';
  ctx.textAlign = 'center';
  ctx.globalAlpha = 0.28;
  for (let i = 0; i < 12; i++) {
    const fx = (i * 113 + 30) % canvas.width;
    const fy = (canvas.height + 40 - ((time * (14 + i * 3) + i * 83) % (canvas.height + 80)));
    ctx.fillText(i % 3 === 0 ? '💖' : '💗', fx, fy);
  }
  ctx.globalAlpha = 1;

  const q = level.questions[quiz.qIndex];

  // Encabezado
  ctx.fillStyle = '#ff9fc8';
  ctx.font = 'bold 15px monospace';
  ctx.fillText(level.name, canvas.width / 2, 44);
  ctx.fillStyle = '#ffe9a8';
  ctx.font = '13px monospace';
  ctx.fillText('Pregunta ' + (quiz.qIndex + 1) + ' de ' + level.questions.length, canvas.width / 2, 70);

  // Enunciado (centrado, con salto de línea)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px monospace';
  wrapText(q.q, canvas.width / 2, 118, canvas.width - 100, 26);

  // Opciones como botones
  const letters = ['a', 'b', 'c', 'd', 'e', 'f'];
  const optW = 460, optH = 50, gap = 14, startY = 190;
  const optX = (canvas.width - optW) / 2;
  quizOptionRects = [];
  ctx.textAlign = 'left';
  q.options.forEach((opt, i) => {
    const y = startY + i * (optH + gap);
    quizOptionRects.push({ x: optX, y, w: optW, h: optH });
    const selected = i === quiz.selected;

    roundRect(optX, y, optW, optH, 12);
    ctx.fillStyle = selected ? 'rgba(255,95,158,0.28)' : 'rgba(255,255,255,0.06)';
    ctx.fill();
    ctx.lineWidth = selected ? 3 : 2;
    ctx.strokeStyle = selected ? '#ff5f9e' : '#5a4a6a';
    ctx.stroke();

    ctx.fillStyle = selected ? '#ffd9ea' : '#cfc3d8';
    ctx.font = 'bold 17px monospace';
    ctx.fillText(letters[i] + ')', optX + 18, y + optH / 2 + 6);
    ctx.font = '17px monospace';
    ctx.fillStyle = selected ? '#ffffff' : '#e0d8ea';
    ctx.fillText(opt, optX + 52, y + optH / 2 + 6);

    if (selected) {
      ctx.font = '18px serif';
      ctx.textAlign = 'right';
      ctx.fillText('💗', optX + optW - 16, y + optH / 2 + 7);
      ctx.textAlign = 'left';
    }
  });

  drawParticles();

  // Ayuda inferior
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '12px monospace';
  ctx.fillText(IS_TOUCH ? 'Toque la respuesta correcta' : 'Use ▲ ▼ y ENTER · o haga clic en una opción',
    canvas.width / 2, canvas.height - 16);
  ctx.textAlign = 'left';
}

// Fondo bajo las cajas de texto (mapa normal o pantalla del quiz)
function drawBackground() {
  if (level && level.type === 'quiz') drawQuiz();
  else drawScene();
}

// ============================================
// BUCLE PRINCIPAL
// ============================================
let lastTime = 0;

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;
  time += dt;

  updateParticles(dt);
  updateDust(dt);
  updateMotes(dt);
  if (shakeTime > 0) { shakeTime -= dt; if (shakeTime <= 0) shakeMag = 0; }
  fade = Math.max(0, fade - dt * 1.8);

  if (state === 'title') {
    drawTitle();
  } else if (state === 'intro') {
    drawBackground();
    drawTextBox(level.name, level.intro);
  } else if (state === 'quiz') {
    drawQuiz();
  } else if (state === 'msg') {
    drawBackground();
    drawTextBox(null, msgText);
  } else if (state === 'playing') {
    updatePlayer(dt);
    if (state === 'playing') {
      updateVillain(dt);
      updateHearts(dt);
      updateAmbient(dt);
    }
    if (state === 'win') drawWin();
    else if (state === 'msg') { drawBackground(); drawTextBox(null, msgText); }
    else if (state === 'intro') { drawBackground(); drawTextBox(level.name, level.intro); }
    else if (state === 'quiz') drawQuiz();
    else drawScene();
  } else if (state === 'win') {
    drawWin();
  } else if (state === 'epilogue') {
    drawEpilogue();
  }

  // Fundido entre escenas
  if (fade > 0) {
    ctx.fillStyle = '#000';
    ctx.globalAlpha = fade;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
  }

  requestAnimationFrame(gameLoop);
}

Promise.all([
  loadImage('character', 'assets/character.png'),
  loadImage('pamela', 'assets/pamela.png'),
  loadImage('sasha', 'assets/sasha.png'),
  loadImage('miedo', 'assets/miedo.png'),
  loadImage('dudas', 'assets/dudas.png'),
  loadImage('pasado', 'assets/pasado.png'),
  loadImage('prisa', 'assets/prisa.png'),
  loadImage('overworld', 'assets/Overworld.png'),
  loadImage('cave', 'assets/cave.png'),
  loadImage('inner', 'assets/Inner.png'),
]).then(() => {
  // Depuración: abrir con ?lvl=N para saltar directo a un nivel
  const lvl = new URLSearchParams(location.search).get('lvl');
  if (lvl !== null) { loadLevel(Number(lvl)); if (level.type !== 'quiz') state = 'playing'; }
  requestAnimationFrame(gameLoop);
}).catch(() => {
  ctx.fillStyle = '#fff';
  ctx.font = '16px monospace';
  ctx.fillText('Error cargando los sprites (assets/)', 20, 40);
});
