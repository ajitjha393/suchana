import express from 'express';
import cors from 'cors';
import { notifications } from './data';
import { NotificationType } from './types';

const app = express();
app.use(cors());
app.use(express.json());

function contains(source: string, word: string): boolean {
  return source.toLowerCase().includes(word.toLowerCase());
}

/**
 * GET /api/notifications?page=&pageSize=&type=&search=
 * Returns paged list but with offset and limit and with filters applied.
 */
app.get('/api/notifications', (req, res) => {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize ?? 10)));
  const type = (req.query.type as NotificationType | undefined) ?? undefined;
  const search = String(req.query.search ?? '').trim();

  let filtered = [...notifications].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  if (type) {
    filtered = filtered.filter(n => n.type === type);
  }
  
  if (search) {
    filtered = filtered.filter(n =>
      contains(n.title, search) || contains(n.message, search) || (n.category ? contains(n.category, search) : false)
    );
  }

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  res.json({ items, page, pageSize, total });
});

/**
 * DELETE /api/notifications/delete-all
 * Deletes all notifications
 */
app.delete('/api/notifications/delete-all', (_req, res) => {
  const deleted = notifications.length;
  notifications.splice(0, notifications.length);
  return res.json({ ok: true, deleted });
});


/**
 * PATCH /api/notifications/:id/read
 * Body: { read: boolean }
 */
app.patch('/api/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  const read = Boolean(req.body?.read);

  const idx = notifications.findIndex(n => n.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Notification not found' });

  notifications[idx] = { ...notifications[idx]!, read };
  res.json(notifications[idx]);
});

/**
 * DELETE /api/notifications/:id
 */
app.delete('/api/notifications/:id', (req, res) => {
  const { id } = req.params;
  const idx = notifications.findIndex(n => n.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Notification not found' });

  notifications.splice(idx, 1);
  res.json({ ok: true as const });
});

/**
 * GET /api/notifications/unread/count
 */
app.get('/api/notifications/unread/count', (_, res) => {
  const count = notifications.reduce((acc, n) => acc + (n.read ? 0 : 1), 0);
  res.json({ count });
});

/**
 * PATCH /api/notifications/read
 * Body: { ids: string[]; read: boolean }
 */

app.patch('/api/notifications/read', (req, res) => {
  const { ids, read } = req.body as { ids: string[]; read: boolean };

  if (!Array.isArray(ids) || typeof read !== 'boolean') {
    return res.status(400).json({ message: 'Invalid payload' });
  }

  let updated = 0;
  for (const id of ids) {
    const idx = notifications.findIndex(n => n.id === id);
    if (idx !== -1) {
      notifications[idx] = { ...notifications[idx]!, read };
      updated++;
    }
  }

  return res.json({ ok: true, updated });
});


/**
 * DELETE /api/notifications
 * Body: { ids: string[] }
 */

app.delete('/api/notifications', (req, res) => {
  const { ids } = req.body as { ids: string[] };

  if (!Array.isArray(ids)) {
    return res.status(400).json({ message: 'Invalid payload' });
  }

  const before = notifications.length;
  const remaining = notifications.filter(n => !ids.includes(n.id));
  notifications.splice(0, notifications.length, ...remaining);
  const deleted = before - notifications.length;

  return res.json({ ok: true, deleted });
});




app.listen(4000, () => {
    console.log('Mock API running on http://localhost:4000');
});
