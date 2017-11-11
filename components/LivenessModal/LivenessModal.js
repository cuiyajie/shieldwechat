import { livenessAssets, silentLivenessAsset, livenessLimit, livenessErrorMap, hackErrorMap, HACK_SCORE_MAX } from '../../utils/constant'; 
import { MessageBox, omit } from '../../utils/util';
import imageUtils from '../../utils/image';
import config from '../../utils/config';

let pageData = {
  '__livenessData.checking': false,
  '__livenessData.action': null,
  '__livenessData.silent': false
};

let pageFunc = {
  __lv_stopChecking() {
    this.setData({ '__livenessData.checking': false });
  },
  
  __lv_setAction(silent, actionIndex) {
    if (silent) {
      this.setData({ 
        '__livenessData.silent': true,
        '__livenessData.action': silentLivenessAsset 
      })
    } else if (actionIndex != null && livenessAssets[actionIndex]) {
      this.setData({ '__livenessData.action': livenessAssets[actionIndex] });
    }
  },

  __lv_startRecord() {
    var that = this;
    wx.chooseVideo({
      sourceType: ['album', 'camera'],
      maxDuration: livenessLimit.duration,
      camera: 'front',
      success(video) {
        if (video.tempFilePath) {
         that.__lv_beforeRequest && that.__lv_beforeRequest();

         let requestApi;
         let requestFileName;
         let requestFormData;
         if (that.data.__livenessData.silent) {
           requestApi = config.SilentLivenessApi();
           requestFileName = 'video_file';
           requestFormData = {
             'return_image': false
           };
         } else {
           requestApi = config.LivenessApi();
           requestFileName = 'liveness_data_file';
           requestFormData = {
              motions: [that.data.__livenessData.action.key].join(' ')
           };
         }

          wx.uploadFile({
            url: requestApi,
            filePath: video.tempFilePath,
            name: requestFileName,
            formData: requestFormData,
            success(res) {
              console.log(res);
              if (res.statusCode === 413) {
                that.__lv_afterRequest && that.__lv_afterRequest();
                MessageBox.error('上传视频太大，请重试');
              }
              res = res.data.json();
              if (res.status === 'RPC_TIMEOUT') {
                that.__lv_afterRequest && that.__lv_afterRequest();
                MessageBox.error('请求超时，稍后请重试！');
              } else if (res.status === 'OK') {
                let liveness;
                if (that.data.__livenessData.silent) {
                  liveness = omit(res, 'status', 'request_id');
                } else {
                  liveness = Object.assign({}, res.result);
                }
                if (liveness.feature_image_id) {
                  imageUtils.downloadImage(config.selfieShot(liveness.feature_image_id)).then((path) => {
                    liveness.imagePath = path;
                    liveness.isLiveness = true;
                    that.__lv_hackCheck(liveness);
                  }, () => {
                    that.__lv_afterRequest && that.__lv_afterRequest();
                    MessageBox.error('加载活体检测图片失败！');
                  });
                } else {
                  that.__lv_afterRequest && that.__lv_afterRequest();
                  MessageBox.error('上传的视频未检测出人脸！');
                }
              } else if (livenessErrorMap[res.status]) {
                MessageBox.error(livenessErrorMap[res.status]);
              }
            },
            fail(err) {
              that.__lv_afterRequest && that.__lv_afterRequest();
              console.log('liveness check error:', err);
              MessageBox.error('请求服务器出错，请重试！');
            }
          })
        }
      },
      fail() {
        MessageBox.error('录制视频失败！');
      }
    })
  },

  __lv_hackCheck(liveness) {
    var that = this;
    wx.request({
      url: config.selfieHackApi(),
      data: {
        image_id: liveness.feature_image_id
      },
      method: 'POST',
      success(hack) {
        hack = hack.data;
        that.__lv_afterRequest && that.__lv_afterRequest();
        if (hack.status === 'OK') {
          liveness.hackPassed = (hack.score <= HACK_SCORE_MAX);
          liveness.hackScore = hack.score;
          liveness.uuid = that.data.__livenessData.uuid;
          that.__lv_stopChecking();
          that.__lv_onPassed && that.__lv_onPassed(liveness);
        } else {
          MessageBox.error(hackErrorMap[hack.status]);
        }
      },
      fail() {
        that.__lv_afterRequest && that.__lv_afterRequest();
        MessageBox.error('请求服务器出错，请重试！');
      }
    })
  }
};

let wrappedFunc = {
  show(config = {}, context) {
    context = context || this;
    context.setData({ '__livenessData.checking': true });
    context.__lv_setAction(config.silent, config.action);
    if (config.uuid) {
      context.setData({ '__livenessData.uuid': config.uuid });
    }
  }
};

export default function LivenessModal(context, options) {
  //attach component data and function to main page
  if (pageData) {
    context.setData(pageData)
  }
  
  Object.assign(context, pageFunc);
  
  if (options) {
    for(var i in options) {
      if (options.hasOwnProperty(i)) {
        if (typeof options[i] === 'function') {
          context['__lv_' + i] = options[i].bind(context);
        } else {
          context.setData({ ['__livenessData.' + i]: options[i] });
        }
      }
    }
  }
  
  for(var func in wrappedFunc) {
    if (wrappedFunc.hasOwnProperty(func) && typeof wrappedFunc[func] === 'function') {
      wrappedFunc[func] = wrappedFunc[func].bind(context);
    }
  }
  Object.assign(this, wrappedFunc)

  return this;
}