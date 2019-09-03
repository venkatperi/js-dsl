'use "strict';

// eslint-disable-next-line import/no-extraneous-dependencies
const { JsDsl, AbstractFactory } = require( '..' );

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
  constructor() {
    super();
    this.registerFactory( 'tree', new TreeFactory() );
    this.registerFactory( 'tip', new TipFactory() );
  }
}

function toAsciiTree( tree, prefix = '', isTail = true ) {
  if ( !tree ) return null;

  const name = tree.name;
  const res = [];
  res.push( prefix );
  res.push( isTail ? '└─' : '├─' );
  res.push( name );
  res.push( '\n' );

  if ( tree.children ) {
    let i = 0;
    const childCount = tree.children.length;

    tree.children.forEach( ( c ) => {
      const p = prefix + (isTail ? '  ' : '│ ');
      // eslint-disable-next-line no-plusplus
      res.push( toAsciiTree( c, p, !(i++ < childCount - 1) ) );
    } );
  }
  return res.join( '' );
}

const forest = new TreeBuilder().build( () =>
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
  } ),
);

// eslint-disable-next-line no-console
console.log( toAsciiTree( forest ) );
