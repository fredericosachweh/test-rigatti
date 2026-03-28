import { asyncHandler } from "../utils/asyncHandler.js";
import { ChatLog } from "../models/ChatLog.js";

export const getHeatmap = asyncHandler(async (req, res) => {
  const companyId = req.user!.companyId;

  const logs = await ChatLog.find({ companyId }).lean();

  // Frequência de uso de cada campo da tool
  const fieldUsage = { search: 0, category: 0, minPrice: 0, maxPrice: 0 };
  const termFreq: Record<string, number> = {};
  const categoryFreq: Record<string, number> = {};
  const priceRanges = { "0-100": 0, "100-500": 0, "500-1000": 0, "1000+": 0 };
  // Heatmap dia-da-semana (0=Dom) x hora (0-23)
  const activityGrid: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));

  const logsWithTool = logs.filter((l) => l.toolArgs !== null);

  for (const log of logsWithTool) {
    const args = log.toolArgs as Record<string, unknown>;

    if (args.search && typeof args.search === "string") {
      fieldUsage.search++;
      const term = args.search.toLowerCase().trim();
      termFreq[term] = (termFreq[term] ?? 0) + 1;
    }
    if (args.category && typeof args.category === "string") {
      fieldUsage.category++;
      const cat = args.category.trim();
      categoryFreq[cat] = (categoryFreq[cat] ?? 0) + 1;
    }
    if (typeof args.minPrice === "number") {
      fieldUsage.minPrice++;
    }
    if (typeof args.maxPrice === "number") {
      fieldUsage.maxPrice++;
      const p = args.maxPrice as number;
      if (p <= 100) priceRanges["0-100"]++;
      else if (p <= 500) priceRanges["100-500"]++;
      else if (p <= 1000) priceRanges["500-1000"]++;
      else priceRanges["1000+"]++;
    }
  }

  for (const log of logs) {
    const d = new Date(log.createdAt);
    activityGrid[d.getDay()][d.getHours()]++;
  }

  const topSearchTerms = Object.entries(termFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([term, count]) => ({ term, count }));

  const topCategories = Object.entries(categoryFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([category, count]) => ({ category, count }));

  const total = logs.length || 1;
  const fieldUsageRate = {
    search: +(fieldUsage.search / total).toFixed(2),
    category: +(fieldUsage.category / total).toFixed(2),
    minPrice: +(fieldUsage.minPrice / total).toFixed(2),
    maxPrice: +(fieldUsage.maxPrice / total).toFixed(2)
  };

  const providerCounts = logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.provider] = (acc[l.provider] ?? 0) + 1;
    return acc;
  }, {});

  res.json({
    totalChats: logs.length,
    topSearchTerms,
    topCategories,
    priceRangeDistribution: priceRanges,
    fieldUsageRate,
    providerUsage: providerCounts,
    activityGrid
  });
});
