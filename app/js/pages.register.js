var RegisterHandler;
(function () {

var
page = allPages.filter('#register-page'),
username = page.find('#register-username'),
displayName = page.find('#register-name'),
email = page.find('#register-email'),
password = page.find('#register-password'),
passwordRepeat = page.find('#register-password-2'),
useGoogle = page.find('input[name=register-use-google]'),
go = page.find('#register-go');

// Set up events.
$('#register-go').live('click', function () {
    if (useGoogle.filter(':checked').val() == 'no') {
        // Validate password.
        if (!password.val()) {
            notify('You must enter a password.', 'error');
            return;
        } else if (password.val() != passwordRepeat.val()) {
            notify('The passwords do not match.', 'error');
            return;
        }
    }

    api.success(function () {
        notify('You have been successfully registered!', 'success');
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

$('#register-page input[name=register-use-google]').live('click', function () {
    if (useGoogle.filter(':checked').val() == 'yes') {
        $([password[0], passwordRepeat[0]])
            .attr('disabled', true)
            .val('')
            .parent()
                .addClass('disabled');
    } else {
        $([password[0], passwordRepeat[0]])
            .attr('disabled', false)
            .parent()
                .removeClass('disabled');
    }
});

RegisterHandler = Application.handler(function () {
    setPage('Register', page);
});

})();
