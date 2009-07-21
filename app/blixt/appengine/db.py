#
# Copyright (c) 2009 Andreas Blixt <andreas@blixt.org>
# License: MIT license <http://www.opensource.org/licenses/mit-license.php>
#

from google.appengine.ext import db

def entity_exists(value, model):
    """Check if an entity exists in the datastore by querying for its key only.

    Returns the entity (with key only, no data) if it exists; otherwise, None.
    """
    if not issubclass(model, db.Model):
        raise TypeError('Invalid type (model); expected subclass of Model.')

    if not isinstance(value, db.Key):
        if isinstance(value, model):
            return value if value.is_saved() else None

        if isinstance(value, basestring) or isinstance(value, (int, long)):
            value = db.Key.from_path(model.kind(), value)
        else:
            raise TypeError('Invalid type (value); expected string, number, '
                            '%s or Key.' % model.__name__)

    q = model.all(keys_only=True)
    q.filter('__key__', value)
    return q.get()

def get_id_or_name(value, model):
    """Returns the id or name of a model instance from value. If a number or a
    string is supplied, a check will be made to make sure it exists in the
    data store.
    """
    if not issubclass(model, db.Model):
        raise TypeError('Invalid type (model); expected subclass of Model.')

    if isinstance(value, (basestring, int, long)):
        return value if entity_exists(value, model) else None
    elif isinstance(value, model):
        return value.key().id_or_name()
    else:
        raise TypeError('Invalid type (value); expected number, string or '
                        '%s.' % model.__name__)

def get_instance(value, model):
    """Returns a model instance from value. If value is a string, gets by key
    name, if value is an integer, gets by id and if value is an instance,
    returns the instance.
    """
    if not issubclass(model, db.Model):
        raise TypeError('Invalid type (model); expected subclass of Model.')
    
    if isinstance(value, basestring):
        return model.get_by_key_name(value)
    elif isinstance(value, (int, long)):
        return model.get_by_id(value)
    elif isinstance(value, model):
        return value
    else:
        raise TypeError('Invalid type (value); expected string, number or '
                        '%s.' % model.__name__)

