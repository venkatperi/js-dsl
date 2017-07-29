'use "strict'

function toAsciiTree( tree, prefix = "", isTail = true ) {
  if ( !tree ) return null;

  let name = tree.name;
  let res = [];
  res.push( prefix );
  res.push( isTail ? "└─" : "├─" );
  res.push( name );
  res.push( "\n" );

  if ( tree.children ) {
    let i = 0;
    let childCount = tree.children.length;

    tree.children.forEach( ( c ) => {
      let p = prefix + ( isTail ? "  " : "│ " );
      res.push( toAsciiTree( c, p,
        i++ < childCount - 1 ? false : true ) );
    } );
  }
  return res.join( '' );
};

function toStringTree( tree ) {
  if ( !tree ) return null;

  let res = [];
  res.push( `(${tree.name}` );

  if ( tree.children ) {
    tree.children.forEach( ( c ) => {
      res.push( toStringTree( c ) );
    } );
  }
  res.push( ')' );
  return res.join( ' ' );
};

module.exports = {
  toAsciiTree,
	toStringTree
}
