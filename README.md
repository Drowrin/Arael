# Setup
Arael is intended to be run on system audio, though this requires a bit of setup.

Install a Virtual Audio Cable driver.
Set the VAC Output to be listened to on your prefered audio output (or let it take the default).
Open "App volume and device preferences" in Windows.
For any applications you want the visualizer to listen to, set the output device to the VAC Input.

If you want to use this in OBS, you'll need launch it with `--enable-media-stream`. You can edit your shortcut to make this easy.
