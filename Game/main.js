// starts to execute the start function after everything is loaded
// look here http://stackoverflow.com/questions/588040/window-onload-vs-document-onload
window.onload = start;

function start() {
  console.log( "start" );

  var gl = null;
  var canvas = document.getElementById( "gl-canvas" );

  gl = initWebGL( canvas );

  if ( gl ) {
    // WebGL debgging is not easy, this method helps, but can implicate
    // performance issues (see: https://www.khronos.org/webgl/wiki/Debugging)
    gl = WebGLDebugUtils.makeDebugContext( gl );

    setupGL( gl );
  }
}

function initWebGL( canvas ) {
  var gl = null;

  try {
    // Firefox and Chrome use the standard webgl context, but some other browser still
    // need the experimental-webgl context
    gl = canvas.getContext( "webgl" ) || canvas.getContext( "experimental-webgl" );
  } catch (e) {
    console.error( e );
  }

  // If we do not hava a GL context
  if ( !gl ) {
    alert( "Unable to initialize WebGL. Your browser may not support it." );
    gl = null;
  }

  return gl;
}

// Based on: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Getting_started_with_WebGL
function setupGL( gl ) {
  gl.clearColor( 0.0, 0.0, 0.0, 1.0 );  // Set clear color to black, fully opaque
  gl.enable( gl.DEPTH_TEST ); //Enable depth testing
  gl.depthFunc( gl.LEQUAL );  // Near things obscure far things
  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT ); // Clear the color as well as the depth buffer.
}
