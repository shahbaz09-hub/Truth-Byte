export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

// ─────────────────────────────────────────────────────────────────────────────
// TOKEN & USER INFO MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

export function getAuthToken() {
  return localStorage.getItem("truthbyte_token");
}

export function setAuthToken(token: string) {
  localStorage.setItem("truthbyte_token", token);
}

export function removeAuthToken() {
  localStorage.removeItem("truthbyte_token");
  localStorage.removeItem("truthbyte_user");
}

export function setUserInfo(user: { id: string; email: string; fullName: string }) {
  localStorage.setItem("truthbyte_user", JSON.stringify(user));
}

export function getUserInfo(): { id: string; email: string; fullName: string } | null {
  try {
    const raw = localStorage.getItem("truthbyte_user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function authHeaders() {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }
  } catch {
    // Ignore parse errors and use fallback message.
  }
  return fallback;
}

async function safeFetch(input: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch {
    throw new Error(
      "Cannot reach backend server. Start backend and verify VITE_API_BASE_URL points to a running API."
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────

export async function loginUser(email: string, password: string) {
  const res = await safeFetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "Login failed. Check your credentials."));
  const data = await res.json();
  setAuthToken(data.token);
  setUserInfo({ id: data.id, email: data.email, fullName: data.fullName });
  return data;
}

export async function registerUser(fullName: string, email: string, password: string) {
  const res = await safeFetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fullName, email, password })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Registration failed");
  }
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. CLAIM VERIFIER
// ─────────────────────────────────────────────────────────────────────────────

export interface ClaimAnalysisResult {
  verdict: "TRUE" | "FALSE" | "MISLEADING";
  confidence: number;
  summary: string;
  keyPoints: string[];
  sources: string[];
  claimText?: string;
  createdAt?: string;
}

export async function analyzeClaimWithAI(claim: string): Promise<ClaimAnalysisResult> {
  const res = await safeFetch(`${API_BASE_URL}/verify/claim`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ claim })
  });
  
  if (res.status === 403 || res.status === 401) {
    throw new Error("Authentication required. Please Login to Verify Claims.");
  }
  
  if (!res.ok) throw new Error(await readErrorMessage(res, "Fact-check failed. Backend error."));
  return res.json();
}

export async function fetchClaimHistory(): Promise<ClaimAnalysisResult[]> {
  const res = await safeFetch(`${API_BASE_URL}/verify/history`, {
    headers: authHeaders()
  });
  if (res.status === 401 || res.status === 403) return [];
  if (!res.ok) throw new Error(await readErrorMessage(res, "Failed to fetch claim history."));
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. URL ANALYZER
// ─────────────────────────────────────────────────────────────────────────────

export interface URLAnalysisResult {
  url: string;
  domain: string;
  title: string;
  politicalBias: number;
  factOpinionRatio: { fact: number; opinion: number };
  manipulativeWords: string[];
  credibilityScore: number;
  summary: string;
  createdAt?: string;
}

export async function analyzeURLWithAI(url: string): Promise<URLAnalysisResult> {
  const res = await safeFetch(`${API_BASE_URL}/analyze/url`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ url })
  });
  
  if (res.status === 403 || res.status === 401) {
    throw new Error("Authentication required. Please Login to Analyze URLs.");
  }

  if (!res.ok) throw new Error(await readErrorMessage(res, "URL Analysis failed."));
  const data = await res.json();
  return { ...data, url };
}

export async function fetchUrlHistory(): Promise<URLAnalysisResult[]> {
  const res = await safeFetch(`${API_BASE_URL}/analyze/history`, {
    headers: authHeaders()
  });
  if (res.status === 401 || res.status === 403) return [];
  if (!res.ok) throw new Error(await readErrorMessage(res, "Failed to fetch URL history."));
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. COMMUNITY REPORTS
// ─────────────────────────────────────────────────────────────────────────────

export type CommunityStatus = "PENDING" | "VERIFIED" | "FAKE";
export type CommunityCategory = "Health" | "Politics" | "Finance" | "Tech";

export interface CommunityReport {
  id: number;
  claim: string;
  category: CommunityCategory;
  status: CommunityStatus;
  reportedBy: string;
  date: string;
  votes: number;
}

export async function fetchTrendingReportsWithAI(): Promise<CommunityReport[]> {
  const res = await safeFetch(`${API_BASE_URL}/community/trending`, {
    headers: authHeaders()
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "Failed to load trending reports."));
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. SEARCH
// ─────────────────────────────────────────────────────────────────────────────

export interface SearchResult {
  id: string;
  claim: string;
  verdict: "TRUE" | "FALSE" | "MISLEADING";
  date: string;
  confidence: number;
  snippet: string;
}

export async function searchClaimsWithAI(query: string): Promise<SearchResult[]> {
  const res = await safeFetch(`${API_BASE_URL}/search/claims?q=${encodeURIComponent(query)}`, {
    headers: { "Content-Type": "application/json" }
  });

  if (!res.ok) throw new Error(await readErrorMessage(res, "Search failed. Please try again."));
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. INTEGRATIONS (WHATSAPP/TELEGRAM)
// ─────────────────────────────────────────────────────────────────────────────

export interface BotIngestRequest {
  platform: "WHATSAPP" | "TELEGRAM";
  chatType: "PRIVATE" | "GROUP";
  chatId: string;
  groupName?: string;
  senderId?: string;
  text: string;
  language?: string;
  region?: string;
}

export interface BotIngestResponse {
  id: string;
  platform: string;
  chatId: string;
  groupName?: string;
  detectedLanguage: string;
  verdict: "TRUE" | "FALSE" | "MISLEADING";
  confidence: number;
  summary: string;
  occurrenceCount: number;
  viral: boolean;
  createdAt?: string;
}

export async function ingestForwardedMessage(payload: BotIngestRequest): Promise<BotIngestResponse> {
  const res = await safeFetch(`${API_BASE_URL}/integrations/messages/ingest`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "Failed to ingest forwarded message."));
  return res.json();
}

