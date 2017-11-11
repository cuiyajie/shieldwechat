import config from '../utils/config';
import { identityErrorMap, hackErrorMap } from '../utils/constant';
import { MessageBox } from '../utils/util';

const SelfieMaxSize = 1280;

function uploadIdCard(options) {
  options = options || {};
  return new Promise((resolve, reject) => {
    wx.chooseImage({
      count: 1,
      sizeType: [ 'compressed' ],
      sourceType: [ 'album', 'camera' ],
      success: (res) => {
        var tempFilePaths = res.tempFilePaths;
        if (tempFilePaths.length > 0) {
          options.beforeLoading && options.beforeLoading();
          wx.uploadFile({
            url: config.OCRIdcardApi(),
            filePath: tempFilePaths[0],
            name: 'file',
            formData: {
              'side': 'front',
              'auto_rotate': true
            },
            success: function(res) {
              res = res.data.json();
              if (res.status === 'OK') {
                console.log('success:', res);
                res.imagePath = tempFilePaths[0];
                if (res.validity && res.validity.name &&
                    res.validity.sex && res.validity.birthday && 
                    res.validity.address && res.validity.number) {
                  resolve(res);
                } else {
                  MessageBox.error('上传的图片未检测身份证正面');
                  reject();
                }
              } else {
                console.log('fail:', res);
                const errorMsg = identityErrorMap[res.status] || '服务器错误';
                MessageBox.error(errorMsg);
                reject(res);
              }
            },
            fail: function(err) {
              console.log(err);
              reject(err);
            }
          })
        }
      }
    })
  })
}

function uploadSelfie(options) {
  options = options || {};
  let sourceType;
  if (options.sourceType == null) {
    sourceType = [ 'album', 'camera' ];
  } else {
    sourceType = options.sourceType ? [ 'camera' ] : [ 'album' ];
  }
  return new Promise((resolve, reject) => {
    wx.chooseImage({
      count: 1,
      sizeType: [ 'compressed' ],
      sourceType,
      success: (res) => {
        var tempFilePaths = res.tempFilePaths;
        if (tempFilePaths.length > 0) {
          options.beforeLoading && options.beforeLoading();
          wx.uploadFile({
            url: config.selfieHackApi(),
            filePath: tempFilePaths[0],
            name: 'file',
            success: function(res) {
              res = res.data.json();
              if (res.status === 'OK') {
                console.log('success:', res);
                res.imagePath = tempFilePaths[0];
                resolve(res);
              } else {
                console.log('fail:', res);
                const errorMsg = hackErrorMap[res.status] || '上传失败，请重试！';
                MessageBox.error(errorMsg);
                reject(res);
              }
            },
            fail: function(err) {
              console.log(err);
              reject(err);
            }
          })
        }
      }
    })
  });
}

export default {
  uploadIdCard,
  uploadSelfie
}