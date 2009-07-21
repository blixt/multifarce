/*!
 * Copyright (c) 2009 Andreas Blixt <andreas@blixt.org>
 * MIT License: http://www.opensource.org/licenses/mit-license.php
 *
 * Object manager
 *
 * Handles serialization and deserialization of objects, preserving reference
 * integrity. Ideal for storing a complex data structure as JSON. 
 */
/* Example:
 *     var a = {aString: 'hello', aNumber: 12.3, aBool: true,
 *              anArray: [1, 2, [3, 4]], anObject: {anotherObject: {
 *              hello: 'world', iAm: 1337}}},
 *         b = {referenceToArray: a.anArray, referenceToA: a,
 *              referenceToSubObject: a.anObject.anotherObject,
 *              anotherString: 'weeee'},
 *         c = {references: [a, b]},
 *         d = [a, b, c];
 *     
 *     // Create an ObjectManager instance and register variables a, b, c and
 *     // d.
 *     var manager = new ObjectManager();
 *     manager.register(a, 'a');
 *     manager.register(b, 'b');
 *     manager.register(c, 'c');
 *     manager.register(d, 'd');
 *     
 *     // Serialize and deserialize the registered objects.
 *     var serialized = manager.serialize();
 *     var deserialized = ObjectManager.deserialize(serialized);
 *     
 *     // (Firebug required)
 *     // Shows the instances before and after serialization as well as the
 *     // serialized version of the data.
 *     console.log({
 *         before: [a, b, c, d],
 *         intermediate: serialized,
 *         after: [deserialized.get('a'), deserialized.get('b'),
 *                 deserialized.get('c'), deserialized.get('d')]
 *     });
 */

var ObjectManager = (function () {
    var
    // Private static variables.
    version = '1.0',

    // Callback for the copy function.
    // Replaces object reference representations with actual references.
    parseReferences = function (value, key) {
        if (value && typeof value == 'object' && value['$'])
            return this.get(value['$']);
    },

    // Callback for the copy function.
    // Replaces object references with reference representations.
    replaceReferences = function (value, key) {
        // Ignore the 'serializable' property of objects.
        if (key == 'serializable') return cls.ignore;
        if (value && typeof value == 'object') {
            // Make sure the object is registered and get its id.
            var id = this.find(value);
            if (!id) id = this.register(value);

            // References are represented as an object with a single
            // property, '$', that has the id as its value.
            return {'$': id};
        }
    },

    // Constructor.
    cls = function (dataVersion) {
        if (typeof dataVersion != 'string')
            dataVersion = (dataVersion ? String(dataVersion) : '');

        // Private members.
        var
        objects = {};

        // Public members.
        /**
         * Gets the object with the specified id.
         * 
         * @param id The id of the object to get.
         * @return The object or undefined if it wasn't found. 
         */
        this.get = function (id) {
            return objects[id];
        };
        
        /**
         * Gets the id of an object.
         * 
         * @param object The object to find the id for.
         * @return The id of the object or false if the object has not been
         *         registered. 
         */
        this.find = function (object) {
            for (var id in objects) {
                if (objects[id] == object) return id;
            }

            return false;
        };
        
        /**
         * Registers an object for serialization.
         * 
         * @param object The object to register.
         * @param id (optional) The id that the object should be registered
         *        with.
         * @return The id that the object was registered with or false if
         *         registration failed. 
         */
        this.register = function (object, id) {
            if (!object || typeof object != 'object') return false;

            // Handle cases where the object has already been registered.
            var tempId;
            if (tempId = this.find(object)) {
                // If no id was specified, just return the id the object
                // already has.
                if (!id) return tempId;

                // If an id was specified, unregister the object and then
                // continue registration.
                this.unregister(object);
            }

            // Generate a unique numeric id if no id was specified.
            if (!id) {
                tempId = 0;
                while (objects[++tempId]);
                id = tempId;
            }

            id = String(id);
            objects[id] = object;
            return id;
        };
        
        /**
         * Serializes all the registered objects.
         * 
         * @return An object with the serialized data.
         */
        this.serialize = function () {
            var result = {
                v: version,
                w: dataVersion,
                o: {}
            },

            // Since the objects collection may expand during the for-loop,
            // it will need to be run again as long as there were changes to
            // it.
            moreObjects = true, id, o;
            while (moreObjects) {
                moreObjects = false;

                for (id in objects) {
                    // If an object has already been processed, skip to the
                    // next one.
                    if (result.o[id]) continue;

                    // Since an object is being processed, that means the
                    // objects collection may have changed.
                    moreObjects = true;

                    o = objects[id];
                    if (o.serializable) {
                        result.o[id] = {
                            t: o.serializable,
                            o: cls.copy(o.serialize ? o.serialize(this) : o,
                                        replaceReferences, this)
                        };
                    } else {
                        result.o[id] = {
                            o: cls.copy(o, replaceReferences, this)
                        };
                    }
                }
            }

            return result;
        },

        /**
         * Unregisters an object.
         * 
         * @param object The object to unregister, or its id.
         */
        unregister = function (object) {
            // Attempt to treat the argument as an id.
            if (objects[object]) {
                delete objects[object];
                return true;
            }

            // Scan the objects collection for the object.
            for (var id in objects) {
                if (objects[id] == object) {
                    delete objects[id];
                    return true;
                }
            }
            
            return false;
        };
    };
    
    // Public static members.
    cls.ignore = {};

    /**
     * Performs a deep copy of an object. Function references will be skipped.
     *
     * The function does not detect recursive referencing, this needs to be
     * handled by the item callback.
     *
     * If the item callback has a return value of ObjectManager.ignore, the
     * item will be ignored. Any other value (except undefined) will replace
     * the item with that value instead.
     *
     * @param object The object that will be copied.
     * @param itemCallback (optional) A function that will be called for each
     *                     item in the object. The function will be passed with
     *                     two arguments: the item and its key.
     * @param bind (optional) The object that will represent 'this' in the
     *             item callback function.
     * @return A deep copy of the given object.
     */
    cls.copy = function (object, itemCallback, bind) {
        if (!object || typeof object != 'object') return object;

        var
        result, i, l,
        handleItem = function (key) {
            if (key[0] == '_') return;
            var item = object[key], p, r;

            if (typeof itemCallback == 'function') {
                r = itemCallback.call(bind, item, key);
                if (r !== undefined) {
                    if (r != cls.ignore) result[key] = r;
                    return;
                }
            }

            p = cls.copy(item, itemCallback, bind);
            if (typeof p != 'function') result[key] = p;
        };

        if (object instanceof Array) {
            result = [];
            for (i = 0, l = object.length; i < l; i++) handleItem(i);
        } else {
            result = {};
            for (i in object) handleItem(i);
        }

        return result;
    };

    // A collection of deserializers for each data structure version.
    cls.deserializers = {
        '1.0': function (o) {
            var
            manager = new cls(o.w),
            id, data, object, type, path, copy, i, l,
            // Create a temporary collection that will hold copies for de-
            // serialization methods, which are run in a third pass because
            // they need all references to have been expanded by the second
            // pass first.
            copyCache = {};

            // First pass.
            // Creates empty instances for each object, so that they may be
            // referenced in the second pass.
            for (id in o.o) {
                data = o.o[id];

                if (data.t) {
                    type = window;
                    path = data.t.split('.');
                    for (i = 0, l = path.length; i < l; i++) {
                        type = type[path[i]];
                        if (!type) throw 'Could not deserialize object ' +
                                         '(undefined type.)';
                    }

                    object = new type();
                } else {
                    object = data.o instanceof Array ? [] : {};
                }

                manager.register(object, id);
            }

            // Second pass.
            // Expands all references to other objects and fills objects that
            // don't have custom deserialization routines.
            for (id in o.o) {
                data = o.o[id];
                object = manager.get(id);

                copy = cls.copy(data.o, parseReferences, manager);
                if (data.t && object.deserialize) {
                    copyCache[id] = copy;
                } else {
                    if (copy instanceof Array) {
                        for (i = 0, l = copy.length; i < l; i++) {
                            object[i] = copy[i];
                        }
                    } else {
                        for (i in copy) {
                            object[i] = copy[i];
                        }
                    }
                }
            }

            // Third pass.
            // Calls custom deserialization methods.
            for (id in copyCache)
                manager.get(id).deserialize(copyCache[id], manager);

            return manager;
        }
    };

    /**
     * Deserializes serialized data.
     * 
     * @param object The object with the serialized data. 
     * @return An instance of ObjectManager with the same structure as the
     *         ObjectManager that was serialized.
     */
    cls.deserialize = function (object) {
        if (!object || !cls.deserializers[object.v])
            throw 'Could not deserialize object (unsupported object.)';
        return cls.deserializers[object.v](object);
    };

    return cls;
})();
