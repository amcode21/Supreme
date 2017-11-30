const config = require('./config');
const log = require('./utils/log');
const cc = require('./utils/cc');
const identities = require('./utils/identities');
const captcha = require('./utils/captcha');
const request = require('request').defaults({
    followAllRedirects: true,
    jar: true,
    proxy: 'http://Dille308:242DILLE@us43.coppedproxies.com:33128'
});
const cheerio = require('cheerio');
const util = require('util');
const moment = require('moment');
const querystring = require('querystring');

let findLink = (task, callback) => {

    log.info(`Searching for ${task.style} ${task.keyword} in ${task.category}...`, task.nickname);

    let itemFound = false;

    request({
        url: `https://supremenewyork.com/shop/all/${task.category}`
    }, (err, resp, body) => {
        if (err) {
            log.error(util.inspect(err));
        } else {
            let $ = cheerio.load(body);
            $('div#container').children().each(function(i, elem) {
                let link = $(this).children().children().attr('href');
                let title = $(this).children().children().last().prev().text();
                let color = $(this).children().children().last().text();
                if (title.includes(task.keyword) && color.includes(task.style)) {
                    itemFound = true;
                    log.success(`${color} ${title} found!`, task.nickname);
                    task.link = link;
                    task.title = title;
                    return callback(task);
                } else if (title.includes(task.keyword) && color.includes(task.style) && $(this).children().text().indexOf('sold') != -1) {
                    itemFound = true;
                    log.warning(`${color} ${title} is sold out. Waiting for restock...`, task.nickname);
                    return setTimeout(findLink, config.refreshRate, task, callback);
                }
            });
            if (!itemFound) {
                log.warning(`Could not find any items matching ${task.style} ${task.keyword} searching again in ${config.refreshRate / 1000} seconds...`, task.nickname);
                return setTimeout(findLink, config.refreshRate, task, callback);
            }
        }
    })
}

let getCodes = (task, callback) => {
    log.info(`Getting size and style codes for ${task.color} ${task.title}...`, task.nickname);
    request({
        url: `http://www.supremenewyork.com${task.link}`
    }, (err, resp, body) => {
        if (err) {
            log.error(util.inspect(err));
        } else {
            let $ = cheerio.load(body);
            let title = $('h1[itemprop="name"]').text();
            let style = $('p.style').text();
            task.atcLink = $('form[method=post]').attr('action');
            task.styleCode = $('#st').attr('value');
            if ($('b.sold-out').text() == 'sold out') {
                log.warning(`${style} ${title} is sold out. Waiting for restock...`, task.nickname);
                return setTimeout(getCodes, config.refreshRate, task, callback);
            }
            if (task.size == '') {
                item.sizeCode = $('#s').attr('value');
                log.success(`Found size code: ${task.sizeCode} and style code: ${task.styleCode} for ${task.size} ${task.style} ${task.title}!`, task.nickname)
                return callback(task);
            } else {
                $('option').each(function(i, elem) {
                    if ($(this).text() == task.size) {
                        log.success(`Found size code: ${task.sizeCode} and style code: ${task.styleCode} for ${task.size} ${task.style} ${task.title}!`, task.nickname)
                        task.sizeCode = $(this).attr('value');
                        return callback(task);
                    }
                });
            }
        }
    });
}

let addToCart = (task, callback) => {
    log.info(`Adding ${task.size} ${task.style} ${task.title} to cart...`, task.nickname);
    request({
        url: `http://www.supremenewyork.com${task.atcLink}`,
        method: 'POST',
        body: querystring.stringify({
            'utf8': '✓',
            'st': task.styleCode,
            's': task.sizeCode,
            'commit': 'add to cart'
        }).replace(/%20/, '+')
    }, (err, resp, body) => {
        if (err) {
            log.error(util.inspect(err));
        } else {
            task.cookies = resp.request.headers.cookie
            log.success(`Added ${task.size} ${task.style} ${task.title} to cart!`, task.nickname);
            return callback(task);
        }
    });
}

let checkout = (task) => {
    request({
        url: 'https://www.supremenewyork.com/checkout'
    }, (err, resp, body) => {
        if (err) {
            log.error(util.inspect(err));
        } else {
            let $ = cheerio.load(body);
            let csrf = $('[name="csrf-token"]').attr('content');
            let asec = $('input#asec').attr('value');
            let sitekey = $('div.g-recaptcha').attr('data-sitekey');
            log.info(`Waiting for captcha response....`, task.nickname);
            if (config.captcha == 'open') {
                captcha.open(sitekey, 0, (capResp) => {
                    log.success(`Received captcha response ${capResp.substr(0, 10)}...`, task.nickname);
                    setTimeout(post, config.checkoutDelay, task, capResp);
                });
            }
            if (config.captcha == 'server') {
                captcha.server(sitekey, 0, moment(), (capResp) => {
                    log.info(`Received captcha response ${capResp.substr(0, 10)}...`, task.nickname);
                    setTimeout(post, config.checkoutDelay, task, capResp);
                });
            }

            function post(task, capResp) {
                log.info(`Attempting to checkout ${task.size} ${task.style} ${task.title}...`, task.nickname);
                request({
                    url: 'https://www.supremenewyork.com/checkout.json',
                    method: 'POST',
                    body: querystring.stringify({
                        'utf8': '✓',
                        'authenticity_token': csrf,
                        [$('[placeholder="name"]').attr('name')]: identities[task.identity].name,
                        [$('[placeholder="email"]').attr('name')]: identities[task.identity].email,
                        [$('[placeholder="tel"]').attr('name')]: identities[task.identity].telephone,
                        [$('[placeholder="address"]').attr('name')]: identities[task.identity].address,
                        [$('input.optional').attr('name')]: identities[task.identity].addresstwo,
                        [$('[size="5"]').attr('name')]: identities[task.identity].zip,
                        [$('[placeholder="city"]').attr('name')]: identities[task.identity].city,
                        'order[billing_state]': identities[task.identity].state,
                        'order[billing_country]': identities[task.identity].country,
                        'asec': asec,
                        'same_as_billing_address': 1,
                        'store_credit_id': '',
                        [$('[placeholder="number"]').attr('name')]: cc[task.cc].ccnumber,
                        'credit_card[month]': cc[task.cc].expmonth,
                        'credit_card[year]': cc[task.cc].expyear,
                        [$('[size="4"]').attr('name')]: cc[task.cc].cvv,
                        'order[terms]': 0,
                        'order[terms]': 1,
                        'g-recaptcha-response': capResp,
                        [$('input#numbc').attr('name')]: ''
                    }).replace(/%20/, '+')
                }, (err, resp, body) => {
                    var response = JSON.parse(body);
                    if (response.status == 'failed') {
                        log.error(`Card decline error`, task.nickname);
                    } else {
                        console.log(body);
                    }
                });
            }
        }
    });
}

module.exports = {
    findLink,
    getCodes,
    addToCart,
    checkout
}
