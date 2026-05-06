(function () {
  const API_BASE_URL = "http://localhost:3001";
  const AUTH_TOKEN_KEY = "aistar_auth_token";
  const startedAt = Date.now();

  function token() {
    try {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  function reportOlympicGameResult(payload) {
    const authToken = token();
    if (!authToken || !payload?.game_slug) return Promise.resolve(null);

    const durationSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
    return fetch(`${API_BASE_URL}/api/game-records`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        status: "completed",
        duration_seconds: durationSeconds,
        ...payload,
        metadata: {
          page_url: location.pathname,
          ...(payload.metadata || {})
        }
      })
    })
      .then((response) => {
        if (!response.ok) throw new Error(`game_record_${response.status}`);
        return response.json();
      })
      .catch((error) => {
        console.warn("Olympic game record failed.", error);
        return null;
      });
  }

  window.reportOlympicGameResult = reportOlympicGameResult;
})();
