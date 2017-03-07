#!/usr/bin/env bash

S3_BUCKET=identity-lambda
S3_KEY=identity-deletion.zip

echo "Zipping code..."
zip -r $S3_KEY *

echo "Copying to S3 bucket..."
aws s3 cp $S3_KEY "s3://${S3_BUCKET}/"

echo "Updating Lambda code"
aws lambda update-function-code --function-name startAccountDeletion --s3-bucket $S3_BUCKET --s3-key $S3_KEY
aws lambda update-function-code --function-name userHasNoJobs --s3-bucket $S3_BUCKET --s3-key $S3_KEY
aws lambda update-function-code --function-name userHasNotCommented --s3-bucket $S3_BUCKET --s3-key $S3_KEY
aws lambda update-function-code --function-name userIsNotMember --s3-bucket $S3_BUCKET --s3-key $S3_KEY
aws lambda update-function-code --function-name userIsNotSubscriber --s3-bucket $S3_BUCKET --s3-key $S3_KEY
aws lambda update-function-code --function-name isAutoDeletionCriteriaSatisfied --s3-bucket $S3_BUCKET --s3-key $S3_KEY
aws lambda update-function-code --function-name notifyUserhelp --s3-bucket $S3_BUCKET --s3-key $S3_KEY
aws lambda update-function-code --function-name deleteUser --s3-bucket $S3_BUCKET --s3-key $S3_KEY

echo "Done."