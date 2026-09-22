import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  BusyIndicator,
  Input,
  Label,
  Option,
  Select,
  Title,
} from '@ui5/webcomponents-react';
import { api } from '../services/api.js';
import { useNotification } from '../context/NotificationContext.jsx';

function validateBook(data, isNew) {
  const errors = [];
  if (!data.title?.trim()) errors.push('Title is required');
  if (!data.author?.trim()) errors.push('Author is required');
  const qty = Number(data.quantity);
  const avail = Number(data.availableQuantity);
  const price = data.price === '' || data.price === undefined ? 0 : Number(data.price);
  if (Number.isNaN(qty) || qty < 0) errors.push('Quantity cannot be negative');
  if (Number.isNaN(avail) || avail < 0) errors.push('Available quantity cannot be negative');
  if (!Number.isNaN(qty) && !Number.isNaN(avail) && avail > qty) {
    errors.push('Available quantity cannot exceed total quantity');
  }
  if (Number.isNaN(price) || price < 0) errors.push('Price cannot be negative');
  if (isNew && avail === undefined) {
    // default handled below
  }
  return errors;
}

export default function BookForm() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const { showError, showSuccess, showBanner, clearBanner } = useNotification();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: '',
    author: '',
    isbn: '',
    publisher: '',
    publishedYear: '',
    quantity: '1',
    availableQuantity: '1',
    price: '',
    category_ID: '',
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const catRes = await api.getCategories();
        if (!cancelled) setCategories(catRes.value || []);
        if (!isNew) {
          const book = await api.getBook(id);
          if (!cancelled) {
            setForm({
              title: book.title || '',
              author: book.author || '',
              isbn: book.isbn || '',
              publisher: book.publisher || '',
              publishedYear: book.publishedYear?.toString() || '',
              quantity: String(book.quantity ?? 0),
              availableQuantity: String(book.availableQuantity ?? 0),
              price: book.price != null ? String(book.price) : '',
              category_ID: book.category_ID || book.category?.ID || '',
            });
          }
        }
      } catch (err) {
        if (!cancelled) showError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isNew, showError]);

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const submit = async (e) => {
    e.preventDefault();
    clearBanner();
    const errors = validateBook(form, isNew);
    if (errors.length) {
      showBanner(errors.join('. '), 'Negative');
      return;
    }
    const payload = {
      title: form.title.trim(),
      author: form.author.trim(),
      isbn: form.isbn.trim() || undefined,
      publisher: form.publisher.trim() || undefined,
      publishedYear: form.publishedYear ? Number(form.publishedYear) : undefined,
      quantity: Number(form.quantity),
      availableQuantity: Number(form.availableQuantity),
      price: form.price === '' ? undefined : Number(form.price),
      category_ID: form.category_ID || undefined,
    };
    setSaving(true);
    try {
      if (isNew) {
        await api.createBook(payload);
        showSuccess('Book created');
      } else {
        await api.updateBook(id, payload);
        showSuccess('Book updated');
      }
      navigate('/books');
    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <BusyIndicator active size="Medium" />;
  }

  return (
    <div>
      <Title level="H2" className="page-title">
        {isNew ? 'Add Book' : 'Edit Book'}
      </Title>
      <form className="form-grid" style={{ maxWidth: '480px' }} onSubmit={submit}>
        <div>
          <Label required showColon>
            Title
          </Label>
          <Input
            value={form.title}
            onInput={(e) => update('title', e.target.value)}
            required
            style={{ width: '100%', marginTop: '0.25rem' }}
          />
        </div>
        <div>
          <Label required showColon>
            Author
          </Label>
          <Input
            value={form.author}
            onInput={(e) => update('author', e.target.value)}
            required
            style={{ width: '100%', marginTop: '0.25rem' }}
          />
        </div>
        <div>
          <Label showColon>
            Category
          </Label>
          <Select
            style={{ width: '100%', marginTop: '0.25rem' }}
            onChange={(e) => update('category_ID', e.detail.selectedOption?.dataset?.id || '')}
          >
            <Option data-id="">— None —</Option>
            {categories.map((c) => (
              <Option key={c.ID} data-id={c.ID} selected={form.category_ID === c.ID}>
                {c.name}
              </Option>
            ))}
          </Select>
        </div>
        <div>
          <Label showColon>
            ISBN
          </Label>
          <Input
            value={form.isbn}
            onInput={(e) => update('isbn', e.target.value)}
            style={{ width: '100%', marginTop: '0.25rem' }}
          />
        </div>
        <div>
          <Label showColon>
            Publisher
          </Label>
          <Input
            value={form.publisher}
            onInput={(e) => update('publisher', e.target.value)}
            style={{ width: '100%', marginTop: '0.25rem' }}
          />
        </div>
        <div>
          <Label showColon>
            Published year
          </Label>
          <Input
            type="Number"
            value={form.publishedYear}
            onInput={(e) => update('publishedYear', e.target.value)}
            style={{ width: '100%', marginTop: '0.25rem' }}
          />
        </div>
        <div>
          <Label showColon>
            Quantity
          </Label>
          <Input
            type="Number"
            value={form.quantity}
            onInput={(e) => update('quantity', e.target.value)}
            style={{ width: '100%', marginTop: '0.25rem' }}
          />
        </div>
        <div>
          <Label showColon>
            Available quantity
          </Label>
          <Input
            type="Number"
            value={form.availableQuantity}
            onInput={(e) => update('availableQuantity', e.target.value)}
            style={{ width: '100%', marginTop: '0.25rem' }}
          />
        </div>
        <div>
          <Label showColon>
            Price (₹)
          </Label>
          <Input
            type="Number"
            value={form.price}
            onInput={(e) => update('price', e.target.value)}
            style={{ width: '100%', marginTop: '0.25rem' }}
          />
        </div>
        <div className="form-actions">
          <Button design="Emphasized" type="Submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <Button design="Transparent" onClick={() => navigate('/books')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
