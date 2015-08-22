'use strict';

function Hades(game, x, y) {
  // call parent constructor
  Phaser.Sprite.call(this, game, x, y, 'hero');

  this.anchor.setTo(0.5);

  this.game.physics.enable(this);
  this.body.collideWorldBounds = true;
}

Hades.prototype = Object.create(Phaser.Sprite.prototype);
Hades.prototype.constructor = Hades;

module.exports = Hades;
