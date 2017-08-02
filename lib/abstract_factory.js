class AbstractFactory {

  getBuilder( parent ) {
    return null;
  }

  isLeaf() {
    return false;
  }

  newInstance( builder, name, args ) {
    throw new TypeError( "virtual function called" );
  }

  setChild( builder, parent, child ) {}

  setParent( builder, parent, child ) {}

  onNodeCompleted( builder, parent, node ) {}
}

module.exports = AbstractFactory
