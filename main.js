const { app, BrowserWindow, ipcMain, dialog, Notification } = require('electron')
const path = require('node:path');
const sqlite3 = require('sqlite3');
const fs = require('fs');

const SQL_CHECK_IF_BOOKS_TABLE = "SELECT name FROM sqlite_master WHERE type='table' AND name='Books'";
const SQL_GET_BOOKS_COLUMNS = "PRAGMA table_info(Books)";

var db;
var settings = require('./settings.json');
var database_file_path = settings.last_viewed_file;

let tmp_filter_query_args = [];

if (process.platform === 'win32') app.setAppUserModelId(app.name); // to display app name in Notification

var mainWindow;
const createWindow = () => {
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

    mainWindow.once('ready-to-show', () => { // prevent black screen on load
        if (settings.load_last_viewed_file_on_start && settings.last_viewed_file != "") {
            db = new sqlite3.Database(database_file_path);
            populate_grid();
        } else mainWindow.webContents.send('show_database_load_layout', null);
        mainWindow.show();
        mainWindow.webContents.send('set_load_last_viewed_file_checkbox', settings.load_last_viewed_file_on_start);
    });
}

app.whenReady().then(() => {

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
        });
    });

    ipcMain.handle('get_all_books_channel', async (event, sqlQuery) => {
        return new Promise(res => {
            db.all(sqlQuery, (err, rows) => {
                res(rows);
            });
        });
    });

    ipcMain.on('get_filter_query_args_channel', (event, filter_query_args) => {
        tmp_filter_query_args = filter_query_args;
    });

    ipcMain.on('set_load_last_viewed_file_setting_channel', (event, value) => {
        settings.load_last_viewed_file_on_start = value;
        fs.writeFileSync('./settings.json', JSON.stringify(settings, null, 2));
    });

    ipcMain.handle('get_filtered_books_channel', async (event, sqlQuery) => {
        return new Promise(res => {
            db.all(sqlQuery, tmp_filter_query_args, (err, rows) => {
                res(rows);
            });
        });
    });

    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

async function populate_grid() {
    let database_has_correct_format = await database_has_table_Books() && await table_Books_has_correct_columns();
    if (!database_has_correct_format) return;
    mainWindow.webContents.send('populate_grid', database_file_path);
    notify("Database Successfully Loaded", "You are viewing: " + database_file_path.split("\\").slice(-1));
    save_database_path();
}

function database_has_table_Books() {
    return new Promise(res => {
       db.all(SQL_CHECK_IF_BOOKS_TABLE, (err, rows) => {
            res(rows.length == 0 ? false : true);
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

function save_database_path() {
    settings.last_viewed_file = database_file_path;
    fs.writeFileSync('./settings.json', JSON.stringify(settings, null, 2));
}

function notify(title, body) {
    new Notification({
        title: title,
        body: body
    }).show();
}
