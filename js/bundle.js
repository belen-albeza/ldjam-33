(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var PlayScene = require('./scenes/play_scene.js');


var BootScene = {
  preload: function () {
    // load here assets required for the loading screen
    this.game.load.image('preloader_bar', 'images/preloader_bar.png');
  },

  create: function () {
    this.game.state.start('preloader');
  }
};


var PreloaderScene = {
  preload: function () {
    this.loadingBar = this.game.add.sprite(0, 240, 'preloader_bar');
    this.loadingBar.anchor.setTo(0, 0.5);
    this.load.setPreloadSprite(this.loadingBar);

    // load images
    this.load.image('background', 'images/background.png');
    this.load.spritesheet('hero', 'images/hero.png', 48, 48);
    this.load.spritesheet('ghost', 'images/ghost.png', 32, 44);
    this.load.spritesheet('lava', 'images/lava.png', 48, 48);
    this.load.image('goal', 'images/pomegranate.png');
    this.load.spritesheet('coin', 'images/coin.png', 36, 36);
    this.load.image('tiles', 'images/tiles.png');
    this.load.image('cursor', 'images/cursor.png');
    this.load.image('btn:download', 'images/btn_download.png');
    this.load.image('prefabs', 'images/prefabs.png');

    // load audio
    var sfx = {
      'jump': 'jump.wav',
      'die': 'lose.wav',
      'win': 'win.wav',
      'coin': 'coin.wav',
      'background': 'background.ogg'
    };
    Object.keys(sfx).forEach(function (key) {
      this.game.load.audio(key, 'audio/' + sfx[key]);
    }.bind(this));

    // load level data
    this.load.text('level:1', 'data/level1.json');
    this.load.text('level:2', 'data/level2.json');
    this.load.text('level:3', 'data/level3.json');
    this.load.text('level:4', 'data/level4.json');
    this.load.text('level:5', 'data/level5.json');
  },

  create: function () {
    this.game.state.start('play', true, false, 1);
  }
};

function startGame() {
  var game = new Phaser.Game(900, 576, Phaser.AUTO, 'game');
  game.state.add('boot', BootScene);
  game.state.add('preloader', PreloaderScene);
  game.state.add('play', PlayScene);

  game.state.start('boot');
}


window.onload = function () {
  // for dev mode
  // document.querySelector('.overlay').style.display = 'none';
  // startGame();

  // for production
  document.getElementById('play').addEventListener('click', function (evt) {
    evt.preventDefault();
    // hide overlay
    document.querySelector('.overlay').style.display = 'none';
    startGame();
  });
};

},{"./scenes/play_scene.js":2}],2:[function(require,module,exports){
'use strict';

var Level = require('../world/level.js');
var Editor = require('../world/editor.js');
var Hades = require('../sprites/hades.js');
var Pomegranate = require('../sprites/pomegranate.js');
var Trap = require('../sprites/trap.js');
var LandEnemy = require('../sprites/land_enemy.js');

var PlayScene = {};

var GRAVITY = 950;
var LEVEL_COUNT = 5;

PlayScene.init = function (levelIndex) {
  this.game.physics.startSystem(Phaser.Physics.ARCADE);
  this.game.physics.arcade.gravity.y = GRAVITY;

  this.keys = this.game.input.keyboard.createCursorKeys();
  this.keys.escape = this.game.input.keyboard.addKey(Phaser.Keyboard.ESC);
  this.game.input.keyboard.removeKeyCapture(Phaser.Keyboard.ESC);

  this.currentLevel = levelIndex;
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
  this.soundtrack.fadeIn(1200, true);

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

  // listen for any key presses to advance too
  if (!this._isLastLevel()) {
    this.game.input.keyboard.onDownCallback = function () {
      this.wrathOfGod();
    }.bind(this);
  }
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
  this.game.input.keyboard.onDownCallback = null;
  this.soundtrack.stop();
  this.chrono.destroy();

  var nextLevel = this.currentLevel;
  if (this.wasVictory) {
    nextLevel = this._isLastLevel() ? 1 : this.currentLevel + 1;
  }

  this.game.state.restart(true, false, nextLevel);
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
  // dev only - level editor
  // this.keys.escape.onDown.add(this.toggleEditor, this);
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

},{"../sprites/hades.js":3,"../sprites/land_enemy.js":4,"../sprites/pomegranate.js":5,"../sprites/trap.js":6,"../world/editor.js":7,"../world/level.js":8}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
'use strict';

function Pomegranate(game, x, y) {
  Phaser.Sprite.call(this, game, x, y, 'goal');

  this.anchor.setTo(0.5);
  this.game.physics.enable(this);
  this.body.allowGravity = false;
  this.body.setSize(20, 20);
}

Pomegranate.prototype = Object.create(Phaser.Sprite.prototype);
Pomegranate.prototype.constructor = Pomegranate;

module.exports = Pomegranate;

},{}],6:[function(require,module,exports){
'use strict';

function Trap(game, x, y, key) {
  // call parent constructor
  Phaser.Sprite.call(this, game, x, y, key);

  this.anchor.setTo(0.5);
  this.animations.add('burn', [0, 1], this.game.rnd.between(1, 4), true);
  this.animations.play('burn');

  this.game.physics.enable(this);
  this.body.allowGravity = false;
}

Trap.prototype = Object.create(Phaser.Sprite.prototype);
Trap.prototype.constructor = Trap;

module.exports = Trap;

},{}],7:[function(require,module,exports){
'use strict';

var Level = require('./level.js');

var CAMERA_SPEED = 8;

var PREFABS = ['hero', 'goal', 'ghosts', 'lava', 'coin'];

function Editor(group, level) {
  this.group = group;
  this.level = level;
  this.game = group.game;
  this.currentTile = 0;
  this.currentPrefab = -1;

  this._setupHud();
  this._setupKeys();

  this.cursor = this.group.create(0, 0, 'cursor');
  this.cursorText = this.game.make.text(0, 100, '0x0', {
    font: '16px monospace',
    fill: '#fff'
  });
  this.cursorText.anchor.setTo(0.5);
  this.group.add(this.cursorText);
  this.selectTile(0);

  this.prefabs = this.game.make.group();
  this.group.add(this.prefabs);
}

Editor.prototype._setupHud = function () {
  this.hud = this.game.add.group();
  this.hud.visible = false;
  this.hud.fixedToCamera = true;
  this.group.add(this.hud);

  // create palette
  this.palette = this.hud.create(0, 0, 'tiles');
  this.paletteFrame = this.hud.create(0, 0, 'cursor');
  this.palette.addChild(this.paletteFrame);
  this.palette.inputEnabled = true;
  this.palette.events.onInputUp.add(function (sprite, pointer) {
    var i = this.game.math.snapToFloor(pointer.x, Level.TSIZE) / Level.TSIZE;
    this.selectTile(i);
    this.toggleHud();
  }, this);

  // create sprite pallete
  this.prefabPalette = this.hud.create(0, 576, 'prefabs');
  this.prefabPalette.anchor.setTo(0, 1);
  this.prefabsFrame = this.hud.create(0, 0, 'cursor');
  this.prefabsFrame.anchor.setTo(0, 1);
  this.prefabPalette.addChild(this.prefabsFrame);
  this.prefabPalette.inputEnabled = true;
  this.prefabPalette.events.onInputUp.add(function (sprite, pointer) {
    var i = this.game.math.snapToFloor(pointer.x, Level.TSIZE) / Level.TSIZE;
    this.selectPrefab(i);
    this.toggleHud();
  }, this);
  // TODO: disable for now, there's no time for it :(
  this.prefabPalette.visible = false;

  // create download button
  var downloadButton = this.game.make.button(0, 576,
    'btn:download', this.download, this);
  downloadButton.anchor.setTo(0, 1);
  this.hud.add(downloadButton);
};

Editor.prototype._setupKeys = function () {
  // cursor keys
  this.keys = this.game.input.keyboard.createCursorKeys();

  // spacebar
  this.keys.spacebar =
    this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
  this.game.input.keyboard.removeKeyCapture(Phaser.Keyboard.SPACEBAR);
  this.keys.spacebar.onDown.add(this.toggleHud, this);

  // shift
  this.keys.shift = this.game.input.keyboard.addKey(Phaser.Keyboard.SHIFT);
  this.game.input.keyboard.removeKeyCapture(Phaser.Keyboard.SHIFT);
};

Editor.prototype.isHudActive = function () {
  return this.hud.visible;
};

Editor.prototype.toggleHud = function () {
  this.hud.visible = !this.hud.visible;
  this.cursor.visible = !this.isHudActive();
  this.cursorText.visible = !this.isHudActive();
};

Editor.prototype.selectTile = function (index) {
  this.currentTile = index;
  this.currentPrefab = -1;
  this.paletteFrame.position.x = index * Level.TSIZE;
};

Editor.prototype.selectPrefab = function (index) {
  this.currentTile = -1;
  this.currentPrefab = index;
  this.prefabsFrame.position.x = index * Level.TSIZE;
};

Editor.prototype.update = function () {
  var tileX = this.level.layer().getTileX(
    this.game.input.activePointer.worldX);
  var tileY = this.level.layer().getTileY(
    this.game.input.activePointer.worldY);

  this.cursor.position.setTo(tileX * Level.TSIZE, tileY * Level.TSIZE);
  this.cursorText.position.setTo(
    this.cursor.position.x + Level.TSIZE / 2,
    this.cursor.position.y + Level.TSIZE / 2);
  this.cursorText.setText(tileX + 'x' + tileY);

  if (!this.isHudActive() && this.game.input.activePointer.isDown) {
    if (this.keys.shift.isDown) {
      this.level.map.removeTile(tileX, tileY, this.level.layer());
    }
    else {
      this.level.map.putTile(this.currentTile, tileX, tileY,
        this.level.layer());
    }
  }

  this.paletteFrame.visible = this.currentTile >= 0;
  this.prefabsFrame.visible = this.currentPrefab >= 0;

  if (this.keys.left.isDown) { this.game.camera.x -= CAMERA_SPEED; }
  if (this.keys.right.isDown) { this.game.camera.x += CAMERA_SPEED; }
  if (this.keys.up.isDown) { this.game.camera.y -= CAMERA_SPEED; }
  if (this.keys.down.isDown) { this.game.camera.y += CAMERA_SPEED; }
};

Editor.prototype.download = function () {
  var data = JSON.stringify(this.level.export(), null, 2);

  // create a temp <a> tag to download the file
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' +
    encodeURIComponent(data));
  element.setAttribute('download', 'level.json');
  // simulate a click on the link and remove the <a>
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

module.exports = Editor;

},{"./level.js":8}],8:[function(require,module,exports){
'use strict';

var TSIZE = 48;

function fillLayerWithTileData(layer, data) {
  data.forEach(function (row, rowIndex) {
    row.forEach(function (tile, colIndex) {
       layer.map.putTile(tile, colIndex, rowIndex, layer);
    });
  });
}

function Level(game, data) {
  this.data = data;
  this.map = game.add.tilemap();
  this.map.addTilesetImage('physics', 'tiles', TSIZE, TSIZE);

  this.currentLayerIndex = 0;
  this.layers = data.layers.map(function (layerData) {
      var l = this.map.create('', data.meta.width,
        data.meta.height, TSIZE, TSIZE);
      fillLayerWithTileData(l, layerData.data);
      return l;
  }.bind(this));

  this.layer().resizeWorld();
  this.commit();
}

Level.prototype.layer = function () {
  return this.layers[this.currentLayerIndex];
};

Level.prototype.export = function () {
  this.data.layers = this.map.layers.map(function (layer) {
    return {
      data: layer.data.map(function (row) {
        return row.map(function (tile) { return tile.index; });
      })
    };
  });

  return this.data;
};

Level.prototype.commit = function () {
  this.layers.forEach(function (layer) {
    this.map.setCollisionByExclusion([], true, layer);
  }.bind(this));
};

Level.TSIZE = TSIZE;

module.exports = Level;

},{}]},{},[1]);
