#
# Copyright (c) 2009 Andreas Blixt <andreas@blixt.org>
#

import blixt.appengine.web
import multifarce.controller

class MultifarceService(blixt.appengine.web.JsonService,
                        multifarce.controller.MultifarceController):
    pass
