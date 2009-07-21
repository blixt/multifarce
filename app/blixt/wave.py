#
# Copyright (c) 2009 Andreas Blixt <andreas@blixt.org>
# License: MIT license <http://www.opensource.org/licenses/mit-license.php>
#

"""Utility module for the Google Wave API.
"""

import waveapi.document

def append_text(document, text):
    """Adds text to the specified document and returns the range of the text.
    """
    start = len(document.GetText())
    document.AppendText(text)
    return waveapi.document.Range(start, start + len(text))

def get_annotations(blip, group=None):
    """Gets all the annotations on the specified blip as a dict.
    If a group is specified, only the annotations under that group are
    returned, without the group in their name.

    TODO: This method currently only supports unique annotations. If
          multiple annotations with the same name exist, only the value of
          the last will be kept.
    """
    values = {}

    for annotation in blip.annotations:
        if group:
            pieces = annotation.name.split('/', 2)
            if len(pieces) == 2 and pieces[0] == group:
                values[pieces[1]] = annotation.value
        else:
            values[annotation.name] = annotation.value

    return values

def write_annotations(document, group=None, **values):
    """Writes the specified annotations to the document, optionally in
    the specified group. Annotations are specified as keyword arguments.
    """
    for name in values:
        value = values[name]
        if group: name = group + '/' + name
        document.AnnotateDocument(name, value)
