#
# Copyright (c) 2009 Andreas Blixt <andreas@blixt.org>
# License: MIT license <http://www.opensource.org/licenses/mit-license.php>
#

import pickle
import time
import types

from google.appengine.api import memcache

enabled = True
_cache = {}

class CacheEntry(object):
    def __init__(self, value, expiration_time=0):
        if not isinstance(expiration_time, (float, int, long)):
            raise TypeError('Expiration time must be a number.')
        if expiration_time < 0:
            raise ValueError('Expiration time cannot be less than zero.')

        self.timestamp = time.time()
        self.time = expiration_time
        self.value = value
    set = __init__

    def current(self):
        if self.time == 0: return True
        # Assume that times longer than 30 days refer to an absolute point in
        # time rather than a time span.
        if self.time > 2592000:
            return time.time() < self.time
        else:
            return time.time() - self.timestamp < self.time

def get(key, time=0):
    if not enabled: return None

    if _cache.has_key(key):
        entry = _cache[key]
        if entry.current():
            return entry.value
        else:
            del _cache[key]

    value = memcache.get(key)
    if value is not None:
        _cache[key] = CacheEntry(value, time)

    return value

def set(key, value, time=0):
    if _cache.has_key(key):
        _cache[key].set(value, time)
    else:
        _cache[key] = CacheEntry(value, time)

    memcache.set(key, value, time)

def delete(key):
    if _cache.has_key(key):
        del _cache[key]

    memcache.delete(key)

def memoize(ttl_or_function):
    """Decorator that caches a function's return value each time it is called.
    If called later with the same arguments, the cached value is returned, and
    not re-evaluated.

    http://wiki.python.org/moin/PythonDecoratorLibrary#Memoize

    Modified to work with instance methods. Does not take instance into
    consideration, so only cache methods that do not change behavior based
    on instance attributes.

    """
    ttl = 30

    class memoize_decorator(object):
        def __init__(self, function):
            self.__doc__ = function.__doc__
            self._function = function
            # The _prefix attribute is a prefix used to uniquely identify the
            # memoized function. If the function belongs to a class, the class
            # name will be added to the prefix.
            self._prefix = self.func_name = function.func_name

        def __call__(self, *args, **kwargs):
            try:
                # The key differs by function name and arguments.
                key = pickle.dumps((self._prefix, args, kwargs))
                value = get(key, ttl)
            except pickle.PicklingError:
                key = None
                value = None

            if value is None:
                # If the function is bound to a class, make sure to pass the
                # 'self' argument.
                if hasattr(self, '_instance'):
                    value = self._function(self._instance, *args, **kwargs)
                else:
                    value = self._function(*args, **kwargs)

                if key:
                    set(key, value, ttl)

            return value

        def __get__(self, instance, cls):
            # This code will only run if the function is part of a class
            # definition.
            if not hasattr(self, '_instance'):
                self._instance = instance
                self._prefix = '%s.%s' % (cls.__name__, self._prefix)
            return self

        def __repr__(self):
            return '<memoized function %s>' % self.func_name

        def invalidate(self, *args, **kwargs):
            """Invalidates the cache for the memoized function with the given
            arguments.

            """
            key = pickle.dumps((self._prefix, args, kwargs))
            delete(key)

    if isinstance(ttl_or_function, types.FunctionType):
        return memoize_decorator(ttl_or_function)

    ttl = ttl_or_function
    return memoize_decorator
