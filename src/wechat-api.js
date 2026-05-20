const TOKEN_KEY = 'ACCESS_TOKEN';
const KEFU_URL = 'https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=';

export async function getAccessToken(kv, env) {
  const cached = await kv.get(TOKEN_KEY, 'json');
  if (cached && cached.expires_in > Date.now()) {
    return cached.access_token;
  }
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${env.WECHAT_APP_ID}&secret=${env.WECHAT_APP_SECRET}`;
  const data = await fetch(url).then(r => r.json());
  if (!data.access_token) throw new Error('access_token fetch failed: ' + JSON.stringify(data));
  const expiresAt = Date.now() + (data.expires_in - 60) * 1000;
  await kv.put(TOKEN_KEY, JSON.stringify({ access_token: data.access_token, expires_in: expiresAt }));
  return data.access_token;
}

async function kefuSend(token, body) {
  return fetch(KEFU_URL + token, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function sendKefuText(token, toUser, content) {
  return kefuSend(token, { touser: toUser, msgtype: 'text', text: { content } });
}

export function sendKefuImage(token, toUser, mediaId) {
  return kefuSend(token, { touser: toUser, msgtype: 'image', image: { media_id: mediaId } });
}

export function sendKefuVoice(token, toUser, mediaId) {
  return kefuSend(token, { touser: toUser, msgtype: 'voice', voice: { media_id: mediaId } });
}

export function sendKefuNews(token, toUser, imgUrl) {
  return kefuSend(token, {
    touser: toUser,
    msgtype: 'news',
    news: {
      articles: [{
        title: '找到Ta了，请确认',
        description: '慎重考虑，错过就很难再遇到了',
        url: imgUrl,
        picurl: imgUrl,
      }],
    },
  });
}
