var HomeHandler;
(function () {

var
page = allPages.filter('#home-page'),

frame = page.find('#current-frame'),
frameTitle = frame.children('h3'),
frameText = frame.children('div.text'),

action = page.find('#action'),
doIt = page.find('#action-go'),
log = page.find('#log'),

// Helper function for executing a command.
execute = function () {
    var command = action.val().toLowerCase();
    if (!command) return;

    action.val('');
    log.prepend(
        $('<div class="command"/>').text('> ' + command));

    if (command == 'reset' || command == 'start') {
        log.prepend(
            $('<div class="result"/>').text('Starting...'));
        game.start();
    } else {
        game.execute(command);
    }
    
    action.focus();
};

// Set up events.
$('#action').live('keydown', function (event) {
    if (event.keyCode == 13) execute();
});
$('#action-go').live('click', execute);

// Set up game.
game.listen('frame-load', function (data) {
    if (game.get_frameId()) $.hash.go('?state=' + game.get_state());

    // Update title.
    setPage(data.title, page);

    // Animate the frame display to show the new frame.
    frame.stop(true)
         .animate({height: 0, opacity: 0}, 400)
         .queue(function () {
            frameTitle.text(data.title);
            frameText.formattedText(data.text);
            
            // Calculate new height that the frame will expand to.
            frame.css({
                position: 'absolute',
                height: 'auto'
            });

            // Queue animation to that height.
            frame.animate({
                height: frame.height(),
                opacity: 1
            }, 1000);
            
            // Reset height.
            frame.css({
                height: 0,
                position: 'static'
            });

            frame.dequeue();
         });

    // Add an entry to the log.
    log.prepend(
        $('<div class="frame"/>')
            .append($('<p class="entering"/>')
                .append('Entering ')
                .append($('<strong/>').text(data.title)))
            .append($('<div/>')
                .formattedText(data.text)));
});

// Handle execution errors.
game.listen('execute-error', function (error) {
    // Show a notification.
    notify(error.message, 'error');

    // Add an entry to the log.
    log.prepend(
        $('<div class="result"/>').text(error.message));
});

// Handle execution success.
game.listen('execute-success', function (result) {
    // When a command has been called, update the state parameter.
    $.hash.go('?state=' + game.get_state());

    // Show a notification.
    notify(result.text, 'success');

    // Add an entry to the log.
    log.prepend(
        $('<div class="result"/>').text(result.text));
});

// Focus on the input field.
action.focus();

HomeHandler = Application.handler(function () {
    var
    curFrameId = game.get_frameId(),
    state = this.get_param('state');

    // Handle state.
    if (state) {
        game.set_state(state);
    } else if (curFrameId > 0) {
        $.hash.go('?state=' + game.get_state());
    }

    setPage(game.get_frameTitle() || 'Hello World!', page);
});

})();
