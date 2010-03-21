#
# Copyright (c) 2009 Andreas Blixt <andreas@blixt.org>
#

import hashlib

from google.appengine.api import users
from google.appengine.ext import db

from blixt.appengine.cache import memoize
import blixt.appengine.db
import multifarce
from multifarce import model

# TODO: This should somehow be more dynamic.
FIRST_FRAME_ID = 2

class MultifarceController(object):
    @memoize(0)
    def clean(self, command):
        """Cleans a single command or a list of commands.

        """
        return model.Command.clean(command)

    def create_command(self, frame, commands, text, go_to_frame=None,
                       flags_on=[], flags_off=[], flags_required=[]):
        """Creates a new command for the specified frame.

        """
        user = model.User.get_current(self)
        if not user:
            raise multifarce.NotLoggedInError(
                'You must be logged in to create commands.',
                'MUST_BE_LOGGED_IN')

        # Create command.
        command = model.Command.create(user, frame, commands, text, go_to_frame,
                                       flags_on, flags_off, flags_required)

        self.get_commands.invalidate()
        self.get_commands.invalidate(frame=frame, leads_to_frame=None, by=None)
        self.get_commands.invalidate(frame=None, leads_to_frame=None,
                                     by=user.key().id())

        return self.get_command(command)

    def create_frame(self, title, text):
        """Creates a new frame.

        """
        user = model.User.get_current(self)
        if not user:
            raise multifarce.NotLoggedInError(
                'You must be logged in to create frames.', 'MUST_BE_LOGGED_IN')

        # Create frame.
        frame = model.Frame.create(user, title, text)

        self.get_frames.invalidate()
        self.get_frames.invalidate(user.key().id())

        return self.get_frame(frame)

    @memoize(10)
    def execute(self, frame, command, flags=None):
        """Executes a command for the specified frame.

        """
        cmd = model.Command.find(frame, command)
        if not cmd:
            raise multifarce.ExecuteError('You can\'t do that.',
                                          'COMMAND_NOT_FOUND',
                                          model.Command.clean(command))

        if not isinstance(flags, list):
            flags = []

        for flag in cmd.flags_required:
            if flag not in flags:
                raise multifarce.ExecuteError(
                    'You can\'t do that right now.' % flag, 'FLAG_REQUIRED')

        for flag in cmd.flags_on:
            if flag not in flags:
                flags.append(flag)

        for flag in cmd.flags_off:
            flags.remove(flag)

        result = {'command_id': cmd.key().id(),
                  'frame_id': cmd.frame_id, 'text': cmd.text,
                  'flags': flags}

        if cmd.go_to_frame_id:
            result['frame_id'] = cmd.go_to_frame_id

        return result

    @memoize(120)
    def get_command(self, command):
        command = blixt.appengine.db.get_instance(command, model.Command)

        if not command:
            raise multifarce.GetCommandError(
                'The specified command could not be found.',
                'COMMAND_NOT_FOUND')

        result = {'id': command.key().id(), 'author': command.user_id,
                  'frame_id': command.frame_id, 'synonyms': command.synonyms,
                  'text': command.text,
                  'go_to_frame_id': command.go_to_frame_id,
                  'flags_on': command.flags_on, 'flags_off': command.flags_off,
                  'flags_required': command.flags_required}
        return result

    @memoize(60)
    def get_commands(self, frame=None, leads_to_frame=None, by=None):
        commands = model.Command.all()
        if frame:
            frame = blixt.appengine.db.get_id_or_name(frame, model.Frame)
            commands.filter('frame_id', frame)
        if leads_to_frame:
            leads_to_frame = blixt.appengine.db.get_id_or_name(leads_to_frame,
                                                               model.Frame)
            commands.filter('go_to_frame_id', leads_to_frame)
        if by:
            by = blixt.appengine.db.get_id_or_name(by, model.User)
            commands.filter('user_id', by)

        return [self.get_command(command) for command in commands]

    @memoize(3600)
    def get_first_frame(self):
        return self.get_frame(FIRST_FRAME_ID)

    @memoize(300)
    def get_frame(self, frame):
        frame = blixt.appengine.db.get_instance(frame, model.Frame)

        if not frame:
            raise multifarce.GetFrameError(
                'The specified frame could not be found.', 'FRAME_NOT_FOUND')

        result = {'id': frame.key().id(), 'author': frame.user_id,
                  'title': frame.title, 'text': frame.text}
        return result

    @memoize(300)
    def get_frames(self, by=None):
        frames = model.Frame.all()
        if by:
            by = blixt.appengine.db.get_id_or_name(by, model.User)
            frames.filter('user_id', by)

        return [self.get_frame(frame) for frame in frames]

    def get_status(self, path='/'):
        """Returns the status for the current user, such as e-mail and
        display name if the user is logged in. If the user is linked to a
        Google account, the Google logout URL will also be provided.

        If the user is not logged in, the Google login URL will be provided.

        """
        result = {}

        google_user = users.get_current_user()
        if google_user:
            result['google_nickname'] = google_user.nickname()
            result['google_email'] = google_user.email()
            result['google_logout'] = users.create_logout_url(path)
            result['google_logged_in'] = True
        else:
            result['google_login'] = users.create_login_url(path)
            result['google_logged_in'] = False

        user = model.User.get_current(self)
        if user:
            result['user_id'] = user.key().id()
            result['display_name'] = user.display_name
            result['email'] = user.email
            result['email_md5'] = hashlib.md5(user.email).hexdigest()
            result['type'] = 'local' if user.password else 'google'
            result['logged_in'] = True
        else:
            result['logged_in'] = False

        return result

    @memoize(3600)
    def get_top_commands(self, frame):
        """Returns the most entered commands for the specified frame.

        """
        return [{'command_id': command.command_id, 'text': command.text,
                 'count': command.count}
                for command in model.CommandUsage.get_top(frame)]

    @memoize
    def get_user_info(self, user):
        """Returns information about the specified user. Fails if the user does
        not exist.

        """
        user = blixt.appengine.db.get_instance(user, model.User)
        if not user:
            raise multifarce.NotFoundError(
                'The specified user could not be found.', 'USER_NOT_FOUND')

        result = {'user_id': user.key().id(),
                  'display_name': user.display_name,
                  'email_md5': md5.new(user.email.lower()).hexdigest()}
        return result

    def log_in(self, email, password):
        """Attempts to log in using the specified credentials. Will fail if the
        e-mail is not found, the password is wrong or if the user is linked to
        a Google account.

        """
        model.User.log_in(email, password, self)
        return self.get_status()

    def log_out(self):
        """Logs out the current user. Has no effect if the user is not logged
        in, or if the user is logged in with a Google account.

        """
        user = model.User.get_current(self)
        if user:
            user.end_session(self)

    def register(self, email, display_name, password=None):
        """Registers a user to Multifarce. If password is omitted, the user
        will be linked to the currently logged in Google account (or
        fails if the user is not logged in with a Google account.)

        Normal user accounts will need to be activated using a code sent to
        their e-mail before they can log in. If linking to a Google account,
        no activation is required.

        """
        model.User.register(email, display_name, password)
