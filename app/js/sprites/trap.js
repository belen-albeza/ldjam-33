'use strict';

function Trap(game, x, y, key) {
  // call parent constructor
  Phaser.Sprite.call(this, game, x, y, key);

  this.anchor.setTo(0.5);

  this.game.physics.enable(this);
  this.body.allowGravity = false;
}

Trap.prototype = Object.create(Phaser.Sprite.prototype);
Trap.prototype.constructor = Trap;

module.exports = Trap;
