var http = require('https');

function userHasNotCommented(scGuCookie) {
    return new Promise((resolve, reject) => {
        var options = {
            host: 'discussion.theguardian.com',
            path: '/discussion-api/profile/me',
            headers: {
                'Cookie': 'SC_GU_U=' + scGuCookie
            }
        };

        var request = http.request(options);

        request.on('error', (networkError) => reject(networkError));

        request.on('response', (response) => {
            var responseData = '';

            response.on('data', (chunk) => responseData += chunk);

            response.on('end', () => {
                try {
                    resolve(JSON.parse(responseData).userProfile.privateFields.hasCommented === false);
                } catch (jsonError) {
                    reject(jsonError);
                }
            });

        });

        request.end();
    })
}

exports.handler = (event, context, callback) => {
    userHasNotCommented(event.scGuCookie)
        .then((result) => callback(null, result))
        .catch((error) => callback(error));
};
