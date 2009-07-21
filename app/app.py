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

import multifarce.controller
import multifarce.model
import multifarce.viewer

# Uncomment the line below to disable caching.
blixt.appengine.cache.enabled = False

class HomeHandler(webapp.RequestHandler):
    def get(self):
        html = blixt.appengine.cache.get('app')
        if not html:
            html = template.render(
                'app.html', {'version': os.environ['CURRENT_VERSION_ID']})
            blixt.appengine.cache.set('app', html, 3600)
        self.response.out.write(html)

##class ImageHandler(webapp.RequestHandler):
##    def get(self, image_id):
##        # Build a key that identifies the requested image and size.
##        cache_key = 'image_%s' % (image_id)
##
##        # Attempt to get the image from the memory cache.
##        data = memcache.get(cache_key)
##        if data:
##            self.response.headers['Content-Type'] = str(data['content_type'])
##            self.response.out.write(data['data'])
##            return
##
##        # Get the image from the data store.
##        try:
##            image = multifarce.model.Image.get_by_id(int(image_id))
##            if not image:
##                raise multifarce.NotFoundError('The specified image does not '
##                                               'exist.', 'IMAGE_NOT_FOUND')
##            image_data = image.get_image_data(size)
##
##            # Cache the image.
##            memcache.set(cache_key, {'data': image_data.data,
##                                     'content_type': image_data.content_type})
##
##            self.response.headers['Content-Type'] = str(image_data.content_type)
##            self.response.out.write(image_data.data)
##        except:
##            self.error(404)
##
##class UploadHandler(webapp.RequestHandler):
##    def post(self):
##        user = multifarce.model.User.get_current(self)
##        if not user:
##            raise multifarce.NotLoggedInError('You must be logged in to upload '
##                                              'images.', 'MUST_BE_LOGGED_IN')
##
##        frame_id = int(self.request.get('frame_id'))
##        frame = multifarce.model.Frame.get(frame_id)
##        if not frame:
##            raise multifarce.NotFoundError('Frame does not exist.',
##                                           'FRAME_NOT_FOUND')
##        if frame.user_id != user.key.id():
##            raise multifarce.InvalidOperation('Cannot upload image to others\' '
##                                              'frames.', 'ACCESS_VIOLATION')
##
##        img_data = multifarce.model.Image.upload(self.request.get('image'))
##
##        frame.image_id = img_data.key().id()
##        frame.put()

def main():
    application = webapp.WSGIApplication([
        ('/', HomeHandler),
        ('/api/(\\w*)', multifarce.viewer.MultifarceService),
##        ('/image/(\\d+)', ImageHandler),
##        ('/upload', UploadHandler),
    ])
    wsgiref.handlers.CGIHandler().run(application)

if __name__ == '__main__':
    main()

