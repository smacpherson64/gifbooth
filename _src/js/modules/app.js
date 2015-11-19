var waitFor = require('waitFor'),
    userMedia = require('../lib/getUserMediaTest');

waitFor('body', function() {
    (function($){

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
        // TRIGGERED ACTIONS
        // =========================

        var actions = {

            'capture_frame' : function() {
                if (localMediaStream) {
                    ctx.drawImage($live[0], 0, 0);
                    $frames.append('<li class="frame-container"><span class="js-frames-remove-one remove"><i class="symbol s-delete"></i></span><img height="720" width="1280" class="frame" src="' + canvas.toDataURL('image/jpeg') + '"></div>');
                    $frames.sortable({ forcePlaceholderSize: true }).bind('sortupdate', trigger.sort);
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
                var $frames = $('.frame-wrapper');
                $frames.toggleClass('active');
                return $frames.hasClass('active') ? 'open' : 'close' ;
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

            'get_gif_details' : function() {
                return $download.attr('data-details');
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

                            var details = {
                                'time'      : new Date(),
                                'size'      : blob.size,
                                'frames'    : actions.get_frame_count()
                            }

                            $download.attr( 'href', url);
                            $download.attr( 'data-details', JSON.stringify( details) );
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
            'update_speed'  : function() { $root.trigger('gif-update-speed', [ this ]) },
            'download'      : function() { $root.trigger('gif-download') },
            'sort'          : function() { $root.trigger('gif-frame-sort') }
        };




        // =========================
        // APP EVENT LISTENERS
        // =========================

        $root.on( 'gif-frames-capture', function() {
            actions.capture_frame();

            if ( !settings.controlsActive )
                actions.activate_controls();

            actions.render();

            report.userAction.capture();
        });

        $root.on( 'gif-frames-delete-all', function( ) {
            actions.delete_all_frames();
            actions.close_frames_view();
            actions.deactivate_controls();

            report.userAction.delete();
        });

        $root.on( 'gif-frames-remove-one', function( event, target ) {
            actions.remove_one_frame( target );

            if (actions.get_frame_count() > 0 ) {
                actions.render();
            } else {
                actions.close_frames_view();
                actions.deactivate_controls();
            }

            report.userAction.remove();
        });

        $root.on( 'gif-view-invert', function() {
            var status = actions.invert_preview();

            report.userAction.preview( status );
        });

        $root.on( 'gif-view-frames', function() {
            var status = actions.toggle_frames_view();

            report.userAction.frames( status );
        });

        $root.on( 'gif-update-speed', function( event, target ) {
            actions.update_gif_speed( target );
            actions.render();

            report.userAction.speed();
        });

        $root.on( 'gif-frames-render', function( event, target ) {
            actions.render();

            report.userAction.render();
        });

        $root.on( 'gif-frames-sort', function() {
            actions.render();

            report.userAction.sort();
        });

        $root.on( 'gif-download', function() {
            var details = actions.get_gif_details();

            report.userAction.download( details );
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
        $root.on( 'change', '.js-control-speed', trigger.update_speed );




        // =========================
        // REPORTS
        // =========================

        var report = {
            'getUserMedia' : {
                'accept'        : function() { ga('send', 'event', 'getUserMedia', 'accept') },
                'reject'        : function(err) { ga('send', 'event', 'getUserMedia', 'reject', 'getUserMedia', err) },
                'not_supported' : function() { ga('send', 'event', 'getUserMedia', 'not-supported') },
            },
            'userAction' : {
                'capture'       : function() { ga('send', 'event', 'capture-frame', 'trigger') },
                'delete'        : function() { ga('send', 'event', 'delete-gif', 'trigger') },
                'remove'        : function() { ga('send', 'event', 'remove-frame', 'trigger') },
                'render'        : function() { ga('send', 'event', 'render-gif', 'trigger') },
                'frames'        : function( status ) { ga('send', 'event', 'toggle-frames', 'trigger', 'status', status ) },
                'preview'       : function( status ) { ga('send', 'event', 'invert-preview', 'trigger', 'status', status ) },
                'download'      : function( details ) { ga('send', 'event', 'download-gif', 'trigger', 'details', details ) },
                'speed'         : function( value ) { ga('send', 'event', 'update-speed', 'trigger', 'value', value )},
                'sort'          : function() { ga('send', 'event', 'sort-frame', 'trigger' )}
            }
        }




        // =========================
        // INITIALIZE
        // =========================

        if ( userMedia() ) {

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
                report.getUserMedia.accept();
            }, report.getUserMedia.reject );
        } else {
            alert('Sorry! GIFBooth currently requires access to a webcam to operate. Your browser currently does not support this feature.');
            report.getUserMedia.not_supported();
        }

    })(jQuery);

});
