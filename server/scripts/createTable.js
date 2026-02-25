/**
 * scripts/createTable.js
 * One-time script: creates the 'Tasks' DynamoDB table.
 * Run: node scripts/createTable.js
 *
 * DynamoDB Attribute Types used in this project:
 *   S    – String   (taskId, title, status)
 *   N    – Number   (priority)
 *   BOOL – Boolean  (isCompleted)
 *   L    – List     (tags)
 *   M    – Map      (metadata)
 */
const {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
} = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'Tasks';

async function createTable() {
  // Check if table already exists
  try {
    await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    console.log(`Table "${TABLE_NAME}" already exists – skipping creation.`);
    return;
  } catch (err) {
    if (err.name !== 'ResourceNotFoundException') throw err;
  }

  const params = {
    TableName: TABLE_NAME,
    /**
     * Only key attributes are declared here.
     * Non-key attributes (priority, isCompleted, tags, metadata, etc.)
     * are schema-less in DynamoDB – no declaration needed.
     */
    AttributeDefinitions: [
      { AttributeName: 'taskId', AttributeType: 'S' }, // Partition key  → String
    ],
    KeySchema: [
      { AttributeName: 'taskId', KeyType: 'HASH' },
    ],
    BillingMode: 'PAY_PER_REQUEST', // On-demand – no capacity planning needed
  };

  const result = await client.send(new CreateTableCommand(params));
  console.log(
    `Table "${TABLE_NAME}" created. Status:`,
    result.TableDescription.TableStatus,
  );
}

createTable().catch((err) => {
  console.error('Failed to create table:', err);
  process.exit(1);
});
