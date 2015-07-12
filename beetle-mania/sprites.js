var Entity = require('gesso-entity').Entity;
var helpers = require('./helpers');
var env = require('../package.json').game;

module.exports = {
  Bullet: Entity.extend({
    zindex: 1,
    radius: 12,
    color: '#ff4',
    speed: env.bulletSpeed,

    init: function (x, y) {
      Entity.prototype.init.call(this);
      this.x = x;
      this.y = y;
      this.angle = -0.3;
      this.rotation = 0.1;
    },

    update: function (t, remove) {
      this.y -= this.speed;
      this.angle += this.rotation;
      if (this.y + this.radius < 0) {
        this.die();
      }
    },

    render: function (ctx) {
      var self = this;
      helpers.rotated(ctx, this.x, this.y, this.angle, function (x, y) {
        helpers.fillStar(ctx, x, y, 5, self.radius, self.radius / 2, self.color);
      });
    }
  }),

  Star: Entity.extend({
    zindex: 2,
    radius: 10,
    color: '#EF7800',
    energy: 15,

    init: function (x, y, vx, vy, multiplier) {
      Entity.prototype.init.call(this);
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.energy = this.energy;
      this.multiplier = multiplier;
      this.angle = 0;
      this.rotation = -0.3;
    },

    update: function (t, remove) {
      this.x += this.vx;
      this.y += this.vy;
      this.angle += this.rotation;
      this.energy -= 1;
      if (this.energy <= 0) {
        this.die();
      }
    },

    render: function (ctx) {
      var self = this;
      helpers.rotated(ctx, this.x, this.y, this.angle, function (x, y) {
        helpers.fillStar(ctx, x, y, 5, self.radius, self.radius / 2, self.color);
      });
    }
  }),

  Acorn: Entity.extend({
    zindex: 4,
    radius: 16,
    acornHeadColor: '#FFDA96',  // #fc3
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
    },

    enter: function () {
      this.x = helpers.randInt(this.radius, this.game.width - this.radius);
      this.ground = this.game.height - 30;
    },

    update: function () {
      this.x += this.vx;
      if (this.x + this.radius > this.game.width && this.vx > 0 ||
          this.x - this.radius < 0 && this.vx < 0) {
        this.vx = -this.vx;
      }
      this.y += this.vy;
      this.vy += env.gravity;
      if (this.y > this.ground - this.radius && this.vy > 0) {
        this.vy = Math.min(-this.vy * 0.8, -6);
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
  }),

  Particle: Entity.extend({
    zindex: 5,
    color: '#fff',

    init: function (x, y, radius, color, vx, vy, ax, ay) {
      Entity.prototype.init.call(this);
      this.x = x;
      this.y = y;
      this.radius = radius || 3;
      this.color = color || this.color;
      this.vx = vx || 0;
      this.vy = vy || 0;
      this.ax = ax || 0;
      this.ay = ay || 0;
    },

    update: function () {
      this.vx += this.ax;
      this.vy += this.ay;
      this.x += this.vx;
      this.y += this.vy;
      if (this.x + this.radius < -env.particleMargin || this.x - this.radius > this.game.width + env.particleMargin ||
          this.y + this.radius < -env.particleMargin || this.y - this.radius > this.game.height + env.particleMargin) {
        this.die();
      }
    },

    render: function (ctx) {
      helpers.fillCircle(ctx, this.x, this.y, this.radius, this.color);
    }
  })
};
