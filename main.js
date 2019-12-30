let url = new URL(window.location.href);

// Enable or disable debug info displayed in the top left corner
// ?debug=1 will enable it.
var debug = url.searchParams.get("debug");

var debugtarget = document.querySelector("p");
var audioContext = new AudioContext();

// Get user permission to use audio device
navigator.mediaDevices.getUserMedia({audio: true})
.then(()=>{

    // Look through possible devices
    navigator.mediaDevices.enumerateDevices()
    .then(devices => {

        // Find the Virtual Audio Cable
        let device = devices.find(d => d.label.includes("CABLE"));

        // Get the VAC device by id.
        navigator.mediaDevices.getUserMedia({audio: {deviceId: device.deviceId}})
        .then(stream => {

        // Create and connect an audio analyser to our audio source
        var analyser = audioContext.createAnalyser();
        audioContext.createMediaStreamSource(stream).connect(analyser);

        // Analyser settings. Different values here may suit different tastes.
        analyser.fftSize = 2048;
        // analyser.smoothingTimeConstant = .85;
        // analyser.minDecibels = -100;
        // analyser.maxDecibels = -30;

        // Initialize intermediate array for processing
        bufferlength = analyser.frequencyBinCount;
        var dataArray = new Uint8Array(bufferlength);

        // Time tracking variables
        var lastframetime;
        var framedelay;
        var frametime = 0;

        // Setup canvas element
        var canvas = document.querySelector("canvas");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        var ctx = canvas.getContext("2d");

        // Convenience variables for tracking dimensions
        var WIDTH = canvas.width;
        var HEIGHT = canvas.height;
        var barWidth = ((WIDTH) / dataArray.length)/2;
        var barPix = Math.ceil(barWidth);
        var mid = (WIDTH/2)-(barPix/2);
        var HUnit = HEIGHT / (256 * 2);
        
        // Variables used in the loop to describe properties of the current sound
        var loudness;
        var hype;
        var bass;

        // Initial color settings
        var hueoffset = 180;
        var huerange = 120;
        var hueshift = 0;

        // Function to display debug info in the top right corner, if debugging is enabled
        function debugText() {
            if (debug) {
            debugtarget.innerHTML = [
                "bufferlength: " + bufferlength,
                "frame time: " + frametime.toFixed(2),
                "frame delay: " + framedelay.toFixed(2),
                "width: " + canvas.width,
                "height: " + canvas.height,
                "loudness: " + loudness.toFixed(2),
                "hype: " + hype.toFixed(2),
                "hueshift: " + hueshift.toFixed(2),
                "bass: " + bass.toFixed(2),
            ].join("<br>");
            }
        }

        // Create a bar from data and an index
        function createBar(v, i) {
            return {
                x: (i * barWidth),
                y: v * HUnit,
                width: barPix,
                height: v * loudness * HUnit,
                hue: (huerange*loudness*(i/bufferlength) + (hueoffset)) % 360,
            };
            }
        
        // Draw a frame based on the current sound
        function renderFrame() {
            // Time tracking
            framedelay = performance.now() - lastframetime;
            lastframetime = performance.now();

            // Get data on the current sound
            analyser.getByteFrequencyData(dataArray);

            // Process overall info about current sound
            loudness = 1.3*Math.cbrt(dataArray.reduce((a, v) => (a + (v/255)**2), 0) / dataArray.length);
            hype = ((loudness+.2)**3);
            hype = ((hype + ((hype-.1)**4)/2));
            
            hueshift = 0.05 + ((2*hype)**1.5)/2.25;
            hueoffset = (hueoffset - hueshift);

            var rang = Math.ceil(bufferlength/100);
            bass = dataArray.slice(0, rang).reduce((a, v) => (a + v), 0) / (rang * 255);

            // Create the array of bars
            bars = [];
            dataArray.forEach((v, i) => bars.push(createBar(v,i)));

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
            var bass_op = 2-(bass**0.2);
            if (bass_op < 0.0) bass_op = 0.0;
            grad.addColorStop(0, "hsl(0,0%,8%)");
            grad.addColorStop(0.00, "hsl(0,0%,11%)");
            grad.addColorStop(0.1, "hsl(0,0%,8%)");
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
            frametime = performance.now() - lastframetime;

            // Display debug info if it is enabled
            debugText();

            // Request that this function is called again next frame
            requestAnimationFrame(renderFrame);
        }

        // Start the rendering process
        renderFrame();
        });
    })
});