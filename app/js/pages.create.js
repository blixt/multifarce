var CreateHandler;
(function () {

var
page = allPages.filter('#create-page'),
commandSuggestions = page.find('#create-command-suggestions'),
frames = page.find('#create-frames'),
commands = page.find('#create-commands');

CreateHandler = Application.handler(function () {
    if (!setPage('Create', page, 'You need to log in before you can create ' +
                                 'stuff!', this)) {
        return;
    }

    commandSuggestions.html('<li>Please stand by...</li>');
    frames.html('<li>Please stand by...</li>');
    commands.html('<li>Please stand by...</li>');

    api.success(function (data) {
        commandSuggestions.empty();

        if (data.length == 0) {
            commandSuggestions.append(
                '<li>Sorry, I\'m all out of suggestions!</li>');
            return;
        }

        for (var i = 0, cu; i < data.length; i++) {
            cu = data[i];

            commandSuggestions.append($('<li/>')
                .text(cu.text + ' on ')
                .append($('<a/>').frame(cu.frame_id))
                .append(' (' + cu.count + ' time' + (cu.count == 1 ? '' :
                        's') + ', ')
                .append($('<a/>')
                    .hash('commands/new?frame=' + cu.frame_id + '&command=' +
                          cu.text.replace(/ /g, '+'))
                    .text('create it!'))
                .append($('<span/>').text(')')));
        }
    });
    api.getTopCommands(null, false);

    api.success(function (data) {
        frames.empty();

        if (data.length == 0) {
            frames.append('<li>You have not created any frames yet.</li>');
            return;
        }

        for (var i = 0; i < data.length; i++) {
            frames.append($('<li/>')
                .append($('<a/>')
                    .hash('frames/' + data[i].id)
                    .text(data[i].title)));
        }
    });
    api.getFrames(currentUser.get_id());

    api.success(function (data) {
        commands.empty();

        if (data.length == 0) {
            commands.append('<li>You have not created any commands yet.</li>');
            return;
        }

        for (var i = 0; i < data.length; i++) {
            commands.append($('<li/>')
                .append($('<a/>')
                    .hash('commands/' + data[i].id)
                    .text(data[i].synonyms.join(', ')))
                .append(' on ')
                .append($('<a/>').frame(data[i].frame_id)));
        }
    });
    api.getCommands(null, null, currentUser.get_id());
});

})();
