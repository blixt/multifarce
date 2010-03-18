// Create an API object. Inherits ServiceClient functionality (see bottom.)
var api = (function () {
    // simpleCall functionality. Used for setting call-specific success and
    // error handlers:
    // svc.success(loggedIn).error(failed).logIn('abc123', 'def456');
    // Also enables caching of requests.
    var
    cache = {},
    service,

    onSuccess,
    onSuccessBind,
    onError,
    onErrorBind,

    // cacheable should be the number of milliseconds to cache the data.
    simpleCall = function (action, args, cacheable) {
        if (cacheable) {
            var key = action, name, cacheObj;

            // Build a key unique to the current call.
            for (name in args) {
                key += '|!|' + name + ':' + args[name];
            }

            // Test if the current data is already cached.
            cacheObj = cache[key];
            if (cacheObj && +new Date() < cacheObj.expires) {
                if (cacheObj.data) {
                    // The data is cached.
                    if (onSuccess) {
                        // The temporary variables must be emptied before
                        // calling the onSuccess handler, since nested calls
                        // would behave differently otherwise.
                        var callback = onSuccess, bind = onSuccessBind;

                        onSuccess = undefined;
                        onSuccessBind = undefined;
                        onError = undefined;
                        onErrorBind = undefined;

                        callback.call(bind, cacheObj.data);
                        return;
                    }
                } else {
                    // The data is already being fetched, just queue the request
                    // and wait.
                    cacheObj.queue.push([onSuccess, onSuccessBind,
                                         onError, onErrorBind]);
                }
            } else {
                // The data is not cached (or has expired), create a new cache
                // object.
                cacheObj = cache[key] = {
                    queue: [[onSuccess, onSuccessBind, onError, onErrorBind]],
                    expires: +new Date() + cacheable
                };

                var queue = cacheObj.queue;

                // Request the data.
                service.call(action, args,
                // Success handler.
                function (data) {
                    cacheObj.data = data;
                    // Run queue (requests that were made during the fetch.)
                    for (var i = 0, item; i < queue.length; i++) {
                        item = queue[i];
                        if (item[0]) item[0].call(item[1], data);
                    }
                    queue.length = 0;
                },
                undefined,
                // Error handler.
                function (error) {
                    // Run queue (requests that were made during the fetch.)
                    for (var i = 0, item; i < queue.length; i++) {
                        item = queue[i];
                        if (item[2]) item[2].call(item[3], error);
                    }
                    // Remove cache object (never cache a failed request.)
                    delete cache[key];
                });
            }
        } else {
            service.call(action, args, onSuccess, onSuccessBind,
                         onError, onErrorBind);
        }

        onSuccess = undefined;
        onSuccessBind = undefined;
        onError = undefined;
        onErrorBind = undefined;
    };

    // multifarce-specific methods.
    service = {
        clean: function (command) {
            simpleCall('clean', {command: command});
        },

        createCommand: function (frameId, commands, text, goToFrameId, flagsOn,
                                 flagsOff, flagsRequired)
        {
            simpleCall('create_command', {
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
            simpleCall('create_frame', {
                title: title,
                text: text
            });
        },

        execute: function (frame, command, flags) {
            simpleCall('execute', {
                frame: frame,
                command: command,
                flags: flags
            }, 60000);
        },

        getCommand: function (commandId) {
            simpleCall('get_command', {command: commandId}, 120000);
        },

        getCommands: function (by) {
            simpleCall('get_commands', {by: by}, 120000);
        },

        getFirstFrame: function () {
            simpleCall('get_first_frame', {}, 600000);
        },

        getFrame: function (frameId) {
            simpleCall('get_frame', {frame: frameId}, 120000);
        },

        getFrames: function (by) {
            simpleCall('get_frames', {by: by}, 120000);
        },

        getStatus: function (path) {
            simpleCall('get_status', {path: path});
        },

        getTopCommands: function (frameId) {
            simpleCall('get_top_commands', {frame: frameId}, 120000);
        },

        getUserInfo: function (id) {
            simpleCall('get_user_info', {user: id}, 60000);
        },

        logIn: function (email, password) {
            simpleCall('log_in', {email: email, password: password});
        },

        logOut: function () {
            simpleCall('log_out', {});
        },

        register: function (email, displayName, password) {
            simpleCall('register', {
                email: email,
                display_name: displayName,
                password: password
            });
        },

        // More simpleCall functionality.
        error: function (setOnError, setOnErrorBind) {
            onError = setOnError;
            onErrorBind = setOnErrorBind;
            return this;
        },

        success: function (setOnSuccess, setOnSuccessBind) {
            onSuccess = setOnSuccess;
            onSuccessBind = setOnSuccessBind;
            return this;
        }
    };

    // Inherit functionality from ServiceClient.
    ServiceClient.call(service, API_PATH);

    return service;
})();
