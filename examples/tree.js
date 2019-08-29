'use "strict'

const { JsDsl, AbstractFactory } = require( 'lib/index' );

class Tree {
  constructor( name ) {
    this.name = name;
    this.children = []
  }

  addChild( child ) {
    this.children.push( child );
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

function walk( node, visitor ) {
  visitor( node );
  if ( node.children )
    node.children.forEach( ( c ) => walk( c, visitor ) );
}

function toAsciiTree( tree, prefix = "", isTail = true ) {
  if ( !tree ) return null;

  let name = tree.name;
  let res = [];
  res.push( prefix );
  res.push( isTail ? "└─" : "├─" );
  res.push( name );
  res.push( "\n" );

  if ( tree.children ) {
    let i = 0;
    let childCount = tree.children.length;

    tree.children.forEach( ( c ) => {
      let p = prefix + ( isTail ? "  " : "│ " );
      res.push( toAsciiTree( c, p,
        i++ < childCount - 1 ? false : true ) );
    } );
  }
  return res.join( '' );
}

let forest = new TreeBuilder().build( () =>
  tree( 'a', () => {
    tree( 'b', () => {
      tip( 'c' )
    } )
    tip( 'd' )
    tree( 'e', () => {
      tree( 'f', () => {
        tree( 'g', () => {
          tip( 'd' )
        } )
        tip( 'h' )
      } )
    } )
  } )
)

console.log( toAsciiTree( forest ) );
