var http = require('https');

function userIsNotSubscriber(scGuCookie) {
    return new Promise((resolve, reject) => {

        var options = {
            host: 'members-data-api.theguardian.com',
            path: '/user-attributes/me/mma-digitalpack',
            headers: {
                'Cookie': 'SC_GU_U=' + scGuCookie
            }
        };

        function processResponse(response) {
            var str = '';

            response.on('data', function (chunk) {
                str += chunk;
            });

            response.on('end', function () {
                resolve(JSON.parse(str).tier == null);
            });
        }

        http.request(options, processResponse).end();

    });
}

exports.handler = (event, context, callback) => {
    userIsNotSubscriber(event.scGuCookie).then((response) => {
        callback(null, response);
    });
};

