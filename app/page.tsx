"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { SearchResponse, ThreadsAccount } from "@/lib/types";

type ResultResponse = SearchResponse & { receivedAt: string | null };

export default function Home() {
  const [query, setQuery] = useState("");
  const [searchedQuery, setSearchedQuery] = useState("");
  const [results, setResults] = useState<ThreadsAccount[]>([]);
  const [receivedAt, setReceivedAt] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const lastReceivedAt = useRef<string | null>(null);

  async function copyProfileLinks() {
    try {
      await navigator.clipboard.writeText(results.map((account) => account.url).join("\n"));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      setError("링크를 복사하지 못했습니다. 브라우저의 클립보드 권한을 확인해 주세요.");
    }
  }

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/results", { cache: "no-store" });
        const data = await response.json() as ResultResponse;
        if (!data.receivedAt || data.receivedAt === lastReceivedAt.current) return;
        lastReceivedAt.current = data.receivedAt;
        setReceivedAt(data.receivedAt);
        setSearchedQuery(data.query);
        setQuery(data.query);
        setResults(data.results);
        setWaiting(false);
        setError("");
      } catch { /* 다음 polling에서 다시 시도합니다. */ }
    };
    void load();
    const timer = window.setInterval(load, 2_000);
    return () => window.clearInterval(timer);
  }, []);

  function openThreadsSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    const url = new URL("https://www.threads.com/search");
    url.searchParams.set("q", value);
    url.searchParams.set("serp_type", "default");
    url.searchParams.set("filter", "profiles");
    window.open(url.toString(), "threads-search", "noopener,noreferrer");
    setSearchedQuery(value);
    setResults([]);
    setReceivedAt(null);
    setWaiting(true);
    setError("");
  }

  return (
    <main>
      {results.length > 0 && (
        <section className="profileLinks">
          <div className="profileLinksHeader">
            <div><span>수집한 프로필 링크</span><strong>{results.length}개</strong></div>
            <button type="button" onClick={copyProfileLinks}>{copied ? "복사 완료 ✓" : "전체 링크 복사"}</button>
          </div>
          <div className="profileLinkList">
            {results.map((account) => (
              <a href={account.url} target="_blank" rel="noreferrer" key={`link-${account.username}`}>{account.url}</a>
            ))}
          </div>
        </section>
      )}
      <section className="hero">
        <span className="eyebrow">THREADS PEOPLE SEARCH</span>
        <h1>관심 있는 사람을<br />더 빠르게 발견하세요.</h1>
        <p>일반 Chrome의 Threads 검색 결과를 확장 프로그램으로 수집합니다.</p>
        <form onSubmit={openThreadsSearch} className="searchForm">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" /></svg>
          <input value={query} onChange={(event) => setQuery(event.target.value)} maxLength={80} placeholder="예: N잡러, 디자인, 개발자" aria-label="Threads 계정 검색어" />
          <button disabled={!query.trim()}>Threads에서 열기</button>
        </form>
        <p className="loginHelp">검색 결과가 표시되면 확장 프로그램의 ‘현재 결과 가져오기’ 버튼을 누르세요.</p>
      </section>

      <section className="results" aria-live="polite">
        {error && <div className="notice error">{error}</div>}
        {waiting && <div className="loading"><i /><i /><i /><span>Chrome 확장 프로그램에서 결과를 가져와 주세요</span></div>}
        {!waiting && searchedQuery && receivedAt && (
          <div className="resultHeader"><div><span>수집 결과</span><h2>“{searchedQuery}”</h2></div><strong>{results.length}명</strong></div>
        )}
        {!searchedQuery && !waiting && <div className="empty"><span>↗</span><h2>검색을 시작해 보세요</h2><p>Threads 탭에서 확장 프로그램이 실제 결과를 수집합니다.</p></div>}
        {!waiting && receivedAt && results.length === 0 && <div className="empty"><h2>검색 결과가 없습니다</h2><p>Threads 검색 화면에도 결과가 없는지 확인해 주세요.</p></div>}
        <div className="grid">
          {results.map((account, index) => (
            <a className="card" href={account.url} target="_blank" rel="noreferrer" key={account.username}>
              <span className="number">{String(index + 1).padStart(2, "0")}</span>
              <div className="accountText">
                <div className="username">@{account.username}{account.verified && <span className="verified" title="인증된 계정">✓</span>}</div>
                <p className="displayName">{account.displayName || "표시 이름 없음"}</p>
                {account.bio && <p className="bio">{account.bio}</p>}
                {account.followerCount !== null && <span className="followers">팔로워 {account.followerCount.toLocaleString("ko-KR")}명</span>}
              </div><span className="arrow">↗</span>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
