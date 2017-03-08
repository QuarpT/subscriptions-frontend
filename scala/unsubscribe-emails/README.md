## Description

Scala Lambda which unsubscribes user from all mailing lists via Identity API. It is used by the Account Deletion
step function. 

## Why is this in Scala while the rest of Account Deletion Lambdas are in Node.js?

`/useremails/${user.identityId}/subscriptions` DELETE endpoint in Identity is design to accept body which contains
the `listId`. Apparently HTTP spec discourages having a body in DELETE request, and thus Node.js HTTP client simply
discards the body:

https://stackoverflow.com/questions/37796227/body-is-empty-when-parsing-delete-request-with-express-and-body-parser

## Deployment

Get AWS credentials via Janus and export them as environmental variables:

```
 export AWS_ACCESS_KEY_ID=foo
 export AWS_SECRET_ACCESS_KEY=bar
 export AWS_SESSION_TOKEN=zar
```

Configure S3 bucket in the sbt-s3 plugin:
  
```
host in upload := "identity-lambda.s3.amazonaws.com"
```

Execute s3-upload sbt task

```
sbt s3-upload
```

Update Lambda:

```
aws lambda update-function-code --function-name unsubscribeEmails --s3-bucket identity-lambda --s3-key unsubscribe-emails.jar
```