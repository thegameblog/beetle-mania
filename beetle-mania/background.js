var randInt = require('./helpers').randInt;
var Entity = require('gesso-entity').Entity;

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
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    if (this.capColor) {
      ctx.fillStyle = this.capColor;
      ctx.fillRect(this.x, this.y, this.width, 4);
    }
  }
});

var Hill = Block.extend({
  zindex: -1,

  init: function (s, x, y, width, height, color, capColor) {
    Block.prototype.init.call(this, s, x, y, width, height, color, capColor);
  }
});

var Cloud = Block.extend({
  zindex: -2,

  init: function (s, x, y, width, height, color) {
    Block.prototype.init.call(this, s, x, y, width, height, color);
  }
});

module.exports = Entity.extend({
  player: null,
  zindex: -3,
  nextHill: 50,
  nextCloud: 20,

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
      // '#9EB656'  // 'rgba(200, 200, 100, 0.3)'
      this.group.push(new Hill(0.7, x, y, width, height, '#70A248', '#9EB656'));
      this.nextHill = randInt(width / 2, 600);
    }

    this.nextCloud -= 1;
    if (this.nextCloud <= 0) {
      var r = randInt(10, 30);
      this.group.push(new Cloud(0.3, this.game.width, randInt(0, 250), r, r, '#80B276'));
      this.nextCloud = randInt(200, 600);
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
