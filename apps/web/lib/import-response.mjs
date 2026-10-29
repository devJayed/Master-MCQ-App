const fallbackMessage = (response) => {
  const status = `HTTP ${response.status}`;
  if (response.status === 413)
    return `The upload is too large (${status}). Split the file into smaller files and validate again.`;
  if (response.status === 401)
    return `Your session has expired (${status}). Sign in again before continuing.`;
  if (response.status === 403)
    return `Import access was denied (${status}). Check that your account has permission to import questions.`;
  if (response.status === 404)
    return `The import endpoint was not found (${status}). Check the API address and deployment.`;
  if (response.status === 429)
    return `Too many requests (${status}). Wait a moment before trying again.`;
  if (response.status >= 500)
    return `The import service is unavailable (${status}). Try again later. If you were importing, check the question bank before retrying.`;
  return `The server returned an unexpected response (${status}). Check the API connection. If you were importing, check the question bank before retrying.`;
};

export async function readImportResponse(response, { requireData = true } = {}) {
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error(fallbackMessage(response));
  }
  const serverMessage = typeof payload?.message === 'string' && payload.message.trim();
  if (!response.ok) throw new Error(serverMessage || fallbackMessage(response));
  if (
    requireData &&
    (!payload?.data || typeof payload.data !== 'object' || Array.isArray(payload.data))
  ) {
    throw new Error(fallbackMessage(response));
  }
  return payload;
}
