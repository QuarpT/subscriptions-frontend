var http = require('https');

function deleteUser(event) {
    return new Promise((resolve, reject) => {
        var options = {
            host: 'idapi.theguardian.com',
            path: '/user/delete',
            headers: {
                'X-GU-ID-FOWARDED-SC-GU-U': event.credentials.scGuCookie,
                'X-GU-ID-Client-Access-Token': event.credentials.clientAccessToken,
                'x-api-key': event.credentials.xApiKey,
                'Referer': 'https://theguardian.com',
                'Content-Type': "application/json",
            },
            method: 'DELETE'
        };

        var request = http.request(options);

        request.on('error', (networkError) => reject(networkError));

        request.on('response', (response) => {
            var responseData = '';

            response.on('data', (chunk) => responseData += chunk);

            response.on('end', () => {
                try {
                    resolve(JSON.parse(responseData));
                } catch (error) {
                    reject(error);
                }
            });

        });

        request.end();
    });
}

exports.handler = (event, context, callback) => {
    deleteUser(event)
        .then((result) => callback(null, true))
        .catch((error) => callback(error));
};
