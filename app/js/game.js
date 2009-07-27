var game = (function () {
    var
    // Game state variables.
    frameId, frameTitle, flags,

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
    
    return {
        // Getters/setters.
        get_frameId: function () {
            return frameId;
        },
        
        get_frameTitle: function () {
            return frameTitle;
        },
        
        get_state: function () {
            return frameId + ',' + flags.join(',');
        },
        
        set_state: function (state) {
            var
            stateFlags = state.split(','),
            stateId = parseInt(stateFlags.shift(), 10);

            if (stateId && stateId != frameId) {
                // Remove empty flags.
                for (var i = stateFlags.length - 1; i > 0; i--) {
                    if (!stateFlags[i]) stateFlags.splice(i, 1);
                }

                this.start(stateId, stateFlags);
            }
        },

        // Execute the specified command for the current state.
        execute: function (command) {
            if (!command) return;
            
            if (!frameId) {
                this.raise('execute-error', {
                    message: 'The game has not been started!'});
                return;
            }

            api.error(execError, this).success(execSuccess, this);
            api.execute(frameId, command, flags);
        },

        // Initialize game.
        start: function (initFrameId, initFlags) {
            frameId = initFrameId || 0;
            flags = initFlags || [];
            
            api.success(frameSuccess, this);
            if (frameId > 0)
                api.getFrame(frameId);
            else
                api.getFirstFrame();
        }
    };
})();

// Add EventSource functionality to game instance.
EventSource.call(game, 'execute-success', 'execute-error', 'frame-load');
