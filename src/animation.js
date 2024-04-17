let screen = document.getElementById("screen");
let bg = document.getElementById("screen_bg");
let fg = document.getElementById("screen_fg");
let ctx = screen.getContext("2d");
let animation = 0;
let dimensions = [214,147];
let sheet = document.getElementById("sprites");
let sheet_bg = document.getElementById("bg")
let time = 0;
let loop_length = 5;
let lastStamp;
let frame_duration = 200;
let animations = ["sleepy", "aboutme", "monke"];
let animation_lengths = [5, 4, 1]


function drawFrame(context, X, Y = 0, sprites=sheet, x=0,y=0){
    context.drawImage(sprites,
                    // Sprite selection
                    X*dimensions[0], Y*dimensions[1], dimensions[0], dimensions[1],
                    // Canvas position
                    x,y,
                    // boring stuff i have to do
                    dimensions[0],dimensions[1]
                    )
}

function step(timeStamp){
    // Animate the thing
    // This is frame stuff
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
    // Clear the box
    // Don't use the context dimensions because then it wont shrink which can be an issue
    ctx.clearRect(0,0,dimensions[0], dimensions[1]);
    // Draw the main frame
    set_frame(screen, cur_frame, animation, sheet);
    // Background draw
    set_frame(bg, 0, 0, sheet_bg)
    set_frame(fg, 0, 1, sheet_bg)
    // next frame waheyy
    window.requestAnimationFrame(step);
}

function set_frame(canvas, X = 0, Y = 0, spritesheet = sheet){
    canvas.width = dimensions[0];
    canvas.height = dimensions[1];
    drawFrame(canvas.getContext("2d"), X, Y, spritesheet)
}

function change_anim(anim){
    // Change animation type
    animation = anim;
    // Add more changes, like frame length and such
    screen.width = dimensions[0];
    screen.height = dimensions[1];
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

// Start off the frame loop
step();
// Set up mouse events
for (var i = 1; i < animations.length; i++){
    set_mouse_events(i);
};