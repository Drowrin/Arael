let canvas;
let ctx;

// Time tracking variables
var lastframetime;
var framedelay;
var frametime = 0;

let huerange = 120;

var dataArray;
var data;

self.onmessage = function(ev) {
    if (ev.data.msg === 'init') {
        canvas = ev.data.canvas;
        ctx = canvas.getContext('2d');
        dataArray = new Uint8Array(ev.data.array);
        animate();
    }

    if (ev.data.msg === 'resize') {
        canvas.width = ev.data.width;
        canvas.height = ev.data.height;
    }

    if (ev.data.msg === 'data') {
        data = ev.data.data;
    }
}

function animate() {
    // Time tracking
    framedelay = performance.now() - lastframetime;
    lastframetime = performance.now();

    if (data) {
        var datadelay = (Date.now() - data.timestamp);

        // Convenience variables for tracking dimensions
        var WIDTH = canvas.width;
        var HEIGHT = canvas.height;
        var barWidth = ((WIDTH) / dataArray.length)/2;
        var barPix = Math.ceil(barWidth);
        var mid = (WIDTH/2)-(barPix/2);
        var HUnit = HEIGHT / (256 * 2);

        // Create a bar from data and an index
        function createBar(v, i) {
            return {
                x: (i * barWidth),
                y: v * HUnit,
                width: barPix,
                height: v * data.loudness * HUnit,
                hue: (huerange*data.loudness*(i/dataArray.length) + (data.hueoffset)) % 360,
            };
        }

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
        var grad = ctx.createRadialGradient(WIDTH/2, HEIGHT/2, HEIGHT*data.bass*.55, WIDTH/2, HEIGHT/2, WIDTH/2);
        var bass_op = 2-(data.bass**0.2);
        if (bass_op < 0.0) bass_op = 0.0;
        grad.addColorStop(0, "hsl(0,0%,0%)");
        grad.addColorStop(0.00, "hsl(0,0%,3%)");
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
        frametime = performance.now() - lastframetime;

        // Display debug info if it is enabled
        postMessage({
            msg: "debug",
            debug: [
                "bufferlength: " + dataArray.length,
                "frame time: " + frametime.toFixed(2),
                "frame delay: " + framedelay.toFixed(2),
                "width: " + canvas.width,
                "height: " + canvas.height,
                "loudness: " + data.loudness.toFixed(2),
                "hype: " + data.hype.toFixed(2),
                "bass: " + data.bass.toFixed(2),
                "data delay: " + datadelay.toFixed(2)
            ].join("<br>")
        });
    }

    self.requestAnimationFrame(animate);
}
