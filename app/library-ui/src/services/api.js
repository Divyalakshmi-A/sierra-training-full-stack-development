import { parseODataError } from '../utils/errors.js';

const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const serviceRoot = `${baseUrl}/library`;

let authCredentials = null;

export function setAuthCredentials(username, password) {
  if (username && password) {
    authCredentials = { username, password };
  } else {
    authCredentials = null;
  }
}

function buildHeaders(extra = {}) {
  const headers = {
    Accept: 'application/json',
    ...extra,
  };
  const mode = import.meta.env.VITE_AUTH_MODE || 'mock';
  if (mode === 'mock' && authCredentials) {
    const token = btoa(`${authCredentials.username}:${authCredentials.password}`);
    headers.Authorization = `Basic ${token}`;
  }
  return headers;
}

async function request(path, options = {}) {
  const url = path.startsWith('http') ? path : `${serviceRoot}${path}`;
  const mode = import.meta.env.VITE_AUTH_MODE || 'mock';
  const response = await fetch(url, {
    ...options,
    credentials: mode === 'xsuaa' ? 'include' : 'same-origin',
    headers: buildHeaders(options.headers),
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message = parseODataError(data, response.status);
    const error = new Error(message);
    error.status = response.status;
    error.body = data;
    throw error;
  }

  return data;
}

export async function fetchCurrentUserFromAppRouter() {
  const mode = import.meta.env.VITE_AUTH_MODE || 'mock';
  if (mode !== 'xsuaa') return null;
  try {
    const res = await fetch(`${baseUrl}/user-api/currentUser`, { credentials: 'include' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export const api = {
  getMetadata: () => request('/$metadata', { headers: { Accept: 'application/xml' } }),

  getCategories: () => request('/Categories'),
  getBooks: (query = '') => request(`/Books${query}`),
  getBook: (id) => request(`/Books(${id})?$expand=category`),
  createBook: (payload) =>
    request('/Books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  updateBook: (id, payload) =>
    request(`/Books(${id})`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  deleteBook: (id) => request(`/Books(${id})`, { method: 'DELETE' }),

  getMembers: () => request('/Members'),
  createMember: (payload) =>
    request('/Members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  updateMember: (id, payload) =>
    request(`/Members(${id})`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  deleteMember: (id) => request(`/Members(${id})`, { method: 'DELETE' }),

  getIssueRecords: (query = '') => request(`/IssueRecords${query}`),
  createIssueRecord: (payload) =>
    request('/IssueRecords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  returnIssueRecord: (id, returnDate) =>
    request(`/IssueRecords(${id})`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'RETURNED', returnDate }),
    }),
};

export { serviceRoot };
