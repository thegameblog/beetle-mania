/* globals document */

var Gesso = require('gesso');
var helpers = require('./helpers');

var GRAVITY = 0.2;
var PARTICLE_MARGIN = 60;
var KEYBOARD_SPEED = 6;
var MOUSE_SPEED = 48;
var MAX_BULLETS = 5;
var BULLET_SPEED = 10;
var MAX_ACORNS = 32;

var game = new Gesso();
var clickLock = 0;
var showClickToStart;

var player = {
  playing: false,
  playTime: 0,
  score: 0,
  x: game.width / 2,
  y: game.height - 30,
  r: 12,
  color: '#000',
  blinkFor: 0,
  blinkNext: 60 * 3,
  blinkDelay: 60 * 3
};
var mouseX = null;
var keysDown = {left: false, right: false};
var bullets = [];
var stars = [];
var acorns = [];
var particles = [];

function newGame() {
  player.playing = true;
  player.playTime = 0;
  // TODO: newAcornGenerator()?
}

function endGame() {
  player.playing = false;
  player.played = true;
  clickLock = 30;
}

function newAcorn() {
  var r = 16;
  acorns.push({
    r: r,
    x: helpers.randInt(r, game.width - r),
    y: -r,
    vx: helpers.randInt(1, 5) * (helpers.randInt(0, 1) ? -1 : 1),
    vy: 0,
    angle: 0,
    rotation: 0.1
  });
}

// TODO: Mobile controls
var canvas = Gesso.getCanvas();
document.addEventListener('mousemove', function (e) {
  if (mouseX === null) {
    return;
  }
  var rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
});

document.addEventListener('keydown', function (e) {
  if (e.which === 37 || e.which === 65) {
    keysDown.left = true;
  } else if (e.which === 39 || e.which === 68) {
    keysDown.right = true;
  } else if (e.which === 32 || e.which === 16 || e.which === 88 || e.which === 90) {
    if (!e.repeat) {
      keysDown.fired = true;
    }
    return;
  } else {
    return;
  }

  // Switch to keyboard controls
  mouseX = null;

  // Start new game if not currently playing
  if (!player.playing) {
    newGame();
  }
});

document.addEventListener('keyup', function (e) {
  if (e.which === 37 || e.which === 65) {
    keysDown.left = false;
  } else if (e.which === 39 || e.which === 68) {
    keysDown.right = false;
  }
});

game.click(function (e) {
  var rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;

  keysDown.fired = true;

  // Prevent unintentional game starts
  if (clickLock > 0) {
    return;
  }

  // Create new player, if not currently playing
  if (!player.playing) {
    newGame();
    return false;
  }

  // TODO: action
});

game.update(function (t) {
  // Show start message and adjust click lock
  showClickToStart = !player.playing && ((t % 120 > 5 && t % 120 < 20) || t % 120 > 25);
  if (clickLock > 0) {
    clickLock -= 1;
  }

  // Update total play-time
  if (player.playing) {
    player.playTime += 1;
  }

  // Update bullets
  for (var b = 0; b < bullets.length; b++) {
    bullets[b].y -= bullets[b].s;
    bullets[b].angle += bullets[b].rotation;
    // Delete bullet when out of bounds
    if (bullets[b].y + bullets[b].r < 0) {
      bullets.splice(b, 1);
      b--;
    }
  }

  // Update stars
  for (var s = 0; s < stars.length; s++) {
    stars[s].x += stars[s].vx;
    stars[s].y += stars[s].vy;
    stars[s].angle += stars[s].rotation;
    stars[s].energy -= 1;
    // Delete stars when out of energy
    if (stars[s].energy <= 0) {
      stars.splice(s, 1);
      s--;
    }
  }

  // Update player position
  if (mouseX !== null) {
    if (mouseX < player.x) {
      player.x = helpers.clamp(player.x - MOUSE_SPEED, Math.max(player.r + 2, mouseX), game.width - player.r - 2);
    } else if (mouseX > player.x) {
      player.x = helpers.clamp(player.x + MOUSE_SPEED, player.r + 2, Math.min(game.width - player.r - 2, mouseX));
    }
  } else {
    var x = player.x;
    if (keysDown.left) {
      x -= KEYBOARD_SPEED;
    }
    if (keysDown.right) {
      x += KEYBOARD_SPEED;
    }
    player.x = helpers.clamp(x, player.r + 2, game.width - player.r - 2);
  }

  // Fire
  if (keysDown.fired) {
    keysDown.fired = false;
    // Limit bullet count
    if (bullets.length < MAX_BULLETS) {
      bullets.push({
        x: player.x,
        y: player.y - player.r - 10,
        r: player.r,
        s: BULLET_SPEED,
        angle: -0.3,
        rotation: 0.1
      });
    }
  }

  // Adjust player personality
  player.move = t % 8 >= 4;
  player.blinkFor = Math.max(0, player.blinkFor - 1);
  player.blinkNext = Math.max(0, player.blinkNext - 1);
  if (player.blinkNext === 0) {
    player.blinkFor = 5;
    player.blinkNext = player.blinkDelay;
  }

  // Update particles
  for (var p = 0; p < particles.length; p++) {
    if (particles[p].ay) {
      particles[p].vy += particles[p].ay;
    }
    particles[p].x += particles[p].vx;
    particles[p].y += particles[p].vy;
    // Delete particle when out of bounds
    if (particles[p].x + particles[p].r < -PARTICLE_MARGIN || particles[p].x - particles[p].r > game.width + PARTICLE_MARGIN ||
        particles[p].y + particles[p].r < -PARTICLE_MARGIN || particles[p].y - particles[p].r > game.height + PARTICLE_MARGIN) {
      particles.splice(p, 1);
      p--;
    }
  }

  // Update acorns
  for (var a = 0; a < acorns.length; a++) {
    acorns[a].x += acorns[a].vx;
    if (acorns[a].x + acorns[a].r > game.width && acorns[a].vx > 0 ||
        acorns[a].x - acorns[a].r < 0 && acorns[a].vx < 0) {
      acorns[a].vx = -acorns[a].vx;
    }
    acorns[a].y += acorns[a].vy;
    acorns[a].vy += GRAVITY;
    if (acorns[a].y > player.y - acorns[a].r && acorns[a].vy > 0) {
      acorns[a].vy = Math.min(-acorns[a].vy * 0.8, -6);
    }
    acorns[a].angle += acorns[a].rotation;
    if (acorns[a].angle < -0.3 && acorns[a].rotation < 0 ||
        acorns[a].angle > 0.3 && acorns[a].rotation > 0) {
      acorns[a].rotation = -acorns[a].rotation;
    }
  }

  // Spawn acorn
  // TODO: Base this off of difficulty?
  // TODO: Base this off of enemies on-screen?
  if (player.playing && player.playTime % 20 === 0 && acorns.length < MAX_ACORNS) {
    newAcorn();
  }

  // Check for bullet / acorn collisions
  for (b = 0; b < bullets.length; b++) {
    for (a = 0; a < acorns.length; a++) {
      if (helpers.intersected(
          {x: acorns[a].x - acorns[a].r, y: acorns[a].y - acorns[a].r, width: acorns[a].r * 2, height: acorns[a].r * 2},
          {x: bullets[b].x - bullets[b].r, y: bullets[b].y - bullets[b].r, width: bullets[b].r * 2, height: bullets[b].r * 2})) {
        helpers.explode(particles, acorns[a], {r: 1, color: 'rgba(255, 218, 218, 0.8)', ay: GRAVITY}, 30, 6, 2);
        helpers.explode(stars, acorns[a], {r: 10, energy: 15, angle: 0, rotation: -0.3, multiplier: 2}, 5, 8, 0);
        bullets.splice(b, 1);
        b--;
        acorns.splice(a, 1);
        a--;
        break;
      }
    }
  }

  // Check for star / acorn collisions
  for (s = 0; s < stars.length; s++) {
    for (a = 0; a < acorns.length; a++) {
      if (helpers.intersected(
          {x: acorns[a].x - acorns[a].r, y: acorns[a].y - acorns[a].r, width: acorns[a].r * 2, height: acorns[a].r * 2},
          {x: stars[s].x - stars[s].r, y: stars[s].y - stars[s].r, width: stars[s].r * 2, height: stars[s].r * 2})) {
        helpers.explode(particles, acorns[a], {r: 1, color: 'rgba(255, 218, 218, 0.8)', ay: GRAVITY}, Math.ceil(30 / stars[s].multiplier), 6, 2);
        helpers.explode(stars, acorns[a], {r: 10, energy: 20, angle: 0, rotation: -0.3, multiplier: stars[s].multiplier}, 5, 8, 0);
        stars.splice(s, 1);
        s--;
        acorns.splice(a, 1);
        a--;
        break;
      }
    }
  }
});

game.render(function (ctx) {
  // Draw background
  ctx.fillStyle = '#4A913C';
  ctx.fillRect(0, 0, game.width, game.height);

  // Draw bullets
  for (var b = 0; b < bullets.length; b++) {
    helpers.rotated(ctx, bullets[b].x, bullets[b].y, bullets[b].angle, function (x, y) {
      helpers.fillStar(ctx, x, y, 5, bullets[b].r, bullets[b].r / 2, '#ff4');
    });
  }

  // Draw stars
  for (var s = 0; s < stars.length; s++) {
    helpers.rotated(ctx, stars[s].x, stars[s].y, stars[s].angle, function (x, y) {
      helpers.fillStar(ctx, x, y, 5, stars[s].r, stars[s].r / 2, '#EF7800');
    });
  }

  // Draw player
  if (player.playing) {
    ctx.fillStyle = player.color;
    helpers.fillCircle(ctx, player.x, player.y, player.r, player.color);
    ctx.fillStyle = '#cc0';
    if (player.blinkFor > 0) {
      ctx.fillRect(player.x - 4 - 2, player.y - 7, 4, 1);
      ctx.fillRect(player.x + 4 - 2, player.y - 7, 4, 1);
    } else {
      helpers.fillCircle(ctx, player.x - 4, player.y - 6, 1);
      helpers.fillCircle(ctx, player.x + 4, player.y - 6, 1);
    }
    ctx.fillStyle = player.color;
    // Neck
    ctx.fillRect(player.x - 4, player.y - 16, 8, 6);
    // Mandible
    var moveMandibleBy = player.move ? 0 : 1;
    helpers.scaled(ctx, player.x, player.y - 14 - moveMandibleBy, 1, 0.65, function (x, y) {
      helpers.fillCircle(ctx, x, y, 6, player.color, Math.PI, 0);
    });
    // Legs
    var moveLegsBy = player.move ? 0 : 0.3;
    helpers.fillRotatedRect(ctx, Math.PI + 0.3 + moveLegsBy, player.x - 10, player.y - 6, 8, 2, player.color);
    helpers.fillRotatedRect(ctx, Math.PI + 0.1 + moveLegsBy, player.x - 12, player.y, 8, 2, player.color);
    helpers.fillRotatedRect(ctx, Math.PI + -0.1 - moveLegsBy, player.x - 11, player.y + 5, 8, 2, player.color);
    helpers.fillRotatedRect(ctx, -0.3 - moveLegsBy, player.x + 9, player.y - 8, 8, 2, player.color);
    helpers.fillRotatedRect(ctx, -0.1 - moveLegsBy, player.x + 11, player.y - 2, 8, 2, player.color);
    helpers.fillRotatedRect(ctx, 0.1 + moveLegsBy, player.x + 11, player.y + 4, 8, 2, player.color);
  }

  // Draw acorns
  for (var a = 0; a < acorns.length; a++) {
    helpers.rotated(ctx, acorns[a].x, acorns[a].y, acorns[a].angle + 0.3, function (x, y) {
      helpers.scaled(ctx, x, y, 0.85, 1, function (x, y) {
        ctx.fillStyle = '#FFDA96';  // #fc3
        helpers.fillCircle(ctx, x, y, acorns[a].r);
        helpers.fillCircle(ctx, x, y + acorns[a].r - (acorns[a].r / 8), acorns[a].r / 4);
        ctx.fillStyle = '#492F25';
        helpers.scaled(ctx, x, y - 14, 1, 0.65, function (x, y) {
          helpers.fillCircle(ctx, x, y + (acorns[a].r / 2), acorns[a].r, null, Math.PI, 0);
        });
        helpers.fillCircle(ctx, x, y - acorns[a].r - (acorns[a].r / 8), acorns[a].r / 4);
      });
    });
  }

  // Draw particles
  for (var p = 0; p < particles.length; p++) {
    helpers.fillCircle(ctx, particles[p].x, particles[p].y, particles[p].r, particles[p].color);
  }

  // Draw pre-game text
  if (!player.playing) {
    ctx.textAlign = 'center';
    if (showClickToStart) {
      ctx.font = 'bold 64px sans-serif';
      if (player.played) {
        helpers.outlineText(ctx, 'Click again!', game.width / 2, game.height / 2, '#333', '#fff');
      } else {
        helpers.outlineText(ctx, 'Click to start!', game.width / 2, game.height / 2, '#333', '#fff');
      }
    }
    ctx.font = 'bold 16px sans-serif';
    helpers.outlineText(ctx, 'Or press \u25c2 \u25B8', game.width - 60, game.height - 10, '#333', '#fff');
  }

  // Draw score
  if (player.playing || player.played) {
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    helpers.outlineText(ctx, player ? player.score : 'High Score', game.width / 2, 22, '#333', '#fff');
  }
});

// TODO: Delete this
game.run();

module.exports = game;  // TODO: Get the runtime to expose this object through a gesso.current global
