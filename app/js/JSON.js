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

if (!JSON) // Prevent hiding the native JSON object in browsers that support it.
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
