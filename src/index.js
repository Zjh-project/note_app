import { ipcRenderer, remote } from 'electron';
const { Menu, MenuItem, dialog } = remote;

const txtEditor = document.getElementById('noteArea');
let currentFile = null;
let isSave = true;

txtEditor.oninput = () => {
  isSave && (document.title += ' *');
  isSave = false;
};

// 右键菜单  start ---------------------
const rightTemplate=[
    { label: '撤销', role: 'undo' },       //Undo菜单项
    { label: '重做', role: 'redo' },       //Redo菜单项
    { type: 'separator' },  //分隔线
    { label: '剪切', role: 'cut' },        //Cut菜单项
    { label: '复制', role: 'copy' },       //Copy菜单项
    { label: '粘贴', role: 'paste' },      //Paste菜单项
    { label: '删除', role: 'delete' },     //Delete菜单项
    { type: 'separator' },  //分隔线
    { label: '全选', role: 'selectall' }   //Select All菜单项
];

const rightMenu = Menu.buildFromTemplate(rightTemplate);
window.addEventListener('contextmenu', e => {
    e.preventDefault();
    rightMenu.popup({
        window: remote.getCurrentWindow()
    })
});
// 右键菜单 end  ---------------------



// 主菜单及其功能 start ---------------------
ipcRenderer.on('action', (event, arg) => {
    const map = new Map([
        ['new', newFile],
        ['open', openFile],
        ['save', saveFile],
        ['other', saveOtherFile],
        ['exiting', exitFile]
    ]);
    let action = map.get(arg);
    action.call(this)
});
function newFile() {
    document.title = '新建文档.txt';
    txtEditor.value = '';
    currentFile = null;
    isSave = true;
}
function openFile() {
    const files = remote.dialog.showOpenDialog(remote.getCurrentWindow(),
        {
            filters: [
                {
                    name: 'Text Files', extensions: ['txt', 'js', 'html', 'md'],
                },
                {
                    name: 'All Files', extensions: ['*']
                }
            ],
            properties: ['openFile']
        });
    if (files) {
        files.then(res => {
            if (res.canceled) return;
            currentFile = res.filePaths[0];
            if (currentFile) {
                txtEditor.value = readText(currentFile);
                document.title = currentFile.split('\\').pop();
                isSave = true;
            }
        })
    }
}
async function saveFile() {
    if (currentFile) {
        writeText(currentFile, txtEditor.value);
        document.title = currentFile.split('\\').pop();
        isSave = true;
        return;
    }
    await saveOtherFile();
}
function saveOtherFile() {
    return new Promise(resolve => {
        // defaultPath 为默认路径，设置其是为了带出默认文件名
        const getSaveFile = remote.dialog.showSaveDialog(
            {
                defaultPath: `C://Users/Default/Desktop/${document.title.replace(' *', '')}`,
                filters: [
                    {
                        name: 'Text Files', extensions: ['txt', 'js', 'html', 'md'],
                    },
                    {
                        name: 'All Files', extensions: ['*']
                    }
                ]
            });
        getSaveFile.then(res => {
            if (res.canceled) return;
            currentFile = res.filePath;
            if (currentFile) {
                writeText(currentFile, txtEditor.value);
                document.title = currentFile.split('\\').pop();
                isSave = true;
                resolve();
            }
        });
    })
}
async function exitFile() {
    if (!isSave) {
        let index = await modal('文件未保存', '是否保存当前更改？');
        switch (index) {
            case 0:
                await saveFile();
                ipcRenderer.sendSync('reqaction', 'exit');
                break;
            case 1:
                ipcRenderer.sendSync('reqaction', 'exit');
                break;
            default:
                break;
        }
        return;
    }
    ipcRenderer.sendSync('reqaction', 'exit');
}
function readText (file) {
    const fs = require('fs');
    return fs.readFileSync(file, 'utf8');
}
function writeText (file, value) {
    const fs = require('fs');
    fs.writeFileSync(file, value);
}
function modal(title, message, func, type = 'info', btns) {
    return new Promise(resolve => {
        let buttons = ['保存', '不保存', '取消'];
        if ((typeof btns === 'object') && (btns instanceof Array)) {
            buttons = btns;
        }
        remote.dialog.showMessageBox({
            type,
            title,
            message,
            buttons,
            noLink: true,
        }).then(data => {
            resolve(data.response)
        })
    })
}

// 主菜单及其功能  end --------------------------
