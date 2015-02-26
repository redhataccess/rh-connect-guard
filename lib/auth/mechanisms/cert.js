'use strict';

var request = require('request'),
    config  = require('../config'),
    common  = require('./common'),
    cache   = require('../cache'),
    log     = common.log,
    pub     = {},
    priv    = {};

pub.name = 'CertAuth';

pub.tryAuth = function (req) {
    if (common.alreadyAuthed(req)) {
        log.debug('skipping');
        return false;
    }
    req.authorized = false;
    return false;
};

module.exports = pub;

