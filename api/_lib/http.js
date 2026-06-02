export function json(data, init = {}) {
  return Response.json(data, {
    status: init.status ?? 200,
    headers: {
      'Cache-Control': 'no-store',
      ...(init.headers ?? {}),
    },
  });
}

export function methodNotAllowed() {
  return json({ error: 'Método no permitido.' }, { status: 405 });
}

export function optionsResponse() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function readJsonBody(request) {
  try {
    return await request.json();
  } catch {
    throw new Error('Body JSON inválido.');
  }
}
