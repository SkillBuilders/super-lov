(function() {
"use strict";

  const path = require('path');
  const rename = require('gulp-rename');
  const gulp = require('gulp');
  const concat = require('gulp-concat');
  const uglify = require('gulp-uglify');
  const zip = require('gulp-zip');
  const imagemin = require('gulp-imagemin');
  const sourcemaps = require('gulp-sourcemaps');
  const less = require('gulp-less');
  const cssmin = require('gulp-cssmin');
  const del = require('del');

  const config = {
    masterFileName : 'apex-super-lov',
    paths : {
      outputdir:'dist',
      builddir:'build',
      scripts: 'src/js/**/*.js',
      images: 'src/img/**/*',
      less: 'src/less/**/*.less',
      plsql: 'src/plsql/**/*.{sql,pks,pkb}'
    }
  };

  gulp.task('clean', function () {
    return del([config.paths.builddir]);
  });

  gulp.task('scripts', ['clean'], function () {
    return gulp.src(config.paths.scripts)
      .pipe(gulp.dest(path.join(config.paths.outputdir, 'js')))
      .pipe(sourcemaps.init())
      .pipe(uglify())
      .pipe(rename({suffix:'.min'}))
      .pipe(sourcemaps.write('./maps'))
      .pipe(gulp.dest(path.join(config.paths.outputdir, 'js')));
  });

  gulp.task('images', ['clean'], function () {
    return gulp.src(config.paths.images)
      .pipe(imagemin({optimizationLevel: 5}))
      .pipe(gulp.dest(path.join(config.paths.outputdir, 'img')));
  });

  gulp.task('less',function(){
    return gulp.src(config.paths.less)
      .pipe(sourcemaps.init())
      .pipe(concat(config.masterFileName))
      .pipe(less({
        paths:[path.join(__dirname, 'less','includes')]
      }))
      .pipe(gulp.dest(path.join(config.paths.outputdir, 'css')))
      .pipe(cssmin())
      .pipe(rename({suffix:'.min'}))      
      .pipe(sourcemaps.write('./maps'))
      .pipe(gulp.dest(path.join(config.paths.outputdir, 'css')))
  });

  gulp.task('plsql',function(){
    return gulp.src(config.paths.plsql)
      .pipe(gulp.dest(path.join(config.paths.outputdir, 'plsql')))
  });

  // TODO -- figure out how to make zip run after everything is finished
  gulp.task('zip',function (){
     return gulp.src([ path.join(config.paths.outputdir,'**/*'), '!' + path.join(config.paths.outputdir,'plsql')])
        .pipe(zip('upload.zip'))
        .pipe(gulp.dest('./'));
  });

  gulp.task('watch', function () {
    gulp.watch(config.paths.less, ['less']);
    gulp.watch(config.paths.scripts, ['scripts']);
    gulp.watch(config.paths.images, ['images']);
  });

  gulp.task('default', ['plsql','watch','scripts', 'images', 'less', 'zip']);
})();