var NewCommandHandler;
(function () {

var
page = allPages.filter('#new-command-page'),
frame = page.find('#new-command-frame'),
command1 = page.find('#new-command-1'),
command2 = page.find('#new-command-2'),
command3 = page.find('#new-command-3'),
command4 = page.find('#new-command-4'),
command5 = page.find('#new-command-5'),
text = page.find('#new-command-text'),
goToFrame = page.find('#new-command-go-to-frame'),
go = page.find('#new-command-go');

// Set up events.
$('#new-command-go').live('click', function () {
    var commands = [];
    
    if (command1.val()) commands.push(command1.val());
    if (command2.val()) commands.push(command2.val());
    if (command3.val()) commands.push(command3.val());
    if (command4.val()) commands.push(command4.val());
    if (command5.val()) commands.push(command5.val());
    
    api.success(function(){alert('Success!')}).createCommand(
        parseInt(frame.val(), 10),
        commands,
        text.val(),
        parseInt(goToFrame.val(), 10));
});

NewCommandHandler = Application.handler(function () {
    frame.empty();
    goToFrame.empty();
    
    api.success(function (frames) {
        for (var i = 0; i < frames.length; i++) {
            frame.append(
                $('<option/>')
                    .val(frames[i].id)
                    .text(frames[i].title));
            goToFrame.append(
                $('<option/>')
                    .val(frames[i].id)
                    .text(frames[i].title));
        }
    }).getFrames();

    setPage('Creating new command', page);
});

})();
