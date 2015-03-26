'use strict';

var config = {
    debug: true,
    cookie_domain:   process.env.COOKIE_AUTH_DOMAIN || 'https://access.redhat.com',
    auth_url:  process.env.AUTH_URL || 'https://access.redhat.com/rs/users/current',
    request_options: {
        strictSSL: ((process.env.STRICT_SSL === 'false') ? false : true),
        headers: {
            'Accept': 'application/json'
        }
    }
};

module.exports = config;
