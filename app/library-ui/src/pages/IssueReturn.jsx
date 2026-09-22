import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  Button,
  BusyIndicator,
  Label,
  ObjectStatus,
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

function addDays(isoDate, days) {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function IssueReturn() {
  const { canManage } = useAuth();
  const { showError, showSuccess } = useNotification();
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [issues, setIssues] = useState([]);
  const [bookId, setBookId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [issueDate, setIssueDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState(addDays(todayISO(), 14));
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const booksRes = await api.getBooks('?$expand=category');
      setBooks(booksRes.value || []);
      const issuesRes = await api.getIssueRecords('?$expand=book,member');
      setIssues(issuesRes.value || []);
      if (canManage()) {
        try {
          const membersRes = await api.getMembers();
          setMembers((membersRes.value || []).filter((m) => m.status === 'ACTIVE'));
        } catch (err) {
          if (err.status !== 403) throw err;
        }
      }
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  }, [canManage, showError]);

  useEffect(() => {
    load();
  }, [load]);

  const activeIssues = useMemo(
    () => issues.filter((i) => i.status === 'ISSUED'),
    [issues],
  );

  const availableBooks = useMemo(
    () => books.filter((b) => (b.availableQuantity ?? 0) > 0),
    [books],
  );

  const onIssue = async () => {
    if (!canManage()) {
      showError(new Error('Only admins can issue books'));
      return;
    }
    if (!bookId || !memberId) {
      showError(new Error('Select a book and a member'));
      return;
    }
    setSubmitting(true);
    try {
      await api.createIssueRecord({
        book_ID: bookId,
        member_ID: memberId,
        issueDate,
        dueDate,
        status: 'ISSUED',
      });
      showSuccess('Book issued');
      setBookId('');
      setMemberId('');
      load();
    } catch (err) {
      showError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const onReturn = async (record) => {
    if (!canManage()) {
      showError(new Error('Only admins can return books'));
      return;
    }
    const returnDate = todayISO();
    try {
      const updated = await api.returnIssueRecord(record.ID, returnDate);
      const fine = updated?.fineAmount ?? record.fineAmount;
      showSuccess(
        fine > 0
          ? `Book returned. Late fine: ₹${fine}`
          : 'Book returned with no fine',
      );
      load();
    } catch (err) {
      showError(err);
    }
  };

  if (loading) {
    return <BusyIndicator active size="Medium" />;
  }

  return (
    <div>
      <Title level="H2" className="page-title">
        Issue / Return
      </Title>

      {canManage() && (
        <>
          <Bar design="Header">
            <span>Issue a book</span>
          </Bar>
          <div className="toolbar-row" style={{ alignItems: 'flex-end' }}>
            <div>
              <Label showColon>Book</Label>
              <Select
                style={{ minWidth: '220px', marginTop: '0.25rem' }}
                onChange={(e) => setBookId(e.detail.selectedOption?.dataset?.id || '')}
              >
                <Option data-id="">Select book…</Option>
                {availableBooks.map((b) => (
                  <Option key={b.ID} data-id={b.ID} selected={bookId === b.ID}>
                    {b.title} ({b.availableQuantity} avail.)
                  </Option>
                ))}
              </Select>
            </div>
            <div>
              <Label showColon>Member</Label>
              <Select
                style={{ minWidth: '220px', marginTop: '0.25rem' }}
                onChange={(e) => setMemberId(e.detail.selectedOption?.dataset?.id || '')}
              >
                <Option data-id="">Select member…</Option>
                {members.map((m) => (
                  <Option key={m.ID} data-id={m.ID} selected={memberId === m.ID}>
                    {m.name} ({m.memberId})
                  </Option>
                ))}
              </Select>
            </div>
            <div>
              <Label showColon>Issue date</Label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => {
                  setIssueDate(e.target.value);
                  setDueDate(addDays(e.target.value, 14));
                }}
                style={{ display: 'block', marginTop: '0.25rem' }}
              />
            </div>
            <div>
              <Label showColon>Due date</Label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{ display: 'block', marginTop: '0.25rem' }}
              />
            </div>
            <Button design="Emphasized" onClick={onIssue} disabled={submitting}>
              Issue
            </Button>
          </div>
        </>
      )}

      <Bar design="Header" style={{ marginTop: '1.5rem' }}>
        <span>Active issues</span>
      </Bar>

      {activeIssues.length === 0 ? (
        <div className="empty-state">No books currently issued.</div>
      ) : (
        <Table
          headerRow={
            <TableHeaderRow sticky>
              <TableHeaderCell>Book</TableHeaderCell>
              <TableHeaderCell>Member</TableHeaderCell>
              <TableHeaderCell>Issued</TableHeaderCell>
              <TableHeaderCell>Due</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              {canManage() && <TableHeaderCell>Return</TableHeaderCell>}
            </TableHeaderRow>
          }
        >
          {activeIssues.map((row) => {
            const overdue = row.dueDate && row.dueDate < todayISO();
            return (
              <TableRow key={row.ID}>
                <TableCell>{row.book?.title || '—'}</TableCell>
                <TableCell>{row.member?.name || '—'}</TableCell>
                <TableCell>{row.issueDate}</TableCell>
                <TableCell>{row.dueDate}</TableCell>
                <TableCell>
                  <ObjectStatus state={overdue ? 'Error' : 'Success'}>
                    {overdue ? 'Overdue' : 'Issued'}
                  </ObjectStatus>
                </TableCell>
                {canManage() && (
                  <TableCell>
                    <Button design="Emphasized" onClick={() => onReturn(row)}>
                      Return
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </Table>
      )}
    </div>
  );
}
