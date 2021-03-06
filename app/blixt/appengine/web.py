#
# Copyright (c) 2009 Andreas Blixt <andreas@blixt.org>
# License: MIT license <http://www.opensource.org/licenses/mit-license.php>
#

import inspect
import logging
import re
from StringIO import StringIO

from django.utils import simplejson
from google.appengine.ext import webapp

class JsonService(webapp.RequestHandler):
    """Opens up all attributes that don't start with an underscore to HTTP
    requests using JSON to represent data.

    Note: Arguments that start with an underscore are also ignored. For the call
          to succeed, these arguments must have a default value.
    """
    def _is_public_attr(self, action):
        return (not action.startswith('_') and
                hasattr(self, action))

    def get(self, action):
        out = {'status': 'unknown',
               'response': None}

        if self._is_public_attr(action):
            try:
                args = {}
                for arg in self.request.params:
                    if arg.startswith('_'): continue
                    args[str(arg)] = simplejson.loads(self.request.params[arg])

                attr = getattr(self, action)
                out['status'] = 'success'
                out['response'] = attr(**args) if callable(attr) else attr
            except Exception, e:
                logging.exception('JSON service call %s(**%r) failed:' % (
                    action, args))

                res = {'message': str(e),
                       'module': e.__class__.__module__,
                       'type': e.__class__.__name__}

                if hasattr(e, 'code'):
                    res['code'] = e.code
                if hasattr(e, 'data'):
                    res['data'] = e.data

                out['status'] = 'error'
                out['response'] = res
        else:
            out['status'] = 'list'

            clean = re.compile(r'^[\t ]+|\s+$', re.MULTILINE)
            res = StringIO()
            for a in self.__class__.__dict__:
                if self._is_public_attr(a):
                    attr = getattr(self, a)
                    if not callable(attr):
                        res.write(a)
                        res.write('\n\n')
                        continue

                    args, varargs, varkw, defaults = inspect.getargspec(attr)
                    num_args = len(args)

                    if defaults:
                        diff = num_args - len(defaults)

                    spec = ''
                    for i in xrange(1, num_args):
                        part = (', ' if spec else '') + args[i]
                        if defaults and i >= diff:
                            def_val = simplejson.dumps(defaults[i - diff])
                            part = '[%s=%s]' % (part, def_val)
                        spec += part

                    if varargs: spec += ', *%s' % varargs
                    if varkw: spec += ', **%s' % varkw

                    res.write(a)
                    res.write('(')
                    res.write(spec)
                    res.write(')\n')
                    if attr.__doc__:
                        res.write(clean.sub('', attr.__doc__))
                        res.write('\n\n')
                    else:
                        res.write('\n')

            out['response'] = res.getvalue()
            res.close()

        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps(out, separators=(',', ':')))

    post = get
