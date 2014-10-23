rh-node-utils
================

[![NPM](https://nodei.co/npm/rh-node-utils.png)](https://nodei.co/npm/rh-node-utils/)

Install the module with:
```bash
npm install rh-node-utils --save
```

Example usage:

```javascript
var express = require('express');
var utils = require('rh-node-utils');
var app = express();
var env = process.env.NODE_ENV || 'development';
if ('production' === env) {
  app.use(utils.guard());
}
```

