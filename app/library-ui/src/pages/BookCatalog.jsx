import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bar,
  Button,
  BusyIndicator,
  Input,
  Option,
  Select,
  Table,
  TableCell,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
  Title,
} from '@ui5/webcomponents-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx';

export default function BookCatalog() {
  const navigate = useNavigate();
  const { canManage } = useAuth();
  const { showError, showSuccess } = useNotification();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [booksRes, catRes] = await Promise.all([
        api.getBooks('?$expand=category'),
        api.getCategories(),
      ]);
      setBooks(booksRes.value || []);
      setCategories(catRes.value || []);
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return books.filter((b) => {
      if (categoryFilter && b.category_ID !== categoryFilter) return false;
      if (!q) return true;
      return (
        b.title?.toLowerCase().includes(q) ||
        b.author?.toLowerCase().includes(q) ||
        b.category?.name?.toLowerCase().includes(q)
      );
    });
  }, [books, search, categoryFilter]);

  const onDelete = async (id) => {
    if (!window.confirm('Delete this book?')) return;
    try {
      await api.deleteBook(id);
      showSuccess('Book deleted');
      load();
    } catch (err) {
      showError(err);
    }
  };

  return (
    <div>
      <Title level="H2" className="page-title">
        Book Catalog
      </Title>
      {canManage() && (
        <Bar design="Header">
          <Button design="Emphasized" icon="add" onClick={() => navigate('/books/new')}>
            Add Book
          </Button>
        </Bar>
      )}
      <div className="toolbar-row">
        <Input
          placeholder="Search title, author, category…"
          value={search}
          onInput={(e) => setSearch(e.target.value)}
          style={{ minWidth: '240px' }}
          icon={<span slot="icon">🔍</span>}
        />
        <Select
          onChange={(e) => setCategoryFilter(e.detail.selectedOption?.dataset?.id || '')}
        >
          <Option data-id="" selected={!categoryFilter}>
            All categories
          </Option>
          {categories.map((c) => (
            <Option key={c.ID} data-id={c.ID} selected={categoryFilter === c.ID}>
              {c.name}
            </Option>
          ))}
        </Select>
        <Button icon="refresh" onClick={load}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <BusyIndicator active size="Medium" />
      ) : filtered.length === 0 ? (
        <div className="empty-state">No books match your filters.</div>
      ) : (
        <Table
          headerRow={
            <TableHeaderRow sticky>
              <TableHeaderCell>Title</TableHeaderCell>
              <TableHeaderCell>Author</TableHeaderCell>
              <TableHeaderCell>Category</TableHeaderCell>
              <TableHeaderCell>Available</TableHeaderCell>
              <TableHeaderCell>Price (₹)</TableHeaderCell>
              {canManage() && <TableHeaderCell>Actions</TableHeaderCell>}
            </TableHeaderRow>
          }
        >
          {filtered.map((book) => (
            <TableRow key={book.ID}>
              <TableCell>{book.title}</TableCell>
              <TableCell>{book.author}</TableCell>
              <TableCell>{book.category?.name || '—'}</TableCell>
              <TableCell>
                {book.availableQuantity} / {book.quantity}
              </TableCell>
              <TableCell>{book.price ?? '—'}</TableCell>
              {canManage() && (
                <TableCell className="table-actions">
                  <Button design="Transparent" onClick={() => navigate(`/books/${book.ID}`)}>
                    Edit
                  </Button>
                  <Button design="Negative" onClick={() => onDelete(book.ID)}>
                    Delete
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </Table>
      )}
    </div>
  );
}
