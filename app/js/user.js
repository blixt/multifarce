var User = (function () {
    // Private static members.
    var
    cache = {},
    currentUser,

    // Constructor.
    cls = function (id) {
        // Inherit EventSource functionality.
        EventSource.call(this, 'load');

        // Private members.
        var loaded = false, data = {},

        error = function () {
            this.clearHandlers();
            if (id) delete cache[id];
        },

        success = function (user) {
            data = user;
            loaded = true;
            this.raise('load');

            // Check if this is the current user instance. There will also be
            // another cached instance of this user with an id.
            if (this.isCurrent() && this.loggedIn()) {
                // Make sure that the id-bound user instance of the current
                // user is up-to-date.
                cls.get(this.get_id()).load(data);
            }
        };

        // Getters/setters.
        this.get_displayName = function () { return data.display_name; };
        this.get_emailHash = function () { return data.email_md5; };
        this.get_gravatarUrl = function (size) {
            return GRAVATAR
                .replace(/\{md5\}/, this.isLoaded() ? this.get_emailHash() : '')
                .replace(/\{size\}/, size || '32');
        };
        this.get_id = function () { return data.user_id; };
        this.isCurrent = function () { return this == currentUser; };
        this.isLoaded = function () { return loaded; };

        // Extra functionality for the special "current user" object.
        if (!id) {
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

            if (id)
                api.getUserInfo(id);
            else
                api.getStatus();
        };
    };

    // Public static members.
    cls.current = function () {
        if (!currentUser) currentUser = new cls();
        return currentUser;
    };

    cls.get = function (id) {
        if (typeof id != 'number')
            throw 'Invalid type (id); expected number.';

        if (!(id in cache)) {
            cache[id] = new cls(id);
        }
        return cache[id];
    };

    cls.logIn = function (email, password, success, error) {
        var cur = cls.current();

        if (cur.loggedIn()) return;

        api.success(function (user) {
            cur.load(user);
            if (success) success(user);
        });

        if (error) api.error(error);

        api.logIn(email, password);
    };

    cls.logOut = function () {
        var cur = cls.current();

        if (!cur.loggedIn()) return;

        if (cur.googleLoggedIn()) {
            location.href = cur.get_googleLogUrl();
            return;
        }

        api.success(function () {
            cur.load();
        });

        api.logOut();
    };

    return cls;
})();
