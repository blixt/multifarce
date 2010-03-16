#
# Copyright (c) 2009 Andreas Blixt <andreas@blixt.org>
#

"""Admin for the Multifarce application.

Registers the WSGI web application with request handlers, also defined
in this file.
"""

import wsgiref.handlers
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import login_required

import multifarce
import multifarce.controller
import multifarce.model

class SetupHandler(webapp.RequestHandler):
    @login_required
    def get(self):
        # Require that currently logged in Google user is application admin.
        if not users.is_current_user_admin():
            self.error(404)

        w = self.response.out.write

        w('<pre>')
        w('===== SETUP SCRIPT =====\r\n')

        # Require that current Google user is registered as a local user too.
        user = multifarce.model.User.get_current(self)
        if not user:
            w('Registering new user...\r\n')
            multifarce.model.User.register('admin', 'Admin', 'admin@example.com')
            user = multifarce.model.User.get_current(self)
            if not user:
                w('Failed!\r\n')
                return

        # Create initial frame.
        frame = multifarce.model.Frame.all().get()
        if not frame:
            frame = multifarce.model.Frame.create(
                user, 'The Beginning',
                'You\'re in an ever-changing room. It\'s not really a room, '
                'because it has no walls or ceiling. In fact, it doesn\'t even '
                'exist! You sense that the mere thought of something would '
                'bring everything around you into existence. What will you do?')

            fid = frame.key().id()
            user.current_frame_id = fid
            user.put()

            w('- Created frame with id %d.\r\n' % fid)
        else:
            w('- Frames already exist.\r\n')

        if multifarce.model.Command.all().count() == 0:
            command = multifarce.model.Command.create(
                user, frame, ['go west', 'walk west', 'travel west'],
                'You go west!')
            w('- Created new command.\r\n')
        else:
            w('- Commands already exist.\r\n')

        w('</pre>')

def main():
    application = webapp.WSGIApplication([
        ('/admin/setup', SetupHandler),
    ])
    wsgiref.handlers.CGIHandler().run(application)

if __name__ == '__main__':
    main()

