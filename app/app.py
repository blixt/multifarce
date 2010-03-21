#
# Copyright (c) 2009 Andreas Blixt <andreas@blixt.org>
#

"""Entry point for the Multifarce application.

Registers the WSGI web application with request handlers, also defined
in this file.

"""

import os

import wsgiref.handlers
from google.appengine.ext import webapp
from google.appengine.ext.webapp import template

import blixt.appengine.cache

import multifarce
import multifarce.controller
import multifarce.model
import multifarce.view

# Only cache on live server. Comment the line below to test caching on
# development server.
blixt.appengine.cache.enabled = not multifarce.DEBUG

class HomeHandler(webapp.RequestHandler):
    def get(self):
        html = blixt.appengine.cache.get('app')
        if not html:
            html = template.render(
                'app.html', {'debug': multifarce.DEBUG,
                             'version': os.environ['CURRENT_VERSION_ID']})
            blixt.appengine.cache.set('app', html, 3600)
        self.response.out.write(html)

class DummyHandler(webapp.RequestHandler):
    def get(self):
        pass

def main():
    application = webapp.WSGIApplication([
        ('/', HomeHandler),
        ('/api/(\\w*)', multifarce.view.MultifarceService),
        # Specific to *.multifarce.com
        ('/googlee3ef4462fc530463.html', DummyHandler),
    ])
    wsgiref.handlers.CGIHandler().run(application)

if __name__ == '__main__':
    main()

