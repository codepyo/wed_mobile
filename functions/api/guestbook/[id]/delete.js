const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

export async function onRequestPost() {
  return json({ ok: false, error: 'PRIVATE_LETTERS_ADMIN_ONLY' }, 410);
}
