#
# Copyright (c) 2009 Andreas Blixt <andreas@blixt.org>
#

import hashlib, re, time, uuid
from datetime import datetime, timedelta

from google.appengine.api import mail, images, users
from google.appengine.ext import db

import blixt.appengine.db
import translitcodec

import multifarce

# TODO: This value will most likely be reputation controlled.
MAX_COMMANDS_PER_FRAME_PER_USER = 5
MAX_IMAGE_SIZE = 650

class Command(db.Model):
    user_name = db.StringProperty(required=True)
    frame_id = db.IntegerProperty(required=True)
    synonyms = db.StringListProperty(required=True)
    text = db.StringProperty(required=True)
    go_to_frame_id = db.IntegerProperty()
    flags_on = db.StringListProperty()
    flags_off = db.StringListProperty()
    flags_required = db.StringListProperty()

    @staticmethod
    def clean(command):
        """Cleans command/flag names. Makes the name lower case, removes
        non-alpha characters and extraneous whitespace.
        """
        # Transliterate international characters.
        if not isinstance(command, unicode):
            command = unicode(command, 'UTF-8')
        command = command.encode('translit/long/ascii', 'ignore').lower()

        # Only keep letters and whitespace.
        # XXX: Keep numbers too?
        command = re.sub('[^a-z ]+', '', command)

        # Remove certain words from the command.
        for word in multifarce.STOP_WORDS:
            command = re.sub(r'\b%s\b' % word, '', command)

        # Remove extraneous whitespace.
        command = re.sub(' {2,}', ' ', command)

        # Replace certain words/phrases with a common synonym.
        for words in multifarce.SYNONYMS:
            to = words[0]
            for i in xrange(1, len(words)):
                command = re.sub(r'\b%s\b' % words[i], to, command)

        return command.strip()

    @staticmethod
    def create(user, frame, commands, text, go_to_frame=None,
               flags_on=[], flags_off=[], flags_required=[]):
        """Creates a new command.
        """
        user = blixt.appengine.db.get_id_or_name(user, User)
        if not user:
            raise multifarce.CreateCommandError(
                'User does not exist.',
                'USER_NOT_FOUND')

        if not isinstance(commands, list):
            raise multifarce.CreateCommandError(
                'Invalid type (commands); expected list.',
                'TYPE_ERROR')

        if not isinstance(text, basestring):
            raise multifarce.CreateCommandError(
                'Invalid type (text); expected string.',
                'TYPE_ERROR')

        # Validate frame.
        frame = blixt.appengine.db.get_id_or_name(frame, Frame)
        if not frame:
            raise multifarce.CreateCommandError(
                'Frame does not exist.',
                'FRAME_NOT_FOUND')

        # Limit number of commands that can be created on a single frame by one
        # user.
        count = Command.gql('WHERE user_name = :user AND frame_id = :frame',
                            user=user, frame=frame).count()
        if count >= MAX_COMMANDS_PER_FRAME_PER_USER:
            raise multifarce.CreateCommandError(
                'A user can only add a maximum of %d commands to one '
                'frame.' % MAX_COMMANDS_PER_FRAME_PER_USER,
                'MAX_COMMANDS_FRAME')

        # Validate synonyms.
        synonyms = []
        for c in commands:
            if not c: continue

            if not isinstance(c, basestring):
                raise multifarce.CreateCommandError(
                    'Invalid type (item of commands); expected string.',
                    'TYPE_ERROR')

            c = Command.clean(c)

            if len(c) < 3:
                raise multifarce.CreateCommandError(
                    'Command must be at least three characters long.',
                    'COMMAND_TOO_SHORT')
            if len(c) > 20:
                raise multifarce.CreateCommandError(
                    'Command must not be any longer than 20 characters.',
                    'COMMAND_TOO_LONG')

            synonyms.append(c)
            if len(synonyms) > 5:
                raise multifarce.CreateCommandError(
                    'There can only be a maximum of 5 synonyms for a single '
                    'command.',
                    'TOO_MANY_COMMANDS')

        # Validate go-to frame.
        if go_to_frame != None:
            if isinstance(go_to_frame, Frame):
                go_to_frame = go_to_frame.key().id()
            elif isinstance(go_to_frame, int):
                if not blixt.appengine.db.entity_exists(go_to_frame, Frame):
                    raise multifarce.CreateCommandError(
                        'Go-to frame does not exist.',
                        'FRAME_NOT_FOUND')
            else:
                raise multifarce.CreateCommandError(
                    'Invalid type (go_to_frame); expected Frame or int.',
                    'TYPE_ERROR')

        # TODO: Validate flags variables.

        # Create and store command.
        cmd = Command(user_name=user, frame_id=frame, synonyms=synonyms,
                      text=text, go_to_frame_id=go_to_frame,
                      flags_on=flags_on, flags_off=flags_off,
                      flags_required=flags_required)
        cmd.put()

        return cmd

    @staticmethod
    def find(frame, command):
        frame = blixt.appengine.db.get_id_or_name(frame, Frame)
        if not frame:
            raise FindCommandError('The specified frame does not exist.',
                                   'FRAME_NOT_FOUND')
        command = Command.clean(command)
        CommandUsage.increment(frame, command)
        return Command.gql('WHERE frame_id = :frame AND synonyms = :synonyms',
                           frame=frame, synonyms=command).get()

# Class for keeping statistics of command usage. Each counter is specific to a
# frame and command. The key name has a :0 suffix to support future use of
# sharding, if the need arises.
class CommandUsage(db.Model):
    frame_id = db.IntegerProperty(required=True)
    text = db.StringProperty(required=True)
    count = db.IntegerProperty(required=True, default=0)

    @staticmethod
    def make_key_name(frame, text, shard=0):
        frame = blixt.appengine.db.get_id_or_name(frame, Frame)
        return 'f%d:%s:%d' % (frame, text, shard)

    @staticmethod
    def get_count(frame, text):
        key_name = CommandUsage.make_key_name(frame, text)
        counter = CommandUsage.get_by_key_name(key_name)
        if counter:
            return counter.count
        return 0

    @staticmethod
    def get_top(frame, limit=10):
        # XXX: Needs better handling if shards get implemented.
        frame = blixt.appengine.db.get_id_or_name(frame, Frame)
        qry = CommandUsage.all().filter('frame_id', frame).order('-count')

        return [cmd for cmd in qry.fetch(limit)]

    @staticmethod
    def increment(frame, text):
        frame = blixt.appengine.db.get_id_or_name(frame, Frame)
        key_name = CommandUsage.make_key_name(frame, text)
        def txn():
            counter = CommandUsage.get_by_key_name(key_name)
            if not counter:
                counter = CommandUsage(
                    key_name=key_name, frame_id=frame, text=text)
            counter.count += 1
            counter.put()
        db.run_in_transaction(txn)

class Frame(db.Model):
    user_name = db.StringProperty(required=True)
    image_id = db.IntegerProperty()
    title = db.StringProperty(required=True)
    text = db.StringProperty(required=True, multiline=True)

    @staticmethod
    def create(user, title, text, image=None):
        if not isinstance(user, User):
            raise multifarce.CreateFrameError(
                'Invalid type (user); expected User.',
                'TYPE_ERROR')

        if not isinstance(title, basestring):
            raise multifarce.CreateFrameError(
                'Invalid type (title); expected string.',
                'TYPE_ERROR')

        if not isinstance(text, basestring):
            raise multifarce.CreateFrameError(
                'Invalid type (text); expected string.',
                'TYPE_ERROR')

        # Validate image.
        if image != None:
            if isinstance(image, ImageData):
                image = image.key().id()
            elif isinstance(image, int):
                if not blixt.appengine.db.entity_exists(image, ImageData):
                    raise multifarce.CreateFrameError(
                        'Image does not exist.',
                        'IMAGE_NOT_FOUND')
            else:
                raise multifarce.CreateFrameError(
                    'Invalid type (go_to_frame); expected Frame or int.',
                    'TYPE_ERROR')

        frame = Frame(user_name=user.key().name(), image_id=image,
                      title=title, text=text)
        frame.put()

        return frame

# TODO
class Report(db.Model):
    pass

class ImageData(db.Model):
    """Holds the data for an image.
    """
    content_type = db.StringProperty()
    data = db.BlobProperty()

    @staticmethod
    def upload(data):
        # Don't allow files larger than 200 kB.
        if len(data) > 200 * 1024:
            raise multifarce.UploadError(
                'File is too big. Max size is 200 kB.',
                'FILE_TOO_LARGE')

        img = images.Image(data)

        # Validate image dimensions.
        if img.width != MAX_IMAGE_SIZE or img.height != MAX_IMAGE_SIZE:
            raise multifarce.UploadError(
                'Invalid image size. Max width/height is %d.' % MAX_IMAGE_SIZE,
                'INVALID_IMAGE_SIZE')

        # Create an ImageData instance.
        img_data = ImageData(content_type='image/jpeg', data=data)
        img_data.put()

        return img_data

class User(db.Model):
    """Represents a Multifarce user.
    """
    user = db.UserProperty()
    display_name = db.StringProperty()
    password = db.StringProperty()
    email = db.EmailProperty()
    joined = db.DateTimeProperty(auto_now_add=True)
    state = db.StringProperty(choices=['inactive', 'member'],
                              default='member')
    current_frame_id = db.IntegerProperty()
    session = db.StringProperty()
    expires = db.DateTimeProperty()

    @staticmethod
    def get_current(handler):
        """Retrieves a User instance for the currently logged in user.
        """
        user = None

        google_user = users.get_current_user()
        if google_user:
            # User is logged in with a Google account.
            user = User.gql('WHERE user = :1', google_user).get()

        if not user:
            try:
                # User has a session.
                session = handler.request.cookies['session']
                query = User.all()
                query.filter('session =', session)
                query.filter('expires >', datetime.utcnow())
                user = query.get()
            except KeyError:
                user = None

        return user

    @staticmethod
    def log_in(username, password, handler):
        """Retrieves a User instance, based on a username and a password, and
        starts a session.

        The SHA-256 hash of the password must match the hash stored in the
        database, otherwise an exception will be raised.
        """
        user = User.get_by_key_name(username.lower())
        if not user:
            raise multifarce.LogInError(
                'Could not find a user with the specified username.',
                'USER_NOT_FOUND')

        # The user attribute will be something other than "user@multifarce.com"
        # if the user is registered through a Google account.
        if user.user != users.User('user@multifarce.com'):
            raise multifarce.LogInError(
                'To log in as the specified user, you must log in through '
                'Google Accounts.',
                'MUST_LOG_IN_GOOGLE')

        if hashlib.sha256(password).hexdigest() != user.password:
            raise multifarce.LogInError(
                'Wrong password.',
                'WRONG_PASSWORD')

        if user.state == 'inactive':
            raise multifarce.LogInError(
                'The user has not been activated.',
                'USER_INACTIVE')

        # No error so far means the user has been successfully authenticated.
        user.start_session(handler)
        return user

    @staticmethod
    def register(username, display_name, email, password=None):
        """Creates a new user that is registered to the application. If the user
        is logged in with a Google account and password is not supplied, the new
        user will be linked to the Google account.

        Only the SHA-256 hash of the password will be stored so that in case the
        database should be exposed, the passwords would not be of any use to the
        attacker.
        """
        try:
            if len(username) < 3:
                raise multifarce.UsernameError(
                    'Username must be at least three characters long.',
                    'USERNAME_TOO_SHORT')
            if len(username) > 20:
                raise multifarce.UsernameError(
                    'Username must not be any longer than 20 characters.',
                    'USERNAME_TOO_LONG')

            if not re.match('^[A-Za-z]([\\-\\._]?[A-Z0-9a-z]+)*$', username):
                raise multifarce.UsernameError(
                    'Username should start with a letter, followed by letters '
                    'and/or digits, optionally with dashes, periods or '
                    'underscores inbetween.',
                    'USERNAME_INVALID_CHARACTERS')

            if User.get_by_key_name(username.lower()):
                raise multifarce.UsernameError(
                    'Username is already in use.',
                    'USERNAME_IN_USE')
        except multifarce.UsernameError, e:
            raise multifarce.RegisterError(
                'Could not use username (%s)' % e,
                e.code)

        try:
            if len(display_name) < 3:
                raise multifarce.UsernameError(
                    'Display name must be at least three characters long.',
                    'DISPLAY_NAME_TOO_SHORT')
            if len(display_name) > 20:
                raise multifarce.UsernameError(
                    'Display name must not be any longer than 20 characters.',
                    'DISPLAY_NAME_TOO_LONG')

            if not re.match('^[A-Z0-9a-z]([-._~\'" ]*[A-Z0-9a-z-~!"]+)*$',
                            display_name):
                raise multifarce.UsernameError(
                    'Display name should consist of letters and/or digits, '
                    'optionally with dashes, periods, underscores, tildes, '
                    'apostrophes, quotes or spaces inbetween.',
                    'DISPLAY_NAME_INVALID_CHARACTERS')

            # XXX: Case sensitive
            qry = User.all(keys_only=True).filter('display_name', display_name)
            if qry.get():
                raise multifarce.UsernameError(
                    'Display name is already in use.',
                    'DISPLAY_NAME_IN_USE')
        except multifarce.UsernameError, e:
            raise multifarce.RegisterError(
                'Could not use display name (%s)' % e,
                e.code)

        try:
            mail.check_email_valid(email, 'to')
        except mail.InvalidEmailError:
            raise multifarce.RegisterError(
                'A valid e-mail address must be provided.',
                'INVALID_EMAIL')

        if User.all(keys_only=True).filter('email', email).get():
            raise multifarce.RegisterError(
                'E-mail address is already in use.',
                'EMAIL_IN_USE')
        
        if password is None:
            google_user = users.get_current_user()
            if not google_user:
                raise multifarce.RegisterError(
                    'Must be logged in through Google Accounts to be able to '
                    'register a linked user.',
                    'MUST_LOG_IN_GOOGLE')
            if User.all(keys_only=True).filter('user', google_user).get():
                raise multifarce.RegisterError(
                    'The current Google account is already linked to an '
                    'existing user.',
                    'GOOGLE_ACCOUNT_IN_USE')
            user = User(key_name=username.lower(),
                        user=google_user,
                        display_name=display_name,
                        email=db.Email(email),
                        state='member')
        elif len(password) < 4:
            raise multifarce.RegisterError(
                'Password must be at least 4 characters long.',
                'INVALID_PASSWORD')
        else:
            user = User(key_name=username.lower(),
                        user=users.User('user@multifarce.com'),
                        display_name=display_name,
                        email=db.Email(email),
                        password=hashlib.sha256(password).hexdigest())

        user.put()
        return user

    def end_session(self, handler):
        """Removes a session from the database and the client, effectively
        logging the user out.
        """
        self.session = None
        self.expires = None
        self.put()

        # Empty session cookie and force it to expire.
        cookie = 'session=; expires=Fri, 31-Jul-1987 03:42:33 GMT'
        handler.response.headers['Set-Cookie'] = cookie
        del handler.request.cookies['session']

    def start_session(self, handler):
        """Gives the user a session id and stores it as a cookie in the user's
        browser.
        """
        # Create a unique session id.
        self.session = uuid.uuid4().get_hex()
        # Calculate the date/time for when the session will expire.
        self.expires = datetime.utcnow() + timedelta(days=7)
        self.put()

        # Build and set a cookie for the session.
        ts = time.strftime('%a, %d-%b-%Y %H:%M:%S GMT',
                           self.expires.timetuple())
        cookie = '%s=%s; expires=%s; path=/' % ('session', self.session, ts)

        # Send cookie to browser.
        handler.response.headers['Set-Cookie'] = cookie
        handler.request.cookies['session'] = self.session
