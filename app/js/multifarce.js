/*!
 * Copyright (c) 2009 Andreas Blixt <andreas@blixt.org>
 * This and more JavaScript libraries: http://blixt.org/js
 * MIT License: http://www.opensource.org/licenses/mit-license.php
 * 
 * Event source "class"
 * Adds event functionality to an object.
 */
/* Example:
 *     // Add functionality to an object like this:
 *     EventSource.call(obj, 'list', 'of', 'events');
 *     // Listen for events like this:
 *     var handler = function (data) { alert(data); };
 *     obj.listen('list', handler);
 *     // Raise an event like this:
 *     obj.raise('list', 'Hello world!');
 *     // To stop listening to an event:
 *     obj.unlisten('list', handler);
 *     
 *     // Event functionality can of course be kept in a separate object:
 *     obj.event = new EventSource('list', 'of', 'events');
 *     obj.event.listen('list', handler);
 *     obj.event.raise('list', 'Hello world!');
 */

var EventSource = function () {
    // Private members.
    var events = {}, args = arguments, i, l, name,
    slice = Array.prototype.slice;

    for (i = 0, l = args.length; i < l; i++) {
        name = args[i];
        if (typeof name != 'string')
            throw 'Type error (argument); expected string.';
        events[name] = [];
    }
    
    // Public members.
    this.clearHandlers = function (event) {
        if (event) {
            if (typeof event != 'string')
                throw 'Type error (event); expected string.';
            if (!(event in events))
                throw 'Unsupported event: ' + event;

            events[event].length = 0;
        } else {
            for (var e in events) {
                events[e].length = 0;
            }
        }
    };
    
    this.listen = function (event, handler, bind) {
        if (typeof event != 'string')
            throw 'Type error (event); expected string.';
        if (!(event in events))
            throw 'Unsupported event: ' + event;
        if (typeof handler != 'function')
            throw 'Type error (handler); expected function.';
        
        events[event].push([handler, bind || this]);
    };
    
    this.raise = function (event) {
        // No validation for the sake of performance.
        var e = events[event], i, l, args = slice.call(arguments, 1);
        for (i = 0, l = e.length; i < l; i++)
            e[i][0].apply(e[i][1], args);
    };
    
    this.unlisten = function (event, handler, bind) {
        if (typeof event != 'string')
            throw 'Type error (event); expected string.';
        if (!(event in events))
            throw 'Unsupported event: ' + event;
        
        var e = events[event], i;
        for (i = e.length - 1; i >= 0; i--) {
            if (e[i][0] == handler) {
                if (bind && bind != e[i][1]) continue;
                e.splice(i, 1);
            }
        }
    };
};

/*!
 * Copyright (c) 2009 Andreas Blixt <andreas@blixt.org>
 * This and more JavaScript libraries: http://blixt.org/js
 * MIT License: http://www.opensource.org/licenses/mit-license.php
 * 
 * Hash handler
 * Keeps track of the history of changes to the hash part in the address bar.
 */
/* WARNING for Internet Explorer 7 and below:
 * If an element on the page has the same ID as the hash used, the history will
 * get messed up.
 *
 * Does not support history in Safari 2 and below.
 * 
 * Example:
 *     function handler(newHash) {
 *         alert('Hash changed to "' + newHash + '"');
 *     }
 *     Hash.init(handler, document.getElementById('hidden-iframe'));
 *     Hash.go('abc123');
 */

var Hash = (function () {
var
// Import globals
window = this,
documentMode = document.documentMode,
history = window.history,
location = window.location,
undefined,
// Plugin variables
callback, hash,
// IE-specific
iframe,

getHash = function () {
    // Internet Explorer 6 (and possibly other browsers) extracts the query
    // string out of the location.hash property into the location.search
    // property, so we can't rely on it. The location.search property can't be
    // relied on either, since if the URL contains a real query string, that's
    // what it will be set to. The only way to get the whole hash is to parse
    // it from the location.href property.
    //
    // Another thing to note is that in Internet Explorer 6 and 7 (and possibly
    // other browsers), subsequent hashes are removed from the location.href
    // (and location.hash) property if the location.search property is set.
    if (!location.search) return location.hash.substr(1);
    var index = location.href.indexOf('#');
    return (index == -1 ? '' : location.href.substr(index + 1));
},

// Used by all browsers except Internet Explorer 7 and below.
poll = function () {
    var curHash = getHash();
    if (curHash != hash) {
        hash = curHash;
        callback(curHash);
    }
},

// Used to create a history entry with a value in the iframe.
setIframe = function (newHash) {
    try {
        var doc = iframe.contentWindow.document;
        doc.open();
        doc.write('<html><body>' + newHash + '</body></html>');
        doc.close();
        hash = newHash;
    } catch (e) {
        setTimeout(function () { setIframe(newHash); }, 10);
    }
},

// Used by Internet Explorer 7 and below to set up an iframe that keeps track
// of history changes.
setUpIframe = function () {
    // Don't run until access to the iframe is allowed.
    try {
        iframe.contentWindow.document;
    } catch (e) {
        setTimeout(setUpIframe, 10);
        return;
    }

    // Create a history entry for the initial state.
    setIframe(hash);
    var data = hash;

    setInterval(function () {
        var curData, curHash;

        try {
            curData = iframe.contentWindow.document.body.innerText;
            if (curData != data) {
                data = curData;
                location.hash = hash = curData;
                callback(curData);
            } else {
                curHash = getHash();
                if (curHash != hash) setIframe(curHash);
            }
        } catch (e) {
        }
    }, 50);
};

return {
    init: function (cb, ifr) {
        // init can only be called once.
        if (callback) return;

        callback = cb;

        // Keep track of the hash value.
        hash = getHash();
        cb(hash);

        // Run specific code for Internet Explorer.
        if (window.ActiveXObject) {
            if (!documentMode || documentMode < 8) {
                // Internet Explorer 5.5/6/7 need an iframe for history
                // support.
                iframe = ifr;
                setUpIframe();
            } else  {
                // Internet Explorer 8 has onhashchange event.
                window.attachEvent('onhashchange', poll);
            }
        } else {
            // Change Opera navigation mode to improve history support.
            if (history.navigationMode !== undefined)
                history.navigationMode = 'compatible';

            setInterval(poll, 50);
        }
    },

    go: function (newHash) {
        // Cancel if the new hash is the same as the current one, since there
        // is no cross-browser way to keep track of navigation to the exact
        // same hash multiple times in a row. A wrapper can handle this by
        // adding an incrementing counter to the end of the hash.
        if (newHash == hash) return;
        if (iframe) {
            setIframe(newHash);
        } else {
            location.hash = hash = newHash;
            callback(newHash);
        }
    }
};
})();
/*!
 * Copyright (c) 2009 Andreas Blixt <andreas@blixt.org>
 * This and more JavaScript libraries: http://blixt.org/js
 * MIT License: http://www.opensource.org/licenses/mit-license.php
 * 
 * Simple JSON encoder/decoder
 * Encodes/decodes JavaScript values as JSON (see http://json.org/)
 */
/* Example:
 *     var json = JSON.stringify({abc: 123, def: "ghi", jkl: [4, 5, 6]});
 *     // Same result as:
 *     var json = '{"abc":123,"def":"ghi","jkl":[4,5,6]}';
 */

// Prevent hiding the native JSON object in browsers that support it.
if (!JSON) {
var JSON = (function () {
    var
    // Missing \u2060-\u206f which won't parse in older Opera browsers.
    escapable = new RegExp('[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f' +
                           '\u17b4\u17b5\u200c-\u200f\u2028-\u202f\ufeff' +
                           '\ufff0-\uffff]', 'g'),
    special = {'\b': '\\b', '\t': '\\t', '\n': '\\n', '\f': '\\f', '\r': '\\r',
               '"' : '\\"', '\\': '\\\\'},

    replace = function (chr) {
        return special[chr] || '\\u' + ('000' +
               chr.charCodeAt(0).toString(16)).slice(-4);
    };

    return {
        // Takes a value and returns its JSON representation, or null if the
        // value could not be converted to JSON.
        stringify: function (value) {
            switch (typeof value) {
                case 'string':
                    return '"' + value.replace(escapable, replace) + '"';
                case 'object':
                    if (value == null) return 'null';

                    var v = [], json, i, l, p;

                    if (value instanceof Array) {
                        for (i = 0, l = value.length; i < l; i++) {
                            if ((json = JSON.stringify(value[i])) != null)
                                v[v.length] = json;
                        }
                        return '[' + v + ']';
                    }

                    for (p in value) {
                        if ((json = JSON.stringify(value[p])) != null)
                            v[v.length] = JSON.stringify(p) + ':' + json;
                    }
                    return '{' + v + '}';
                case 'number':
                    return isFinite(value) ? String(value) : 'null';
                case 'boolean':
                    return String(value);
            }

            return null;
        },
        // Loads the JSON string and returns the value that it represents. Does
        // not check validity or security of the string!
        parse: function (json) {
            if (typeof json != 'string') return null;
            return JSON.e('(' + json + ')');
        }
    };
})();

// Create an eval that does not have access to closures.
JSON.e = function (c) { return eval(c); };
}
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
        state.attempts++;
        if (state.attempts < 3) {
            jQuery.ajax(options);
        } else {
            var response = {
                message: 'The request failed after ' + state.attempts +
                         ' attempts.',
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
            if (typeof bind != 'object' && typeof bind != 'undefined')
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
                var json = JSON.stringify(args[key]);
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

/*!
 * Copyright (c) 2009 Andreas Blixt <andreas@blixt.org>
 * This and more JavaScript libraries: http://blixt.org/js
 * MIT License: http://www.opensource.org/licenses/mit-license.php
 * 
 * jQuery hash plugin (Depends on jQuery, Hash)
 * Plugin for detecting changes to the hash and for adding history support for
 * hashes to certain browsers.
 */
/* A blank HTML page (blank.html) is needed for Internet Explorer 7 and below
 * support.
 *
 * Example:
 *     // Add events before calling init to make sure they are triggered for
 *     // initial hash value.
 *     $('div#log').hashchange(function (e, newHash) {
 *         $(this).prepend('<p>New hash: <b>"' + newHash + '"</b></p>');
 *     });
 *     // Initialize. Here, the src of the iframe is passed in the init
 *     // function. If you've got multiple libraries using this plugin, so
 *     // the init function is called from them, you can also set the iframe
 *     // src in the iframeSrc variable in the beginning of the code in
 *     // jquery.hash.js.
 *     $.hash.init('blank.html');
 *     $.hash.go('abc123');
 *     // Changes hash when the anchor is clicked. Also automatically sets the
 *     // href attribute to "#def456", unless a second argument with a false
 *     // value is supplied.
 *     $('a#my-anchor').hash('def456');
 * 
 * WARNING for Internet Explorer 7 and below:
 * If an element on the page has the same ID as the hash used, the history will
 * get messed up.
 *
 * Does not support history in Safari 2 and below.
 */

(function (jQuery, Hash) {
var
// Plugin settings
iframeId = 'jquery-history',
iframeSrc = '/js/blank.html',
eventName = 'hashchange',
eventDataName = 'hash.fn',
init,
// Import globals
window = this,
documentMode = document.documentMode,

// Called whenever the hash changes.
callback = function (newHash) {
    jQuery.event.trigger(eventName, [newHash]);
};

jQuery.hash = {
    init: function (src) {
        // init can only be called once.
        if (init) return;
        init = 1;
        
        var iframe;
        if (window.ActiveXObject && (!documentMode || documentMode < 8)) {
            // Create an iframe for Internet Explorer 7 and below.
            jQuery('body').prepend(
                '<iframe id="' + iframeId + '" style="display:none;" ' +
                'src="' + (src || iframeSrc) + '"></iframe>');
            iframe = jQuery('#' + iframeId)[0];
        }
        
        Hash.init(callback, iframe);
    },

    go: Hash.go
};

jQuery.fn.hash = function (newHash, changeHref) {
    var fn = this.data(eventDataName);
    if (fn) this.unbind('click', fn);

    if (typeof newHash == 'string') {
        fn = function () { Hash.go(newHash); return false; };
        this.data(eventDataName, fn);
        this.click(fn);
        if (changeHref || changeHref === undefined)
            this.attr('href', '#' + newHash);
    }
    
    return this;
};

jQuery.fn[eventName] = function (fn) {
    return this.bind(eventName, fn);
};
})(jQuery, Hash);
/*!
 * Copyright (c) 2009 Andreas Blixt <andreas@blixt.org>
 * This and more JavaScript libraries: http://blixt.org/js
 * MIT License: http://www.opensource.org/licenses/mit-license.php
 *
 * Application handler
 *
 * Handles path maps that direct control to handlers, along with the query
 * string parameters. Recommended use is for supporting paths in the hash part
 * of the address bar.
 */
/* Recommended use is to use a hash history library (such as Hash or the jQuery
 * hash plugin) and call the exec() method when the hash changes.
 *
 * Example:
 *     var UserHandler = Application.handler(function (username, section) {
 *         alert('Hi ' + username + '!');
 *         if (section) alert('Showing ' + section + ', page ' +
 *                            this.get_param('page', 1));
 *     });
 *     
 *     var HomeHandler = Application.handler(function () {
 *         alert('Home!');
 *     });
 *
 *     var app = new Application([
 *         ['^home$', HomeHandler],
 *         ['^user/([^/]+)(?:/([^/]+))?$', UserHandler]
 *     ]);
 *
 *     app.exec('user/bob/articles?page=2');
 *     // Handler UserHandler will be found (because the pattern matches), and
 *     // then be used like this:
 *     // var handler = new UserHandler(app, 'user/bob/articles',
 *     //                               ['bob', 'articles'], {page: '2'});
 *     // handler.run('bob', 'articles');
 */

var Application = (function () {
    // Constructor.
    var cls = function (map) {
        // Private members.
        var
        patterns = [],
        handlers = [],
        
        register = function (pattern, handler) {
            if (typeof pattern == 'string') pattern = new RegExp(pattern);
            if (!(pattern instanceof RegExp))
                throw 'Type error (pattern); expected RegExp or string.';
            if (typeof handler != 'function')
                throw 'Type error (handler); expected function.';

            patterns.push(pattern);
            handlers.push(handler);
        };

        // Register path map.
        for (var i = 0; i < map.length; i++) {
            register(map[i][0], map[i][1]);
        }

        // Executes the appropriate handler for the given path.
        this.exec = function (path) {
            var matches, handler, params = {}, pieces, pair, i, l;

            // Extract query string from path and parse it.
            if ((i = path.indexOf('?')) >= 0) {
                // Get query string pieces (separated by &)
                pieces = path.substr(i + 1).split('&');
                // Set new path to everything before ?
                path = path.substr(0, i);
                
                for (i = 0, l = pieces.length; i < l; i++) {
                    pair = pieces[i].split('=', 2);
                    // Repeated parameters with the same name are overwritten.
                    // Parameters with no value get set to boolean true.
                    params[decodeURIComponent(pair[0])] = (pair.length == 2 ?
                        decodeURIComponent(pair[1].replace(/\+/g, ' ')) : true);
                }
            }

            // Find a handler for the current path.
            for (i = 0, l = patterns.length; i < l; i++) {
                matches = patterns[i].exec(path);
                if (matches) {
                    // Current path matches a handler.
                    matches = matches.slice(1);
                    handler = new handlers[i](this, path, matches, params);
                    handler.run.apply(handler, matches);
                    return;
                }
            }
            
            // No handler found.
        };
    };
    
    // Static public members.

    // Creates a new handler class. Takes the function that will be called when
    // the handler is to be executed as an argument.
    cls.handler = function (runFunction) {
        var handler = function (app, path, matches, params) {
            // Return the value of a single query string parameter, or the
            // specified default value if the parameter does not exist.
            this.get_param = function (key, def) {
                return (key in params ? params[key] : def);
            };

            // Return a copy of the matches list.
            this.get_matches = function () {
                var all = [], i, l;
                for (i = 0, l = matches.length; i < l; i++)
                    all[i] = matches[i];
                return all;
            };

            // Return a copy of the params object.
            this.get_params = function () {
                var all = {}, p;
                for (p in params) all[p] = params[p];
                return all;
            };

            // Return the requested path.
            this.get_path = function () {
                return path;
            };
            
            // Get the application that created this handler.
            this.get_app = function () {
                return app;
            }
        };
        
        handler.prototype = {
            // Rerun the handler after the specified number of milliseconds.
            delay: function (time) {
                var h = this;
                return setTimeout(function () {
                    h.run.apply(h, h.get_matches());
                }, time);
            },
            // Transfer control to a new instance of the specified handler.
            // Note that the matches will also be sent to the new handler.
            redirect: function (handler) {
                var
                matches = this.get_matches(),
                h = new handler(this.get_app(), this.get_path(),
                                matches, this.get_params());
                h.run.apply(h, matches);
            },
            run: runFunction
        };
        
        return handler;
    };
    
    return cls;
})();

/*!
 * multifarce client library
 * http://code.google.com/p/multifarce/
 * http://beta.multifarce.com/
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
 */

// Must match outro.js (with the exception of undefined)
(function (
document,
window,
Application,
EventSource,
Hash,
$, // jQuery -> $
ServiceClient,
undefined
) {

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
$.easing.easeInQuart = function (x, t, b, c, d) {
    return c * (t /= d) * t * t * t + b;
};

// Extend jQuery with a simple function for inserting formatted text.
$.fn.formattedText = function (text) {
    var html = '<p>' + this.text(text).html() + '</p>';
    html = html.replace(/\*([^*\r\n]+)\*/g, '<strong>$1</strong>');
    html = html.replace(/_([^_\r\n]+)_/g, '<em>$1</em>');
    html = html.replace(/(\r\n|[\r\n]){2,}/g, '</p><p>');
    html = html.replace(/(\r\n|[\r\n])/g, '<br/>');
    return this.html(html);
};

// Returns true if an element has one or more events of the specified type.
$.fn.hasEvent = function (type) {
    var events = this.data('events');
    return events && events[type];
};

var
APP_TITLE = 'multifarce',
API_PATH = '/api/';
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

var User = (function () {
    // Private static members.
    var
    cache = {},
    currentUser,

    // Constructor.
    cls = function (username) {
        // Inherit EventSource functionality.
        EventSource.call(this, 'load');
        
        // Private members.
        var loaded = false, data,

        error = function () {
            this.clearHandlers();
            if (username) delete cache[username];
        },
        
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
        
        // Extra functionality for the special "current user" object.
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
        this.load = function (data) {
            if (data) {
                success.call(this, data);
                return;
            }
        
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
    
    cls.logIn = function (username, password) {
        var cur = cls.current();
        
        if (cur.loggedIn()) {
            alert('You\'re already logged in!');
            return;
        }
        
        api.success(function (user) {
            cur.load(user);
        });

        api.logIn(username, password);
    };
    
    cls.logOut = function () {
        var cur = cls.current();
        
        if (!cur.loggedIn()) {
            alert('You\'re not logged in!');
            return;
        }
        
        if (cur.googleLoggedIn()) {
            location.href = cur.get_googleLogUrl();
        }
        
        api.success(function () {
            cur.load();
        });

        api.logOut();
    };

    return cls;
})();

$(function () {

var
// Various elements used by other code.
allPages = $('div.page'),
avatar = $('#avatar img'),
username = $('#username'),

// Make functions defined in the function below available in the current scope.
getPage, setPage, notify;

// Put the following code in its own scope to avoid name collisions.
(function () {
    var
    // The name of the current page.
    pageName = $('#page-name'),
    // The currently shown page.
    shown = allPages.eq(0),
    // The notifications container.
    notifications = $('#notifications');

    // Hide all pages except the first.
    for (var i = 1; i < allPages.length; i++) {
        allPages.eq(i).remove();
    }

    // Helper function for getting the currently shown page.
    getPage = function () {
        return shown;
    };

    // Helper function for setting which page to show.
    setPage = function (title, which) {
        if (title) {
            pageName.text(title);
            document.title = title + ' - ' + APP_TITLE;
        }

        if (!which || shown[0] == which[0]) return;

        shown.replaceWith(which);
        shown = which;
    };

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
                        .text(text)
                        .prepend('<span class="close">&times;</span>'))
                .hide()
                .fadeIn(500)
                .animate({opacity: 0}, 15000, 'easeInQuart',
                    function () {
                        $(this).remove();
                    }));
    };
})();

// Set up loading animation for requests.
$('body')
    .ajaxStart(function () {
        $(this).addClass('loading');
    })
    .ajaxStop(function () {
        $(this).removeClass('loading');
    });

// Make error handler for the service client show up as
// notifications instead of as alert boxes.
api.set_errorHandler(function (error) {
    notify(error.message, 'error');
});

// Get current user.
var currentUser = User.current();

var HomeHandler;
(function () {

var
page = allPages.filter('#home-page'),

frame = page.find('#current-frame'),
frameTitle = frame.children('h3'),
frameText = frame.children('div.text'),

action = page.find('#action'),
doIt = page.find('#action-go'),
log = page.find('#log'),

// Helper function for executing a command.
execute = function () {
    var command = action.val().toLowerCase();
    if (!command) return;

    action.val('');
    log.prepend(
        $('<div class="command"/>').text('> ' + command));

    if (command == 'reset' || command == 'start') {
        log.prepend(
            $('<div class="result"/>').text('Starting...'));
        game.start();
    } else {
        game.execute(command);
    }
    
    action.focus();
};

// Set up events.
$('#action').live('keydown', function (event) {
    if (event.keyCode == 13) execute();
});
$('#action-go').live('click', execute);

// Set up game.
game.listen('frame-load', function (data) {
    if (game.get_frameId()) $.hash.go('?state=' + game.get_state());

    // Update title.
    setPage(data.title, page);

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
    log.prepend(
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
    log.prepend(
        $('<div class="result"/>').text(error.message));
});

// Handle execution success.
game.listen('execute-success', function (result) {
    // When a command has been called, update the state parameter.
    $.hash.go('?state=' + game.get_state());

    // Show a notification.
    notify(result.text, 'success');

    // Add an entry to the log.
    log.prepend(
        $('<div class="result"/>').text(result.text));
});

// Focus on the input field.
action.focus();

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

    setPage(game.get_frameTitle() || 'Hello World!', page);
});

})();

var LogInHandler;
(function () {

var
page = allPages.filter('#log-in-page'),
username = page.find('#log-in-username'),
password = page.find('#log-in-password'),
go = page.find('#log-in-go');

// Set up events.
$('#log-in-go').live('click', function () {
    User.logIn(username.val(), password.val());
    username.val('');
    password.val('');
});

LogInHandler = Application.handler(function () {
    setPage('Log in', page);
});

})();

var LogOutHandler;
(function () {

var
page = allPages.filter('#log-out-page');

LogOutHandler = Application.handler(function () {
    setPage('Log out', page);
    
    User.logOut();
});

})();

var NewCommandHandler;
(function () {

var
page = allPages.filter('#new-command-page'),
frame = page.find('#new-command-frame'),
command1 = page.find('#new-command-1'),
command2 = page.find('#new-command-2'),
command3 = page.find('#new-command-3'),
command4 = page.find('#new-command-4'),
command5 = page.find('#new-command-5'),
text = page.find('#new-command-text'),
goToFrame = page.find('#new-command-go-to-frame'),
go = page.find('#new-command-go');

// Set up events.
$('#new-command-go').live('click', function () {
    var commands = [];
    
    if (command1.val()) commands.push(command1.val());
    if (command2.val()) commands.push(command2.val());
    if (command3.val()) commands.push(command3.val());
    if (command4.val()) commands.push(command4.val());
    if (command5.val()) commands.push(command5.val());
    
    api.success(function(){alert('Success!')}).createCommand(
        parseInt(frame.val(), 10),
        commands,
        text.val(),
        parseInt(goToFrame.val(), 10));
});

NewCommandHandler = Application.handler(function () {
    frame.empty();
    goToFrame.empty();
    
    api.success(function (frames) {
        for (var i = 0; i < frames.length; i++) {
            frame.append(
                $('<option/>')
                    .val(frames[i].id)
                    .text(frames[i].title));
            goToFrame.append(
                $('<option/>')
                    .val(frames[i].id)
                    .text(frames[i].title));
        }
    }).getFrames();

    setPage('Creating new command', page);
});

})();

var NewFrameHandler;
(function () {

var
page = allPages.filter('#new-frame-page'),
title = page.find('#new-frame-title'),
text = page.find('#new-frame-text'),
go = page.find('#new-frame-go');

// Set up events.
$('#new-frame-go').live('click', function () {
    api.success(function(){alert('Success!')}).createFrame(
        title.val(),
        text.val()
    );
});

NewFrameHandler = Application.handler(function () {
    setPage('Creating new frame', page);
});

})();
var NotFoundHandler;
(function () {

var
page = allPages.filter('#not-found-page'),
path = page.find('#not-found-path');

NotFoundHandler = Application.handler(function () {
    path.text(this.get_path());

    setPage('Path not found!', page);
});

})();

var RegisterHandler;
(function () {

var
page = allPages.filter('#register-page'),
username = page.find('#register-username'),
displayName = page.find('#register-name'),
email = page.find('#register-email'),
password = page.find('#register-password'),
passwordRepeat = page.find('#register-password-repeat'),
go = page.find('#register-go');

// Set up events.
// TODO: Improve this. Needs password/repeat password verify
//       etc.
$('#register-go').live('click', function () {
    api.success(function () {
        alert('Success!');
        if (currentUser.googleLoggedIn()) {
            currentUser.load();
            $.hash.go('');
        } else {
            $.hash.go('log-in');
        }
    });
    api.register(
        username.val(), displayName.val(),
        password.val() || null, email.val());
});

RegisterHandler = Application.handler(function () {
    setPage('Register', page);
});

})();

// Create application for handling the site.
var site = new Application([
    ['^$', HomeHandler],
    //['^commands/(\d+)$', CommandHandler],
    ['^commands/new$', NewCommandHandler],
    //['^frames/(\d+)$', FrameHandler],
    ['^frames/new$', NewFrameHandler],
    ['^log-in$', LogInHandler],
    ['^log-out$', LogOutHandler],
    ['^register$', RegisterHandler],
    //['^user/([^/]+)$', UserHandler],
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
    } else {
        username.text('Not logged in');
        avatar.attr('src', 'http://www.gravatar.com/avatar/' +
                           '?s=28&d=identicon&r=PG');
    }
    
    // Handle Google Accounts notices.
    var show, hide;
    if (this.googleLoggedIn()) {
        show = 'div.google';
        hide = 'div.not-google';
    } else {
        show = 'div.not-google';
        hide = 'div.google';
    }

    if (this.loggedIn()) {
        show += ', div.multifarce';
        hide += ', div.not-multifarce';
    } else {
        show += ', div.not-multifarce';
        hide += ', div.multifarce';
    }

    allPages.find(show).each(function () {
        var el = $(this), hidden = el.data('hidden');
        if (hidden) el.append(hidden);
        el.removeData('hidden');
    });

    allPages.find(hide).each(function () {
        var el = $(this);
        if (el.data('hidden')) return;
        el.data('hidden', el.children().remove());
    });

    allPages.find('a.google-accounts')
        .attr('href', this.get_googleLogUrl());
});

currentUser.load();

// End of $(function () {
});
})(
document,
window,
Application,
EventSource,
Hash,
jQuery,
ServiceClient
);

