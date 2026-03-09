const API = {
  async request(url, options = {}) {
    const token = localStorage.getItem("docuhub_token");
    const headers = { ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(url, { ...options, headers });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.message || "Request failed");
    }
    return payload;
  },

  get(url) {
    return API.request(url);
  },

  post(url, body, isForm = false) {
    return API.request(url, {
      method: "POST",
      headers: isForm ? {} : { "Content-Type": "application/json" },
      body: isForm ? body : JSON.stringify(body)
    });
  },

  put(url, body, isForm = false) {
    return API.request(url, {
      method: "PUT",
      headers: isForm ? {} : { "Content-Type": "application/json" },
      body: isForm ? body : JSON.stringify(body)
    });
  },

  delete(url) {
    return API.request(url, { method: "DELETE" });
  }
};
