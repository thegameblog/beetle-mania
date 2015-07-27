var Entity = require('gesso-entity').Entity;

module.exports = Entity.extend({
  zindex: 5,
  startEnergy: 60,

  init: function (x, y, multiple) {
    Entity.prototype.init.call(this);
    this.reset(x, y, multiple);
  },

  reset: function (x, y, multiple) {
    this.x = x;
    this.y = y;
    this.multiple = multiple;
    this.energy = this.startEnergy;
  },

  update: function (t, remove) {
    this.energy -= 1;
    if (this.energy <= 0) {
      this.die();
    }
  },

  render: function (ctx) {
    if (this.multiple > 1) {
      ctx.textAlign = 'center';
      ctx.font = ((this.startEnergy - this.energy) / 2 + 20) + 'px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText('x' + this.multiple, this.x, this.y);
    }
  }
});
