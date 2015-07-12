var Entity = require('gesso-entity').Entity;
var env = require('../package.json').game;
var helpers = require('./helpers');

module.exports = Entity.extend({
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
});
