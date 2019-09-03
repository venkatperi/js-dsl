/* eslint-disable no-undef,class-methods-use-this,no-console */
const assert = require( 'assert' );

const TreeDsl = require( './fixtures/TreeDsl' );
const { toStringTree } = require( './fixtures/formatter' );

const result = [];

const forest = () =>
  tree( 'a', { description: 'node a' }, () => {
    assert.equal( description, 'node a' );
    tree( 'bb', { description: 'node b' }, () => {
      assert.equal( name, 'bb' );
      name = 'b';
      tip( 'c' );
    } );
    tip( 'd' );
    tree( 'e', () => {
      assert.equal( name, 'e' );
      tree( 'f', () => {
        tree( 'g', result, () => {
          tip( 'd' );
          someMethod( 123 );
        } );
        tip( 'h' );
      } );
    } );
  } );

res = '(a (b (c ) ) (d ) (e (f (g (d ) ) (h ) ) ) )';

describe( 'tree', () => {
  it( 'has trees and tips', () => {
    assert.equal( toStringTree( new TreeDsl().build( forest ) ), res );
  } );
} );
