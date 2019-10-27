# js-dsl
## Introduction
`js-dsl` lets you build [internal](reference) domain specific languages (DSLs) in Javascript. Specifically, these DSLs let you declaratively build an mostly arbitrary trees. Often, these trees will parallel your abstract syntax tree (AST) or semantic model (SM).

Here's an example of a [DSL](https://github.com/venkatperi/js.html) that generates HTML:
```Javascript
div( { class: 'my-style' }, () => {
  h2( 'Header 2' )
  p( 'This is another paragraph' )
} )
```

Under the hood, the DSL generates a tree of `element` nodes which render to this HTML snippet:
```html
<div class="my-style">
  <h2>Header 2</h2>
  <p>This is another paragraph</p>
</div>
```

In this example, js-dsl translates calls to global methods such as `div` to HTML element nodes.

### Method Calls
js-dsl provides methods calls for registered nodes on the global context (window, for browsers).

Method calls provided by js-dsl take the form:

```Javascript
someNode([value], [options], [config closure])
```

The optional `value` and `options` map are passed to the node's constructor.

### Registering Nodes
You need to register the names of the nodes with js-dsl and the context under which nodes may appear. In in DSL, you are provided global node-method calls that map to the node names that you registered.

### Factories
js-dsl will orchestrate the building of the node-tree and call a factory object that was registered with each node. The factory object is responsible for instantiating new nodes and inserting them appropriately in the AST hierarchy, among other things. Factory objects inherit from `AbstractFactory`.

### Building the Tree
When js-dsl encounters a known node-method call, it asks factory registered for the node to supply an instance of the node by calling `newInstance`, passing it any optional `value` and `options`.

js-dsl inserts the newly created node into the tree hiearchy by calling factory methods `setParent` and `setChild` (in that order), with the parent as the current node and new node as the child .

If the node has a `config closure`, js-dsl will invoke the closure with the js-dsl instance as `this` and the newly created node as the only argument.


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
