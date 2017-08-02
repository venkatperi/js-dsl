/**
 * Base class for factory builders 
 */
class AbstractFactory {

  /**
   * A factory can return a builder to customize building of its 
   *   child nodes. 
   *
   * @returns {object} An optional builder for child nodes. 
   */
  getBuilder( parent ) {
    return null;
  }

  /**
   * returns true if no child closures should be processed
   * @returns {boolean} true if no child closures should be processed
   */
  isLeaf() {
    return false;
  }

  /**
   * Creates a new instance identified by type `name` and provided `args`.
   *
   * @param {builder} the builder. 
   * @param {name} the name of the node being built.
   * @param {args} the args to pass to the constructor.
   * @returns {object} the newly constructed object. 
   */
  newInstance( builder, name, args ) {
    throw new TypeError( "virtual function called" );
  }

  /**
   * Called by the builder to establish a parent-to-child relationship.
   *
   * @param {builder} the builder. 
   * @param {parent} the parent node 
   * @param {child} the child node 
   * @returns none 
   */
  setChild( builder, parent, child ) {}

  /**
   * Called by the builder to establish a child-to-parent relationship.
   *
   * @param {builder} the builder. 
   * @param {parent} the parent node 
   * @param {child} the child node 
   * @returns none 
   */
  setParent( builder, parent, child ) {}

  /**
   * Called by the builder to notify when a node is built. 
   *
   * @param {builder} the builder. 
   * @param {parent} the parent node 
   * @param {child} the child node 
   * @returns none 
   */
  onNodeCompleted( builder, parent, node ) {}
}

module.exports = AbstractFactory;
