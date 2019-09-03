/* eslint-disable no-undef,class-methods-use-this,no-console */
const assert = require( 'assert' );

const TreeDsl = require( './fixtures/TreeDsl' );
const { toStringTree } = require( './fixtures/formatter' );


// noinspection DuplicatedCode
const forest = () =>
  tree( 'a', () => {
    tree( 'b', () => {
      tip( 'c' );
    } );
    tip( 'd' );
    tree( 'e', () => {
      tree( 'f', () => {
        tree( 'g', () => {
          tip( 'd' );
        } );
        tip( 'h' );
      } );
    } );
  } );

res = '(a (b (c ) ) (d ) (e (f (g (d ) ) (h ) ) ) )';

describe( 'tree', () => {
  it( 'has trees and tips', () =>
    assert.equal( toStringTree(
      new TreeDsl().build( forest ) ), res ),
  );
} );
