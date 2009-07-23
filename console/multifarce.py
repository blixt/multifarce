#
# Copyright (c) 2009 Andreas Blixt <andreas@blixt.org>
# Requires Python 2.6.x or later (not Python 3.x.x) to run.
#

import httplib, json, new, urllib

class Client(object):
    API_HOST = 'multifarce.appspot.com'
    API_PATH = '/api/%s'

    def _call(self, _command, **kwargs):
        path = Client.API_PATH % _command
        if kwargs:
            for key in kwargs:
                kwargs[key] = json.dumps(kwargs[key])
            path += '?' + urllib.urlencode(kwargs)

        conn = httplib.HTTPConnection(Client.API_HOST)
        conn.request('GET', path)
        resp = conn.getresponse()
        data = resp.read()
        conn.close()

        return json.loads(data)

    def execute(self, frame, command, flags):
        return self._call('execute', frame=frame, command=command, flags=flags)

    def get_first_frame(self):
        return self._call('get_first_frame')

    def get_frame(self, frame):
        return self._call('get_frame', frame=frame)

class Game(object):
    def __init__(self):
        self._api = Client()
        self._flags = None
        self._frame = None

        self.on_error = None
        self.on_frame = None
        self.on_success = None

    def _fetch_frame(self, frame):
        if frame:
            result = self._api.get_frame(frame)
        else:
            result = self._api.get_first_frame()

        data = result['response']
        status = result['status']

        if status == 'success':
            self._frame = data
            if self.on_frame: self.on_frame(self, data)
        elif status == 'error':
            if self.on_error: self.on_error(self, data)

    def execute(self, command):
        result = self._api.execute(self._frame['id'], command, self._flags)

        data = result['response']
        status = result['status']

        if status == 'success':
            self._flags = data['flags']
            if self.on_success: self.on_success(self, data)
            if data['frame_id'] != self._frame['id']:
                self._fetch_frame(data['frame_id'])
        elif status == 'error':
            if self.on_error: self.on_error(self, data)

    def start(self, frame=None, flags=[]):
        self._flags = flags
        self._fetch_frame(frame)

def handle_error(game, error):
    print error['message']

    cmd = raw_input('> ')
    game.execute(cmd)

def handle_frame(game, frame):
    print 'Entering %s...' % frame['title']
    print frame['text']

    cmd = raw_input('> ')
    game.execute(cmd)

def handle_success(game, result):
    print result['text']

game = Game()
game.on_error = handle_error
game.on_frame = handle_frame
game.on_success = handle_success

print 'multifarce client v1.0'
print '----------------------'

game.start()
