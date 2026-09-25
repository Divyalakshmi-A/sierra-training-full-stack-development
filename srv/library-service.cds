using library from '../db/schema';

type UserInfo {
    id    : String;
    roles : array of String;
}

@path: '/library'
service LibraryService {

    @(requires: 'authenticated-user')
    function me() returns UserInfo;

    @(restrict: [
        { grant: ['READ'],                        to: 'Member' },
        { grant: ['READ','CREATE','UPDATE','DELETE'], to: 'Admin' }
    ])
    entity Categories   as projection on library.Categories;

    @(restrict: [
        { grant: ['READ'],                        to: 'Member' },
        { grant: ['READ','CREATE','UPDATE','DELETE'], to: 'Admin' }
    ])
    entity Books        as projection on library.Books;

    @(restrict: [
        { grant: ['READ','CREATE','UPDATE','DELETE'], to: 'Admin' }
    ])
    entity Members      as projection on library.Members;

    @(restrict: [
        { grant: ['READ'],                        to: 'Member' },
        { grant: ['READ','CREATE','UPDATE','DELETE'], to: 'Admin' }
    ])
    entity IssueRecords as projection on library.IssueRecords;

}