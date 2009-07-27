#
# Copyright (c) 2009 Andreas Blixt <andreas@blixt.org>
#

import md5

from google.appengine.api import users
from google.appengine.ext import db

import blixt.appengine.db
import multifarce
from multifarce import model

# TODO: This should somehow be more dynamic.
FIRST_FRAME_ID = 1

class MultifarceController(object):
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
        cmd = model.Command.create(user, frame, commands, text, go_to_frame,
                                   flags_on, flags_off, flags_required)

        return self.get_command(cmd)

    def create_frame(self, title, text):
        """Creates a new frame.
        """
        user = model.User.get_current(self)
        if not user:
            raise multifarce.NotLoggedInError(
                'You must be logged in to create frames.', 'MUST_BE_LOGGED_IN')

        # Create frame.
        frame = model.Frame.create(user, title, text)

        return self.get_frame(frame)

    def execute(self, frame, command, flags=None):
        """Executes a command for the specified frame.
        """
        command = model.Command.find(frame, command)
        if not command:
            raise multifarce.ExecuteError('You can\'t do that.',
                                          'COMMAND_NOT_FOUND')

        if not isinstance(flags, list):
            flags = []

        for flag in command.flags_required:
            if flag not in flags:
                raise multifarce.ExecuteError(
                    'You can\'t do that right now.' % flag, 'FLAG_REQUIRED')

        for flag in command.flags_on:
            if flag not in flags:
                flags.append(flag)

        for flag in command.flags_off:
            flags.remove(flag)

        result = {'command_id': command.key().id(),
                  'frame_id': command.frame_id, 'text': command.text,
                  'flags': flags}

        if command.go_to_frame_id:
            result['frame_id'] = command.go_to_frame_id

        return result

    def get_command(self, command):
        command = blixt.appengine.db.get_instance(command, model.Command)

        if not command:
            raise multifarce.GetCommandError(
                'The specified command could not be found.',
                'COMMAND_NOT_FOUND')

        result = {'id': command.key().id(), 'author': command.user_name,
                  'frame_id': command.frame_id, 'synonyms': command.synonyms,
                  'text': command.text,
                  'go_to_frame_id': command.go_to_frame_id,
                  'flags_on': command.flags_on, 'flags_off': command.flags_off,
                  'flags_required': command.flags_required}
        return result

    def get_first_frame(self):
        return self.get_frame(FIRST_FRAME_ID)

    def get_frame(self, frame):
        frame = blixt.appengine.db.get_instance(frame, model.Frame)

        if not frame:
            raise multifarce.GetFrameError(
                'The specified frame could not be found.', 'FRAME_NOT_FOUND')

        result = {'id': frame.key().id(), 'author': frame.user_name,
                  'title': frame.title, 'text': frame.text}
        return result

    def get_frames(self):
        frames = model.Frame.all().fetch(1000)

        result = []
        for frame in frames:
            result.append(self.get_frame(frame))

        return result

    def get_status(self, path='/'):
        """Returns the status for the current user, such as username and
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
            result['username'] = user.key().name()
            result['display_name'] = user.display_name
            result['email'] = user.email
            result['email_md5'] = md5.new(user.email.lower()).hexdigest()
            result['type'] = 'local' if user.password else 'google'
            result['logged_in'] = True
        else:
            result['logged_in'] = False

        return result

    def get_user_info(self, user):
        """Returns information about the specified user. Fails if the user does
        not exist.
        """
        user = blixt.appengine.db.get_instance(user, model.User)
        if not user:
            raise multifarce.NotFoundError(
                'The specified user could not be found.', 'USER_NOT_FOUND')

        result = {'username': user.key().name(),
                  'display_name': user.display_name,
                  'email_md5': md5.new(user.email.lower()).hexdigest()}
        return result

    def log_in(self, username, password):
        """Attempts to log in using the specified credentials. Will fail if the
        username does not exist, the password is wrong or if the user is linked
        to a Google account.
        """
        model.User.log_in(username, password, self)
        return self.get_status()

    def log_out(self):
        """Logs out the current user. Has no effect if the user is not logged
        in, or if the user is logged in with a Google account.
        """
        user = model.User.get_current(self)
        if user:
            user.end_session(self)

    def register(self, username, display_name, email, password=None):
        """Registers a user to Multifarce. If password and e-mail is omitted,
        the user will be linked to the currently logged in Google account (or
        fails if the user is not logged in with a Google account.)

        Normal user accounts will need to be activated using a code sent to
        their e-mail before they can log in. If linking to a Google account,
        no activation is required.
        """
        model.User.register(username, display_name, email, password)