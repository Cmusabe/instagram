// InstaClean Instagram API — runs in content script context on instagram.com
const InstagramAPI = {
  APP_ID: "936619743392459",
  idCache: new Map(),

  getPageHtml() {
    return document.documentElement?.innerHTML || document.body?.innerHTML || "";
  },

  getCsrfToken() {
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : null;
  },

  getRolloutHash() {
    const match = this.getPageHtml().match(/"rollout_hash":"([^"]+)"/i);
    return match ? match[1] : "";
  },

  getAppId() {
    const match = this.getPageHtml().match(/"X-IG-App-ID":"([^"]+)"/i);
    return match ? match[1] : this.APP_ID;
  },

  getAsbdId() {
    const html = this.getPageHtml();
    const patterns = [
      /"X-ASBD-ID":"([^"]+)"/i,
      /"x-asbd-id":"([^"]+)"/i,
      /"ASBD_ID":"([^"]+)"/i,
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) return match[1];
    }
    return "129477";
  },

  buildHeaders() {
    const csrf = this.getCsrfToken();
    const headers = {
      "x-ig-app-id": this.getAppId(),
      "x-requested-with": "XMLHttpRequest",
      "x-csrftoken": csrf || "",
      "x-asbd-id": this.getAsbdId(),
      "content-type": "application/x-www-form-urlencoded",
    };

    const claim = sessionStorage.getItem("www-claim-v2") || sessionStorage.getItem("www-claim") || "";
    if (claim) headers["x-ig-www-claim"] = claim;

    const rolloutHash = this.getRolloutHash();
    if (rolloutHash) headers["x-instagram-ajax"] = rolloutHash;

    return headers;
  },

  async fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  },

  async parseResponse(res) {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  },

  getResponseSummary(payload) {
    if (!payload) return "";

    const message = payload.message
      || payload.error?.message
      || payload.error_message
      || payload.feedback_message
      || payload.error_title
      || payload.status
      || payload.raw
      || "";

    return String(message).slice(0, 180);
  },

  classifyHttpError(status, payload = null) {
    const summary = this.getResponseSummary(payload).toLowerCase();
    const errorType = String(payload?.error_type || payload?.error?.type || "").toLowerCase();

    if (status === 401 || summary.includes("login_required")) return "auth_required";
    if (summary.includes("checkpoint_required") || errorType.includes("checkpoint")) return "checkpoint_required";
    if (summary.includes("challenge_required") || errorType.includes("challenge")) return "challenge_required";
    if (summary.includes("feedback_required") || errorType.includes("feedback")) return "feedback_required";
    if (summary.includes("csrf") || summary.includes("forbidden")) return "csrf_rejected";
    if (status === 429 || summary.includes("please wait") || summary.includes("try again later")) return "rate_limited";
    if (status === 403) return "instagram_blocked";
    if (status === 404) return "not_found";
    if (status >= 500) return "instagram_unavailable";
    if (status === 400) return "bad_request";
    return "http_error";
  },

  isRetryableReason(reason) {
    return ["rate_limited", "feedback_required", "instagram_unavailable", "request_failed", "timeout"].includes(reason);
  },

  isFatalReason(reason) {
    return ["auth_required", "checkpoint_required", "challenge_required", "csrf_rejected", "no_csrf"].includes(reason);
  },

  buildHttpError(stage, res, data, reason = null) {
    const normalizedReason = reason || this.classifyHttpError(res.status, data);
    return {
      ok: false,
      reason: normalizedReason,
      stage,
      status: res.status,
      detail: `${stage} HTTP ${res.status}${data ? `: ${this.getResponseSummary(data)}` : ""}`,
      retryable: this.isRetryableReason(normalizedReason),
      fatal: this.isFatalReason(normalizedReason),
      retryAfterMs: this.getRetryAfterMs(res, data),
      data,
    };
  },

  buildRequestError(stage, error) {
    const name = error?.name || "Error";
    const message = error?.message || "Request failed";
    const reason = name === "AbortError" ? "timeout" : "request_failed";
    return {
      ok: false,
      reason,
      stage,
      detail: `${stage} ${name}: ${message}`.slice(0, 220),
      retryable: true,
      fatal: false,
    };
  },

  getRetryAfterMs(res, payload = null) {
    const retryAfterHeader = res.headers?.get?.("retry-after");
    const headerSeconds = Number.parseInt(retryAfterHeader || "", 10);
    if (Number.isFinite(headerSeconds) && headerSeconds > 0) {
      return headerSeconds * 1000;
    }

    const payloadSeconds = Number.parseInt(payload?.retry_after || payload?.retry_after_seconds || "", 10);
    if (Number.isFinite(payloadSeconds) && payloadSeconds > 0) {
      return payloadSeconds * 1000;
    }

    return null;
  },

  buildGetHeaders() {
    const headers = this.buildHeaders();
    delete headers["content-type"];
    return headers;
  },

  getUserFromPayload(payload) {
    if (!payload || typeof payload !== "object") return null;
    if (payload.data?.user) return payload.data.user;
    if (payload.user) return payload.user;
    if (payload.users?.[0]) return payload.users[0];
    if (payload.friendship_status) return payload;
    return null;
  },

  extractRelationshipState(payload) {
    const user = this.getUserFromPayload(payload);
    const friendship = user?.friendship_status || payload?.friendship_status || {};

    const requestedCandidates = [
      user?.requested_by_viewer,
      user?.has_requested_viewer,
      user?.outgoing_request,
      friendship?.requested_by_viewer,
      friendship?.has_requested_viewer,
      friendship?.outgoing_request,
      friendship?.is_outgoing_request_pending,
    ];

    const followedByViewerCandidates = [
      user?.followed_by_viewer,
      user?.viewer_follows_user,
      user?.is_following_viewer,
      friendship?.following,
      friendship?.followed_by_viewer,
    ];

    const followsViewerCandidates = [
      user?.follows_viewer,
      friendship?.followed_by,
      friendship?.follows_viewer,
    ];

    const findBool = (values) => values.find((value) => typeof value === "boolean");
    const requestedValue = findBool(requestedCandidates);
    const followedByViewerValue = findBool(followedByViewerCandidates);

    return {
      id: user?.id || payload?.user_id || payload?.pk || null,
      requested: requestedValue === true,
      requestedKnown: typeof requestedValue === "boolean",
      followedByViewer: followedByViewerValue,
      followedByViewerKnown: typeof followedByViewerValue === "boolean",
      followsViewer: findBool(followsViewerCandidates),
      rawUser: user,
    };
  },

  isLoggedIn() {
    return !!this.getCsrfToken();
  },

  async getUserProfile(username) {
    try {
      const res = await this.fetchWithTimeout(
        `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
        {
          headers: this.buildGetHeaders(),
          credentials: "include",
        }
      );

      if (res.status === 404) return { ok: false, reason: "not_found" };
      if (res.status === 429 || res.status === 403) {
        const data = await this.parseResponse(res);
        return this.buildHttpError("profile", res, data);
      }
      if (!res.ok) {
        const data = await this.parseResponse(res);
        return this.buildHttpError("profile", res, data);
      }

      const data = await res.json();
      const state = this.extractRelationshipState(data);
      const id = state.id;
      if (id) {
        this.idCache.set(username, id);
        return {
          ok: true,
          id,
          requested: state.requested,
          requestedKnown: state.requestedKnown,
          followedByViewer: state.followedByViewer,
          followedByViewerKnown: state.followedByViewerKnown,
          followsViewer: state.followsViewer,
        };
      }
      return {
        ok: false,
        reason: "no_id",
        stage: "profile",
        detail: "profile: Instagram response bevat geen user id",
        retryable: false,
        fatal: false,
      };
    } catch (e) {
      return this.buildRequestError("profile", e);
    }
  },

  async getUserId(username) {
    const profile = await this.getUserProfile(username);
    if (!profile.ok) return profile;
    return { ok: true, id: profile.id };
  },

  async verifyRequestState(username) {
    const profile = await this.getUserProfile(username);
    if (!profile.ok) return profile;
    return {
      ok: true,
      id: profile.id,
      requested: profile.requested,
      requestedKnown: profile.requestedKnown,
      followedByViewer: profile.followedByViewer,
      followedByViewerKnown: profile.followedByViewerKnown,
      followsViewer: profile.followsViewer,
    };
  },

  async postCancelRequest(url, userId) {
    const csrf = this.getCsrfToken();
    if (!csrf) {
      return {
        ok: false,
        reason: "no_csrf",
        stage: url.includes("/web/friendships/") ? "cancel_web" : "cancel_destroy",
        detail: "Geen Instagram CSRF-token gevonden. Log opnieuw in op Instagram.",
        retryable: false,
        fatal: true,
      };
    }

    try {
      const body = new URLSearchParams({
        container_module: "profile",
        nav_chain: "PolarisProfileRoot:profilePage:1:via_cold_start",
        user_id: String(userId),
      });

      const res = await this.fetchWithTimeout(
        url,
        {
          method: "POST",
          headers: this.buildHeaders(),
          credentials: "include",
          mode: "cors",
          body: body.toString(),
        }
      );

      const data = await this.parseResponse(res);

      if (res.status === 429 || res.status === 403) {
        return this.buildHttpError(url.includes("/web/friendships/") ? "cancel_web" : "cancel_destroy", res, data);
      }
      if (!res.ok) {
        return this.buildHttpError(url.includes("/web/friendships/") ? "cancel_web" : "cancel_destroy", res, data);
      }

      return { ok: true, status: res.status, data };
    } catch (e) {
      return this.buildRequestError(url.includes("/web/friendships/") ? "cancel_web" : "cancel_destroy", e);
    }
  },

  async cancelFollowRequest(userId, username) {
    const primary = await this.postCancelRequest(
      `https://i.instagram.com/api/v1/web/friendships/${userId}/unfollow/`,
      userId
    );

    if (!primary.ok && (primary.retryable || primary.fatal)) return primary;

    let verification = await this.verifyRequestState(username);
    if (verification.ok && verification.requestedKnown && verification.requested === false && verification.followedByViewer === true) {
      return { ok: false, reason: "already_following", via: "web_unfollow", verification };
    }
    if (verification.ok && verification.requestedKnown && verification.requested === false) {
      return { ok: true, via: "web_unfollow", verification };
    }

    const fallback = await this.postCancelRequest(
      `https://www.instagram.com/api/v1/friendships/destroy/${userId}/`,
      userId
    );

    if (!fallback.ok && (fallback.retryable || fallback.fatal)) return fallback;

    verification = await this.verifyRequestState(username);
    if (verification.ok && verification.requestedKnown && verification.requested === false && verification.followedByViewer === true) {
      return { ok: false, reason: "already_following", via: "destroy", verification };
    }
    if (verification.ok && verification.requestedKnown && verification.requested === false) {
      return { ok: true, via: "destroy", verification };
    }

    if (verification.ok && verification.requestedKnown && verification.requested === true) {
      return {
        ok: false,
        reason: "verification_failed",
        stage: "verify",
        detail: "Instagram bevestigde na de cancel-call dat de request nog steeds pending is.",
        primary,
        fallback,
        verification,
      };
    }

    return fallback.ok
      ? {
          ok: false,
          reason: "verification_failed",
          stage: "verify",
          detail: verification.ok
            ? "Instagram response bevat geen betrouwbaar veld om te bevestigen dat de request weg is."
            : (verification.detail || "Instagram kon de annulering niet verifiëren."),
          primary,
          fallback,
          verification,
        }
      : fallback;
  },
};
