const selfieHackApi = '/hackness/selfie_hack_detect';
const livenessShot = '/liveness/liveness_image';
const IdentitySelfieVsWaterMark = '/identity/historical_selfie_verification';
const IdentitySelfieVsIdNumber = '/identity/selfie_idnumber_verification';
const OCRIdcardApi = '/ocr/idcard';
const LivenessApi = '/liveness/check_liveness';
const SilentLivenessApi = '/liveness/check_silent_liveness';

const host = 'https://shieldweb.linkface.cn';
export default {
  origin() {
    return host;
  },

  selfieHackApi() {
    return `${host}${selfieHackApi}`;
  },

  selfieShot(imageId) {
    return `${host}${livenessShot}/${imageId}`; 
  },

  compareApi(isImage) {
    return `${host}${isImage ? IdentitySelfieVsWaterMark : IdentitySelfieVsIdNumber}`;
  },

  OCRIdcardApi() {
    return `${host}${OCRIdcardApi}`;
  },

  LivenessApi() {
    return `${host}${LivenessApi}`;
  },

  SilentLivenessApi() {
    return `${host}${SilentLivenessApi}`;
  },

  authApi() {
    return `${host}/invitation_code_auth`;
  },
}