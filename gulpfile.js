const gulp = require( 'gulp' );
var gulpDocumentation = require( 'gulp-documentation' );
require( 'gulp-release-it' )( gulp );
const mocha = require( 'gulp-mocha' );
const jshint = require( 'gulp-jshint' )
const istanbul = require( 'gulp-istanbul' )

const srcDirs = {
  js: [ 'index.js', "lib/**/*.js" ],
  test: "test/*.{js,coffee}",
  doc: "doc"
}

gulp.task( 'docs', function () {
  return gulp.src( srcDirs.js )
    .pipe( gulpDocumentation( 'md' ) )
    .pipe( gulp.dest( 'doc/' ) );
} );

gulp.task( 'lint', function () {
  return gulp.src( srcDirs.js )
    .pipe( jshint( { esversion: 6 } ) )
    .pipe( jshint.reporter( 'default' ) )
    .pipe( jshint.reporter( 'fail' ) );
} );

gulp.task( 'test', [ 'coverage' ], () =>
  gulp.src( srcDirs.test, { read: false } )
  .pipe( mocha() )
  .pipe( istanbul.writeReports() )
);

gulp.task( 'coverage', () =>
  gulp.src( srcDirs.js )
  .pipe( istanbul(  ) )
  .pipe( istanbul.hookRequire() )
);
