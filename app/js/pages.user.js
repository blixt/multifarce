var UserHandler;
(function () {

var
page = allPages.filter('#user-page'),
name = page.find('#user-name'),
imageContainer = page.find('#user-image'),
image = imageContainer.children('img'),
frames = page.find('#user-frames'),
commands = page.find('#user-commands'),

// A reusable function for handling a loaded user. It has to be reusable so
// that it can be referenced in the unlisten method.
userLoaded = function () {
    name.text(this.get_displayName());
    image.attr('src', this.get_gravatarUrl(150));
    imageContainer.show();
},
// A reference to the last user instance the above event handler was atttached
// to. This is used to be able to detach events so the user handler doesn't
// end up attaching lots of load events to the user instances.
attachedTo;

UserHandler = Application.handler(function (userId) {
    userId = parseInt(userId, 10);

    var user = User.get(userId);
    
    // Detach previous load handler (if any).
    if (attachedTo) attachedTo.unlisten('load', userLoaded);
    // Handle new user load event.
    user.listen('load', userLoaded);
    // Remember user instance for next request.
    attachedTo = user;
    
    if (user.isLoaded()) {
        // Run the load handler directly, since the user has already been
        // loaded.
        userLoaded.call(user);
    } else {
        name.text('Loading user...');
        imageContainer.hide();
        user.load();
    }

    frames.html('<li>Please stand by...</li>');
    commands.html('<li>Please stand by...</li>');

    api.success(function (data) {
        frames.empty();

        if (data.length == 0) {
            frames.append(
                '<li>This user has not created any frames yet.</li>');
            return;
        }

        for (var i = 0; i < data.length; i++) {
            frames.append($('<li/>')
                .append($('<a/>')
                    .hash('frames/' + data[i].id)
                    .text(data[i].title)));
        }
    });
    api.getFrames(userId);

    api.success(function (data) {
        commands.empty();

        if (data.length == 0) {
            commands.append(
                '<li>This user has not created any commands yet.</li>');
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
    api.getCommands(null, null, userId);

    setPage('Viewing user', page);
});

})();
