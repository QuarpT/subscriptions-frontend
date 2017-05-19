var AWS = require('aws-sdk');
var http = require('https');
var kms = new AWS.KMS();

function userIsNotMember(scGuCookie) {
    return new Promise((resolve, reject) => {

        var options = {
            host: 'members-data-api.theguardian.com',
            path: '/user-attributes/me/mma-membership',
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
                try {
                    const response = {
                        name: "userIsNotMember",
                        satisfied: JSON.parse(str).tier == null
                    };
                    resolve(response);
                } catch (error) {
                    reject(error);
                }
            });
        }

        http.request(options, processResponse).end();

    });
}

exports.handler = (event, context, callback) => {
    kms.decrypt({ CiphertextBlob: new Buffer(event.stateMachineInput.CiphertextBlob) }).promise()
        .then((data) => {
            const decryptedInput = JSON.parse(data.Plaintext.toString('utf8'));
            userIsNotMember(decryptedInput.scGuCookie).then((response) => callback(null, response));
        })
        .catch((error) => callback(error))
};
