var express = require('express');
var router = express.Router();

var sequelize = require('./models/index')();
var dbRecord = require('./models/record')(sequelize);

var charMap = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя_1234567890";
var charWeight = charMap.length;

function to_url(number) {
    var url = '';
    while (number) {
        var remainder = number % charWeight;
        number = Math.floor(number / charWeight);
        url = charMap[remainder].toString() + url;
    }
    return url;
}

function to_number(url) {
    var number = 0;
    while (url) {
        var index = charMap.indexOf(url[0]);
        var power = url.length - 1;
        number += index * (Math.pow(charWeight, power));
        url = url.substring(1);
    }
    return number;
}

router.get('/:shortUrl', function (request, response) {
    response.redirect(303, 'http://test.com');
});

router.post('/shorten', function (request, response) {
    var url = request.body.url;
    // TODO: lowercase
    var url1 = require('url');
    var parts = url1.parse(url, false);
    console.log(url1.format(parts))
    if (parts.protocol == null) {
        parts.protocol = 'http';
        parts.slashes = true;
        parts.hostname = parts.pathname;
        parts.pathname = null
    }

    url = url1.format(parts);
    console.log('New url: ' + url + '   protocol: ' + parts.protocol + ' slaches: ' + parts.slashes);

    //-------------------------url validation----------------------
    dbRecord.findOne({where: {url: url}}).then(function (record) {
        var promise = sequelize.sync();
        if (record) {
            promise = promise.then(function () {
                return record;
            })
        } else {
            promise = promise.then(function () {
                return dbRecord.create({
                    'url': url,
                    'shorturl': null
                });
            });
        }

        promise.then(function (record) {
            var shortUrl = record.get('shorturl');
            if (!shortUrl) shortUrl = to_url(record.get('id'));

            response.send(shortUrl)
        })
    });
});

module.exports = router;