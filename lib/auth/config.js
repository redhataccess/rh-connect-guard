'use strict';

var config = {
    debug: true,
    cookie_domain:   process.env.COOKIE_AUTH_DOMAIN || 'https://access.redhat.com',
    cookie_auth_url: process.env.COOKIE_AUTH_URL || 'https://access.redhat.com/services/user/status?jsoncallback=',
    basic_auth_url:  process.env.BASIC_AUTH_URL || 'https://access.redhat.com/rs/users/current',
    request_options: {
        strictSSL: process.env.STRICT_SSL || true,
        headers: {
            'Accept': 'application/json'
        }
    }
};

module.exports = config;
