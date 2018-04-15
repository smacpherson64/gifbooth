(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = function() { return !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia); }

},{}],2:[function(require,module,exports){
module.exports = function() {
    // Adapted from David Walsh (https://davidwalsh.name/page-visibility) who Adpated from Sam Dutton

    (function($){
        var visibilityChange,
            status;

        if (typeof document.hidden !== "undefined") {
        	visibilityChange = "visibilitychange";
            status = "hidden";
        } else if (typeof document.mozHidden !== "undefined") {
        	visibilityChange = "mozvisibilitychange";
            status = "mozHidden";
        } else if (typeof document.msHidden !== "undefined") {
        	visibilityChange = "msvisibilitychange";
            status = "msHidden";
        } else if (typeof document.webkitHidden !== "undefined") {
        	visibilityChange = "webkitvisibilitychange";
            status = "webkitHidden";
        }

        document.addEventListener(visibilityChange, function(){ $(document).trigger('page-visibility-change', [document[status]]) }, false);

        return status;
    })(jQuery);

}

},{}],3:[function(require,module,exports){
module.exports = function() {
    // http://www.developerdrive.com/2013/08/turning-the-querystring-into-a-json-object-using-javascript/
    var pairs = location.search.slice(1).split('&');
    var result = {};
    pairs.forEach(function(pair) {
        pair = pair.split('=');
        result[pair[0]] = decodeURIComponent(pair[1] || '');
    });

    return JSON.parse(JSON.stringify(result));
};

},{}],4:[function(require,module,exports){
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
},{}],5:[function(require,module,exports){
var waitFor = require('waitFor'),
  userMedia = require('../lib/get-user-media'),
  watchPageVisiblity = require('../lib/page-visiblity');

waitFor('body', function() {

  (function($){

    // =========================
    // TARGETS and VARIABLES
    // =========================

    var $root = $('main.app'),
      $live = $('.live', $root),
      $capture = $('.capture', $root),
      $frames = $('.frames', $root),
      $preview = $('.preview', $root),
      $download = $('.download', $root),
      $controls = $('.js-controls'),
      $ghost = $('.ghost-overlay'),
      $upload = $('.js-file-upload'),
      canvas = $capture[0],
      ctx = canvas.getContext('2d'),
      localMediaStream = null;


    // =========================
    // SETTINGS and STATUS
    // =========================

    var settings = {
      'speed'       : 250,
      'isRendering'     : false,
      'default_image'   : "data:image/gif;base64,R0lGODlhEAAJAJEAAAAAAP///////wAAACH5BAEAAAIALAAAAAAQAAkAAAIKlI+py+0Po5yUFQA7",
      'webcam'   : {
        'mediaDevices' : {
          'video' : {
            'width'  : { min: 1280 },
            'height' : { min: 720 }
          }
        },
        'getUserMedia' : {
          'video' : {
            'mandatory': {
              'minWidth'  : 1280,
              'minHeight' : 720
            },
          }
        }
      },
      'gif_options' : {
        workers: 3,
        quality: 10,
        width: 1280,
        height: 720,
      }
    };


    var status = {
      'system': '',
      'upload': {},
      'controls' : false,
    }


    // =========================
    // TRIGGERED APP ACTIONS
    // =========================

    var app = {

      gtm: function(action, value) {
        dataLayer.push({
          event: 'user_action',
          event_category: 'action',
          event_action: action,
          event_label: !!(value) ? value : 'default',
        });
      },

      upload_system: {
        initalize: function() {
          $upload.addClass('active');
          $('.js-frames-capture', $root).find('i').attr('data-label', 'upload');
          $('.live-wrapper', $root).hide();
        },

        'upload' : function() {
          var now = new Date();
          var time = now.getTime();
          var upload = $upload[0];
          var files = upload.files;

          status.upload[now] = {};
          status.upload[now].total = files.length;
          status.upload[now].current = 0;

          for (var i = 0, file; file = files[i]; i++) {

            if ( !file.type.match('image.*' )) {
              status.upload[now].current++;
              continue;
            }

            var reader = new FileReader();

            reader.onload = (function( fileURL ) {
              return function(event) {
                app.add_frame( event.target.result );
                status.upload[now].current++;
              };
            })( file );

            reader.readAsDataURL( file );
          }

          status.upload.trigger = setInterval( function(){
            if ( status.upload.current == status.upload.total ) {
              trigger.upload_complete( status.upload[now] );
              clearInterval(status.upload.trigger)
            } else {
              console.log('Loading: ' + status.upload.current + ' of ' + status.upload.total);
            }
          }, 100 );
        },

      },

      webcam_system: {

        initalize: function() {
          if ( userMedia() ) {
            if ( typeof navigator.mediaDevices != "undefined" && typeof navigator.mediaDevices.getUserMedia != "undefined") {
              navigator.mediaDevices.getUserMedia( settings.webcam.mediaDevices )
                .then(function(stream) {
                  var video = document.querySelector('video');
                  video.src = window.URL.createObjectURL( stream );
                  video.onloadedmetadata = function(e) {
                    localMediaStream = stream;
                  };

                  trigger.system_setup( 'accept' );
                })
                .catch(function(error) {
                  if (error.name === 'ConstraintNotSatisfiedError') {
                    trigger.system_setup( 'resolution_issue' );
                  } else if (error.name === 'PermissionDeniedError') {
                    trigger.system_setup( 'reject' );
                  }
                });
            } else {
              navigator.getUserMedia =  navigator.getUserMedia
                                     || navigator.webkitGetUserMedia
                                     || navigator.mozGetUserMedia
                                     || navigator.msGetUserMedia;

              navigator.getUserMedia( settings.webcam.getUserMedia, function( stream ) {
                var video = document.querySelector('video');
                video.src = window.URL.createObjectURL( stream );
                video.onloadedmetadata = function(e) { localMediaStream = stream; };
                trigger.system_setup( 'accept' );
              }, function() { trigger.system_setup( 'reject' ); });
            }
          } else {
            trigger.system_setup( 'not_supported' );
          }
        },

        'toggle_live': function( isHidden ) {

          if ( isHidden && status.system === "webcam" ) {

            if ( typeof localMediaStream.getAudioTracks != "undefined" ){
              localMediaStream.getAudioTracks().forEach(function( value ){ value.stop(); });
            }

            if ( typeof localMediaStream.getVideoTracks != "undefined" ) {
              localMediaStream.getVideoTracks().forEach(function( value ){ value.stop(); });
            }

            if ( typeof localMediaStream.stop != "undefined" ) {
              localMediaStream.stop();
            }

          } else {
            app.webcam_system.initalize();
          }
        },
      },

      'get_image_dimensions': function() {
        var img = $frames.find('img')[0],
            data = {
              'width'   : img.naturalWidth,
              'height'  : img.naturalHeight
            };

        return data;
      },

      'add_frame' : function( image ) {
        $frames.append('<li class="frame-container"><span class="js-frames-remove-one remove"><i class="symbol s-delete"></i></span><img height="720" width="1280" class="frame" src="' + image + '"></div>');
        $frames.sortable({ forcePlaceholderSize: true }).bind('sortupdate', trigger.sort);
      },

      'capture_frame' : function() {
        if (localMediaStream) {
          ctx.drawImage($live[0], 0, 0);
          var image = canvas.toDataURL('image/jpeg');
          $frames.append('<li class="frame-container"><span class="js-frames-remove-one remove"><i class="symbol s-delete"></i></span><img height="720" width="1280" class="frame" src="' + image + '"></div>');
          $frames.sortable({ forcePlaceholderSize: true }).bind('sortupdate', trigger.sort);
        }
      },

      'delete_all_frames' : function() {
        $preview.attr('src', settings.default_image );
        $frames.empty();
      },

      'close_frames_view' : function() {
        $('.section-frames, .js-view-toggle-frames').removeClass('active');
      },

      'clear_preview': function() {
        $preview.attr('src', settings.default_image);
      },

      'toggle_frames_view' : function() {
        var $targets = $('.section-frames, .js-view-toggle-frames');
        $targets.toggleClass('active');

        return $targets.hasClass('active') ? 'open' : 'close';
      },

      'activate_controls' : function () {
        var $controls_to_toggle = $controls.find('.control-toggles');
        $controls_to_toggle.each(function() {
          $(this).removeClass('disabled');
        });

        status.controlsActive = true;
      },

      'deactivate_controls' : function () {
        var $controls_to_toggle = $controls.find('.control-toggles');
        $controls_to_toggle.each(function() {
          $(this).addClass('disabled');
        });

        status.controlsActive = false;
      },

      'remove_one_frame' : function( target ) {
        $(target).parent().remove();
      },

      'get_frame_count' : function() {
        return $frames.find('img').length;
      },

      'get_gif_details' : function() {
        return $download.attr('data-details');
      },

      'update_overlay_opacity' : function( target ) {
        var $toggle = $(target);
        $toggle.toggleClass('active');
        var isActive = $toggle.hasClass('active');

        if ( isActive ) {
          $ghost.css('opacity', '.4');
        } else {
          $ghost.css('opacity', '0');
        }
        return isActive;
      },

      'update_overlay_src': function(){
        if ( app.get_frame_count() > 0 ) {
          $ghost.attr('src', $('.frame-container:last-child img').attr('src'));
        } else {
          $ghost.attr('src', settings.default_image);
        }
      },

      'invert_preview' : function() {
        var $view = $('.view', $root);
        $view.toggleClass('invert');
        return $view.hasClass('invert') ? 'inverted' : 'default' ;
      },

      'update_gif_speed' : function( target ) {
        var new_speed = $(target).val()
        settings.speed = new_speed;
        $('.render-speed-label').find('.value').text( new_speed );
        return new_speed;
      },

      'render' : function() {
        clearTimeout( window.gifbooth_render );
        window.gifbooth_render = setTimeout(function(){
          window.gifbooth_render = null;

          if (settings.isRendering)
            return;

          settings.isRendering = true;

          var $loading = $('.loading'),
            $percent = $('.percent', $loading),
            $animation = $frames.find('img'),
            gif_size = app.get_image_dimensions();
            gif_ratio = gif_size.width / gif_size.height;

            settings.gif_options.width = gif_size.width > 1270 ? 1270 : gif_size.width;
            settings.gif_options.height = gif_size.height > 1270 ? 1270 : gif_size.height;

            if ( gif_ratio > 1 ) {
                settings.gif_options.height = Math.round( gif_size.height * 1270 / gif_size.width );
            } else if ( gif_ratio < 1 ) {
                settings.gif_options.width = Math.round( gif_size.width * 1270 / gif_size.height );
            }


          if ( $animation.length > 0 ) {
            var defaults = {
              delay: settings.speed,
              copy: true
            };

            var gif = new GIF( settings.gif_options );

            $animation.each(function() {
              var $this = $(this);
              gif.addFrame( $(this)[0], defaults );
            });

            gif.on('start', function(){
              $loading.show();
            });

            gif.on('progress', function(p) {
              $percent.text( Math.round(p * 100) + "%");
            });

            gif.on('finished', function(blob) {

              var url = URL.createObjectURL(blob);

              var details = {
                'time'    : new Date(),
                'size'    : blob.size,
                'frames'  : app.get_frame_count(),
                'speed'   : settings.speed
              }

              $download.attr( 'href', url);
              $download.attr( 'data-details', JSON.stringify( details ) );
              $preview.attr('src', url);
              $percent.text('100%');
              $loading.fadeOut('slow');
              settings.isRendering = false;
            });

            setTimeout(function() { gif.render(); }, 500);
          } else {
            setTimeout(function() { settings.isRendering = false; }, 250);
          }
        }, 400);
      }
    }




    // =========================
    // REPORTS
    // =========================

    var report = {
      'browser': {
        'userMedia'   : {
          'accept'      : function() { app.gtm('send', 'event', 'getUserMedia', 'accept') },
          'reject'      : function( err ) { app.gtm('send', 'event', 'getUserMedia', 'reject', err ) },
          'not_supported'   : function() { app.gtm('send', 'event', 'getUserMedia', 'not-supported') },
          'resolution_issue'  : function() { app.gtm('send', 'event', 'getUserMedia', 'resolution-not-supported') },
        },
      },
      'app' : {
        'capture'     : function() { app.gtm('Capture Frame') },
        'delete'      : function() { app.gtm('Delete GIF') },
        'remove'      : function() { app.gtm('Remove Frame') },
        'render'      : function() { app.gtm('Render GIF') },
        'frames'      : function( status ) { app.gtm('Toggle Frames', status ) },
        'preview'     : function( status ) { app.gtm('Invert Preview', status ) },
        'download'    : function( details ) { app.gtm('Download GIF', details ) },
        'speed'       : function( value ) { app.gtm('Update GIF Speed', value ) },
        'sort'        : function() { app.gtm('Sort Frames' )},
        'overlay'     : function( value ) { app.gtm('Toggle Overlay', value ) },
        'upload'      : function( value ) { app.gtm('Upload Images', value )},
        'contextmenu' : function( details ) { app.gtm('Context Menu Open on GIF', details )}
      }
    }




    // =========================
    // TRIGGERS
    // =========================

    var trigger = {
      'capture'         : function() { $root.trigger('gif-frames-capture') },
      'contextmenu'     : function() { $root.trigger('gif-contextmenu') },
      'close_frames'    : function() { $root.trigger('gif-close-frames')},
      'delete_all'      : function() { $root.trigger('gif-frames-delete-all') },
      'render'          : function() { $root.trigger('gif-frames-render') },
      'remove_one'      : function() { $root.trigger('gif-frames-remove-one', [ this ]) },
      'invert'          : function() { $root.trigger('gif-view-invert') },
      'toggle'          : function() { $root.trigger('gif-view-frames') },
      'update_speed'    : function() { $root.trigger('gif-update-speed', [ this ]) },
      'update_overlay'  : function() { $root.trigger('gif-update-overlay', [ this ]) },
      'download'        : function() { $root.trigger('gif-download') },
      'sort'            : function() { $root.trigger('gif-frames-sort') },
      'upload_files'    : function( event ) { $root.trigger('gif-upload-files'), [ event ]},
      'upload_complete' : function( status ) { $root.trigger('gif-upload-complete', [ status ])},
      'system_setup'    : function( webcam_system_response ) { $root.trigger('gif-system-setup', [ webcam_system_response ])}
    };




    // =========================
    // APP EVENT LISTENERS
    // =========================

    $root.on( 'gif-system-setup', function( event, webcam_system_response ) {
      console.log( webcam_system_response );
      switch ( webcam_system_response ) {
        case 'accept':
          status.system = "webcam";
          report.browser.userMedia.accept();
          break;

        case 'resolution_issue':
          status.system = "upload";
          app.upload_system.initalize();
          report.browser.userMedia.resolution_issue();
          break;

        case 'not_supported':
          status.system = "upload";
          app.upload_system.initalize();
          report.browser.userMedia.not_supported();
          break;

        case 'reject':
        default:
          status.system = "upload";
          app.upload_system.initalize();
          report.browser.userMedia.reject();
          break;
      }
    });

    $root.on( 'gif-frames-capture', function() {
      app.capture_frame();

      if ( !status.controlsActive )
        app.activate_controls();

      app.update_overlay_src();
      app.render();

      report.app.capture();
    });

    $root.on( 'gif-frames-delete-all', function( ) {
      app.delete_all_frames();
      app.close_frames_view();
      app.deactivate_controls();
      app.update_overlay_src();

      report.app.delete();
    });

    $root.on( 'gif-frames-remove-one', function( event, target ) {
      app.remove_one_frame( target );

      if (app.get_frame_count() > 0 ) {
        app.render();
      } else {
        app.close_frames_view();
        app.deactivate_controls();
        app.clear_preview();
      }

      app.update_overlay_src();

      report.app.remove();
    });

    $root.on( 'gif-view-invert', function() {
      var status = app.invert_preview();

      report.app.preview( status );
    });

    $root.on( 'gif-view-frames', function() {
      var status = app.toggle_frames_view();

      report.app.frames( status );
    });

    $root.on( 'gif-close-frames', function() {
      app.close_frames_view();

      report.app.frames('close')
    });

    $root.on( 'gif-update-speed', function( event, target ) {
      var value = app.update_gif_speed( target );
      app.render();

      report.app.speed( value );
    });

    $root.on( 'gif-update-overlay', function( event, target ) {
      var value = app.update_overlay_opacity( target );

      report.app.overlay( value );
    });

    $root.on( 'gif-frames-render', function( event, target ) {
      app.render();

      report.app.render();
    });

    $root.on( 'gif-frames-sort', function() {
      app.render();

      report.app.sort();
    });

    $root.on( 'gif-download', function() {
      var details = app.get_gif_details();

      report.app.download( details );
    });

    $root.on( 'gif-contextmenu', function() {
      var details = app.get_gif_details();

      if (typeof details != "undefined") {
        report.app.contextmenu( details );
      }
    });

    $root.on( 'gif-upload-files', function() {
      app.upload_system.upload();
    });

    $root.on( 'gif-upload-complete', function( event, status ) {
      if ( !status.controlsActive )
        app.activate_controls();

      app.update_overlay_src();
      app.render();

      report.app.upload( status );
    });

    $(document).on( 'page-visibility-change', function( event, status ) {
      app.webcam_system.toggle_live( status );
    });




    // =========================
    // USER EVENT LISTENERS
    // =========================

    $root.on( 'click', '.js-frames-capture', trigger.capture );
    $root.on( 'click', '.js-frames-delete-all', trigger.delete_all );
    $root.on( 'click', '.js-frames-remove-one', trigger.remove_one );
    $root.on( 'click', '.js-frames-render', trigger.render );
    $root.on( 'click', '.js-view-toggle-frames', trigger.toggle );
    $root.on( 'click', '.js-invert-preview', trigger.invert );
    $root.on( 'click', '.js-download-image', trigger.download );
    $root.on( 'click', '.js-overlay-toggle', trigger.update_overlay );
    $root.on( 'change', '.js-control-speed', trigger.update_speed );
    $root.on( 'change', '.js-file-upload', trigger.upload_files );
    $root.on( 'contextmenu', '.js-preview-gif', trigger.contextmenu );
    $root.on( 'click', '.js-close-frames', trigger.close_frames );




    // =========================
    // INITIALIZE
    // =========================

    function initalizeApp() {
        app.webcam_system.initalize();
    }

    var pageHidden = watchPageVisiblity();
    if ( !pageHidden ) { initalizeApp(); }

  })(jQuery);

});

},{"../lib/get-user-media":1,"../lib/page-visiblity":2,"waitFor":4}],6:[function(require,module,exports){
var get_query_as_array = require('../lib/query-array');

(function($) {

  // =========================
  // EXPERIMENTS
  // =========================

  var experiments = {
    'control': {
      'download' : function() {
        $('.js-download-image').addClass('green');
      },
    }
  };


  // =========================
  // INITIALIZE
  // =========================

  var query = get_query_as_array(),
    keys = Object.keys(query);

  keys.forEach(function(key) {
    var value = query[key];
    var items = value.split('|').filter(function (n) { return (typeof n != "undefined" && n != "") });

    items.forEach(function(item) {
      if (typeof experiments[key] != "undefined" && typeof experiments[key][item] == "function")
        experiments[key][item]();
    });
  });

})(jQuery);

},{"../lib/query-array":3}]},{},[6,5]);
