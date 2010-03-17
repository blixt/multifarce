var LogInHandler;
(function () {

var
page = allPages.filter('#log-in-page'),
email = page.find('#log-in-email'),
password = page.find('#log-in-password'),
go = page.find('#log-in-go'),

nextPath = '',
greetings = [
    'Hi {name}!',
    'Howdy {name}!',
    'Hello {name}!',
    'Yo {name}!',
    'G\'day {name}!',
    '¡Hola {name}!',
    'Salut {name}!',
    'Konnichiwa {name}!',
    'Ciao {name}!'];

// Set up events.
$('#log-in-go').live('click', function () {
    User.logIn(email.val(), password.val(), function (user) {
        var i = Math.floor(Math.random() * greetings.length);
        notify(greetings[i].replace('{name}', user.display_name), 'success');
        $.hash.go(nextPath);
    });
    password.val('');
});

LogInHandler = Application.handler(function () {
    nextPath = this.get_param('continue', '');

    email.val('');
    password.val('');

    setPage('Log in', page);
});

})();
