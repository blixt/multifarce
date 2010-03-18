var RegisterHandler;
(function () {

var
page = allPages.filter('#register-page'),
email = page.find('#register-email'),
displayName = page.find('#register-name'),
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
    api.register(email.val(), displayName.val(), password.val() || null);
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
    email.val(
        currentUser.googleLoggedIn() ? currentUser.get_googleEmail() : '');
    displayName.val('');
    password.val('');
    passwordRepeat.val('');
    useGoogle.filter('[value=no]').attr('checked', true);
    $([password[0], passwordRepeat[0]])
        .attr('disabled', false)
        .parent()
            .removeClass('disabled');

    setPage('Register', page);
});

})();
