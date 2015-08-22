'use strict';

function Pomegranate(game, x, y) {
  Phaser.Sprite.call(this, game, x, y, 'goal');

  this.anchor.setTo(0.5);
  this.game.physics.enable(this);
  this.body.allowGravity = false;
}

Pomegranate.prototype = Object.create(Phaser.Sprite.prototype);
Pomegranate.prototype.constructor = Pomegranate;

module.exports = Pomegranate;
