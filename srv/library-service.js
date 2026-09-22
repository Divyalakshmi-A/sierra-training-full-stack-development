import cds from '@sap/cds';

export default cds.service.impl(async function () {

    const { Books, Members } = this.entities;

    /**
     * Book Validation
     */
    this.before('CREATE', 'Books', async (req) => {

        if (req.data.quantity < 0) {
            req.error(400, 'Quantity cannot be negative');
        }

        if (req.data.availableQuantity < 0) {
            req.error(400, 'Available quantity cannot be negative');
        }

        if (req.data.price < 0) {
            req.error(400, 'Price cannot be negative');
        }

        if (
            req.data.availableQuantity !== undefined &&
            req.data.quantity !== undefined &&
            req.data.availableQuantity > req.data.quantity
        ) {
            req.error(
                400,
                'Available quantity cannot be greater than total quantity'
            );
        }

    });

    /**
     * Member validation
     */

     this.before('CREATE', 'Members', async (req) => {

        // Name validation
        if (!req.data.name || req.data.name.trim() === '') {
            req.error(400, 'Member name is required');
        }

        // Email validation
        if (!req.data.email || req.data.email.trim() === '') {
            req.error(400, 'Email is required');
        }

        // Status validation
        if (
            req.data.status &&
            !['ACTIVE', 'INACTIVE'].includes(req.data.status)
        ) {
            req.error(
                400,
                'Status must be ACTIVE or INACTIVE'
            );
        }

        // Member ID uniqueness
        if (req.data.memberId) {

            const existingMember = await SELECT.one
                .from(Members)
                .where({ memberId: req.data.memberId });

            if (existingMember) {
                req.error(
                    400,
                    `Member ID ${req.data.memberId} already exists`
                );
            }
        }

    });

   /**
    * Issue book
    */

this.before('CREATE', 'IssueRecords', async (req) => {

    const { book_ID, member_ID } = req.data;

    // Check Book ID
    if (!book_ID) {
        req.error(400, 'Book is required');
    }

    // Check Member ID
    if (!member_ID) {
        req.error(400, 'Member is required');
    }

    // Get Book
    const book = await SELECT.one
        .from(Books)
        .where({ ID: book_ID });

    if (!book) {
        req.error(404, 'Book not found');
    }

    // Check available quantity
    if (book.availableQuantity <= 0) {
        req.error(400, 'Book is not available');
    }

    // Get Member
    const member = await SELECT.one
        .from(Members)
        .where({ ID: member_ID });

    if (!member) {
        req.error(404, 'Member not found');
    }

    // Check member status
    if (member.status !== 'ACTIVE') {
        req.error(400, 'Member is not active');
    }

});

});