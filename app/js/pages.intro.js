$(function () {

// Add functionality to jQuery for easily linking to a frame/command that hasn't
// been loaded yet.
$.fn.command = function (id) {
    var $this = this;

    $this.hash('commands/' + id).text('[Command#' + id + ']');
    api.success(function (command) {
        $this.text(command.synonyms.join(', '));
    }).getCommand(id);

    return $this;
};

$.fn.frame = function (id) {
    var $this = this;

    $this.hash('frames/' + id).text('[Frame#' + id + ']');
    api.success(function (frame) {
        $this.text(frame.title);
    }).getFrame(id);

    return $this;
};

var
// Various elements used by other code.
allPages = $('div.page'),
avatar = $('#avatar img'),
username = $('#username'),
action1 = $('#action-1 a'),
action2 = $('#action-2 a'),

// Make functions defined in the function below available in the current scope.
getPage, setPage, notify;

// Put the following code in its own scope to avoid name collisions.
(function () {
    var
    // The name of the current page.
    pageName = $('#page-name'),
    // The currently shown page.
    shown = allPages.eq(0),
    // The notifications container.
    notifications = $('#notifications');

    // Hide all pages except the first.
    for (var i = 1; i < allPages.length; i++) {
        allPages.eq(i).remove();
    }

    // Helper function for getting the currently shown page.
    getPage = function () {
        return shown;
    };

    // Helper function for setting which page to show.
    setPage = function (title, which, requireLogin, handler, retries) {
        var loggedIn = currentUser.loggedIn();
        if (requireLogin && !loggedIn) {
            if (loggedIn === false) {
                // Show notice and redirect to login page if the user is
                // definitely not logged in.
                if (typeof requireLogin == 'string')
                    notify(requireLogin, 'hint');
                $.hash.go('log-in?continue=' + Application.encode(
                    handler.get_requestPath()).replace(/ /g, '+'));
            } else {
                // Login info has not been retrieved yet; delay the function
                // for a while.
                setTimeout(function () {
                    setPage(title, which, requireLogin, handler,
                            (retries || 0) + 1);
                }, 50);
            }

            return false;
        } else if (requireLogin && retries) {
            handler.run.apply(handler, handler.get_matches());
        }

        if (title) {
            pageName.text(title);
            document.title = title + ' - ' + APP_TITLE;
        }

        if (which && shown[0] != which[0]) {
            shown.replaceWith(which);
            shown = which;
        }

        return true;
    };

    // Helper function for showing a notification.
    notify = function (text, type, click) {
        notifications.empty();
        notifications.append(
            $('<p/>')
                .addClass(type || 'message')
                .append(
                    $('<a href="#"/>')
                        .click(
                            function () {
                                $(this).closest('p').remove();
                                if (click) click();
                                return false;
                            })
                        .text(text)
                        .prepend('<span class="close">&times;</span>'))
                .hide()
                .fadeIn(500)
                .animate({opacity: 0}, 15000, 'easeInQuart',
                    function () {
                        $(this).slideUp(200, function () {
                            $(this).remove();
                        });
                    }));
    };
})();

$('body')
    // Now that the DOM has been set up, remove CSS class.
    .removeClass('dom-loading')
    // Set up loading animation for requests.
    .ajaxStart(function () {
        $(this).addClass('loading');
    })
    .ajaxStop(function () {
        $(this).removeClass('loading');
    });

// Make error handler for the service client show up as
// notifications instead of as alert boxes.
api.set_errorHandler(function (error) {
    notify(error.message, 'error');
});

// Get current user.
var currentUser = User.current();
