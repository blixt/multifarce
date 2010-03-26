var CommandHandler;
(function () {

var
page = allPages.filter('#command-page');
title = page.find('#command-title'),
author = page.find('#command-author'),
frameLink = page.find('#command-frame a'),
text = page.find('#command-text'),
leadsTo = page.find('#command-leads-to'),
leadsToLink = leadsTo.children('a'),

CommandHandler = Application.handler(function (commandId) {
    commandId = parseInt(commandId, 10);

    api.success(function (command) {
        title.text('Command (' + command.synonyms.join(', ') + ')');
        author.user(command.author);
        frameLink.frame(command.frame_id);
        text.text(command.text);
        if (command.go_to_frame_id) {
            leadsToLink.frame(command.go_to_frame_id);
            leadsTo.show();
        } else {
            leadsTo.hide();
        }
    });
    api.getCommand(commandId);

    setPage('Viewing command', page);
});

})();
