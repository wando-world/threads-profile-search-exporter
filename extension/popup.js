const button = document.querySelector("#collect");
const status = document.querySelector("#status");

button.addEventListener("click", async () => {
  button.disabled = true;
  status.className = "";
  status.textContent = "현재 검색 결과를 가져오는 중입니다.";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url?.startsWith("https://www.threads.com/search")) {
      throw new Error("Threads 검색 탭에서 실행해 주세요.");
    }

    const response = await chrome.tabs.sendMessage(tab.id, { type: "COLLECT_VISIBLE_PROFILES" });
    if (!response?.ok) throw new Error(response?.message || "결과를 수집하지 못했습니다.");

    status.textContent = `${response.count}명을 수집했습니다. 앱으로 전송 중…`;
    const upload = await fetch("http://localhost:5000/api/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: response.query, results: response.results }),
    });
    const data = await upload.json();
    if (!upload.ok) throw new Error(data.message || "로컬 앱 전송에 실패했습니다.");

    status.className = "success";
    status.textContent = `완료: ${data.count}명을 앱으로 전송했습니다.`;
  } catch (error) {
    status.className = "error";
    status.textContent = error instanceof Error ? error.message : "오류가 발생했습니다.";
  } finally {
    button.disabled = false;
  }
});
