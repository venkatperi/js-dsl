'use "strict'

const { FactoryBuilderSupport, AbstractFactory } = require( '../index' );

class NodeFactory extends AbstractFactory {
  newInstance( builder, name, args ) {
    console.log( name, args );
    return { name: name, args: args, children: [] };
  }

  setParent( builder, parent, child ) {
    //console.log( `setParent: ${parent}, ${child}` );
    child.parent = parent;
  }

  setChild( builder, parent, child ) {
    //console.log( `setChild: ${parent}, ${child}` );
    parent.children.push( child );
  }
}

class LeafFactory extends AbstractFactory {
  isLeaf() {
    return true;
  }

  newInstance( builder, name, args ) {
    return { name: name, args: args };
  }
}

class TreeBuilder extends FactoryBuilderSupport {
  constructor() {
    super();
    this.registerFactory( 'node', new NodeFactory() );
    this.registerFactory( 'leaf', new LeafFactory() );
  }
}

function walk( node, visitor ) {
  visitor( node );
  if ( node.children )
    node.children.forEach( ( c ) => walk( c, visitor ) );
}

let tree = new TreeBuilder();

let x = tree.build( () =>
  node( 'a', () => {
    node( 'b', () => {
			leaf('c');
		} )
  } )
);

walk( x, (n) => console.log(`${n.name}, ${n.args}`) );
