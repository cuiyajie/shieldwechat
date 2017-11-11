import upload from '../../components/UploadImage';
import config from '../../utils/config';
import imageUtils from '../../utils/image';
import { MessageBox } from '../../utils/util';
import { HACK_SCORE_MAX, livenessAssets, idNumberErrorMap, identityErrorMap } from '../../utils/constant';

const app = getApp();

const pageData = {
  curr: 'image',
  loading: false,
  blurred: false,
  comparing: false,
  idcardImageUrl: '',
  idcardImageId: '',
  idcardImageClass: 'fill-horizontal',
  idcardImageResult: null,
  idcardImageResultClass: 'fill-horizontal',
  imageCanCompare: false,
  idcardText: {
    name: '',
    idNumber: ''
  },
  idcardTextClass: 'fill-horizontal',
  idcardTextResult: null,
  idcardTextResultClass: 'fill-horizontal',
  textCanCompare: false
};

const pageFuncs = {
  
  /**
   * specify the loading modal show or hide
   * @param {*} val Boolean, true is show and false is hidden
   */
  loading(val) {
    this.setData({
      loading: val,
      blurred: val
    });
  },

  /**
   * show or hide comparing page
   */
  comparing(val) {
    this.setData({ comparing: val });
  }
};

const pageEvents = {

  /**
   * load event
   * create instance livenessModal
   */
  onLoad() {
    this.livenessModal = new app.LivenessModal(this, {
      beforeRequest() {
        this.loading(true);
      },

      afterRequest() {
        this.loading(false);
      },

      onPassed(liveness) {
        console.log('liveness data:', liveness);
        if (liveness.uuid === 'idcardImage') {
          this.setData({ idcardImageResult: liveness });
          this.canCompare();
          imageUtils.fillAspect(liveness.imagePath).then((className) => {
            this.setData({ idcardImageResultClass: className })
          })
        } else if (liveness.uuid === 'idcardText') {
          this.setData({ idcardTextResult: liveness });
          this.canCompare();
          imageUtils.fillAspect(liveness.imagePath).then((className) => {
            this.setData({ idcardTextResultClass: className })
          })
        }
      }
    })
  },

  stopLoading() {
    this.loading(false);
  },

  /**
   * triggered by click top panel tab
   * @param {*} e tap event 
   */
  tab(e) {
    if (e.currentTarget.dataset.tab) {
      this.setData({
        curr: e.currentTarget.dataset.tab
      })
    }
  },

  /**
   * triggered by click panel "上传身份证"
   */
  uploadIdCard() {
    upload.uploadIdCard({
      beforeLoading: () => {
        this.loading(true);
      }
    }).then(data => {
      this.loading(false);
      // const idcardImageUrl = config.selfieShot(data.image_id);
      const idcardImageUrl = data.imagePath;
      this.setData({ 
        idcardImageUrl,
        idcardImageId: data.image_id
      })
      this.canCompare();
      imageUtils.fillAspect(data.imagePath).then((className) => {
        this.setData({ idcardImageClass: className })
      })
    }).catch(err => {
      if (err && err.errMsg) {
        MessageBox.error(err.errMsg);
      }
      this.loading(false);
    })
  },

  /**
   * triggered by click panel "采集人像"
   */
  selectCapture(e) {
    if (!e.currentTarget.dataset.capture) {
      return;
    }

    let that = this;
    let dataset = {};
    if (e.currentTarget.dataset.capture === 'idcardImage') {
      dataset.dataName = 'idcardImageResult';
      dataset.className = 'idcardImageResultClass';
    } else {
      dataset.dataName = 'idcardTextResult';
      dataset.className = 'idcardTextResultClass';
    }

    wx.showActionSheet({
      itemList: [ '相册', '拍摄', '活体采集', '静默活体' ],
      success(res) {
        if (res.tapIndex === 2) {
          wx.showActionSheet({
            itemList: [ '眨眼动作检测', '张嘴动作检测', '摇头动作检测' ],
            success(lres) {
              if (livenessAssets[lres.tapIndex]) {
                that.livenessModal.show({ 
                  action: lres.tapIndex,
                  uuid: e.currentTarget.dataset.capture
                }, that);
              }
            }
          })
        } else if (res.tapIndex === 0 || res.tapIndex === 1) {
          upload.uploadSelfie({
            beforeLoading: () => {
              that.loading(true);
            },
            sourceType: res.tapIndex
          }).then(data => {
            that.loading(false);
            if (data) {
              data.hackPassed = (data.score <= HACK_SCORE_MAX);
              that.setData({ [dataset.dataName]: data });
              that.canCompare();
              imageUtils.fillAspect(data.imagePath).then((className) => {
                that.setData({ [dataset.className]: className })
              })
            }
          }).catch(err => {
            MessageBox.error(err.errMsg);
            that.loading(false);
          })
        } else if (res.tapIndex === 3) {
          that.livenessModal.show({
            silent: true,
            uuid: e.currentTarget.dataset.capture
          }, that)
        }
      }
    })
  },

  /**
   * watch input
   */
  bindKeyInput(e) {
    if (!e.currentTarget.dataset.field) {
      return;
    }
    this.setData({ ['idcardText.' + e.currentTarget.dataset.field]: e.detail.value })
    this.canCompare();
  },

  /**
   * check the idcard image with selfie or not
   */
  canCompareImage() {
    return this.data.idcardImageUrl && this.data.idcardImageResult;
  },

  /**
   * check the idcard text with selfie or not
   */
  canCompareText() {
    return this.data.idcardText.name 
             && this.data.idcardText.idNumber 
             && this.data.idcardTextResult;
  },

  /**
   * watch data for data status
   */
  canCompare() {
    this.setData({
      imageCanCompare: this.canCompareImage(),
      textCanCompare: this.canCompareText()
    })
  },

  /**
   * check number if valid
   */
  checkIdNumber() {
    return /(^\d{15}$)|(^\d{17}([0-9]|X|x)$)/.test(this.data.idcardText.idNumber)
  },

  /**
   * triggered by click button "开始比对" on panel "人脸VS身份证"
   */
  compareImage() {
    if (!this.canCompareImage()) {
      return;
    }

    const data = {
      'selfie_image_id': this.data.idcardImageId,
      'historical_selfie_image_id': this.data.idcardImageResult[this.data.idcardImageResult.isLiveness ? 'feature_image_id' : 'image_id'],
      'selfie_auto_rotate': true,
      'historical_selfie_auto_rotate': true
    };
    
    const that = this;
    that.comparing(true);
    wx.request({
      url: config.compareApi(true),
      data,
      method: 'POST',
      success(res) {
        that.comparing(false);
        res = res.data;
        if (res.status === 'OK') {
          app.globalData.percent = res.confidence;
          wx.redirectTo({ url: '/pages/result/result' });
        } else {
          MessageBox.error(identityErrorMap[res.status] || '请求比对失败，请重试！');
        }
      },
      fail() {
        that.comparing(false);
        MessageBox.error('请求比对失败，请重试！');
      }
    })
  },

  /**
   * triggered by click button "开始比对" on panel "人脸VS公安地图"
   */
  compareText() {
    if (!this.canCompareText()) {
      return;
    }

    if (!this.checkIdNumber()) {
      MessageBox.error('输入的身份证号不合法！');
      return;
    }

    const data = {
      'name': this.data.idcardText.name,
      'id_number': this.data.idcardText.idNumber.toLowerCase(),
      'selfie_image_id': this.data.idcardTextResult[this.data.idcardTextResult.isLiveness ? 'feature_image_id' : 'image_id']
    };
    
    const that = this;
    that.comparing(true);
    wx.request({
      url: config.compareApi(false),
      data,
      method: 'POST',
      success(res) {
        that.comparing(false);
        res = res.data;
        if (res.status === 'OK') {
          if (res.identity && res.identity.validity && !idNumberErrorMap[res.identity.reason]) {
            app.globalData.percent = res.confidence;
            wx.redirectTo({ url: '/pages/result/result' });
          } else {
            MessageBox.error(idNumberErrorMap[res.identity.reason] || '身份证信息不正确！');
          }
        } else {
          MessageBox.error(identityErrorMap[res.status] || '请求比对失败，请重试！');
        }
      },
      fail() {
        that.comparing(false);
        MessageBox.error('请求比对失败，请重试！');
      }
    })
  }
};

Page(Object.assign({ data: pageData }, pageEvents, pageFuncs));