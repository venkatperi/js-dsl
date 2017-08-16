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

const _ = require( 'lodash' );
const { EventEmitter } = require( 'events' );
const debug = require( 'debug' )( 'js_dsl' );

/**
 * A groovy-builder like object-tree builder for developing
 * JavaScript DSLs.
 */
class JsDsl extends EventEmitter {
  constructor( parentBuilder ) {
    super();
    this._parentBuilder = parentBuilder;
    this.__contextStack = [];
    this._globalsStack = {};
    this._factories = {};
    this._propertyNames = [];
  }

  get _child() {
    return this._context._child;
  }

  get _context() {
    const len = this._contextStack.length;
    return len > 0 ? this._contextStack[len - 1] : null;
  }

  get _contextStack() {
    return this._parentBuilder ?
      this._parentBuilder._contextStack :
      this.__contextStack;
  }

  get _current() {
    return this._context._current;
  }

  get _parent() {
    return this._context._parent;
  }

  get propertyNames() {
    return this._propertyNames;
  }

  _createNode( name, ...args ) {
    debug( `createNode: ${name}` );

    const factory = this._resolveFactory( name, ...args );
    if ( !factory ) {
      throw new Error( `Don't know how to create ${name}` );
    }

    this._child.builder = this;
    const childBuilder = factory.getBuilder( this );
    if ( childBuilder ) {
      this._child.builder = childBuilder;
      this._child.usesCustomBuilder = true;
    }

    this._current.factory = factory;
    this._current.name = name;

    this._emit( 'preInstantiate', this, name, ...args );

    const node = factory.newInstance( this, name, ...args );
    if ( !node ) {
      debug( `factory returned null for ${name}` );
      return null;
    }

    this._emit( 'postInstantiate', this, name, node );
    return node;
  }

  _dispatchNodeCall( name, closure, ...args ) {
    let needToPop = false;

    if ( !this._context ) {
      this._pushContext();
      needToPop = true;
    }

    const node = this._createNode( name, ...args );

    const currentNode = this._current.node;
    if ( currentNode ) {
      this._setParent( currentNode, node );
    }

    if ( closure ) {
      const parentFactory = this._current.factory;
      const parentName = this._current.name;
      const parentContext = this._context;

      if ( parentFactory.isLeaf() ) {
        throw new TypeError( `"${name}" does not support nesting.` );
      }

      this._pushContext( {
        _current: _.extend( { node }, parentContext._child ),
        _parent: {
          factory: parentFactory,
          node: currentNode,
          _context: parentContext,
          name: parentName,
          builder: parentContext._current.builder,
        },
      } );

      try {
        if ( this._current.usesCustomBuilder ) {
          this._current.builder._registerGlobals();
        }
        this._emit( 'beforeConfigureNode', this, node );
        closure.call( this, node );
        this._emit( 'afterConfigureNode', this, node );
      } finally {
        if ( this._current.usesCustomBuilder ) {
          this._current.builder._unregisterGlobals();
        }
      }

      this._popContext();
    }

    this._nodeCompleted( currentNode, node );
    this._emit( 'nodeCompleted', this, currentNode, node );

    if ( needToPop ) {
      this._popContext();
    }
    return node;
  }

  _emit( name, ...args ) {
    this.emit( name, ...args );
    if ( this._parentBuilder ) {
      this._parentBuilder._emit( name, ...args );
    }
  }

  _nodeCompleted( parent, child ) {
    this._current.factory.onNodeCompleted( this._child.builder,
      parent, child );
  }

  _popContext() {
    this._contextStack.pop();
  }

  _pushContext( ctx ) {
    this._contextStack.push( _.extend( {}, { _current: {}, _child: {}, _parent: {} }, ctx ) );
  }

  _registerGlobals() {
    if ( this._globalsRegistered ) {
      return;
    }
    const that = this;

    _.forOwn( this._factories, ( f, n ) => {
      if ( global[n] ) {
        this._globalsStack[n] = this._globalsStack[n] || [];
        this._globalsStack[n].push( global[n] );
      }
      global[n] = ( ...args ) => {
        let closure = args[args.length - 1];
        if ( typeof closure === 'function' ) {
          args.pop();
        } else {
          closure = null;
        }
        return that._dispatchNodeCall( n, closure, ...args );
      };
    } );

    this._propertyNames.forEach( ( name ) => {
      if ( global[name] ) {
        that.emit( 'error', new Error( `${name} already exists on global` ) );
      }

      Object.defineProperty( global, name, {
        // so that we can remove this property down the line
        configurable: true,
        get: () => that._current.node[name],
        set: ( v ) => {
          that._current.node[name] = v;
        },
      } );
    } );

    this._globalsRegistered = true;
  }

  _resolveFactory( name ) {
    return this._factories[name];
  }

  _setParent( parent, child ) {
    this._current.factory.setParent( this._child.builder, parent, child );
    this._emit( 'setParent', this._child.builder, parent, child );
    const parentFactory = this._parent.factory;
    if ( parentFactory ) {
      parentFactory.setChild( this._current.builder, parent, child );
      this._emit( 'setChild', this._child.builder, parent, child );
    }
  }

  _unregisterGlobals() {
    if ( !this._globalsRegistered ) {
      return;
    }
    _.forOwn( this._factories, ( f, n ) => {
      if ( this._globalsStack[n] && this._globalsStack[n].length ) {
        global[n] = this._globalsStack[n].pop();
      } else {
        delete global[n];
      }
    } );
    this._propertyNames.forEach( ( name ) => {
      delete global[name];
    } );
    this._globalsRegistered = false;
  }

  /**
   *  Execute given closure to build nodes with this builder.
   *
   *  @param {Function} closure to execute
   *  @returns {object} the top level node built by the builder.
   */
  build( closure ) {
    try {
      this._registerGlobals();
      return closure.call( this );
    } finally {
      this._unregisterGlobals();
    }
  }

  /**
   *  `require` given file to build nodes with this builder.
   *
   *  @param {file} file to require
   *  @param args
   *  @returns {object} the top level node built by the builder.
   */
  buildFile( file, ...args ) {
    try {
      this._registerGlobals();
      let res = module.require( file );
      if ( typeof res === 'function' ) {
        res = res.call( this, ...args );
      }
      return res;
    } finally {
      this._unregisterGlobals();
    }
  }

  /**
   *  Register a factory for a node name
   *
   * @param name
   * @param factory
   */
  registerFactory( name, factory ) {
    this._factories[name] = factory;
    this.emit( 'registerFactory', this, name, factory );
  }

  registerPropertyNames( names = [] ) {
    this._propertyNames = this._propertyNames.concat( names );
  }
}

module.exports = JsDsl;
