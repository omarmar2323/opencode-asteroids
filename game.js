'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Skins ─────────────────────────────────────────────────────────────────────
const SKINS = [
  {
    name: 'CLÁSICO',
    vertices: [[20,0],[-12,-9],[-7,0],[-12,9]],
    color: '#fff',
    speedColor: '#00ccff',
    flameColor: 'rgba(255, 130, 0, 0.85)',
    speedFlameColor: 'rgba(0, 180, 255, 0.85)',
  },
  {
    name: 'NEÓN',
    vertices: [[22,0],[-5,-11],[-10,0],[-5,11]],
    color: '#00ffcc',
    speedColor: '#ff00ff',
    flameColor: 'rgba(0, 255, 200, 0.85)',
    speedFlameColor: 'rgba(255, 0, 255, 0.85)',
  },
  {
    name: 'FURIA',
    vertices: [[24,0],[-14,-12],[-7,-3],[-7,3],[-14,12]],
    color: '#ff3344',
    speedColor: '#ffaa00',
    flameColor: 'rgba(255, 60, 20, 0.85)',
    speedFlameColor: 'rgba(255, 170, 0, 0.85)',
  },
  {
    name: 'REAL',
    vertices: [[18,0],[0,-12],[-8,-7],[-8,7],[0,12]],
    color: '#ffd700',
    speedColor: '#fff',
    flameColor: 'rgba(255, 215, 0, 0.85)',
    speedFlameColor: 'rgba(255, 255, 255, 0.85)',
  },
  {
    name: 'FANTASMA',
    vertices: [[20,0],[-6,-8],[-12,0],[-6,8]],
    color: '#88ff88',
    speedColor: '#00ffff',
    flameColor: 'rgba(100, 255, 100, 0.85)',
    speedFlameColor: 'rgba(0, 255, 255, 0.85)',
  },
  {
    name: 'GIGANTE',
    vertices: [[40,0],[-24,-18],[-14,0],[-24,18]],
    color: '#9b59b6',
    speedColor: '#e056fd',
    flameColor: 'rgba(155, 89, 182, 0.85)',
    speedFlameColor: 'rgba(224, 86, 253, 0.85)',
  },
];

let currentSkin = parseInt(localStorage.getItem('asteroidsSkin')) || 0;
if (currentSkin < 0 || currentSkin >= SKINS.length) currentSkin = 0;

function getPointMultiplier() {
  return currentSkin === 5 ? 3 : 1;
}

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    const children = [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
    if (this.size >= 2) {
      const roll = Math.random();
      if (roll < 0.25) {
        children.push(new ShieldPowerUp(this.x, this.y));
      } else if (roll < 0.50) {
        children.push(new TripleShotPowerUp(this.x, this.y));
      } else if (roll < 0.85) {
        children.push(new PowerUp(this.x, this.y));
      }
    }
    return children;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── ShootingStar ─────────────────────────────────────────────────────────────
class ShootingStar extends Asteroid {
  constructor(x, y, size = 1) {
    super(x, y, size);
    this.speedMultiplier = 2;
    this.ttl = 6;
    this.maxTtl = 6;
    this.dead = false;
    this.trail = [];

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] * this.speedMultiplier + rand(-10, 10);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(dt) {
    this.ttl -= dt;
    if (this.ttl <= 0) {
      this.dead = true;
      return;
    }

    this.trail.push({ x: this.x, y: this.y, ttl: 0.3 });
    if (this.trail.length > 12) this.trail.shift();
    this.trail.forEach(t => t.ttl -= dt);
    this.trail = this.trail.filter(t => t.ttl > 0);

    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt * 2;
  }

  draw() {
    const alpha = Math.min(1, this.ttl / 1.5);
    ctx.save();
    ctx.globalAlpha = alpha;

    for (const t of this.trail) {
      const trailAlpha = (t.ttl / 0.3) * 0.4;
      ctx.fillStyle = `rgba(255, 220, 50, ${trailAlpha})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, this.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);

    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 1.8);
    glow.addColorStop(0, 'rgba(255, 220, 50, 0.4)');
    glow.addColorStop(1, 'rgba(255, 220, 50, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffdc32';
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.dead          = false;
    this.speedBoost    = false;
    this.speedBoostTimer = 0;
    this.tripleShot    = false;
    this.tripleShotTimer = 0;
    this.shieldActive  = false;
    this.shieldHits    = 0;
    this.shieldFlash   = 0;
  }

  activateSpeed() {
    this.speedBoost = true;
    this.speedBoostTimer = 5;
  }

  activateTripleShot() {
    this.tripleShot = true;
    this.tripleShotTimer = 5;
  }

  activateShield() {
    this.shieldActive = true;
    this.shieldHits = 3;
    this.shieldFlash = 0;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.speedBoostTimer > 0) {
      this.speedBoostTimer -= dt;
      if (this.speedBoostTimer <= 0) this.speedBoost = false;
    }
    if (this.tripleShotTimer > 0) {
      this.tripleShotTimer -= dt;
      if (this.tripleShotTimer <= 0) this.tripleShot = false;
    }
    if (this.shieldFlash > 0) this.shieldFlash -= dt;

    const ROT_BASE   = 3.5;
    const THRUST_BASE = 260;
    const DRAG   = 0.987;

    const multiplier = this.speedBoost ? 2 : 1;
    const ROT   = ROT_BASE * multiplier;
    const THRUST = THRUST_BASE * multiplier;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = this.speedBoost ? 0.1 : 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    if (this.tripleShot) {
      const SPREAD = 0.21;
      return [
        new Bullet(ox, oy, this.angle - SPREAD),
        new Bullet(ox, oy, this.angle),
        new Bullet(ox, oy, this.angle + SPREAD),
      ];
    }
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    const skin = SKINS[currentSkin];
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = this.tripleShot ? '#ffaa00' : this.speedBoost ? skin.speedColor : skin.color;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    ctx.beginPath();
    ctx.moveTo(skin.vertices[0][0], skin.vertices[0][1]);
    for (let i = 1; i < skin.vertices.length; i++)
      ctx.lineTo(skin.vertices[i][0], skin.vertices[i][1]);
    ctx.closePath();
    ctx.stroke();

    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14), 0);
      ctx.lineTo(-8,  4);
      ctx.strokeStyle = this.tripleShot ? 'rgba(255, 170, 0, 0.85)' : this.speedBoost ? skin.speedFlameColor : skin.flameColor;
      ctx.stroke();
    }

    ctx.restore();

    if (this.shieldActive && this.shieldHits > 0) {
      const flash = this.shieldFlash > 0;
      const alpha = flash ? 0.8 : 0.35 + Math.sin(Date.now() * 0.005) * 0.15;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = flash ? '#ffffff' : '#00ff99';
      ctx.lineWidth = flash ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── PowerUp ───────────────────────────────────────────────────────────────────
class PowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 15;
    this.ttl = 8;
    this.dead = false;
    this.pulse = 0;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(20, 50);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    this.pulse += dt * 5;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = Math.min(1, this.ttl / 2);
    const pulseFactor = 1 + Math.sin(this.pulse) * 0.2;
    const r = this.radius * pulseFactor;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Brillo exterior
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r * 1.5);
    gradient.addColorStop(0, 'rgba(0, 150, 255, 0.6)');
    gradient.addColorStop(1, 'rgba(0, 150, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Círculo interior
    ctx.fillStyle = '#00aaff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Borde brillante
    ctx.strokeStyle = '#00ccff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 0.7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}

// ── TripleShotPowerUp ────────────────────────────────────────────────────────
class TripleShotPowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 15;
    this.ttl = 8;
    this.dead = false;
    this.pulse = 0;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(20, 50);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    this.pulse += dt * 5;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = Math.min(1, this.ttl / 2);
    const pulseFactor = 1 + Math.sin(this.pulse) * 0.2;
    const r = this.radius * pulseFactor;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Brillo exterior
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r * 1.5);
    gradient.addColorStop(0, 'rgba(255, 170, 0, 0.6)');
    gradient.addColorStop(1, 'rgba(255, 170, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Círculo interior
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Borde brillante
    ctx.strokeStyle = '#ffcc44';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 0.7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}

// ── ShieldPowerUp ─────────────────────────────────────────────────────────────
class ShieldPowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 15;
    this.ttl = 8;
    this.dead = false;
    this.pulse = 0;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(20, 50);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    this.pulse += dt * 5;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = Math.min(1, this.ttl / 2);
    const pulseFactor = 1 + Math.sin(this.pulse) * 0.2;
    const r = this.radius * pulseFactor;

    ctx.save();
    ctx.globalAlpha = alpha;

    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r * 1.5);
    gradient.addColorStop(0, 'rgba(0, 255, 100, 0.6)');
    gradient.addColorStop(1, 'rgba(0, 255, 100, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#00ff66';
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#00ff99';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 0.7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerUps, tripleShotPowerUps, shieldPowerUps, shootingStars;
let score, lives, level;
let state;      // 'title' | 'playing' | 'dead' | 'gameover'
let deadTimer;
let shootingStarTimer;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function spawnShootingStar() {
  const side = randInt(0, 3);
  let x, y;
  const SAFE_DIST = 150;
  do {
    switch (side) {
      case 0: x = rand(0, W); y = -20; break;
      case 1: x = W + 20; y = rand(0, H); break;
      case 2: x = rand(0, W); y = H + 20; break;
      case 3: x = -20; y = rand(0, H); break;
    }
  } while (Math.hypot(x - ship.x, y - ship.y) < SAFE_DIST);
  shootingStars.push(new ShootingStar(x, y, 1));
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerUps  = [];
  tripleShotPowerUps = [];
  shieldPowerUps = [];
  shootingStars = [];
  shootingStarTimer = rand(12, 18);
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  spawnAsteroids(4);
}

function showTitle() {
  ship = new Ship();
  ship.x = W / 2;
  ship.y = H / 2 + 30;
  ship.angle = -Math.PI / 2;
  bullets = [];
  asteroids = [];
  particles = [];
  powerUps = [];
  tripleShotPowerUps = [];
  shieldPowerUps = [];
  shootingStars = [];
  state = 'title';
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerUps  = [];
  tripleShotPowerUps = [];
  shieldPowerUps = [];
  shootingStars = [];
  shootingStarTimer = rand(12, 18);
  ship.reset();
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (state === 'title') {
    if (pressed('ArrowLeft')) {
      currentSkin = (currentSkin - 1 + SKINS.length) % SKINS.length;
      localStorage.setItem('asteroidsSkin', currentSkin);
    }
    if (pressed('ArrowRight')) {
      currentSkin = (currentSkin + 1) % SKINS.length;
      localStorage.setItem('asteroidsSkin', currentSkin);
    }
    if (pressed('Space')) initGame();
    return;
  }

  if (state === 'gameover') {
    if (pressed('Space')) showTitle();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    powerUps.forEach(p => p.update(dt));
    powerUps = powerUps.filter(p => !p.dead);
    tripleShotPowerUps.forEach(p => p.update(dt));
    tripleShotPowerUps = tripleShotPowerUps.filter(p => !p.dead);
    shieldPowerUps.forEach(p => p.update(dt));
    shieldPowerUps = shieldPowerUps.filter(p => !p.dead);
    shootingStars.forEach(s => s.update(dt));
    shootingStars = shootingStars.filter(s => !s.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    powerUps.forEach(p => p.update(dt));
    powerUps = powerUps.filter(p => !p.dead);
    tripleShotPowerUps.forEach(p => p.update(dt));
    tripleShotPowerUps = tripleShotPowerUps.filter(p => !p.dead);
    shieldPowerUps.forEach(p => p.update(dt));
    shieldPowerUps = shieldPowerUps.filter(p => !p.dead);
    shootingStars.forEach(s => s.update(dt));
    shootingStars = shootingStars.filter(s => !s.dead);
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  // Cambiar skin con Tab
  if (pressed('Tab')) {
    currentSkin = (currentSkin + 1) % SKINS.length;
    localStorage.setItem('asteroidsSkin', currentSkin);
  }

  shootingStarTimer -= dt;
  if (shootingStarTimer <= 0) {
    spawnShootingStar();
    shootingStarTimer = rand(12, 18);
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  powerUps.forEach(p => p.update(dt));
  tripleShotPowerUps.forEach(p => p.update(dt));
  shieldPowerUps.forEach(p => p.update(dt));
  shootingStars.forEach(s => s.update(dt));

  bullets = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);
  powerUps = powerUps.filter(p => !p.dead);
  tripleShotPowerUps = tripleShotPowerUps.filter(p => !p.dead);
  shieldPowerUps = shieldPowerUps.filter(p => !p.dead);
  shootingStars = shootingStars.filter(s => !s.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  const newPowerUps = [];
  const newTripleShotPowerUps = [];
  const newShieldPowerUps = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += POINTS[a.size] * getPointMultiplier();
        explode(a.x, a.y, a.size * 5);
        for (const item of a.split()) {
          if (item instanceof ShieldPowerUp) newShieldPowerUps.push(item);
          else if (item instanceof TripleShotPowerUp) newTripleShotPowerUps.push(item);
          else if (item instanceof PowerUp) newPowerUps.push(item);
          else newAsteroids.push(item);
        }
      }
    }
  }

  // Bala vs shooting star
  for (const b of bullets) {
    for (const s of shootingStars) {
      if (!s.dead && !b.dead && dist(b, s) < s.radius) {
        b.dead = true;
        s.dead = true;
        score += 200 * getPointMultiplier();
        explode(s.x, s.y, 10);
      }
    }
  }

  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  powerUps.push(...newPowerUps);
  tripleShotPowerUps.push(...newTripleShotPowerUps);
  shieldPowerUps.push(...newShieldPowerUps);
  bullets = bullets.filter(b => !b.dead);
  shootingStars = shootingStars.filter(s => !s.dead);

  // Nave vs asteroide
  if (ship.invincible <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        if (ship.shieldActive) {
          ship.shieldHits--;
          ship.shieldFlash = 0.2;
          a.dead = true;
          score += POINTS[a.size] * getPointMultiplier();
          explode(a.x, a.y, a.size * 5);
          for (const item of a.split()) {
            if (item instanceof ShieldPowerUp) shieldPowerUps.push(item);
            else if (item instanceof TripleShotPowerUp) tripleShotPowerUps.push(item);
            else if (item instanceof PowerUp) powerUps.push(item);
            else asteroids.push(item);
          }
          if (ship.shieldHits <= 0) ship.shieldActive = false;
        } else {
          killShip();
        }
        break;
      }
    }
  }

  // Nave vs shooting star
  if (ship.invincible <= 0) {
    for (const s of shootingStars) {
      if (!s.dead && dist(ship, s) < ship.radius + s.radius * 0.82) {
        if (ship.shieldActive) {
          ship.shieldHits--;
          ship.shieldFlash = 0.2;
          s.dead = true;
          score += 200 * getPointMultiplier();
          explode(s.x, s.y, 10);
          if (ship.shieldHits <= 0) ship.shieldActive = false;
        } else {
          killShip();
        }
        break;
      }
    }
  }

  // Nave vs powerUp
  if (!ship.dead) {
    for (const p of powerUps) {
      if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
        p.dead = true;
        ship.activateSpeed();
        ship.invincible = 2;
      }
    }
  }

  // Nave vs tripleShotPowerUp
  if (!ship.dead) {
    for (const p of tripleShotPowerUps) {
      if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
        p.dead = true;
        ship.activateTripleShot();
        ship.invincible = 2;
      }
    }
  }

  // Nave vs shieldPowerUp
  if (!ship.dead) {
    for (const p of shieldPowerUps) {
      if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
        p.dead = true;
        ship.activateShield();
        ship.invincible = 2;
      }
    }
  }

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  const skin = SKINS[currentSkin];
  const scale = 0.45;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = skin.color;
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo(skin.vertices[0][0] * scale, skin.vertices[0][1] * scale);
  for (let i = 1; i < skin.vertices.length; i++)
    ctx.lineTo(skin.vertices[i][0] * scale, skin.vertices[i][1] * scale);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawTitle() {
  const skin = SKINS[currentSkin];

  // Título
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 52px monospace';
  ctx.fillText('ASTEROIDS', W / 2, H / 2 - 140);

  // Nave central con la skin actual
  ctx.save();
  ctx.translate(W / 2, H / 2 + 30);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = skin.color;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(skin.vertices[0][0], skin.vertices[0][1]);
  for (let i = 1; i < skin.vertices.length; i++)
    ctx.lineTo(skin.vertices[i][0], skin.vertices[i][1]);
  ctx.closePath();
  ctx.stroke();

  // Llama trasera
  ctx.beginPath();
  ctx.moveTo(-8, -4);
  ctx.lineTo(-16, 0);
  ctx.lineTo(-8, 4);
  ctx.strokeStyle = skin.flameColor;
  ctx.stroke();
  ctx.restore();

  // Nombre de la skin con flechas
  ctx.font = '18px monospace';
  ctx.fillStyle = skin.color;
  ctx.fillText(`<  ${skin.name}  >`, W / 2, H / 2 + 100);

  ctx.font = '13px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText('← → CAMBIAR SKIN', W / 2, H / 2 + 125);

  // Instrucción
  ctx.font = '16px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText('ESPACIO PARA JUGAR', W / 2, H / 2 + 180);
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  if (ship.tripleShot) {
    ctx.fillStyle = '#ffaa00';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`TRIPLE SHOT ${Math.ceil(ship.tripleShotTimer)}s`, W / 2, 50);
  }

  if (ship.shieldActive && ship.shieldHits > 0) {
    ctx.fillStyle = '#00ff99';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`ESCUDO ${'█'.repeat(ship.shieldHits)}`, W - 14, 44);
  }
}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  if (state === 'title') {
    drawTitle();
    return;
  }

  particles.forEach(p => p.draw());
  shootingStars.forEach(s => s.draw());
  asteroids.forEach(a => a.draw());
  bullets.forEach(b => b.draw());
  powerUps.forEach(p => p.draw());
  tripleShotPowerUps.forEach(p => p.draw());
  shieldPowerUps.forEach(p => p.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

showTitle();
requestAnimationFrame(loop);
