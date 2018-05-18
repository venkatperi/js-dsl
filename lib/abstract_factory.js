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

/* eslint-disable class-methods-use-this,no-unused-vars */

/**
 * Base class for factory builders
 */
class AbstractFactory {
  // noinspection JSMethodCanBeStatic
  /**
   * A factory can return a builder to customize building of its
   *   child nodes.
   *
   * @param parent {Object} Optional parent builder
   * @returns {Object} An optional builder for child nodes.
   */
  // eslint-disable-next-line no-unused-vars
  getBuilder( parent ) {
    return null;
  }

  // noinspection JSMethodCanBeStatic
  /**
   * @returns {boolean} true if no child closures should be processed
   */
  isLeaf() {
    return false;
  }

  // noinspection JSMethodCanBeStatic
  /**
   * Creates a new instance identified by type `name` and provided `args`.
   *
   * @param builder {Object} the builder.
   * @param name {String} name of the node being built.
   * @param args {Object} args to pass to the constructor.
   * @returns {object} the newly constructed object.
   */
  newInstance( builder, name, args ) {
    throw new TypeError( 'virtual function called' );
  }

  /**
   * Called by the builder to notify when a node is built.
   *
   * @param {Object} builder.
   * @param {Object} parent node
   * @param {Object} node the child node
   * @returns none
   */
  onNodeCompleted( builder, parent, node ) {
  }

  /**
   * Called by the builder to establish a parent-to-child relationship.
   *
   * @param builder {Object} builder.
   * @param parent {Object} parent node
   * @param child {Object} child the child node
   */
  setChild( builder, parent, child ) {
  }

  /**
   * Called by the builder to establish a child-to-parent relationship.
   *
   * @param builder {Object} builder.
   * @param parent {Object} parent node
   * @param child {Object} child the child node
   * @returns none
   */
  setParent( builder, parent, child ) {
  }
}

module.exports = AbstractFactory;
