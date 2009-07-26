import random

from django.utils import simplejson

import blixt.wave

import multifarce
import multifarce.controller
import multifarce.model

import waveapi.document
import waveapi.events
import waveapi.model
import waveapi.robot

INIT_FRAME_ID = 1
NEW_COMMAND = 'http://beta.multifarce.com/#commands/new?frame_id=%d'
HINTS = ['A text-adventure bot!',
         'YOU can continue the story! http://beta.multifarce.com/',
         'Reply with a command to play!',
         'A community project! http://beta.multifarce.com/',
         'This project is open source! http://beta.multifarce.com/',
         'I put on my robe and wizard hat.']

class MultifarceBot(object):
    def __init__(self, context):
        """Creates a new multifarce robot for the specified context.
        """
        self.context = context
        self.wavelet = context.GetRootWavelet()
        self.controller = multifarce.controller.MultifarceController()

    # "Private" members
    def _create_blip(self, parent=None):
        """Creates a new blip and sets it up with default values. If a parent
        blip is specified, the blip will be created as a reply to that blip,
        otherwise the new blip will be created at the end of the current
        wavelet.
        """
        if parent:
            blip = parent.CreateChild()
        else:
            blip = self.wavelet.CreateBlip()
        document = blip.GetDocument()
        document.AnnotateDocument('style/fontFamily', 'monospace')
        document.AppendText('\n')
        rng = blixt.wave.append_text(document, random.choice(HINTS))
        document.AppendText('\n')

        document.SetAnnotation(rng, 'style/color', 'gray')
        document.SetAnnotation(rng, 'style/fontFamily', 'sans-serif')

        return blip

    def _write_frame(self, document, frame, flags):
        """Outputs the text for a frame and adds the annotations for it.
        """
        document.AppendText('Entering ')
        rng = blixt.wave.append_text(document, frame['title'])
        document.AppendText('\n' + frame['text'])

        document.SetAnnotation(rng, 'style/fontWeight', 'bold')

        # Write the multifarce state to the current blip.
        blixt.wave.write_annotations(document, 'multifarce',
                                     frame_id=frame['id'],
                                     flags=simplejson.dumps(flags))

    # Event handlers
    def on_added(self, properties):
        """Event handler for when the robot is added to a wavelet.
        """
        # Create a new blip at the end of the wavelet.
        blip = self._create_blip()
        document = blip.GetDocument()

        # Output initial frame.
        frame = self.controller.get_frame(INIT_FRAME_ID)
        self._write_frame(document, frame, [])

    def on_blip_submitted(self, properties):
        """Event handler for when a new blip is submitted to a wavelet that the
        robot is on.
        """
        # Get the blip that was submitted.
        blip = self.context.GetBlipById(properties['blipId'])
        document = blip.GetDocument()

        # Attempt to get multifarce state from parent blip.
        parent = self.context.GetBlipById(blip.GetParentBlipId())
        state = blixt.wave.get_annotations(parent, 'multifarce')
        if len(state) > 0:
            try:
                frame_id = int(state['frame_id'])
                flags = simplejson.loads(state['flags'])
            except:
                # Invalid data; this blip will be ignored.
                return

            # Execute the command in the blip.
            self.execute(self._create_blip(blip),
                         frame_id, document.GetText(), flags)

    # Public members
    def execute(self, blip, frame_id, command, flags):
        """Executes the specified command and outputs the result to the
        specified blip.
        """
        document = blip.GetDocument()

        # Clean the command string.
        command = multifarce.model.Command.clean(command)
        # Execute the command.
        try:
            result = self.controller.execute(frame_id, command, flags)
            flags = result['flags']

            document.AppendText(result['text'])

            if result['frame_id'] != frame_id:
                # The command leads to another frame.
                document.AppendText('\n---\n')

                # Get the next frame and output it.
                frame = self.controller.get_frame(result['frame_id'])
                self._write_frame(document, frame, flags)

                return
        except multifarce.ExecuteError, e:
            if e.code == 'COMMAND_NOT_FOUND':
                document.AppendText('The command "%s" was not recognized. You '
                                    'may ' % command)
                rng = blixt.wave.append_text(document, 'create the command')
                document.AppendText(' yourself!')

                document.SetAnnotation(rng, 'link/manual',
                                       NEW_COMMAND % frame_id)
            else:
                document.AppendText(e.message)

        # Write the multifarce state to the current blip.
        blixt.wave.write_annotations(document, 'multifarce',
                                     frame_id=frame_id,
                                     flags=simplejson.dumps(flags))

def OnBlipSubmitted(properties, context):
    MultifarceBot(context).on_blip_submitted(properties)

def OnRobotAdded(properties, context):
    MultifarceBot(context).on_added(properties)

if __name__ == '__main__':
    bot = waveapi.robot.Robot(
        'multifarce',
        image_url='http://multifarce.appspot.com/media/multifarce.png',
        version='1.4',
        profile_url='http://multifarce.appspot.com/')
    bot.RegisterHandler(waveapi.events.BLIP_SUBMITTED, OnBlipSubmitted)
    bot.RegisterHandler(waveapi.events.WAVELET_SELF_ADDED, OnRobotAdded)
    bot.Run()
