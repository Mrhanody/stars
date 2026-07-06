/* ══════════════════════════════════════════
   My Favorite Star — script.js
   Vanilla JS · No dependencies
══════════════════════════════════════════ */

(function () {
  'use strict';

  // ── Element refs ──────────────────────────────
  const pinkScreen    = document.getElementById('pink-screen');
  const nightScreen   = document.getElementById('night-screen');
  const whoBtn        = document.getElementById('who-btn');
  const finalText     = document.getElementById('final-text');
  const glowStar      = document.getElementById('glow-star');
  const skyCanvas     = document.getElementById('sky-canvas');
  const ctx           = skyCanvas.getContext('2d');

  // ── State ─────────────────────────────────────
  let stars          = [];
  let shootingTimer  = null;
  let starAngle      = 0;
  let starAnimId     = null;
  let trailInterval  = null;
  let transitionDone = false;

  // ── Helpers ───────────────────────────────────
  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function randInt(min, max) {
    return Math.floor(rand(min, max + 1));
  }

  // ══════════════════════════════════════════════
  // SKY CANVAS
  // ══════════════════════════════════════════════

  function resizeCanvas() {
    skyCanvas.width  = window.innerWidth;
    skyCanvas.height = window.innerHeight;
    if (transitionDone) drawStars();
  }

  function buildStars(count) {
    stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x:       rand(0, skyCanvas.width),
        y:       rand(0, skyCanvas.height),
        r:       rand(0.4, 1.6),
        alpha:   rand(0.3, 1),
        speed:   rand(0.003, 0.01),
        phase:   rand(0, Math.PI * 2),
      });
    }
  }

  function drawStars() {
    ctx.clearRect(0, 0, skyCanvas.width, skyCanvas.height);

    // Night sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, skyCanvas.height);
    grad.addColorStop(0,   '#0a0018');
    grad.addColorStop(0.5, '#0d0a2e');
    grad.addColorStop(1,   '#120a3a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, skyCanvas.width, skyCanvas.height);

    // Draw each star
    const now = Date.now() / 1000;
    stars.forEach(s => {
      const a = s.alpha * (0.55 + 0.45 * Math.sin(now * s.speed * 60 + s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fill();
    });
  }

  let lastFrame = 0;
  function skyLoop(ts) {
    if (ts - lastFrame > 40) { // ~24 fps — gentle enough
      drawStars();
      lastFrame = ts;
    }
    requestAnimationFrame(skyLoop);
  }

  // ══════════════════════════════════════════════
  // SHOOTING STARS
  // ══════════════════════════════════════════════

  function launchShootingStar() {
    const el    = document.createElement('div');
    el.className = 'shooting-star';

    // Random start position along top / left edges
    const side = Math.random() < 0.7 ? 'top' : 'left';
    let startX, startY;

    if (side === 'top') {
      startX = rand(10, 90);       // % of width
      startY = rand(-2, 10);
    } else {
      startX = rand(-5, 5);
      startY = rand(5, 50);
    }

    const angleRad = rand(20, 45) * (Math.PI / 180);
    const dist     = rand(220, 380);
    const dx       = Math.cos(angleRad) * dist;
    const dy       = Math.sin(angleRad) * dist;
    const angleDeg = rand(20, 45);

    el.style.left = `${startX}vw`;
    el.style.top  = `${startY}vh`;
    el.style.setProperty('--angle', `${angleDeg}deg`);
    el.style.setProperty('--dx',    `${dx}px`);
    el.style.setProperty('--dy',    `${dy}px`);

    document.body.appendChild(el);

    // Trigger reflow then add fly class
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.classList.add('fly');
      });
    });

    setTimeout(() => el.remove(), 1400);
  }

  function startShootingStars() {
    function schedule() {
      const delay = rand(2800, 6500);
      shootingTimer = setTimeout(() => {
        launchShootingStar();
        schedule();
      }, delay);
    }
    // First one after a short pause
    setTimeout(launchShootingStar, 1800);
    schedule();
  }

  // ══════════════════════════════════════════════
  // TYPING ANIMATION
  // ══════════════════════════════════════════════

  function typeMessage(message, onDone) {
    let i = 0;
    finalText.textContent = '';

    function typeNext() {
      if (i < message.length) {
        finalText.textContent += message[i];
        i++;
        setTimeout(typeNext, 60 + rand(0, 40));
      } else {
        finalText.classList.add('done');
        if (onDone) onDone();
      }
    }

    typeNext();
  }

  // ══════════════════════════════════════════════
  // GLOWING STAR ORBIT & SPARKLE TRAIL
  // ══════════════════════════════════════════════

  const SPARKLE_COLORS = [
    '#ffe066', '#ffd6fa', '#c8b4ff',
    '#b4e8ff', '#fffbe0', '#ffaad4',
  ];

  function spawnSparkle(x, y) {
    const el = document.createElement('div');
    el.className = 'sparkle';

    const size = rand(4, 10);
    el.style.width  = `${size}px`;
    el.style.height = `${size}px`;
    el.style.left   = `${x}px`;
    el.style.top    = `${y}px`;
    el.style.background = SPARKLE_COLORS[randInt(0, SPARKLE_COLORS.length - 1)];
    el.style.boxShadow  = `0 0 ${size + 4}px ${SPARKLE_COLORS[randInt(0, SPARKLE_COLORS.length - 1)]}`;

    document.getElementById('trail-container').appendChild(el);
    setTimeout(() => el.remove(), 720);
  }

  function startGlowStar() {
    glowStar.classList.add('visible');

    let lastSparkleTime = 0;

    function animate(ts) {
      starAngle += 0.022;

      // Orbit around the final text
      const rect   = finalText.getBoundingClientRect();
      const cx     = rect.left + rect.width  / 2;
      const cy     = rect.top  + rect.height / 2;

      // Elliptical orbit — wider than tall, stays snugly around text
      const rx = rect.width  / 2 + 38;
      const ry = rect.height / 2 + 22;

      const sx = cx + rx * Math.cos(starAngle);
      const sy = cy + ry * Math.sin(starAngle);

      glowStar.style.left = `${sx}px`;
      glowStar.style.top  = `${sy}px`;

      // Spawn sparkle every ~90ms (throttled by ts)
      if (ts - lastSparkleTime > 90) {
        spawnSparkle(sx, sy);
        lastSparkleTime = ts;
      }

      starAnimId = requestAnimationFrame(animate);
    }

    starAnimId = requestAnimationFrame(animate);
  }

  // ══════════════════════════════════════════════
  // TRANSITION SEQUENCE
  // ══════════════════════════════════════════════

  function startTransition() {
    // Prevent double-click
    whoBtn.disabled = true;

    // 1. Show night canvas (fades in via CSS)
    skyCanvas.classList.add('visible');

    // 2. Fade out pink screen
    setTimeout(() => {
      pinkScreen.classList.add('fade-out');
    }, 300);

    // 3. After pink is gone, start shooting stars + reveal night content
    setTimeout(() => {
      transitionDone = true;
      pinkScreen.style.display = 'none';
      nightScreen.classList.add('visible');
      startShootingStars();

      // 4. Type the message
      setTimeout(() => {
        typeMessage('You are always my favorite star memo.', () => {
          // 5. After typing, start the glowing star
          setTimeout(startGlowStar, 400);
        });
      }, 500);

    }, 2200);
  }

  // ══════════════════════════════════════════════
  // INIT
  // ══════════════════════════════════════════════

  function init() {
    resizeCanvas();
    buildStars(180);
    requestAnimationFrame(skyLoop);

    whoBtn.addEventListener('click', startTransition);

    window.addEventListener('resize', () => {
      resizeCanvas();
      buildStars(180);
    });
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
