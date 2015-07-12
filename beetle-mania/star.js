var Entity = require('gesso-entity').Entity;
var helpers = require('./helpers');

module.exports = Entity.extend({
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
});
