const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const onActivate = (el, fn) => {
  el.addEventListener('click', fn);
  el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } });
};

/* 1. LANGIT BINTANG + BINTANG JATUH */
const sky = document.getElementById('sky');
const sctx = sky.getContext('2d');
let stars = [], shooting = null, nextShot = 3000;

function initSky() {
  sky.width = window.innerWidth;
  sky.height = window.innerHeight;
  const n = Math.round((sky.width * sky.height) / 9000);
  stars = Array.from({ length: n }, () => ({
    x: Math.random() * sky.width,
    y: Math.random() * sky.height,
    r: Math.random() * 1.2 + 0.3,
    s: Math.random() * 0.002 + 0.0007,
    o: Math.random() * Math.PI * 2,
    gold: Math.random() < 0.25
  }));
}
window.addEventListener('resize', initSky);
initSky();

let last = performance.now();
function drawSky(t) {
  const dt = t - last; last = t;
  sctx.clearRect(0, 0, sky.width, sky.height);
  stars.forEach(s => {
    const a = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * s.s + s.o));
    sctx.globalAlpha = a;
    sctx.fillStyle = s.gold ? '#E9CB93' : '#EEE7DC';
    sctx.beginPath(); sctx.arc(s.x, s.y, s.r, 0, 6.283); sctx.fill();
  });
  nextShot -= dt;
  if (nextShot < 0 && !shooting) {
    shooting = { x: Math.random() * sky.width * 0.8, y: Math.random() * sky.height * 0.4, life: 1 };
    nextShot = 6000 + Math.random() * 6000;
  }
  if (shooting) {
    const p = shooting;
    const g = sctx.createLinearGradient(p.x, p.y, p.x - 90, p.y - 45);
    g.addColorStop(0, 'rgba(233,203,147,' + p.life + ')');
    g.addColorStop(1, 'rgba(233,203,147,0)');
    sctx.globalAlpha = 1; sctx.strokeStyle = g; sctx.lineWidth = 1.5;
    sctx.beginPath(); sctx.moveTo(p.x, p.y); sctx.lineTo(p.x - 90, p.y - 45); sctx.stroke();
    p.x += 9; p.y += 4.5; p.life -= 0.018;
    if (p.life <= 0) shooting = null;
  }
  if (!reduceMotion) requestAnimationFrame(drawSky);
}
requestAnimationFrame(drawSky);

/* 2. CAHAYA MENGIKUTI KURSOR */
if (!reduceMotion) {
  window.addEventListener('pointermove', e => {
    document.body.style.setProperty('--mx', e.clientX + 'px');
    document.body.style.setProperty('--my', e.clientY + 'px');
  });
}

/* 3. HITUNG USIA 0 → 20 */
const ageNum = document.getElementById('ageNum');
const bigAge = document.getElementById('bigAge');
(function countUp() {
  const target = 20, dur = reduceMotion ? 1 : 1500, delay = 500, start = performance.now() + delay;
  function tick(now) {
    if (now < start) return requestAnimationFrame(tick);
    const p = Math.min(1, (now - start) / dur);
    ageNum.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick); else bigAge.classList.add('done');
  }
  requestAnimationFrame(tick);
})();

/* 4. MUNCUL SAAT SCROLL */
const io = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  });
}, { threshold: 0.18 });
document.querySelectorAll('.rv').forEach((el, i) => {
  if (el.matches('.letter-body p')) el.style.setProperty('--d', '0s');
  io.observe(el);
});
document.querySelectorAll('.scrapbook-item').forEach((el, i) => el.style.setProperty('--d', (i % 2) * 0.15 + 's'));

/* 5. GARIS TIMELINE TERISI SAAT SCROLL */
const timeline = document.getElementById('timeline');
function updateLine() {
  const r = timeline.getBoundingClientRect();
  const p = (window.innerHeight * 0.6 - r.top) / r.height;
  timeline.style.setProperty('--p', Math.min(1, Math.max(0, p)));
}
window.addEventListener('scroll', updateLine, { passive: true });
updateLine();

/* 6. TIUP LILIN + CONFETTI */
const cakeBtn = document.getElementById('cakeBtn');
const flame = document.getElementById('flame');
const wishHint = document.getElementById('wishHint');
const canvas = document.getElementById('confettiCanvas');
const ctx = canvas.getContext('2d');
let isBlown = false, particles = [];

function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const palette = ['#E9CB93', '#B7A6F2', '#EEE7DC', '#8F7DD6', '#F0A35E'];

function createConfetti() {
  const box = cakeBtn.getBoundingClientRect();
  const ox = box.left + box.width / 2, oy = box.top;
  particles = Array.from({ length: 110 }, () => ({
    x: ox, y: oy,
    vx: (Math.random() - 0.5) * 14,
    vy: (Math.random() - 0.9) * 17,
    size: Math.random() * 7 + 4,
    color: palette[Math.floor(Math.random() * palette.length)],
    rot: Math.random() * 360,
    vRot: (Math.random() - 0.5) * 10,
    alpha: 1,
    round: Math.random() < 0.35
  }));
  renderConfetti();
}

function renderConfetti() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let alive = false;
  particles.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.vy += 0.33; p.vx *= 0.99;
    p.rot += p.vRot; p.alpha -= 0.008;
    if (p.alpha > 0) {
      alive = true;
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color;
      if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, 6.283); ctx.fill(); }
      else ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }
  });
  if (alive) requestAnimationFrame(renderConfetti);
  else ctx.clearRect(0, 0, canvas.width, canvas.height);
}

onActivate(cakeBtn, () => {
  if (!isBlown) {
    flame.classList.add('off');
    document.body.classList.add('wished');
    wishHint.textContent = '🎉 Your wish has been sent to the universe! ✨';
    wishHint.style.color = '#B7A6F2';
    if (!reduceMotion) createConfetti();
    isBlown = true;
  } else {
    flame.classList.remove('off');
    document.body.classList.remove('wished');
    wishHint.textContent = '✨ Tap the candle flame to blow it out ✨';
    wishHint.style.color = '#E9CB93';
    isBlown = false;
  }
});

/* 7. MUSIK LO-FI (tanpa file eksternal) */
const audioBtn = document.getElementById('audioBtn');
const audioText = document.getElementById('audioText');
let audioCtx = null, isPlayingAudio = false, chimeInterval = null;
const notes = [261.63, 329.63, 392.00, 523.25, 440.00];

function playSoftNote() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(notes[Math.floor(Math.random() * notes.length)], audioCtx.currentTime);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, audioCtx.currentTime + 0.3);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 2.8);
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(); osc.stop(audioCtx.currentTime + 3.0);
}

onActivate(audioBtn, () => {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  if (!isPlayingAudio) {
    isPlayingAudio = true;
    audioBtn.classList.add('playing');
    audioText.textContent = 'Musik Mengalun 🎶';
    playSoftNote();
    chimeInterval = setInterval(playSoftNote, 1400);
  } else {
    isPlayingAudio = false;
    audioBtn.classList.remove('playing');
    audioText.textContent = 'Putar Musik Suasana';
    clearInterval(chimeInterval);
  }
});
