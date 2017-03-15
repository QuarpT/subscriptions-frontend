var AWS = require('aws-sdk');
var http = require('https');
var kms = new AWS.KMS();

function deleteUser(decryptedInput) {
    return new Promise((resolve, reject) => {
        var options = {
            host: 'idapi.theguardian.com',
            path: '/user/me/delete',
            headers: {
                'X-GU-ID-FOWARDED-SC-GU-U': decryptedInput.scGuCookie,
                'X-GU-ID-Client-Access-Token': decryptedInput.clientAccessToken,
                'x-api-key': decryptedInput.xApiKey,
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
    kms.decrypt({ CiphertextBlob: new Buffer(event.credentials.stateMachineInput.CiphertextBlob) }).promise()
        .then((data) => {
            const decryptedInput = JSON.parse(data.Plaintext.toString('utf8'));
            deleteUser(decryptedInput).then((result) => callback(null, true))
        })
        .catch((error) => callback(error))
};
