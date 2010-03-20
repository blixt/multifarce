var CreateHandler;
(function () {

var
page = allPages.filter('#create-page');
commandSuggestions = page.find('#create-command-suggestions'),
frames = page.find('#create-frames'),
commands = page.find('#create-commands'),

CreateHandler = Application.handler(function () {
    frames.empty();
    commands.empty();

    if (currentUser.loggedIn()) {
        api.success(function (data) {
            for (var i = 0; i < data.length; i++) {
                frames.append(
                    $('<li/>')
                        .append(
                            $('<a/>')
                                .hash('frames/' + data[i].id)
                                .text(data[i].title)));
            }
        });
        api.getFrames(currentUser.get_id());

        api.success(function (data) {
            for (var i = 0; i < data.length; i++) {
                commands.append(
                    $('<li/>')
                        .append(
                            $('<a/>')
                                .hash('commands/' + data[i].id)
                                .text(data[i].synonyms.join(', ')))
                        .append(' on ')
                        .append(
                            $('<a/>').frame(data[i].frame_id)));
            }
        });
        api.getCommands(null, null, currentUser.get_id());
    }

    setPage('Create', page,
        'You need to log in before you can create stuff!', this);
});

})();
