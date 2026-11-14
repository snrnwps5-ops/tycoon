exports.handler = async function (event) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: cors,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: cors,
      body: JSON.stringify({ error: 'GROQ_API_KEY not configured' })
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: payload.model || 'qwen/qwen3.8-27b',
        messages: Array.isArray(payload.messages) ? payload.messages : [],
        max_tokens: payload.max_tokens == null ? 250 : payload.max_tokens,
        temperature: payload.temperature == null ? 0.7 : payload.temperature
      })
    });

    const text = await upstream.text();
    return {
      statusCode: upstream.status,
      headers: cors,
      body: text
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: cors,
      body: JSON.stringify({ error: String(err && err.message ? err.message : err) })
    };
  }
};
