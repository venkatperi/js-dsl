/* eslint-disable class-methods-use-this,no-use-before-define,no-plusplus */
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

const { JsDsl, AbstractFactory } = require( '../..' );
const _ = require( 'lodash' );

class Element {
  constructor( opts, attributes, value ) {
    this.tag = opts.tag;
    this.noClosingTag = opts.noClosingTag || false;

    if ( typeof attributes === 'string' ) {
      // eslint-disable-next-line no-param-reassign
      [attributes, value] = [value, attributes];
    }

    this.attributes = attributes || {};
    this.value = value;
    this.children = [];
  }

  addChild( child ) {
    this.children.push( child );
    // eslint-disable-next-line no-param-reassign
    child.parent = this;
  }

  toHtml() {
    const res = [];
    if ( this.tag === 'html' ) {
      res.push( '<!DOCTYPE html>' );
    }
    res.push( `<${this.tag}` );
    _.forOwn( this.attributes, ( v, k ) => {
      res.push( `${k}="${v}"` );
    } );
    res.push( '>' );

    if ( this.value ) {
      res.push( this.value );
    } else {
      this.children.forEach( ( c ) => {
        res.push( c.toHtml() );
      } );
    }

    if ( !this.noClosingTag ) {
      res.push( `</${this.tag}>` );
    }

    return res.join( ' ' );
  }
}

class ElementFactory extends AbstractFactory {
  constructor( opts = {} ) {
    super();
    this.opts = opts;
  }

  newInstance( builder, name, ...args ) {
    const opts = Object.assign( { tag: name }, this.opts );
    return new Element( opts, ...args );
  }

  setChild( builder, parent, child ) {
    parent.addChild( child );
  }
}

class HtmlFactory extends ElementFactory {
  getBuilder( parent ) {
    return new HtmlBuilder( parent );
  }
}

class HeadFactory extends ElementFactory {
  getBuilder( parent ) {
    return new HeadBuilder( parent );
  }
}

class BlockFactory extends ElementFactory {
  getBuilder( parent ) {
    return new BlockBuilder( parent );
  }
}

class HtmlBuilder extends JsDsl {
  register() {
    this.registerFactory( 'head', new HeadFactory() );
    this.registerFactory( 'body', new BlockFactory() );
  }
}

class HeadBuilder extends JsDsl {
  register() {
    this.registerFactory( 'title', new ElementFactory() );
    this.registerFactory( 'link', new ElementFactory( { noClosingTag: true } ) );
    this.registerFactory( 'meta', new ElementFactory( { noClosingTag: true } ) );
    this.registerFactory( 'style', new ElementFactory() );
  }
}

class BlockBuilder extends JsDsl {
  register() {
    this.registerFactory( 'p', new ElementFactory() );
    for ( let i = 0; i < 6; i++ ) {
      this.registerFactory( `h${i + 1}`, new ElementFactory() );
    }
    this.registerFactory( 'div', new BlockFactory() );
    this.registerFactory( 'span', new BlockFactory() );
  }
}

class RootBuilder extends JsDsl {
  register() {
    this.registerFactory( 'html', new HtmlFactory() );
  }
}

module.exports = RootBuilder;
