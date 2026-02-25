/**
 * TaskList.jsx
 * Renders all tasks, showing all 5 DynamoDB attribute types.
 */
export default function TaskList({ tasks, onEdit, onDelete }) {
  if (!tasks.length) {
    return <p className="empty-state">No tasks yet. Create one using the form!</p>;
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <li key={task.taskId} className={`task-card ${task.isCompleted ? 'task-done' : ''}`}>
          {/* Header row */}
          <div className="task-header">
            <h3 className="task-title">
              {task.isCompleted ? '✅' : '⬜'} {task.title}
            </h3>
            <div className="task-actions">
              <button
                className="btn btn-edit"
                onClick={() => onEdit(task)}
                title="Edit"
              >
                ✏️ Edit
              </button>
              <button
                className="btn btn-delete"
                onClick={() => onDelete(task.taskId)}
                title="Delete"
              >
                🗑 Delete
              </button>
            </div>
          </div>

          {/* Attribute rows */}
          <dl className="task-attrs">
            {/* N – Number */}
            <div className="attr-row">
              <dt>
                Priority <span className="type-badge badge-n">N</span>
              </dt>
              <dd>
                <PriorityBar value={task.priority} />
              </dd>
            </div>

            {/* BOOL – Boolean */}
            <div className="attr-row">
              <dt>
                Completed <span className="type-badge badge-bool">BOOL</span>
              </dt>
              <dd>{task.isCompleted ? 'Yes' : 'No'}</dd>
            </div>

            {/* L – List */}
            <div className="attr-row">
              <dt>
                Tags <span className="type-badge badge-l">L</span>
              </dt>
              <dd>
                {task.tags && task.tags.length > 0
                  ? task.tags.map((tag) => (
                      <span key={tag} className="tag-chip">{tag}</span>
                    ))
                  : <em>none</em>}
              </dd>
            </div>

            {/* M – Map */}
            <div className="attr-row">
              <dt>
                Metadata <span className="type-badge badge-m">M</span>
              </dt>
              <dd>
                {task.metadata && Object.keys(task.metadata).length > 0 ? (
                  <ul className="metadata-list">
                    {Object.entries(task.metadata).map(([k, v]) =>
                      v ? <li key={k}><strong>{k}:</strong> {v}</li> : null,
                    )}
                  </ul>
                ) : (
                  <em>none</em>
                )}
              </dd>
            </div>

            {/* S – String (taskId + createdAt) */}
            <div className="attr-row">
              <dt>
                ID <span className="type-badge badge-s">S</span>
              </dt>
              <dd className="task-id">{task.taskId}</dd>
            </div>

            {task.createdAt && (
              <div className="attr-row">
                <dt>Created</dt>
                <dd>{new Date(task.createdAt).toLocaleString()}</dd>
              </div>
            )}
          </dl>
        </li>
      ))}
    </ul>
  );
}

function PriorityBar({ value }) {
  const n = Math.min(Math.max(Number(value) || 1, 1), 5);
  const colors = ['', '#2ecc71', '#27ae60', '#f39c12', '#e67e22', '#e74c3c'];
  return (
    <span className="priority-bar" style={{ color: colors[n] }}>
      {'●'.repeat(n)}{'○'.repeat(5 - n)} &nbsp;{n}/5
    </span>
  );
}
