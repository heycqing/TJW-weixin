export async function getUser(db, openId) {
  return db.prepare('SELECT * FROM users WHERE openId = ?').bind(openId).first();
}

export async function insertUser(db, openId) {
  await db.prepare(
    'INSERT INTO users (openId, play, needCount, content, activeHour) VALUES (?, 1, 1, ?, ?)'
  ).bind(openId, '', currentHour()).run();
}

export async function updateContent(db, openId, content) {
  await db.prepare('UPDATE users SET content = ? WHERE openId = ?').bind(content, openId).run();
}

export async function updateSex(db, openId, sex) {
  await db.prepare('UPDATE users SET sex = ? WHERE openId = ?').bind(sex, openId).run();
}

export async function updateImg(db, openId, imgUrl, imgId) {
  await db.prepare('UPDATE users SET imgUrl = ?, imgId = ? WHERE openId = ?')
    .bind(imgUrl, imgId, openId).run();
}

export async function updateNeedOpenId(db, needOpenId, openId) {
  await db.prepare('UPDATE users SET needOpenId = ? WHERE openId = ?')
    .bind(needOpenId, openId).run();
}

export async function updateVoiceId(db, openId, voiceId) {
  await db.prepare('UPDATE users SET voiceId = ? WHERE openId = ?').bind(voiceId, openId).run();
}

export async function updateMsg(db, openId, msg) {
  await db.prepare('UPDATE users SET msg = ? WHERE openId = ?').bind(msg, openId).run();
}

export async function updateMsgNd(db, openId, msgNd) {
  await db.prepare('UPDATE users SET msg_nd = ? WHERE openId = ?').bind(msgNd, openId).run();
}

export async function updateContact(db, openId, contact) {
  await db.prepare('UPDATE users SET contact_ = ? WHERE openId = ?').bind(contact, openId).run();
}

export async function zeroPlay(db, openId) {
  await db.prepare('UPDATE users SET play = 0, needOpenId = NULL WHERE openId = ?')
    .bind(openId).run();
}

export async function updateActiveHour(db, openId, activeHour = currentHour()) {
  await db.prepare('UPDATE users SET activeHour = ? WHERE openId = ?').bind(activeHour, openId).run();
}

// Returns { imgId, imgUrl, openId } of a random matched user, or null if none found
export async function randomImg(db, sex, openId) {
  return db.prepare(
    `SELECT imgId, imgUrl, openId
     FROM users
     WHERE sex = ?
       AND openId != ?
       AND imgId IS NOT NULL
       AND needOpenId IS NULL
     ORDER BY CASE WHEN openId LIKE 'test_%' THEN 1 ELSE 0 END, RANDOM()
     LIMIT 1`
  ).bind(sex, openId).first();
}

export async function claimImageMatch(db, {
  openId,
  targetSex,
  imgUrl,
  imgId,
  nextContent,
  currentMsg = '',
  currentMsgNd = '',
  activeHour = currentHour(),
  now = Date.now(),
}) {
  const candidates = await getMatchCandidates(db, {
    openId,
    targetSex,
    currentMsg,
    currentMsgNd,
    activeHour,
  });

  for (const candidate of pickFromTopScored(candidates, 5)) {
    const matched = await claimSpecificImageMatch(db, {
      openId,
      candidateOpenId: candidate.openId,
      imgUrl,
      imgId,
      nextContent,
      activeHour,
    });

    if (matched) {
      await recordMatchHistory(db, openId, matched.openId, now);
      return matched;
    }
  }

  return null;
}

export async function getMatchCandidates(db, {
  openId,
  targetSex,
  currentMsg = '',
  currentMsgNd = '',
  activeHour = currentHour(),
  limit = 50,
}) {
  const result = await db.prepare(
    `SELECT
       candidate.openId,
       candidate.imgId,
       candidate.imgUrl,
       candidate.msg,
       candidate.msg_nd AS msgNd,
       candidate.activeHour
     FROM users candidate
     WHERE candidate.sex = ?
       AND candidate.openId != ?
       AND candidate.imgId IS NOT NULL
       AND candidate.needOpenId IS NULL
       AND NOT EXISTS (
         SELECT 1
         FROM match_history history
         WHERE history.userOpenId = ?
           AND history.matchedOpenId = candidate.openId
       )
     ORDER BY CASE WHEN candidate.openId LIKE 'test_%' THEN 1 ELSE 0 END, RANDOM()
     LIMIT ?`
  ).bind(targetSex, openId, openId, limit).all();

  const scored = (result.results || [])
    .map(candidate => ({
      ...candidate,
      score: scoreCandidate({
        currentMsg,
        currentMsgNd,
        currentActiveHour: activeHour,
        candidate,
      }),
    }))
    .sort((a, b) => b.score - a.score);
  const realUsers = scored.filter(candidate => !candidate.openId.startsWith('test_'));
  return realUsers.length > 0 ? realUsers : scored;
}

export function scoreCandidate({
  currentMsg = '',
  currentMsgNd = '',
  currentActiveHour = currentHour(),
  candidate,
}) {
  const isRobot = candidate.openId.startsWith('test_');
  const overlap = keywordOverlap(
    `${currentMsg} ${currentMsgNd}`,
    `${candidate.msg || ''} ${candidate.msgNd || candidate.msg_nd || ''}`
  );
  const hourGap = activeHourGap(currentActiveHour, candidate.activeHour);
  const activeScore = hourGap === null ? 0 : hourGap === 0 ? 10 : hourGap <= 2 ? 5 : 0;

  return (isRobot ? 0 : 100) + (overlap * 10) + activeScore;
}

async function claimSpecificImageMatch(db, {
  openId,
  candidateOpenId,
  imgUrl,
  imgId,
  nextContent,
  activeHour,
}) {
  const result = await db.prepare(
    `UPDATE users
     SET
       needOpenId = CASE WHEN openId = ? THEN ? ELSE ? END,
       imgUrl = CASE WHEN openId = ? THEN ? ELSE imgUrl END,
       imgId = CASE WHEN openId = ? THEN ? ELSE imgId END,
       content = CASE WHEN openId = ? THEN ? ELSE content END,
       activeHour = CASE WHEN openId = ? THEN ? ELSE activeHour END
     WHERE ((
         openId = ?
         AND needOpenId IS NULL
       ) OR (
         openId = ?
         AND needOpenId IS NULL
         AND imgId IS NOT NULL
       ))
       AND EXISTS (
         SELECT 1 FROM users
         WHERE openId = ?
           AND needOpenId IS NULL
       )
       AND EXISTS (
         SELECT 1 FROM users
         WHERE openId = ?
           AND needOpenId IS NULL
           AND imgId IS NOT NULL
       )
     RETURNING openId, imgId, imgUrl`
  ).bind(
    openId,
    candidateOpenId,
    openId,
    openId,
    imgUrl,
    openId,
    imgId,
    openId,
    nextContent,
    openId,
    activeHour,
    openId,
    candidateOpenId,
    openId,
    candidateOpenId,
  ).all();

  const rows = result.results || [];
  if (rows.length !== 2) return null;
  return rows.find(row => row.openId === candidateOpenId) || null;
}

async function recordMatchHistory(db, openId, matchedOpenId, now) {
  await db.batch([
    db.prepare(
      'INSERT INTO match_history (userOpenId, matchedOpenId, createdAt) VALUES (?, ?, ?)'
    ).bind(openId, matchedOpenId, now),
    db.prepare(
      'INSERT INTO match_history (userOpenId, matchedOpenId, createdAt) VALUES (?, ?, ?)'
    ).bind(matchedOpenId, openId, now),
  ]);
}

export async function getUserField(db, openId, field) {
  const row = await db.prepare(`SELECT ${field} FROM users WHERE openId = ?`).bind(openId).first();
  return row ? row[field] : null;
}

function pickFromTopScored(candidates, size) {
  const pool = candidates.slice(0, size);
  return shuffle(pool);
}

function shuffle(items) {
  return items
    .map(item => ({ item, rank: Math.random() }))
    .sort((a, b) => a.rank - b.rank)
    .map(({ item }) => item);
}

function keywordOverlap(left, right) {
  const leftTokens = tokenize(left);
  const rightTokens = tokenize(right);
  let count = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) count += 1;
  }
  return count;
}

function tokenize(text) {
  return new Set(
    String(text)
      .toLowerCase()
      .replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
      .split(/\s+/)
      .map(token => token.trim())
      .filter(token => token.length >= 2)
  );
}

function activeHourGap(left, right) {
  if (!Number.isInteger(left) || !Number.isInteger(right)) return null;
  const diff = Math.abs(left - right);
  return Math.min(diff, 24 - diff);
}

function currentHour() {
  return new Date().getUTCHours();
}
