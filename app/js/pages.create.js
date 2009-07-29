var CreateHandler;
(function () {

var
page = allPages.filter('#create-page');

CreateHandler = Application.handler(function () {
    setPage('Create', page);
});

})();
