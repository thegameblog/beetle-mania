var Class = require('class.extend');

module.exports = Class.extend({
  init: function (entityType1, entityType2, callback) {
    this.entityType1 = entityType1;
    this.entityType2 = entityType2;
    this.callback = callback;
  }
});
