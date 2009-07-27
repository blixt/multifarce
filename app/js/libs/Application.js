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
