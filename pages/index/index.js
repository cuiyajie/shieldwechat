import config from '../../utils/config';
import { AuthErrorMap } from '../../utils/constant';
import { MessageBox } from '../../utils/util';

Page({
  makePhoneCall: function() {
    wx.makePhoneCall({ phoneNumber: '010-52725617' });
  },

  auth: function(e) {
    var val = e.detail.value;
    if (val && val.length === 4) {
      wx.hideKeyboard()
      wx.request({
        url: config.authApi(),
        data: {
          'invitation_code': val,
          'platform_type': 1
        },
        header: {
          'Content-Type':'application/x-www-form-urlencoded'
        },
        method: 'POST',
        success: function(res) {
          res = res.data;
          if (res.status === 'OK') {
            e.detail.value = '';
            wx.redirectTo({ url: '/pages/compare/compare' });
          } else if (res.status && AuthErrorMap[res.status]){
            MessageBox.error(AuthErrorMap[res.status]);
          } else {
            MessageBox.error('请求服务器错误');
          }
        },
        fail: function(err) {
          MessageBox.error('请求服务器错误');
        }
      })
    }
  }
})
