// stuff i nicked off webglfundamentals.org - thanks chaps
// eventually i want to port this over (so i actually learn how to webgl) but for now this'll be fine to get it putting along

/**
 * Creates and compiles a shader.
 *
 * @param {!WebGLRenderingContext} gl The WebGL Context.
 * @param {string} shaderSource The GLSL source code for the shader.
 * @param {number} shaderType The type of shader, VERTEX_SHADER or
 *     FRAGMENT_SHADER.
 * @return {!WebGLShader} The shader.
 */
export function compileShader(gl, shaderSource, shaderType) {
    // Create the shader object
    var shader = gl.createShader(shaderType);
    
    // Set the shader source code.
    gl.shaderSource(shader, shaderSource);
    
    // Compile the shader
    gl.compileShader(shader);
    
    // Check if it compiled
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!success) {
      // Something went wrong during compilation; get the error
      throw "could not compile shader:" + gl.getShaderInfoLog(shader);
    }
    
    return shader;
  }
  
/**
 * Creates a program from 2 shaders.
 *
 * @param {!WebGLRenderingContext) gl The WebGL context.
 * @param {!WebGLShader} vertexShader A vertex shader.
 * @param {!WebGLShader} fragmentShader A fragment shader.
 * @return {!WebGLProgram} A program.
 */
export function createProgram(gl, vertexShader, fragmentShader) {
// create a program.
var program = gl.createProgram();

// attach the shaders.
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);

// link the program.
gl.linkProgram(program);

// Check if it linked.
var success = gl.getProgramParameter(program, gl.LINK_STATUS);
if (!success) {
    // something went wrong with the link
    throw ("program failed to link:" + gl.getProgramInfoLog (program));
}
  
return program;
};
  
export function resizeCanvasToDisplaySize(canvas) {
// Lookup the size the browser is displaying the canvas in CSS pixels.
const displayWidth  = canvas.clientWidth;
const displayHeight = canvas.clientHeight;

// Check if the canvas is not the same size.
const needResize = canvas.width  !== displayWidth ||
                    canvas.height !== displayHeight;

if (needResize) {
    // Make the canvas the same size
    canvas.width  = displayWidth;
    canvas.height = displayHeight;
}

return needResize;
}

// this allows for more than one image to load
export function loadImages(urls, callback) {
  var images = [];
  var imagesToLoad = urls.length;
 
  // Called each time an image finished loading.
  var onImageLoad = function() {
    --imagesToLoad;
    // If all the images are loaded call the callback.
    if (imagesToLoad == 0) {
      callback(images);
    }
  };
 
  for (var ii = 0; ii < imagesToLoad; ++ii) {
    var image = loadImage(urls[ii], onImageLoad);
    images.push(image);
  }
}

function loadImage(url, callback) {
  var image = new Image();
  image.src = url;
  image.onload = callback;
  return image;
}