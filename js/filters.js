
import * as element from "./index_elements.js";
import { populate_books_grid } from "./index_renderer.js"
import * as regex from "./regex.js"

const subject_checkboxes = document.getElementsByClassName("subject_checkbox");
let checked_subjects_map = new Map();
for (let i = 0; i < subject_checkboxes.length; i++) checked_subjects_map.set(subject_checkboxes.item(i).id, false);

// LISTENERS

element.btn_clear_filters.addEventListener('click', () => {
    clear_filters();
    apply_filters();
});

for (let i = 0; i < subject_checkboxes.length; i++) {
    let checkbox = subject_checkboxes.item(i);
    checkbox.addEventListener('change', function() {
        checked_subjects_map.set(this.id, this.checked ? true : false); // "this" refers to the checkbox
        apply_filters();
    });
}

element.filter_txtboxes.forEach((txtbox) => {
    txtbox.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') apply_filters();
    });
});

// FUNCTIONS

function clear_filters() {
    checked_subjects_map.forEach((value, key, checked_subjects_map) => checked_subjects_map.set(key, false));
    for (let i = 0; i < subject_checkboxes.length; i++) subject_checkboxes.item(i).checked = false;
    element.filter_txtboxes.forEach((txtbox) => { txtbox.value = "" });
}

export function clear_grid() {
    while (element.book_grid.firstChild)
        element.book_grid.removeChild(element.book_grid.lastChild);
}

function apply_filters() {
    clear_grid();
    let filter_query_args = [];

    // subjects
    checked_subjects_map.forEach((is_checked, subject) => {
        filter_query_args.push(is_checked ? subject : "");
    });

    let no_subject_checked = true;
    filter_query_args.forEach((subject) => {
        if (subject != "") no_subject_checked = false;
    });

    let no_filters_applied = no_subject_checked &&
                             !element.txtbox_copyright_year.value &&
                             !element.txtbox_page_count.value &&
                             !element.txtbox_search.value;

    if (no_filters_applied) {
        populate_books_grid(database_api.get_all_books());
        return;
    }

    if (no_subject_checked) { // push all subjects
        filter_query_args = [];
        checked_subjects_map.forEach((is_checked, subject) => {
            filter_query_args.push(subject);
        });
    }

    // copyright year
    let exact_copyright_year = element.txtbox_copyright_year.value.match(regex.is_exact_copyright_year);
    let at_most_copyright_year = element.txtbox_copyright_year.value.match(regex.is_at_most_copyright_year);
    let at_least_copyright_year = element.txtbox_copyright_year.value.match(regex.is_at_least_copyright_year);

    // see preload.js for SQL query format
    if (exact_copyright_year) {
        for (let i = 0; i < 2; i++) filter_query_args.push(Number(element.txtbox_copyright_year.value));
    } else if (at_most_copyright_year) {
        filter_query_args.push(1700);
        filter_query_args.push(Number(element.txtbox_copyright_year.value.substring(2)));
    } else if(at_least_copyright_year) {
        filter_query_args.push(Number(element.txtbox_copyright_year.value.substring(0, 4)));
        filter_query_args.push(3000);
    } else if (element.txtbox_copyright_year.value.match(regex.is_copyright_year_in_range)) {
        filter_query_args.push(Number(element.txtbox_copyright_year.value.substring(0, 4)));
        filter_query_args.push(Number(element.txtbox_copyright_year.value.substring(6)));
    } else {
        filter_query_args.push(1700); // earliest copyright year
        filter_query_args.push(3000); // latest copyright year
    }

    // page count
    let exact_page_count = element.txtbox_page_count.value.match(regex.is_exact_page_count);
    let at_most_page_count = element.txtbox_page_count.value.match(regex.is_at_most_page_count);
    let at_least_page_count = element.txtbox_page_count.value.match(regex.is_at_least_page_count);

    if (exact_page_count) {
        for (let i = 0; i < 2; i++) filter_query_args.push(Number(element.txtbox_page_count.value));
    } else if (at_most_page_count) {
        filter_query_args.push(100);
        filter_query_args.push(Number(element.txtbox_page_count.value.substring(2)));
    } else if (at_least_page_count) {
        filter_query_args.push(Number(element.txtbox_page_count.value.split("..")[0]));
        filter_query_args.push(9999);
    } else if (element.txtbox_page_count.value.match(regex.is_page_count_in_range)) {
        filter_query_args.push(Number(element.txtbox_page_count.value.split("..")[0]));
        filter_query_args.push(Number(element.txtbox_page_count.value.split("..")[1]));
    } else {
        filter_query_args.push(100); // min page count
        filter_query_args.push(9999); // max page count
    }

    // search bar
    // matches: 1.title, 2.author, 3.edition, 4.uid (hence the four loop iterations)
    // if you pass the % in query in preload, it does not work
    for (let i = 0; i < 4; i++) filter_query_args.push("%" + element.txtbox_search.value + "%");

    console.log(filter_query_args);

    database_api.get_filter_query_args(filter_query_args); // sends filter_query_args to main process
    populate_books_grid(database_api.get_filtered_books()); // calls get_filtered_books from preload.js
}
