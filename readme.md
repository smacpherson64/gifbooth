# <a href="http://sethmac.com/gifbooth/">GIFBooth (version 0.1.5)</a>

## Description
GIFBooth is an experiment using various Javascript API's to allow users to use live video to create animated GIFs.


## TODOS and Fixes

##### ANALYTICS
- Detect right click on rendered GIF, send to GA as event
- Refactor Analytic Events to be easier to read

##### APP FUNCTIONALITY
- Remove Render button (Make sure proper render always happens)
- Add Timer Based Capture
- Add options for sharing
- Add upload indicator so users know that an action is happening on upload.
- Frames close button on the actual frames section (Will Phillips)
- Rotate frames (single and all frames in frames view)

##### ADMINISTRATION
- Move Todos into Issues in github

##### JS REFACTOR
- Refactor JS to be object based (Webcam especially)
- Add a flash backup ( Safari and IE )
    - Possible Implementation from: https://github.com/jhuckaby/webcamjs
    - Possible Implementation from: https://github.com/amw/jpeg_camera

## Tools
- **<a href="https://github.com/40Digits/gulp-eta">Gulp ETA</a>** - An open source frontend build script developed by <a href="http://40digits.com/">40Digits</a>

- **<a href="https://jnordberg.github.io/gif.js/">GIF.js</a>** - Javascript library for creating animated GIFs made by <a href="http://johan-nordberg.com/">Johan Nordberg</a>

- **<a href="https://github.com/voidberg/html5sortable">html5sortable</a>** - jQuery plugin for sorting lists and grids.

## Development Notes

#### getUserMedia
- **getUserMedia is now HTTPS only** - getUserMedia() no longer works on insecure origins. To use this feature, you should consider switching your application to a secure origin, such as HTTPS. See <a href="https://goo.gl/rStTGz">https://goo.gl/rStTGz</a> for more details.

#### Error Reporting through Google Analytics
- **<a href="https://developers.google.com/analytics/devguides/collection/analyticsjs/exceptions">Google Analytics Exceptions</a>**. - <a href="http://stackoverflow.com/questions/21718481/report-for-exceptions-from-google-analytics-analytics-js-exception-tracking">Google Analytics Report on Stack Overflow</a>. If you want to view Exceptions and Crashes in Google Analytics the view must be an app view: <a href="https://support.google.com/analytics/answer/2649553#WebVersusAppViews">App View vs Web View</a>. With App view Google Analytics only displays Devices in views.

## Acknowledgements
- Adam Fox suggested the functionality for the ghost image on live view
- Ghost, Turtle, and Rabbit Icons made by <a href="http://www.freepik.com" title="Freepik">Freepik</a> from <a href="http://www.flaticon.com" title="Flaticon">www.flaticon.com</a> licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0">CC BY 3.0</a>
- All other icons were created by <a href="http://iconmonstr.com">iconmonstr</a> on Twitter at: <a href="http://twitter.com/iconmonstr" target="_blank"><span class="at">@</span>iconmonstr</a>
