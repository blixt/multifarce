var FrameHandler;
(function () {

var
page = allPages.filter('#frame-page');
frameTitle = page.find('#frame-title'),
frameAuthor = page.find('#frame-author'),
frameText = page.find('#frame-text'),
newCommand = page.find('#frame-create-command'),
commandsIn = page.find('#frame-commands-in'),
commandsOut = page.find('#frame-commands-out'),
commandsTop = page.find('#frame-top-commands'),

FrameHandler = Application.handler(function (frameId) {
    frameId = parseInt(frameId, 10);

    commandsIn.html('<li>Please stand by...</li>');
    commandsOut.html('<li>Please stand by...</li>');
    commandsTop.html('<li>Please stand by...</li>');

    newCommand.hash('commands/new?frame=' + frameId);

    api.success(function (frame) {
        frameTitle.text(frame.title);
        frameAuthor.user(frame.author);
        frameText.formattedText(frame.text);
    });
    api.getFrame(frameId);

    api.success(function (data) {
        commandsIn.empty();

        if (data.length == 0) {
            commandsIn.append('<li>No commands lead here.</li>');
            return;
        }

        for (var i = 0; i < data.length; i++) {
            commandsIn.append($('<li/>')
                .append($('<a/>')
                    .hash('commands/' + data[i].id)
                    .text(data[i].synonyms.join(', '))));
        }
    });
    api.getCommands(null, frameId, null);

    api.success(function (data) {
        commandsOut.empty();

        if (data.length == 0) {
            commandsOut.append('<li>This frame has no commands.</li>');
            return;
        }

        for (var i = 0; i < data.length; i++) {
            commandsOut.append($('<li/>')
                .append($('<a/>')
                    .hash('commands/' + data[i].id)
                    .text(data[i].synonyms.join(', '))));
        }
    });
    api.getCommands(frameId, null, null);

    api.success(function (data) {
        commandsTop.empty();

        if (data.length == 0) {
            commandsTop.append('<li>This frame has no top commands.</li>');
            return;
        }

        for (var i = 0, cu; i < data.length; i++) {
            cu = data[i];

            if (cu.command_id) {
                commandsTop.append($('<li/>')
                    .append($('<a/>')
                        .hash('commands/' + cu.command_id)
                        .text(cu.text))
                    .append($('<span/>')
                        .text(' (' + cu.count + ' time' +
                              (cu.count == 1 ? '' : 's') + ')')));
            } else {
                commandsTop.append($('<li/>')
                    .append($('<span/>')
                        .text(cu.text + ' (' + cu.count + ' time' +
                              (cu.count == 1 ? '' : 's') + ', '))
                    .append($('<a/>')
                        .hash('commands/new?frame=' + frameId + '&command=' +
                              cu.text.replace(/ /g, '+'))
                        .text('create it!'))
                    .append($('<span/>').text(')')));
            }
        }
    });
    api.getTopCommands(frameId);

    setPage('Viewing frame', page);
});

})();
