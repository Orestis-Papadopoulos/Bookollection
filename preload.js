
const { contextBridge, ipcRenderer } = require('electron')

// if an exact copyright_year (e.g., 2020) is given, do: BETWEEN 2020 AND 2020
// if no year is given, do: BETWEEN 1700 AND 3000; to cover all cases
// similarly for page_count
let filter_query =
"SELECT * FROM Books " +
"WHERE subject IN (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
    "AND copyright_year BETWEEN ? AND ? " +
    "AND page_count BETWEEN ? AND ? " +
    "AND (title LIKE ? " +
        "OR authors LIKE ? " +
        "OR edition LIKE ? " +
        "OR uid LIKE ?)";

contextBridge.exposeInMainWorld('database_api', {
    get_all_books: () => ipcRenderer.invoke('get_all_books_channel', "SELECT * FROM Books"),

    get_filter_query_args: (filter_query_args) => ipcRenderer.send('get_filter_query_args_channel', filter_query_args),
    get_filtered_books: () => ipcRenderer.invoke('get_filtered_books_channel', filter_query),

    load_database: () => ipcRenderer.send('load_database'),
    on_database_load: (callback) => ipcRenderer.on('populate_grid', (_event, value) => callback(value))
});
