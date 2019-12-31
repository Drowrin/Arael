const { ipcRenderer } = require('electron');

var debug = false;

ipcRenderer.on('toggle-debug', function (event) {
    debug = !debug;
});

var debugtarget = document.querySelector("p");
var audioContext = new AudioContext();

const DATA_LENGTH = 1024;
const RATE = 5;

var sharedarrayhandle = new SharedArrayBuffer(Uint8Array.BYTES_PER_ELEMENT * DATA_LENGTH);
var sharedarray = new Uint8Array(sharedarrayhandle);
var dataArray = new Uint8Array(DATA_LENGTH);

// Setup canvas element
// var canvas = document.querySelector("canvas").transferControlToOffscreen();

const offscreen = document.querySelector('canvas').transferControlToOffscreen();
const canvasworker = new Worker('./js/canvasworker.js');
canvasworker.postMessage({msg: 'init', canvas: offscreen, array: sharedarrayhandle}, [offscreen]);

canvasworker.onmessage = function(ev) {
    if (ev.data.msg === 'debug') {
        if (debug) {
            debugtarget.innerHTML = ev.data.debug + "<br>proccessing time: " + (performance.now() - thistick).toFixed(2);
        } else {
            debugtarget.innerHTML = "";
        }
    }
}

window.onresize = function () {
    canvasworker.postMessage({msg: 'resize', width: window.innerWidth, height: window.innerHeight});
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

// Time tracking
var thistick;

function rate() {
    return sleep(RATE - (performance.now() - thistick));
}

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

    while (true) {
        thistick = performance.now();

        // Get data on the current sound
        analyser.getByteFrequencyData(dataArray);

        // Process overall info about current sound
        loudness = 1.3*Math.cbrt(dataArray.reduce((a, v) => (a + (v/255)**2), 0) / dataArray.length);
        hype = ((loudness+.2)**3);
        hype = ((hype + ((hype-.1)**4)/2));
        
        hueshift = 0.05 + ((2*hype)**1.5)/4;
        hueoffset = (hueoffset - hueshift);

        var rang = Math.ceil(DATA_LENGTH/100);
        bass = dataArray.slice(0, rang).reduce((a, v) => (a + v), 0) / (rang * 255);

        // Update canvas data
        canvasworker.postMessage({
            msg: 'data',
            data: {
                loudness: loudness,
                hype: hype,
                bass: bass,
                hueoffset: hueoffset,
                timestamp: Date.now()
            }
        });

        for(var i=0; i<dataArray.length; i++){
            sharedarray[i] = dataArray[i];
        }

        await rate();
    }
}

main();