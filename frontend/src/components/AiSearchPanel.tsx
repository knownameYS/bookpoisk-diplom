import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, getAccessToken, getApiErrorMessage } from "../api/client";
import { resolveMediaUrl } from "../utils/media";

type AiSearchPanelProps = {
  compact?: boolean;
  title?: string;
  subtitle?: string;
  initialPrompt?: string;
};

type AiSearchResponse = {
  interpreted: {
    source: "ai" | "fallback";
    filters: {
      query?: string;
      genres?: string[];
      tags?: string[];
      author?: string;
      section?: string;
      origin?: "foreign" | "russian";
      language?: string;
      yearFrom?: number;
      yearTo?: number;
      sort?: string;
    };
  };
  assistant?: {
    source: "ai" | "fallback";
    answer: string;
    recommendedBookIds: string[];
  } | null;
  warning?: {
    code: string;
    provider?: string | null;
    providerStatus?: number | null;
    providerMessage?: string | null;
    message: string;
  } | null;
  results: {
    items: Array<{
      id: string;
      title: string;
      authors?: Array<{ id: string; fullName: string }>;
      avgFinalScore?: number;
      ratingCount?: number;
      coverUrl?: string | null;
      aiReason?: string;
      aiMatchType?: "exact" | "fuzzy" | null;
    }>;
  };
};

const promptExamples = [
  "Хочу тревожную атмосферную книгу с сильной идеей и красивым языком",
  "Нужна умная современная проза, после которой хочется подумать",
  "Хочу мрачную книгу с сильной атмосферой и цепким сюжетом",
];

function renderFilterChips(
  filters: AiSearchResponse["interpreted"]["filters"],
) {
  return [
    filters.author ? `Автор: ${filters.author}` : null,
    filters.section ? `Раздел: ${filters.section}` : null,
    filters.language ? `Язык: ${filters.language}` : null,
    filters.yearFrom ? `Год от ${filters.yearFrom}` : null,
    filters.yearTo ? `Год до ${filters.yearTo}` : null,
    ...(filters.genres ?? []).map((genre) => `Жанр: ${genre}`),
    ...(filters.tags ?? []).map((tag) => `Тег: ${tag}`),
  ].filter(Boolean) as string[];
}

function compactPrompt(value: string, maxLength = 180) {
  const normalized = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

function buildAssistantAnswer(
  assistant: AiSearchResponse["assistant"],
  results: AiSearchResponse["results"]["items"],
) {
  const directAnswer = assistant?.answer?.trim();

  if (directAnswer) {
    return directAnswer;
  }

  if (!results.length) {
    return "";
  }

  const byId = new Map(results.map((item) => [item.id, item]));
  const selectedBooks = assistant?.recommendedBookIds?.length
    ? assistant.recommendedBookIds
        .map((id) => byId.get(id))
        .filter((book): book is AiSearchResponse["results"]["items"][number] =>
          Boolean(book),
        )
        .slice(0, 3)
    : results.slice(0, 3);
  const titles = selectedBooks.map((book) => `«${book.title}»`).join(", ");

  return titles ? `Лучше всего под ваш запрос сейчас смотрятся ${titles}.` : "";
}

export function AiSearchPanel({
  compact = false,
  title = "AI-поиск книги",
  subtitle = "Опишите настроение, тему или ощущение, которое хотите получить от чтения",
  initialPrompt = "Хочу атмосферную книгу с сильной идеей и красивым языком",
}: AiSearchPanelProps) {
  const isAuthenticated = Boolean(getAccessToken());
  const [prompt, setPrompt] = useState(initialPrompt);
  const [showAllResults, setShowAllResults] = useState(false);
  const [textareaMinHeight, setTextareaMinHeight] = useState<number | null>(
    null,
  );
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const promptExamplesRef = useRef<HTMLDivElement | null>(null);

  const searchMutation = useMutation({
    mutationFn: async (submittedPrompt: string) =>
      (
        await api.post<AiSearchResponse>("/search/ai", {
          prompt: submittedPrompt,
        })
      ).data,
    onSuccess: () => setShowAllResults(false),
  });

  const filters = searchMutation.data?.interpreted.filters;
  const assistant = searchMutation.data?.assistant;
  const warning = searchMutation.data?.warning;
  const results = searchMutation.data?.results.items ?? [];
  const recommendedIds = new Set(assistant?.recommendedBookIds ?? []);
  const filterChips = filters ? renderFilterChips(filters) : [];
  const compactLimit = compact ? 3 : 5;
  const visibleResults = results.slice(
    0,
    showAllResults ? results.length : compactLimit,
  );
  const submittedPrompt = compactPrompt(searchMutation.variables ?? "");
  const assistantAnswer = buildAssistantAnswer(assistant, results);
  const searchErrorMessage = searchMutation.isError
    ? getApiErrorMessage(
        searchMutation.error,
        "AI-помощник сейчас недоступен. Попробуйте еще раз чуть позже.",
      )
    : "";

  useEffect(() => {
    if (!isAuthenticated) {
      setTextareaMinHeight(null);
      return undefined;
    }

    const textareaNode = textareaRef.current;
    const examplesNode = promptExamplesRef.current;

    if (!textareaNode || !examplesNode) {
      return undefined;
    }

    const baseHeight = compact ? 112 : 144;
    let frameId = 0;

    const syncTextareaHeight = () => {
      if (window.innerWidth < 1024) {
        setTextareaMinHeight(null);
        return;
      }

      const textareaTop = textareaNode.getBoundingClientRect().top;
      const examplesBottom = examplesNode.getBoundingClientRect().bottom;
      const nextHeight = Math.max(
        Math.ceil(examplesBottom - textareaTop),
        baseHeight,
      );

      setTextareaMinHeight((current) =>
        current === nextHeight ? current : nextHeight,
      );
    };

    const scheduleSync = () => {
      cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(syncTextareaHeight);
    };

    scheduleSync();

    const observer = new ResizeObserver(scheduleSync);
    observer.observe(examplesNode);
    window.addEventListener("resize", scheduleSync);

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      window.removeEventListener("resize", scheduleSync);
    };
  }, [compact, isAuthenticated]);

  return (
    <section className="surface-panel overflow-hidden p-5 sm:p-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="section-kicker">AI-помощник</span>
            <h2
              className={
                compact
                  ? "text-2xl font-semibold text-[color:var(--text)]"
                  : "section-title"
              }
            >
              {title}
            </h2>
            <p className="section-subtitle">{subtitle}</p>
          </div>
          {searchMutation.data?.interpreted?.source ? (
            <div className="warm-chip self-start">
              {searchMutation.data.interpreted.source === "ai"
                ? "Подборка через Grok"
                : "Подборка по каталогу"}
            </div>
          ) : null}
        </div>

        {!isAuthenticated ? (
          <div className="surface-card p-5">
            <p className="text-lg font-semibold text-[color:var(--text)]">
              AI-поиск доступен после входа в аккаунт
            </p>
            <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
              После входа можно описать настроение простыми словами и получить
              подборку книг из каталога.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/login" className="btn-primary">
                Войти
              </Link>
              <Link to="/register" className="btn-soft">
                Создать аккаунт
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr] lg:items-start">
              <div
                ref={promptExamplesRef}
                className="surface-card p-4 lg:order-2 lg:-mt-28"
              >
                <p className="text-sm font-semibold text-[color:var(--muted-strong)]">
                  Примеры запросов
                </p>
                <div className="mt-3 grid gap-2">
                  {promptExamples.map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => setPrompt(example)}
                      className="rounded-2xl border border-[color:rgba(255,220,120,0.12)] bg-[color:rgba(255,248,238,0.04)] px-4 py-3 text-left text-sm leading-6 text-[color:var(--muted)] transition hover:border-[color:rgba(255,220,120,0.24)] hover:text-[color:var(--text)]"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:order-1">
                <textarea
                  ref={textareaRef}
                  className={`textarea-modern ${compact ? "min-h-28" : "min-h-36"}`}
                  style={
                    textareaMinHeight
                      ? { minHeight: `${textareaMinHeight}px` }
                      : undefined
                  }
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Например: хочу тревожную, атмосферную книгу с хорошим языком и сильной идеей"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                className="btn-primary"
                onClick={() => {
                  const normalizedPrompt = prompt.trim();

                  if (!normalizedPrompt) {
                    return;
                  }

                  searchMutation.mutate(normalizedPrompt);
                }}
                disabled={searchMutation.isPending || !prompt.trim()}
              >
                {searchMutation.isPending
                  ? "Grok подбирает книги..."
                  : "Подобрать"}
              </button>
              <button
                className="btn-soft"
                onClick={() => setPrompt(initialPrompt)}
                type="button"
              >
                Сбросить пример
              </button>
            </div>
          </div>
        )}

        {isAuthenticated && searchMutation.isError ? (
          <div className="surface-card border border-[color:rgba(255,120,92,0.3)] bg-[linear-gradient(135deg,rgba(117,32,22,0.28),rgba(31,24,20,0.95))] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-[color:var(--text)]">
                  AI-помощник временно недоступен
                </p>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
                  {searchErrorMessage}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const normalizedPrompt = prompt.trim();

                  if (!normalizedPrompt) {
                    return;
                  }

                  searchMutation.mutate(normalizedPrompt);
                }}
                className="btn-soft"
              >
                Попробовать снова
              </button>
            </div>
          </div>
        ) : null}

        {isAuthenticated && filters ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-[color:var(--muted-strong)]">
              Что понял помощник
            </p>
            {submittedPrompt ? (
              <p className="text-sm leading-7 text-[color:var(--text)]">
                Ваш запрос: «{submittedPrompt}»
              </p>
            ) : null}
            {filterChips.length ? (
              <div className="flex flex-wrap gap-2">
                {filterChips.map((chip) => (
                  <span key={chip} className="warm-chip">
                    {chip}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {isAuthenticated && assistantAnswer ? (
          <div className="surface-card border-[color:rgba(255,209,102,0.22)] bg-[linear-gradient(135deg,rgba(154,42,28,0.22),rgba(31,24,20,0.92))] p-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="warm-chip">Ответ от AI-помощника</span>
              <span className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
                Подборка
              </span>
            </div>
            <p className="mt-4 text-base leading-8 text-[color:var(--text)]">
              {assistantAnswer}
            </p>
          </div>
        ) : null}

        {isAuthenticated && warning ? (
          <div className="surface-card border border-[color:rgba(255,209,102,0.18)] bg-[linear-gradient(135deg,rgba(87,54,20,0.26),rgba(31,24,20,0.92))] p-5">
            <p className="text-sm font-semibold text-[color:var(--text)]">
              Подборка собрана по каталогу без живого ответа модели
            </p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
              {warning.message}
            </p>
          </div>
        ) : null}

        {isAuthenticated && searchMutation.isSuccess ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-[color:var(--muted-strong)]">
                Подходящие книги
              </p>
              <span className="text-sm text-[color:var(--muted)]">
                {results.length} найдено
              </span>
            </div>

            <div className="grid gap-3">
              {results.length ? (
                visibleResults.map((book) => {
                  const coverUrl = resolveMediaUrl(book.coverUrl);

                  return (
                    <Link
                      key={book.id}
                      to={`/books/${book.id}`}
                      className="surface-card overflow-hidden p-4 hover:border-[color:rgba(255,209,102,0.22)]"
                    >
                      <div className="grid gap-4 sm:grid-cols-[92px_1fr]">
                        <div className="book-cover-frame book-cover-frame--compact">
                          {coverUrl ? (
                            <img
                              src={coverUrl}
                              alt={book.title}
                              className="book-cover-image"
                            />
                          ) : (
                            <div className="book-cover-fallback">
                              Нет обложки
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap gap-2">
                            {recommendedIds.has(book.id) ? (
                              <span className="warm-chip">
                                Лучшее совпадение
                              </span>
                            ) : null}
                            {book.aiMatchType === "exact" ? (
                              <span className="warm-chip">
                                Точное совпадение
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-3">
                            <div className="min-w-0">
                              <p className="text-base font-semibold text-[color:var(--text)]">
                                {book.title}
                              </p>
                              <p className="mt-1 text-sm text-[color:var(--muted)]">
                                {book.authors
                                  ?.map((author) => author.fullName)
                                  .join(", ") || "Автор не указан"}
                              </p>
                              {book.aiReason ? (
                                <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                                  {book.aiReason}
                                </p>
                              ) : null}
                            </div>

                            <div className="hidden shrink-0 text-left md:text-right">
                              {(book.ratingCount ?? 0) > 0 ? (
                                <>
                                  <p className="text-lg font-semibold text-[color:var(--accent)]">
                                    {(book.avgFinalScore ?? 0).toFixed(1)}
                                  </p>
                                  <p className="text-xs text-[color:var(--muted)]">
                                    {book.ratingCount ?? 0} оценок
                                  </p>
                                </>
                              ) : (
                                <p className="text-sm font-semibold text-[color:var(--muted)]">
                                  Пока нет оценок
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="surface-card p-4 text-sm text-[color:var(--muted)]">
                  Книг по вашему запросу нет.
                </div>
              )}
            </div>

            {results.length > compactLimit ? (
              <button
                type="button"
                onClick={() => setShowAllResults((current) => !current)}
                className="btn-soft self-start"
              >
                {showAllResults
                  ? "Свернуть список"
                  : "Показать все найденные книги"}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
