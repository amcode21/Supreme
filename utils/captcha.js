const config = require('../config');
const log = require('./log');
const express = require('express');
const app = express();
const Nightmare = require('nightmare');
const bodyParser = require('body-parser');
const util = require('util');
const path = require('path');
const request = require('request');
const _ = require('lodash');
const moment = require('moment');

function server(sitekey, n, time, callback) {

    var nonExpired = []

    request({
        url: `https://captcha-server-186019.appspot.com/responses/${sitekey}`,
        method: 'GET'
    }, (err, resp, body) => {
        if (!err) {
            var responses = JSON.parse(body);
            _.times(responses.length, function(i) {
                if (moment(responses[i].time) > time) {
                    nonExpired.push(responses[i].response);
                }
            });
            if (nonExpired[0]) {
                callback(nonExpired[0]);
                request({
                    url: `https://captcha-server-186019.appspot.com/responses/${nonExpired[0]}`,
                    method: 'DELETE'
                })
            } else {
                setTimeout(server, 500, sitekey, n, time, callback)
            }
        } else {
            console.log('Error getting response from server');
        }
    });
}

function open(_sitekey, n, callback) {

    app.set('port', 3000 + n);
    app.set('view engine', 'ejs');
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.set('views', path.join(__dirname, 'views'));

    app.get('/', function(req, res) {
        return res.render('index', {
            sitekey: _sitekey,
        });
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
                        console.log(details)
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
            alwaysOnTop: false,
            waitTimeout: 30000,
            webPreferences: {
                partition: n
            }
        }).preloadCookies(config.captcha.gcookies, '.google.com')
        .goto(`http://dev.supremenewyork.com:${3000 + n}/`)
        .then().catch((err) => {
            log.error(util.inspect(err), n);
        });

    app.post('/submit', function(req, res) {
        res.send('Close browser window');
        return callback(req.body['g-recaptcha-response'])
    });

    app.listen(app.get('port'), () => {
        //log.success(`Server Harvester started @ :3000/harvest`)
    });

}


module.exports = {
    server,
    open
}
