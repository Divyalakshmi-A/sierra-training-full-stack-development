namespace library;

entity Categories {
    key ID          : UUID;
    name            : String(100) not null;
    description     : String(500);
}

entity Books {
    key ID              : UUID;
    title               : String(200) not null;
    author              : String(150) not null;
    isbn                : String(50);
    publisher           : String(150);
    publishedYear       : Integer;
    quantity            : Integer default 0;
    availableQuantity   : Integer default 0;
    price               : Decimal(10,2);

    category            : Association to Categories;
}

entity Members {
    key ID              : UUID;
    memberId            : String(20) not null;
    name                : String(150) not null;
    email               : String(150) not null;
    phone               : String(20);
    address             : String(500);
    membershipDate      : Date;
    status              : String(20) default 'ACTIVE';
}

entity IssueRecords {
    key ID          : UUID;

    book            : Association to Books;
    member          : Association to Members;

    issueDate       : Date;
    dueDate         : Date;
    returnDate      : Date;

    status          : String(20) default 'ISSUED';
    fineAmount      : Decimal(10,2) default 0;
}