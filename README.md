# multifarce

multifarce is a simple text adventure game where the idea is that the users contribute to the game. The user begins on a "frame" and has the ability to enter any "command". If the "command" does not exist, the user may create it. The user can then specify what "frame" the command should lead to.

As the project progresses, more advanced features will be introduced, such as score/reputation (which enables more features to the user as it increases) for users to encourage high quality content.

multifarce is developed in Python for [Google App Engine](http://appengine.google.com/) and is currently hosted at <http://beta.multifarce.com/>.

This project also includes a [Google Wave](http://wave.google.com/) robot, which can be added to a Wave using the address <multifarce@appspot.com>.

Due to its open API, it's very easy to create clients for it. All a client has to do is to maintain its state (frame and flags). Here are a few examples of some clients currently available (all of these are included with the project source code):

## Authors

- [Andreas Blixt](http://blixt.org/)
- You?

## License

[Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0)
