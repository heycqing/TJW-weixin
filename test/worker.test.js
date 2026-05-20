import { describe, expect, it } from 'vitest';
import {
  buildTextReply,
  createWechatSignature,
  handleRequest,
  parseWechatXml,
  verifyWechatSignature,
} from '../src/worker.js';
import { claimImageMatch, scoreCandidate } from '../src/db.js';

describe('Cloudflare WeChat callback POC', () => {
  it('creates the expected WeChat SHA-1 signature', async () => {
    const signature = await createWechatSignature('test-token', '1523204100', 'abc123');

    expect(signature).toBe('57010dd0485727a0ffb6f989b4a32b49cdde38ca');
  });

  it('accepts a valid WeChat verification request and returns echostr', async () => {
    const token = 'test-token';
    const timestamp = '1523204100';
    const nonce = 'abc123';
    const signature = await createWechatSignature(token, timestamp, nonce);
    const request = new Request(`https://wx.example.com/wechat?signature=${signature}&timestamp=${timestamp}&nonce=${nonce}&echostr=hello-worker`);

    const response = await handleRequest(request, { WECHAT_TOKEN: token });

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('hello-worker');
  });

  it('rejects an invalid WeChat signature', async () => {
    const url = new URL('https://wx.example.com/wechat?signature=bad&timestamp=1523204100&nonce=abc123');

    await expect(verifyWechatSignature(url, 'test-token')).resolves.toBe(false);
  });

  it('responds to verified POST with 邂逅 and returns welcome XML', async () => {
    const token = 'test-token';
    const timestamp = '1523204100';
    const nonce = 'abc123';
    const signature = await createWechatSignature(token, timestamp, nonce);
    const request = new Request(`https://wx.example.com/wechat?signature=${signature}&timestamp=${timestamp}&nonce=${nonce}`, {
      method: 'POST',
      body: [
        '<xml>',
        '<ToUserName><![CDATA[gh_test_account]]></ToUserName>',
        '<FromUserName><![CDATA[oUser123]]></FromUserName>',
        '<MsgType><![CDATA[text]]></MsgType>',
        '<Content><![CDATA[邂逅]]></Content>',
        '</xml>',
      ].join(''),
    });

    const store = {};
    const mockDB = {
      prepare: (sql) => ({
        bind: (...args) => ({
          first: async () => store[args[0]] ?? null,
          run: async () => {
            if (sql.includes('INSERT')) {
              store[args[0]] = {
                openId: args[0],
                play: 1,
                needCount: 1,
                content: '',
                sex: null,
                needOpenId: null,
              };
            }
            if (sql.includes('UPDATE users SET activeHour')) {
              if (store[args[1]]) store[args[1]].activeHour = args[0];
            }
            if (sql.includes('UPDATE') && sql.includes('content')) {
              if (store[args[1]]) store[args[1]].content = args[0];
            }
          },
        }),
      }),
    };
    const mockKV = { get: async () => ({ access_token: 'mock_token', expires_in: Date.now() + 7200000 }), put: async () => {} };
    const env = { WECHAT_TOKEN: token, DB: mockDB, KV: mockKV, WECHAT_APP_ID: 'x', WECHAT_APP_SECRET: 'x' };
    const ctx = { waitUntil: () => {} };

    const response = await handleRequest(request, env, ctx);
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/xml');
    expect(body).toContain('<MsgType><![CDATA[text]]></MsgType>');
    expect(body).toContain('<ToUserName><![CDATA[oUser123]]></ToUserName>');
    expect(body).toContain('邂逅实验室');
  });

  it('rejects verified POST callbacks without WeChat sender fields', async () => {
    const token = 'test-token';
    const timestamp = '1523204100';
    const nonce = 'abc123';
    const signature = await createWechatSignature(token, timestamp, nonce);
    const request = new Request(`https://wx.example.com/wechat?signature=${signature}&timestamp=${timestamp}&nonce=${nonce}`, {
      method: 'POST',
      body: '<xml></xml>',
    });

    const response = await handleRequest(request, { WECHAT_TOKEN: token, DB: {}, KV: {} });

    expect(response.status).toBe(400);
    expect(await response.text()).toBe('Invalid WeChat XML');
  });

  it('parses CDATA and plain XML fields from WeChat messages', () => {
    const message = parseWechatXml([
      '<xml>',
      '<ToUserName><![CDATA[gh_test_account]]></ToUserName>',
      '<FromUserName>oUser123</FromUserName>',
      '<MsgType><![CDATA[text]]></MsgType>',
      '<Content>hello</Content>',
      '</xml>',
    ].join(''));

    expect(message).toMatchObject({
      ToUserName: 'gh_test_account',
      FromUserName: 'oUser123',
      MsgType: 'text',
      Content: 'hello',
    });
  });

  it('escapes CDATA terminators in text replies', () => {
    const reply = buildTextReply({
      toUserName: 'user]]>name',
      fromUserName: 'worker',
      content: 'ok',
    });

    expect(reply).toContain('<![CDATA[user]]]]><![CDATA[>name]]>');
  });

  it('scores real users, answer overlap, and active-hour proximity', () => {
    const realScore = scoreCandidate({
      currentMsg: '喜欢 读书 咖啡 安静',
      currentActiveHour: 20,
      candidate: {
        openId: 'real_match',
        msg: '也喜欢 读书 咖啡',
        activeHour: 21,
      },
    });
    const robotScore = scoreCandidate({
      currentMsg: '喜欢 读书 咖啡 安静',
      currentActiveHour: 20,
      candidate: {
        openId: 'test_C_1',
        msg: '喜欢 户外 露营',
        activeHour: 9,
      },
    });

    expect(realScore).toBeGreaterThan(robotScore);
    expect(realScore).toBe(125);
  });

  it('claims a top scored match with guarded writes and records history', async () => {
    const capturedSql = [];
    const capturedArgs = [];
    const historyRows = [];
    const mockDB = {
      prepare: (sql) => {
        capturedSql.push(sql);
        return {
          bind: (...args) => {
            capturedArgs.push(args);
            return {
              all: async () => {
                if (sql.includes('FROM users candidate')) {
                  return {
                    results: [
                      {
                        openId: 'test_C_1',
                        imgId: 'robot_media',
                        imgUrl: 'robot_pic',
                        msg: '户外 露营',
                        msgNd: '',
                        activeHour: 9,
                      },
                      {
                        openId: 'real_match',
                        imgId: 'match_media',
                        imgUrl: 'match_pic',
                        msg: '读书 咖啡',
                        msgNd: '',
                        activeHour: 21,
                      },
                    ],
                  };
                }
                return {
                  results: [
                    { openId: 'oUser123', imgId: 'new_media', imgUrl: 'new_pic' },
                    { openId: 'real_match', imgId: 'match_media', imgUrl: 'match_pic' },
                  ],
                };
              },
              run: async () => {
                historyRows.push(args);
              },
            };
          },
        };
      },
      batch: async (statements) => {
        for (const statement of statements) await statement.run();
      },
    };

    const matched = await claimImageMatch(mockDB, {
      openId: 'oUser123',
      targetSex: 'C',
      imgUrl: 'new_pic',
      imgId: 'new_media',
      nextContent: '邂逅B1image',
      currentMsg: '喜欢 读书 咖啡 安静',
      activeHour: 20,
      now: 123456,
    });

    expect(matched).toMatchObject({ openId: 'real_match', imgUrl: 'match_pic' });
    expect(capturedSql.join('\n')).toContain('FROM users candidate');
    expect(capturedSql.join('\n')).toContain('FROM match_history history');
    expect(capturedSql.join('\n')).toContain('UPDATE users');
    expect(capturedSql.join('\n')).toContain('needOpenId IS NULL');
    expect(capturedArgs[0]).toEqual(['C', 'oUser123', 'oUser123', 50]);
    expect(capturedArgs[1]).toEqual([
      'oUser123',
      'real_match',
      'oUser123',
      'oUser123',
      'new_pic',
      'oUser123',
      'new_media',
      'oUser123',
      '邂逅B1image',
      'oUser123',
      20,
      'oUser123',
      'real_match',
      'oUser123',
      'real_match',
    ]);
    expect(historyRows).toEqual([
      ['oUser123', 'real_match', 123456],
      ['real_match', 'oUser123', 123456],
    ]);
  });

  it('continues to the next top candidate when a guarded claim loses a race', async () => {
    let updateAttempts = 0;
    const originalRandom = Math.random;
    const randomRanks = [0.1, 0.2];
    Math.random = () => randomRanks.shift() ?? 0.3;
    const mockDB = {
      prepare: (sql) => ({
        bind: (...args) => ({
          all: async () => {
            if (sql.includes('FROM users candidate')) {
              return {
                results: [
                  { openId: 'real_first', imgId: 'first_media', imgUrl: 'first_pic', msg: '读书', activeHour: 20 },
                  { openId: 'real_second', imgId: 'second_media', imgUrl: 'second_pic', msg: '咖啡', activeHour: 20 },
                ],
              };
            }
            updateAttempts += 1;
            if (args[12] === 'real_first') return { results: [] };
            return {
              results: [
                { openId: 'oUser123', imgId: 'new_media', imgUrl: 'new_pic' },
                { openId: 'real_second', imgId: 'second_media', imgUrl: 'second_pic' },
              ],
            };
          },
          run: async () => {},
        }),
      }),
      batch: async (statements) => {
        for (const statement of statements) await statement.run();
      },
    };

    try {
      const matched = await claimImageMatch(mockDB, {
        openId: 'oUser123',
        targetSex: 'C',
        imgUrl: 'new_pic',
        imgId: 'new_media',
        nextContent: '邂逅B1image',
        currentMsg: '读书 咖啡',
        activeHour: 20,
      });

      expect(matched).toMatchObject({ openId: 'real_second' });
      expect(updateAttempts).toBe(2);
    } finally {
      Math.random = originalRandom;
    }
  });
});
