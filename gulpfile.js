var gulp = require('gulp');

// Plugins.
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var ngAnnotate = require('gulp-ng-annotate');
var rename = require('gulp-rename');
var yaml = require('js-yaml');
var fs = require('fs');
var header = require('gulp-header');

var adminBuildDir = 'Resources/public/assets/build';

// Get information for top of minified files.
var pkg = require('./version.json');
var banner = [
  '/**',
  ' * @name <%= pkg.name %>',
  ' * @version v<%= pkg.version %>',
  ' * @link <%= pkg.link %>',
  ' */',
  ''
].join('\n');

/**
 * Process SCSS using libsass
 */
gulp.task('sass', function (done) {
  'use strict';

  var adminBuildDir = 'Resources/public/assets/build';
  var sassPath = 'sass/*.scss';

  gulp.src(sassPath)
  .pipe(sass({
    outputStyle: 'compressed'
  }).on('error', sass.logError))
  .pipe(rename({extname: ".min.css"}))
  .pipe(gulp.dest(adminBuildDir));

  done();
});

// We only want to process our own non-processed JavaScript files.
var adminJsPath = (function () {
  var configFiles = [
      'Resources/config/angular.yml'
    ],
    jsFiles = [],

    // Breadth-first descend into data to find "files".
    buildFiles = function (data) {
      if (typeof(data) === 'object') {
        for (var p in data) {
          if (data.hasOwnProperty(p)) {
            if (p === 'files') {
              jsFiles = jsFiles.concat(data[p]);
            }
            else {
              buildFiles(data[p]);
            }
          }
        }
      }
    };

  configFiles.forEach(function (path) {
    var data = yaml.safeLoad(fs.readFileSync(path, 'utf8'));
    buildFiles(data);
  });

  return jsFiles.map(function (file) {
    return 'Resources/public/' + file.split('bundles/os2displayexchange/')[1];
  });
}());

/**
 * Run Javascript through JSHint.
 */
gulp.task('jshint', function () {
  return gulp.src(adminJsPath)
  .pipe(jshint())
  .pipe(jshint.reporter(stylish));
});

/**
 * Build single app.js file.
 *
 * Build all custom js files into one minified js file.
 */
gulp.task('js', function () {
    return gulp.src(adminJsPath)
    .pipe(concat('os2displayexchange.js'))
    .pipe(ngAnnotate())
    .pipe(uglify())
    .pipe(rename({extname: ".min.js"}))
    .pipe(header(banner, {pkg: pkg}))
    .pipe(gulp.dest(adminBuildDir));
  }
);

/**
 * Build single app.js file.
 *
 * Report all source files for "js" task.
 */
gulp.task('js-src', function () {
  adminJsPath.forEach(function (path) {
    process.stdout.write(path + '\n');
  });
});
