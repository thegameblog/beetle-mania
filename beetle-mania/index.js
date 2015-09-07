var Gesso = require('gesso');
var Group = require('gesso-entity').Group;
var Howl = require('howler').Howl;
var env = require('../package.json').game;
var Player = require('./player');
var Background = require('./background');
var Acorn = require('./acorn');
var Bullet = require('./bullet');
var Particle = require('./particle');
var TextEffect = require('./text-effect');
var Star = require('./star');
var helpers = require('./helpers');

var game = new Gesso();
var entities = new Group(game);
var player = new Player();
var background = new Background(player);
var hitSound = new Howl({urls: [game.asset('hit.wav')]});
var superHitSound = new Howl({urls: [game.asset('super-hit.wav')]});
var bestHitSound = new Howl({urls: [game.asset('best-hit.wav')]});
var showClickToStart = false;
var acornCount = 0;
var shakeCount = 0;
var shakeOffsetX = 0;
var shakeOffsetY = 0;

// Add initial entities
entities.push(player);
entities.push(background);

// Add interactions
entities.pushInteraction(Star, Acorn, function (star, acorn) {
  // Check for star / acorn collisions
  if (!helpers.intersected(
      {x: acorn.x - acorn.radius, y: acorn.y - acorn.radius, width: acorn.radius * 2, height: acorn.radius * 2},
      {x: star.x - star.radius, y: star.y - star.radius, width: star.radius * 2, height: star.radius * 2})) {
    return;
  }
  // Shake
  shakeCount = 10;
  // Resurrect textEffect if not alive?
  star.textEffect.reset(acorn.x, acorn.y, star.textEffect.multiple + 1);
  player.score += env.pointsPerHit * star.textEffect.multiple;
  if (star.textEffect.multiple >= env.maxAcorns * 0.8) {
    bestHitSound.play();
  } else if (star.textEffect.multiple >= env.maxAcorns * 0.4) {
    superHitSound.play();
  } else {
    hitSound.play();
  }
  entities.explode(
    // TODO: Cap the multiplier? Better sound effect after X?
    function (x, y, vx, vy) { return new Star(x, y, vx, vy, star.multiplier + 1, star.textEffect); },
    acorn.x, acorn.y, 5, 8, 0);
  entities.explode(
    function (x, y, vx, vy) { return new Particle(x, y, 1, 'rgba(255, 218, 218, 0.8)', vx, vy, 0, env.gravity); },
    acorn.x, acorn.y, Math.ceil(30 / star.multiplier), 6, 2);
  star.die();
  acorn.die();
});
entities.pushInteraction(Bullet, Acorn, function (bullet, acorn) {
  // Check for bullet / acorn collisions
  if (!helpers.intersected(
      {x: acorn.x - acorn.radius, y: acorn.y - acorn.radius, width: acorn.radius * 2, height: acorn.radius * 2},
      {x: bullet.x - bullet.radius, y: bullet.y - bullet.radius, width: bullet.radius * 2, height: bullet.radius * 2})) {
    return;
  }
  shakeCount += 1;
  player.score += env.pointsPerHit;
  var textEffect = new TextEffect(acorn.x, acorn.y, 1);
  entities.push(textEffect);
  entities.explode(
    function (x, y, vx, vy) { return new Star(x, y, vx, vy, 2, textEffect); },
    acorn.x, acorn.y, 5, 8, 0);
  entities.explode(
    function (x, y, vx, vy) { return new Particle(x, y, 1, 'rgba(255, 218, 218, 0.8)', vx, vy, 0, env.gravity); },
    acorn.x, acorn.y, 30, 6, 2);
  bullet.die();
  acorn.die();
  hitSound.play();
});

game.click(function (e) {
  return entities.click(e);
});

// TODO: controller entity

game.update(function (t) {
  // Show start message and adjust click lock
  showClickToStart = !player.playing && ((t % 120 > 5 && t % 120 < 20) || t % 120 > 25);
  if (player.startLock > 0) {
    player.startLock -= 1;
  }

  if (shakeCount > 0) {
    shakeCount -= 1;
    shakeOffsetX = helpers.randInt(2, 4, true);
    shakeOffsetY = helpers.randInt(2, 4, true);
  } else {
    shakeOffsetX = 0;
    shakeOffsetY = 0;
  }

  // Spawn acorn
  // TODO: Base this off of difficulty or number of acorns currently in play?
  if (player.playing && player.playTime % env.acornSpawnTime === 0 && acornCount < env.maxAcorns) {
    var acorn = new Acorn();
    acorn.entered(function () { acornCount += 1; });
    acorn.exited(function () { acornCount -= 1; });
    entities.push(acorn);
  }

  entities.update(t);
});

game.render(function (ctx) {
  ctx.save();

  // Shake screen
  if (shakeOffsetX || shakeOffsetY) {
    ctx.translate(shakeOffsetX, shakeOffsetY);
  }

  entities.render(ctx);

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
    ctx.font = 'bold 28px sans-serif';
    helpers.outlineText(ctx, 'Or press \u25c2 \u25B8', game.width - 95, game.height - 20, '#333', '#fff');
  }

  // Draw score
  if (player.playing || player.played) {
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    helpers.outlineText(ctx, player ? player.displayedScore : 'High Score', game.width / 2, 22, '#333', '#fff');
  }

  ctx.restore();
});

module.exports = game;
