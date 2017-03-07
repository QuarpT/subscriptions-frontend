var http = require('https');

function getAccessToken(clientId, clientSecret) {
    return new Promise((resolve, reject) => {
        var options = {
            host: 'auth.exacttargetapis.com',
            path: '/v1/requestToken',
            headers: {
                'Content-Type': "application/json"
            },
            method: 'POST'
        };

        var postData = JSON.stringify(
            {
                clientId: clientId,
                clientSecret: clientSecret
            }
        );

        var request = http.request(options);

        request.on('error', (networkError) => reject(networkError));

        request.on('response', (response) => {
            var responseData = '';

            response.on('data', (chunk) => responseData += chunk);

            response.on('end', () => {
                try {
                    resolve(JSON.parse(responseData).accessToken);
                } catch (error) {
                    reject(error);
                }
            });

        });

        request.write(postData);
        request.end();
    })
}

function notifyUserhelp(accessToken, identityId, email) {
    return new Promise((resolve, reject) => {
        var options = {
            host: 'www.exacttargetapis.com',
            path: '/messaging/v1/messageDefinitionSends/ad01f192-03b0-e611-906b-3c4a92f81d14/send',
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': "application/json",
            },
            method: 'POST'
        };

        var postData = JSON.stringify(
            {
                "To": {
                    "Address": process.env.USERHELP_EMAIL,
                    "SubscriberKey": process.env.USERHELP_EMAIL,
                    "ContactAttributes": {
                        "SubscriberAttributes": {
                            "EmailAddress": process.env.USERHELP_EMAIL,
                            "Identity ID": identityId,
                            "User email address": email
                        }
                    }
                }
            }
        );

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

        request.write(postData);
        request.end();
    })
}

exports.handler = (event, context, callback) => {
    getAccessToken(process.env.CLIENT_ID, process.env.CLIENT_SECRET)
        .then((accessToken) => {
            notifyUserhelp(accessToken, event.credentials.identityId, event.credentials.email)
                .then((response) => callback(null, false))
                .catch((error) => callback(error));
        })
        .catch((error) => callback(error));
};

