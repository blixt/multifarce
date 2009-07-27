var LogInHandler;
(function () {

var
page = allPages.filter('#log-in-page'),
username = page.find('#log-in-username'),
password = page.find('#log-in-password'),
go = page.find('#log-in-go');

// Set up events.
$('#log-in-go').live('click', function () {
    User.logIn(username.val(), password.val());
    username.val('');
    password.val('');
});

LogInHandler = Application.handler(function () {
    setPage('Log in', page);
});

})();
