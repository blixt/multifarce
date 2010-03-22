var NewFrameHandler;
(function () {

var
page = allPages.filter('#new-frame-page'),
title = page.find('#new-frame-title'),
text = page.find('#new-frame-text'),
go = page.find('#new-frame-go');

// Set up events.
$('#new-frame-go').live('click', function () {
    api.success(function (frame) {
        notify('The frame has been successfully created!', 'success');
        $.hash.go('frames/' + frame.id);
    });
    api.createFrame(title.val(), text.val());
});

NewFrameHandler = Application.handler(function () {
    if (!setPage('Creating new frame', page, 'You will need to log in ' +
                 'before you can create a frame!', this)) {
        return;
    }

    title.val('');
    text.val('');
});

})();