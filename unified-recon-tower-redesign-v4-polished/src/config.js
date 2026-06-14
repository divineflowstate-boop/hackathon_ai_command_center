// One switch for the demo.
// true  = use local mock responses
// false = call Moneta Boot API endpoint below
export const USE_MOCK_RESPONSES = true;
export const API_BASE_URL = process.env.REACT_APP_RECON_API_URL || 'http://localhost:8080';
export const ASK_ENDPOINT = '/api/recon/ask';
