#
# Copyright (c) 2009 Andreas Blixt <andreas@blixt.org>
# License: MIT license <http://www.opensource.org/licenses/mit-license.php>
#

"""Utility classes and functions.
"""

def contains(sequence, value):
    """A recursive version of the 'in' operator.
    """
    for i in sequence:
        if i == value or (hasattr(i, '__iter__') and contains(i, value)):
            return True
    return False
