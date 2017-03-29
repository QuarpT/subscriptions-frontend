var AWS = require('aws-sdk');
var http = require('https');
var kms = new AWS.KMS();

// http://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
function generateRandomAlphanumericString(strlen) {
    return Math.random().toString(36).substr(2,strlen);
}

function anonymiseUsername(decryptedInput) {
    return new Promise((resolve, reject) => {
        var options = {
            host: 'idapi.theguardian.com',
            path: '/user/me',
            headers: {
                'X-GU-ID-FOWARDED-SC-GU-U': decryptedInput.scGuCookie,
                'X-GU-ID-Client-Access-Token': decryptedInput.clientAccessToken,
                'Referer': 'https://theguardian.com',
                'Content-Type': "application/json",
            },
            method: 'POST'
        };

        var randomUsername = generateRandomAlphanumericString(12);
        var postData = JSON.stringify(
            {
                publicFields: {
                    username: randomUsername,
                    displayName: randomUsername
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
    });
}

exports.handler = (event, context, callback) => {
    kms.decrypt({ CiphertextBlob: new Buffer(event.credentials.stateMachineInput.CiphertextBlob) }).promise()
        .then((data) => {
            const decryptedInput = JSON.parse(data.Plaintext.toString('utf8'));
            anonymiseUsername(decryptedInput).then((result) => callback(null, true))
        })
        .catch((error) => callback(error))
};
