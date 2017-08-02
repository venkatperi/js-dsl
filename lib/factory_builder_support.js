const _ = require( 'lodash' );
const { EventEmitter } = require( 'events' );
const debug = require( 'debug' )( 'factory-builder' );

class FactoryBuilderSupport extends EventEmitter {
  constructor( parentBuilder ) {
    super();
    this._parentBuilder = parentBuilder;
    this._contextStack = [];
    this._globalsStack = {};
  }

  get contextStack() {
    return this._parentBuilder
      ? this._parentBuilder.contextStack
      : this._contextStack;
  }

  get context() {
    let len = this.contextStack.length;
    return len > 0 ? this.contextStack[ len - 1 ] : null;
  }

  get current() {
    return this.context.current;
  }

  get child() {
    return this.context.child;
  }

  get parent() {
    return this.context.parent;
  }

  pushContext( ctx ) {
    ctx = _.extend( {}, { current: {}, child: {}, parent: {} }, ctx );
    this.contextStack.push( ctx );
  }

  popContext() {
    this.contextStack.pop();
  }

  dispatchNodeCall( name, closure, ...args ) {
    let needToPop = false;

    if ( !this.context ) {
      this.pushContext();
      needToPop = true;
    }

    let node = this.createNode( name, ...args );

    let currentNode = this.current.node;
    if ( currentNode ) {
      this.setParent( currentNode, node );
    }

    if ( closure ) {
      let parentFactory = this.current.factory;
      let parentName = this.current.name;
      let parentContext = this.context;

      if ( parentFactory.isLeaf() ) {
        throw new TypeError( `"${name}" does not support nesting.` );
      }

      this.pushContext( {
        current: _.extend( { node: node }, parentContext.child ),
        parent: {
          factory: parentFactory,
          node: currentNode,
          context: parentContext,
          name: parentName,
          builder: parentContext.current.builder,
        }
      } );

      try {
        if ( this.current.usesCustomBuilder ) {
          this.current.builder.registerGlobals();
        }
        closure.call( this, node );
      } finally {
        if ( this.current.usesCustomBuilder )
          this.current.builder.unregisterGlobals();
      }

      this.popContext();
    }

    this.nodeCompleted( currentNode, node );
    this.emit( 'nodeCompleted', this, currentNode, node );

    if ( needToPop ) {
      this.popContext();
    }
    return node;
  }

  nodeCompleted( parent, child ) {
    this.current.factory.onNodeCompleted(
      this.child.builder, parent, child );
  }

  setParent( parent, child ) {
    this.current.factory.setParent( this.child.builder, parent, child );
    let parentFactory = this.parent.factory;
    if ( parentFactory ) {
      parentFactory.setChild( this.current.builder, parent, child );
    }
  }

  resolveFactory( name, ...args ) {
    return this._factories[ name ];
  }

  createNode( name, ...args ) {
    debug( `createNode: ${name}` );

    let factory = this.resolveFactory( name, ...args );
    if ( !factory ) {
      throw new Error( "Don't know how to create " + name );
    }

    this.child.builder = this;
    let childBuilder = factory.getBuilder( this );
    if ( childBuilder ) {
      this.child.builder = childBuilder;
      this.child.usesCustomBuilder = true;
    }

    this.current.factory = factory;
    this.current.name = name;

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

  registerFactory( name, factory ) {
    this._factories = this._factories || {};
    this._factories[ name ] = factory;
  }

  build( closure ) {
    try {
      this.registerGlobals();
      return closure.call( this );
    } finally {
      this.unregisterGlobals();
    }
  }

  buildFile( file, ...args ) {
    try {
      this.registerGlobals();
      let res = require( file );
      if ( typeof res === 'function' )
        res = res.call( this, ...args );
      return res;
    } finally {
      this.unregisterGlobals();
    }
  }

  registerGlobals() {
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
        return that.dispatchNodeCall( n, closure, ...args );
      };
    } );
    this._globalsRegistered = true;
  }

  unregisterGlobals() {
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
