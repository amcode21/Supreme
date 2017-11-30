const Nightmare = require('nightmare');
const setCookie = require('set-cookie-parser');
const _ = require('lodash');

let checkout = (task) => {
    let cookies = _.map(task.cookies.split('; '), i => {
        let cookie = i.split('=');
        return {
            name: cookie[0],
            value: cookie[1]
        }
    });

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

    Nightmare({
        show: true,
        height: 1000,
        width: 1666,
        waitTimeout: 120000
    }).useragent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36')
        .goto('https://www.supremenewyork.com/')
        .cookies.set(cookies)
        .wait(1000)
        .goto('https://www.supremenewyork.com/')
        .then(function (result) {
          console.log(result)
        })
        .catch(function (error) {
          console.error('Error:', error);
        });
}

module.exports = {
    checkout
}
