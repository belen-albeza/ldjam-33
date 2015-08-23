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
  var downloadButton = this.game.make.button(900, this.game.world.height,
    'btn:download', this.download, this);
  downloadButton.anchor.setTo(1, 1);
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
