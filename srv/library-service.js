import cds from '@sap/cds';

export default cds.service.impl(async function () {

    const { Books, Members, IssueRecords } = this.entities;
    const LATE_FINE_PER_DAY = 5;

    // Helper to safely get the key from params (works for cuid UUID keys)
    const getId = (req) => {
        const p = req.params[req.params.length - 1];
        return typeof p === 'object' ? p.ID : p;
    };

    // =========================================================
    // CATEGORIES
    // =========================================================

    this.before('CREATE', 'Categories', (req) => {
        if (!req.data.name || req.data.name.trim() === '') {
            req.error(400, 'Category name is required');
        }
    });

    this.before('DELETE', 'Categories', async (req) => {
        const id = getId(req);
        const linkedBook = await SELECT.one.from(Books).where({ category_ID: id });
        if (linkedBook) {
            req.error(400, 'Cannot delete category that has books assigned to it');
        }
    });

    // =========================================================
    // BOOKS
    // =========================================================

    this.before('CREATE', 'Books', (req) => {
        const { quantity, availableQuantity, price } = req.data;

        if (quantity < 0) req.error(400, 'Quantity cannot be negative');
        if (availableQuantity < 0) req.error(400, 'Available quantity cannot be negative');
        if (price < 0) req.error(400, 'Price cannot be negative');

        if (
            availableQuantity !== undefined &&
            quantity !== undefined &&
            availableQuantity > quantity
        ) {
            req.error(400, 'Available quantity cannot be greater than total quantity');
        }
    });

    this.before('UPDATE', 'Books', async (req) => {
        const id = getId(req);
        const existing = await SELECT.one.from(Books).where({ ID: id });
        if (!existing) req.error(404, 'Book not found');

        const newQuantity  = req.data.quantity ?? existing.quantity;
        const newAvailable = req.data.availableQuantity ?? existing.availableQuantity;

        if (newQuantity < 0) req.error(400, 'Quantity cannot be negative');
        if (newAvailable < 0) req.error(400, 'Available quantity cannot be negative');
        if (req.data.price !== undefined && req.data.price < 0) req.error(400, 'Price cannot be negative');

        if (newAvailable > newQuantity) {
            req.error(400, 'Available quantity cannot exceed total quantity');
        }
    });

    this.before('DELETE', 'Books', async (req) => {
        const id = getId(req);
        const activeIssue = await SELECT.one.from(IssueRecords).where({ book_ID: id, status: 'ISSUED' });
        if (activeIssue) {
            req.error(400, 'Cannot delete a book that currently has copies issued');
        }
    });

    // =========================================================
    // MEMBERS
    // =========================================================

    this.before('CREATE', 'Members', async (req) => {
        const { name, email, status, memberId } = req.data;

        if (!name || name.trim() === '') req.error(400, 'Member name is required');
        if (!email || email.trim() === '') req.error(400, 'Email is required');

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && !emailRegex.test(email)) req.error(400, 'Invalid email format');

        if (status && !['ACTIVE', 'INACTIVE'].includes(status)) {
            req.error(400, 'Status must be ACTIVE or INACTIVE');
        }

        if (memberId) {
            const existingMember = await SELECT.one.from(Members).where({ memberId });
            if (existingMember) req.error(400, `Member ID ${memberId} already exists`);
        }
    });

    this.before('UPDATE', 'Members', async (req) => {
        const { email, status } = req.data;

        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) req.error(400, 'Invalid email format');
        }

        if (status && !['ACTIVE', 'INACTIVE'].includes(status)) {
            req.error(400, 'Status must be ACTIVE or INACTIVE');
        }
    });

    this.before('DELETE', 'Members', async (req) => {
        const id = getId(req);
        const activeIssue = await SELECT.one.from(IssueRecords).where({ member_ID: id, status: 'ISSUED' });
        if (activeIssue) {
            req.error(400, 'Cannot delete a member with books currently issued');
        }
    });

    // =========================================================
    // ISSUE RECORDS
    // =========================================================

    this.before('CREATE', 'IssueRecords', async (req) => {
        const { book_ID, member_ID } = req.data;

        if (!book_ID) req.error(400, 'Book is required');
        if (!member_ID) req.error(400, 'Member is required');

        const book = await SELECT.one.from(Books).where({ ID: book_ID });
        if (!book) req.error(404, 'Book not found');
        if (book.availableQuantity <= 0) req.error(400, 'Book is not available');

        const member = await SELECT.one.from(Members).where({ ID: member_ID });
        if (!member) req.error(404, 'Member not found');
        if (member.status !== 'ACTIVE') req.error(400, 'Member is not active');

        // Prevent the same member holding two active copies of the same book
        const alreadyIssued = await SELECT.one.from(IssueRecords)
            .where({ book_ID, member_ID, status: 'ISSUED' });
        if (alreadyIssued) req.error(400, 'This member already has this book issued');

        // Default dates if not provided
        req.data.issueDate = req.data.issueDate || new Date().toISOString().slice(0, 10);
        if (!req.data.dueDate) {
            const due = new Date(req.data.issueDate);
            due.setDate(due.getDate() + 14); // default 14-day loan period
            req.data.dueDate = due.toISOString().slice(0, 10);
        }
    });

    // Decrement stock after a book is issued
    this.after('CREATE', 'IssueRecords', async (data) => {
        const book = await SELECT.one.from(Books).where({ ID: data.book_ID });
        if (book) {
            await UPDATE(Books, book.ID).with({ availableQuantity: book.availableQuantity - 1 });
        }
    });

    // Handle status transition to RETURNED + fine calculation
    this.before('UPDATE', 'IssueRecords', async (req) => {
        if (req.data.status === 'RETURNED') {
            const id = getId(req);
            const existing = await SELECT.one.from(IssueRecords).where({ ID: id });
            if (!existing) req.error(404, 'Issue record not found');
            if (existing.status === 'RETURNED') req.error(400, 'This book has already been returned');

            const returnDate = req.data.returnDate || new Date().toISOString().slice(0, 10);
            req.data.returnDate = returnDate;

            const due = new Date(existing.dueDate);
            const ret = new Date(returnDate);
            const lateDays = Math.ceil((ret - due) / (1000 * 60 * 60 * 24));

            req.data.fineAmount = lateDays > 0 ? lateDays * LATE_FINE_PER_DAY : 0;
        } 
    });

    // Restore stock after a book is returned
    this.after('UPDATE', 'IssueRecords', async (data, req) => {
        if (data.status === 'RETURNED') {
            const id = getId(req);
            const issue = await SELECT.one.from(IssueRecords).where({ ID: id });
            const book = await SELECT.one.from(Books).where({ ID: issue.book_ID });
            if (book) {
                await UPDATE(Books, book.ID).with({ availableQuantity: book.availableQuantity + 1 });
            }
        }
    });

    this.before('DELETE', 'IssueRecords', async (req) => {
        const id = getId(req);
        const existing = await SELECT.one.from(IssueRecords).where({ ID: id });
        if (existing && existing.status === 'ISSUED') {
            req.error(400, 'Cannot delete an active issue record — return the book first');
        }
    });

});