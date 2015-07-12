/* globals document */

var Gesso = require('gesso');
var Entity = require('gesso-entity').Entity;
var Bullet = require('./sprites').Bullet;
var helpers = require('./helpers');
var env = require('./package.json').game;

var canvas = Gesso.getCanvas();
var newGameSignal = false;
var bulletCount = 0;
var mouseX = 0;
var keysDown = {left: false, right: false};

var Player = Entity.extend({
  zindex: 3,

  init: function (player) {
    Entity.prototype.init.call(this);
    this.startLock = 0;
    this.playing = false;
    this.playTime = 0;
    this.score = 0;
    this.displayedScore = 0;
    this.displayedScoreDelay = 0;
    this.x = 0;
    this.y = 0;
    this.radius = 12;
    this.color = '#000';
    this.blinkFor = 0;
    this.blinkNext = 60 * 3;
    this.blinkDelay = 60 * 3;
  },

  enter: function () {
    this.y = this.game.height - 30;
  },

  start: function () {
    this.x = this.game.width / 2;
    this.playing = true;
    this.playTime = 0;
    // TODO: newAcornGenerator()?
    this.score = 0;
    this.displayedScore = 0;
    this.displayedScoreDelay = 0;
  },

  stop: function () {
    this.playing = false;
    this.played = true;
    this.startLock = 30;
    // TODO: Set high score
  },

  click: function (e) {
    mouseX = e.clientX - canvas.getBoundingClientRect().left;
    keysDown.fired = true;
    // Start game if not currently playing
    newGameSignal = true;
  },

  update: function (t) {
    // Start a new game
    if (newGameSignal) {
      newGameSignal = false;
      if (this.startLock === 0 && !this.playing) {
        this.start();
      }
    }

    // Update only when playing
    if (!this.playing) {
      return;
    }

    // Update total play-time
    this.playTime += 1;

    // Update position
    if (mouseX !== null) {
      if (mouseX < this.x) {
        this.x = helpers.clamp(this.x - env.mouseSpeed, Math.max(this.radius + 2, mouseX), this.game.width - this.radius - 2);
      } else if (mouseX > this.x) {
        this.x = helpers.clamp(this.x + env.mouseSpeed, this.radius + 2, Math.min(this.game.width - this.radius - 2, mouseX));
      }
    }

    var x = this.x;
    if (keysDown.left) {
      x -= env.keyboardSpeed;
    }
    if (keysDown.right) {
      x += env.keyboardSpeed;
    }
    this.x = helpers.clamp(x, this.radius + 2, this.game.width - this.radius - 2);

    // Fire
    if (keysDown.fired) {
      keysDown.fired = false;
      // Limit bullet count
      if (bulletCount < env.maxBullets) {
        var bullet = new Bullet(this.x, this.y - this.radius - 10);
        bullet.entered(function () { bulletCount += 1; });
        bullet.exited(function () { bulletCount -= 1; });
        this.group.push(bullet);
      }
    }

    // Update score
    this.displayedScoreDelay = Math.max(this.displayedScoreDelay - 1, 0);
    if (this.displayedScore < this.score && this.displayedScoreDelay === 0) {
      this.displayedScore = Math.min(this.displayedScore + 10, this.score);
      this.displayedScoreDelay = 3;
    }

    // Adjust personality
    this.move = t % 8 >= 4;
    this.blinkFor = Math.max(0, this.blinkFor - 1);
    this.blinkNext = Math.max(0, this.blinkNext - 1);
    if (this.blinkNext === 0) {
      this.blinkFor = 5;
      this.blinkNext = this.blinkDelay;
    }
  },

  render: function (ctx) {
    // Render only when playing
    if (!this.playing) {
      return;
    }

    // Body
    ctx.fillStyle = this.color;
    helpers.fillCircle(ctx, this.x, this.y, this.radius, this.color);
    ctx.fillStyle = '#cc0';
    if (this.blinkFor > 0) {
      ctx.fillRect(this.x - 4 - 2, this.y - 7, 4, 1);
      ctx.fillRect(this.x + 4 - 2, this.y - 7, 4, 1);
    } else {
      helpers.fillCircle(ctx, this.x - 4, this.y - 6, 1);
      helpers.fillCircle(ctx, this.x + 4, this.y - 6, 1);
    }
    ctx.fillStyle = this.color;

    // Neck
    ctx.fillRect(this.x - 4, this.y - 16, 8, 6);

    // Mandible
    var moveMandibleBy = this.move ? 0 : 1;
    helpers.scaled(ctx, this.x, this.y - 14 - moveMandibleBy, 1, 0.65, function (x, y) {
      helpers.fillCircle(ctx, x, y, 6, this.color, Math.PI, 0);
    });

    // Legs
    var moveLegsBy = this.move ? 0 : 0.3;
    helpers.fillRotatedRect(ctx, Math.PI + 0.3 + moveLegsBy, this.x - 10, this.y - 6, 8, 2, this.color);
    helpers.fillRotatedRect(ctx, Math.PI + 0.1 + moveLegsBy, this.x - 12, this.y, 8, 2, this.color);
    helpers.fillRotatedRect(ctx, Math.PI + -0.1 - moveLegsBy, this.x - 11, this.y + 5, 8, 2, this.color);
    helpers.fillRotatedRect(ctx, -0.3 - moveLegsBy, this.x + 9, this.y - 8, 8, 2, this.color);
    helpers.fillRotatedRect(ctx, -0.1 - moveLegsBy, this.x + 11, this.y - 2, 8, 2, this.color);
    helpers.fillRotatedRect(ctx, 0.1 + moveLegsBy, this.x + 11, this.y + 4, 8, 2, this.color);
  }
});

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
  } else if (e.which === 38 || e.which === 32 || e.which === 16 || e.which === 88 || e.which === 90) {
    if (!e.repeat) {
      keysDown.fired = true;
    }
  } else if (e.which !== 40) {  // Ignore down key
    return;
  }

  // Switch to keyboard controls when moving
  if (e.which === 37 || e.which === 65 || e.which === 39 || e.which === 68) {
    mouseX = null;
  }

  // Start new game if not currently playing
  newGameSignal = true;

  if (e.target === document.body) {
    e.preventDefault();
    return false;
  }
});

document.addEventListener('keyup', function (e) {
  if (e.which === 37 || e.which === 65) {
    keysDown.left = false;
  } else if (e.which === 39 || e.which === 68) {
    keysDown.right = false;
  }
});

module.exports = Player;
