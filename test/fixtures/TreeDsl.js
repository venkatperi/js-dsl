/* eslint-disable class-methods-use-this */
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


const { JsDsl, AbstractFactory } = require( '../../' );


const _ = require( 'lodash' );

class Tree {
  constructor( name, props = {} ) {
    _.extend( this, props );
    this.name = name;
    this.children = [];
  }

  addChild( child ) {
    this.children.push( child );
    // eslint-disable-next-line no-param-reassign
    child.parent = this;
  }

  someMethod() {
  }
}

class TreeFactory extends AbstractFactory {
  newInstance( builder, name, ...args ) {
    return new Tree( ...args );
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
    return new Tree( ...args );
  }
}

module.exports = class TreeBuilder extends JsDsl {
  register() {
    this.registerFactory( 'tree', new TreeFactory() );
    this.registerFactory( 'tip', new TipFactory() );
    this.registerPropertyNames( ['name', 'description'] );
    this.registerMethodNames( ['someMethod'] );
  }
};
