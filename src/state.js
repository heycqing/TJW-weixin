import * as db from './db.js';
import { getAccessToken, sendKefuText, sendKefuImage, sendKefuVoice, sendKefuNews } from './wechat-api.js';

const WELCOME_IMAGE_ID = 'kFWxB23toAeVAIRV5tJ27bPtSigQiLaZ6GBkSCTwz7493eIVnrPQvwxTVQYGbK4A';
const SHARE_URL = 'http://www.wusiqing.com';

// B(男找女) ↔ C(女找男), A↔A, D↔D
const TARGET_SEX = { A: 'A', B: 'C', C: 'B', D: 'D' };

const MSG_WELCOME = `欢迎来到【邂逅实验室】，
遇见你真好。
首先，请订制你想要的邂逅：
我是男生，想邂逅男生，回复【A】
我是男生，想邂逅女生，回复【B】
我是女生，想邂逅男生，回复【C】
我是女生，想邂逅女生，回复【D】`;

const MSG_UPLOAD_PHOTO = `哎呦，很多人想见你噢。
请你挑一张最满意的照片发我，
它将决定你能不能遇到那个Ta，
作为交换你也将收到Ta准备的照片。
温馨提示：只有一次上传照片的机会，一旦传错将无法修改。`;

const MSG_MATCH_FOUND = `照片选得真棒。
根据你的要求我找到了Ta，
请确认一下照片，是不是对的人。
慎重考虑噢，错过就很难再遇到了。
继续聊 请回复【1】
没兴趣 请回复【2】`;

const MSG_QUESTIONS = `太棒了，Ta等的就是你，
这是【邂逅实验室】的
聊天前简单的了解很有必要，
Ta 想知道你关于以下问题的答案。
请先一次性回答以下问题：
1.你希望Ta怎么称呼你？
2.你最迷人的身体部位是？
3.你最想拥有的超能力是？
4.最近超想买的一样东西是？
5.你喜欢的人共同特征是？`;

const MSG_SEND_VOICE = `感谢你认真回答，这是Ta的答案。
接下来请你发一段展示自己的语音
如果不知道说什么，可以跟Ta聊聊
"今日话题：长大总是在一瞬间，你什么时候觉得自己变老了？"，
或者唱一首应景的歌。
请注意：
你只有一次上传语音的机会，一旦传错将无法修改。`;

const MSG_AFTER_VOICE = `听到Ta对你说的话了吗？
聊到这里你们已经基本了解，
请根据你的喜好进行选择，
继续聊 请回复【1】
没兴趣 请回复【2】`;

const MSG_FINAL_MSG = `哈哈，无声胜有声，说太多就不浪漫了。
最后给Ta写下一段想说的话吧。
如果觉得Ta还算有趣，希望认识。
这是交换【联系方式】的最后机会`;

const MSG_RECONSIDER = `真的不愿意继续聊聊吗？这是今天唯一一个介绍给你的对象
错过就没有了，你们也很难再联系上了。
不愿邂逅请回复：1
重新考虑请回复：2`;

const MSG_RECHOOSE = `请重新选择
继续聊请回复【1】
没兴趣请回复【2】`;

function shareLink(openId) {
  return `<a href="${SHARE_URL}/webTest/TJW/TJW-weixin/app.html?${openId}">有趣的灵魂终将相遇</a>`;
}

function declineMsg(openId) {
  return `好吧，很遗憾这次你们互相错过了
你可以选择明天再来碰碰运气
或者点击下方蓝字
分享到朋友圈或者转发朋友
你将获得额外一次【邂逅】机会
${shareLink(openId)}`;
}

export async function handlePost(msg, env, ctx) {
  const { DB, KV } = env;
  const from = msg.FromUserName;
  const to = msg.ToUserName;
  const type = msg.MsgType;
  const content = (msg.Content || '').trim();

  let user = await db.getUser(DB, from);
  if (!user) {
    await db.insertUser(DB, from);
    user = await db.getUser(DB, from);
  }
  await db.updateActiveHour(DB, from);

  const { play, content: state } = user;

  // Used up today's chance
  if (play === 0 && content === '邂逅') {
    return reply(from, to, `很抱歉，你今天的机会已经用完了
也留点机会给其他有缘人吧
你可以选择明天再来碰碰运气
或者${shareLink(from)}
分享到朋友圈
你将获得额外1次【邂逅】机会`);
  }

  if (play !== 1) {
    return reply(from, to, '听不懂你在说的是什么？');
  }

  // ── Text messages ──────────────────────────────────────────────────

  if (type === 'text') {
    const c = content.toUpperCase();

    if (content === '邂逅') {
      await db.updateContent(DB, from, '邂逅');
      ctx.waitUntil(kefuImage(KV, env, from, WELCOME_IMAGE_ID));
      return reply(from, to, MSG_WELCOME);
    }

    if (state === '邂逅' && ['A','B','C','D'].includes(c)) {
      const n = '邂逅' + c;
      await Promise.all([db.updateContent(DB, from, n), db.updateSex(DB, from, c)]);
      const labels = { A:'男生，想邂逅男生', B:'男生，想邂逅女生', C:'女生，想邂逅男生', D:'女生，想邂逅女生' };
      return reply(from, to, `你是${labels[c]}，\n确认请回复1\n重新选择请回复2`);
    }

    // Confirm sex selection
    if (/^邂逅[ABCD]$/.test(state) && content === '1') {
      await db.updateContent(DB, from, state + '1');
      return reply(from, to, MSG_UPLOAD_PHOTO);
    }

    // Re-choose sex
    if (/^邂逅[ABCD]$/.test(state) && content === '2') {
      await db.updateContent(DB, from, '邂逅');
      return reply(from, to, MSG_WELCOME);
    }

    // After image: confirm match
    if (/^邂逅[ABCD]1image$/.test(state) && content === '1') {
      await db.updateContent(DB, from, state + '1');
      return reply(from, to, MSG_QUESTIONS);
    }

    // After image: reconsider
    if (/^邂逅[ABCD]1image$/.test(state) && content === '2') {
      await db.updateContent(DB, from, state + '2');
      return reply(from, to, MSG_RECONSIDER);
    }

    // Reconsider → decline
    if (/^邂逅[ABCD]1image2$/.test(state) && content === '1') {
      await Promise.all([db.updateContent(DB, from, ''), db.zeroPlay(DB, from)]);
      return reply(from, to, declineMsg(from));
    }

    // Reconsider → think again
    if (/^邂逅[ABCD]1image2$/.test(state) && content === '2') {
      await db.updateContent(DB, from, state + '2');
      return reply(from, to, MSG_RECHOOSE);
    }

    // Think again → yes
    if (/^邂逅[ABCD]1image22$/.test(state) && content === '1') {
      const base = state.slice(0, 3) + '1image1'; // 邂逅X + 1image1
      await db.updateContent(DB, from, base);
      return reply(from, to, MSG_QUESTIONS);
    }

    // Think again → still no
    if (/^邂逅[ABCD]1image22$/.test(state) && content === '2') {
      await db.updateContent(DB, from, state.slice(0, 10));
      return reply(from, to, MSG_RECONSIDER);
    }

    // After voice: confirm
    if (/^邂逅[ABCD]1image1textvoice$/.test(state) && content === '1') {
      await db.updateContent(DB, from, state + '1');
      return reply(from, to, MSG_FINAL_MSG);
    }

    // After voice: reconsider
    if (/^邂逅[ABCD]1image1textvoice$/.test(state) && content === '2') {
      await db.updateContent(DB, from, state + '2');
      return reply(from, to, MSG_RECONSIDER);
    }

    // Voice reconsider → decline
    if (/^邂逅[ABCD]1image1textvoice2$/.test(state) && content === '1') {
      await Promise.all([db.updateContent(DB, from, ''), db.zeroPlay(DB, from)]);
      return reply(from, to, declineMsg(from));
    }

    // Voice reconsider → think again
    if (/^邂逅[ABCD]1image1textvoice2$/.test(state) && content === '2') {
      await db.updateContent(DB, from, state + '2');
      return reply(from, to, MSG_RECHOOSE);
    }

    // Voice think again → yes
    if (/^邂逅[ABCD]1image1textvoice22$/.test(state) && content === '1') {
      const base = state.slice(0, 14) + 'voice1'; // 邂逅X1image1text + voice1
      await db.updateContent(DB, from, base);
      return reply(from, to, MSG_FINAL_MSG);
    }

    // Voice think again → still no
    if (/^邂逅[ABCD]1image1textvoice22$/.test(state) && content === '2') {
      await db.updateContent(DB, from, state.slice(0, 20));
      return reply(from, to, MSG_RECONSIDER);
    }

    // Answer questions (first text after image confirmed)
    if (/^邂逅[ABCD]1image1$/.test(state) && content !== '') {
      const n = state + 'text';
      const needOpenId = user.needOpenId;
      const [partnerMsg] = await Promise.all([
        needOpenId ? db.getUserField(DB, needOpenId, 'msg').catch(() => null) : null,
        db.updateContent(DB, from, n),
        db.updateMsg(DB, from, content),
      ]);
      const replyText = partnerMsg
        ? `Ta的回答：\n${partnerMsg}\n\n${MSG_SEND_VOICE}`
        : MSG_SEND_VOICE;
      return reply(from, to, replyText);
    }

    // Second message (after voice confirmed)
    if (/^邂逅[ABCD]1image1textvoice1$/.test(state) && content !== '') {
      const n = state + 'text';
      const needOpenId = user.needOpenId;
      const [partnerMsgNd] = await Promise.all([
        needOpenId ? db.getUserField(DB, needOpenId, 'msg_nd').catch(() => null) : null,
        db.updateContent(DB, from, n),
        db.updateMsgNd(DB, from, content),
      ]);
      const prefix = partnerMsgNd ? `Ta说：\n${partnerMsgNd}\n\n` : '';
      return reply(from, to, `${prefix}这是Ta在实验室留下的最后的话，
是不是很想见Ta呢？
脑补千百遍，不如线下见一面。
如果你希望参与线下活动
请输入【姓名+手机号码】进行报名
如："小唐+136xxxx6542"
双方均填入准确信息即为成功报名`);
    }

    // Contact info input
    if (/^邂逅[ABCD]1image1textvoice1text$/.test(state) && content !== '') {
      await db.updateContact(DB, from, content);
      const hasPhone = /[0-9]{11}/.test(content);
      await Promise.all([db.updateContent(DB, from, ''), db.zeroPlay(DB, from)]);
      if (hasPhone) {
        return reply(from, to, `收到你的报名信息啦！
请添加客服微信：TJWstation
确认信息完成报名！
我在【邂逅实验室】等你喔！
预祝你邂逅愉快～
如果还想认识更多朋友
点击下方蓝字分享到朋友圈
你将获得额外一次【邂逅】机会
${shareLink(from)}`);
      }
      return reply(from, to, `抱歉，你未能及时填写报名信息或填写有误
这次的报名并未生效
你可以选择明天再来碰碰运气
或者点击下方蓝字分享到朋友圈
你将获得额外一次【邂逅】机会
${shareLink(from)}`);
    }

    // [passit] — bypass voice upload for testing
    if (/^邂逅[ABCD]1image1text$/.test(state) && content === '[passit]') {
      const n = state + 'voice';
      const needOpenId = user.needOpenId;
      await Promise.all([
        db.updateContent(DB, from, n),
        db.updateVoiceId(DB, from, 'passit_placeholder'),
      ]);
      if (needOpenId) {
        ctx.waitUntil(
          db.getUserField(DB, needOpenId, 'voiceId')
            .then(vid => vid ? kefuVoice(KV, env, from, vid) : null)
            .catch(() => {})
        );
      }
      return reply(from, to, MSG_AFTER_VOICE);
    }

    return reply(from, to, '请按照确认的方式输入，如还是有问题，请重新输入【邂逅】');
  }

  // ── Image messages ─────────────────────────────────────────────────

  if (type === 'image' && /^邂逅[ABCD]1$/.test(state)) {
    const sex = user.sex;
    const targetSex = TARGET_SEX[sex];
    const n = state + 'image';
    const matched = await db.claimImageMatch(DB, {
      openId: from,
      targetSex,
      imgUrl: msg.PicUrl || '',
      imgId: msg.MediaId || '',
      nextContent: n,
      currentMsg: user.msg || '',
      currentMsgNd: user.msg_nd || '',
      activeHour: new Date().getUTCHours(),
    });

    if (!matched) {
      return reply(from, to, '暂时还没有合适的人，请稍后再试～');
    }

    ctx.waitUntil(kefuText(KV, env, from, MSG_MATCH_FOUND));
    return replyNews(from, to, matched.imgUrl);
  }

  // ── Voice messages ─────────────────────────────────────────────────

  if (type === 'voice' && /^邂逅[ABCD]1image1text$/.test(state)) {
    const n = state + 'voice';
    const needOpenId = user.needOpenId;
    await Promise.all([
      db.updateContent(DB, from, n),
      db.updateVoiceId(DB, from, msg.MediaId || ''),
    ]);
    if (needOpenId) {
      ctx.waitUntil(
        db.getUserField(DB, needOpenId, 'voiceId')
          .then(vid => vid ? kefuVoice(KV, env, from, vid) : null)
          .catch(() => {})
      );
    }
    return reply(from, to, MSG_AFTER_VOICE);
  }

  return reply(from, to, '请按照确认的方式输入，如还是有问题，请重新输入【邂逅】');
}

async function kefuImage(kv, env, toUser, mediaId) {
  const token = await getAccessToken(kv, env);
  return sendKefuImage(token, toUser, mediaId);
}

async function kefuText(kv, env, toUser, content) {
  const token = await getAccessToken(kv, env);
  return sendKefuText(token, toUser, content);
}

async function kefuVoice(kv, env, toUser, mediaId) {
  const token = await getAccessToken(kv, env);
  return sendKefuVoice(token, toUser, mediaId);
}

async function kefuNews(kv, env, toUser, imgUrl) {
  const token = await getAccessToken(kv, env);
  return sendKefuNews(token, toUser, imgUrl);
}

function reply(toUser, fromUser, content) {
  const now = Math.floor(Date.now() / 1000);
  const xml = [
    '<xml>',
    `<ToUserName><![CDATA[${esc(toUser)}]]></ToUserName>`,
    `<FromUserName><![CDATA[${esc(fromUser)}]]></FromUserName>`,
    `<CreateTime>${now}</CreateTime>`,
    '<MsgType><![CDATA[text]]></MsgType>',
    `<Content><![CDATA[${esc(content)}]]></Content>`,
    '</xml>',
  ].join('');
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
}

function replyNews(toUser, fromUser, picUrl) {
  const now = Math.floor(Date.now() / 1000);
  const xml = [
    '<xml>',
    `<ToUserName><![CDATA[${esc(toUser)}]]></ToUserName>`,
    `<FromUserName><![CDATA[${esc(fromUser)}]]></FromUserName>`,
    `<CreateTime>${now}</CreateTime>`,
    '<MsgType><![CDATA[news]]></MsgType>',
    '<ArticleCount>1</ArticleCount>',
    '<Articles><item>',
    '<Title><![CDATA[找到Ta了！继续聊回复【1】，没兴趣回复【2】]]></Title>',
    '<Description><![CDATA[慎重考虑，错过就很难再遇到了]]></Description>',
    `<PicUrl><![CDATA[${esc(picUrl)}]]></PicUrl>`,
    `<Url><![CDATA[${esc(picUrl)}]]></Url>`,
    '</item></Articles>',
    '</xml>',
  ].join('');
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
}

function esc(v) {
  return String(v).replaceAll(']]>', ']]]]><![CDATA[>');
}
