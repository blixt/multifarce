var NewFrameHandler;
(function () {

var
page = allPages.filter('#new-frame-page'),
title = page.find('#new-frame-title'),
text = page.find('#new-frame-text'),
go = page.find('#new-frame-go');

// Set up events.
$('#new-frame-go').live('click', function () {
    api.success(function(){alert('Success!')}).createFrame(
        title.val(),
        text.val()
    );
});

NewFrameHandler = Application.handler(function () {
    setPage('Creating new frame', page);
});

})();