/* eslint-disable no-undef,class-methods-use-this,no-console */
const assert = require( 'assert' );

const TreeDsl = require( './fixtures/TreeDsl' );
const { toStringTree } = require( './fixtures/formatter' );

const $ = {};

const forest = () =>
  $.tree( 'a',
    () => $.tip( 'b' ) );

const res = '(a (b ) )';

describe( 'rootObj', () => {
  it( 'just, works!', () => {
    assert.equal( toStringTree( new TreeDsl( null, $ ).build( forest ) ), res );
  } );
} );
