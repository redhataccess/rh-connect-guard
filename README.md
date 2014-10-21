rh-connect-guard
================

[![NPM](https://nodei.co/npm/rh-connect-guard.png)](https://nodei.co/npm/rh-connect-guard/)

Install the module with:
```bash
npm install rh-connect-guard --save
```

Example usage:

```javascript
var express = require('express');
var rhGuard = require('rh-connect-guard');

var app = express();
var env = process.env.NODE_ENV || 'development';
if ('production' === env) {
  app.use(rhGuard());
}
```
