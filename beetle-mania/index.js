var Gesso = require('gesso');
var Group = require('gesso-entity').Group;
var Howl = require('howler').Howl;
var env = require('../package.json').game;
var Player = require('./player');
var Background = require('./background');
var Acorn = require('./acorn');
var Star = require('./star');
var Bullet = require('./bullet');
var TextEffect = require('./text-effect');
var helpers = require('./helpers');

var game = new Gesso();
var entities = new Group(game);
var player = new Player();
var background = new Background(player);
var hitSound = new Howl({urls: [game.asset('hit.wav')]});
var bestHitSound = new Howl({urls: [game.asset('best-hit.wav')]});
var showClickToStart = false;
var showKnockedOutMessage = false;
var acornCount = 0;
var shakeCount = 0;
var shakeOffsetX = 0;
var shakeOffsetY = 0;
var difficultyTime = 5400;  // 1.5 minutes
var easyAcornFreq = 30;
var hardAcornFreq = 5;
var acornSpawnCount = 0;

// Add initial entities
entities.push(player);
entities.push(background);

// Callbacks
entities.entered(function (entity) {
  if (entity.constructor === Acorn) {
    acornCount += 1;
  }
});
entities.exited(function (entity) {
  if (entity.constructor === Acorn) {
    acornCount -= 1;
  }
});

// Add interactions
entities.pushInteraction(Star, Acorn, function (star, acorn) {
  // Skip stars without a multiplier
  if (!star.multiplier) {
    return;
  }
  // Check for star / acorn collisions
  if (!helpers.intersected(
      {x: acorn.x - acorn.radius, y: acorn.y - acorn.radius, width: acorn.radius * 2, height: acorn.radius * 2},
      {x: star.x - star.radius, y: star.y - star.radius, width: star.radius * 2, height: star.radius * 2})) {
    return;
  }
  shakeCount = 10;
  if (star.textEffect) {
    if (star.textEffect.multiple >= env.maxAcorns * 0.8) {
      bestHitSound.play();
    } else {
      hitSound.play();
    }
    // Resurrect textEffect if not alive?
    star.textEffect.reset(acorn.x, acorn.y, star.textEffect.multiple + 1);
    player.score += env.pointsPerHit * star.textEffect.multiple;
  }
  acorn.explode(star.multiplier + 1, star.textEffect);
  star.die();
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
  bullet.die();
  acorn.die();
  hitSound.play();
});
entities.pushInteraction(Player, Acorn, function (player, acorn) {
  if (!player.playing || player.knockedout || player.invincible || player.exploding) {
    return;
  }
  // Check for player / acorn collision
  var hitRadius = player.radius * 0.33;
  if (!helpers.intersected(
      {x: player.x - hitRadius, y: player.y - hitRadius, width: hitRadius * 2, height: hitRadius * 2},
      {x: acorn.x - acorn.radius, y: acorn.y - acorn.radius, width: acorn.radius * 2, height: acorn.radius * 2})) {
    return;
  }
  player.knockOut();
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

  if (shakeCount > 0) {
    shakeCount -= 1;
    shakeOffsetX = helpers.randInt(2, 4, true);
    shakeOffsetY = helpers.randInt(2, 4, true);
  } else {
    shakeOffsetX = 0;
    shakeOffsetY = 0;
  }

  // Spawn acorn if not knocked out
  if (player.playing && !player.knockedout && !player.exploding && acornCount < env.maxAcorns) {
    var difficulty = Math.max(difficultyTime - player.wakeTime, 0) / difficultyTime;
    var acornFreq = ((easyAcornFreq - hardAcornFreq) * difficulty) + hardAcornFreq;
    var spawnTime = !entities.containsType(Star) ? acornFreq : 15;
    acornSpawnCount += 1;
    if (acornSpawnCount >= spawnTime) {
      entities.push(new Acorn());
      acornSpawnCount = 0;
    }
  }

  // FUTURE: Drop bonus mode
  // if (!entities.containsType(Star)) {
  //   for (var i = acornCount; i < env.maxAcorns; i++) {
  //     entities.push(new Acorn());
  //   }
  // }

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
      helpers.outlineText(ctx, 'Click to start!', game.width / 2, game.height / 2, '#333', '#fff');
    }
    ctx.font = 'bold 28px sans-serif';
    helpers.outlineText(ctx, 'Or press \u25c2 \u25B8', game.width - 95, game.height - 20, '#333', '#fff');
  }

  // Draw knocked out mode text
  if (showKnockedOutMessage) {
    ctx.textAlign = 'center';
    ctx.font = 'bold 64px sans-serif';
    helpers.outlineText(ctx, 'Click!', game.width / 2, game.height / 2, '#333', '#fff');
  }
  if (player.knockedoutNext) {
    // Knocked out time
    ctx.textAlign = 'center';
    ctx.font = 'bold 24px sans-serif';
    if (player.knockedoutNext > player.knockedoutMaxNext * 0.2 && player.knockedoutCountdown !== player.knockedoutMaxCountdown) {
      helpers.outlineText(ctx, String(player.knockedoutMaxCountdown - player.knockedoutCountdown), player.x, player.y - player.radius - 20, '#333', '#fff');
    }
  }

  // Draw score
  if (player.played) {
    if (player.highScore) {
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'end';
      helpers.outlineText(ctx, player.displayedScore, game.width / 2 - 8, 22, '#333', '#fff');
      ctx.textAlign = 'start';
      helpers.outlineText(ctx, player.highScore, game.width / 2 + 8, 22, '#333', '#fff');
      if (player.highScoreTime > 0) {
        ctx.textAlign = 'center';
        var offset = player.highScoreTime * 2;
        var fade = player.highScoreTime / player.highScoreMaxTime * 2;
        ctx.font = 'bold ' + (24 + offset) + 'px sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, ' + fade + ')';
        ctx.fillText(player.highScore, game.width / 2, 64 + (offset * 1.5));
      }
    } else {
      ctx.textAlign = 'center';
      ctx.font = 'bold 20px sans-serif';
      helpers.outlineText(ctx, player.displayedScore, game.width / 2, 22, '#333', '#fff');
    }
  }

  ctx.restore();
});

module.exports = game;
