import { IDENTITY_BOUND } from '../../utils/constant';
import { requestAnimationFrame, cancelAnimationFrame } from '../../utils/util';

const app = getApp();
const outerRadius = 110;
const innerRadius = 100;
const thickness = (outerRadius - innerRadius) / 2;
const roundRadius = (outerRadius + innerRadius) / 2;

Page({
  onLoad() {
    this.setData({
      result: app.globalData.percent,
      resultText: Math.round(app.globalData.percent * 100),
      labelClass: app.globalData.percent > IDENTITY_BOUND ? 'success' : 'fail',
      labelText: `判定结果：用户与身份证肖像${app.globalData.percent > IDENTITY_BOUND ? '' : '不'}一致`
    })

    if (this.data.result >= 0) {
      this.drawDoughnut();
    }
  },

  reCompare() {
    wx.redirectTo({ url: '/pages/compare/compare' });
  },

  drawDoughnut() {
    const ctx = wx.createCanvasContext('doughnut');
    const grd = ctx.createLinearGradient(0, 0, outerRadius * 2, outerRadius * 2);
    grd.addColorStop(0, '#FF7927');
    grd.addColorStop(0.5, '#A9698C');   
    grd.addColorStop(1, '#7859FF');
    this.drawDoughnutFrame(ctx, grd, this.data.result);

    let that = this;
    let duration = 2;
    let totalCount = this.data.result * 60 * duration;
    let frameCount = totalCount;
    const id = requestAnimationFrame(function draw() {
      if (frameCount <= 0) {
        cancelAnimationFrame(id);
      } else {
        frameCount--;
        that.drawDoughnutFrame(ctx, grd, (totalCount - frameCount) / (60 * duration));
        requestAnimationFrame(draw);
      }
    })
  },

  drawDoughnutFrame(ctx, grd, percent) {
    const angle = percent * Math.PI * 2 - Math.PI / 2;

    ctx.clearRect(0, 0, outerRadius, outerRadius);

    if (angle > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.setFillStyle(grd);
      ctx.moveTo(outerRadius, outerRadius);
      ctx.arc(outerRadius, outerRadius, outerRadius, -Math.PI / 2, angle, false);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.setFillStyle('rgb(0, 0, 0)');
      ctx.arc(outerRadius, outerRadius, innerRadius, 0, Math.PI * 2, false);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.save();
      const startAngle = -Math.PI / 2;
      const endAngle = angle;
      ctx.setFillStyle(grd);
      ctx.beginPath();
      ctx.arc(outerRadius + roundRadius * Math.cos(startAngle), outerRadius + roundRadius * Math.sin(startAngle), thickness, 0, Math.PI * 2);
      ctx.arc(outerRadius + roundRadius * Math.cos(endAngle), outerRadius + roundRadius * Math.sin(endAngle), thickness, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  
    ctx.save();
    ctx.beginPath();
    ctx.setFillStyle('rgb(255, 255, 255)');
    ctx.setTextAlign('center');
    ctx.setFontSize(16);
    ctx.fillText('相似度', outerRadius, outerRadius - 64);
    ctx.fillText('%', outerRadius, outerRadius + 80);
    ctx.setFontSize(90);
    ctx.fillText(Math.round(percent * 100).toString(), outerRadius, outerRadius + 40);
    ctx.closePath();
    ctx.restore();

    ctx.draw();
  }
})