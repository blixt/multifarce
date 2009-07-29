// Create application for handling the site.
var site = new Application([
    ['^$', HomeHandler],
    //['^commands/(\d+)$', CommandHandler],
    ['^commands/new$', NewCommandHandler],
    ['^create$', CreateHandler],
    //['^frames/(\d+)$', FrameHandler],
    ['^frames/new$', NewFrameHandler],
    ['^log-in$', LogInHandler],
    ['^log-out$', LogOutHandler],
    ['^register$', RegisterHandler],
    //['^user/([^/]+)$', UserHandler],
    ['^.*$', NotFoundHandler]
]);

// Set up application to use hash as the path.
$(document).hashchange(function (e, newHash) {
    site.exec(newHash);
});
$.hash.init();

// Handle current user.
var showHide = function (show, hide) {
    allPages.find(show).each(function () {
        var el = $(this), hidden = el.data('hidden');
        if (hidden) el.append(hidden);
        el.removeData('hidden');
    });

    allPages.find(hide).each(function () {
        var el = $(this);
        if (el.data('hidden')) return;
        el.data('hidden', el.children().remove());
    });
};

currentUser.listen('load', function () {
    if (this.loggedIn()) {
        username.empty().append(
            $('<a/>').hash('profile').text(this.get_displayName()));

        avatar.attr('src', 'http://www.gravatar.com/avatar/' +
            this.get_emailHash() + '?s=28&d=identicon&r=PG');
        action1.text('Create').hash('create');
        action2.text('Log out').hash('log-out');
    } else {
        username.text('Not logged in');
        avatar.attr('src', 'http://www.gravatar.com/avatar/' +
                           '?s=28&d=identicon&r=PG');
        action1.text('Register').hash('register');
        action2.text('Log in').hash('log-in');
    }
    
    // Handle Google Accounts notices.
    var show, hide;
    if (this.googleLoggedIn()) {
        show = 'div.google';
        hide = 'div.not-google';
    } else {
        show = 'div.not-google';
        hide = 'div.google';
    }

    if (this.loggedIn()) {
        show += ', div.multifarce';
        hide += ', div.not-multifarce';
    } else {
        show += ', div.not-multifarce';
        hide += ', div.multifarce';
    }

    showHide(show, hide);

    allPages.find('a.google-accounts')
        .attr('href', this.get_googleLogUrl());
});

// Hide all notices until the user has been loaded.
showHide('', 'div.google, div.not-google, div.multifarce, div.not-multifarce');

currentUser.load();

// End of $(function () {
});