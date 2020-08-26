import {app, BrowserWindow, BrowserView} from 'electron';
import {Menu, MenuItem, dialog, ipcMain} from 'electron';
import menuTemplate from './menuTemplate.js'
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    app.quit();
}

let mainWindow;
let safeExit = false;
const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
        },
    });
    mainWindow.loadURL(`file://${__dirname}/index.html`);
    // 打开调试工具（F12)
    mainWindow.webContents.openDevTools();


    // ----------------------------------------------------------
    // 增加主菜单
    const menu = Menu.buildFromTemplate(menuTemplate);
    menu.items[0].submenu.append(new MenuItem({
        label: '新建',
        click() {
            mainWindow.webContents.send('action', 'new');
        },
        accelerator: 'CmdOrCtrl+N'
    }));
    menu.items[0].submenu.append(new MenuItem({
        label: '打开',
        click() {
            mainWindow.webContents.send('action', 'open');
        },
        accelerator: 'CmdOrCtrl+O'
    }));
    menu.items[0].submenu.append(new MenuItem({
        label: '保存',
        click() {
            mainWindow.webContents.send('action', 'save');
        },
        accelerator: 'CmdOrCtrl+S'
    }));
    menu.items[0].submenu.append(new MenuItem({
        label: '另存为',
        click() {
            mainWindow.webContents.send('action', 'other');
        },
        accelerator: 'CmdOrCtrl+A'
    }));
    menu.items[0].submenu.append(new MenuItem({
        type: 'separator'  // 分界线
    }));
    menu.items[0].submenu.append(new MenuItem({
        label: '退出',
        click() {
            mainWindow.webContents.send('action', 'exiting');
        },
        accelerator: 'CmdOrCtrl+X'
    }));

    Menu.setApplicationMenu(menu)

    mainWindow.on('close', e => {
        if (!safeExit) {
            e.preventDefault();
            mainWindow.webContents.send('action', 'exiting');
        }
    })
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});


//监听与渲染进程的通信
ipcMain.on('reqaction', (event, arg) => {
    switch(arg){
        case 'exit':
            safeExit = true;
            app.quit(); // 退出程序
            break;
    }
});