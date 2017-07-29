= node-factory-builder
A 'groovy-esq' DSL builder for JavaScript/nodejs.

== Example

```javascript
const forest = () =>
 tree( 'a', () => {
    tree( 'b', () => {
      tip( 'c' )
    } )
    tip( 'd' )
    tree( 'e', () => {
      tree( 'f', () => {
        tree( 'g', () => {
          tip( 'd' )
        } )
        tip( 'h' )
      } )
    } )
  } )
```

Generates this object hierarchy:
```bash
└─a
  ├─b
  │ └─c
  ├─d
  └─e
    └─f
      ├─g
      │ └─d
      └─h
```

With this code:

Define the `Tree` builder and register `Tree` and `Tip` node factories:
```javascript
const { FactoryBuilderSupport, AbstractFactory } = require( 'node-factory-builder' );

class TreeBuilder extends FactoryBuilderSupport {
  constructor() {
    super();
    this.registerFactory( 'tree', new TreeFactory() );
    this.registerFactory( 'tip', new TipFactory() );
  }
}
```

The `Tree` Factory:
```javascript
class TreeFactory extends AbstractFactory {
  newInstance( builder, name, args ) {
    return new Tree( args );
  }

  setChild( builder, parent, child ) {
    parent.addChild( child );
  }
}

```

The `Tip` Factory:
```javascript

class TipFactory extends AbstractFactory {
  isLeaf() {
    return true;
  }

  newInstance( builder, name, args ) {
    return new Tip( args );
  }
}

```

The `Tree` and `Tip` models:
```javascript
class Tree {
  constructor( name ) {
    this.name = name;
    this.children = []
  }

  addChild( child ) {
    this.children.push( child );
    child.parent = this;
  }
}

class Tip {
  constructor( name ) {
    this.name = name;
  }
}

```


Finally, build the tree and render it:
```javascript
console.log(new TreeBuilder.build(forest));
```

