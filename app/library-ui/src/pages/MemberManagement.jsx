import { useCallback, useEffect, useState } from 'react';
import {
  Bar,
  Button,
  BusyIndicator,
  Dialog,
  Input,
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
import { useNotification } from '../context/NotificationContext.jsx';

const emptyMember = {
  memberId: '',
  name: '',
  email: '',
  phone: '',
  address: '',
  membershipDate: new Date().toISOString().slice(0, 10),
  status: 'ACTIVE',
};

export default function MemberManagement() {
  const { showError, showSuccess } = useNotification();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyMember);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getMembers();
      setMembers(res.value || []);
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyMember, membershipDate: new Date().toISOString().slice(0, 10) });
    setDialogOpen(true);
  };

  const openEdit = (m) => {
    setEditingId(m.ID);
    setForm({
      memberId: m.memberId || '',
      name: m.name || '',
      email: m.email || '',
      phone: m.phone || '',
      address: m.address || '',
      membershipDate: m.membershipDate || '',
      status: m.status || 'ACTIVE',
    });
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form };
      if (editingId) {
        await api.updateMember(editingId, payload);
        showSuccess('Member updated');
      } else {
        await api.createMember(payload);
        showSuccess('Member created');
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (m) => {
    const next = m.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.updateMember(m.ID, { status: next });
      showSuccess(`Member marked ${next}`);
      load();
    } catch (err) {
      showError(err);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this member?')) return;
    try {
      await api.deleteMember(id);
      showSuccess('Member deleted');
      load();
    } catch (err) {
      showError(err);
    }
  };

  return (
    <div>
      <Title level="H2" className="page-title">
        Member Management
      </Title>
      <Bar design="Header">
        <Button design="Emphasized" icon="add" onClick={openCreate}>
          Add Member
        </Button>
      </Bar>

      {loading ? (
        <BusyIndicator active size="Medium" />
      ) : members.length === 0 ? (
        <div className="empty-state">No members yet.</div>
      ) : (
        <Table
          headerRow={
            <TableHeaderRow sticky>
              <TableHeaderCell>Member ID</TableHeaderCell>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Email</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableHeaderRow>
          }
        >
          {members.map((m) => (
            <TableRow key={m.ID}>
              <TableCell>{m.memberId}</TableCell>
              <TableCell>{m.name}</TableCell>
              <TableCell>{m.email}</TableCell>
              <TableCell>
                <ObjectStatus state={m.status === 'ACTIVE' ? 'Success' : 'None'}>
                  {m.status}
                </ObjectStatus>
              </TableCell>
              <TableCell className="table-actions">
                <Button design="Transparent" onClick={() => openEdit(m)}>
                  Edit
                </Button>
                <Button design="Transparent" onClick={() => toggleStatus(m)}>
                  Toggle status
                </Button>
                <Button design="Negative" onClick={() => onDelete(m.ID)}>
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}

      <Dialog
        open={dialogOpen}
        headerText={editingId ? 'Edit Member' : 'Add Member'}
        onAfterClose={() => setDialogOpen(false)}
        footer={
          <>
            <Button design="Emphasized" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button design="Transparent" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <div className="form-grid">
          <div>
            <Label required showColon>
              Member ID
            </Label>
            <Input
              value={form.memberId}
              onInput={(e) => setForm((f) => ({ ...f, memberId: e.target.value }))}
              readonly={Boolean(editingId)}
              style={{ width: '100%', marginTop: '0.25rem' }}
            />
          </div>
          <div>
            <Label required showColon>
              Name
            </Label>
            <Input
              value={form.name}
              onInput={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              style={{ width: '100%', marginTop: '0.25rem' }}
            />
          </div>
          <div>
            <Label required showColon>
              Email
            </Label>
            <Input
              value={form.email}
              onInput={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              style={{ width: '100%', marginTop: '0.25rem' }}
            />
          </div>
          <div>
            <Label showColon>
              Phone
            </Label>
            <Input
              value={form.phone}
              onInput={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              style={{ width: '100%', marginTop: '0.25rem' }}
            />
          </div>
          <div>
            <Label showColon>
              Address
            </Label>
            <Input
              value={form.address}
              onInput={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              style={{ width: '100%', marginTop: '0.25rem' }}
            />
          </div>
          <div>
            <Label showColon>
              Membership date
            </Label>
            <Input
              type="Date"
              value={form.membershipDate}
              onInput={(e) => setForm((f) => ({ ...f, membershipDate: e.target.value }))}
              style={{ width: '100%', marginTop: '0.25rem' }}
            />
          </div>
          <div>
            <Label showColon>
              Status
            </Label>
            <Select
              style={{ width: '100%', marginTop: '0.25rem' }}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  status: e.detail.selectedOption?.textContent || 'ACTIVE',
                }))
              }
            >
              <Option selected={form.status === 'ACTIVE'}>ACTIVE</Option>
              <Option selected={form.status === 'INACTIVE'}>INACTIVE</Option>
            </Select>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
