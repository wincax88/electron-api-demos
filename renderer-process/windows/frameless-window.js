const BrowserWindow = require('electron').remote.BrowserWindow
const newWindowBtn = document.getElementById('frameless-window')
const ipc = require('electron').ipcRenderer
const electron = require('electron')
const desktopCapturer = electron.desktopCapturer
const electronScreen = electron.screen
const fs = require('fs')
const os = require('os')
const path = require('path')
const {clipboard} = require('electron')
const nativeImage = require('electron').nativeImage

newWindowBtn.addEventListener('click', function (event) {
  // minimize main window
  ipc.sendSync('minimize-main-window', window.devicePixelRatio)

  const thumbSize = determineScreenShotSize()
  let options = { types: ['screen'], thumbnailSize: thumbSize }
  let screenshotPath;
  desktopCapturer.getSources(options, function (error, sources) {
    if (error) return console.log(error)

    sources.forEach(function (source) {
      if (source.name === 'Entire screen' || source.name === 'Screen 1') {
        screenshotPath = path.join(os.tmpdir(), 'screenshot.png')

        fs.writeFile(screenshotPath, source.thumbnail.toPng(), function (error) {
          if (error) return console.log(error)
          console.log(screenshotPath);
          createWindow(screenshotPath)
        })
      }
    })
  })
})

function createWindow (screenshotPath) {
  const modalPath = path.join('file://', __dirname, '../../sections/windows/modal.html?image=',screenshotPath)
  let win = new BrowserWindow({ frame: false,  fullscreen : true, transparent: true})
  win.on('close', function (event) {
    console.log(event);
    //window.cropBoxData
    // restore main window
    ipc.send('restore-main-window')
     win = null

     var dataURL = clipboard.readText()
     //console.log(dataURL);
     var image = nativeImage.createFromDataURL(dataURL)
     clipboard.writeImage(image)

   })
   /*
   win.on('show', function () {
     console.log('modal show');
     //const style = `{"src":"url('file://${screenshotPath}')"}`
     const style = `{"src":"file://${screenshotPath}"}`
     console.log(style);
     //const screenshot = document.getElementById('screenshot')
     $('screenshot').css(style);
   })*/

  win.loadURL(modalPath)
  win.show()
}

function determineScreenShotSize () {
  const screenSize = electronScreen.getPrimaryDisplay().workAreaSize
  const maxDimension = Math.max(screenSize.width, screenSize.height)
  return {
    width: maxDimension * window.devicePixelRatio,
    height: maxDimension * window.devicePixelRatio
  }
}
