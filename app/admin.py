#
# Copyright (c) 2010 Andreas Blixt <andreas@blixt.org>
#

"""Admin for the Multifarce application.

Registers the WSGI web application with request handlers, also defined in this
file.

"""

import wsgiref.handlers
from google.appengine.api import users
from google.appengine.ext import db, webapp
from google.appengine.runtime import DeadlineExceededError

import multifarce
import multifarce.controller
import multifarce.model

class SetupHandler(webapp.RequestHandler):
    def get(self):
        google_user = users.get_current_user()

        w = self.response.out.write

        w('<pre>')
        w('===== SETUP SCRIPT =====\n')

        # Require that current Google user is registered as a local user too.
        user = multifarce.model.User.get_current(self)
        if not user:
            w('Registering new user...\n')
            multifarce.model.User.register(google_user.email(), 'Admin')
            user = multifarce.model.User.get_current(self)
            if not user:
                w('Failed!\n')
                return

        # Create initial frame.
        frame = multifarce.model.Frame.all().get()
        if not frame:
            frame = multifarce.model.Frame.create(
                user, 'The Beginning',
                'You\'re in an ever-changing room. It\'s not really a room, '
                'because it has no walls or ceiling. In fact, it doesn\'t '
                'even exist! You sense that the mere thought of something '
                'would bring everything around you into existence. What will '
                'you do?')

            fid = frame.key().id()
            user.current_frame_id = fid
            user.put()

            w('- Created frame with id %d.\n' % fid)
        else:
            w('- Frames already exist.\n')

        if multifarce.model.Command.all().count() == 0:
            command = multifarce.model.Command.create(
                user, frame, ['go west', 'walk west', 'travel west'],
                'You go west!')
            w('- Created new command.\n')
        else:
            w('- Commands already exist.\n')

        w('</pre>')

class Command(db.Expando):
    pass

class CommandUsage(db.Expando):
    pass

class Frame(db.Expando):
    pass

class User(db.Expando):
    pass

class UpgradeHandler(webapp.RequestHandler):
    def get(self):
        w = self.response.out.write

        try:
            w('<pre>')
            w('===== UPGRADE SCRIPT =====\n')

            w('Upgrading CommandUsage...\n')
            for cu in CommandUsage.all():
                if not hasattr(cu, 'command_id'):
                    w('- [%d/%s] missing command_id... ' % (cu.frame_id, cu.text))

                    qry = Command.all()
                    qry.filter('frame_id', cu.frame_id)
                    qry.filter('synonyms', cu.text)

                    cmd = qry.get()
                    if cmd:
                        cu.command_id = cmd.key().id()
                    else:
                        cu.command_id = None
                    cu.put()

                    w('Fixed!\n')

            w('Upgrading User...\n')
            for user in User.all():
                if user.key().name():
                    w('- User %s needs upgrade.\n' % user.email)

                    copies = User.all().filter('email', user.email)
                    for copy in copies:
                        if not copy.key().name():
                            new = copy
                            w('  Continuing upgrade of user.')
                            break
                    else:
                        new = User(email=user.email,
                                   display_name=user.display_name, expires=None,
                                   joined=user.joined, password=user.password,
                                   session=user.session, state=user.state,
                                   user=user.user)
                        new.put()
                        w('  Created new user.\n')

                    w('  Upgrading frames by user...\n')
                    frames = Frame.all().filter('user_name', user.key().name())
                    for frame in frames:
                        w('  - %s... ' % frame.title)

                        if hasattr(frame, 'image_id'):
                            del frame.image_id

                        del frame.user_name
                        frame.user_id = new.key().id()
                        frame.put()

                        w('Fixed!\n')

                    w('  Upgrading commands by user...\n')
                    commands = Command.all().filter('user_name', user.key().name())
                    for command in commands:
                        w('  - %s... ' % '/'.join(command.synonyms))

                        del command.user_name
                        command.user_id = new.key().id()
                        command.put()

                        w('Fixed!\n')

                    user.delete()

                    w('  Deleted old user.\n')

            w('All done!\n')
            w('</pre>')
        except DeadlineExceededError:
            w('\nDeadline exceeded. Reload page to continue.\n')
            w('</pre>')

def main():
    application = webapp.WSGIApplication([
        ('/admin/upgrade', UpgradeHandler),
        ('/admin/setup', SetupHandler),
    ])
    wsgiref.handlers.CGIHandler().run(application)

if __name__ == '__main__':
    main()
