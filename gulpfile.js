(function() {
"use strict";

  const path       = require('path');
  const rename     = require('gulp-rename');
  const gulp       = require('gulp');
  const concat     = require('gulp-concat');
  const uglify     = require('gulp-uglify');
  const zip        = require('gulp-zip');
  const imagemin   = require('gulp-imagemin');
  const sourcemaps = require('gulp-sourcemaps');
  const sass       = require('gulp-sass');
  const cssmin     = require('gulp-cssmin');
  const del        = require('del');
  const prefix     = require('gulp-autoprefixer')

  sass.compiler = require('node-sass');

  const config = {
    masterFileName : 'apex-super-lov',
    sassOptions:{
      outputStyle: 'expanded'
    },
    prefixerOptions:{
      browsers: ['last 2 versions']
    },
    paths : {
      output:'dist',
      build:'build',
      scripts: 'src/js/**/*.js',
      images: 'src/img/**/*',
      sass: 'src/scss/**/*.scss',
      plsql: 'src/plsql/**/*.{sql,pks,pkb}'
    }
  };

  gulp.task('clean', function () {
    return del([config.paths.build]);
  });

  gulp.task('scripts', ['clean'], function () {
    return gulp.src(config.paths.scripts)
      .pipe(gulp.dest(path.join(config.paths.output, 'js')))
      .pipe(sourcemaps.init())
      .pipe(uglify())
      .pipe(rename({suffix:'.min'}))
      .pipe(sourcemaps.write('./maps'))
      .pipe(gulp.dest(path.join(config.paths.output, 'js')));
  });

  gulp.task('images', ['clean'], function () {
    return gulp.src(config.paths.images)
      .pipe(imagemin({optimizationLevel: 5}))
      .pipe(gulp.dest(path.join(config.paths.output, 'img')));
  });

  gulp.task('sass',function(){
    return gulp.src(config.paths.sass)
      .pipe(sourcemaps.init())
      .pipe(concat(config.masterFileName))
      .pipe(sass(config.sassOptions).on('error',sass.logError))
      .pipe(prefix(config.prefixerOptions))
      .pipe(gulp.dest(path.join(config.paths.output, 'css')))
      .pipe(cssmin())
      .pipe(rename({suffix:'.min'}))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(path.join(config.paths.output, 'css')))
  });

  gulp.task('plsql',function(){
    return gulp.src(config.paths.plsql)
      .pipe(gulp.dest(path.join(config.paths.output, 'plsql')))
  });

  // TODO -- figure out how to make zip run after everything is finished
  gulp.task('zip',function (){
     return gulp.src([ path.join(config.paths.output,'**/*'), '!' + path.join(config.paths.output,'plsql'),'!' + path.join(config.paths.output,'plsql/**/*')])
        .pipe(zip('upload.zip'))
        .pipe(gulp.dest('./'));
  });

  gulp.task('watch', function () {
    gulp.watch(config.paths.sass, ['sass']);
    gulp.watch(config.paths.scripts, ['scripts']);
    gulp.watch(config.paths.images, ['images']);
  });

  gulp.task('default', ['plsql','scripts', 'images', 'sass','watch']);
})();
