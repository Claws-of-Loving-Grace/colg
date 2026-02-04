type ScanResult = {
  ok: boolean;
  category: string;
  scores?: Record<string, number>;
};

type ScanEnv = {
  OPENAI_API_KEY?: string;
  SCAN_DISABLE?: string;
};

const HOMOGLYPHS: Record<string, string> = {
  А: "A",
  В: "B",
  С: "C",
  Е: "E",
  Н: "H",
  І: "I",
  Ј: "J",
  К: "K",
  М: "M",
  О: "O",
  Р: "P",
  Т: "T",
  Х: "X",
  Ү: "Y",
  а: "a",
  с: "c",
  е: "e",
  о: "o",
  р: "p",
  х: "x",
  у: "y",
  Α: "A",
  Β: "B",
  Ε: "E",
  Ζ: "Z",
  Η: "H",
  Ι: "I",
  Κ: "K",
  Μ: "M",
  Ν: "N",
  Ο: "O",
  Ρ: "P",
  Τ: "T",
  Χ: "X",
  Υ: "Y",
  α: "a",
  β: "b",
  ε: "e",
  η: "n",
  ι: "i",
  κ: "k",
  ο: "o",
  ρ: "p",
  τ: "t",
  υ: "y",
  χ: "x",
};

const ZERO_WIDTH_RE = /[\u200B-\u200D\u2060\uFEFF]/g;
const DOT_FORMS_RE = /(\(dot\)|\[dot\]|\{dot\})/gi;
const DOT_WORD_RE = /\b\s*dot\s*\b/gi;
const URL_RE =
  /(https?:\/\/[^\s]+|\b[a-z0-9.-]+\.[a-z]{2,}(?:\/[\w\-.~:/?#\[\]@!$&'()*+,;=%]*)?)/gi;
const DENYLIST = [
  "bit.ly",
  "t.co",
  "t.me",
  "discord.gg",
  "discord.com/invite",
  "goo.gl",
  "tinyurl.com",
  "cutt.ly",
  "rebrand.ly",
  "linktr.ee",
  "lnkd.in",
];

const SHILL_RE =
  /(crypto|bitcoin|ethereum|nft|airdrop|web3|blockchain|casino|gambl|sportsbook|betting|forex|binary options|poker|slots|dm\s*me|dm\s*for|direct message|investment opportunity|guaranteed returns|double your|earn\s*\$?\d+\s*(?:\/|per)\s*(?:day|week)|telegram|whatsapp|signal me)/i;

function normalizeText(input: string) {
  const replaced = input
    .replace(ZERO_WIDTH_RE, "")
    .replace(DOT_FORMS_RE, ".")
    .replace(DOT_WORD_RE, ".")
    .replace(/[•·]/g, ".")
    .replace(/[\u0400-\u04FF\u0370-\u03FF]/g, (char) => HOMOGLYPHS[char] ?? char);

  return replaced;
}

function hasSpamLinks(normalized: string) {
  const matches = normalized.match(URL_RE) ?? [];
  const tooMany = matches.length > 2;
  const lower = normalized.toLowerCase();
  const denylisted = DENYLIST.some((domain) => lower.includes(domain));
  return { tooMany, denylisted, count: matches.length };
}

function checkShill(normalized: string) {
  return SHILL_RE.test(normalized);
}

function isScanDisabled(env: ScanEnv) {
  const flag = env.SCAN_DISABLE?.toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes";
}

export async function scanText(env: ScanEnv, content: string): Promise<ScanResult> {
  const normalized = normalizeText(content);

  const linkCheck = hasSpamLinks(normalized);
  if (linkCheck.tooMany) {
    return { ok: false, category: "link_spam" };
  }
  if (linkCheck.denylisted) {
    return { ok: false, category: "denylisted_link" };
  }
  if (checkShill(normalized)) {
    return { ok: false, category: "shill_scam" };
  }

  if (isScanDisabled(env)) {
    return { ok: true, category: "ok" };
  }

  const apiKey = env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, category: "moderation_unavailable" };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "omni-moderation-latest",
        input: normalized,
      }),
    });

    if (!response.ok) {
      return { ok: false, category: "moderation_unavailable" };
    }

    const data = (await response.json()) as {
      results?: Array<{
        categories?: Record<string, boolean>;
        category_scores?: Record<string, number>;
      }>;
    };

    const result = data.results?.[0];
    const scores = result?.category_scores ?? {};

    const strict = new Set([
      "hate",
      "hate/threatening",
      "self-harm",
      "self-harm/intent",
      "self-harm/instructions",
      "sexual/minors",
    ]);
    const lenient = new Set([
      "violence",
      "violence/graphic",
      "harassment",
      "harassment/threatening",
      "sexual",
      "illicit",
      "illicit/violent",
    ]);

    for (const [category, score] of Object.entries(scores)) {
      const threshold = strict.has(category) ? 0.05 : lenient.has(category) ? 0.4 : 0.5;
      if (score >= threshold) {
        return { ok: false, category, scores };
      }
    }

    if (result?.categories) {
      for (const [category, flagged] of Object.entries(result.categories)) {
        if (flagged && strict.has(category)) {
          return { ok: false, category, scores };
        }
      }
    }

    return { ok: true, category: "ok", scores };
  } catch {
    return { ok: false, category: "moderation_unavailable" };
  }
}
