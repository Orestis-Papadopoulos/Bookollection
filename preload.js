
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
    get_filtered_books: () => ipcRenderer.invoke('get_filtered_books_channel', filter_query),

    get_filter_query_args: (filter_query_args) => ipcRenderer.send('get_filter_query_args_channel', filter_query_args),
    load_database: () => ipcRenderer.send('load_database'),
    set_load_last_viewed_file_setting: (value) => ipcRenderer.send('set_load_last_viewed_file_setting_channel', value),

    on_database_load: (callback) => ipcRenderer.on('populate_grid', (_event, value) => callback(value)),
    on_no_database_to_load: (callback) => ipcRenderer.on('show_database_load_layout', (_event, value) => callback(value)),
    on_settings_read: (callback) => ipcRenderer.on('set_load_last_viewed_file_checkbox', (_event, value) => callback(value)),
});
