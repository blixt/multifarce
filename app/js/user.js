var User = (function () {
    // Private static members.
    var
    cache = {},
    currentUser,

    // Constructor.
    cls = function (username) {
        // Inherit EventSource functionality.
        EventSource.call(this, 'load');
        
        // Private members.
        var loaded = false, data,

        error = function () {
            this.clearHandlers();
            if (username) delete cache[username];
        },
        
        success = function (user) {
            data = user;
            loaded = true;
            this.raise('load');
        };
        
        // Getters/setters.
        this.get_displayName = function () { return data.display_name; };
        this.get_emailHash = function () { return data.email_md5; };
        this.get_username = function () { return data.username; };
        this.isCurrent = function () { return this == currentUser; };
        this.isLoaded = function () { return loaded; };
        
        // Extra functionality for the special "current user" object.
        if (!username) {
            this.get_email = function () { return data.email; };
            this.get_googleEmail = function () {
                return data.google_email;
            };
            this.get_googleLogUrl = function () {
                return data.google_login || data.google_logout;
            };
            this.get_googleNickname = function () {
                return data.google_nickname;
            };
            this.get_type = function () { return data.type; };

            this.googleLoggedIn = function () {
                return data.google_logged_in;
            };
            this.loggedIn = function () { return data.logged_in; };
        }
        
        // Public members.
        this.load = function (data) {
            if (data) {
                success.call(this, data);
                return;
            }
        
            api.success(success, this).error(error, this);

            if (username)
                api.getUserInfo(username);
            else
                api.getStatus();
        };
    };

    // Public static members.
    cls.current = function () {
        if (!currentUser) currentUser = new cls();
        return currentUser;
    };
    
    cls.get = function (username) {
        if (typeof username != 'string')
            throw 'Invalid type (username); expected string.';

        if (username in cache) {
            return cache[username];
        } else {
            cache[username] = new cls(username);
        }
    };
    
    cls.logIn = function (username, password) {
        var cur = cls.current();
        
        if (cur.loggedIn()) {
            alert('You\'re already logged in!');
            return;
        }
        
        api.success(function (user) {
            cur.load(user);
        });

        api.logIn(username, password);
    };
    
    cls.logOut = function () {
        var cur = cls.current();
        
        if (!cur.loggedIn()) {
            alert('You\'re not logged in!');
            return;
        }
        
        if (cur.googleLoggedIn()) {
            location.href = cur.get_googleLogUrl();
        }
        
        api.success(function () {
            cur.load();
        });

        api.logOut();
    };

    return cls;
})();
