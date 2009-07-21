#
# Copyright (c) 2009 Andreas Blixt <andreas@blixt.org>
# License: MIT license <http://www.opensource.org/licenses/mit-license.php>
#

import time

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
