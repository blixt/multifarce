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

            getFrame: function (frameId) {
                this.simpleCall('get_frame', {frame: frameId});
            },

            getStatus: function (path) {
                this.simpleCall('get_status', {path: path || '/'});
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

        // Constructor.
        cls = function (username) {
            EventSource.call(this, 'load');
            
            // Private members.
            var
            loaded = false,
            displayName,
            error = function () {
                this.clearHandlers();
                delete cache[username];
            },
            success = function (user) {
                displayName = user.display_name;
                loaded = true;
                this.raise('load');
            };
            
            // Getters/setters.
            this.get_displayName = function () { return displayName; };
            this.get_username = function () { return username; };
            this.isLoaded = function () { return loaded; };
            
            // Public members.
            this.reload = function () {
                api.success(success, this).error(error, this);
                api.getUserInfo(username);
            };
            
            this.reload();
        };

        // Public static members.
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
        
            var frameId, flags,
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
                this.raise('frame-load', frame);
            };

            // Execute the specified command for the current state.
            this.execute = function (command) {
                if (!command) return;
                api.error(execError, this).success(execSuccess, this);
                api.execute(frameId, command, flags);
            };

            // Initialize game.
            this.start = function (initFrameId, initFlags) {
                frameId = initFrameId || 1;
                flags = initFlags || [];
                
                api.success(frameSuccess, this).getFrame(frameId);
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
            homePage = $('#home'),
            registerPage = $('#register'),
            notFoundPage = $('#not-found'),
            notFoundPath = $('#not-found-path'),
            frameTitle = homePage.find('#current-frame h3'),
            frameText = homePage.find('#current-frame p.text'),
            frameAction = homePage.find('#action'),
            frameGo = homePage.find('#action-go'),
            frameLog = homePage.find('#log'),

            // Switcher for the pages.
            pages = new Switcher(homePage, registerPage, notFoundPage),
            
            // Helper function for executing a command.
            execute = function () {
                var command = frameAction.val();
                if (!command) return;
                game.execute(command);
                frameAction.val('');

                frameLog.prepend(
                    $('<p class="command"/>').text('> ' + command));
            },

            // Handler for viewing a command.
            CommandHandler = Application.handler(function (id) {
            }),

            // Handler for default page.
            HomeHandler = Application.handler(function () {
                frameAction.keydown(function (event) {
                    if (event.keyCode == 13) execute();
                });
                
                frameGo.click(execute);

                document.title = appTitle;
                pages.show(homePage);
            }),
            
            // Handler for creating a new command.
            NewCommandHandler = Application.handler(function () {
            }),
            
            // Handler for showing an error when something can't be found.
            NotFoundHandler = Application.handler(function () {
                document.title = 'Path not found! - ' + appTitle;
                notFoundPath.text(this.get_path());
                pages.show(notFoundPage);
            }),

            // Handler for letting a user register.
            RegisterHandler = Application.handler(function () {
            }),
            
            // Handler for user info page.
            UserHandler = Application.handler(function (username) {
            }),
            
            // Create application for handling the site.
            site = new Application([
                ['^$', HomeHandler],
                ['^commands/(\d+)$', CommandHandler],
                ['^commands/new$', NewCommandHandler],
                ['^user/([^/]+)$', UserHandler],
                ['^.*$', NotFoundHandler]
            ]);

            // Set up application to use hash as the path.
            $(document).hashchange(function (e, newHash) {
                site.exec(newHash);
            });
            $.hash.init();
            
            // Set up game.
            game.listen('frame-load', function (frame) {
                frameTitle.text(frame.title);
                frameText.text(frame.text);
                $('<p class="frame"/>')
                    .append('Entering ')
                    .append($('<strong/>').text(frame.title))
                    .append(':<br/>')
                    .append($('<em/>').text(frame.text))
                    .prependTo(frameLog);
            });
            
            game.listen('execute-error', function (error) {
                frameLog.prepend($('<p class="result"/>').text(error.message));
            });

            game.listen('execute-success', function (result) {
                frameLog.prepend($('<p class="result"/>').text(result.text));
            });
            
            game.start();
        },
        api: api,
        game: game,
        user: User
    };
})(Application, EventSource, Hash, jQuery, ServiceClient);

jQuery(Multifarce.init);