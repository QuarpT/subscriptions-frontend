var http = require('https');

function userHasNoJobs(scGuCookie) {
    return new Promise((resolve, reject) => {
        var options = {
            host: 'idapi.theguardian.com',
            path: '/user/me',
            headers: {
                'Cookie': 'SC_GU_U=' + scGuCookie,
                'Referer': 'https://theguardian.com'
            }
        };

        var request = http.request(options);

        request.on('error', (networkError) => reject(networkError));

        request.on('response', (response) => {
            var responseData = '';

            response.on('data', (chunk) => responseData += chunk);

            response.on('end', () => {
                try {
                    resolve((JSON.parse(responseData).user.userGroups.packageCode == 'GRS') == false);
                } catch (error) {
                    reject(error);
                }
            });

        });

        request.end();
    })
}

exports.handler = (event, context, callback) => {
    userHasNoJobs()
        .then((result) => callback(null, result))
        .catch((error) => callback(error));
};
