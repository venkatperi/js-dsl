const _ = require( 'lodash' );
const { EventEmitter } = require( 'events' );
const debug = require( 'debug' )( 'factory-builder' );

/**
 * A groovy-builder like object-tree builder for developing 
 * JavaScript DSLs.
 */
class FactoryBuilderSupport extends EventEmitter {
  constructor( parentBuilder ) {
    super();
    this._parentBuilder = parentBuilder;
    this.__contextStack = [];
    this._globalsStack = {};
  }

  /**
   *  Register a factory for a node name
   *
   *  @param {name} the node name.
   *  @param {factory} the factory associated with name.
   */
  registerFactory( name, factory ) {
    this._factories = this._factories || {};
    this._factories[ name ] = factory;
  }

  /**
   *  Execute given closure to build nodes with this builder.
   *
   *  @param {closure} the closure to execute 
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
   *  @returns {object} the top level node built by the builder.
   */
  buildFile( file, ...args ) {
    try {
      this._registerGlobals();
      let res = require( file );
      if ( typeof res === 'function' )
        res = res.call( this, ...args );
      return res;
    } finally {
      this._unregisterGlobals();
    }
  }

  get _contextStack() {
    return this._parentBuilder ?
      this._parentBuilder._contextStack :
      this.__contextStack;
  }

  get _context() {
    let len = this._contextStack.length;
    return len > 0 ? this._contextStack[ len - 1 ] : null;
  }

  get _current() {
    return this._context._current;
  }

  get _child() {
    return this._context._child;
  }

  get _parent() {
    return this._context._parent;
  }

  _pushContext( ctx ) {
    ctx = _.extend( {}, { _current: {}, _child: {}, _parent: {} }, ctx );
    this._contextStack.push( ctx );
  }

  _popContext() {
    this._contextStack.pop();
  }

  _dispatchNodeCall( name, closure, ...args ) {
    let needToPop = false;

    if ( !this._context ) {
      this._pushContext();
      needToPop = true;
    }

    let node = this._createNode( name, ...args );

    let currentNode = this._current.node;
    if ( currentNode ) {
      this._setParent( currentNode, node );
    }

    if ( closure ) {
      let parentFactory = this._current.factory;
      let parentName = this._current.name;
      let parentContext = this._context;

      if ( parentFactory.isLeaf() ) {
        throw new TypeError( `"${name}" does not support nesting.` );
      }

      this._pushContext( {
        _current: _.extend( { node: node }, parentContext._child ),
        _parent: {
          factory: parentFactory,
          node: currentNode,
          _context: parentContext,
          name: parentName,
          builder: parentContext._current.builder,
        }
      } );

      try {
        if ( this._current.usesCustomBuilder ) {
          this._current.builder._registerGlobals();
        }
        closure.call( this, node );
      } finally {
        if ( this._current.usesCustomBuilder )
          this._current.builder._unregisterGlobals();
      }

      this._popContext();
    }

    this._nodeCompleted( currentNode, node );
    this.emit( '_nodeCompleted', this, currentNode, node );

    if ( needToPop ) {
      this._popContext();
    }
    return node;
  }

  _nodeCompleted( parent, child ) {
    this._current.factory.onNodeCompleted(
      this._child.builder, parent, child );
  }

  _setParent( parent, child ) {
    this._current.factory.setParent( this._child.builder, parent, child );
    let parentFactory = this._parent.factory;
    if ( parentFactory ) {
      parentFactory.setChild( this._current.builder, parent, child );
    }
  }

  _resolveFactory( name, ...args ) {
    return this._factories[ name ];
  }

  _createNode( name, ...args ) {
    debug( `createNode: ${name}` );

    let factory = this._resolveFactory( name, ...args );
    if ( !factory ) {
      throw new Error( "Don't know how to create " + name );
    }

    this._child.builder = this;
    let childBuilder = factory.getBuilder( this );
    if ( childBuilder ) {
      this._child.builder = childBuilder;
      this._child.usesCustomBuilder = true;
    }

    this._current.factory = factory;
    this._current.name = name;

    //args = args && args.length === 1 ? args[ 0 ] : args;
    this.emit( 'preInstantiate', this, name, ...args );

    let node = factory.newInstance( this, name, ...args );
    if ( !node ) {
      debug( `factory returned null for ${name}` );
      return null;
    }

    this.emit( 'postInstantiate', this, name, node );
    return node;
  }
  _registerGlobals() {
    if ( this._globalsRegistered )
      return;
    _.forOwn( this._factories, ( f, n ) => {
      if ( global[ n ] ) {
        //throw new Error( `Cant register ${n}. Already exists.` );
        this._globalsStack[ n ] = this._globalsStack[ n ] || [];
        this._globalsStack[ n ].push( global[ n ] );
      }
    } );

    let that = this;
    _.forOwn( this._factories, ( f, n ) => {
      global[ n ] = ( ...args ) => {
        let closure = args[ args.length - 1 ];
        if ( typeof closure === 'function' ) {
          args.pop();
        } else
          closure = null;
        return that._dispatchNodeCall( n, closure, ...args );
      };
    } );
    this._globalsRegistered = true;
  }

  _unregisterGlobals() {
    if ( !this._globalsRegistered )
      return;
    _.forOwn( this._factories, ( f, n ) => {
      if ( this._globalsStack[ n ] && this._globalsStack[ n ].length )
        global[ n ] = this._globalsStack[ n ].pop();
      else
        delete global[ n ];
    } );
    this._globalsRegistered = false;
  }
}

module.exports = FactoryBuilderSupport;
