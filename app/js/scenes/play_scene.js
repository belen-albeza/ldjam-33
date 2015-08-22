'use strict';

var Level = require('../world/level.js');
var Editor = require('../world/editor.js');
var Hades = require('../sprites/hades.js');
var Pomegranate = require('../sprites/pomegranate.js');

var PlayScene = {};

var GRAVITY = 950;

PlayScene.init = function () {
  this.game.physics.startSystem(Phaser.Physics.ARCADE);
  this.game.physics.arcade.gravity.y = GRAVITY;

  this.keys = this.game.input.keyboard.createCursorKeys();
  this.keys.escape = this.game.input.keyboard.addKey(Phaser.Keyboard.ESC);
  this.game.input.keyboard.removeKeyCapture(Phaser.Keyboard.ESC);
};

PlayScene.create = function () {
  // load map
  var data = JSON.parse(this.game.cache.getText('level:1'));

  this.level = new Level(this.game, data);

  this.hero = new Hades(this.game,
    data.hero.x * Level.TSIZE + Level.TSIZE / 2,
    data.hero.y * Level.TSIZE + Level.TSIZE / 2);
  this.game.add.existing(this.hero);

  this.goal = new Pomegranate(this.game,
    data.goal.x * Level.TSIZE + Level.TSIZE / 2,
    data.goal.y * Level.TSIZE + Level.TSIZE / 2);
  this.game.add.existing(this.goal);

  this.gui = this.add.group();
  this.editor = new Editor(this.gui, this.level);

  this.keys.escape.onDown.add(this.toggleEditor, this);

  this.isEditMode = false;
  this.gui.visible = false;

  this.game.camera.follow(this.hero);

  this.keys.up.onDown.add(this.hero.jump, this.hero);
  this.level.onDeadlyTile.add(function (sprite) {
    if (sprite === this.hero) {
      this.killHero();
    }
  }, this);
};

PlayScene.toggleEditor = function () {
    this.isEditMode = !this.isEditMode;
    this.gui.visible = this.isEditMode;
};

PlayScene.update = function () {
  if (this.isEditMode) { this.editor.update(); }

  // check for input
  if (this.keys.left.isDown) {
    this.hero.move(-1);
  }
  else if (this.keys.right.isDown) {
    this.hero.move(1);
  }
  else {
    this.hero.move(0);
  }

  this.game.physics.arcade.collide(this.hero, this.level.layer());
  this.game.physics.arcade.overlap(this.hero, this.goal, function () {
    this.winLevel();
  }, null, this);
};

PlayScene.winLevel = function () {
  // TODO: temp
  this.game.state.restart();
};

PlayScene.killHero = function () {
  // TODO: temp
  this.game.state.restart();
};

module.exports = PlayScene;
