var LogOutHandler;
(function () {

var
page = allPages.filter('#log-out-page');

LogOutHandler = Application.handler(function () {
    setPage('Log out', page);
    
    User.logOut();
});

})();
