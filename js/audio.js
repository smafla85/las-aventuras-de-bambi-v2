// ============================================
// LAS AVENTURAS DE BAMBI - Música y sonidos
// Chiptune generado con Web Audio API (sin archivos)
// ============================================

const AudioSys = (() => {
  let ctx = null;
  let master = null;
  let current = null; // pista sonando: { name, timer }
  let muted = false;

  const _ = null; // silencio (legibilidad de las partituras)

  // Frecuencia desde nota MIDI (69 = La 440)
  const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function ensure() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 1;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
  }

  function tone(time, midi, dur, type = 'square', vol = 0.05, slideTo = null) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq(midi), time);
    if (slideTo !== null) o.frequency.linearRampToValueAtTime(freq(slideTo), time + dur);
    g.gain.setValueAtTime(vol, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur);
    o.connect(g);
    g.connect(master);
    o.start(time);
    o.stop(time + dur + 0.02);
  }

  // ============================================
  // PARTITURAS (notas MIDI, _ = silencio, en corcheas)
  // ============================================
  const TRACKS = {
    title: { // Vals romántico en Do mayor
      bpm: 92, lead: 'triangle', leadVol: 0.06,
      mel: [72,_,76,_,79,_,76,_, 81,_,79,_,76,_,74,_, 72,_,76,_,79,_,84,_, 83,_,81,_,79,_,_,_],
      bass: [48,_,_,_,55,_,_,_, 53,_,_,_,57,_,_,_, 48,_,_,_,55,_,_,_, 55,_,53,_,48,_,_,_],
    },
    forest: { // Alegre en Sol mayor
      bpm: 132, lead: 'square', leadVol: 0.04,
      mel: [79,_,79,81,83,_,81,_, 79,_,83,_,86,_,83,81, 79,_,79,81,83,86,83,81, 79,_,74,_,79,_,_,_],
      bass: [55,_,_,_,60,_,_,_, 55,_,_,_,62,_,_,_, 55,_,_,_,60,_,_,_, 62,_,60,_,55,_,_,_],
    },
    cave: { // Misterioso en La menor
      bpm: 96, lead: 'triangle', leadVol: 0.07,
      mel: [69,_,_,72,_,_,71,_, 69,_,_,68,_,_,69,_, 72,_,_,74,_,_,76,_, 74,_,71,_,69,_,_,_],
      bass: [45,_,_,_,52,_,_,_, 53,_,_,_,52,_,_,_, 45,_,_,_,52,_,_,_, 50,_,52,_,45,_,_,_],
    },
    castle: { // Tenso y épico en Re menor
      bpm: 122, lead: 'square', leadVol: 0.045,
      mel: [74,_,74,_,77,_,74,_, 82,_,81,_,77,_,74,_, 74,_,77,_,81,_,84,_, 82,_,81,_,77,_,76,_],
      bass: [50,_,_,_,45,_,_,_, 46,_,_,_,45,_,_,_, 50,_,_,_,45,_,_,_, 46,_,45,_,50,_,_,_],
    },
    win: { // Fanfarria feliz en Do mayor
      bpm: 128, lead: 'square', leadVol: 0.05,
      mel: [72,76,79,84,_,83,84,_, 81,79,81,_,79,_,76,_, 72,76,79,84,_,83,84,_, 86,_,84,_,_,_,_,_],
      bass: [48,_,_,_,55,_,_,_, 53,_,_,_,55,_,_,_, 48,_,_,_,55,_,_,_, 55,_,55,_,48,_,_,_],
    },
    garden: { // Vals tierno en Fa mayor, para el paseo del Jardín de los Recuerdos
      bpm: 84, lead: 'triangle', leadVol: 0.055,
      mel: [65,_,69,_,72,_,69,_, 74,_,72,_,69,_,67,_, 65,_,69,_,72,_,77,_, 76,_,74,_,72,_,_,_],
      bass: [41,_,_,_,48,_,_,_, 46,_,_,_,50,_,_,_, 41,_,_,_,48,_,_,_, 48,_,46,_,41,_,_,_],
    },
  };

  // Secuenciador: agenda las notas un poco por delante del reloj de audio
  function play(name) {
    ensure();
    if (current && current.name === name) return;
    stop();
    const t = TRACKS[name];
    if (!t) return;
    const stepDur = 60 / t.bpm / 2;
    let step = 0;
    let nextTime = ctx.currentTime + 0.06;
    const timer = setInterval(() => {
      while (nextTime < ctx.currentTime + 0.25) {
        const i = step % t.mel.length;
        if (t.mel[i] !== null) tone(nextTime, t.mel[i], stepDur * 0.9, t.lead, t.leadVol);
        if (t.bass[i] !== null) tone(nextTime, t.bass[i], stepDur * 1.7, 'triangle', 0.075);
        step++;
        nextTime += stepDur;
      }
    }, 60);
    current = { name, timer };
  }

  function stop() {
    if (current) { clearInterval(current.timer); current = null; }
  }

  function toggleMute() {
    ensure();
    muted = !muted;
    master.gain.value = muted ? 0 : 1;
    return muted;
  }

  // ============================================
  // EFECTOS DE SONIDO
  // ============================================
  const sfx = {
    shoot() { ensure(); tone(ctx.currentTime, 88, 0.09, 'square', 0.04, 96); },
    hitVillain() { ensure(); tone(ctx.currentTime, 67, 0.12, 'sawtooth', 0.05, 55); },
    hurt() { ensure(); tone(ctx.currentTime, 45, 0.2, 'square', 0.06, 38); },
    villainDown() {
      ensure();
      const t0 = ctx.currentTime;
      [72, 76, 79, 84].forEach((m, i) => tone(t0 + i * 0.09, m, 0.14, 'square', 0.05));
    },
    exit() {
      ensure();
      const t0 = ctx.currentTime;
      [79, 84].forEach((m, i) => tone(t0 + i * 0.12, m, 0.2, 'triangle', 0.07));
    },
    collect() {
      ensure();
      const t0 = ctx.currentTime;
      [76, 81, 86].forEach((m, i) => tone(t0 + i * 0.07, m, 0.16, 'triangle', 0.055));
    },
  };

  return { ensure, play, stop, toggleMute, sfx, get muted() { return muted; } };
})();
