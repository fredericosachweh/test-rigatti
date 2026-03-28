import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { ApiError, apiFetch } from "../lib/api";

interface HeatmapData {
  totalChats: number;
  topSearchTerms: { term: string; count: number }[];
  topCategories: { category: string; count: number }[];
  priceRangeDistribution: Record<string, number>;
  fieldUsageRate: Record<string, number>;
  providerUsage: Record<string, number>;
  activityGrid: number[][];
}

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="hm-bar-row">
      <span className="hm-bar-label">{label}</span>
      <div className="hm-bar-track">
        <div className="hm-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="hm-bar-value">{value}</span>
    </div>
  );
}

function RateBar({ field, rate }: { field: string; rate: number }) {
  return (
    <div className="hm-bar-row">
      <span className="hm-bar-label">{field}</span>
      <div className="hm-bar-track">
        <div className="hm-bar-fill hm-bar-fill--teal" style={{ width: `${rate * 100}%` }} />
      </div>
      <span className="hm-bar-value">{Math.round(rate * 100)}%</span>
    </div>
  );
}

export function AnalyticsPage() {
  const { token } = useAuth();
  const [data, setData] = useState<HeatmapData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    apiFetch<HeatmapData>("/analytics/heatmap", { token })
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Erro ao carregar analytics."));
  }, [token]);

  if (error)
    return (
      <div className="page">
        <div className="error-banner">{error}</div>
      </div>
    );
  if (!data)
    return (
      <div className="page">
        <div className="panel">Carregando analytics...</div>
      </div>
    );

  const maxTerm = data.topSearchTerms[0]?.count ?? 1;
  const maxCat = data.topCategories[0]?.count ?? 1;
  const maxPrice = Math.max(...Object.values(data.priceRangeDistribution), 1);
  const gridMax = Math.max(...data.activityGrid.flatMap((r) => r), 1);

  function cellColor(val: number): string {
    if (val === 0) return "rgba(38,29,18,0.05)";
    const intensity = val / gridMax;
    return `rgba(15,118,110,${0.12 + intensity * 0.78})`;
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Mapa de calor</p>
          <h2>Analytics do agente</h2>
          <p className="muted">
            O que o modelo extrai das mensagens dos usuários ao chamar a tool de busca.
          </p>
        </div>
        <div className="stats-bar">
          <div className="stat-card">
            <span>Total de chats</span>
            <strong>{data.totalChats}</strong>
          </div>
          {Object.entries(data.providerUsage).map(([provider, count]) => (
            <div className="stat-card" key={provider}>
              <span>{provider}</span>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      </header>

      <div className="hm-grid">
        {/* Termos de busca */}
        <div className="panel">
          <p className="eyebrow">Termos mais buscados</p>
          {data.topSearchTerms.length === 0 ? (
            <p className="muted">Sem dados ainda.</p>
          ) : (
            data.topSearchTerms.map(({ term, count }) => (
              <Bar key={term} label={term} value={count} max={maxTerm} />
            ))
          )}
        </div>

        {/* Categorias */}
        <div className="panel">
          <p className="eyebrow">Categorias mais pedidas</p>
          {data.topCategories.length === 0 ? (
            <p className="muted">Sem dados ainda.</p>
          ) : (
            data.topCategories.map(({ category, count }) => (
              <Bar key={category} label={category} value={count} max={maxCat} />
            ))
          )}
        </div>

        {/* Faixa de preço */}
        <div className="panel">
          <p className="eyebrow">Faixa de preço (maxPrice)</p>
          {Object.entries(data.priceRangeDistribution).map(([range, count]) => (
            <Bar key={range} label={`R$ ${range}`} value={count} max={maxPrice} />
          ))}
        </div>

        {/* Taxa de uso de campos */}
        <div className="panel">
          <p className="eyebrow">Campos usados pelo modelo</p>
          <p className="muted" style={{ fontSize: "0.84rem", marginTop: 0 }}>
            % das conversas em que o modelo preencheu cada campo da tool.
          </p>
          {Object.entries(data.fieldUsageRate).map(([field, rate]) => (
            <RateBar key={field} field={field} rate={rate} />
          ))}
        </div>
      </div>

      {/* Activity heatmap dia x hora */}
      <div className="panel">
        <p className="eyebrow">Atividade por dia e hora</p>
        <div className="hm-activity">
          <div className="hm-hours">
            <span />
            {Array.from({ length: 24 }, (_, h) => (
              <span key={h} className="hm-hour-label">
                {String(h).padStart(2, "0")}h
              </span>
            ))}
          </div>
          {data.activityGrid.map((row, dayIdx) => (
            <div className="hm-day-row" key={dayIdx}>
              <span className="hm-day-label">{DAYS[dayIdx]}</span>
              {row.map((val, hour) => (
                <div
                  className="hm-cell"
                  key={hour}
                  style={{ background: cellColor(val) }}
                  title={`${DAYS[dayIdx]} ${String(hour).padStart(2, "0")}h — ${val} chats`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
