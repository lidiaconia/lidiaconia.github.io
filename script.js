// Hamburger Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', function() {
      const isOpen = hamburger.classList.toggle('active');
            mobileMenu.classList.toggle('active');
      hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
        
        // Close menu when a link is clicked
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                hamburger.classList.remove('active');
                mobileMenu.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!hamburger.contains(event.target) && !mobileMenu.contains(event.target)) {
                hamburger.classList.remove('active');
                mobileMenu.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
            }
        });
    }
});

  // Scroll to Top Button
  document.addEventListener('DOMContentLoaded', function() {
    const scrollTopBtn = document.createElement('button');
    scrollTopBtn.className = 'scroll-top-btn';
    scrollTopBtn.setAttribute('type', 'button');
    scrollTopBtn.setAttribute('aria-label', 'Volver arriba');
    scrollTopBtn.setAttribute('title', 'Volver arriba');
    scrollTopBtn.textContent = '↑';
    document.body.appendChild(scrollTopBtn);

    const scrollTarget = window;

    const toggleVisibility = function() {
      const scrollY = mainContainer ? mainContainer.scrollTop : window.scrollY;
      if (scrollY > 300) {
        scrollTopBtn.classList.add('visible');
      } else {
        scrollTopBtn.classList.remove('visible');
      }
    };

    scrollTarget.addEventListener('scroll', toggleVisibility, { passive: true });
    toggleVisibility();

    scrollTopBtn.addEventListener('click', function() {
      scrollTarget.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  });

// Stat counter animation
(function () {
    function animateCounter(el) {
        var target = parseInt(el.getAttribute('data-count'), 10);
        var duration = 1500;
        var start = null;
        function step(ts) {
            if (!start) start = ts;
            var progress = Math.min((ts - start) / duration, 1);
            el.textContent = Math.floor(progress * target);
            if (progress < 1) requestAnimationFrame(step);
            else el.textContent = target;
        }
        requestAnimationFrame(step);
    }

    var observed = new Set();
    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting && !observed.has(entry.target)) {
                observed.add(entry.target);
                animateCounter(entry.target);
            }
        });
    }, { threshold: 0.3 });

    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('.stat-number[data-count]').forEach(function (el) {
            observer.observe(el);
        });
    });
})();

// Smooth Scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Interactive Grid Background
var gap = 40;
var radiusVmin = 30;
var speedIn = 0.5;
var speedOut = 0.6;
var restScale = 0.09;
var minHoverScale = 1;
var maxHoverScale = 3;
var waveSpeed = 1200;
var waveWidth = 180;

// Paleta adaptada al estilo slate/blue:
var PALETTE = [
  { type: 'solid', value: '#334155' }, // slate-700
  { type: 'solid', value: '#475569' }, // slate-600
  { type: 'solid', value: '#64748b' }, // slate-500
  { type: 'solid', value: '#a78bfa' }, // purple
  { type: 'solid', value: '#67e8f9' }, // cyan
  { type: 'gradient', stops: ['#a78bfa', '#67e8f9'] },
  { type: 'gradient', stops: ['#334155', '#a78bfa'] },
  { type: 'gradient', stops: ['#334155', '#67e8f9'] }
];

var SHAPE_TYPES = ['circle', 'pill', 'star', 'star'];

var canvas = document.getElementById('particleCanvas');
var ctx = canvas.getContext('2d');

var grid = null;
var rafId = null;
var pointer = null;
var activity = 0;
var waves = [];
var maskRects = [];
var frameCount = 0;
var maskOverride = false;

function rnd(min, max) { return Math.random() * (max - min) + min; }
function rndInt(min, max) { return Math.floor(rnd(min, max + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function smoothstep(t) {
  var c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

function durationToFactor(seconds) {
  if (seconds <= 0) return 1;
  return 1 - Math.pow(0.05, 1 / (60 * seconds));
}

function drawCircle(ctx, size) {
  ctx.beginPath();
  ctx.arc(0, 0, size, 0, Math.PI * 2);
  ctx.fill();
}

function drawPill(ctx, size) {
  var w = size * 0.48;
  var h = size;
  ctx.beginPath();
  ctx.roundRect(-w, -h, w * 2, h * 2, w);
  ctx.fill();
}

function drawStar(ctx, size, points, innerRatio) {
  ctx.beginPath();
  for (var i = 0; i < points * 2; i++) {
    var angle = (i * Math.PI) / points - Math.PI / 2;
    var r = i % 2 === 0 ? size : size * innerRatio;
    var x = Math.cos(angle) * r;
    var y = Math.sin(angle) * r;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function drawShape(ctx, shape) {
  switch (shape.type) {
    case 'circle': return drawCircle(ctx, shape.size / 1.5);
    case 'pill':   return drawPill(ctx, shape.size / 1.4);
    case 'star':   return drawStar(ctx, shape.size, shape.points, shape.innerRatio);
  }
}

function resolveFill(ctx, colorDef, size) {
  if (colorDef.type === 'solid') return colorDef.value;
  var grad = ctx.createRadialGradient(0, -size * 0.3, 0, 0, size * 0.3, size * 1.5);
  grad.addColorStop(0, colorDef.stops[0]);
  grad.addColorStop(1, colorDef.stops[1]);
  return grad;
}

function randomStarProps() {
  return {
    points: rndInt(4, 10),
    innerRatio: rnd(0.1, 0.5),
  };
}

function buildGrid() {
  var W = window.innerWidth;
  var H = window.innerHeight;
  var cols = Math.floor(W / gap);
  var rows = Math.floor(H / gap);
  var offsetX = (W - (cols - 1) * gap) / 2;
  var offsetY = (H - (rows - 1) * gap) / 2;
  var shapes = [];

  for (var row = 0; row < rows; row++) {
    for (var col = 0; col < cols; col++) {
      var type = pick(SHAPE_TYPES);
      var shape = {
        x: offsetX + col * gap,
        y: offsetY + row * gap,
        type: type,
        color: pick(PALETTE),
        angle: rnd(0, Math.PI * 2),
        size: gap * 0.38,
        scale: restScale,
        maxScale: rnd(minHoverScale, maxHoverScale),
        hovered: false,
      };
      if (type === 'star') Object.assign(shape, randomStarProps());
      shapes.push(shape);
    }
  }

  return { shapes: shapes, width: W, height: H };
}

function initCanvasGrid() {
  var W = window.innerWidth;
  var H = window.innerHeight;
  var dpr = window.devicePixelRatio || 1;

  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);

  grid = buildGrid();
}

function tick() {
  if (!grid) { rafId = requestAnimationFrame(tick); return; }

  var shapes = grid.shapes;
  var width = grid.width;
  var height = grid.height;
  var radius = Math.min(width, height) * (radiusVmin / 100);
  var now = performance.now();

  ctx.clearRect(0, 0, width, height);
  // Color de fondo oscuro pizarra
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  activity *= 0.93;

  frameCount++;
  if (frameCount % 10 === 0) {
    maskRects = Array.from(document.querySelectorAll('[data-shape-mask]'))
      .map(function(el) { return el.getBoundingClientRect(); });
  }

  var maxDist = Math.sqrt(width * width + height * height);
  waves = waves.filter(function(w) {
    return (now - w.startTime) / 1000 * waveSpeed < maxDist + waveWidth;
  });

  for (var i = 0; i < shapes.length; i++) {
    var shape = shapes[i];
    var pad = gap / 2;
    var masked = !maskOverride && maskRects.some(function(r) {
      return shape.x >= r.left - pad && shape.x <= r.right  + pad &&
             shape.y >= r.top  - pad && shape.y <= r.bottom + pad;
    });

    if (masked) {
      shape.scale += (0 - shape.scale) * durationToFactor(speedOut);
      if (shape.scale < 0.005) shape.scale = 0;
      continue;
    }

    var pointerInfluence = 0;
    if (pointer && activity > 0.001) {
      var dx = shape.x - pointer.x;
      var dy = shape.y - pointer.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      pointerInfluence = smoothstep(1 - dist / radius) * activity;

      if (pointerInfluence > 0.05 && !shape.hovered) {
        shape.hovered = true;
        shape.maxScale = rnd(minHoverScale, maxHoverScale);
        shape.angle = rnd(0, Math.PI * 2);
        if (shape.type === 'star') Object.assign(shape, randomStarProps());
      } else if (pointerInfluence <= 0.05) {
        shape.hovered = false;
      }
    } else {
      shape.hovered = false;
    }

    var waveInfluence = 0;
    for (var j = 0; j < waves.length; j++) {
      var wave = waves[j];
      var waveRadius = (now - wave.startTime) / 1000 * waveSpeed;
      var wdx = shape.x - wave.x;
      var wdy = shape.y - wave.y;
      var wdist = Math.sqrt(wdx * wdx + wdy * wdy);
      var t = 1 - Math.abs(wdist - waveRadius) / waveWidth;
      if (t > 0) waveInfluence = Math.max(waveInfluence, Math.sin(Math.PI * t));
    }

    var pointerTarget = restScale + pointerInfluence * (shape.maxScale - restScale);
    var waveTarget = restScale + waveInfluence * (shape.maxScale - restScale);
    var target = Math.max(pointerTarget, waveTarget);

    var factor = target > shape.scale ? durationToFactor(speedIn) : durationToFactor(speedOut);
    shape.scale += (target - shape.scale) * factor;

    if (shape.scale < restScale * 0.15) continue;

    ctx.save();
    ctx.translate(shape.x, shape.y);
    ctx.rotate(shape.angle);
    ctx.scale(shape.scale, shape.scale);
    ctx.fillStyle = resolveFill(ctx, shape.color, shape.size);
    drawShape(ctx, shape);
    ctx.restore();
  }

  rafId = requestAnimationFrame(tick);
}

function onMove(e) {
  pointer = { x: e.clientX, y: e.clientY };
  activity = 1;
}

function onClick(e) {
  triggerWave(e.clientX, e.clientY);
}

function triggerWave(x, y) {
  x = x !== undefined ? x : window.innerWidth / 2;
  y = y !== undefined ? y : window.innerHeight / 2;
  waves.push({ x: x, y: y, startTime: performance.now() });
  maskOverride = true;
  var delay = Math.sqrt(window.innerWidth * window.innerWidth + window.innerHeight * window.innerHeight) / waveSpeed;
  setTimeout(function() { maskOverride = false; }, delay * 1000);
}

initCanvasGrid();
rafId = requestAnimationFrame(tick);

window.addEventListener('resize', initCanvasGrid);
window.addEventListener('pointermove', onMove);
window.addEventListener('click', onClick);
triggerWave();

// Waitlist Form Validation and Submission
const waitlistForm = document.getElementById('waitlistForm');
if (waitlistForm) {
    waitlistForm.addEventListener('submit', function(e) {
        e.preventDefault(); // In production, remove this if using Formspree redirection, or use fetch API.
        
        const emailInput = document.getElementById('waitlistEmail');
        const successMsg = document.getElementById('waitlistSuccess');
        const errorMsg = document.getElementById('waitlistError');
        
        // Simple HTML5 validation fallback
        if (!emailInput.value || !emailInput.checkValidity()) {
            errorMsg.style.display = 'block';
            successMsg.style.display = 'none';
            return;
        }

        errorMsg.style.display = 'none';
        
        // Simulate Webhook POST (Fetch API)
        const formData = new FormData(waitlistForm);
        fetch(waitlistForm.action, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        }).then(response => {
          if (!response.ok) {
            throw new Error('Form submission failed');
          }

            waitlistForm.style.display = 'none';
            successMsg.style.display = 'block';
          errorMsg.style.display = 'none';
        }).catch(error => {
          errorMsg.style.display = 'block';
          successMsg.style.display = 'none';
          console.error(error);
        });
    });
}

// Testimonial Carousel Logic
document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.testimonial-slide');
    if (slides.length > 0) {
        let currentSlide = 0;
        setInterval(() => {
            slides[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % slides.length;
            slides[currentSlide].classList.add('active');
        }, 4000); // Changes every 4 seconds
    }
});

/* ===============================
   Fake Demos Interactivity
   =============================== */
document.addEventListener('DOMContentLoaded', () => {

    // M1: Lore Generator
    const m1Btn = document.getElementById('m1-btn');
    const m1Name = document.getElementById('m1-name');
    const m1Output = document.getElementById('m1-output');
    if (m1Btn && m1Output) {
        m1Btn.addEventListener('click', () => {
            const name = m1Name.value.trim() || 'Desconocido';
            m1Output.innerHTML = `<span class="highlight-text">Generando lore...</span>`;
            setTimeout(() => {
                m1Output.innerHTML = `> Nombre: ${name}<br>> Origen: Neo-Tokyo subterráneo.<br>> Misión: Encontrar el último servidor sin formatear.`;
            }, 800);
        });
    }

    // M2: Sliders
    const sliders = document.querySelectorAll('.m2-slider');
    const m2Output = document.getElementById('m2-output');
    if (sliders.length > 0 && m2Output) {
        const updatePersonality = () => {
            const total = parseInt(sliders[0].value) + parseInt(sliders[1].value);
            if (total < 60) m2Output.innerText = "🥶 Frío y calculador";
            else if (total < 120) m2Output.innerText = "🤖 Neutral";
            else if (total < 160) m2Output.innerText = "😎 Sarcástico y audaz";
            else m2Output.innerText = "🤪 Caos total";
        };
        sliders.forEach(s => s.addEventListener('input', updatePersonality));
    }

    // M4: Audio visualizer
    const m4Btn = document.getElementById('m4-play-btn');
    const m4Vis = document.getElementById('m4-visualizer');
    if (m4Btn && m4Vis) {
        m4Btn.addEventListener('click', () => {
            if (m4Vis.classList.contains('visualizer-active')) {
                m4Vis.classList.remove('visualizer-active');
                m4Btn.innerText = '▶ PLAY AUDIO';
            } else {
                m4Vis.classList.add('visualizer-active');
                m4Btn.innerText = '⏸ PAUSE AUDIO';
            }
        });
    }

    // M5: Timeline animation via IntersectionObserver
    const workflowSteps = document.querySelectorAll('.workflow-timeline .step');
    const workflowLines = document.querySelectorAll('.workflow-timeline .step-line');
    if (workflowSteps.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if(entry.isIntersecting) {
                    let delay = 0;
                    workflowSteps.forEach((step, i) => {
                        setTimeout(() => step.classList.add('active'), delay);
                        if (i < workflowLines.length) {
                            setTimeout(() => workflowLines[i].classList.add('filled'), delay + 500);
                        }
                        delay += 1000;
                    });
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        const timelineEl = document.querySelector('.workflow-timeline');
        if(timelineEl) observer.observe(timelineEl);
    }

    // M6: TikTok Mockup
    const m6Btn = document.getElementById('m6-publish-btn');
    const ttBody = document.getElementById('m6-tt-body');
    if (m6Btn && ttBody) {
        m6Btn.addEventListener('click', () => {
            ttBody.classList.add('tiktok-published');
            ttBody.innerHTML = `<i class="fas fa-check-circle fa-3x" style="color:#00ffcc"></i><p class="mt-2 inter">¡Publicado!</p>`;
            m6Btn.innerText = "TikTok Enviado";
            m6Btn.disabled = true;

            // Heart animation
            const heartsContainer = document.createElement('div');
            heartsContainer.className = 'hearts-container';
            ttBody.appendChild(heartsContainer);
            for(let i=0; i<8; i++) {
                setTimeout(() => {
                    const heart = document.createElement('div');
                    heart.className = 'floating-heart';
                    heart.innerText = '❤️';
                    heart.style.left = Math.random() * 80 + '%';
                    heartsContainer.appendChild(heart);
                }, i * 200);
            }
        });
    }

});

// Global for M3
window.changeBgM3 = function(color) {
    const layer = document.getElementById('m3-bg-layer');
    if (layer) {
        layer.style.backgroundColor = color;
        // Blend mode to mix with the radial gradient overlay from theme
        layer.style.backgroundBlendMode = 'overlay';
    }
};

/* ===============================
   Horizontal Modules Logic
   =============================== */
document.addEventListener('DOMContentLoaded', () => {
    const modulesSection = document.querySelector('.modules-horizontal-section');
    const modulesTrack = document.getElementById('modules-track');
    const sections = Array.from(document.querySelectorAll('#modules-track .snap-section[id]'));

    const setupHorizontalModules = () => {
      if (!modulesSection || !modulesTrack || sections.length === 0) return;

      const header = document.querySelector('.sticky-header');
      const headerOffset = header ? Math.round(header.getBoundingClientRect().height) : 80;
      document.documentElement.style.setProperty('--header-offset', `${headerOffset}px`);

      const stickyViewport = Math.max(window.innerHeight - headerOffset, 1);
      const viewportWidth = Math.max(modulesSection.clientWidth, 1);
      const trackWidth = viewportWidth * sections.length;
      sections.forEach((section) => {
        section.style.width = `${viewportWidth}px`;
        section.style.flex = `0 0 ${viewportWidth}px`;
      });
      modulesTrack.style.width = `${trackWidth}px`;

      const maxTranslate = Math.max(trackWidth - viewportWidth, 0);
      const totalScrollDistance = Math.max(maxTranslate, 1);

      // This virtual height is what keeps the section pinned while horizontal motion happens.
      modulesSection.style.setProperty('--modules-scroll-height', `${stickyViewport + totalScrollDistance}px`);

      const sectionStart = modulesSection.offsetTop - headerOffset;
      const scrolled = window.scrollY - sectionStart;
      const clamped = Math.min(Math.max(scrolled, 0), totalScrollDistance);
      const progress = clamped / totalScrollDistance;
      const travelX = progress * maxTranslate;

      modulesTrack.style.transform = `translate3d(${-travelX}px, 0, 0)`;

      const moduleFloat = maxTranslate > 0 ? travelX / window.innerWidth : 0;

      const bgFactor = window.innerWidth < 900 ? 55 : 95;
      const contentFactor = window.innerWidth < 900 ? -28 : -52;
      const numberFactor = window.innerWidth < 900 ? 90 : 150;
      const orbFactor = window.innerWidth < 900 ? 32 : 68;

      sections.forEach((section, index) => {
        const bg = section.querySelector('.parallax-bg');
        const relative = moduleFloat - index;
        const depth = Math.min(Math.abs(relative), 1.8);

        if (bg) {
          bg.style.transform = `translate3d(${relative * bgFactor}px, 0, 0) scale(${1.08 + depth * 0.05})`;
          bg.style.filter = `brightness(${1 - depth * 0.08})`;
        }

        const content = section.querySelector('.parallax-content');
        if (content) {
          content.style.transform = `translate3d(${relative * contentFactor}px, 0, 0)`;
        }

        const giantNumber = section.querySelector('.giant-bg-number');
        if (giantNumber) {
          giantNumber.style.transform = `translate(calc(-50% + ${relative * numberFactor}px), -50%) scale(${1 - Math.min(depth * 0.08, 0.16)})`;
          giantNumber.style.opacity = `${Math.max(0.015, 0.05 - depth * 0.015)}`;
        }

        section.style.setProperty('--orb-shift', `${relative * orbFactor}px`);
      });
    };

    if (modulesSection && modulesTrack && sections.length) {
      setupHorizontalModules();
      window.addEventListener('scroll', setupHorizontalModules, { passive: true });
      window.addEventListener('resize', setupHorizontalModules);
    }
});

/* ===============================
   Video Autoplay on Scroll
   =============================== */
document.addEventListener('DOMContentLoaded', () => {
  const videos = document.querySelectorAll('.module-video, .community-video, .lidera-video');

  const ensureMobileAutoplayAttrs = (video) => {
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('autoplay', '');
    if (!video.getAttribute('preload')) {
      video.setAttribute('preload', 'metadata');
    }
  };

  const tryPlay = (video) => {
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        // Si el autoplay falla por política del navegador (p.ej. modo ahorro), queda el control manual.
      });
    }
  };

  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const video = entry.target;
      if (entry.isIntersecting) {
        tryPlay(video);
      } else {
        video.pause();
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -10% 0px'
  });

  videos.forEach((video) => {
    ensureMobileAutoplayAttrs(video);
    videoObserver.observe(video);
  });
});
