import * as webgl from "./webgl-things.js";

let canvas = document.getElementById("canvas")
let bg = new Image()
bg.src = "./images/render/main0000.png"

let scene_dim = [1920, 1080]
let sprite_dim = [214, 294]

let time = 0;
let animation = 0;
let frame_duration = 200;
let animations = ["sleepy", "aboutme", "monke"];
let animation_lengths = [5, 4, 1]
let animationLocation;

let lastStamp;

let program;
let isWebgl = true

let gl = canvas.getContext("webgl")
if (!gl){
    isWebgl = false
    console.warn("WebGL didn't work :/")
    gl = canvas.getContext("2d")
}

const frag_shader = `
precision highp float;

const vec4 c_colour = vec4(0.2, 1.0, 0.3, 1.0);

// our texture
uniform sampler2D u_image0;
uniform sampler2D u_image1;
uniform sampler2D u_image2;
uniform vec2 u_scale;
uniform vec2 u_animation;


// the texCoords passed in from the vertex shader.
varying vec2 v_texCoord;


void main() {
  vec4 mask = texture2D(u_image1, v_texCoord);
  if (mask.a > 0.0){
    // get uv on spritesheet
    vec2 co_ords = mask.gr / u_scale;
    co_ords += vec2(u_animation.x / u_scale.x, u_animation.y / u_scale.y);
    vec4 col = texture2D(u_image2, co_ords);
    if (col.a > 0.0){
      gl_FragColor = vec4(0.2, 0.6, 0.3, 1.0);
      // gl_FragColor = col;
      return;
    }
  }
  gl_FragColor = texture2D(u_image0, v_texCoord);
}`

const vert_shader = `
attribute vec2 a_position;
attribute vec2 a_texCoord;

uniform vec2 u_resolution;

varying vec2 v_texCoord;

void main() {
   // convert the rectangle from pixels to 0.0 to 1.0
   vec2 zeroToOne = a_position / u_resolution;

   // convert from 0->1 to 0->2
   vec2 zeroToTwo = zeroToOne * 2.0;

   // convert from 0->2 to -1->+1 (clipspace)
   vec2 clipSpace = zeroToTwo - 1.0;

   gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

   // pass the texCoord to the fragment shader
   // The GPU will interpolate this value between points.
   v_texCoord = a_texCoord;
}`

function main() {
  webgl.loadImages([
    "./images/render/main0000.png",
    "./images/render/UV0000.png",
    "./images/sprites/tv.png"
  ], init_render)
}

function init_render(images) {

  // setup GLSL program
  var vertexShader = webgl.compileShader(gl, vert_shader, gl.VERTEX_SHADER);
  var fragmentShader = webgl.compileShader(gl, frag_shader, gl.FRAGMENT_SHADER);
  program = webgl.createProgram(gl, vertexShader, fragmentShader);

  // look up where the vertex data needs to go.
  var positionLocation = gl.getAttribLocation(program, "a_position");
  var texcoordLocation = gl.getAttribLocation(program, "a_texCoord");

  // Create a buffer to put three 2d clip space points in
  var positionBuffer = gl.createBuffer();

  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // Set a rectangle the same size as the image.
  setRectangle(gl, 0, 0, scene_dim[0], scene_dim[1]);

  // provide texture coordinates for the rectangle.
  var texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0.0,  0.0,
      1.0,  0.0,
      0.0,  1.0,
      0.0,  1.0,
      1.0,  0.0,
      1.0,  1.0,
  ]), gl.STATIC_DRAW);

  // create 2 textures
  var textures = [];
  for (var ii = 0; ii < 3; ++ii) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the parameters so we can render any size image.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    // Upload the image into the texture.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[ii]);

    // add the texture to the array of textures.
    textures.push(texture);
  }

  // lookup the sampler locations.
  var u_image0Location = gl.getUniformLocation(program, "u_image0");
  var u_image1Location = gl.getUniformLocation(program, "u_image1");
  var u_image2Location = gl.getUniformLocation(program, "u_image2");

  // lookup uniforms
  var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
  var scaleLocation = gl.getUniformLocation(program, "u_scale");
  gl.animationLocation = gl.getUniformLocation(program, "u_animation");

  // this breaks my scaling but not really?? i'm not super sure why it does what it does :/
  // webgl.resizeCanvasToDisplaySize(gl.canvas);

  // Tell WebGL how to convert from clip space to pixels
  gl.viewport(0, 0, scene_dim[0], scene_dim[1]);

  // Clear the canvas
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Tell it to use our program (pair of shaders)
  gl.useProgram(program);

  // Turn on the position attribute
  gl.enableVertexAttribArray(positionLocation);

  // Bind the position buffer.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 2;          // 2 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(
      positionLocation, size, type, normalize, stride, offset);

  // Turn on the texcoord attribute
  gl.enableVertexAttribArray(texcoordLocation);

  // bind the texcoord buffer.
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

  // Tell the texcoord attribute how to get data out of texcoordBuffer (ARRAY_BUFFER)
  var size = 2;          // 2 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(
      texcoordLocation, size, type, normalize, stride, offset);

  // set the resolution
  gl.uniform2f(resolutionLocation, scene_dim[0], scene_dim[1]);

    
  // set which texture units to render with.
  gl.uniform1i(u_image0Location, 0);  // texture unit 0
  gl.uniform1i(u_image1Location, 1);  // texture unit 1
  gl.uniform1i(u_image2Location, 2);  // texture unit 2

  // Set each texture unit to use a particular texture.
  // (Bind textures)
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, textures[0]);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, textures[1]);
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, textures[2]);

  // set spritesheet scaling
  gl.uniform2f(scaleLocation, Math.max(...animation_lengths), animations.length)
  gl.uniform2f(animationLocation, 1, 0)

  // Draw the rectangle.
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  requestAnimationFrame(render)
}

function setRectangle(gl, x, y, width, height) {
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
     x1, y1,
     x2, y1,
     x1, y2,
     x1, y2,
     x2, y1,
     x2, y2,
  ]), gl.STATIC_DRAW);
}

function render(timeStamp){
  let cur_frame = 0;
  if (lastStamp != null){
      time += timeStamp - lastStamp;
      cur_frame = Math.floor(time / frame_duration);
      if (cur_frame >= animation_lengths[animation]){
          time -= frame_duration * cur_frame;
          cur_frame = Math.floor(time / frame_duration);
      }
  }
  lastStamp = timeStamp;

  gl.uniform2f(gl.animationLocation, cur_frame, animation)
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  requestAnimationFrame(render)
}

function change_anim(anim){
  // Change animation type
  animation = anim
  gl.uniform2f(gl.animationLocation, 0, anim)
}

function set_mouse_events(i){
  // Set button mouseover events
  let overbutton = document.getElementById(animations[i]);
  if (overbutton != null){
      // Change to target
      overbutton.addEventListener("mouseenter", function(){change_anim(i)});
      // Change back to sleepy
      overbutton.addEventListener("mouseleave", function(){change_anim(0)});
  }
}

// Set up mouse events
for (var i = 1; i < animations.length; i++){
  set_mouse_events(i);
};

main();


