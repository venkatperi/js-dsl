const gulp = require( 'gulp' );
var gulpDocumentation = require( 'gulp-documentation' );
require( 'gulp-release-it' )( gulp );

gulp.task( 'docs', function() {
  return gulp.src( './lib/**.js' )
    .pipe( gulpDocumentation( 'md' ) )
    .pipe( gulp.dest( 'doc/' ) );
} );
