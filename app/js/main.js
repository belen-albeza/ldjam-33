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
    this.load.image('hero', 'images/hero.png');
    this.load.image('goal', 'images/pomegranate.png');
    this.load.image('fire', 'images/fire.png');
    this.load.image('tiles:physics', 'images/physics_tiles.png');
    this.load.image('cursor', 'images/cursor.png');
    this.load.image('btn:download', 'images/btn_download.png');

    // load audio
    var sfx = {
      'jump': 'jump.wav',
      'die': 'lose.wav',
      'win': 'win.wav'
    };
    Object.keys(sfx).forEach(function (key) {
      this.game.load.audio(key, 'audio/' + sfx[key]);
    }.bind(this));

    // load level data
    this.load.text('level:1', 'data/level1.json');
  },

  create: function () {
    this.game.state.start('play');
  }
};


window.onload = function () {
  var game = new Phaser.Game(900, 600, Phaser.AUTO, 'game');

  game.state.add('boot', BootScene);
  game.state.add('preloader', PreloaderScene);
  game.state.add('play', PlayScene);

  game.state.start('boot');
};
