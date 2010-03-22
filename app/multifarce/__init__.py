#
# Copyright (c) 2009 Andreas Blixt <andreas@blixt.org>
#

import os

__all__ = ['controller', 'model', 'viewer', 'Error', 'CreateCommandError',
           'CreateFrameError', 'EmailError', 'InternalError',
           'InvalidOperationError', 'LogInError', 'NameError', 'NotFoundError',
           'NotLoggedInError', 'RegisterError', 'UploadError', 'SYNONYMS',
           'STOP_WORDS']

# Variable to know whether code is running on a development server.
DEBUG = os.environ['SERVER_SOFTWARE'].startswith('Development')

# Words that will be merged, to make it easier to "find" a command. The first
# word will be the one that's really stored in the database and later used for
# finding the command.
# This has to be carefully balanced so that intricacies of the language aren't
# lost. Avoid words that can be more than one type (e.g. view which can be both
# noun and verb.)
# Can also be used to correct common misspellings.
SYNONYMS = [
    ('go', 'walk', 'travel'),
    ('inspect', 'look at'),
    ('get', 'pick up', 'take', 'fetch'),
    ('run', 'sprint'),
    ('jump', 'leap', 'hop'),
]

# Words that will be ignored (removed.)
STOP_WORDS = ['a', 'an', 'the']

class Error(Exception):
    """Base of all exceptions in the multifarce package."""
    def __init__(self, message, code=None, data=None):
        self.message = message
        self.code = code
        self.data = data

    def __str__(self):
        return self.message

class CreateCommandError(Error):
    """Raised when creating a command fails."""
    pass

class CreateFrameError(Error):
    """Raised when creating a frame fails."""
    pass

class EmailError(Error):
    """Raised when an invalid e-mail is used."""
    pass

class ExecuteError(Error):
    """Raised when the execution of a command fails."""
    pass

class FindCommandError(Error):
    """Raised when invalid arguments are supplied for finding a command."""
    pass

class GetCommandError(Error):
    """Raised when getting a command failed."""
    pass

class GetFrameError(Error):
    """Raised when getting a frame failed."""
    pass

class InternalError(Error):
    """Raised when something that shouldn't happen happens."""
    pass

class InvalidOperationError(Error):
    """Raised when the user tries to do something he/she should not do."""
    pass

class LogInError(Error):
    """Raised when a login attempt fails."""
    pass

class NameError(Error):
    """Raised when an invalid name is used."""
    pass

class NotFoundError(Error):
    """Raised when an item could not be found."""
    pass

class NotLoggedInError(Error):
    """Raised when the user is not logged in and tries to perform an action that
    requires her/him to be logged in.

    """
    pass

class RegisterError(Error):
    """Raised when registration of a new user fails."""
    pass

class UploadError(Error):
    """Raised when an upload fails."""
    pass
