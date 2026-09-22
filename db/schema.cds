namespace library;

using { cuid, managed } from '@sap/cds/common';

entity Categories : cuid {
    name            : String(100) not null;
    description     : String(500);
    books           : Association to many Books on books.category = $self;
}

entity Books : cuid, managed {
    title               : String(200) not null;
    author              : String(150) not null;
    isbn                : String(50);
    publisher           : String(150);
    publishedYear       : Integer;
    quantity            : Integer default 0;
    availableQuantity   : Integer default 0;
    price               : Decimal(10,2);

    category            : Association to Categories;
    issueRecords        : Association to many IssueRecords on issueRecords.book = $self;
}

entity Members : cuid, managed {
    memberId            : String(20) not null;
    name                : String(150) not null;
    email               : String(150) not null;
    phone               : String(20);
    address             : String(500);
    membershipDate      : Date;
    status              : String(20) default 'ACTIVE'; // ACTIVE / INACTIVE

    issueRecords        : Association to many IssueRecords on issueRecords.member = $self;
}

entity IssueRecords : cuid, managed {
    book            : Association to Books;
    member          : Association to Members;

    issueDate       : Date;
    dueDate         : Date;
    returnDate      : Date;

    status          : String(20) default 'ISSUED'; // ISSUED / RETURNED
    fineAmount      : Decimal(10,2) default 0;
}