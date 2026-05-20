import { handlePost } from './state.js';

const TEXT = 'text/plain; charset=utf-8';

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env, ctx);
  },
};

export async function handleRequest(request, env, ctx = { waitUntil: () => {} }) {
  const url = new URL(request.url);

  if (url.pathname !== '/' && url.pathname !== '/wechat') {
    return new Response('Not Found', { status: 404 });
  }

  if (!env.WECHAT_TOKEN) {
    return new Response('WECHAT_TOKEN not configured', { status: 500, headers: { 'content-type': TEXT } });
  }

  if (request.method === 'GET') {
    return handleVerification(url, env.WECHAT_TOKEN);
  }

  if (request.method === 'POST') {
    const verified = await verifySignature(url, env.WECHAT_TOKEN);
    if (!verified) {
      return new Response('Invalid signature', { status: 403, headers: { 'content-type': TEXT } });
    }
    const xml = await request.text();
    const msg = parseXml(xml);
    if (!msg.FromUserName || !msg.ToUserName) {
      return new Response('Invalid WeChat XML', { status: 400, headers: { 'content-type': TEXT } });
    }
    return handlePost(msg, env, ctx);
  }

  return new Response('Method Not Allowed', { status: 405, headers: { allow: 'GET, POST', 'content-type': TEXT } });
}

async function handleVerification(url, token) {
  const echostr = url.searchParams.get('echostr') || '';
  const ok = await verifySignature(url, token);
  if (!ok) return new Response('Invalid signature', { status: 403, headers: { 'content-type': TEXT } });
  return new Response(echostr, { headers: { 'content-type': TEXT } });
}

export async function verifyWechatSignature(url, token) {
  return verifySignature(url, token);
}

async function verifySignature(url, token) {
  const sig = url.searchParams.get('signature');
  const ts  = url.searchParams.get('timestamp');
  const nc  = url.searchParams.get('nonce');
  if (!sig || !ts || !nc) return false;
  const expected = await sha1([token, ts, nc].sort().join(''));
  return timingSafeEqual(sig, expected);
}

export async function createWechatSignature(token, timestamp, nonce) {
  return sha1([token, timestamp, nonce].sort().join(''));
}

async function sha1(str) {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let m = 0;
  for (let i = 0; i < a.length; i++) m |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return m === 0;
}

export function parseWechatXml(xml) {
  return parseXml(xml);
}

function parseXml(xml) {
  return {
    ToUserName:  field(xml, 'ToUserName'),
    FromUserName: field(xml, 'FromUserName'),
    MsgType:     field(xml, 'MsgType'),
    Content:     field(xml, 'Content'),
    MediaId:     field(xml, 'MediaId'),
    PicUrl:      field(xml, 'PicUrl'),
  };
}

function field(xml, name) {
  const m = new RegExp(`<${name}>\\s*(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))\\s*<\\/${name}>`).exec(xml);
  return m ? (m[1] ?? m[2] ?? '').trim() : '';
}

export function buildTextReply({ toUserName, fromUserName, content }) {
  const now = Math.floor(Date.now() / 1000);
  const esc = v => String(v).replaceAll(']]>', ']]]]><![CDATA[>');
  return [
    '<xml>',
    `<ToUserName><![CDATA[${esc(toUserName)}]]></ToUserName>`,
    `<FromUserName><![CDATA[${esc(fromUserName)}]]></FromUserName>`,
    `<CreateTime>${now}</CreateTime>`,
    '<MsgType><![CDATA[text]]></MsgType>',
    `<Content><![CDATA[${esc(content)}]]></Content>`,
    '</xml>',
  ].join('');
}
