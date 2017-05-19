var AWS = require('aws-sdk');
var http = require('https');
var kms = new AWS.KMS();

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
                    const userGroups = JSON.parse(responseData).user.userGroups;
                    resolve(userGroups.find((group) => group.packageCode == 'GRS') === undefined);
                } catch (error) {
                    reject(error);
                }
            });

        });

        request.end();
    })
}

exports.handler = (event, context, callback) => {
    kms.decrypt({ CiphertextBlob: new Buffer(event.credentials.stateMachineInput.CiphertextBlob) }).promise()
        .then((data) => {
            const decryptedInput = JSON.parse(data.Plaintext.toString('utf8'));
            userHasNoJobs(decryptedInput.scGuCookie).then((result) => callback(null, result));
        })
        .catch((error) => callback(error))
};
