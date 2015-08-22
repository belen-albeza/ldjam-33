'use strict';

var JUMP_SPEED = 600;
var MOVE_SPEED = 300;

function Hades(game, x, y, sfx) {
  // call parent constructor
  Phaser.Sprite.call(this, game, x, y, 'hero');

  this.anchor.setTo(0.5);

  this.game.physics.enable(this);
  this.body.collideWorldBounds = true;

  this.sfx = sfx;
}

Hades.prototype = Object.create(Phaser.Sprite.prototype);
Hades.prototype.constructor = Hades;

Hades.prototype.jump = function () {
  if (this.body.onFloor()) {
    this.body.velocity.y = -JUMP_SPEED;
    this.sfx.jump.play();
  }
};

Hades.prototype.move = function (direction) {
  this.body.velocity.x = MOVE_SPEED * direction;
};

module.exports = Hades;
