var Class = require('class.extend');
var Delegate = require('gesso').Delegate;
var Interaction = require('./interaction');

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isArray(obj) {
  return (Array.isArray ?
    Array.isArray(obj) :
    Object.prototype.toString.call(obj) === '[object Array]');
}

function contains(a, obj) {
  for (var i = 0; i < a.length; i++) {
    if (a[i] === obj) {
      return true;
    }
  }
  return false;
}

module.exports = Class.extend({
  init: function (game) {
    this._entities = [];
    this._interactions = [];
    this.game = game;
    this.entered = new Delegate();
    this.exited = new Delegate();
  },

  _iterate: function (entities, callback) {
    var orderedEntities = [];
    for (var index = 0; index < entities.length; index++) {
      orderedEntities.push({index: index, entity: entities[index]});
    }

    // Sort on zindex
    orderedEntities.sort(function(a, b) {
      var cmp = (a.entity.zindex || 0) - (b.entity.zindex || 0);
      return cmp !== 0 ? cmp : a.index - b.index;
    });

    // Iterate the snapshot
    var deadEntities = [];
    for (index = 0; index < orderedEntities.length; index++) {
      if (orderedEntities[index].entity.alive) {
        callback(orderedEntities[index].entity);
        // Check for dead entity
        if (!orderedEntities[index].entity.alive) {
          deadEntities.push(orderedEntities[index].entity);
        }
      }
    }

    // Remove dead entities
    for (index = 0; index < deadEntities.length; index++) {
      this.remove(deadEntities[index]);
    }

    /*
    var snapshotEntities = entities.slice();

    // Sort on zindex
    snapshotEntities.sort(function(a, b) {
      return (a.zindex || 0) - (b.zindex || 0);
    });

    // Iterate the snapshot
    var deadEntities = [];
    for (var index = 0; index < snapshotEntities.length; index++) {
      if (snapshotEntities[index].alive) {
        callback(snapshotEntities[index]);
        // Check for dead entity
        if (!snapshotEntities[index].alive) {
          deadEntities.push(snapshotEntities[index]);
        }
      }
    }

    // Remove dead entities
    for (index = 0; index < deadEntities.length; index++) {
      this.remove(deadEntities[index]);
    }
    */
  },

  _doubleIterate: function (entities, callback) {
    var snapshotEntities = entities.slice();

    // Iterate the snapshot
    var deadEntities = [];
    for (var index1 = 0; index1 < snapshotEntities.length; index1++) {
      if (!snapshotEntities[index1].alive) {
        continue;
      }
      for (var index2 = index1 + 1; index2 < snapshotEntities.length; index2++) {
        if (!snapshotEntities[index1].alive || !snapshotEntities[index2].alive) {
          continue;
        }
        callback(snapshotEntities[index1], snapshotEntities[index2]);
        // Check for dead entities
        if (!snapshotEntities[index1].alive) {
          deadEntities.push(snapshotEntities[index1]);
        }
        if (!snapshotEntities[index2].alive) {
          deadEntities.push(snapshotEntities[index2]);
        }
      }
    }

    // Remove dead entities
    for (var index = 0; index < deadEntities.length; index++) {
      this.remove(deadEntities[index]);
    }
  },

  pushInteractions: function (interactions) {
    for (var index = 0; index < interactions.length; index++) {
      this.pushInteraction(interactions[index]);
    }
  },

  pushInteraction: function (entityType1, entityType2, callback) {
    this._interactions.push(new Interaction(entityType1, entityType2, callback));
  },

  push: function (entity) {
    if (entity.group) {
      throw new Error('Entity is already in a group.');
    }
    this._entities.push(entity);
    entity.group = this;
    entity.game = this.game;
    entity.enter();
    entity.entered.invoke();
    this.entered.invoke(entity);
  },

  remove: function (entity) {
    var index = this._entities.indexOf(entity);
    if (index === -1) {
      return false;
    }
    this._entities.splice(index, 1);
    entity.group = null;
    entity.game = null;
    entity.exit(this);
    entity.exited.invoke(this);
    this.exited.invoke(entity);
    return true;
  },

  explode: function (createEntity, x, y, intensity, power, powerVariance) {
    intensity = intensity || 100;
    power = power || 15;
    powerVariance = (powerVariance || powerVariance === 0) ? powerVariance : 5;
    var minVelocity = Math.max(0, power - powerVariance);
    var maxVelocity = Math.max(0, power + powerVariance);
    for (var index = 0; index < intensity; index++) {
      var angle = randInt(0, 360);
      var velocity = randInt(minVelocity, maxVelocity);
      var vx = Math.cos(angle * Math.PI / 180) * velocity;
      var vy = Math.sin(angle * Math.PI / 180) * velocity;
      this.push(createEntity(x, y, vx, vy));
    }
  },

  contains: function (entity) {
    return this._entities.indexOf(entity) !== -1;
  },

  containsType: function (entityType) {
    for (var index = 0; index < this._entities.length; index++) {
      if (this._entities[index].constructor === entityType) {
        return true;
      }
    }
    return false;
  },

  forEachType: function (entityType, callback) {
    this._iterate(this._entities, function (entity) {
      if (entity.constructor === entityType) {
        callback(entity);
      }
    });
  },

  invoke: function (methodName) {
    var args = [];
    for(var i = 1; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    var results;
    this._iterate(this._entities, function (entity) {
      if (entity[methodName]) {
        var r = entity[methodName].apply(entity, args.slice(0));
        // Aggregate results with the following precedence: undefined -> null -> falsy -> truthy
        results = results || (results !== false && !r ? r : !!r);
      }
    });
    return results;
  },

  update: function (t) {
    // Update entities
    this._iterate(this._entities, function (entity) {
      entity.update(t);
    });

    // Update interactions between entities
    var interactions = this._interactions;
    this._doubleIterate(this._entities, function (entity1, entity2) {
      for (var index = 0; index < interactions.length; index++) {
        var entityType1 = interactions[index].entityType1;
        var entityType2 = interactions[index].entityType2;
        if (isArray(entityType1) || isArray(entityType2)) {
          // Check arrays
          var entityTypes1 = isArray(entityType1) ? entityType1 : [entityType1];
          var entityTypes2 = isArray(entityType2) ? entityType2 : [entityType2];
          if (contains(entityTypes1, entity1.constructor) &&
              contains(entityTypes2, entity2.constructor)) {
            interactions[index].callback(entity1, entity2, t);
          } else if (
              contains(entityTypes2, entity1.constructor) &&
              contains(entityTypes1, entity2.constructor)) {
            interactions[index].callback(entity2, entity1, t);
          }
        } else {
          // Check objects
          if (entity1.constructor === interactions[index].entityType1 &&
              entity2.constructor === interactions[index].entityType2) {
            interactions[index].callback(entity1, entity2, t);
          } else if (
              entity1.constructor === interactions[index].entityType2 &&
              entity2.constructor === interactions[index].entityType1) {
            interactions[index].callback(entity2, entity1, t);
          }
        }
      }
    });
  },

  render: function (ctx) {
    this._iterate(this._entities, function (entity) {
      entity.render(ctx);
    });
  }
});
