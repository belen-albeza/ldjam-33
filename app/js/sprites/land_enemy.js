'use strict';

var MOVE_SPEED = 150;

function LandEnemy(game, x, y, level) {
  // call parent
  Phaser.Sprite.call(this, game, x, y, 'ghost');
  this.level = level;

  this.anchor.setTo(0.5, 1);
  this.animations.add('walk', [0, 1], 4, true);
  this.animations.play('walk');

  this.game.physics.enable(this);
  this.body.bounce.setTo(1, 0);
  this.body.velocity.x = MOVE_SPEED;
}

LandEnemy.prototype = Object.create(Phaser.Sprite.prototype);
LandEnemy.prototype.constructor = LandEnemy;

LandEnemy.prototype.update = function () {
  var direction = 0;

  // face direction
  if (Math.abs(this.body.velocity.x) > 0) {
    direction = this.body.velocity.x > 0 ? 1 : -1;
    this.scale.setTo(direction, 1);
  }

  // NOTE: Phaser flips .left, .right and .width when scale is flipped
  // We're going to assume sprites are looking/moving to the right by default
  // bounce if next tile is empty
  var x = this.right + direction;
  var y = this.bottom + 1;
  var tile = this.level.map.getTileWorldXY(x, y, this.level.TSIZE,
    this.level.TSIZE, this.level.layer());
  if (!tile) { this.body.velocity.x *= -1; }
};

module.exports = LandEnemy;
