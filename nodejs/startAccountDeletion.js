/*
 Lambda Function for API Gateway Proxy Integration which executes Account Deletion step function
 ------------------------------------------------------------------------------------------------

 Note that the lambda *waits* until the step function finishes processing before returning the result
 in a format API Gateway can understand.

 A Lambda Function in Node.js for Proxy Integration:
 https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-create-api-as-simple-proxy-for-lambda.html#api-gateway-proxy-integration-lambda-function-nodejs

 Input Format of a Lambda Function for Proxy Integration:
 https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-set-up-simple-proxy.html#api-gateway-simple-proxy-for-lambda-input-format

 Output Format of a Lambda Function for Proxy Integration
 https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-set-up-simple-proxy.html#api-gateway-simple-proxy-for-lambda-output-format



 Why is this lambda necessary as API Gateway can call Step Functions directly?
 -----------------------------------------------------------------------------

 API Gateway can directly integrate with Step Functions however all it does is executes the state machine
 via StartExecution API call, such that the client receives HTTP response which only contains information if the
 step function started successfully - not the actual result of the step function processing.

 Amazon API Gateway Integration with AWS Step Functions:
 https://aws.amazon.com/about-aws/whats-new/2017/02/amazon-api-gateway-integration-with-aws-step-functions/

 StartExecution:
 https://docs.aws.amazon.com/step-functions/latest/apireference/API_StartExecution.html
 */

var AWS = require('aws-sdk');
var stepfunctions = new AWS.StepFunctions();
var kms = new AWS.KMS();

exports.handler = (event, context, callback) => {

    var identityId = JSON.parse(event.body).identityId;
    var email = JSON.parse(event.body).email;
    var scGuCookie = event.headers['X-GU-ID-FOWARDED-SC-GU-U'];
    var clientAccessToken = event.headers['X-GU-ID-Client-Access-Token'];
    var xApiKey = event.headers['x-api-key'];

    var stateMachineInput = JSON.stringify({
        'identityId': identityId,
        'email': email,
        'scGuCookie': scGuCookie,
        'clientAccessToken': clientAccessToken,
        'xApiKey' : xApiKey
    });

    var encryptParams = {
        KeyId: process.env.KMS_KEY_ID,
        Plaintext: stateMachineInput
    };

    kms.encrypt(encryptParams).promise()
        .catch((error) => console.log(error))
        .then((encryptedStateMachineInput) => {

            var params = {
                stateMachineArn: `arn:aws:states:eu-west-1:942464564246:stateMachine:${process.env.STATE_MACHINE_ARN}`,
                input: JSON.stringify({stateMachineInput: encryptedStateMachineInput}),
                name: identityId
            };

            stepfunctions.startExecution(params).promise()
                .catch((error) => {

                    var response = {
                        statusCode: 500,
                        headers: {},
                        body: JSON.stringify(buildDotcomeIdentityErrorResponse(`Failed to start Account Deletion step function for user ${identityId}`, error))
                    };

                    callback(null, response);
                })
                .then((data) => {
                    function checkExecutionFinished(executionArn) {
                        stepfunctions.describeExecution({'executionArn': executionArn}).promise()
                            .catch((error) => setTimeout(checkExecutionFinished(executionArn), 5000))
                            .then((executionResult) => {
                                if (executionResult.status === "RUNNING")
                                    setTimeout(checkExecutionFinished(executionArn), 5000);
                                else {
                                    var responseCode = (executionResult.status === "SUCCEEDED") ? 200 : 500;
                                    var responseMessage = `Account deletion ${executionResult.status} for user ${identityId}`;

                                    var responseBody;

                                    if (responseCode == 200) {
                                        responseBody = {
                                            message: responseMessage,
                                            executionArn: executionResult.executionArn,
                                            status: executionResult.status,
                                            auto: executionResult.output
                                        };
                                    } else {
                                        responseBody =
                                            buildDotcomeIdentityErrorResponse(
                                                responseMessage,
                                                {
                                                    executionArn: executionResult.executionArn,
                                                    status: executionResult.status
                                                }
                                            )
                                    }

                                    var response = {
                                        statusCode: responseCode,
                                        headers: {},
                                        body: JSON.stringify(responseBody)
                                    };

                                    callback(null, response);
                                }
                            });
                    }

                    checkExecutionFinished(data.executionArn);
                });
        })
};

/*
 Dotcom Identity expects the following error format:
 https://github.com/guardian/frontend/blob/07c5b5c858d5ada1cf851430d1106d47b8476014/identity/app/idapiclient/IdApiJsonBodyParser.scala#L12
 */
function buildDotcomeIdentityErrorResponse(message, description) {
    const identityErrorResponse =
        {
            errors:
                [
                    {
                        message: message,
                        description: JSON.stringify(description)
                    }
                ]
        };

    return identityErrorResponse;
}
