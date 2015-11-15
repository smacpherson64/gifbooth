(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * waitFor
 * @param  {String}   selector DOM element to check for on every page load
 * @param  {Function} callback The code to execute when the element is on the page
 * @return {Boolean}
 */
module.exports = function(selector, callback) {
  if (document.querySelectorAll(selector).length > 0) {
    callback();
  } else {
    return false;
  }
};
},{}],2:[function(require,module,exports){
var waitFor = require('waitFor');

waitFor('body', function() {

    function hasGetUserMedia() {
        return !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
    }

    if (hasGetUserMedia()) {

        var video = document.querySelector('video'),
            canvas = document.querySelector('canvas'),
            ctx = canvas.getContext('2d'),
            $img = $('img');
            $range = $('input[type="range"]'),
            speed = $range.val(),
            localMediaStream = null,

            animationRunning = false,
            animation = [],
            animationCurrent = 0,

            options = {
                video: {
                    mandatory: {
                        minWidth: 1280,
                        minHeight: 720
                    }
                }
            };

        // var idx = 0;
        // var filters = ['grayscale', ''];
        //
        // function changeFilter() {
        //     $video = $(video);
        //     $video.attr('class', '');
        //
        //     var effect = filters[idx++ % filters.length];
        //
        //     if (effect)
        //         $video.addClass( effect );
        // }

        navigator.getUserMedia  = navigator.getUserMedia ||
                                  navigator.webkitGetUserMedia ||
                                  navigator.mozGetUserMedia ||
                                  navigator.msGetUserMedia;

        var errorCallback = function(e) {
            console.log('Reeeejected!', e);
        };

        navigator.getUserMedia( options, function( stream ) {
            var video = document.querySelector('video');
            video.src = window.URL.createObjectURL( stream );
            video.onloadedmetadata = function(e) {
                localMediaStream = stream;
            };
        }, errorCallback);

        function snapshot() {
            if (localMediaStream) {
                ctx.drawImage(video, 0, 0);
                var image = canvas.toDataURL('image/jpeg');
                animation.push(image);
            }

            if (!animationRunning)
                startAnimation();
        }

        function startAnimation() {
            if (window.animationTick)
                clearInterval( window.animationTick );

            window.animationRunning = true;
            window.animationTick = setInterval(function(){
                $img.attr('src', animation[animationCurrent++ % animation.length]);
            }, window.speed);
        }

        clearImage = function() {
            window.animation = [];
            $img.attr('src', '');
        }

        updateSpeed = function() {
            speed = $(this).val();
            startAnimation();
        }

        makeImage = function() {
            var gif = new GIF({
                workers: 2,
                quality: 10
            });

            animation.forEach(function( value ) {
                gif.addFrame( canvas );
            });

            gif.on('finished', function(blob) {
                console.log('finished');
                window.open( URL.createObjectURL(blob) );
            });

            gif.render();
        }

        $('.js-make-image').on('click', makeImage);
        $range.on('change', updateSpeed);
        $(video).on('click', snapshot);
        $('.js-change-filter').on('click', clearImage);

    } else {
        alert('getUserMedia() is not supported in your browser');
    }

});

},{"waitFor":1}]},{},[2]);
