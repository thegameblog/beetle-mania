var Entity = require('gesso-entity').Entity;
var env = require('../package.json').game;
var Star = require('./star');
var helpers = require('./helpers');

module.exports = Entity.extend({
  zindex: 4,
  radius: 16,
  bounce: 0.9,
  acornHeadColor: '#FFDA96',
  acornBodyColor: '#492F25',

  init: function () {
    Entity.prototype.init.call(this);
    this.x = 0;
    this.y = -this.radius;
    this.vx = helpers.randInt(1, 5) * (helpers.randInt(0, 1) ? -1 : 1);
    this.vy = 0;
    this.ground = 0;
    this.angle = 0;
    this.rotation = 0.1;
    this.bouncy = true;
  },

  enter: function () {
    this.x = helpers.randInt(this.radius, this.game.width - this.radius);
    this.ground = this.game.height - 30;
  },

  explode: function (multiplier, textEffect) {
    this.group.explode(
      // TODO: Cap the multiplier? Better sound effect after X?
      function (x, y, vx, vy) { return new Star(x, y, vx, vy, multiplier, textEffect); },
      this.x, this.y, 5, 8, 0);
    this.die();
  },

  update: function () {
    this.x += this.vx;
    if (this.x + this.radius > this.game.width && this.vx > 0 ||
        this.x - this.radius < 0 && this.vx < 0) {
      this.vx = -this.vx;
    }
    this.y += this.vy;
    this.vy += env.gravity;
    if (this.bouncy && this.y > this.ground - this.radius && this.vy > 0) {
      this.vy = Math.min(-this.vy * this.bounce, -6);
    }
    if (this.y > this.game.height + this.radius) {
      this.die();
    }
    this.angle += this.rotation;
    if (this.angle < -0.3 && this.rotation < 0 ||
        this.angle > 0.3 && this.rotation > 0) {
      this.rotation = -this.rotation;
    }
  },

  render: function (ctx) {
    var self = this;
    helpers.rotated(ctx, this.x, this.y, this.angle + 0.3, function (x, y) {
      // TODO: Use an image
      helpers.scaled(ctx, x, y, 0.85, 1, function (x, y) {
        ctx.fillStyle = self.acornHeadColor;
        helpers.fillCircle(ctx, x, y, self.radius);
        helpers.fillCircle(ctx, x, y + self.radius - (self.radius / 8), self.radius / 4);
        ctx.fillStyle = self.acornBodyColor;
        helpers.scaled(ctx, x, y - 14, 1, 0.65, function (x, y) {
          helpers.fillCircle(ctx, x, y + (self.radius / 2), self.radius, null, Math.PI, 0);
        });
        helpers.fillCircle(ctx, x, y - self.radius - (self.radius / 8), self.radius / 4);
      });
    });
  }
});
