-- Clear previous test data
DELETE FROM users WHERE openId LIKE 'test_%';

-- A: 男找男 (5人, 男性头像)
INSERT INTO users (openId, play, needCount, content, sex, imgUrl, imgId, msg, msg_nd) VALUES
('test_A_1', 1, 1, '', 'A', 'https://randomuser.me/api/portraits/men/11.jpg', 'test_media_A_1',
 '1.叫我小轩就好 2.眼睛 3.时间暂停 4.一台胶片相机 5.温柔又有点神秘的人',
 '第一次见面我想请你喝咖啡，不知道你喜不喜欢手冲'),
('test_A_2', 1, 1, '', 'A', 'https://randomuser.me/api/portraits/men/22.jpg', 'test_media_A_2',
 '1.阿哲 2.笑起来的弧度 3.读心术 4.一副好耳机 5.有自己想法但懂得倾听',
 '希望我们能在某个周末一起去看场展览'),
('test_A_3', 1, 1, '', 'A', 'https://randomuser.me/api/portraits/men/33.jpg', 'test_media_A_3',
 '1.晓峰 2.手 3.隐身 4.Switch游戏 5.爱笑、真诚',
 '如果你也喜欢打游戏我们一定很合得来'),
('test_A_4', 1, 1, '', 'A', 'https://randomuser.me/api/portraits/men/44.jpg', 'test_media_A_4',
 '1.子墨 2.声音 3.瞬间移动 4.一套好用的厨具 5.懂生活、爱做饭',
 '下次见面我来下厨，你来评分'),
('test_A_5', 1, 1, '', 'A', 'https://randomuser.me/api/portraits/men/55.jpg', 'test_media_A_5',
 '1.叫我Sir就好 2.侧脸 3.预知未来 4.机械键盘 5.独立有个性',
 '感觉你是我一直在等的那种人');

-- B: 男找女 (5人, 男性头像) — 与 C 互配
INSERT INTO users (openId, play, needCount, content, sex, imgUrl, imgId, msg, msg_nd) VALUES
('test_B_1', 1, 1, '', 'B', 'https://randomuser.me/api/portraits/men/61.jpg', 'test_media_B_1',
 '1.小陈 2.眉眼 3.读心术 4.降噪耳机 5.安静又有趣的女生',
 '想带你去一个我最喜欢的咖啡馆'),
('test_B_2', 1, 1, '', 'B', 'https://randomuser.me/api/portraits/men/62.jpg', 'test_media_B_2',
 '1.Justin 2.笑容 3.时间倒流 4.摩托车 5.敢爱敢恨、真实',
 '骑车兜风的感觉，希望有人可以一起体验'),
('test_B_3', 1, 1, '', 'B', 'https://randomuser.me/api/portraits/men/63.jpg', 'test_media_B_3',
 '1.阿翔 2.身高 3.隐身 4.单反相机 5.有想法、爱探索',
 '我在找一个愿意一起去陌生城市浪的人'),
('test_B_4', 1, 1, '', 'B', 'https://randomuser.me/api/portraits/men/64.jpg', 'test_media_B_4',
 '1.老K 2.声线 3.超强记忆力 4.人体工学椅 5.聪明但不装',
 '认识你之前我都不相信缘分，现在开始信了'),
('test_B_5', 1, 1, '', 'B', 'https://randomuser.me/api/portraits/men/65.jpg', 'test_media_B_5',
 '1.大壮 2.手 3.瞬移 4.一套露营装备 5.爱自然、不怕晒',
 '下次露营想多带一个人，你愿意吗');

-- C: 女找男 (5人, 女性头像) — 与 B 互配
INSERT INTO users (openId, play, needCount, content, sex, imgUrl, imgId, msg, msg_nd) VALUES
('test_C_1', 1, 1, '', 'C', 'https://randomuser.me/api/portraits/women/11.jpg', 'test_media_C_1',
 '1.林林 2.眼睛 3.停止时间 4.一台胶片相机 5.踏实、有安全感',
 '我不太会主动，但遇到对的人我会很勇敢'),
('test_C_2', 1, 1, '', 'C', 'https://randomuser.me/api/portraits/women/22.jpg', 'test_media_C_2',
 '1.糖糖 2.笑起来的眼角 3.读心术 4.香薰蜡烛套装 5.幽默有趣不无聊',
 '我的理想约会是一起去吃好吃的然后随便逛'),
('test_C_3', 1, 1, '', 'C', 'https://randomuser.me/api/portraits/women/33.jpg', 'test_media_C_3',
 '1.小鹿 2.手指 3.隐形 4.全套瑜伽装备 5.自律但懂得放松',
 '希望找到一个周末愿意一起运动的人'),
('test_C_4', 1, 1, '', 'C', 'https://randomuser.me/api/portraits/women/44.jpg', 'test_media_C_4',
 '1.阿九 2.声音 3.飞翔 4.电子书阅读器 5.爱读书、有自己的世界',
 '最近在看村上春树，你读过吗'),
('test_C_5', 1, 1, '', 'C', 'https://randomuser.me/api/portraits/women/55.jpg', 'test_media_C_5',
 '1.晴晴 2.腰 3.预知未来 4.专业烘焙工具 5.生活有热情、爱做甜点',
 '如果见面我可以亲手做蛋糕给你');

-- D: 女找女 (5人, 女性头像)
INSERT INTO users (openId, play, needCount, content, sex, imgUrl, imgId, msg, msg_nd) VALUES
('test_D_1', 1, 1, '', 'D', 'https://randomuser.me/api/portraits/women/61.jpg', 'test_media_D_1',
 '1.可可 2.眼神 3.读心术 4.一把吉他 5.感性、懂音乐',
 '我想和你一起去看一场现场音乐'),
('test_D_2', 1, 1, '', 'D', 'https://randomuser.me/api/portraits/women/62.jpg', 'test_media_D_2',
 '1.Mia 2.锁骨 3.隐身 4.胶片相机 5.文艺但不做作',
 '拍照的时候我喜欢拍人，你愿意做我的模特吗'),
('test_D_3', 1, 1, '', 'D', 'https://randomuser.me/api/portraits/women/63.jpg', 'test_media_D_3',
 '1.宁宁 2.笑 3.瞬移 4.全套户外装备 5.爱冒险、不怕麻烦',
 '下次爬山想多一个人陪，你敢吗'),
('test_D_4', 1, 1, '', 'D', 'https://randomuser.me/api/portraits/women/64.jpg', 'test_media_D_4',
 '1.小鱼 2.手 3.时间暂停 4.绘画全套工具 5.安静有创意',
 '我给你画一幅画，你来给它起名字'),
('test_D_5', 1, 1, '', 'D', 'https://randomuser.me/api/portraits/women/65.jpg', 'test_media_D_5',
 '1.双双 2.整个背影 3.记忆力超强 4.高端咖啡机 5.慢生活、不将就',
 '周日下午一起喝咖啡聊天，我觉得挺好的');
