## Deployment

1. Export AWS credentials from Janus as environmental variables
2. Run `deploy.sh` script

## AWS CLI examples

```
aws stepfunctions delete-state-machine --state-machine-arn arn:aws:states:eu-west-1:942464564246:stateMachine:AccountDeletion12
aws stepfunctions create-state-machine --name AccountDeletion12 --definition file://AccountDeletionStepFunctions.json --role-arn arn:aws:iam::942464564246:role/service-role/StatesExecutionRole-eu-west-1

aws lambda update-function-code --function-name unsubscribeEmails --s3-bucket identity-lambda --s3-key unsubscribe-emails.jar
```

## Lambda via Ngrok
```
var options = {
    host: '65c75f14.ngrok.io',
    path: '/identity-api/user/me',
    headers: {
        'Cookie': 'SC_GU_U=' + scGuCookie,
        'Referer': 'https://thegulocal.com'
    }
};
```

## Example startAccountDeletion event argument proxied by API Gateway 

```
{
	resource: '/delete',
	path: '/delete',
	httpMethod: 'POST',
	headers: {
		Accept: '*/*',
		'Accept-Encoding': 'gzip,deflate',
		'CloudFront-Forwarded-Proto': 'https',
		'CloudFront-Is-Desktop-Viewer': 'true',
		'CloudFront-Is-Mobile-Viewer': 'false',
		'CloudFront-Is-SmartTV-Viewer': 'false',
		'CloudFront-Is-Tablet-Viewer': 'false',
		'CloudFront-Viewer-Country': 'GB',
		Host: 'qb4xa22jwg.execute-api.eu-west-1.amazonaws.com',
		'User-Agent': 'AHC/1.0',
		Via: '1.1 00956c6ec4781959da21fba8cd5dffda.cloudfront.net (CloudFront)',
		'X-Amz-Cf-Id': 'LdCf8f4nF_YpW5ZehGCjKWo-qHqHUtD4aRGOchLsq39OOh3f8SMsRQ==',
		'X-Amzn-Trace-Id': 'Root=1-58bd9617-188f5bd579bca6d77fd47ca7',
		'x-api-key': '4qExbEZocj54VY9xDQcS96lQBQjUEBxmaTNBozXM',
		'X-Forwarded-For': '77.91.250.235, 54.182.244.44',
		'X-Forwarded-Port': '443',
		'X-Forwarded-Proto': 'https',
		'X-GU-ID-Client-Access-Token': 'Bearer frontend-dev-client-token',
		'X-GU-ID-FOWARDED-SC-GU-U': 'WyIxMDAwMjQzMCIsMTQ5NjU5MjEyNzcwNF0.MCwCFBLaJDlhcIVp915pjaNn_KaehgNTAhRKt5tr-0PS1rqO73Wj7KnYYDZV6Q'
	},
	queryStringParameters: null,
	pathParameters: null,
	stageVariables: null,
	requestContext: {
		accountId: '942464564246',
		resourceId: '226ldz',
		stage: 'DEV',
		requestId: 'a5f8150b-028e-11e7-b060-e58028de3a48',
		identity: {
			cognitoIdentityPoolId: null,
			accountId: null,
			cognitoIdentityId: null,
			caller: null,
			apiKey: '4qExbEZocj54VY9xDQcS96lQBQjUEBxmaTNBozXM',
			sourceIp: '77.91.250.235',
			accessKey: null,
			cognitoAuthenticationType: null,
			cognitoAuthenticationProvider: null,
			userArn: null,
			userAgent: 'AHC/1.0',
			user: null
		},
		resourcePath: '/delete',
		httpMethod: 'POST',
		apiId: 'qb4xa22jwg'
	},
	body: '{"$outer":{},"identityId":"10002430","email":"kpvrhgzvbahqamodf9c@gu.com"}',
	isBase64Encoded: false
}
```

## How to add 3rd party Node modules

https://docs.aws.amazon.com/lambda/latest/dg/nodejs-create-deployment-pkg.html
 
```
npm init
vim package.json
npm install request --save
zip -r identity-deletion.zip *
```

