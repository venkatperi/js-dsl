## Internal DSLs
An [internal](https://martinfowler.com/bliki/InternalDslStyle.html) DSL is written inside an existing host language.

### Mocha

[Mocha](www.mochajs.org) is a feature-rich JavaScript test framework running on Node.js and in the browser. Mocha provides globally callable functions like `describe` and `it` which can be used to write easy to understand tests such as: 

```js
var assert = require('assert');
describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      assert.equal([1, 2, 3].indexOf(4), -1);
    });
  });
});
```

Internally, mocha translates each call to `describe` and `it` to nodes of an abstact syntax tree that captures the hierarchy of the calls as well as their content. 
