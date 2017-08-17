/* eslint-disable no-undef,class-methods-use-this,no-console */
const assert = require( 'assert' );

const { JsDsl, AbstractFactory } = require( '../index' );
const { toStringTree } = require( './fixtures/formatter' );

class Tree {
  constructor( name ) {
    this.name = name;
    this.children = [];
  }

  addChild( child ) {
    this.children.push( child );
    // eslint-disable-next-line no-param-reassign
    child.parent = this;
  }

  someMethod() {
    console.log( 'some method' )
  }
}

class Tip {
  constructor( name ) {
    this.name = name;
  }
}

class TreeFactory extends AbstractFactory {
  newInstance( builder, name, args ) {
    return new Tree( args );
  }

  setChild( builder, parent, child ) {
    parent.addChild( child );
  }
}

class TipFactory extends AbstractFactory {
  isLeaf() {
    return true;
  }

  newInstance( builder, name, args ) {
    return new Tip( args );
  }
}

class TreeBuilder extends JsDsl {
  register() {
    this.registerFactory( 'tree', new TreeFactory() );
    this.registerFactory( 'tip', new TipFactory() );
    this.registerPropertyNames( ['name', 'description'] );
    this.registerMethodNames( ['someMethod'] );
  }
}

const forest = () =>
  tree( 'a', () => {
    description = 'node a'
    tree( 'bb', () => {
      assert.equal( name, 'bb' );
      description = 'node b'
      name = 'b'
      tip( 'c' );
    } );
    tip( 'd' );
    tree( 'e', () => {
      assert.equal( name, 'e' );
      tree( 'f', () => {
        tree( 'g', () => {
          tip( 'd' );
          someMethod();
        } );
        tip( 'h' );
      } );
    } );
  } );

res = '(a (b (c ) ) (d ) (e (f (g (d ) ) (h ) ) ) )';

describe( 'tree', () => {
  it( 'has trees and tips', () =>
    assert.equal( toStringTree( new TreeBuilder()
      .build( forest ) ), res ),
  );
} );
