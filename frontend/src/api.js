export async function api(path, body) {
  const r = await fetch('/api/' + path, body ? { method: 'POST', body: JSON.stringify(body) } : {});
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || 'Something went wrong');
  return j;
}
