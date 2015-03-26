'use strict';

var pub = {};

pub.buildUserObject = function (body) {
    var data;
    try {
        data = JSON.parse(body);
    } catch (e) {
        return {};
    }
    return data;
};

module.exports = pub;
