var extend = require('util')._extend;

var helpers = {
  clamp: function (value, min, max) {
    return Math.min(Math.max(value, min), max);
  },
  randInt: function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  scaled: function (ctx, x, y, scaleX, scaleY, cb) {
    ctx.translate(x, y);
    ctx.scale(scaleX, scaleY);
    ctx.translate(-x, -y);
    cb(x, y);
    ctx.translate(x, y);
    ctx.scale(1 / scaleX, 1 / scaleY);
    ctx.translate(-x, -y);
  },
  fillCircle: function (ctx, x, y, r, color, startAngle, endAngle) {
    ctx.beginPath();
    ctx.arc(x, y, r, startAngle || 0, endAngle || 2 * Math.PI, false);
    var fillStyle = null;
    if (color) {
      fillStyle = ctx.fillStyle;
      ctx.fillStyle = color;
    }
    ctx.fill();
    if (fillStyle !== null) {
      ctx.fillStyle = fillStyle;
    }
  },
  fillRotatedRect: function (ctx, angle, x, y, width, height, color) {
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.translate(-x, -y);
    var fillStyle = null;
    if (color) {
      fillStyle = ctx.fillStyle;
      ctx.fillStyle = color;
    }
    ctx.fillRect(x, y, width, height);
    if (fillStyle !== null) {
      ctx.fillStyle = fillStyle;
    }
    ctx.translate(x, y);
    ctx.rotate(-angle);
    ctx.translate(-x, -y);
  },
  outlineText: function (ctx, text, x, y, color, outline) {
    ctx.fillStyle = color;
    ctx.fillText(text, x - 1, y);
    ctx.fillText(text, x + 1, y);
    ctx.fillText(text, x, y - 1);
    ctx.fillText(text, x, y + 2);
    ctx.fillStyle = outline;
    ctx.fillText(text, x, y);
  },
  intersected: function (rect1, rect2) {
    return (rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.height + rect1.y > rect2.y);
  },
  explode: function (particles, origin, values, intensity, power, powerVariance) {
    intensity = intensity || 100;
    powerVariance = typeof powerVariance !== 'undefined' ? Math.abs(powerVariance) : 5;
    var minVelocity = helpers.clamp(0, power - powerVariance);
    var maxVelocity = helpers.clamp(0, power + powerVariance);
    for (var index = 0; index < intensity; index++) {
      var angle = helpers.randInt(0, 360);
      var velocity = helpers.randInt(minVelocity, maxVelocity);
      var particle = extend({
        x: origin.x,
        y: origin.y,
        vx: Math.cos(angle * Math.PI / 180) * velocity,
        vy: Math.sin(angle * Math.PI / 180) * velocity
      }, values);
      particles.push(particle);
    }
  }
};

module.exports = helpers;
