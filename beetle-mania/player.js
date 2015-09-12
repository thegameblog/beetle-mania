/* globals document */

var Gesso = require('gesso');
var Entity = require('gesso-entity').Entity;
var Howl = require('howler').Howl;
var env = require('../package.json').game;
var Acorn = require('./acorn');
var Star = require('./star');
var Bullet = require('./bullet');
var TextEffect = require('./text-effect');
var helpers = require('./helpers');

var canvas = Gesso.getCanvas();
var newGameSignal = false;
var wakeUpSignal = false;
var bulletCount = 0;
var mouseX = 0;
var keysDown = {left: false, right: false};

var Player = Entity.extend({
  zindex: 3,
  radius: 12,
  color: '#000',
  colorInvincible: '#385124',
  knockedoutColor: '#500',
  knockedoutMaxCountdown: 3,
  highScoreMaxSeconds: 1,
  blinkDelaySeconds: 3,

  init: function (player) {
    Entity.prototype.init.call(this);
    this.startLock = 0;
    this.playing = false;
    this.played = false;
    this.playTime = 0;
    this.exploding = false;
    this.shootSound = null;
    this.knockedoutSound = null;
    this.countupSound = null;
    this.highScoreSound = null;
    this.gameOverSound = null;
    this.knockedout = false;
    this.knockedoutNext = 0;
    this.knockedoutMaxNext = null;
    this.knockedoutCountdown = 0;
    this.invincible = 0;
    this.maxInvincible = null;
    this.strength = 100;
    this.score = 0;
    this.displayedScore = 0;
    this.displayedScoreDelay = 0;
    this.highScore = 0;
    this.highScoreTime = 0;
    this.highScoreMaxTime = null;
    this.x = 0;
    this.y = 0;
    this.blinkFor = 0;
    this.blinkNext = 0;
    this.blinkDelay = null;
  },

  enter: function () {
    this.y = this.game.height - 30;
    this.shootSound = new Howl({urls: [this.game.asset('fire.wav')]});
    this.knockedoutSound = new Howl({urls: [this.game.asset('knockedout.wav')]});
    this.countupSound = new Howl({urls: [this.game.asset('countup.wav')]});
    this.highScoreSound = new Howl({urls: [this.game.asset('high-score.wav')]});
    this.gameOverSound = new Howl({urls: [this.game.asset('game-over.wav')]});
    this.knockedoutMaxNext = this.game.fps;
    this.maxInvincible = this.game.fps * 2;
  },

  start: function () {
    this.x = this.game.width / 2;
    this.playing = true;
    this.played = true;
    this.exploding = false;
    this.playTime = 0;
    // TODO: newAcornGenerator()?
    this.score = 0;
    this.strength = 100;
    this.displayedScore = 0;
    this.displayedScoreDelay = 0;
    this.highScoreMaxTime = this.game.fps * this.highScoreMaxSeconds;
    this.blinkDelay = this.game.fps * this.blinkDelaySeconds;
    this.blinkNext = this.blinkDelay;
    this.group.forEachType(Acorn, function (acorn) {
      acorn.explode(0);
    });
  },

  stop: function () {
    this.playing = false;
    this.exploding = false;
    this.startLock = 30;
    this.knockedout = false;
    if (this.score >= this.highScore) {
      this.highScore = this.score;
      this.highScoreTime = this.highScoreMaxTime;
      this.highScoreSound.play();
    } else {
      this.gameOverSound.play();
    }
    this.score = 0;
    this.displayedScoreDelay = 0;
    this.group.forEachType(Acorn, function (acorn) {
      acorn.bouncy = false;
    });
  },

  explode: function () {
    this.exploding = true;
    // Explode effect
    var textEffect = new TextEffect(this.x, this.y, 1);
    this.group.push(textEffect);
    this.group.explode(
      function (x, y, vx, vy) { return new Star(x, y, vx, vy, 1, textEffect); },
      this.x, this.y, 20, 10, 0);
  },

  click: function (e) {
    mouseX = e.clientX - canvas.getBoundingClientRect().left;
    keysDown.fired = true;
    // Start game if not currently playing
    newGameSignal = true;
    // Try to wake up signal if knocked out
    if (this.knockedout) {
      wakeUpSignal = true;
    }
  },

  knockOut: function () {
    this.knockedoutCountdown = this.knockedoutMaxCountdown;
    this.knockedoutNext = this.game.fps;
    this.knockedout = true;
    wakeUpSignal = false;
    this.knockedoutSound.play();
  },

  wakeUp: function () {
    this.knockedoutCountdown = 0;
    this.knockedoutNext = 0;
    this.knockedout = false;
    this.invincible = this.maxInvincible;
  },

  update: function (t) {
    // Start a new game
    if (newGameSignal) {
      newGameSignal = false;
      if (this.startLock === 0 && !this.playing) {
        this.start();
      }
    }

    // Update high score animation
    if (this.highScoreTime > 0) {
      this.highScoreTime -= 1;
    }

    // Show countdown and end the game if it reaches zero
    if (this.knockedoutNext > 0) {
      this.knockedoutNext -= 1;
      if (this.knockedoutNext <= 0 && this.knockedoutCountdown > 0) {
        this.countupSound.play();
        this.knockedoutNext = this.knockedoutMaxNext;
        this.knockedoutCountdown -= 1;
        if (this.knockedoutCountdown <= 0) {
          this.explode();
          return;
        }
      }
    }

    // Update only when playing
    if (!this.playing) {
      return;
    }

    // Update score
    this.displayedScoreDelay = Math.max(this.displayedScoreDelay - 1, 0);
    if (this.displayedScore < this.score && this.displayedScoreDelay === 0) {
      var multiple = this.score - this.displayedScore > 10000 ? 1111 : (this.score - this.displayedScore > 1000 ? 111 : 11);
      this.displayedScore = Math.min(this.displayedScore + multiple, this.score);
      this.displayedScoreDelay = 2;
    }

    // Update total play-time
    this.playTime += 1;

    // Update only when not exploding
    if (this.exploding) {
      if (this.displayedScore === this.score && !this.group.containsType(Star)) {
        this.stop();
      }
      return;
    }

    // Wake up from a knockout
    if (wakeUpSignal) {
      wakeUpSignal = false;
      if (this.knockedout) {
        this.wakeUp();
      }
    }

    // Adjust invincibility
    if (this.invincible > 0) {
      this.invincible -= 1;
    }

    // Short-circuit if knocked out
    if (this.knockedout) {
      this.move = false;//t % 4 >= 2;
      this.blinkFor = 5;
      this.blinkNext = this.blinkDelay;
      return;
    }

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
        this.shootSound.play();
        this.group.push(bullet);
      }
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
    if (!this.playing || this.exploding) {
      return;
    }

    // Turn when knocked out
    if (this.knockedout) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(0.6);
      ctx.translate(-this.x, -this.y);
    }

    var color = (this.knockedout ?
      this.knockedoutColor :
      (this.invincible ? this.colorInvincible : this.color));

    // Body
    helpers.fillCircle(ctx, this.x, this.y, this.radius, color);

    // Eyes
    if (this.knockedout) {
      ctx.strokeStyle = '#cc0';
      helpers.drawX(ctx, this.x - 4, this.y - 6, 2);
      helpers.drawX(ctx, this.x + 4, this.y - 6, 2);
    } else {
      ctx.fillStyle = '#cc0';
      if (this.blinkFor > 0) {
        ctx.fillRect(this.x - 4 - 2, this.y - 7, 4, 1);
        ctx.fillRect(this.x + 4 - 2, this.y - 7, 4, 1);
      } else {
        helpers.fillCircle(ctx, this.x - 4, this.y - 6, 1);
        helpers.fillCircle(ctx, this.x + 4, this.y - 6, 1);
      }
    }

    // Neck
    ctx.fillStyle = color;
    ctx.fillRect(this.x - 4, this.y - 16, 8, 6);

    // Mandible
    var moveMandibleBy = this.move ? 0 : 1;
    helpers.scaled(ctx, this.x, this.y - 14 - moveMandibleBy, 1, 0.65, function (x, y) {
      helpers.fillCircle(ctx, x, y, 6, color, Math.PI, 0);
    });

    // Legs
    var moveLegsBy = this.move ? 0 : 0.3;
    helpers.fillRotatedRect(ctx, Math.PI + 0.3 + moveLegsBy, this.x - 10, this.y - 6, 8, 2, color);
    helpers.fillRotatedRect(ctx, Math.PI + 0.1 + moveLegsBy, this.x - 12, this.y, 8, 2, color);
    helpers.fillRotatedRect(ctx, Math.PI + -0.1 - moveLegsBy, this.x - 11, this.y + 5, 8, 2, color);
    helpers.fillRotatedRect(ctx, -0.3 - moveLegsBy, this.x + 9, this.y - 8, 8, 2, color);
    helpers.fillRotatedRect(ctx, -0.1 - moveLegsBy, this.x + 11, this.y - 2, 8, 2, color);
    helpers.fillRotatedRect(ctx, 0.1 + moveLegsBy, this.x + 11, this.y + 4, 8, 2, color);

    if (this.knockedout) {
      ctx.restore();
    }
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
  } else if (e.which === 83 || e.which === 38 || e.which === 32 || e.which === 190 || e.which === 191 || e.which === 88 || e.which === 90) {
    if (!e.repeat) {
      keysDown.fired = true;
      // Try to wake up signal if knocked out
      wakeUpSignal = true;
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
