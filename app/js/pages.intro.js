$(function () {

var
// Various elements used by other code.
allPages = $('div.page'),
avatar = $('#avatar img'),
username = $('#username'),

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
    setPage = function (title, which) {
        if (title) {
            pageName.text(title);
            document.title = title + ' - ' + APP_TITLE;
        }

        if (!which || shown[0] == which[0]) return;

        shown.replaceWith(which);
        shown = which;
    };

    // Helper function for showing a notification.
    notify = function (text, type) {
        notifications.empty();
        notifications.append(
            $('<p/>')
                .addClass(type || 'message')
                .append(
                    $('<a href="#"/>')
                        .click(
                            function () {
                                $(this).closest('p').remove();
                                return false;
                            })
                        .text(text)
                        .prepend('<span class="close">&times;</span>'))
                .hide()
                .fadeIn(500)
                .animate({opacity: 0}, 15000, 'easeInQuart',
                    function () {
                        $(this).remove();
                    }));
    };
})();

// Set up loading animation for requests.
$('body')
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