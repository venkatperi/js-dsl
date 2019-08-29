# js-dsl
`js-dsl` is a `nodejs` framework for developing internal, builder-style domain specific languages (DSLs).

Examples of builder-style DSLs include `mocha`.

## Examples

### Arbitary Tree
This example builds an arbitrary forest of `tree` and `tip` nodes like the one shown below. Calls to `tree` translate to `Tree` objects (likewise for `tip`).

```javascript
const forest = new TreeBuilder.build( () =>
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
  } ) )
```

`js-dsl` generates the approriate hierarchy from nested calls to `tree` and `tip`.

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
`js-dsl` needs to know how to translate `tree` to `Tree` (and `tip` to `Tip`). We do this by registering a factory for `tree` and `tip`.

```javascript
const { JsDsl, AbstractFactory } = require( 'js-dsl' );

class TreeBuilder extends JsDsl {
  constructor() {
    super();
    this.registerFactory( 'tree', new TreeFactory() );
    this.registerFactory( 'tip', new TipFactory() );
  }
}
```

Factories are how `js-dsl` creates new nodes and ensures that they are inserted in the proper location in the builder's object hierarchy:

The `Tree` factory:
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

Finally, the 'data' nodes:
```javascript
class Tree {
  constructor( name ) {
    this.name = name;
    this.children = []
  }

  addChild( child ) {
    this.children.push( child );
  }
}

class Tip {
  constructor( name ) {
    this.name = name;
  }
}

```

### HTML builder

The tests include a builder for simple HTML which allows building markup directly in Javascript:

```
const page = () =>
  html( { lang: 'en' }, () => {
    head( () => {
      title( 'test' );
      meta( { charset: 'utf-8' } )
      link( { href: 'style.css', rel: 'stylesheet' } )
      style( `
body {
  color: red;
} ` )
    } )
    body( () => {
      h1( 'header 1' )
      p( 'This is a paragraph' )
      div( { class: 'some-style' }, () => {
        div()
        h2( 'header 2' )
        p( 'This is another paragraph' )
      } )
    } )
  } )
```
