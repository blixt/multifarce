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
    // multifarce-specific ServiceClient.
    Client = (function () {
        // Constructor.
        var cls = function () {
            // Inherit functionality from ServiceClient.
            ServiceClient.call(this, '/api/');
        };

        // Shared public members.
        cls.prototype = {
            createCommand: function (frameId, commands, text, newFrameTitle,
                                     newFrameText, flagsOn, flagsOff,
                                     flagsRequired)
            {
                this.simpleCall('create_command', {
                    frame_id: frameId,
                    commands: commands,
                    text: text,
                    new_frame_title: newFrameTitle,
                    new_frame_text: newFrameText,
                    flags_on: flagsOn,
                    flags_off: flagsOff,
                    flags_required: flagsRequired
                });
            },

            execute: function (command) {
                this.simpleCall('execute', {command: command});
            },

            getFrame: function (frameId) {
                this.simpleCall('get_frame', {frame_id: frameId});
            },

            getStatus: function () {
                this.simpleCall('status', {});
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

    User = (function () {
        // Constructor.
        var cls = function (service, username) {
            EventSource.call(this, 'load');
            
            // Private members.
            var
            loaded = false,
            displayName,
            success = function (user) {
                displayName = user.display_name;
                this.raise('load');
            };
            
            // Getters/setters.
            this.get_displayName = function () { return displayName; };
            this.get_username = function () { return username; };
            
            // Public members.
            this.reload = function () {
                service.success(success, this).getUserInfo(username);
            };
            
            this.reload();
        };

        return cls;
    })(),
    
    // Handler for default page.
    HomeHandler = Application.handler(function () {
        alert('Home, sweet home!');
    }),
    
    // Handler for user info page.
    UserHandler = Application.handler(function (username) {
        alert('User: ' + username);
    }),
    
    // Create application for handling the site.
    site = new Application([
        ['^$', HomeHandler],
        ['^user/([^/]+)$', UserHandler]
    ]);

    // Set up application to use hash as the path.
    $(document).hashchange(function (e, newHash) {
        site.exec(newHash);
    });
    $.hash.init();

    return {
        client: Client,
        user: User
    };
})(Application, EventSource, Hash, jQuery, ServiceClient);
