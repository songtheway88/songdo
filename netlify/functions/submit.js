// netlify/functions/submit.js
// api/submit.js(Vercel 방식)와 같은 역할이지만, 이 사이트가 실제로 배포되는
// Netlify Functions 형식(event/context, statusCode/body)으로 작성했다.

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: `Method ${event.httpMethod} Not Allowed` }),
    };
  }

  try {
    const { text } = JSON.parse(event.body || "{}");

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in environment variables.");
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "서버의 텔레그램 환경변수(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID) 설정이 누락되었습니다.",
        }),
      };
    }

    if (!text) {
      return { statusCode: 400, body: JSON.stringify({ error: "전송할 메시지가 없습니다." }) };
    }

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const chatIds = chatId.split(",").map((id) => id.trim()).filter(Boolean);

    const sendPromises = chatIds.map(async (id) => {
      try {
        const response = await fetch(telegramUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: id, text }),
        });
        const result = await response.json();
        if (!result.ok) {
          console.error(`Telegram API Error for chatId ${id}:`, result);
        }
      } catch (err) {
        console.error(`Fetch error for chatId ${id}:`, err);
      }
    });

    await Promise.all(sendPromises);

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("API Error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "서버 에러가 발생했습니다." }) };
  }
};
