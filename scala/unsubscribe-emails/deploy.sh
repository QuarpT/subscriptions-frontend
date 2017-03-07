#!/usr/bin/env bash

S3_BUCKET=identity-lambda
S3_KEY=unsubscribe-emails.jar

echo "Creating a package and uploading to S3 bucket..."
sbt s3-upload

echo "Updating Lambda code..."
aws lambda update-function-code --function-name unsubscribeEmails --s3-bucket $S3_BUCKET --s3-key $S3_KEY

echo "Done."