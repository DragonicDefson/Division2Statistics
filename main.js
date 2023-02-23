const { app, BrowserWindow } = require('electron')
const cfg = require('./config.json')
const { ElectronBlocker } = require('@cliqz/adblocker-electron')
const fetch = require('cross-fetch')
const fs = require('fs')
const http = require('http')

app.disableHardwareAcceleration()

let win = undefined

const createWindow = () => {
  let iconExt = undefined
  if (process.platform !== 'darwin') {
    iconExt = 'icon.ico'
  }
  win = new BrowserWindow({
    show: false,
    icon: `${process.resourcesPath}/appicons/${iconExt}`,
    webPreferences: {
      nodeIntegration: false
    }
  })
  win.maximize()
  const session = win.webContents.session
  if (cfg.application.debug_enabled) {
    loadApp(win)
    fileLoader(session)
    win.webContents.openDevTools()
  } else {
    loadApp(win)
    fileLoader(session)
  }
}

const fileLoader = (session) => {
  const webserver_port = cfg.application.webserver_port
  http.createServer((request, response) => {
    const pathName = request.url
    fs.readFile(`${process.resourcesPath}/adlists${pathName}`, (exception, data) => {
      if (exception) { return } else {
        response.end(data)
      }
    })
  }).listen(webserver_port)
  ElectronBlocker.fromLists(fetch, [
    `http://localhost:${webserver_port}/easylist.txt`,
    `http://localhost:${webserver_port}/ultimate-ad-filter.txt`
  ]).then((blocker) => {
    if (cfg.application.adblock_enabled) {
      blocker.enableBlockingInSession(session)
    } else {
      blocker.disableBlockingInSession(session)
    }
  })
}

const loadApp = (win) => {
  const username = cfg.application.username
  win.loadURL(`${cfg.application.url}${username}/overview`).then(() => {
    win.setTitle(`${username} - Division 2 - statistics`)
  })
  win.show()
}

app.whenReady().then(() => {
  if (require('electron-squirrel-startup')) { app.quit() }
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) { createWindow() }
  })
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') { app.quit() }
  })
})