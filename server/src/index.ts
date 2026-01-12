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




app.listen(4000, () => {
    console.log('Mock API running on http://localhost:4000');
});
