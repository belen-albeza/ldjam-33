'use strict';

var Level = require('../world/level.js');
var Editor = require('../world/editor.js');
var Hades = require('../sprites/hades.js');

var PlayScene = {};

PlayScene.create = function () {
  // load map
  var data = JSON.parse(this.game.cache.getText('level:1'));

  this.level = new Level(this.game, data);

  // this.hero = new Hades(this.game, 0, 0);
  // this.game.add.existing(this.hero);

  this.gui = this.add.group();
  this.editor = new Editor(this.gui, this.level);

  this.keys = {};
  this.keys.escape = this.game.input.keyboard.addKey(Phaser.Keyboard.ESC);
  this.game.input.keyboard.removeKeyCapture(Phaser.Keyboard.ESC);
  this.keys.escape.onDown.add(this.toggleEditor, this);

  this.isEditMode = false;
  this.gui.visible = false;
};

PlayScene.toggleEditor = function () {
    this.isEditMode = !this.isEditMode;
    this.gui.visible = this.isEditMode;
    console.log('TOGGLED EDITOR TO', this.isEditMode, this.gui.visible);
};

PlayScene.update = function () {
  if (this.isEditMode) { this.editor.update(); }
};

module.exports = PlayScene;
