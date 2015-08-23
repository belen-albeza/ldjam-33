'use strict';

var Level = require('../world/level.js');
var Editor = require('../world/editor.js');
var Hades = require('../sprites/hades.js');
var Pomegranate = require('../sprites/pomegranate.js');
var Trap = require('../sprites/trap.js');

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
  // setup sfx
  this.sfx = {
    jump: this.game.add.audio('jump'),
    die: this.game.add.audio('die'),
    win: this.game.add.audio('win')
  };

  // set background
  this.game.add.sprite(0, 0, 'background');

  // load map
  var data = JSON.parse(this.game.cache.getText('level:1'));
  this.level = new Level(this.game, data);

  // create main character
  this.hero = new Hades(this.game,
    data.hero.x * Level.TSIZE + Level.TSIZE / 2,
    data.hero.y * Level.TSIZE + Level.TSIZE / 2,
    this.sfx);
  this.game.add.existing(this.hero);
  this.game.camera.follow(this.hero);

  // create the goal sprite the hero needs to reach
  this.goal = new Pomegranate(this.game,
    data.goal.x * Level.TSIZE + Level.TSIZE / 2,
    data.goal.y * Level.TSIZE + Level.TSIZE / 2);
  this.game.add.existing(this.goal);

  // create the traps
  this.traps = this.add.group();
  data.lava.forEach(function (data) {
    var lava = new Trap(this.game,
      data.x * Level.TSIZE + Level.TSIZE / 2,
      data.y * Level.TSIZE + Level.TSIZE / 2,
      'fire');
    this.traps.add(lava);
  }.bind(this));

  // create the in-game level editor
  this.gui = this.add.group();
  this.editor = new Editor(this.gui, this.level);
  this.keys.escape.onDown.add(this.toggleEditor, this);
  this.isEditMode = false;
  this.gui.visible = false;

  // setup some listeners
  this.keys.up.onDown.add(this.hero.jump, this.hero);
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
  this.game.physics.arcade.overlap(this.hero, this.traps, this.killHero, null,
    this);
};

PlayScene.winLevel = function () {
  // TODO: temp
  this.sfx.win.play();
  this.game.state.restart();
};

PlayScene.killHero = function () {
  // TODO: temp
  this.sfx.die.play();
  this.game.state.restart();
};

PlayScene.render = function () {
  // this.game.debug.body(this.hero);
};


module.exports = PlayScene;
