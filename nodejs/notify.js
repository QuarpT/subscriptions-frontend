var AWS = require('aws-sdk');

const publish = (topicArn, input) => {
    const notification = {
        userId: decryptedInput.identityId,
        eventType: "DELETE"
    };

    const sns = new AWS.SNS();
    const params = {
        Subject: "Account deletion event",
        Message: JSON.stringify(notification),
        TopicArn: "TODO",
    };

    return sns.publish(params).promise();
};

const decrypt = (blob) => {
    return kms.decrypt({ CiphertextBlob: new Buffer(blob) })
        .promise()
        .then((data) => JSON.parse(data.Plaintext.toString('utf8')));
};

exports.handler = (event, context, callback) => {
    const blob = event.credentials.stateMachineInput.CiphertextBlob;

    decrypt(blob)
        .then((input) => publish(topicArn, input))
        .catch((error) => callback(error))
};
