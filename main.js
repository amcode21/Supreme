const config = require('./config');
const request = require('./request');
const nightmare = require('./nightmare');
const tasks = require('./utils/tasks');
const _ = require('lodash');

_.times(tasks.tasks.length, i => {
    request.findLink(tasks.tasks[i], result => {
        request.getCodes(result, result => {
            request.addToCart(result, result => {
                if (config.checkoutMethod == 'request') {
                    request.checkout(result);
                } else {
                    nightmare.checkout(result);
                }
            });
        });
    });
});
