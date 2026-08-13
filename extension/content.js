function parseVisibleProfiles() {
  const found = new Map();
  for (const anchor of document.querySelectorAll('a[href^="/@"]')) {
    const href = anchor.getAttribute("href") || "";
    if (!/^\/@[^/]+\/?(?:\?.*)?$/.test(href)) continue;
    const username = decodeURIComponent(href.slice(2).split(/[/?#]/)[0] || "");
    if (!username || found.has(username)) continue;

    const pagelet = anchor.closest('[data-pagelet*="threads_search_user_results"]');
    let card = pagelet;
    if (!card && anchor.querySelector("img") && anchor.textContent?.includes(username)) card = anchor;
    if (!card) {
      let parent = anchor.parentElement;
      for (let depth = 0; depth < 9 && parent; depth += 1, parent = parent.parentElement) {
        const image = Array.from(parent.querySelectorAll("img")).some((item) => item.alt?.includes(username));
        const resultText = parent.textContent?.includes(username) &&
          (parent.textContent.includes("팔로우") || parent.textContent.includes("팔로워"));
        if (image && resultText) { card = parent; break; }
      }
    }
    if (!card) continue;

    const bio = card.querySelector('span[style*="-webkit-line-clamp: 3"]')?.textContent?.trim() || "";
    const followerElement = Array.from(card.querySelectorAll("span[title]"))
      .find((element) => /^\d[\d,.]*$/.test(element.title) && element.parentElement?.textContent?.includes("팔로워"));
    const followerCount = followerElement ? Number(followerElement.title.replace(/[^\d]/g, "")) : null;
    const texts = Array.from(card.querySelectorAll('span[dir="auto"]'))
      .map((element) => element.textContent?.trim() || "")
      .filter((text, index, all) => text && all.indexOf(text) === index);
    const displayName = texts.find((text) =>
      text !== username && text !== bio && text !== "팔로우" && !text.startsWith("팔로워 ")) || "";

    found.set(username, {
      username,
      displayName,
      bio,
      followerCount: Number.isFinite(followerCount) ? followerCount : null,
      verified: Boolean(card.querySelector('svg[aria-label*="인증"], svg[aria-label*="Verified"]')),
      url: `https://www.threads.com/@${username}`,
    });
  }
  return Array.from(found.values());
}

function collectVisibleProfiles() {
  const url = new URL(location.href);
  const query = url.searchParams.get("q")?.trim() || "";
  if (!query) throw new Error("검색어가 있는 Threads 검색 페이지에서 실행해 주세요.");
  return { query, results: parseVisibleProfiles() };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "COLLECT_VISIBLE_PROFILES") return;
  try {
    const { query, results } = collectVisibleProfiles();
    sendResponse({ ok: true, query, count: results.length, results });
  } catch (error) {
    sendResponse({ ok: false, message: error instanceof Error ? error.message : "수집 실패" });
  }
});
