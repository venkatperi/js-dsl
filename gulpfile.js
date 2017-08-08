// Copyright 2017, Venkat Peri.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

const gulp = require( 'gulp' );
const gulpDocumentation = require( 'gulp-documentation' );
require( 'gulp-release-it' )( gulp );
const mocha = require( 'gulp-mocha' );
const jshint = require( 'gulp-jshint' );
const istanbul = require( 'gulp-istanbul' );

const srcDirs = {
  js: ['index.js', 'lib/**/*.js'],
  test: 'test/*.{js,coffee}',
  doc: 'doc',
};

gulp.task( 'docs', () => gulp.src( srcDirs.js )
  .pipe( gulpDocumentation( 'md' ) )
  .pipe( gulp.dest( 'doc/' ) ) );

gulp.task( 'lint', () => gulp.src( srcDirs.js )
  .pipe( jshint( { esversion: 6 } ) )
  .pipe( jshint.reporter( 'default' ) )
  .pipe( jshint.reporter( 'fail' ) ) );

gulp.task( 'test', ['coverage'], () =>
  gulp.src( srcDirs.test, { read: false } )
    .pipe( mocha() )
    .pipe( istanbul.writeReports() ),
);

gulp.task( 'coverage', () =>
  gulp.src( srcDirs.js )
    .pipe( istanbul() )
    .pipe( istanbul.hookRequire() ),
);
