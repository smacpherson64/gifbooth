var waitFor = require('waitFor'),
    userMedia = require('../lib/get-user-media'),
    watchPageVisiblity = require('../lib/page-visiblity');

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
            $controls = $('.js-controls'),
            $ghost = $('.ghost-overlay'),
            $upload = $('.js-file-upload'),

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


        var status = {
            'upload': {}
        }




        // =========================
        // TRIGGERED ACTIONS
        // =========================

        var actions = {

            'upload_files' : function() {

                var now = new Date();
                var time = now.getTime();
                var upload = $upload[0];
                var files = upload.files;

                status.upload[now] = {};
                status.upload[now].total = files.length;
                status.upload[now].current = 0;

                for (var i = 0, file; file = files[i]; i++) {

                    if ( !file.type.match('image.*')) {
                        status.upload[now].current++;
                        continue;
                    }

                    var reader = new FileReader();

                    reader.onload = (function( fileURL ) {
                        return function(event) {
                            actions.add_frame( event.target.result );
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
                $('.frame-wrapper, .js-view-toggle-frames').removeClass('active');
            },

            'clear_preview': function() {
                $preview.attr('src', settings.default_image);
            },

            'toggle_frames_view' : function() {
                var $targets = $('.frame-wrapper, .js-view-toggle-frames');
                $targets.toggleClass('active');

                return $targets.hasClass('active') ? 'open' : 'close';;
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
                if ( actions.get_frame_count() > 0 ) {
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

            'stop_live': function( status ) {
                var isHidden = status;

                if (isHidden) {

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
                    initalizeVideo();
                }
            },

            'setup_upload_system': function() {
                $upload.addClass('active');
                $('.js-frames-capture', $root).find('i').attr('data-label', 'upload');
                $('.live-wrapper', $root).hide();
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
            'capture'           : function() { $root.trigger('gif-frames-capture') },
            'delete_all'        : function() { $root.trigger('gif-frames-delete-all') },
            'render'            : function() { $root.trigger('gif-frames-render') },
            'remove_one'        : function() { $root.trigger('gif-frames-remove-one', [ this ]) },
            'invert'            : function() { $root.trigger('gif-view-invert') },
            'toggle'            : function() { $root.trigger('gif-view-frames') },
            'update_speed'      : function() { $root.trigger('gif-update-speed', [ this ]) },
            'update_overlay'    : function() { $root.trigger('gif-update-overlay', [ this ]) },
            'download'          : function() { $root.trigger('gif-download') },
            'sort'              : function() { $root.trigger('gif-frames-sort') },
            'upload_files'      : function( event ) { $root.trigger('gif-upload-files'), [ event ]},
            'upload_complete'   : function( status ) { $root.trigger('gif-upload-complete', [ status ])},
        };




        // =========================
        // APP EVENT LISTENERS
        // =========================

        $root.on( 'gif-frames-capture', function() {
            actions.capture_frame();

            if ( !settings.controlsActive )
                actions.activate_controls();

            actions.update_overlay_src();
            actions.render();

            report.app.capture();
        });

        $root.on( 'gif-frames-delete-all', function( ) {
            actions.delete_all_frames();
            actions.close_frames_view();
            actions.deactivate_controls();
            actions.update_overlay_src();

            report.app.delete();
        });

        $root.on( 'gif-frames-remove-one', function( event, target ) {
            actions.remove_one_frame( target );

            if (actions.get_frame_count() > 0 ) {
                actions.render();
            } else {
                actions.close_frames_view();
                actions.deactivate_controls();
                actions.clear_preview();
            }

            actions.update_overlay_src();

            report.app.remove();
        });

        $root.on( 'gif-view-invert', function() {
            var status = actions.invert_preview();

            report.app.preview( status );
        });

        $root.on( 'gif-view-frames', function() {
            var status = actions.toggle_frames_view();

            report.app.frames( status );
        });

        $root.on( 'gif-update-speed', function( event, target ) {
            var value = actions.update_gif_speed( target );
            actions.render();

            report.app.speed( value );
        });

        $root.on( 'gif-update-overlay', function( event, target ) {
            var value = actions.update_overlay_opacity( target );

            report.app.overlay( value );
        });

        $root.on( 'gif-frames-render', function( event, target ) {
            actions.render();

            report.app.render();
        });

        $root.on( 'gif-frames-sort', function() {
            actions.render();

            report.app.sort();
        });

        $root.on( 'gif-download', function() {
            var details = actions.get_gif_details();

            report.app.download( details );
        });

        $root.on( 'gif-upload-files', function() {
            actions.upload_files();
        });

        $root.on( 'gif-upload-complete', function( event, status ) {
            console.log('complete');

            if ( !settings.controlsActive )
                actions.activate_controls();

            actions.update_overlay_src();
            actions.render();

            report.app.upload( status );
        });

        $(document).on( 'page-visibility-change', function( event, status ) {
            actions.stop_live( status );
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
        $root.on( 'change', '.js-file-upload', trigger.upload_files )




        // =========================
        // REPORTS
        // =========================

        var report = {
            'browser': {
                'userMedia'     : {
                    'accept'        : function() { ga('send', 'event', 'getUserMedia', 'accept') },
                    'reject'        : function(err) { ga('send', 'event', 'getUserMedia', 'reject', err ) },
                    'not_supported' : function() { ga('send', 'event', 'getUserMedia', 'not-supported') },
                },
            },
            'app' : {
                'capture'       : function() { ga('send', 'event', 'action', 'Capture Frame') },
                'delete'        : function() { ga('send', 'event', 'action', 'Delete GIF') },
                'remove'        : function() { ga('send', 'event', 'action', 'Remove Frame') },
                'render'        : function() { ga('send', 'event', 'action', 'Render GIF') },
                'frames'        : function( status ) { ga('send', 'event', 'action', 'Toggle Frames', status ) },
                'preview'       : function( status ) { ga('send', 'event', 'action', 'Invert Preview', status ) },
                'download'      : function( details ) { ga('send', 'event', 'action', 'Download GIF', details ) },
                'speed'         : function( value ) { ga('send', 'event', 'action', 'Update GIF Speed', value ) },
                'sort'          : function() { ga('send', 'event', 'action', 'Sort Frames' )},
                'overlay'       : function( value ) { ga('send', 'event', 'action', 'Toggle Overlay', value ) },
                'upload'        : function( value ) { ga('send', 'event', 'action', 'Upload Images', value )}
            }
        }




        // =========================
        // INITIALIZE
        // =========================

        function initalizeVideo() {
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
                    report.browser.userMedia.accept();
                }, function(){
                    actions.setup_upload_system();

                    report.browser.userMedia.reject();
                });
            } else {
                actions.setup_upload_system();

                report.getUserMedia.not_supported();
            }
        }


        var pageHidden = watchPageVisiblity();


        if ( ! pageHidden ) {
            initalizeVideo();
        }

    })(jQuery);

});
