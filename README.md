![Arael in action](https://repository-images.githubusercontent.com/226207572/d33e6580-1791-11ea-9829-89cc6dbb1868)

Arael is currently WIP.

# Setup
Arael is intended to be run on system audio, though this requires a bit of setup.

In the folder you downloaded to, run `npm install`.

* Install a Virtual Audio Cable driver. [This one](https://www.vb-audio.com/Cable/) has worked well for me.
* Set the VAC Output to be listened to on your prefered audio output (or let it take the default).
* Open "App volume and device preferences" in Windows.
* For any applications you want the visualizer to listen to, set the output device to the VAC Input.

Alternatively, you can use the "Stereo Mix" recording device if your sound card supports it. I've found it to have more noticeable latency, but it might be an easier way to preview Arael.

Once everything is set up, Arael can be run with `npm start` in the project directory.
