// api/submit.js

async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // OPTIONS preflight 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POST 요청만 허용
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // req.body 안전한 추출 (문자열인 경우 JSON 파싱)
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }
    const { text } = body || {};

    // Vercel 환경변수에서 텔레그램 토큰과 챗 ID를 가져옵니다 (유연한 변수명 대응).
    const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_TOKEN || process.env.BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID || process.env.CHAT_ID;

    if (!botToken || !chatId) {
      console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in environment variables.');
      return res.status(500).json({
        error: '서버의 텔레그램 환경변수(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID) 설정이 누락되었습니다. Vercel 설정(Environment Variables)을 확인해 주세요.'
      });
    }

    if (!text) {
      return res.status(400).json({ error: '전송할 메시지가 없습니다.' });
    }

    // 텔레그램 봇 API 호출 (다중 수신 지원: 콤마로 구분된 chat_id)
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const chatIds = chatId.split(',').map(id => id.trim()).filter(Boolean);

    const sendPromises = chatIds.map(async (id) => {
      try {
        const response = await fetch(telegramUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: id,
            text: text,
          }),
        });

        const result = await response.json();
        if (!result.ok) {
          console.error(`Telegram API Error for chatId ${id}:`, result);
          return { id, ok: false, description: result.description };
        }
        return { id, ok: true };
      } catch (err) {
        console.error(`Fetch error for chatId ${id}:`, err);
        return { id, ok: false, error: err.message };
      }
    });

    const results = await Promise.all(sendPromises);
    const hasSuccess = results.some(r => r.ok);

    if (!hasSuccess) {
      return res.status(500).json({
        error: '텔레그램 메시지 전송에 실패했습니다. 봇 토큰이나 Chat ID가 올바른지 확인해 주세요.',
        details: results
      });
    }

    return res.status(200).json({ success: true, results });
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: '서버 에러가 발생했습니다.' });
  }
}

export default handler;
module.exports = handler;
