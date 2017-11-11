function resizeImage(file, maxSize, fillCanvas) {
  const promise = new Promise((resolve, reject) => {
    wx.getImageInfo({
      src: file,
      success: function(info) {
        const max_size = maxSize;
        let width = info.width;
        let height = info.height;

        if (width > height) {
          if (width > max_size) {
            height *= max_size / width;
            width = max_size;
          }
        } else {
          if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }
        }

        if (fillCanvas && typeof fillCanvas === 'function') {
          fillCanvas(width, height);
        }

        const ctx = wx.createCanvasContext('imageResize');
        ctx.drawImage(file, 0, 0, width, height);
        ctx.draw();

        wx.canvasToTempFilePath({
          canvasId: 'imageResize',
          success: function(resizedFile) {
            resolve(resizedFile);
          }
        })
      }
    })
  })
  return promise;
}

function fillAspect(imagePath) {
  return new Promise((resolve, reject) => {
    wx.getImageInfo({
      src: imagePath,
      success: function(info) {
        resolve(info.width > info.height ? 'fill-vertical' : 'fill-horizontal');
      }
    })
  });
}

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    wx.downloadFile({
      url,
      success: function(res) {
        resolve(res.tempFilePath);
      },
      fail: function() {
        reject();
      }
    })
  })
}

export default {
  resizeImage,
  fillAspect,
  downloadImage,
}