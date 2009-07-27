var RegisterHandler;
(function () {

var
page = allPages.filter('#register-page'),
username = page.find('#register-username'),
displayName = page.find('#register-name'),
email = page.find('#register-email'),
password = page.find('#register-password'),
passwordRepeat = page.find('#register-password-repeat'),
go = page.find('#register-go');

// Set up events.
// TODO: Improve this. Needs password/repeat password verify
//       etc.
$('#register-go').live('click', function () {
    api.success(function () {
        alert('Success!');
        if (currentUser.googleLoggedIn()) {
            currentUser.load();
            $.hash.go('');
        } else {
            $.hash.go('log-in');
        }
    });
    api.register(
        username.val(), displayName.val(),
        password.val() || null, email.val());
});

RegisterHandler = Application.handler(function () {
    setPage('Register', page);
});

})();
