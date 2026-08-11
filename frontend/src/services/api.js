const API_BASE_URL = 'http://127.0.0.1:5000/api';

export async function processTransactionRoundUp(amount) {
  try {
    const res = await fetch(`${API_BASE_URL}/process-transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parseFloat(amount) })
    });

    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend server offline, running fallback round-up calculation:', err);
    const numericAmount = parseFloat(amount) || 0;
    if (numericAmount <= 0) return { round_up_amount: 0 };
    
    const remainder = numericAmount % 100;
    const roundUp = remainder === 0 ? 0 : 100 - remainder;
    return {
      original_amount: numericAmount,
      round_up_amount: roundUp,
      total_deducted: numericAmount + roundUp
    };
  }
}

export async function getHealthScore(userId) {
  try {
    const res = await fetch(`${API_BASE_URL}/health-score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });

    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching health score from Python server:', err);
    return null;
  }
}