const { ipcRenderer } = require('electron');

// Constants
const DATA_LENGTH = 1024;
const RATE = 5;


var debug = false;
ipcRenderer.on('toggle-debug', function (event) {
    debug = !debug;
});

var debugtarget = document.querySelector("p");
var audioContext = new AudioContext();

var dataArray = new Uint8Array(DATA_LENGTH);

// Setup canvas element
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

// Respond to changes in window size
window.onresize = function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.onresize();

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Variables used in the loop to describe properties of the current sound
var loudness;
var hype;
var bass;

// Initial color settings
var hueoffset = 180;
var hueshift = 0;
let huerange = 120;

// Time tracking
var lastframetime;
var framestarttime;
var frameend;
var framedelay;
var frametime = 0;
var thistick;
var ticktime;
var proctime;

async function main() {
    // Get user permission to use audio device
    await navigator.mediaDevices.getUserMedia({audio: true});

    // Look through possible devices
    let devices = await navigator.mediaDevices.enumerateDevices();

    // Find the Virtual Audio Cable
    let device = devices.find(d => d.label.includes("CABLE"));

    // Get the VAC device by id.
    var stream = await navigator.mediaDevices.getUserMedia({audio: {deviceId: device.deviceId}});

    // Create and connect an audio analyser to our audio source
    var analyser = audioContext.createAnalyser();
    audioContext.createMediaStreamSource(stream).connect(analyser);

    // Analyser settings. Different values here may suit different tastes.
    analyser.fftSize = DATA_LENGTH * 2;
    // analyser.smoothingTimeConstant = .85;
    // analyser.minDecibels = -100;
    // analyser.maxDecibels = -30;

    function animate() {
        requestAnimationFrame(animate);

        // Time tracking
        framestarttime = performance.now() - lastframetime;
        framedelay = performance.now() - frameend;
        lastframetime = performance.now();

        // Convenience variables for tracking dimensions
        var WIDTH = canvas.width;
        var HEIGHT = canvas.height;
        var barWidth = ((WIDTH) / dataArray.length)/2;
        var barPix = Math.ceil(barWidth);
        var mid = (WIDTH/2)-(barPix/2);
        var HUnit = HEIGHT / (256 * 2);

        // Create the array of bars
        var bars = [];
        dataArray.forEach((v, i) => bars.push({
            x: (i * barWidth),
            y: v * HUnit,
            width: barPix,
            height: v * loudness * HUnit,
            hue: (huerange*loudness*(i/dataArray.length) + (hueoffset)) % 360,
        }));

                // Determine vertical offset based on min, max, and centroid
        // places the image roughly in the center without shaking too violently.
        // centroidRatio controls how much smoothness is applied.
        var centroidRatio = 0.2;

        var min = HEIGHT;
        var max = 0;
        var sum = 0;
        var count = 0;
        bars.forEach((b) => {
            if (b.y < min) min = b.y;
            if ((b.y + b.height) > max) max = b.y + b.height;

            sum += (b.height + 1)*(b.height + (2*b.y))/2;
            count += b.height;
        });

        var padding = (HEIGHT/2) - ((max-min)/2);
        var center = (sum / count);

        var offset = centroidRatio*((HEIGHT/2) - center) + (1-centroidRatio)*padding - centroidRatio*0.1*HEIGHT;

        // Draw a grey circle in the back that fades to black in the corners.
        // Control size by bass to give a pulsing effect.
        var grad = ctx.createRadialGradient(WIDTH/2, HEIGHT/2, HEIGHT*bass*.55, WIDTH/2, HEIGHT/2, WIDTH/2);
        var bassmult = 1.0;
        if (bass < .4) {
            bassmult = bass / .4;
        }
        grad.addColorStop(0.00, "hsl(0,0%,0%)");
        grad.addColorStop(0.01, "hsl(0,0%," + 4.5*bassmult + "%)");
        grad.addColorStop(0.1, "hsl(0,0%,0%)");
        grad.addColorStop(1, "#000");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        // Draw the visualizer
        bars.forEach((b) => {
            ctx.fillStyle = "hsl(" + b.hue + ",100%,65%)";
            ctx.fillRect(mid+b.x, b.y+offset, b.width, b.height);
            ctx.fillRect(mid-b.x, b.y+offset, b.width, b.height);
        });

        // Uncomment to draw vertical center.
        // ctx.fillStyle = "hsl(0,0%,100%)";
        // ctx.fillRect(WIDTH/4, center + offset, WIDTH/2, 1);

        // Time tracking
        frameend = performance.now();
        frametime = frameend - lastframetime;

        // Display debug info if enabled
        if (debug) {
            debugtarget.innerHTML = [
                "width: " + canvas.width,
                "height: " + canvas.height,

                "",

                "draw time: " + frametime.toFixed(2),
                "delay after frame: " + framedelay.toFixed(2),
                "total frame time: " + framestarttime.toFixed(2),
                "framerate: " + (1000.0 / framestarttime).toFixed(2),

                "",

                "processing time: " + proctime.toFixed(2),
                "tick time: " + ticktime.toFixed(2),
                "tickrate: " + (1000.0 / ticktime).toFixed(2),

                "",

                "loudness: " + loudness.toFixed(2),
                "hype: " + hype.toFixed(2),
                "bass: " + bass.toFixed(2),
            ].join("<br>");
        } else {
            debugtarget.innerHTML = "";
        }
    }

    // Start animating
    requestAnimationFrame(animate);

    // Proccess audio data
    while (true) {
        ticktime = performance.now() - thistick;
        thistick = performance.now();

        // Get data on the current sound
        analyser.getByteFrequencyData(dataArray);

        // Process overall info about current sound
        loudness = 1.3*Math.cbrt(dataArray.reduce((a, v) => (a + (v/255)**2), 0) / dataArray.length);
        hype = ((loudness+.2)**3);
        hype = ((hype + ((hype-.1)**4)/2));
        
        hueshift = 0.05 + ((2*hype)**1.5)/4.5;
        hueoffset = (hueoffset - hueshift);

        var rang = Math.ceil(DATA_LENGTH/100);
        bass = dataArray.slice(0, rang).reduce((a, v) => (a + v), 0) / (rang * 255);

        proctime = performance.now() - thistick;

        await sleep(RATE - proctime);
    }
}

main();