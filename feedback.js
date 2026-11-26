export const feedbackSchema = {
  type: 'object',
  properties: {
    german: { type: 'string' },
    english: { type: 'string' }
  },
  required: ['german', 'english']
};

export function readFeedback(text) {
  let response;
  try {
    response = JSON.parse(text);
  } catch {
    throw new Error('feedback-format');
  }
  if (!response || Object.keys(response).length !== 2 ||
      typeof response.german !== 'string' || !response.german.trim() ||
      typeof response.english !== 'string' || !response.english.trim() ||
      response.german.length > 2000 || response.english.length > 900) {
    throw new Error('feedback-format');
  }
  return { german: response.german.trim(), english: response.english.trim() };
}

export function sourceKind(source) {
  if (source === 'ON_DEVICE') return 'device';
  if (source === 'IN_CLOUD') return 'cloud';
  return 'unknown';
}

export function verifiedSource(source, allowCloud) {
  const kind = sourceKind(source);
  if (!allowCloud && kind === 'cloud') throw new Error('unexpected-source');
  return kind;
}

export function withDeadline(work, milliseconds, onTimeout = () => {}) {
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error('feedback-timeout'));
      onTimeout();
    }, milliseconds);
  });
  return Promise.race([work, deadline]).finally(() => clearTimeout(timer));
}

export function feedbackError(error, allowCloud) {
  if (error.message === 'feedback-timeout') {
    return 'The AI request timed out. Your answer is still here. Use the reference or try again.';
  }
  if (error.message === 'feedback-format' || error.message === 'unexpected-source') {
    return 'AI feedback could not be verified. Compare your answer with the reference or try again.';
  }
  if (!allowCloud && /unsupported|api-not-enabled/i.test(error.code ?? '')) {
    return 'On-device AI is unavailable in this browser. Use the reference or enable cloud fallback for fictional practice.';
  }
  if (/429|quota|resource.exhausted/i.test(error.message ?? '')) {
    return 'The AI quota is temporarily unavailable. You can continue with the reference and grammar checks.';
  }
  if (/app.check|403|permission.denied/i.test(error.message ?? '')) {
    return 'The AI request could not be authorized. You can continue with the reference and grammar checks.';
  }
  if (!allowCloud) return 'On-device AI could not finish. Try again on supported desktop Chrome or use the reference.';
  return 'AI could not finish. Check your connection, try again, or use the reference.';
}
