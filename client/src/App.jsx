/**
 * App.jsx – root component
 * Manages global state (tasks list, selected task for editing).
 * Wires up TaskForm and TaskList.
 */
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';

const API_BASE = ''; // same origin (Vite proxy in dev, Express static in prod)

export default function App() {
  const [tasks, setTasks]           = useState([]);
  const [editingTask, setEditingTask] = useState(null);  // null = "create" mode
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');

  /* ── Fetch all tasks ── */
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get(`${API_BASE}/read`);
      // Sort newest-first by createdAt
      setTasks((data.tasks || []).sort((a, b) =>
        (b.createdAt || '').localeCompare(a.createdAt || ''),
      ));
    } catch (err) {
      setError('Could not load tasks: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  /* ── Create task ── */
  const handleCreate = async (formData) => {
    try {
      await axios.post(`${API_BASE}/create`, formData);
      setSuccess('Task created!');
      fetchTasks();
      return true;
    } catch (err) {
      setError('Create failed: ' + (err.response?.data?.error || err.message));
      return false;
    }
  };

  /* ── Update task ── */
  const handleUpdate = async (formData) => {
    try {
      await axios.put(`${API_BASE}/update`, { ...formData, taskId: editingTask.taskId });
      setSuccess('Task updated!');
      setEditingTask(null);
      fetchTasks();
      return true;
    } catch (err) {
      setError('Update failed: ' + (err.response?.data?.error || err.message));
      return false;
    }
  };

  /* ── Delete task ── */
  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await axios.delete(`${API_BASE}/delete/${taskId}`);
      setSuccess('Task deleted.');
      fetchTasks();
    } catch (err) {
      setError('Delete failed: ' + (err.response?.data?.error || err.message));
    }
  };

  /* ── Auto-clear messages ── */
  useEffect(() => {
    if (!error && !success) return;
    const t = setTimeout(() => { setError(''); setSuccess(''); }, 4000);
    return () => clearTimeout(t);
  }, [error, success]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>DynamoDB Task Manager</h1>
        <p className="subtitle">MERN + AWS DynamoDB · 5 Attribute Types Demo</p>
      </header>

      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <main className="app-main">
        <section className="panel form-panel">
          <h2>{editingTask ? '✏️ Edit Task' : '➕ New Task'}</h2>
          <TaskForm
            initialData={editingTask}
            onSubmit={editingTask ? handleUpdate : handleCreate}
            onCancel={editingTask ? () => setEditingTask(null) : null}
          />
        </section>

        <section className="panel list-panel">
          <div className="list-header">
            <h2>Task List {loading && <span className="spinner" />}</h2>
            <button className="btn btn-ghost" onClick={fetchTasks} disabled={loading}>
              ↺ Refresh
            </button>
          </div>
          <TaskList
            tasks={tasks}
            onEdit={setEditingTask}
            onDelete={handleDelete}
          />
        </section>
      </main>

      <footer className="app-footer">
        <small>
          Attribute types in use:&nbsp;
          <code>String (S)</code>&nbsp;|&nbsp;
          <code>Number (N)</code>&nbsp;|&nbsp;
          <code>Boolean (BOOL)</code>&nbsp;|&nbsp;
          <code>List (L)</code>&nbsp;|&nbsp;
          <code>Map (M)</code>
        </small>
      </footer>
    </div>
  );
}
