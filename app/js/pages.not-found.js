var NotFoundHandler;
(function () {

var
page = allPages.filter('#not-found-page'),
path = page.find('#not-found-path');

NotFoundHandler = Application.handler(function () {
    path.text(this.get_path());

    setPage('Path not found!', page);
});

})();
