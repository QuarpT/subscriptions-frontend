#!/usr/bin/env bash

S3_BUCKET=identity-lambda
S3_KEY=unsubscribe-emails.jar

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"

echo "Creating a package and uploading to S3 bucket..."
sbt s3-upload

echo "Updating Lambda code..."
aws lambda update-function-code --function-name unsubscribeEmails --s3-bucket $S3_BUCKET --s3-key $S3_KEY

echo "Done."