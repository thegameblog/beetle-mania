var Class = require('class.extend');
var Delegate = require('gesso').Delegate;

module.exports = Class.extend({
  // TODO: Move to init function once 'super' is implemented
  init: function () {
    this.game = null;
    this.group = null;
    this.alive = true;
    this.entered = new Delegate();
    this.exited = new Delegate();
  },

  die: function () {
    this.alive = false;
  },

  enter: function () {},
  exit: function (group) {},
  update: function (t) {},
  render: function (ctx) {}
});
