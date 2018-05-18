'use "strict';

function toAsciiTree( tree, prefix = '', isTail = true ) {
  if ( !tree ) return null;

  const name = tree.name;
  const res = [];
  res.push( prefix );
  res.push( isTail ? '└─' : '├─' );
  res.push( name );
  res.push( '\n' );

  if ( tree.children ) {
    let i = 0;
    const childCount = tree.children.length;

    tree.children.forEach( ( c ) => {
      const p = prefix + ( isTail ? '  ' : '│ ' );
      res.push( toAsciiTree( c, p,
        !(i++ < childCount - 1) ) );
    } );
  }
  return res.join( '' );
}

function toStringTree( tree ) {
  if ( !tree ) return null;

  const res = [];
  res.push( `(${tree.name}` );

  if ( tree.children ) {
    tree.children.forEach( ( c ) => {
      res.push( toStringTree( c ) );
    } );
  }
  res.push( ')' );
  return res.join( ' ' );
}

module.exports = {
  toAsciiTree,
  toStringTree,
};
