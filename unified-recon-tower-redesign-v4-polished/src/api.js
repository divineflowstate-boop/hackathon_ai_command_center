import { API_BASE_URL, ASK_ENDPOINT, USE_MOCK_RESPONSES } from './config';
import { getMockResponse } from './mockResponses';

export async function askReconTower(question) {
  if (USE_MOCK_RESPONSES) {
    await new Promise((resolve) => setTimeout(resolve, 420));
    return getMockResponse(question);
  }

  const response = await fetch(`${API_BASE_URL}${ASK_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: question
    })
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  return response.json();
}
