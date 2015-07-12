var Entity = require('gesso-entity').Entity;
var env = require('../package.json').game;
var helpers = require('./helpers');

module.exports = Entity.extend({
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
});
