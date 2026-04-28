// InstaClean Parser — extract usernames from Instagram data exports
const Parser = {
  cleanCandidate(value) {
    return String(value || "")
      .trim()
      .replace(/^@+/, "")
      .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
      .split(/[/?#]/)[0]
      .trim();
  },

  parseHTML(html) {
    const regex = /instagram\.com\/([^"'\/\s<>]+)/g;
    const matches = [];
    let m;
    while ((m = regex.exec(html)) !== null) {
      const u = this.cleanCandidate(m[1]);
      if (!u.startsWith("http") && !u.startsWith("www") && !["files","accounts","api","static","explore","p","reel","stories"].includes(u) && u.length > 0) {
        matches.push(u);
      }
    }
    return this.dedupe(matches);
  },

  parseJSON(json) {
    try {
      const data = JSON.parse(json);
      const usernames = [];
      const extract = (obj) => {
        if (typeof obj === "string") {
          const t = obj.trim();
          if (t.length > 0 && t.length < 50 && !t.includes(" ") && !t.startsWith("http") && !t.includes("/")) {
            usernames.push(t);
          }
          return;
        }
        if (Array.isArray(obj)) { obj.forEach(extract); return; }
        if (obj && typeof obj === "object") {
          if (typeof obj.value === "string") { usernames.push(obj.value); }
          else if (typeof obj.username === "string") { usernames.push(obj.username); }
          else {
            for (const key of Object.keys(obj)) {
              if (["string_list_data","relationships_follow_requests_sent","pending_follow_requests"].includes(key) || Array.isArray(obj[key]) || (typeof obj[key] === "object" && obj[key] !== null)) {
                extract(obj[key]);
              }
            }
          }
        }
      };
      extract(data);
      return this.dedupe(usernames);
    } catch { return []; }
  },

  parseText(text) {
    return this.dedupe(
      text
        .split(/[\n,;\t ]+/)
        .map(l => this.cleanCandidate(l))
        .filter(l => l.length > 0 && !l.startsWith("#"))
    );
  },

  parseFile(content, filename) {
    const ext = filename.toLowerCase().split(".").pop();
    if (ext === "json") return this.parseJSON(content);
    if (ext === "html" || ext === "htm") return this.parseHTML(content);
    if (ext === "txt" || ext === "csv") return this.parseText(content);
    const trimmed = content.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) return this.parseJSON(content);
    if (trimmed.startsWith("<")) return this.parseHTML(content);
    return this.parseText(content);
  },

  validate(name) {
    if (!name || name.length > 30) return false;
    return /^[a-zA-Z0-9._]+$/.test(name) && !name.startsWith(".") && !name.endsWith(".");
  },

  validateAll(names) {
    const seen = new Set();
    const valid = [], invalid = [];
    let dupes = 0;
    for (const raw of names) {
      const n = this.cleanCandidate(raw).toLowerCase();
      if (!n) continue;
      if (seen.has(n)) { dupes++; continue; }
      seen.add(n);
      if (this.validate(n)) valid.push(n); else invalid.push(n);
    }
    return { valid, invalid, duplicatesRemoved: dupes };
  },

  dedupe(arr) {
    return [...new Set(arr)].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  },
};
