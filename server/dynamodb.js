/**
 * dynamodb.js
 * DynamoDB client using IAM Role via the default credential provider chain.
 * No hardcoded credentials – attach an IAM Role to the EC2 instance.
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  // No credentials block – SDK uses EC2 Instance Metadata / env vars / ~/.aws
});

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    // Automatically convert JS undefined → remove the key
    removeUndefinedValues: true,
  },
});

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'Tasks';

module.exports = { docClient, TABLE_NAME };
