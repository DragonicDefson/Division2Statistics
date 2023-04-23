const { app, BrowserWindow, screen } = require('electron')
const configuration = require('./config.json').application
const { ElectronBlocker } = require('@cliqz/adblocker-electron')
const fetch = require('cross-fetch')
const fs = require('fs')
const http = require('http')
const resources = process.resourcesPath
const path = require('path')

let extension, x, y = undefined

const config = {
  url: configuration.url,
  username: configuration.username,
  debug: configuration.debug,
  port: configuration.port,
  hostname: configuration.hostname,
  adblock: configuration.adblock,
  hardware_acceleration: configuration.hardware_acceleration,
  monitor: configuration.monitor.value
}

if (!config.hardware_acceleration) { app.disableHardwareAcceleration() }

const createWindow = () => {
  const display = {
    all: screen.getAllDisplays(),
    primary: screen.getPrimaryDisplay()
  }
  switch (process.platform) {
    case 'linux': extension = 'icon.png'; break;
    case 'darwin': extension = 'icon.icns'; break;
    default: extension = 'icon.ico'; break;
  }
  const query = display.all.find((display) => {
    return display.bounds.x !== 0 || display.bounds.y !== 0
  })
  if (config.monitor === 0) {
    x = display.primary.bounds.x
    y = display.primary.bounds.y
  } else {
    x = query.bounds.x + 50
    y = query.bounds.y + 50
  }
  config_enum = {
    show: false,
    icon: "./assets/icon.png",
    x: x,
    y: y,
    webPreferences: {
      nodeIntegration: false
    }
  }
  window = new BrowserWindow(config_enum)
  const session = window.webContents.session;
  if (config.debug) { window.webContents.openDevTools() }
  loadApp(window); fileLoader(session); winSettings(window)
}

const winSettings = (window) => {
  window.setMenuBarVisibility(false)
  window.maximize()
  window.show()
}

const fileLoader = (session) => {
  const port = config.port; const hostname = config.hostname
  http.createServer((request, response) => {
    const filepath = path.join(resources, `/adlists${request.url}`)
    fs.readFile(filepath, (exception, data) => {
      if (exception) { return } else { response.end(data) }
    })
  }).listen(port, hostname)
  ElectronBlocker.fromLists(fetch, [
    `http://${hostname}:${port}/easylist.txt`,
    `http://${hostname}:${port}/ultimate-ad-filter.txt`
  ]).then((blocker) => {
    switch (config.adblock) {
      case true: blocker.enableBlockingInSession(session); break;
      default: blocker.disableBlockingInSession(session); break;
    }
  })
}

const loadApp = (window) => {
  const username = config.username
  const profile = `${config.url}${username}/overview`
  window.loadURL(profile).then(() => {
    window.setTitle(`${username} - The Division 2 - statistics`)
  })
}

app.whenReady().then(() => {
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin' || require('electron-squirrel-startup')) { app.quit() }
  })
  createWindow()
})