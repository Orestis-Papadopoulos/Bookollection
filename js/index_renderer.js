
import * as element from "./index_elements.js";

// todo: populate filters by reading the .db file; each book subject goes to filters

// LISTENERS

database_api.no_default_database((value) => {
    element.database_layout.style.display = "flex";
});

element.btn_load_database.addEventListener("click", () => {
    database_api.load_database();
});

database_api.on_database_load((value) => {
    populate_books_grid(database_api.get_all_books());
    element.database_layout.style.display = "none";
    element.parent_layout.classList.toggle("visible");
});

element.btn_filters.addEventListener("click", () => {
    element.filters_layout.classList.toggle("hidden_filters_layout");
});

element.btn_database.addEventListener("click", () => {
    element.database_dialog.showModal();
});

element.btn_close_dialog.addEventListener("click", () => {
    element.database_dialog.close();
});

// FUNCTIONS

export function populate_books_grid(books_promise) {
    books_promise.then((books) => {
        if (books.length == 0) {
            element.hint_no_matches.style.display = "inline";
            return;
        };
        element.hint_no_matches.style.display = "none";
        books.forEach((book) => {
            if ("content" in document.createElement("template")) add_to_grid(book);
            else console.log("Error while populating accounts grid: The HTML template element is not supported by the browser.");
        });
    });
}

export function add_to_grid(book) {
    const book_entry_template =  document.querySelector("#book_entry_template");
    const template_clone = book_entry_template.content.cloneNode(true);

    const cover = template_clone.querySelector(".cover");
    const book_title = template_clone.querySelector(".book_title");
    const authors = template_clone.querySelector(".authors");
    const edition = template_clone.querySelector(".edition");
    const copyright_year = template_clone.querySelector(".copyright_year");
    const book_uid = template_clone.querySelector(".book_uid");
    const page_count = template_clone.querySelector(".page_count");

    cover.src = get_blob_url(book.cover_img);
    book_title.textContent = book.title;
    authors.textContent = book.authors;
    edition.textContent = book.edition + " ed.";
    copyright_year.textContent = book.copyright_year;
    book_uid.textContent = book.uid;
    page_count.textContent = book.page_count + " pages";
    element.book_grid.appendChild(template_clone);

    animate_overflown_text_of(book_title);
    animate_overflown_text_of(authors);
}

/**
*   If an element's text does not fit in the layout, the function makes
*   it oscillate left-right so that all the text is readable.
*   @param { Node } element The element whose text has overflown
*/
function animate_overflown_text_of(element) {
    element.animate(
        [
            { transform: 'translateX(0)' },
            { transform: 'translateX(0)' },
            { transform: 'translateX(' + (element.offsetWidth - element.scrollWidth) + 'px)'},
            { transform: 'translateX(' + (element.offsetWidth - element.scrollWidth) + 'px)'},
            { transform: 'translateX(0)' }, // return smoothly to original position
        ],
        // duration is variable, as is the element's width
        // duration is given as a function of width over a constant (arbitrary) speed; in this case 0.04
        { duration: element.scrollWidth / 0.04, iterations: Infinity }
    );
}

function get_blob_url(blob_img) {
    let binary_data = [];
    binary_data.push(blob_img);
    let blob = new Blob(binary_data);
    return window.URL.createObjectURL(blob);
}
