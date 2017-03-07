#!/usr/bin/env bash

echo "Deplying Node.js Lambdas..."
bash ./nodejs/deploy.sh

echo "Deploying Scala Lambdas..."
bash ./scala/unsubscribe-emails/deploy.sh