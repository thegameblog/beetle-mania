var randInt = require('./helpers').randInt;
var Entity = require('gesso-entity').Entity;
var helpers = require('./helpers');

var Block = Entity.extend({
  init: function (s, x, y, width, height, color, capColor) {
    Entity.prototype.init.call(this);
    this.s = s;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.capColor = capColor;
  },

  update: function (t, remove) {
    this.x -= this.s;
    if (this.x + this.width <= 0) {
      this.die();
    }
  },

  render: function (ctx) {
    if (this.capColor) {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.fillStyle = this.capColor;
      ctx.fillRect(this.x, this.y, this.width, 4);
    } else {
      var radius = this.width;
      ctx.fillStyle = this.color;
      helpers.rotated(ctx, this.x, this.y, 0.8, function (x, y) {
        ctx.fillRect(x - radius / 2, y - radius / 2, radius, radius);
        helpers.fillCircle(ctx, x - radius, y, radius / 1.5, '#4A913C');
        helpers.fillCircle(ctx, x + radius, y, radius / 1.5, '#4A913C');
        helpers.fillCircle(ctx, x, y - radius, radius / 1.5, '#4A913C');
        helpers.fillCircle(ctx, x, y + radius, radius / 1.5, '#4A913C');
      });
    }
  }
});

var Hill = Block.extend({
  zindex: -1,

  init: function (s, x, y, width, height, color, capColor) {
    Block.prototype.init.call(this, s, x, y, width, height, color, capColor);
  }
});

var Opening = Block.extend({
  zindex: -2,

  init: function (s, x, y, width, height, color) {
    Block.prototype.init.call(this, s, x, y, width, height, color);
  }
});

module.exports = Entity.extend({
  player: null,
  zindex: -3,
  nextHill: 50,
  nextOpening: 20,

  init: function (player) {
    Entity.prototype.init.call(this);
    this.player = player;
  },

  update: function (t, remove) {
    this.nextHill -= 1;
    if (this.nextHill <= 0) {
      var x = this.game.width;
      var y = randInt(150, 400);
      var width = randInt(100, 250);
      var height = 420 - y;
      this.group.push(new Hill(0.7, x, y, width, height, '#70A248', '#9EB656'));
      this.nextHill = randInt(width / 2, 600);
    }

    this.nextOpening -= 1;
    if (this.nextOpening <= 0) {
      var r = randInt(10, 30);
      this.group.push(new Opening(0.3, this.game.width + r, randInt(0, 350), r, r, '#80B276'));
      this.nextOpening = randInt(200, 400);
    }
  },

  render: function (ctx) {
    // Draw background
    ctx.fillStyle = '#4A913C';
    ctx.fillRect(0, 0, this.game.width, this.game.height);

    ctx.fillStyle = '#70A248';
    ctx.fillRect(0, 420, this.game.width, this.game.height - 420);
    ctx.fillStyle = '#9EB656';
    ctx.fillRect(0, 420, this.game.width, 4);
  }
});
