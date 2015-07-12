var Gesso = require('gesso');
var Group = require('gesso-entity').Group;
var env = require('../package.json').game;
var Player = require('./player');
var Acorn = require('./acorn');
var Bullet = require('./bullet');
var Particle = require('./particle');
var Star = require('./star');
var helpers = require('./helpers');

var game = new Gesso();
var entities = new Group(game);
var player = new Player();
var showClickToStart = false;
var acornCount = 0;

// Add player
entities.push(player);

// Add interactions
entities.pushInteraction(Star, Acorn, function (star, acorn) {
  // Check for star / acorn collisions
  if (!helpers.intersected(
      {x: acorn.x - acorn.radius, y: acorn.y - acorn.radius, width: acorn.radius * 2, height: acorn.radius * 2},
      {x: star.x - star.radius, y: star.y - star.radius, width: star.radius * 2, height: star.radius * 2})) {
    return;
  }
  player.score += env.pointsPerHit * star.multiplier;
  entities.explode(
    function (x, y, vx, vy) { return new Star(x, y, vx, vy, star.multiplier + 1); },
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
  player.score += env.pointsPerHit;
  entities.explode(
    function (x, y, vx, vy) { return new Star(x, y, vx, vy, 2); },
    acorn.x, acorn.y, 5, 8, 0);
  entities.explode(
    function (x, y, vx, vy) { return new Particle(x, y, 1, 'rgba(255, 218, 218, 0.8)', vx, vy, 0, env.gravity); },
    acorn.x, acorn.y, 30, 6, 2);
  bullet.die();
  acorn.die();
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

  // Draw background
  ctx.fillStyle = '#4A913C';
  ctx.fillRect(0, 0, game.width, game.height);

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
    ctx.font = 'bold 16px sans-serif';
    helpers.outlineText(ctx, 'Or press \u25c2 \u25B8', game.width - 60, game.height - 10, '#333', '#fff');
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
