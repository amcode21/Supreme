const Nightmare = require('nightmare');
const setCookie = require('set-cookie-parser');
const _ = require('lodash');
const cc = require('./utils/cc');
const identities = require('./utils/identities');
const log = require('./utils/log');
const config = require('./config');

Nightmare.action('preloadCookies',
    function(name, options, parent, win, renderer, done) {
        parent.on('did-start-loading', function(url, sessionCookies) {
            if (sessionCookies) {
                parent.emit('log', 'Preloading cookies');

                for (var i = 0; i < sessionCookies.length; i++) {
                    var details = Object.assign({
                        url: url
                    }, sessionCookies[i]);
                    win.webContents.session.cookies.set(details, function(error) {
                        if (error) done(error);
                    });
                }
            }
            parent.emit('did-start-loading');
        });
        done();
        return this;
    },
    function(cookies, url, done) {
        this.child.once('did-start-loading', done);

        this.child.emit('did-start-loading', url, cookies);
    });



let checkout = (task) => {
    log.info(`Opening browser at checkout with ${task.size} ${task.style} ${task.title} in cart...`, task.nickname)
    Nightmare({
            show: true,
            alwaysOnTop: false,
            typeInterval: 20,
            height: 1000,
            width: 1666,
            waitTimeout: 120000
        }).useragent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36')
        .preloadCookies(task.cookies, 'https://www.supremenewyork.com')
        .preloadCookies(config.gcookies, 'https://www.google.com')
        .goto('https://www.supremenewyork.com/checkout')
        .mousedown('#cart-address > fieldset > div:nth-child(2) > input')
        .mouseup('#cart-address > fieldset > div:nth-child(2) > input')
        .type('#cart-address > fieldset > div:nth-child(2) > input', identities[task.identity].name)
        .mousedown('#cart-address > fieldset > div:nth-child(3) > input')
        .mouseup('#cart-address > fieldset > div:nth-child(3) > input')
        .type('#cart-address > fieldset > div:nth-child(3) > input', identities[task.identity].email)
        .mousedown('#cart-address > fieldset > div:nth-child(4) > input')
        .mouseup('#cart-address > fieldset > div:nth-child(4) > input')
        .type('#cart-address > fieldset > div:nth-child(4) > input', identities[task.identity].telephone)
        .mousedown('#cart-address > fieldset > div:nth-child(5) > div:nth-child(1) > input')
        .mouseup('#cart-address > fieldset > div:nth-child(5) > div:nth-child(1) > input')
        .type('#cart-address > fieldset > div:nth-child(5) > div:nth-child(1) > input', identities[task.identity].address)
        .mousedown('#cart-address > fieldset > div:nth-child(5) > div:nth-child(2) > input')
        .mouseup('#cart-address > fieldset > div:nth-child(5) > div:nth-child(2) > input')
        .type('#cart-address > fieldset > div:nth-child(5) > div:nth-child(2) > input', identities[task.identity].addresstwo)
        .mousedown('#cart-address > fieldset > div:nth-child(6) > div:nth-child(1) > input')
        .mouseup('#cart-address > fieldset > div:nth-child(6) > div:nth-child(1) > input')
        .type('#cart-address > fieldset > div:nth-child(6) > div:nth-child(1) > input', identities[task.identity].zip)
        .mousedown('#card_details > div:nth-child(1) > input')
        .mouseup('#card_details > div:nth-child(1) > input')
        .type('#card_details > div:nth-child(1) > input', cc[task.cc].ccnumber)
        .mousedown('#cvv_row > div:nth-child(1) > select:nth-child(2)')
        .mouseup('#cvv_row > div:nth-child(1) > select:nth-child(2)')
        .select('#cvv_row > div:nth-child(1) > select:nth-child(2)', cc[task.cc].expmonth)
        .mousedown('#cvv_row > div:nth-child(1) > select:nth-child(3)')
        .mouseup('#cvv_row > div:nth-child(1) > select:nth-child(3)')
        .select('#cvv_row > div:nth-child(1) > select:nth-child(3)', cc[task.cc].expyear)
        .mousedown('#cvv_row > div:nth-child(2) > input')
        .mouseup('#cvv_row > div:nth-child(2) > input')
        .type('#cvv_row > div:nth-child(2) > input', cc[task.cc].cvv)
        .click('#cart-cc > fieldset > p:nth-child(4) > label > div > ins')
        .click('#cart-footer > div > input')
        .then()
        .catch(function(error) {
            console.error('Error:', error);
        });
}

module.exports = {
    checkout
}
