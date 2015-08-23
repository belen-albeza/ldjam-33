'use strict';

function Trap(game, x, y, key) {
  // call parent constructor
  Phaser.Sprite.call(this, game, x, y, key);

  this.anchor.setTo(0.5);
  this.animations.add('burn', [0, 1], this.game.rnd.between(1, 4), true);
  this.animations.play('burn');

  this.game.physics.enable(this);
  this.body.allowGravity = false;
}

Trap.prototype = Object.create(Phaser.Sprite.prototype);
Trap.prototype.constructor = Trap;

module.exports = Trap;
