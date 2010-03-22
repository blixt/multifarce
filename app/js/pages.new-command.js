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
cleanCommands = page.find('#new-command-clean'),
text = page.find('#new-command-text'),
goToFrame = page.find('#new-command-go-to-frame'),
go = page.find('#new-command-go');

// Set up events.
$('#new-command-go').live('click', function () {
    var commands = [command1.val(), command2.val(), command3.val(),
                    command4.val(), command5.val()];

    var frameId = parseInt(frame.val(), 10);
    var goToFrameId = parseInt(goToFrame.val(), 10);
    if (goToFrameId <= 0) goToFrameId = null;

    api.success(function (command) {
        notify('The command has been successfully created!', 'success');
        $.hash.go('commands/' + command.id);
    });
    api.createCommand(frameId, commands, text.val(), goToFrameId);
});

$('#new-command-clean').live('click', function () {
    api.success(function (commands) {
        command1.val(commands[0] || '');
        command2.val(commands[1] || '');
        command3.val(commands[2] || '');
        command4.val(commands[3] || '');
        command5.val(commands[4] || '');
    });
    api.clean([command1.val(), command2.val(), command3.val(), command4.val(),
               command5.val()]);

    return false;
});

NewCommandHandler = Application.handler(function () {
    if (!setPage('Creating new command', page, 'You will need to log in ' +
                 'before you can create a command!', this)) {
        return;
    }

    frame.empty();
    goToFrame.empty();
    command1.val(this.get_param('command', ''));
    command2.val('');
    command3.val('');
    command4.val('');
    command5.val('');
    text.val('');

    api.success(function (frames) {
        goToFrame.append('<option value="-1">(No frame)</option>');
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

        frame.val(this.get_param('frame', ''));
    }, this).getFrames();
});

})();
