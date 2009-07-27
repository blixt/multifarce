// Create application for handling the site.
var site = new Application([
    ['^$', HomeHandler],
    //['^commands/(\d+)$', CommandHandler],
    ['^commands/new$', NewCommandHandler],
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
currentUser.listen('load', function () {
    if (this.loggedIn()) {
        username.text(this.get_displayName());
        avatar.attr('src',
            'http://www.gravatar.com/avatar/' +
            this.get_emailHash() + '?s=28&d=identicon&r=PG');
    } else {
        username.text('Not logged in');
        avatar.attr('src', 'http://www.gravatar.com/avatar/' +
                           '?s=28&d=identicon&r=PG');
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

    allPages.find('a.google-accounts')
        .attr('href', this.get_googleLogUrl());
});

currentUser.load();

// End of $(function () {
});