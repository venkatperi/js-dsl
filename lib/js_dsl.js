/* eslint-disable class-methods-use-this,template-curly-spacing */
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
const { extractArgOfType } = require( './util' );


/**
 * A groovy-builder like object-tree builder for developing
 * JavaScript DSLs.
 */
class JsDsl extends EventEmitter {
  constructor( name, parentBuilder, rootObj ) {
    super();
    if ( typeof name !== 'string' || arguments.length < 3 ) {
      // eslint-disable-next-line no-param-reassign
      [name, parentBuilder, rootObj] = [null, name, parentBuilder];
    }

    this._name = name;
    this._parentBuilder = parentBuilder;
    this.__contextStack = [];
    this._globalsStack = {};
    this._factories = {};
    this._propertyNames = [];
    this._methodNames = [];
    this.__rootObj = rootObj || global || window;
    this.register();
    this._emit( 'register', this );
  }

  get _child() {
    return this._context._child;
  }

  get _context() {
    const len = this._contextStack.length;
    return len > 0 ? this._contextStack[len - 1] : null;
  }

  get _contextStack() {
    return this._parentBuilder ? this._parentBuilder._contextStack : this.__contextStack;
  }

  get _rootObj() {
    return this._parentBuilder ? this._parentBuilder._rootObj : this.__rootObj;
  }

  get _current() {
    return this._context._current;
  }

  get _parent() {
    return this._context._parent;
  }

  /**
   * Returns the builder's name
   *
   * @returns {String}
   */
  get name() {
    return this._name;
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * Returns the builder's property names
   *
   * @returns {Array}
   */
  get propertyNames() {
    return this._propertyNames;
  }

  /**
   * Creates a node with the supplied arguments.
   * @param name {String} the name of the node
   * @param args {*[]} optional arguments passed to the node's constructor
   * @returns {Object} the newly constructed node.
   * @private
   */
  _createNode( name, ...args ) {
    debug( `createNode: ${ name }` );

    const factory = this._resolveFactory( name );
    if ( !factory ) {
      throw new Error( `Don't know how to create ${ name }` );
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
      debug( `factory returned null for ${ name }` );
      return null;
    }

    this._emit( 'postInstantiate', this, name, node );
    return node;
  }

  /**
   * Creates a new node with the given {name} and applies
   * the given configuration closure on it.
   *
   * @param name {String} the name of the node
   * @param closure {Function} optional - configures the newly created node.
   * @param args {*[]} Arguments supplied to the node constructor.
   * @returns {Object} The newly created node
   * @private
   */
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
        throw new TypeError( `"${ name }" does not support nesting.` );
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

  /**
   * Emitter helper. Bubbles events up the builder tree.
   * @param name {String} the event name
   * @param args {...*} optional event arguments
   * @private
   */
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
    this._contextStack.push( _.extend( {}, {
      _current: {},
      _child: {},
      _parent: {},
    }, ctx ) );
  }

  /**
   * Registers a factory with the given name. Pushes an
   * existing factory on the global stack if, if one
   * is already registered for the given name.
   *
   * @param name {String} the name of the node created by this factory
   * @private
   */
  _registerFactory( name ) {
    const that = this;
    if ( this._rootObj[name] ) {
      this._globalsStack[name] = this._globalsStack[name] || [];
      this._globalsStack[name].push( this._rootObj[name] );
    }

    this._rootObj[name] = ( ...arg ) => {
      const [closure, args] = extractArgOfType( arg, 'function' );
      return that._dispatchNodeCall( name, closure, ...args );
    };
  }

  /**
   * Register global objects (factories, properties and methods).
   * @private
   */
  _registerGlobals() {
    if ( this._globalsRegistered ) {
      return;
    }

    Object.getOwnPropertyNames( this._factories )
      .forEach( this._registerFactory.bind( this ) );

    this._propertyNames
      .forEach( this._registerProperty.bind( this ) );

    this._methodNames.forEach(
      this._registerMethod.bind( this ) );

    this._globalsRegistered = true;
  }

  /**
   * Registers a method with name for the current builder.
   *
   * @param name {String} the method name
   * @private
   */
  _registerMethod( name ) {
    const that = this;
    if ( this._rootObj[name] ) {
      this._globalsStack[name] = this._globalsStack[name] || [];
      this._globalsStack[name].push( this._rootObj[name] );
    }
    // keep as a fn call, since _current may
    // not be defined yet.
    this._rootObj[name] = ( ...args ) =>
      that._current.node[name].call(
        that._current.node, ...args );
  }

  /**
   * Registers a property with the given name for the current
   * builder.
   *
   * @param name {String} the property name
   * @private
   */
  _registerProperty( name ) {
    const that = this;
    if ( this._rootObj[name] ) {
      that.emit( 'error',
        new Error( `${ name } already exists on global` ) );
    }

    Object.defineProperty( this._rootObj, name, {
      configurable: true,
      get: () => that._current.node[name],
      set: ( v ) => {
        that._current.node[name] = v;
      },
    } );
  }

  /**
   * Returns a factory for the given node name.
   *
   * @param name {String} the name of the node
   * @returns {Function} the factory
   * @private
   */
  _resolveFactory( name ) {
    return this._factories[name];
  }

  /**
   * Sets up a parent child relationship.
   *
   * @param parent {Object} the parent node
   * @param child {Object} the child node
   * @private
   */
  _setParent( parent, child ) {
    this._current.factory.setParent( this._child.builder, parent, child );
    this._emit( 'setParent', this._child.builder, parent, child );

    const parentFactory = this._parent.factory;
    if ( parentFactory ) {
      parentFactory.setChild( this._current.builder, parent, child );
      this._emit( 'setChild', this._child.builder, parent, child );
    }
  }

  /**
   * Unregisters global definitions
   *
   * @private
   */
  _unregisterGlobals() {
    if ( !this._globalsRegistered ) {
      return;
    }
    _.forOwn( this._factories, ( f, n ) => {
      if ( this._globalsStack[n] && this._globalsStack[n].length ) {
        this._rootObj[n] = this._globalsStack[n].pop();
      } else {
        delete this._rootObj[n];
      }
    } );
    this._propertyNames.forEach( ( name ) => {
      delete this._rootObj[name];
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

  // noinspection JSUnusedGlobalSymbols
  /**
   *  `require` given file to build nodes with this builder.
   *
   *  @param file {String} file to load
   *  @param args {*[]} builder arguments
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
   * Override to perform custom registration
   */
  register() {
  }

  /**
   *  Register a factory for a node name
   *
   * @param name {String} of the factory
   * @param factory
   */
  registerFactory( name, factory ) {
    this._factories[name] = factory;
    this.emit( 'registerFactory', this, name, factory );
    if ( this._globalsRegistered ) {
      this._registerFactory( name );
    }
  }

  /**
   * Registers the given method names
   *
   * @param names {[String]} the method names
   */
  registerMethodNames( names = [] ) {
    this._methodNames = this._methodNames.concat( names );
    if ( this._globalsRegistered ) {
      names.forEach( this._registerMethod.bind( this ) );
    }
  }

  /**
   * Registers the given property names
   *
   * @param names {[String]} the property names
   */
  registerPropertyNames( names = [] ) {
    this._propertyNames = this._propertyNames.concat( names );
    if ( this._globalsRegistered ) {
      names.forEach( this._registerProperty.bind( this ) );
    }
  }
}

module.exports = JsDsl;
