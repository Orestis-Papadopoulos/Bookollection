
const { app, BrowserWindow, ipcMain, dialog, Notification } = require('electron')
const path = require('node:path');
const sqlite3 = require('sqlite3');

const SQL_CHECK_IF_BOOKS_TABLE = "SELECT name FROM sqlite_master WHERE type='table' AND name='Books'";
const SQL_GET_BOOKS_COLUMNS = "PRAGMA table_info(Books)";

// todo: allow the user to load a database file and choose to make it the default file when the app opens
// store the default file's path in a txt file and read it

var database_file_path;
var db;

let tmp_filter_query_args = [];

var mainWindow; // to access in 'load_database'
const createWindow = () => {
    // const mainWindow = new BrowserWindow({
    mainWindow = new BrowserWindow({
        show: false, // see 'ready-to-show'
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })

    mainWindow.maximize();
//    mainWindow.openDevTools();
    mainWindow.setMenu(null);
    mainWindow.loadFile('index.html');

    // use this to prevent black screen on load
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });
}

app.whenReady().then(() => {

    // todo: if there is a default database load books

    ipcMain.on('load_database', () => {
        dialog.showOpenDialog({
            title: "Bookollection - Load a Database",
            buttonLabel: "Load",
            properties: ['openFile'],
            filters: [{ name: "SQLite", extensions: ["db"] }]
        }).then(selected_file => {
            database_file_path = selected_file.filePaths[0];
            db = new sqlite3.Database(database_file_path);
            populate_grid();

            // todo: by default the selected path is set as the default database (i.e., save the path to a file)
        });
    });

    ipcMain.handle('get_all_books_channel', async (event, sqlQuery) => {
        return new Promise(res => {
            db.all(sqlQuery, (err, rows) => {
                res(rows);
            });
        });
    });

    //

    ipcMain.on('get_filter_query_args_channel', (event, filter_query_args) => {
        tmp_filter_query_args = filter_query_args;
    });

    ipcMain.handle('get_filtered_books_channel', async (event, sqlQuery) => {
        return new Promise(res => {
            db.all(sqlQuery, tmp_filter_query_args, (err, rows) => {
                res(rows);
            });
        });
    });

    //

  createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

function database_has_table_Books() {
    return new Promise(res => {
       db.all(SQL_CHECK_IF_BOOKS_TABLE, (err, rows) => {
            res(rows.length != 0 ? true : false);
            if (rows.length == 0) notify("Incorrect Database Schema", "The database you tried to load does not have a 'Books' table.");
        });
    });
}

function table_Books_has_correct_columns() {
    const correct_column_names = ["title", "authors", "copyright_year", "edition", "page_count", "subject", "uid", "cover_img"];
    return new Promise(res => {
        db.all(SQL_GET_BOOKS_COLUMNS, (err, rows) => {
            for (let i = 0; i < rows.length; i++) {
                if (rows[i].name == correct_column_names[i]) continue;
                notify("Incorrect Database Schema", "The database you tried to load does not have the correct attributes (columns).");
                res(false);
                break;
            }
            res(true);
        });
    });
}

async function populate_grid() {
    let database_has_correct_format = await database_has_table_Books() && await table_Books_has_correct_columns();
    if (!database_has_correct_format) return;
    mainWindow.webContents.send('populate_grid', null);
    notify("Database Successfully Loaded", "You are viewing " + database_file_path.split("\\").slice(-1));
}

function notify(title, body) {
    new Notification({
        title: title,
        body: body
    }).show();
}
