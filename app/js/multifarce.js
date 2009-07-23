/*!
 * Copyright (c) 2009 Andreas Blixt <andreas@blixt.org>
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy
 * of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 * 
 * multifarce client library
 * Dependencies: Application, EventSource, Hash, jQuery, jQuery hash plugin,
 *               ServiceClient
 */
/*
 * jQuery Easing v1.3 - http://gsgd.co.uk/sandbox/jquery/easing/
 *
 * Uses the built in easing capabilities added In jQuery 1.1
 * to offer multiple easing options
 *
 * TERMS OF USE - jQuery Easing
 * 
 * Open source under the BSD License. 
 * 
 * Copyright © 2008 George McGinley Smith
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 * 
 * Redistributions of source code must retain the above copyright notice, this
 *   list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice,
 *   this list of conditions and the following disclaimer in the documentation
 *   and/or other materials provided with the distribution.
 * 
 * Neither the name of the author nor the names of contributors may be used to
 * endorse or promote products derived from this software without specific prior
 * written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE. 
 */

// Add easeInQuart easing (see copyright notice above.)
jQuery.easing.easeInQuart = function (x, t, b, c, d) {
    return c * (t /= d) * t * t * t + b;
};

// Extend jQuery with a simple function for inserting formatted text.
jQuery.fn.formattedText = function (text) {
    var html = '<p>' + this.text(text).html() + '</p>';
    html = html.replace(/\*([^*\r\n]+)\*/g, '<strong>$1</strong>');
    html = html.replace(/_([^_\r\n]+)_/g, '<em>$1</em>');
    html = html.replace(/(\r\n|[\r\n]){2,}/g, '</p><p>');
    html = html.replace(/(\r\n|[\r\n])/g, '<br/>');
    return this.html(html);
};

// Returns true if an element has one or more events of the specified type.
jQuery.fn.hasEvent = function (type) {
    var events = this.data('events');
    return events && events[type];
};

// Multifarce namespace.
var Multifarce = (function (Application, EventSource, Hash, $, ServiceClient) {
    var
    // The title of the application.
    appTitle = 'multifarce',
    
    // Helper class for showing one element from a set of elements at a time.
    // All arguments are assumed to be jQuery selections of a single element.
    Switcher = function () {
        // Show the first element, hide the rest.
        var shown = arguments[0], i;
        for (i = 1; i < arguments.length; i++) {
            arguments[i].remove();
        }

        this.current = function (which) {
            if (which) return which == shown;
            return shown;
        };

        this.show = function (which) {
            if (shown == which) return;
            shown.replaceWith(which);
            shown = which;
        };
    },

    // multifarce-specific ServiceClient.
    Client = (function () {
        // Constructor.
        var cls = function () {
            // Inherit functionality from ServiceClient.
            ServiceClient.call(this, '/api/');
        };

        // Shared public members.
        cls.prototype = {
            createCommand: function (frameId, commands, text, goToFrameId,
                                     flagsOn, flagsOff, flagsRequired)
            {
                this.simpleCall('create_command', {
                    frame: frameId,
                    commands: commands,
                    text: text,
                    go_to_frame: goToFrameId,
                    flags_on: flagsOn,
                    flags_off: flagsOff,
                    flags_required: flagsRequired
                });
            },
            
            createFrame: function (title, text) {
                this.simpleCall('create_frame', {
                    title: title,
                    text: text
                });
            },

            execute: function (frame, command, flags) {
                this.simpleCall('execute', {
                    frame: frame,
                    command: command,
                    flags: flags
                });
            },

            getCommand: function (commandId) {
                this.simpleCall('get_command', {command: commandId});
            },

            getFirstFrame: function () {
                this.simpleCall('get_first_frame', {});
            },

            getFrame: function (frameId) {
                this.simpleCall('get_frame', {frame: frameId});
            },

            getFrames: function () {
                this.simpleCall('get_frames', {});
            },

            getStatus: function (path) {
                this.simpleCall('get_status', {path: path});
            },
            
            getUserInfo: function (username) {
                this.simpleCall('get_user_info', {user: username});
            },
            
            logIn: function (username, password) {
                this.simpleCall('log_in', {username: username,
                                           password: password});
            },
            
            logOut: function () {
                this.simpleCall('log_out', {});
            },
            
            register: function (username, displayName, password, email) {
                this.simpleCall('register', {
                    username: username,
                    display_name: displayName,
                    password: password,
                    email: email
                });
            },
            
            // simpleCall functionality. Used for setting call-specific success
            // and error handlers:
            // svc.success(loggedIn).error(failed).logIn('abc123', 'def456');
            onSuccess: null,
            onSuccessBind: null,
            onError: null,
            onErrorBind: null,
            
            error: function (onError, onErrorBind) {
                this.onError = onError;
                this.onErrorBind = onErrorBind;
                return this;
            },
            
            success: function (onSuccess, onSuccessBind) {
                this.onSuccess = onSuccess;
                this.onSuccessBind = onSuccessBind;
                return this;
            },

            simpleCall: function (action, args) {
                this.call(action, args, this.onSuccess, this.onSuccessBind,
                          this.onError, this.onErrorBind);
                this.onSuccess = null;
                this.onSuccessBind = null;
                this.onError = null;
                this.onErrorBind = null;
            }
        };

        return cls;
    })(),

    api = new Client(),
    
    User = (function () {
        // Private static members.
        var
        cache = {},
        currentUser,

        // Constructor.
        cls = function (username) {
            EventSource.call(this, 'load');
            
            // Private members.
            var loaded = false, data, error, success;

            error = function () {
                this.clearHandlers();
                if (username) delete cache[username];
            };
            
            success = function (user) {
                data = user;
                loaded = true;
                this.raise('load');
            };
            
            // Getters/setters.
            this.get_displayName = function () { return data.display_name; };
            this.get_emailHash = function () { return data.email_md5; };
            this.get_username = function () { return data.username; };
            this.isCurrent = function () { return this == currentUser; };
            this.isLoaded = function () { return loaded; };
            
            if (!username) {
                this.get_email = function () { return data.email; };
                this.get_googleEmail = function () {
                    return data.google_email;
                };
                this.get_googleLogUrl = function () {
                    return data.google_login || data.google_logout;
                };
                this.get_googleNickname = function () {
                    return data.google_nickname;
                };
                this.get_type = function () { return data.type; };

                this.googleLoggedIn = function () {
                    return data.google_logged_in;
                };
                this.loggedIn = function () { return data.logged_in; };
            }
            
            // Public members.
            this.load = function () {
                api.success(success, this).error(error, this);

                if (username)
                    api.getUserInfo(username);
                else
                    api.getStatus();
            };
        };

        // Public static members.
        cls.current = function () {
            if (!currentUser) currentUser = new cls();
            return currentUser;
        };
        
        cls.get = function (username) {
            if (typeof username != 'string')
                throw 'Invalid type (username); expected string.';

            if (username in cache) {
                return cache[username];
            } else {
                cache[username] = new cls(username);
            }
        };

        return cls;
    })(),
    
    Game = (function () {
        var cls = function (api) {
            // Register events.
            EventSource.call(this,
                'execute-success', 'execute-error', 'frame-load');
        
            var frameId, frameTitle, flags,
            // Handle failed execute calls.
            execError = function (error) {
                this.raise('execute-error', error);
            },
            // Handle successful execute calls.
            execSuccess = function (result) {
                if (result.frame_id != frameId) {
                    frameId = result.frame_id;
                    api.success(frameSuccess, this).getFrame(frameId);
                }
                flags = result.flags;
                this.raise('execute-success', result);
            },
            // Handle successful getFrame calls.
            frameSuccess = function (frame) {
                frameId = frame.id;
                frameTitle = frame.title;
                this.raise('frame-load', frame);
            };
            
            // Getters/setters.
            this.get_frameId = function () {
                return frameId;
            };
            
            this.get_frameTitle = function () {
                return frameTitle;
            };
            
            this.get_state = function () {
                return frameId + ',' + flags.join(',');
            };
            
            this.set_state = function (state) {
                var
                stateFlags = state.split(','),
                stateId = parseInt(stateFlags.shift(), 10);

                if (stateId && stateId != frameId) {
                    // Remove empty flags.
                    for (var i = stateFlags.length - 1; i > 0; i--) {
                        if (!stateFlags[i]) stateFlags.splice(i, 1);
                    }

                    game.start(stateId, stateFlags);
                }
            };

            // Execute the specified command for the current state.
            this.execute = function (command) {
                if (!command) return;
                
                if (!frameId) {
                    this.raise('execute-error', {
                        message: 'The game has not been started!'});
                    return;
                }

                api.error(execError, this).success(execSuccess, this);
                api.execute(frameId, command, flags);
            };

            // Initialize game.
            this.start = function (initFrameId, initFlags) {
                frameId = initFrameId || 0;
                flags = initFlags || [];
                
                api.success(frameSuccess, this);
                if (frameId > 0)
                    api.getFrame(frameId);
                else
                    api.getFirstFrame();
            };
        };
        
        return cls;
    })(),
    
    // Game handler object.
    game = new Game(api);
    
    return {
        init: function () {
            var
            // Page elements.
            allPages = $('div.page'),
            
            notifications = $('#notifications'),
            pageName = $('#page-name'),
            username = $('#username'),
            avatar = $('#avatar img'),
            
            homePage = $('#home'),
            frame = homePage.find('#current-frame'),
            frameTitle = frame.find('h3'),
            frameText = frame.find('div.text'),
            frameAction = homePage.find('#action'),
            frameGo = homePage.find('#action-go'),
            frameLog = homePage.find('#log'),

            logInPage = $('#log-in'),

            newCommandPage = $('#new-command'),
            newCommandFrame = $('#new-command-frame'),
            newCommand1 = $('#new-command-1'),
            newCommand2 = $('#new-command-2'),
            newCommand3 = $('#new-command-3'),
            newCommand4 = $('#new-command-4'),
            newCommand5 = $('#new-command-5'),
            newCommandText = $('#new-command-text'),
            newCommandGoToFrame = $('#new-command-go-to-frame'),
            newCommandCreate = $('#new-command-create'),

            newFramePage = $('#new-frame'),
            newFrameTitle = $('#new-frame-title'),
            newFrameText = $('#new-frame-text'),
            newFrameCreate = $('#new-frame-create'),

            notFoundPage = $('#not-found'),
            notFoundPath = $('#not-found-path'),

            registerPage = $('#register'),

            // Switcher for the pages.
            pages = new Switcher(homePage, logInPage, newCommandPage,
                                 newFramePage, notFoundPage, registerPage),

            // Get current user.
            currentUser = User.current(),

            // Helper function for setting the current page.
            setPage = function (title, pageElement) {
                if (title) {
                    pageName.text(title);
                    document.title = title + ' - ' + appTitle;
                }
                if (pageElement) pages.show(pageElement);
            },

            // Helper function for executing a command.
            execute = function () {
                var command = frameAction.val();
                if (!command) return;

                frameAction.val('');
                frameLog.prepend(
                    $('<div class="command"/>').text('> ' + command));

                if (command == 'reset' || command == 'start') {
                    frameLog.prepend(
                        $('<div class="result"/>').text('Starting...'));
                    game.start();
                } else {
                    game.execute(command);
                }
                
                frameAction.focus();
            },
            
            // Helper function for showing a notification.
            notify = function (text, type) {
                notifications.empty();
                notifications.append(
                    $('<p/>')
                        .addClass(type || 'message')
                        .append(
                            $('<a href="#"/>')
                                .click(
                                    function () {
                                        $(this).closest('p').remove();
                                        return false;
                                    })
                                .text(text))
                        .hide()
                        .fadeIn(500)
                        .animate({opacity: 0}, 15000, 'easeInQuart',
                            function () {
                                $(this).remove();
                            }));
           },

            // Handler for viewing a command.
            CommandHandler = Application.handler(function (id) {
            }),

            // Handler for default page.
            HomeHandler = Application.handler(function () {
                var
                curFrameId = game.get_frameId(),
                state = this.get_param('state');

                // Handle state.
                if (state) {
                    game.set_state(state);
                } else if (curFrameId > 0) {
                    $.hash.go('?state=' + game.get_state());
                }

                setPage(game.get_frameTitle(), homePage);

                if (!frameAction.hasEvent('keydown')) {
                    frameAction.keydown(function (event) {
                        if (event.keyCode == 13) execute();
                    });
                
                    frameGo.click(execute);
                }
            }),
            
            // Handler for letting a user log in.
            LogInHandler = Application.handler(function () {
                setPage('Log in', logInPage);
            }),

            // Handler for creating a new command.
            NewCommandHandler = Application.handler(function () {
                newCommandFrame.find('option').remove();
                newCommandGoToFrame.find('option').remove();
                
                api.success(function (frames) {
                    for (var i = 0; i < frames.length; i++) {
                        newCommandFrame.append($('<option/>').val(frames[i].id).text(frames[i].title));
                        newCommandGoToFrame.append($('<option/>').val(frames[i].id).text(frames[i].title));
                    }
                }).getFrames();

                setPage('Creating new command', newCommandPage);

                newCommandCreate.click(function () {
                    var commands = [];
                    
                    if (newCommand1.val()) commands.push(newCommand1.val());
                    if (newCommand2.val()) commands.push(newCommand2.val());
                    if (newCommand3.val()) commands.push(newCommand3.val());
                    if (newCommand4.val()) commands.push(newCommand4.val());
                    if (newCommand5.val()) commands.push(newCommand5.val());
                    
                    api.success(function(){alert('Success!')}).createCommand(
                        parseInt(newCommandFrame.val()),
                        commands,
                        newCommandText.val(),
                        parseInt(newCommandGoToFrame.val()));
                });
            }),

            NewFrameHandler = Application.handler(function () {
                setPage('Creating new frame', newFramePage);

                newFrameCreate.click(function () {
                    api.success(function(){alert('Success!')}).createFrame(
                        newFrameTitle.val(),
                        newFrameText.val()
                    );
                });
            });

            // Handler for showing an error when something can't be found.
            NotFoundHandler = Application.handler(function () {
                notFoundPath.text(this.get_path());

                setPage('Path not found!', notFoundPage);
            }),

            // Handler for letting a user register.
            RegisterHandler = Application.handler(function () {
                setPage('Register', registerPage);
            }),
            
            // Handler for user info page.
            UserHandler = Application.handler(function (username) {
            }),
            
            // Create application for handling the site.
            site = new Application([
                ['^$', HomeHandler],
                ['^commands/(\d+)$', CommandHandler],
                ['^commands/new$', NewCommandHandler],
                ['^frames/new$', NewFrameHandler],
                ['^log-in$', LogInHandler],
                ['^register$', RegisterHandler],
                ['^user/([^/]+)$', UserHandler],
                ['^.*$', NotFoundHandler]
            ]);

            // Set up application to use hash as the path.
            $(document).hashchange(function (e, newHash) {
                site.exec(newHash);
            });
            $.hash.init();
            
            // Handle current user.
            currentUser.listen('load', function () {
                if (this.loggedIn()) {
                    username.text(this.get_displayName());
                    avatar.attr('src',
                        'http://www.gravatar.com/avatar/' +
                        this.get_emailHash() + '?s=28&d=identicon&r=PG');
                }
                
                // Handle Google Accounts notices.
                if (this.googleLoggedIn()) {
                    // TODO: Change this code so that the Google notices appear
                    //       if the user logs out of Google Accounts.
                    allPages.find('div.google-accounts').remove();
                } else {
                    allPages.find('a.google-accounts')
                        .attr('href', this.get_googleLogUrl());
                }
            });
            
            currentUser.load();
            
            // Set up game.
            game.listen('frame-load', function (data) {
                if (game.get_frameId()) $.hash.go('?state=' + game.get_state());

                // Update title.
                setPage(data.title, homePage);

                // Animate the frame display to show the new frame.
                frame.stop(true)
                     .animate({height: 0, opacity: 0}, 400)
                     .queue(function () {
                        frameTitle.text(data.title);
                        frameText.formattedText(data.text);
                        
                        // Calculate new height that the frame will expand to.
                        frame.css({
                            position: 'absolute',
                            height: 'auto'
                        });

                        // Queue animation to that height.
                        frame.animate({
                            height: frame.height(),
                            opacity: 1
                        }, 1000);
                        
                        // Reset height.
                        frame.css({
                            height: 0,
                            position: 'static'
                        });

                        frame.dequeue();
                     });

                // Add an entry to the log.
                frameLog.prepend(
                    $('<div class="frame"/>')
                        .append($('<p class="entering"/>')
                            .append('Entering ')
                            .append($('<strong/>').text(data.title)))
                        .append($('<div/>')
                            .formattedText(data.text)));
            });
            
            // Handle execution errors.
            game.listen('execute-error', function (error) {
                // Show a notification.
                notify(error.message, 'error');

                // Add an entry to the log.
                frameLog.prepend(
                    $('<div class="result"/>').text(error.message));
            });

            // Handle execution success.
            game.listen('execute-success', function (result) {
                // When a command has been called, update the state parameter.
                $.hash.go('?state=' + game.get_state());

                // Show a notification.
                notify(result.text, 'success');

                // Add an entry to the log.
                frameLog.prepend(
                    $('<div class="result"/>').text(result.text));
            });
            
            // Focus on the input field.
            frameAction.focus();
        },
        api: api,
        game: game,
        user: User
    };
})(Application, EventSource, Hash, jQuery, ServiceClient);

jQuery(Multifarce.init);