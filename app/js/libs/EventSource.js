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
