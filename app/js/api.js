// Create an API object. Inherits ServiceClient functionality (see bottom.)
var api = {
    createCommand: function (frameId, commands, text, goToFrameId, flagsOn,
                             flagsOff, flagsRequired)
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
    
    getTopCommands: function (frameId) {
        this.simpleCall('get_top_commands', {frame: frameId});
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
    
    // simpleCall functionality. Used for setting call-specific success and
    // error handlers:
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

// Inherit functionality from ServiceClient.
ServiceClient.call(api, API_PATH);
