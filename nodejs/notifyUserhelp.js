var AWS = require('aws-sdk');
var http = require('https');
var kms = new AWS.KMS();

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

function notifyUserhelp(accessToken, identityId, identityEmail, userHasNoJobs) {
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

        var userhelpEmail;
        if (userHasNoJobs === false)
            userhelpEmail = process.env.JOBS_USERHELP_EMAIL;
        else
            userhelpEmail = process.env.USERHELP_EMAIL;

        var postData = JSON.stringify(
            {
                "To": {
                    "Address": userhelpEmail,
                    "SubscriberKey": userhelpEmail,
                    "ContactAttributes": {
                        "SubscriberAttributes": {
                            "EmailAddress": userhelpEmail,
                            "Identity ID": identityId,
                            "User email address": identityEmail
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
    kms.decrypt({ CiphertextBlob: new Buffer(event.credentials.stateMachineInput.CiphertextBlob) }).promise()
        .then((data) => {
            const decryptedInput = JSON.parse(data.Plaintext.toString('utf8'));
            getAccessToken(process.env.CLIENT_ID, process.env.CLIENT_SECRET)
                .then((accessToken) =>
                    notifyUserhelp(accessToken, decryptedInput.identityId, decryptedInput.email, event.userHasNoJobs).then((response) => callback(null, false)))
        })
        .catch((error) => callback(error))
};

