document.getElementById('send').addEventListener('click', async () => {
  const url = document.getElementById('url').value;
  const method = document.getElementById('method').value;
  const headersRaw = document.getElementById('headers').value;
  const body = document.getElementById('body').value;

  let headers = {};
  try {
    headers = headersRaw ? JSON.parse(headersRaw) : {};
  } catch (e) {
    alert("Invalid JSON in headers");
    return;
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: method === 'GET' || method === 'DELETE' ? undefined : body
    });

    const text = await res.text();

    document.getElementById('status').innerText =
      `Status: ${res.status} ${res.statusText}`;
    document.getElementById('response').innerText = text;
  } catch (err) {
    document.getElementById('status').innerText = 'Error';
    document.getElementById('response').innerText = err.message;
  }
});
