'use strict';
const lunch = require('./features/lunch.js');
const duty = require('./features/duty.js');
const server = require('express')();

// Start server
var listener = server.listen(process.env.PORT || 8888, () => {
  console.log(`server running on ${listener.address().port}`);
});

server.get('/', (req, res) => {
  const username = req.query.user_name;
  lunch.giveMeFood()._init(res, username);
});

server.get('/duty', (req, res) => {
    duty.dutyFinder()._init(res);
});