// IMPORTANT
// edit gulp.config.json and customize there your deployment settings

'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');

var browserify = require('browserify');
var watchify = require('watchify');
var source = require('vinyl-source-stream');

var livereload = require('gulp-livereload');
var connect = require('gulp-connect');
var rsync = require('gulp-rsync');

//
// browserify and js
//

var bundler = browserify([
  './app/js/main.js'
]);

var bundle = function ()  {
  return bundler
    .bundle()
    .on('error', gutil.log)
    .pipe(source('bundle.js'))
    .pipe(gulp.dest('.tmp/js/'))
    .pipe(livereload());
};


gulp.task('browserify', bundle);

// 3rd party libs that don't play nice with browserify
gulp.task('libs', function () {
  var dir = './node_modules/phaser/build/';
  gulp.src(['phaser.min.js', 'phaser.map'], { cwd: dir, base: dir})
    .pipe(gulp.dest('./.tmp/js/lib/'));
});

gulp.task('js', ['browserify', 'libs']);


//
// web server
//

gulp.task('connect', function () {
  connect.server({
    root: ['app', '.tmp']
  });
});


//
// build and deploy
//

gulp.task('build', ['js']);

gulp.task('copy', function () {
  gulp.src([
    'index.html', 'raw.html',
    'styles.css', 'reset.css', 'raw.css',
    'images/**/*', 'fonts/**/*', 'audio/**/*', 'data/**/*'
  ], { cwd: './app', base: './app' })
  .pipe(gulp.dest('./dist/'));

  gulp.src(['js/**/*'], { cwd: '.tmp', base: '.tmp' })
    .pipe(gulp.dest('./dist/'));
});

gulp.task('dist', ['build', 'copy']);

//
// dev tasks
//

gulp.task('watch', ['connect'], function () {
  livereload.listen();

  bundler = watchify(bundler, watchify.args);
  bundler.on('update', bundle);
});

gulp.task('run', ['build', 'watch']);

//
// default task
//

gulp.task('default', ['build', 'connect']);
