/**
 * TaskForm.jsx
 * Inputs for all 5 DynamoDB attribute types:
 *   title       → S  String
 *   priority    → N  Number
 *   isCompleted → BOOL Boolean
 *   tags        → L  List  (comma-separated string split into array)
 *   metadata    → M  Map   (assignee, dueDate, category)
 */
import { useState, useEffect } from 'react';

const DEFAULT_FORM = {
  title: '',
  priority: 3,
  isCompleted: false,
  tagsInput: '',         // raw comma-separated string → parsed to L (List)
  assignee: '',          // part of M (Map) – metadata.assignee
  dueDate: '',           // part of M (Map) – metadata.dueDate
  category: '',          // part of M (Map) – metadata.category
};

export default function TaskForm({ initialData, onSubmit, onCancel }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);

  /* Populate form when editing */
  useEffect(() => {
    if (!initialData) {
      setForm(DEFAULT_FORM);
      return;
    }
    setForm({
      title:       initialData.title       || '',
      priority:    initialData.priority    ?? 3,
      isCompleted: initialData.isCompleted ?? false,
      tagsInput:   (initialData.tags || []).join(', '),
      assignee:    initialData.metadata?.assignee  || '',
      dueDate:     initialData.metadata?.dueDate   || '',
      category:    initialData.metadata?.category  || '',
    });
  }, [initialData]);

  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const payload = {
      title:       form.title.trim(),                    // S
      priority:    Number(form.priority),                // N
      isCompleted: Boolean(form.isCompleted),            // BOOL
      tags: form.tagsInput                               // L
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      metadata: {                                        // M
        assignee: form.assignee.trim(),
        dueDate:  form.dueDate,
        category: form.category.trim(),
      },
    };

    setSubmitting(true);
    const ok = await onSubmit(payload);
    setSubmitting(false);
    if (ok && !initialData) setForm(DEFAULT_FORM); // reset only on create success
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      {/* ── String (S) ── */}
      <div className="form-group">
        <label htmlFor="title">
          Title <span className="type-badge badge-s">S&nbsp;String</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          value={form.title}
          onChange={handle}
          placeholder="Task title"
          required
        />
      </div>

      {/* ── Number (N) ── */}
      <div className="form-group">
        <label htmlFor="priority">
          Priority (1–5) <span className="type-badge badge-n">N&nbsp;Number</span>
        </label>
        <input
          id="priority"
          name="priority"
          type="number"
          min={1}
          max={5}
          value={form.priority}
          onChange={handle}
        />
      </div>

      {/* ── Boolean (BOOL) ── */}
      <div className="form-group form-group-check">
        <label htmlFor="isCompleted">
          <input
            id="isCompleted"
            name="isCompleted"
            type="checkbox"
            checked={form.isCompleted}
            onChange={handle}
          />
          Completed <span className="type-badge badge-bool">BOOL&nbsp;Boolean</span>
        </label>
      </div>

      {/* ── List (L) ── */}
      <div className="form-group">
        <label htmlFor="tagsInput">
          Tags (comma-separated) <span className="type-badge badge-l">L&nbsp;List</span>
        </label>
        <input
          id="tagsInput"
          name="tagsInput"
          type="text"
          value={form.tagsInput}
          onChange={handle}
          placeholder="e.g. urgent, backend, aws"
        />
      </div>

      {/* ── Map (M) – metadata fields ── */}
      <fieldset className="form-fieldset">
        <legend>
          Metadata <span className="type-badge badge-m">M&nbsp;Map</span>
        </legend>

        <div className="form-group">
          <label htmlFor="assignee">Assignee</label>
          <input
            id="assignee"
            name="assignee"
            type="text"
            value={form.assignee}
            onChange={handle}
            placeholder="e.g. Alice"
          />
        </div>

        <div className="form-group">
          <label htmlFor="dueDate">Due Date</label>
          <input
            id="dueDate"
            name="dueDate"
            type="date"
            value={form.dueDate}
            onChange={handle}
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <input
            id="category"
            name="category"
            type="text"
            value={form.category}
            onChange={handle}
            placeholder="e.g. DevOps"
          />
        </div>
      </fieldset>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : initialData ? 'Update Task' : 'Create Task'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
