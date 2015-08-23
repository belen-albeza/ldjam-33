'use strict';

var MOVE_SPEED = 150;

function LandEnemy(game, x, y) {
  // call parent
  Phaser.Sprite.call(this, game, x, y, 'ghost');

  this.anchor.setTo(0.5);

  this.game.physics.enable(this);
  this.body.bounce.setTo(1, 0);
  this.body.velocity.x = MOVE_SPEED;
}

LandEnemy.prototype = Object.create(Phaser.Sprite.prototype);
LandEnemy.prototype.constructor = LandEnemy;

module.exports = LandEnemy;
