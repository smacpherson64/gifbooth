var waitFor = require('waitFor'),
    userMedia = require('../lib/getUserMediaTest');

waitFor('body', function() {
    (function($){

        if ( userMedia() ) {

            // =========================
            // TARGETS
            // =========================

            var $root = $('main.app'),
                $live = $('.live', $root),
                $capture = $('.capture', $root),
                $frames = $('.frames', $root),
                $preview = $('.preview', $root),
                $download = $('.download', $root),
                $controls = $('.controls'),

                canvas = $capture[0],
                ctx = canvas.getContext('2d'),
                localMediaStream = null;



            // =========================
            // SETTINGS
            // =========================

            var settings = {
                'speed'             : 100,
                'isRendering'       : false,
                'controlsActive'    : false,
                'default_image'     : "data:image/gif;base64,R0lGODlhEAAJAJEAAAAAAP///////wAAACH5BAEAAAIALAAAAAAQAAkAAAIKlI+py+0Po5yUFQA7",
                'video_options'       : {
                    'video' : {
                        'mandatory': {
                            'minWidth'  : 1280,
                            'minHeight' : 720
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




            // =========================
            // STATUS
            // =========================

            var status = {
                'error': function(e) {
                    console.log('Reeeejected!', e);
                },
            };




            // =========================
            // TRIGGERED EVENTS
            // =========================

            var events = {

                'capture_frame' : function() {
                    if (localMediaStream) {
                        ctx.drawImage($live[0], 0, 0);
                        $frames.append('<li class="frame-container"><span class="js-frames-remove-one remove"><i class="symbol s-delete"></i></span><img height="720" width="1280" class="frame" src="' + canvas.toDataURL('image/jpeg') + '"></div>');
                        $frames.sortable({ forcePlaceholderSize: true }).bind('sortupdate', trigger.render);
                    }
                },

                'delete_all_frames' : function() {
                    $preview.attr('src', settings.default_image );
                    $frames.empty();
                },

                'close_frames_view' : function() {
                    $('.frame-wrapper').removeClass('active');
                },

                'toggle_frames_view' : function() {
                    $('.frame-wrapper').toggleClass('active');
                },

                'activate_controls' : function () {
                    var $controls_to_toggle = $controls.find('.control-toggles');
                    $controls_to_toggle.each(function() {
                        $(this).removeClass('disabled');
                    });

                    settings.controlsActive = true;
                },

                'deactivate_controls' : function () {
                    var $controls_to_toggle = $controls.find('.control-toggles');
                    $controls_to_toggle.each(function() {
                        $(this).addClass('disabled');
                    });

                    settings.controlsActive = false;
                },

                'remove_one_frame' : function( target ) {
                    $(target).parent().remove();
                },

                'get_frame_count' : function() {
                    return $frames.find('img').length;
                },

                'invert_preview' : function() {
                    $root.find('.view').toggleClass('invert');
                },

                'update_gif_speed' : function( target ) {
                    var new_speed = $(target).val()
                    settings.speed = new_speed;
                    $('.render-speed-label').find('.value').text( new_speed );
                },

                'render' : function(){
                    clearTimeout( window.gifbooth_render );
                    window.gifbooth_render = setTimeout(function(){
                        window.gifbooth_render = null;

                        if (settings.isRendering)
                            return;

                        settings.isRendering = true;

                        var $loading = $('.loading'),
                            $percent = $('.percent', $loading),
                            $animation = $frames.find('img');

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
                                $download.attr( 'href', url);
                                $preview.attr('src', url);
                                $percent.text('100%');
                                $loading.fadeOut('slow');
                                settings.isRendering = false;
                            });

                            gif.render();
                        } else {
                            setTimeout(function(){ settings.isRendering = false; }, 250);
                        }
                    }, 250);
                }
            }




            // =========================
            // TRIGGERS
            // =========================

            var trigger = {
                'capture'       : function() { $root.trigger('gif-frames-capture') },
                'delete_all'    : function() { $root.trigger('gif-frames-delete-all') },
                'render'        : function() { $root.trigger('gif-frames-render') },
                'remove_one'    : function() { $root.trigger('gif-frames-remove-one', [ this ]) },
                'invert'        : function() { $root.trigger('gif-view-invert') },
                'toggle'        : function() { $root.trigger('gif-view-frames') },
                'update_speed'  : function() { $root.trigger('gif-update-speed', [ this ]) }
            };




            // =========================
            // APP EVENT LISTENERS
            // =========================

            $root.on( 'gif-frames-capture', function() {
                events.capture_frame();

                if ( !settings.controlsActive )
                    events.activate_controls();

                events.render();

            });

            $root.on( 'gif-frames-delete-all', function( ) {
                events.delete_all_frames();
                events.close_frames_view();
                events.deactivate_controls();
            });

            $root.on( 'gif-frames-remove-one', function( event, target ) {
                events.remove_one_frame( target );

                if (events.get_frame_count() > 0 ) {
                    events.render();
                } else {
                    events.close_frames_view();
                    events.deactivate_controls();
                }
            });

            $root.on( 'gif-view-invert', function() {
                events.invert_preview();
            });

            $root.on( 'gif-view-frames', function() {
                events.toggle_frames_view();
            });

            $root.on( 'gif-update-speed', function( event, target ) {
                events.update_gif_speed( target );
                events.render();
            });

            $root.on( 'gif-frames-render', function( event, target ) {
                events.render();
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
            $root.on( 'change', '.js-control-speed', trigger.update_speed );




            // =========================
            // INITIALIZE
            // =========================

            navigator.getUserMedia =    navigator.getUserMedia
                                     || navigator.webkitGetUserMedia
                                     || navigator.mozGetUserMedia
                                     || navigator.msGetUserMedia;

            navigator.getUserMedia( settings.video_options, function( stream ) {
                var video = document.querySelector('video');
                video.src = window.URL.createObjectURL( stream );
                video.onloadedmetadata = function(e) {
                    localMediaStream = stream;
                };
            }, status.error );


        } else {
            alert('getUserMedia() is not supported in your browser');
        }

    })(jQuery);

});
