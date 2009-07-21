/**
 * Copyright (c) 2009 Andreas Blixt <andreas@blixt.org>
 */

var ServiceClient = new Class({
    initialize: function (path) {
        this._path = path;
        this._queue = [];
        this._running = false;
    },
    
    call: function (action, args, onSuccess, bind, onError, bindError) {
        if (this._running) {
            this._queue.push([action, args, onSuccess, bind, onError, bindError]);
            return;
        }

        if (!onError) onError = this._errorHandler;

        this._attempts = 0;
        this._running = true;

        var params = {};
        for (var key in args) {
            params[key] = JSON.encode(args[key]);
        }

        var client = this;
        $.ajax({
            cache: false,
            data: params,
            dataType: 'json',
            error: function (xhr, status) {
                if (status != 'timeout') return;

                client._attempts++;
                if (client._attempts < 3) {
                    $.ajax(this);
                } else {
                    // TODO: Report failure to client.
                    client._running = false;
                }
            },
            success: function (data) {
                switch (data.status) {
                    case 'error':
                        if (onError)
                            onError.call(bindError || this._errorBind || bind, data.response);
                        else
                            alert(data.response.type + ': ' + data.response.message);
                        break;
                    case 'list':
                        break;
                    case 'success':
                        if (onSuccess) onSuccess.call(bind, data.response);
                        break;
                    default:
                        alert('Unknown status: ' + data.status);
                        break;
                }

                client._running = false;
                if (client._queue.length > 0) {
                    client.call.apply(client, client._queue.shift());
                }
            },
            timeout: 3000,
            url: client._path + action
        });
    },
    
    errorHandler: function (func, bind) {
        this._errorHandler = func;
        this._errorBind = bind;
    }
});

var MultifarceService = new Class({
    Extends: ServiceClient,

    initialize: function () {
        this.parent('/api/');
    },
    
    getStatus: function (onSuccess, bind, onError, bindError) {
        this.call('status', {}, onSuccess, bind, onError, bindError);
    },
    
    getUserInfo: function (username, onSuccess, bind, onError, bindError) {
        this.call('get_user_info', {username: username}, onSuccess, bind, onError, bindError);
    },
    
    logIn: function (username, password, onSuccess, bind, onError, bindError) {
        this.call('log_in', {username: username, password: password}, onSuccess, bind, onError, bindError);
    }
});

var Page = new Class({
    initialize: function (site, title, className) {
        this.site = site;
        this.className = className;
        this.title = title;
    },
    
    close: function () {},
    render: function () {},
    
    show: function () {
        var site = this.site;
    
        if (site.currentPage == this) return;
        if (site.currentPage) site.currentPage.close();
        site.currentPage = this;

        site.elements.body.attr('class', this.className);
        site.elements.title.text(this.title);
        this.render(site.elements.content);
    }
});

var HomePage = new Class({
    Extends: Page,
    
    initialize: function (site) {
        this.parent(site, 'Home', 'home');
    },
    
    render: function (content) {
        content.html('<h3>Welcome</h3><p>Hello world!</p>');
    }
});

var Site = new Class({
    initialize: function (service, elements) {
        service.errorHandler(this.error, this);

        this.service = service;
        this.elements = elements;

        this.currentPage = null;
        this.google = {
            loggedIn: false,
            nickname: null,
            email: null,
            logInUrl: null,
            logOutUrl: null
        };
        this.user = null;
        this.users = {};
        
        this.service.getStatus(this.updateStatus, this);
    },

    error: function (error) {
        // TODO: Proper error handling.
        alert('ERROR!\n' + error.type + '\n' + error.message);
    },

    getUser: function (username, callback, bind) {
        var user = this.users[username];

        if (!user) user = new User(this, username);

        if (callback) {
            user.whenLoaded(callback, bind);
            user.load();
        }

        this.users[username] = user;
        return user;
    },
    
    logIn: function (username, password) {
        this.service.logIn(username, password, this.updateStatus, this);
    },
    
    updateStatus: function (user) {
        if (user.google_logged_in) {
            this.google.loggedIn = true;
            this.google.nickname = user.google_nickname;
            this.google.email = user.google_email;
            this.google.logOutUrl = user.google_logout;
        } else {
            this.google.loggedIn = false;
            this.google.nickname = null;
            this.google.email = null;
            this.google.logInUrl = user.google_login;
        }

        if (user.logged_in) {
            this.elements.user.name.text(user.display_name);
            
            switch (user.type) {
                case 'local':
                    // TODO: Handle onclick
                    this.elements.user.content.html('<a href="#log-out">Log out</a>');
                    break;
                case 'google':
                    this.elements.user.content.html('<a href="' + this.google.logOutUrl + '">Log out</a>');
                    break;
            }

            this.user = this.getUser(user.username);
            this.user.displayName = user.display_name;
            this.user.email = user.email;
            this.user.type = user.type;

            this.user.loaded = true;
            this.user.runCallbacks();
        } else {
            this.user = null;

            if (this.google.loggedIn) {
                this.elements.user.name.text(this.google.email);
                this.elements.user.content.html('<a href="#register">Register</a> <a href="' + this.google.logOutUrl + '">Log out</a>');
            } else {
                this.elements.user.name.text('Not logged in');
                this.elements.user.content.html('<a href="' + this.google.logInUrl + '">Log in using Google Accounts</a> <a href="#register">Register</a>');
            }
        }
    }
});

var User = new Class({
    initialize: function (site, username) {
        this.site = site;
        this.username = username;
        this.displayName = null;
        this.loaded = false;
        this.loading = false;

        this.callbacks = [];
    },
    
    _onLoad: function (user) {
        this.displayName = user.display_name;

        this.loaded = true;
        this.loading = false;
        
        this.runCallbacks();
    },
    
    load: function (reload) {
        if (this.loading || (this.loaded && !reload)) return;

        this.loading = true;
        this.site.service.getUserInfo(this.username, function (data) {
            this._onLoad(data);
        }, this);
    },
    
    runCallbacks: function () {
        for (var i = 0; i < this.callbacks.length; i++) {
            var callback = this.callbacks[i];
            callback[0].call(callback[1], this);
        }
    },
    
    whenLoaded: function (callback, bind) {
        if (this.loaded) {
            callback.call(bind, this);
        }

        this.callbacks.push([callback, bind]);
    }
});

$(function () {
    $('#header').append('<div id="user"><p class="title"><span class="name">Please wait...</span></p><p class="content"></p></div>');

    var service = new MultifarceService();
    var site = new Site(service, {
        body: $('body'),
        title: $('h2'),
        content: $('#content'),
        user: {
            content: $('#user p.content'),
            name: $('#user p.title span.name')
        }
    });

    var home = new HomePage(site);
    home.show();
});

