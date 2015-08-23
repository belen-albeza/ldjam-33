'use strict';

var TSIZE = 50;

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
  this.map.addTilesetImage('physics', 'tiles:physics', TSIZE, TSIZE);

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
    this.map.setCollisionByExclusion([1], true, layer);
  }.bind(this));
};

Level.TSIZE = TSIZE;

module.exports = Level;
