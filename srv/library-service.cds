using library from '../db/schema';

@path: '/library'
service LibraryService {

    entity Categories   as projection on library.Categories;
    entity Books        as projection on library.Books;
    entity Members      as projection on library.Members;
    entity IssueRecords as projection on library.IssueRecords;

}