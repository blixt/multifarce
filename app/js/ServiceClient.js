/*!
 * Copyright (c) 2009 Andreas Blixt <andreas@blixt.org>
 * This and more JavaScript libraries: http://blixt.org/js
 * MIT License: http://www.opensource.org/licenses/mit-license.php
 * 
 * Service client library (Depends on jQuery, JSON)
 * Handles communication with an API through simple HTTP requests.
 */

var ServiceClient = (function (jQuery, JSON) {
    // Private static members.
    var
    ajaxError = function (state, options, xhr, status) {
        if (status != 'timeout') return;
        
        state.attempts++;
        if (state.attempts < 3) {
            jQuery.ajax(options);
        } else {
            var response = {
                message: 'The request failed after ' + state.attempts +
                         ' attempt(s).',
                type: 'JavaScriptError'};
            if (state.onError)
                state.onError.call(state.bindError || state.bind, response);
            else
                alert(response.type + ': ' + response.message);
        }
    },

    ajaxSuccess = function (state, data) {
        switch (data.status) {
            case 'error':
                if (state.onError)
                    state.onError.call(state.bindError || state.bind,
                                       data.response);
                else
                    alert(data.response.type + ': ' + data.response.message);
                break;
            case 'list':
                break;
            case 'success':
                if (state.onSuccess)
                    state.onSuccess.call(state.bind, data.response);
                break;
            default:
                alert('Unknown status: ' + data.status);
                break;
        }
    },

    // Constructor.
	cls = function (path) {
        // Private members.
		var
		attempts,
        errorHandler = null,
        errorBind = null,
		queue = [],
		running = false;

        // Getters and setters.
        this.set_errorHandler = function (func, bind) {
            if (func === null) {
                errorHandler = null;
                return;
            }
            
            if (typeof func != 'function')
                throw 'Type error (func); expected function or null.';
            if (typeof bind != 'object')
                throw 'Type error (bind); expected object.';
            
            errorHandler = func;
            errorBind = bind;
        };

		this.get_path = function () { return path; };

        // Public functions accessing private members.
        this.call = function (action, args, onSuccess, bind,
                              onError, bindError)
        {
            if (typeof action != 'string')
                throw 'Type error (action); expected string.';

            // Queue request for later if another request is already running.
            if (running) {
                queue[queue.length] = arguments;
                return;
            }

            // Set running flag.
            running = true;

            // Create a state object that keeps track of this request.
            var state = {
                attempts: 0,
                bind: bind,
                bindError: bindError || errorBind,
                onError: onError || errorHandler,
                onSuccess: onSuccess
            };

            // Build query parameters.
            var q = [];
            for (var key in args) {
                var json = JSON.dumps(args[key]);
                if (json) q[q.length] = key + '=' + encodeURIComponent(json);
            }

            // Initiate request.
            var c = this;
            jQuery.ajax({
                cache: false,
                complete: function () {
                    running = false;
                    if (queue.length > 0) c.call.apply(c, queue.shift());
                },
                data: q.join('&'),
                dataType: 'json',
                error: function (xhr, status) {
                    ajaxError(state, this, xhr, status);
                },
                success: function (data) {
                    ajaxSuccess(state, data);
                },
                timeout: 3000,
                url: path + action
            });
        };
	};

	return cls;
})(jQuery, JSON);
