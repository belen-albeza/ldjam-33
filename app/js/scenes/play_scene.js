'use strict';

var Level = require('../world/level.js');
var Editor = require('../world/editor.js');
var Hades = require('../sprites/hades.js');
var Pomegranate = require('../sprites/pomegranate.js');
var Trap = require('../sprites/trap.js');
var LandEnemy = require('../sprites/land_enemy.js');

var PlayScene = {};

var GRAVITY = 950;
var LEVEL_COUNT = 3;

PlayScene.init = function (levelIndex) {
  this.game.physics.startSystem(Phaser.Physics.ARCADE);
  this.game.physics.arcade.gravity.y = GRAVITY;

  this.keys = this.game.input.keyboard.createCursorKeys();
  this.keys.escape = this.game.input.keyboard.addKey(Phaser.Keyboard.ESC);
  this.game.input.keyboard.removeKeyCapture(Phaser.Keyboard.ESC);

  // this.currentLevel = levelIndex;
  this.currentLevel = 3;
};

PlayScene.create = function () {
  // setup sfx
  this.sfx = {
    jump: this.game.add.audio('jump'),
    die: this.game.add.audio('die'),
    win: this.game.add.audio('win'),
    coin: this.game.add.audio('coin')
  };
  this.soundtrack = this.game.add.audio('background');
  // this.soundtrack.fadeIn(1200, true);

  // set background
  var background = this.game.add.image(0, 0, 'background');
  background.fixedToCamera = true;

  // load map
  var data = JSON.parse(this.game.cache.getText('level:' + this.currentLevel));
  this.level = new Level(this.game, data);

  // create the sprites from level data
  this._spawnSprites(data);
  // create the in-game level editor
  this._setupEditor();
  // create the in-game HUD
  this._setupHud();

  this.isGameOver = false;
  this.wasVictory = false;

  // start the chrono
  this.chrono = this.game.time.create(false);
  this.chrono.start();
  // start coin counter / score
  this.score = 0;

  // setup some listeners
  this.keys.up.onDown.add(function () {
    if (!this.isEditMode) { this.hero.jump(); }
  }, this);
};

PlayScene.toggleEditor = function () {
    this.isEditMode = !this.isEditMode;
    this.gui.visible = this.isEditMode;
    this.hud.visible = !this.isEditMode;
    this.camera.follow(this.isEditMode ? null : this.hero);
};

PlayScene.update = function () {
  if (this.isEditMode) {
    this.editor.update();
  }
  else {
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
  }

  this.game.physics.arcade.collide(this.enemies, this.level.layer());
  this.game.physics.arcade.collide(this.hero, this.level.layer());
  this.game.physics.arcade.overlap(this.hero, this.goal, function () {
    this.winLevel();
  }, null, this);
  this.game.physics.arcade.overlap(this.hero, this.traps, this.killHero, null,
    this);
  this.game.physics.arcade.overlap(this.hero, this.enemies, this.killHero, null,
    this);
  this.game.physics.arcade.overlap(this.hero, this.coins, this.pickup, null,
    this);

  if (!this.isGameOver) {
    this.updateChrono();
    this.updateScore();
  }
};

function padNumber(n, size) {
  var res = n + '';
  while (res.length < size) { res = '0' + res; }
  return res;
}

PlayScene.updateScore = function () {
  this.scoreText.setText(this.score);
};

PlayScene.updateChrono = function () {
  var elapsed = this.chrono.ms;
  var ms = elapsed % 1000;
  var seconds = Math.floor(elapsed / 1000) % 60;
  var minutes = Math.floor(Math.floor(elapsed / 1000) / 60);
  this.chronoText.setText(minutes + ':' + padNumber(seconds, 2) + ':' +
    padNumber(ms, 3));
};

PlayScene.winLevel = function () {
  // TODO: temp
  this.sfx.win.play();
  this.showGameOver(true);
};

PlayScene._isLastLevel = function () {
  return this.currentLevel >= LEVEL_COUNT;
};

PlayScene.showGameOver = function (wasVictory) {
  this.isGameOver = true;
  this.wasVictory = wasVictory;
  this.messageText.setText(this._isLastLevel() ? 'Victory' : 'Yay!');
  this.restartText.setText('-' +
    (this._isLastLevel() ? 'Play again' : 'Next level') + '-');
  this.gameOverHud.visible = true;

  this.hero.freeze();
};

PlayScene.pickup = function (hero, coin) {
  this.sfx.coin.play();
  coin.kill();
  this.score += 50;
};

PlayScene.killHero = function () {
  // TODO: temp
  this.sfx.die.play();
  this.wrathOfGod();
};

PlayScene.render = function () {
  // this.game.debug.body(this.hero);
  // this.game.debug.body(this.goal);
};

PlayScene.wrathOfGod = function () {
  this.soundtrack.stop();
  this.chrono.destroy();
  this.game.state.restart(true, false,
    this._isLastLevel() ? 1 : this.currentLevel + 1);
};

PlayScene._spawnSprites = function (data) {
  // create pickable objects
  this.coins = this.game.add.group();
  data.coins.forEach(function (data) {
    // TODO: create a custom sprite class for this
    var coin = this.coins.create(
      data.x * Level.TSIZE + Level.TSIZE / 2,
      data.y * Level.TSIZE + Level.TSIZE / 2,
      'coin');
    coin.anchor.setTo(0.5);
    coin.animations.add('rotate', [0, 1, 2, 3], 6, true);
    coin.play('rotate');
    this.game.physics.enable(coin);
    coin.body.allowGravity = false;
  }.bind(this));

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
      'lava');
    this.traps.add(lava);
  }.bind(this));

  // create enemies
  this.enemies = this.add.group();
  data.ghosts.forEach(function (data) {
    var enemy = new LandEnemy(this.game,
      data.x * Level.TSIZE + Level.TSIZE,
      data.y * Level.TSIZE + Level.TSIZE,
      this.level);
    this.enemies.add(enemy);
  }.bind(this));
};

PlayScene._setupEditor = function () {
  this.gui = this.add.group();
  this.editor = new Editor(this.gui, this.level);
  this.keys.escape.onDown.add(this.toggleEditor, this);
  this.isEditMode = false;
  this.gui.visible = false;
};

PlayScene._setupHud = function () {
  this.hud = this.add.group();
  this.hud.fixedToCamera = true;

  this.gameOverHud = this.make.group();
  this.hud.add(this.gameOverHud);
  this.gameOverHud.visible = false;

  var chronoStyle = {
    font: '40px "Amatic SC"',
    fill: '#fff'
  };
  this.chronoText = this.game.make.text(10, 0, '0:00:00', chronoStyle);
  this.hud.add(this.chronoText);
  this.scoreText = this.game.make.text(890, 0, '1000', chronoStyle);
  this.scoreText.anchor.setTo(1, 0);
  this.hud.add(this.scoreText);

  var messageStyle = {
    font: '80px "Amatic SC"',
    fill: '#fff'
  };
  this.messageText = this.game.make.text(450, 200, 'Victory!', messageStyle);
  this.messageText.anchor.setTo(0.5);
  this.gameOverHud.add(this.messageText);

  this.restartText = this.game.make.text(450, 300, '- Play again -',
    chronoStyle);
  this.restartText.anchor.setTo(0.5);
  this.restartText.inputEnabled = true;
  this.restartText.input.useHandCursor = true;
  this.restartText.events.onInputUp.add(function () {
    this.wrathOfGod();
  }, this);
  this.gameOverHud.add(this.restartText);
};


module.exports = PlayScene;
