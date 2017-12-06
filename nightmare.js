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
        .type('#order_billing_name', identities[task.identity].name)
        .type('#order_email', identities[task.identity].email)
        .type('#order_tel', identities[task.identity].telephone)
        .type('#bo', identities[task.identity].address)
        .type('#oba3', identities[task.identity].addresstwo)
        .type('#order_billing_zip', identities[task.identity].zip)
        .type('#nnaerb', cc[task.cc].ccnumber)
        .select('#credit_card_month', cc[task.cc].expmonth)
        .select('#credit_card_year', cc[task.cc].expyear)
        .type('#orcer', cc[task.cc].cvv)
        .click('#cart-cc > fieldset > p:nth-child(4) > label > div > ins')
        .click('input.button')
        .then()
        .catch(function(error) {
            console.error('Error:', error);
        });
}

module.exports = {
    checkout
}
