/**
 * routes/tasks.js
 * Full CRUD endpoints for the Tasks table.
 *
 * Attribute types exercised:
 *   taskId      → S    (String)   – UUID partition key
 *   title       → S    (String)
 *   priority    → N    (Number)   – integer 1–5
 *   isCompleted → BOOL (Boolean)
 *   tags        → L    (List)     – array of strings
 *   metadata    → M    (Map)      – { assignee, dueDate, category }
 */
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const {
  PutCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
  GetCommand,
} = require('@aws-sdk/lib-dynamodb');

const { docClient, TABLE_NAME } = require('../dynamodb');

const router = express.Router();

/* ─────────────────────────────────────────────
   POST /create
   Body: { title, priority, isCompleted, tags, metadata }
───────────────────────────────────────────── */
router.post('/create', async (req, res) => {
  try {
    const { title, priority, isCompleted, tags, metadata } = req.body;

    // Basic validation
    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }

    const item = {
      taskId: uuidv4(),                            // S – String
      title: String(title),                        // S – String
      priority: Number(priority ?? 3),             // N – Number
      isCompleted: Boolean(isCompleted ?? false),  // BOOL – Boolean
      tags: Array.isArray(tags) ? tags : [],       // L – List
      metadata: typeof metadata === 'object' && metadata !== null
        ? metadata
        : {},                                      // M – Map
      createdAt: new Date().toISOString(),         // S – String (ISO timestamp)
    };

    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));

    return res.status(201).json({ message: 'Task created', task: item });
  } catch (err) {
    console.error('POST /create error:', err);
    return res.status(500).json({ error: 'Failed to create task', details: err.message });
  }
});

/* ─────────────────────────────────────────────
   GET /read
   Returns all tasks via Scan.
   For large tables use Query with an index instead.
───────────────────────────────────────────── */
router.get('/read', async (req, res) => {
  try {
    const result = await docClient.send(
      new ScanCommand({ TableName: TABLE_NAME }),
    );

    return res.json({ tasks: result.Items, count: result.Count });
  } catch (err) {
    console.error('GET /read error:', err);
    return res.status(500).json({ error: 'Failed to read tasks', details: err.message });
  }
});

/* ─────────────────────────────────────────────
   PUT /update
   Body: { taskId, title?, priority?, isCompleted?, tags?, metadata? }
   Demonstrates updating any combination of the 5 attribute types.
───────────────────────────────────────────── */
router.put('/update', async (req, res) => {
  try {
    const { taskId, title, priority, isCompleted, tags, metadata } = req.body;

    if (!taskId) {
      return res.status(400).json({ error: 'taskId is required' });
    }

    // Build the UpdateExpression dynamically
    const updateParts = [];
    const ExpressionAttributeNames = {};
    const ExpressionAttributeValues = {};

    if (title !== undefined) {
      updateParts.push('#title = :title');
      ExpressionAttributeNames['#title'] = 'title';
      ExpressionAttributeValues[':title'] = String(title);           // S
    }
    if (priority !== undefined) {
      updateParts.push('#priority = :priority');
      ExpressionAttributeNames['#priority'] = 'priority';
      ExpressionAttributeValues[':priority'] = Number(priority);     // N
    }
    if (isCompleted !== undefined) {
      updateParts.push('#isCompleted = :isCompleted');
      ExpressionAttributeNames['#isCompleted'] = 'isCompleted';
      ExpressionAttributeValues[':isCompleted'] = Boolean(isCompleted); // BOOL
    }
    if (tags !== undefined) {
      updateParts.push('#tags = :tags');
      ExpressionAttributeNames['#tags'] = 'tags';
      ExpressionAttributeValues[':tags'] = Array.isArray(tags) ? tags : []; // L
    }
    if (metadata !== undefined) {
      updateParts.push('#metadata = :metadata');
      ExpressionAttributeNames['#metadata'] = 'metadata';
      ExpressionAttributeValues[':metadata'] = metadata;             // M
    }

    if (updateParts.length === 0) {
      return res.status(400).json({ error: 'No fields to update provided' });
    }

    updateParts.push('#updatedAt = :updatedAt');
    ExpressionAttributeNames['#updatedAt'] = 'updatedAt';
    ExpressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { taskId },
        UpdateExpression: `SET ${updateParts.join(', ')}`,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
        ConditionExpression: 'attribute_exists(taskId)', // fail if item doesn't exist
        ReturnValues: 'ALL_NEW',
      }),
    );

    return res.json({ message: 'Task updated', task: result.Attributes });
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      return res.status(404).json({ error: 'Task not found' });
    }
    console.error('PUT /update error:', err);
    return res.status(500).json({ error: 'Failed to update task', details: err.message });
  }
});

/* ─────────────────────────────────────────────
   DELETE /delete/:id
   Deletes a single task by its taskId.
───────────────────────────────────────────── */
router.delete('/delete/:id', async (req, res) => {
  try {
    const taskId = req.params.id;

    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { taskId },
        ConditionExpression: 'attribute_exists(taskId)', // fail if not found
      }),
    );

    return res.json({ message: 'Task deleted', taskId });
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      return res.status(404).json({ error: 'Task not found' });
    }
    console.error('DELETE /delete/:id error:', err);
    return res.status(500).json({ error: 'Failed to delete task', details: err.message });
  }
});

module.exports = router;
