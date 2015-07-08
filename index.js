/* globals document */

var Gesso = require('gesso');
var helpers = require('./helpers');

var GRAVITY = 0.2;
var PARTICLE_MARGIN = 60;
var KEYBOARD_SPEED = 6;
var MOUSE_SPEED = 48;

var game = new Gesso();
var clickLock = 0;
var showClickToStart;

var player = {
  playing: false,
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
var enemies = [];
var particles = [];

function newGame() {
  player.playing = true;
  // TODO: newEnemyGenerator()?
}

function endGame() {
  player.playing = false;
  player.played = true;
  clickLock = 30;
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
    } else if (keysDown.right) {
      x += KEYBOARD_SPEED;
    }
    player.x = helpers.clamp(x, player.r + 2, game.width - player.r - 2);
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
    particles[p].x -= particles[p].vx;
    particles[p].y -= particles[p].vy;
    // Delete particle when out of bounds
    if (particles[p].x + particles[p].r < -PARTICLE_MARGIN || particles[p].y + particles[p].r < -PARTICLE_MARGIN ||
        particles[p].x - particles[p].r > game.width + PARTICLE_MARGIN || particles[p].y - particles[p].r > game.height + PARTICLE_MARGIN) {
      particles.splice(p, 1);
      p--;
    }
  }
});

game.render(function (ctx) {
  // Draw background
  ctx.fillStyle = '#4A913C';
  ctx.fillRect(0, 0, game.width, game.height);

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
    /*ctx.fillRect(player.x - 16, player.y - 5, 6, 1);
    ctx.fillRect(player.x - 17, player.y - 0, 6, 1);
    ctx.fillRect(player.x - 16, player.y + 5, 6, 1);
    ctx.fillRect(player.x + 10, player.y - 5, 6, 1);
    ctx.fillRect(player.x + 11, player.y - 0, 6, 1);
    ctx.fillRect(player.x + 10, player.y + 5, 6, 1);
    */
  }

  // Draw bullets
  for (var b = 0; b < bullets.length; b++) {
    helpers.fillCircle(ctx, bullets[b].x, bullets[b].y, bullets[b].r, '#000');
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
