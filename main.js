const { app, BrowserWindow } = require('electron')
const config = require('./config.json')
const { ElectronBlocker } = require('@cliqz/adblocker-electron')
const fetch = require('cross-fetch')
const fs = require('fs')
const http = require('http')
const resources = process.resourcesPath

app.disableHardwareAcceleration()

const createWindow = () => {
  let iconExt = undefined; let platform = process.platform
  switch (platform) {
    case 'linux': iconExt = 'icon.png'; break;
    case 'darwin': iconExt = 'icon.icns'; break;
    default: iconExt = 'icon.ico'; break;
  }
  const win = new BrowserWindow({
    show: false,
    icon: `${resources}/appicons/${iconExt}`,
    webPreferences: {
      nodeIntegration: false
    }
  })
  const session = win.webContents.session; win.maximize()
  switch(config.application.debug_enabled) {
    case true:
      loadApp(win)
      fileLoader(session)
      win.webContents.openDevTools()
    break;
    default:
      loadApp(win)
      fileLoader(session)
    break;
  }
}

const fileLoader = (session) => {
  const webserver_port = config.application.webserver_port
  http.createServer((request, response) => {
    let pathname = request.url
    fs.readFile(`${resources}/adlists${pathname}`, (exception, data) => {
      if (exception) { return; } else { response.end(data) }
    })
  }).listen(webserver_port, 'localhost')
  ElectronBlocker.fromLists(fetch, [
    `http://localhost:${webserver_port}/easylist.txt`,
    `http://localhost:${webserver_port}/ultimate-ad-filter.txt`
  ]).then((blocker) => {
    switch (config.application.adblock_enabled) {
      case true: blocker.enableBlockingInSession(session); break;
      default: blocker.disableBlockingInSession(session); break;
    }
  })
}

const loadApp = (win) => {
  const username = config.application.username
  win.loadURL(`${config.application.url}${username}/overview`).then(() => {
    win.setTitle(`${username} - The Division 2 - statistics`)
  })
  win.show()
}

app.whenReady().then(() => {
  if (require('electron-squirrel-startup')) { app.quit() } else { createWindow() }
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') { app.quit() }
  })
})