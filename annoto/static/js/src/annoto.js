/* Javascript for AnnotoXBlock. */
function AnnotoXBlock(runtime, element, options) {
    var options = options;
    var getTokenUrl = runtime.handlerUrl(element, 'get_jwt_token');
    var element = $(element);
    var config;

    var factory = function() {
        $(function ($) {
            var videoElement;
            var annotoAuth = function(api) {
                var api = api;
                $.ajax({
                    url: getTokenUrl,
                    method: 'GET',
                    success: function(data) {
                        if (data.status == 'ok') {
                            api.auth(data.token);
                        } else {
                            window.console && console.log('[Annoto] ERROR: ', data.msg);
                            element.find('.annoto-block').html('Error loading Annoto XBlock.');
                        }
                    }
                });
            };

            var setupAnnoto = function (e) {
                var el = $(e.target);
                var annotoElement = {
                    'openedx': el.attr('id'),
                    'page': document.body
                };
                
                window.console && console.log("AnnotoxBlock: Annoto Element is: ");
                window.console && console.log(annotoElement[options.objectType]);
                var zIndex = {
                    'openedx': 100,
                    'page': 1000
                };
                var horizontalAlign = options.objectType == 'page' && 'screen_edge' || options.overlayVideo && 'inner' || 'element_edge';
                var openOnLoad = true;
                var enableTabs = true;
                var videoWrapper;

                if (horizontalAlign === 'inner') {
                    videoWrapper = el.find('div.video-wrapper')[0];
                    openOnLoad = false;
                    enableTabs = false;
                }

                if (options.initialState !== 'auto') {
                    openOnLoad = !!(options.initialState === 'open');
                }

                if (options.tabs !== 'auto') {
                    enableTabs = !!(options.tabs === 'enabled');
                }

                window.console && console.log("AnnotoxBlock: Object Type is: " + options.objectType);
                window.console && console.log("AnnotoxBlock: Element is: " + annotoElement[options.objectType]);
                
                config = {
                    clientId: options.clientId,
                    position: options.horizontal,
                    relativePositionElement: videoWrapper,
                    features: {
                        tabs: enableTabs,
                        comments: options.comments,
                        privateNotes: options.privateNotes,
                        timeline: options.comments || options.privateNotes
                    },
                    locale: options.language,
                    rtl: options.rtl,
                    align: {
                        vertical: options.vertical,
                        horizontal: horizontalAlign,
                    },
                    width: {
                        max: 400,
                    },
                    zIndex: zIndex[options.objectType],
                    widgets: [
                        {
                            player: {
                                type: options.objectType,
                                element: annotoElement[options.objectType],
                                params: {
                                    isLive: options.isLive
                                },
                                mediaDetails: function(details) {
                                    var extendedDetails = {
                                        title: options.mediaTitle,
                                        group: {
                                            id: options.courseId,
                                            title: options.courseDisplayName,
                                            description: options.courseDescription,
                                            thumbnails: {
                                                default: window.location.origin + options.courseImage
                                            },
                                            privateThread: options.privateThread
                                        }
                                    }
                                    if (details) {
                                        extendedDetails.authorName = details.authorName;
                                        extendedDetails.description = details.description;
                                    }
                                    return extendedDetails;
                                }
                            },
                            openOnLoad: openOnLoad,
                            kukuCloseOnLoad: true,
                            timeline: {
                                overlayVideo: (options.objectType == 'openedx'),
                            }
                        },
                    ],
                    demoMode: options.demoMode
                };

                if (options.objectType == 'page') {
                    config['margins'] = {
                        bottom: 16,
                        right: 32,
                        rightSmall: 16
                    };
                    config.widgets[0].player['mediaSrc'] = function() {
                        return location.href;
                    };
                }

                Annoto.annotoApi ? loadChatPlugin(): initChatPlugin();

            };

            var initChatPlugin = function (e) {
                Annoto.on('ready', function (api) {
                    Annoto.annotoApi = api;
                    annotoAuth(api);
                });
                
                Annoto.boot(config);
            };

            var loadChatPlugin = function (e) {
                Annoto.annotoApi.close().then( function(){    
                    Annoto.annotoApi.load(config, function(err) {
                        if (err) {
                            window.console && console.log('Annoto XBlock: Error while reloading Annoto configuration');
                            return;
                        }
                        window.console && console.log('Annoto xBlock: Loaded new Configuration!');
                    });
                });
            };


            if (options.videoBlockID) {
                window.console && console.log("AnnotoxBlock: videoBlockID is: " + options.videoBlockID);
                videoElement = $('#video_' + options.videoBlockID);
                videoElement = videoElement.length && videoElement || undefined;
                window.console && console.log("AnnotoxBlock: videoElement is: ");
                window.console && console.log(videoElement);

            }
            videoElement = videoElement || $('.xmodule_VideoBlock .video, .xmodule_VideoModule .video');

            if (options.objectType == 'openedx') {
                window.console && console.log("AnnotoxBlock: videoElement is: ");
                window.console && console.log(videoElement);

                videoElement.first().on('ready', setupAnnoto);
            } else {
                setupAnnoto($(document));
            }
        });
    };

    try {
        if (typeof require == 'function' && typeof Annoto != 'object') {
            require(['//app.annoto.net/annoto-bootstrap.js'], function(Annoto) {
                factory();
            });
        } else {
            factory();
        }
    } catch (err) {
        element.find('.annoto-block').html('Error loading Annoto XBlock.');
        throw err;
    }
}
