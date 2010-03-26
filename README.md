# multifarce

## Running the code locally

First of all, you will need to have the [Google App Engine SDK](http://code.google.com/appengine/) installed.

To build all JavaScript files into one file (and compress it), you will need to run the `prepare.py` script. On a UNIX system, you would run it like this:

    $ ./prepare.py

The `prepare.py` script must be run whenever the JavaScript code has changed.

After this, you need to start the Google App Engine development server and browse to <http://localhost/admin/setup>. This is a script that will generate a default user and the initial frame. It requires admin privileges, so check the "Sign in as Administrator" box.

## Information

multifarce is a simple text adventure game where the idea is that the users contribute to the game. The user begins on a "frame" and has the ability to enter any "command". If the "command" does not exist, the user may create it. The user can then specify what "frame" the command should lead to.

As the project progresses, more advanced features will be introduced, such as score/reputation (which enables more features to the user as it increases) for users to encourage high quality content.

multifarce is developed in Python for [Google App Engine](http://appengine.google.com/) and is currently hosted at <http://beta.multifarce.com/>.

This project also includes a [Google Wave](http://wave.google.com/) robot, which can be added to a Wave using the address <multifarce@appspot.com>.

Due to its open API, it's very easy to create clients for it. All a client has to do is to maintain its state (frame and flags). Here are a few examples of some clients currently available (all of these are included with the project source code):

### Web interface

The "real" client with the most functionality.

![](http://s.blixt.org/multifarce-web.png)

### Google Wave robot

A simple robot that keeps its state in its last outputted blip. A response to the blip will be considered a command. This way, a single wave can have threaded adventures (i.e., you can continue an adventure from any previous point in the wave.)

![](http://s.blixt.org/multifarce-wave.png)

### Console application

Back to basics! A very simple console application used as an example on how to make a client.

![](http://s.blixt.org/multifarce-console.png)

## Authors

- [Andreas Blixt](http://blixt.org/)
- You?

## License

[Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0)
