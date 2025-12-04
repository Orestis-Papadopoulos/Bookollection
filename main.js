
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path');
const sqlite3 = require('sqlite3');

// todo: allow the user to load a database file and choose to make it the default file when the app opens
// store the default file's path in a txt file and read it
const db = new sqlite3.Database('bookollection.db');

let tmp_filter_query_args = [];

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })

    mainWindow.maximize();
    mainWindow.openDevTools();
    mainWindow.setMenu(null);
    mainWindow.loadFile('index.html')
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

    //

  createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})
