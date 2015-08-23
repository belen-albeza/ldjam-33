'use strict';

var JUMP_SPEED = 600;
var MOVE_SPEED = 300;

function Hades(game, x, y, sfx) {
  // call parent constructor
  Phaser.Sprite.call(this, game, x, y, 'hero');

  this.anchor.setTo(0.5);
  this.animations.add('walk', [0, 1], 4, true);
  this.animations.play('walk');

  this.game.physics.enable(this);
  this.body.setSize(32, 48);
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

  if (direction !== 0) {
    this.scale.setTo(direction, 1);
  }
};

Hades.prototype.freeze = function () {
  this.body.moves = false;
};

module.exports = Hades;
