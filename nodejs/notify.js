var AWS = require('aws-sdk');

const topicArn = (stage) => {
    return "com-gu-identity-account-deletions-" + stage.toUpperCase();
};

const publish = (topicArn, input) => {
    const notification = {
        userId: input.identityId,
        eventType: "DELETE"
    };

    const sns = new AWS.SNS();
    const params = {
        Subject: "Account deletion event",
        Message: JSON.stringify(notification),
        TopicArn: topicArn
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
        .then((input) => publish(topicArn(input.stage), input))
        .catch((error) => callback(error))
};
