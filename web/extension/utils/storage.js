// InstaClean Storage Wrapper — chrome.storage.local
const Storage = {
  async get(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (result) => resolve(result[key] || null));
    });
  },

  async set(key, value) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, resolve);
    });
  },

  async getState() {
    return (await this.get("ic_state")) || {
      status: "idle",
      usernames: [],
      completed: [],
      config: null,
      stats: { cancelled: 0, skipped: 0, failed: 0 },
      currentIndex: 0,
      currentUsername: "",
      startTime: 0,
      total: 0,
    };
  },

  async saveState(state) {
    await this.set("ic_state", state);
  },

  async getHistory() {
    return (await this.get("ic_history")) || [];
  },

  async addHistory(entry) {
    const history = await this.getHistory();
    history.unshift(entry);
    await this.set("ic_history", history.slice(0, 20));
  },

  async clearProgress() {
    const state = await this.getState();
    state.completed = [];
    state.stats = { cancelled: 0, skipped: 0, failed: 0 };
    state.status = "idle";
    state.currentIndex = 0;
    await this.saveState(state);
  },
};
