var ProfileHandler;
(function () {

var
page = allPages.filter('#profile-page'),
displayName = page.find('#profile-name'),
email = page.find('#profile-email'),
update = page.find('#profile-update');

// Set up events.
$('#profile-update').live('click', function () {
    api.success(function (newUserData) {
        notify('Your profile has been updated!', 'success');
        currentUser.load(newUserData);
        $.hash.go('profile');
    });
    api.updateProfile(email.val(), displayName.val());
});

ProfileHandler = Application.handler(function () {
    if (!setPage('Your profile', page, 'You will need to log in before you ' +
        'can view your profile!', this)) {
        return;
    }

    displayName.val(currentUser.get_displayName());
    email.val(currentUser.get_email());
});

})();