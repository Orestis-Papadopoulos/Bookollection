
const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('node:path');
const sqlite3 = require('sqlite3');

// todo: allow the user to load a database file and choose to make it the default file when the app opens
// store the default file's path in a txt file and read it

var database_file_path = "";
var db;

let tmp_filter_query_args = [];

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        show: false, // see 'ready-to-show'
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })

    mainWindow.maximize();
    mainWindow.openDevTools();
    mainWindow.setMenu(null);
    mainWindow.loadFile('index.html');

    // use this to prevent black screen on load
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });
}

app.whenReady().then(() => {

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

    ipcMain.on('load_database', () => {
        dialog.showOpenDialog({
            title: "Bookollection - Load a Database",
            buttonLabel: "Load",
            properties: ['openFile'],
            filters: [{ name: "SQLite", extensions: ["db"] }]
        }).then(selected_file => {
            database_file_path = selected_file.filePaths[0];
            // todo: by default the selected path is set as the default database (i.e., save the path to a file)

            db = new sqlite3.Database(database_file_path);
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
