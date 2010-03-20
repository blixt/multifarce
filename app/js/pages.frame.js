var FrameHandler;
(function () {

var
page = allPages.filter('#frame-page');
frameTitle = page.find('#frame-title'),
frameText = page.find('#frame-text'),
commandsIn = page.find('#frame-commands-in'),
commandsOut = page.find('#frame-commands-out'),
commandsTop = page.find('#frame-top-commands'),

FrameHandler = Application.handler(function (frameId) {
    frameId = parseInt(frameId, 10);

    commandsIn.empty();
    commandsOut.empty();
    commandsTop.empty();

    api.success(function (frame) {
        frameTitle.text(frame.title);
        frameText.formattedText(frame.text);
    });
    api.getFrame(frameId);

    api.success(function (data) {
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
        if (data.length == 0) {
            commandsTop.append('<li>This frame has no top commands.</li>');
            return;
        }

        for (var i = 0; i < data.length; i++) {
            if (data[i].command_id) {
                commandsTop.append($('<li/>')
                    .append($('<a/>')
                        .hash('commands/' + data[i].command_id)
                        .text(data[i].text)));
            } else {
                commandsTop.append($('<li/>').text(data[i].text));
            }
        }
    });
    api.getTopCommands(frameId);

    setPage('Viewing frame', page);
});

})();
