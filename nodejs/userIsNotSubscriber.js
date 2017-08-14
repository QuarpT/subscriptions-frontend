const AWS = require('aws-sdk');
const http = require('https');
const kms = new AWS.KMS();

function userIsNotSubscriber(scGuCookie) {
    return new Promise((resolve, reject) => {
        const options = {
            host: 'members-data-api.theguardian.com',
            path: '/user-attributes/me/mma-digitalpack',
            headers: {
                'Cookie': 'SC_GU_U=' + scGuCookie
            }
        };

        function processResponse(response) {
            var responseData = '';

            response.on('data', chunk => responseData += chunk);

            response.on('end', () => {
                try {
                    const result = {
                        name: "userIsNotSubscriber",
                        satisfied: JSON.parse(responseData).tier == null
                    };
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });
        }

        const request = http.request(options);

        request.on('error', networkError => reject(networkError));

        request.on('response', response => processResponse(response));

        request.end();
    });
}

exports.handler = (event, context, callback) => {
    kms.decrypt({ CiphertextBlob: new Buffer(event.stateMachineInput.CiphertextBlob) }).promise()
        .then((data) => {
            const decryptedInput = JSON.parse(data.Plaintext.toString('utf8'));
            userIsNotSubscriber(decryptedInput.scGuCookie).then((response) => callback(null, response));
        })
        .catch((error) => callback(error))
};
