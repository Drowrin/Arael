![Arael in action](https://repository-images.githubusercontent.com/226207572/d33e6580-1791-11ea-9829-89cc6dbb1868)

# Setup
Arael is intended to be run on system audio, though this requires a bit of setup.

* Install a Virtual Audio Cable driver.
* Set the VAC Output to be listened to on your prefered audio output (or let it take the default).
* Open "App volume and device preferences" in Windows.
* For any applications you want the visualizer to listen to, set the output device to the VAC Input.

You can then use the visualizer at https://drowrin.github.io/Arael/

If you want to use this in an OBS browser source, you'll need launch OBS with `--enable-media-stream`. You can edit your shortcut to make this easy.
