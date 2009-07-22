#
# Copyright (c) 2009 Andreas Blixt <andreas@blixt.org>
#

__all__ = ['controller', 'model', 'viewer', 'Error', 'CreateCommandError',
           'CreateFrameError', 'InternalError', 'InvalidOperationError',
           'LogInError', 'NotFoundError', 'NotLoggedInError', 'RegisterError',
           'UploadError', 'UsernameError']

class Error(Exception):
    """Base of all exceptions in the multifarce package."""
    def __init__(self, message, code=None):
        self.message = message
        self.code = code

    def __str__(self):
        return self.message

class CreateCommandError(Error):
    """Raised when creating a command fails."""
    pass

class CreateFrameError(Error):
    """Raised when creating a frame fails."""
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

class UsernameError(Error):
    """Raised when an invalid username is used."""
    pass
