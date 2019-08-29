/* eslint-disable no-undef,class-methods-use-this,no-console,semi */
const HtmlBuilder = require( './fixtures/HtmlBuilder' );
const validator = require( 'html-validator' )

// noinspection JSUnresolvedFunction
const test = () =>
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


describe( 'html', () => {
  it( 'generates html', ( done ) => {
    const content = new HtmlBuilder().build( test ).toHtml();
    // console.log( content );
    validator( { data: content, format: 'text' } )
      .then( () => {
        // console.log( data );
        done();
      } )
      .catch( done );
  } );
} );
