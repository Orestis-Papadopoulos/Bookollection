
export const is_exact_copyright_year = /^[1-2](?:0|7|8|9)\d{2}$/;
export const is_at_most_copyright_year = /^\.{2}[1-2](?:0|7|8|9)\d{2}$/;
export const is_at_least_copyright_year = /^[1-2](?:0|7|8|9)\d{2}\.{2}$/;
export const is_copyright_year_in_range = /^[1-2](?:0|7|8|9)\d{2}\.{2}[1-2](?:0|7|8|9)\d{2}$/;

export const is_exact_page_count = /^\d{3,4}$/;
export const is_at_most_page_count = /^\.{2}\d{3,4}$/;
export const is_at_least_page_count = /^\d{3,4}\.{2}$/;
export const is_page_count_in_range = /^\d{3,4}\.{2}\d{3,4}$/;

//const example = "..100";
//console.log(example.match(is_at_most_page_count));
