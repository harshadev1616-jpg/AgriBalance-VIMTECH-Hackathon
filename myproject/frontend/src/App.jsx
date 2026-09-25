import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Check,
  ChevronDown,
  CloudRain,
  Download,
  Factory,
  Gauge,
  Globe2,
  Landmark,
  Leaf,
  LineChart,
  Loader2,
  MapPinned,
  Satellite,
  Send,
  TrendingUp,
  Wallet,
  Waves,
} from "lucide-react";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import KarnatakaMap from "./components/KarnatakaMap.jsx";
import { api } from "./services/api.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

const districts = ["Mandya", "Mysuru", "Belagavi", "Tumakuru", "Raichur", "Dharwad", "Bengaluru Urban"];
const crops = ["Rice", "Ragi", "Jowar", "Maize", "Tur Dal", "Groundnut", "Cotton", "Sugarcane", "Tomato", "Millets"];

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  devicePixelRatio: typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1,
  resizeDelay: 100,
  animation: false,
  plugins: {
    legend: { labels: { color: "#cbd5e1", boxWidth: 10 } },
    tooltip: { backgroundColor: "#0f172a", borderColor: "#334155", borderWidth: 1 },
  },
  scales: {
    x: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(148, 163, 184, 0.08)" } },
    y: {
      ticks: { color: "#94a3b8", stepSize: 20 },
      grid: { color: "rgba(148, 163, 184, 0.08)" },
      beginAtZero: true,
    },
  },
};

const comparisonChartOptions = {
  ...chartOptions,
  scales: {
    ...chartOptions.scales,
    y: { ...chartOptions.scales.y, max: 100 },
  },
};

function currency(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
}

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function scoreFromProfit(value) {
  const profit = Number(value);
  return Number.isFinite(profit) ? Math.max(0, Math.min(100, Math.round((profit + 45000) / 1450))) : null;
}

function Panel({ children, className = "" }) {
  return <section className={`rounded-lg border border-white/10 bg-white/[0.07] shadow-2xl shadow-black/20 backdrop-blur ${className}`}>{children}</section>;
}

function Stat({ title, value, icon: Icon, tone = "text-emerald-300" }) {
  return (
    <Panel className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-white">{value ?? "--"}</p>
        </div>
        <div className={`rounded-md border border-white/10 bg-white/10 p-2 ${tone}`}>
          <Icon size={21} />
        </div>
      </div>
    </Panel>
  );
}

function ScoreBar({ label, value, tone = "bg-emerald-400" }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs text-slate-300">
        <span>{label}</span>
        <span>{value ?? 0}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-800">
        <div className={`h-2 rounded-full ${tone}`} style={{ width: `${Math.min(100, Math.max(0, value || 0))}%` }} />
      </div>
    </div>
  );
}

function Skeleton() {
  return <div className="h-10 animate-pulse rounded-md bg-white/10" />;
}

function DataState({ children }) {
  return <div className="flex items-center justify-center rounded-md border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-500">{children}</div>;
}

function FieldSelect({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative min-w-[148px]">
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={label}
        className="flex w-full items-center justify-between gap-3 rounded-md border border-white/15 bg-slate-900 px-3 py-2 text-left text-base font-medium text-white shadow-sm transition hover:border-emerald-300/60 focus:outline-none focus:ring-2 focus:ring-emerald-300/60"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="truncate">{value}</span>
        <ChevronDown className={`shrink-0 transition ${open ? "rotate-180" : ""}`} size={18} />
      </button>
      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-50 max-h-72 overflow-y-auto rounded-md border border-white/15 bg-slate-900 p-1 shadow-2xl shadow-black/40" role="listbox" aria-label={label}>
          {options.map((option) => (
            <button
              aria-selected={option === value}
              className="flex w-full items-center justify-between rounded px-3 py-2.5 text-left text-base text-slate-100 transition hover:bg-emerald-400/15 hover:text-white focus:bg-emerald-400/15 focus:outline-none"
              key={option}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              role="option"
              type="button"
            >
              <span>{option}</span>
              {option === value ? <Check className="text-emerald-300" size={16} /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function App() {
  const [district, setDistrict] = useState("Mandya");
  const [crop, setCrop] = useState("Tomato");
  const [farmSize, setFarmSize] = useState(2);
  const [budget, setBudget] = useState(290000);
  const [water, setWater] = useState(36);
  const [profit, setProfit] = useState(null);
  const [calculatingProfit, setCalculatingProfit] = useState(false);
  const [question, setQuestion] = useState("Is tomato risky?");
  const [selected, setSelected] = useState({ lat: 12.9716, lon: 77.5946 });
  const [state, setState] = useState({
    balancing: null,
    heatmap: null,
    comparison: null,
    market: null,
    assistant: null,
    notifications: null,
    satellite: null,
    admin: null,
    government: null,
    decision: null,
    schemes: null,
    marketActual: null,
  });
  const [loading, setLoading] = useState(true);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadPhaseTwo() {
      setLoading(true);
      setError("");
      try {
        const results = await Promise.allSettled([
          api.cropBalancing({ district, water_availability: water }),
          api.districtHeatmap(),
          api.compareDistricts(["Mandya", "Mysuru", "Belagavi", "Tumakuru"]),
          api.marketIntelligence(district, crop),
          api.smartNotifications(district),
          api.satelliteAnalytics(district),
          api.adminAnalytics(),
          api.governmentDashboard(),
          api.dailyDecision({ district, crop }),
          api.schemes({ state: "Karnataka", crop }),
        ]);
        const values = results.map((result) => result.status === "fulfilled" ? result.value : null);
        const [balancing, heatmap, comparison, market, notifications, satellite, admin, government, decision, schemes] = values;
        const failures = results.filter((result) => result.status === "rejected");
        if (active) {
          setState((current) => ({
            ...current,
            ...(balancing ? { balancing } : {}),
            ...(heatmap ? { heatmap } : {}),
            ...(comparison ? { comparison } : {}),
            ...(market ? { market } : {}),
            ...(notifications ? { notifications } : {}),
            ...(satellite ? { satellite } : {}),
            ...(admin ? { admin } : {}),
            ...(government ? { government } : {}),
            ...(decision ? { decision } : {}),
            ...(schemes ? { schemes } : {}),
          }));
          setError(failures.length ? `${failures.length} data service${failures.length === 1 ? " is" : "s are"} temporarily unavailable. Available information is still shown.` : "");
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadPhaseTwo();
    return () => {
      active = false;
    };
  }, [district, crop, water]);

  useEffect(() => {
    let active = true;
    api.marketPriceIntelligence({ state: "Karnataka", district, commodity: crop, limit: 25 })
      .then((marketActual) => {
        if (active) setState((current) => ({ ...current, marketActual }));
      })
      .catch((err) => {
        if (active) setState((current) => ({ ...current, marketActual: { unavailable: true, message: err.message } }));
      });
    return () => {
      active = false;
    };
  }, [district, crop]);

  useEffect(() => {
    let active = true;
    api.profitCalculator({
      district,
      crop,
      farm_size: Number(farmSize),
      budget: Number(budget),
      soil: "Loamy",
      water: Number(water),
    }).then((result) => {
      if (active) setProfit(result);
    }).catch(() => {
      if (active) setProfit(null);
    });
    return () => {
      active = false;
    };
  }, [district, crop]);

  async function askAssistant(event) {
    event.preventDefault();
    setAsking(true);
    try {
      const assistant = await api.askFarmerAssistant({ question, district, farm_size: farmSize });
      setState((current) => ({ ...current, assistant }));
    } catch (err) {
      setError(err.message);
    } finally {
      setAsking(false);
    }
  }

  const topCrops = state.balancing?.top_recommended_crops || [];
  const heatmap = state.heatmap?.districts || [];
  const comparison = state.comparison?.districts || [];
  const bestCrop = topCrops[0];
  const profitScore = bestCrop?.profit_score ?? null;
  const comparisonWithCalculatorProfit = comparison.map((item) =>
    item.district === district && profit ? { ...item, profit: Math.round(profit.net_profit ?? profit.netProfit) } : item,
  );

  async function handleCalculateProfit() {
    setCalculatingProfit(true);
    try {
      const result = await api.profitCalculator({
        district,
        crop,
        farm_size: Number(farmSize),
        budget: Number(budget),
        soil: "Loamy",
        water: Number(water),
      });
      setProfit(result);
      setError("");
    } catch (err) {
      setError(`Profit calculation unavailable: ${err.message}`);
    } finally {
      setCalculatingProfit(false);
    }
  }

  const marketChart = useMemo(
    () => ({
      labels: state.market?.price_forecast?.map((item) => item.month) || [],
      datasets: [
        {
          label: "Forecast price",
          data: state.market?.price_forecast?.map((item) => item.price) || [],
          borderColor: "#38bdf8",
          backgroundColor: "rgba(56, 189, 248, 0.18)",
          tension: 0.35,
        },
      ],
    }),
    [state.market],
  );

  const comparisonChart = useMemo(
    () => ({
      labels: comparisonWithCalculatorProfit.map((item) => item.district),
      datasets: [
        { label: "Profit score", data: comparisonWithCalculatorProfit.map((item) => scoreFromProfit(item.profit)), backgroundColor: "#34d399" },
        { label: "Demand", data: comparisonWithCalculatorProfit.map((item) => Number(item.demand)), backgroundColor: "#f59e0b" },
        { label: "Supply risk", data: comparisonWithCalculatorProfit.map((item) => Number(item.supply)), backgroundColor: "#fb7185" },
      ],
    }),
    [comparisonWithCalculatorProfit],
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">AgriBalance AI Phase 2</p>
            <h1 className="mt-1 text-3xl font-semibold text-white">Crop Planning Command Center</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <FieldSelect label="District" options={districts} value={district} onChange={setDistrict} />
            <FieldSelect label="Crop" options={crops} value={crop} onChange={setCrop} />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:px-8">
        {error ? <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">{error}</div> : null}
        {loading ? <Skeleton /> : null}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat title="Best crop" value={bestCrop?.crop} icon={Leaf} />
          <Stat title="Expected profit" value={bestCrop ? currency(bestCrop.expected_profit) : "Data unavailable"} icon={Wallet} tone="text-amber-300" />
          <Stat title="Profit score" value={profitScore == null ? "Not enough data" : `${profitScore}/100`} icon={Gauge} tone="text-sky-300" />
          <Stat title="Oversupply risk" value={bestCrop ? `${bestCrop.oversupply_risk}%` : "Insufficient data"} icon={AlertTriangle} tone="text-rose-300" />
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <Panel className="border-emerald-300/20 p-5">
            <div className="flex items-center gap-3">
              <Leaf className="text-emerald-300" size={22} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Today&apos;s farm decision</p>
                <h2 className="mt-1 text-xl font-semibold text-white">{state.decision?.recommended_action || "Loading your next action"}</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">{state.decision?.reason || "The decision engine is combining the selected crop and district signals."}</p>
            <p className="mt-3 text-xs text-slate-500">{state.decision?.data_status || "Calculated from available application data"}. Recommendations are not guarantees.</p>
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-sky-300" size={22} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Mandi price signal</p>
                <h2 className="mt-1 text-xl font-semibold text-white">{state.marketActual?.trend_direction || "Unavailable"}</h2>
              </div>
            </div>
            {state.marketActual?.unavailable ? (
              <p className="mt-4 text-sm text-slate-400">Actual mandi data is unavailable right now. No live price is shown.</p>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md bg-white/10 p-3">Minimum<br /><strong>{state.marketActual?.price_range?.min ?? "Unavailable"}</strong></div>
                <div className="rounded-md bg-white/10 p-3">Maximum<br /><strong>{state.marketActual?.price_range?.max ?? "Unavailable"}</strong></div>
                <div className="col-span-2 text-xs text-slate-500">{state.marketActual?.data_status || "Actual data status unavailable"}</div>
              </div>
            )}
          </Panel>
        </section>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Panel className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">AI crop balancing engine</p>
                <h2 className="mt-1 text-xl font-semibold text-white">{district} recommendation portfolio</h2>
              </div>
              <span className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-200">
                {state.balancing?.model || "phase2"}
              </span>
            </div>
            <div className="mt-5 grid gap-3">
              {topCrops.map((item) => (
                <article key={item.crop} className="rounded-lg border border-white/10 bg-slate-900/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{item.crop}</h3>
                      <p className="mt-1 text-sm text-slate-400">{item.reasoning}</p>
                    </div>
                    <span className="rounded-md bg-white/10 px-3 py-1 text-sm text-slate-100">{item.recommendation}</span>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <ScoreBar label="Profit" value={item.profit_score} />
                    <ScoreBar label="Demand" value={item.demand_score} tone="bg-sky-400" />
                    <ScoreBar label="Water fit" value={item.water_usage_score} tone="bg-cyan-400" />
                    <ScoreBar label="Climate safety" value={100 - item.climate_risk} tone="bg-amber-300" />
                  </div>
                </article>
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center gap-3">
              <MapPinned className="text-emerald-300" size={22} />
              <h2 className="text-xl font-semibold text-white">District Heatmap</h2>
            </div>
            <div className="mt-4 grid max-h-[560px] gap-2 overflow-auto pr-1">
              {heatmap.length ? heatmap.map((item) => (
                <button
                  key={item.district}
                  className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-md border border-white/10 bg-slate-900/70 p-3 text-left transition hover:border-emerald-300/50"
                  onClick={() => setDistrict(item.district)}
                  type="button"
                >
                  <span>
                    <span className="block font-medium text-white">{item.district}</span>
                    <span className="mt-1 block text-xs text-slate-400">{item.best_crop} | rain {item.rainfall} mm | water {item.water_availability}/100</span>
                    <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-slate-800">
                      <span className={`block h-full rounded-full ${item.status === "green" ? "bg-emerald-400" : item.status === "yellow" ? "bg-amber-300" : "bg-rose-400"}`} style={{ width: `${Math.min(100, Math.max(0, Number(item.risk_index) || 0))}%` }} />
                    </span>
                  </span>
                  <span className={`h-3 w-3 rounded-full ${item.status === "green" ? "bg-emerald-400" : item.status === "yellow" ? "bg-amber-300" : "bg-rose-400"}`} />
                </button>
              )) : <DataState>No district risk data available.</DataState>}
            </div>
          </Panel>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <KarnatakaMap selected={selected} onSelect={setSelected} />
          <Panel className="p-5">
            <div className="flex items-center gap-3">
              <LineChart className="text-sky-300" size={22} />
              <h2 className="text-xl font-semibold text-white">Smart District Comparison</h2>
            </div>
            {comparison.length ? <div className="mt-5 h-80"><Bar data={comparisonChart} options={comparisonChartOptions} /></div> : <div className="mt-5"><DataState>District comparison data is unavailable.</DataState></div>}
          </Panel>
        </div>

        <section className="grid gap-5 lg:grid-cols-3">
          <Panel className="p-5 lg:col-span-2">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-cyan-300" size={22} />
              <h2 className="text-xl font-semibold text-white">Market Intelligence</h2>
            </div>
            {state.market?.price_forecast?.length ? <div className="mt-5 h-72"><Line data={marketChart} options={chartOptions} /></div> : <div className="mt-5"><DataState>Market trend data is unavailable.</DataState></div>}
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Stat title="Demand" value={state.market?.demand == null ? "Unavailable" : `${state.market.demand}/100`} icon={BarChart3} tone="text-emerald-300" />
              <Stat title="Saturation" value={state.market?.market_saturation == null ? "Unavailable" : `${state.market.market_saturation}%`} icon={Factory} tone="text-rose-300" />
              <Stat title="Sell window" value={state.market?.best_selling_window || "Unavailable"} icon={Download} tone="text-amber-300" />
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center gap-3">
              <Bot className="text-emerald-300" size={22} />
              <h2 className="text-xl font-semibold text-white">AI Farmer Assistant</h2>
            </div>
            <form className="mt-4 flex gap-2" onSubmit={askAssistant}>
              <input className="min-w-0 flex-1 rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white" value={question} onChange={(event) => setQuestion(event.target.value)} />
              <button className="rounded-md bg-emerald-400 px-3 py-2 text-slate-950" type="submit" title="Ask assistant">
                {asking ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              </button>
            </form>
            <p className="mt-4 rounded-lg border border-white/10 bg-slate-900/70 p-4 text-sm leading-6 text-slate-200">
              {state.assistant?.answer || "Ask a crop planning question to get a data-backed response."}
            </p>
            <div className="mt-4 grid gap-2">
              {state.notifications?.alerts?.map((alert) => (
                <div key={alert.title} className="rounded-md border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">
                  <strong>{alert.title}:</strong> {alert.action}
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <Panel className="p-5">
          <div className="flex items-center gap-3">
            <Landmark className="text-amber-300" size={22} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Government schemes</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Support matched to {crop}</h2>
            </div>
          </div>
          {state.schemes?.results?.length ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {state.schemes.results.slice(0, 4).map((scheme) => (
                <article key={scheme.id} className="rounded-lg border border-white/10 bg-slate-900/70 p-4">
                  <h3 className="font-semibold text-white">{scheme.name}</h3>
                  <p className="mt-2 text-sm text-slate-400">{scheme.benefits}</p>
                  {scheme.official_source_url ? <a className="mt-3 inline-block text-sm text-emerald-300 underline" href={scheme.official_source_url} target="_blank" rel="noreferrer">Official source</a> : null}
                </article>
                ))}
              </div>
            ) : (
            <p className="mt-4 text-sm text-slate-400">No verified scheme records are connected yet. This area will remain empty until official records are added.</p>
          )}
        </Panel>

        <section className="grid gap-5 lg:grid-cols-3">
          <Panel className="p-5">
            <div className="flex items-center gap-3">
              <Wallet className="text-amber-300" size={22} />
              <h2 className="text-xl font-semibold text-white">Profit Calculator</h2>
            </div>
            <div className="mt-4 grid gap-3">
              <label className="text-sm text-slate-300">Farm size: {farmSize} ha</label>
              <input type="range" min="0.5" max="10" step="0.5" value={farmSize} onChange={(event) => setFarmSize(numberValue(event.target.value))} />
              <label className="text-sm text-slate-300">Budget: {currency(budget)}</label>
              <input type="range" min="0" max="1000000" step="5000" value={budget} onChange={(event) => setBudget(numberValue(event.target.value))} />
              <label className="text-sm text-slate-300">Water: {water}/100</label>
              <input type="range" min="0" max="100" value={water} onChange={(event) => setWater(numberValue(event.target.value))} />
              <button
                className="rounded-md border border-amber-300/40 bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-950/20 transition hover:bg-amber-300 hover:shadow-amber-900/30"
                onClick={handleCalculateProfit}
                type="button"
              >
                {calculatingProfit ? "Calculating..." : "Calculate Profit"}
              </button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md bg-white/10 p-3">Revenue<br /><strong>{profit ? currency(profit.revenue) : "Data unavailable"}</strong></div>
              <div className="rounded-md bg-white/10 p-3">Net profit<br /><strong>{profit ? currency(profit.net_profit) : "Data unavailable"}</strong></div>
              <div className="rounded-md bg-white/10 p-3">ROI<br /><strong>{profit ? `${Number(profit.roi).toFixed(2)}%` : "Data unavailable"}</strong></div>
              <div className="rounded-md bg-white/10 p-3">Risk<br /><strong>{profit?.risk || "Data unavailable"}</strong></div>
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center gap-3">
              <Satellite className="text-sky-300" size={22} />
              <h2 className="text-xl font-semibold text-white">Satellite Analytics</h2>
            </div>
            <div className="mt-5 grid gap-4">
              {state.satellite ? <>
                <ScoreBar label="Vegetation index" value={Math.round((state.satellite.vegetation_index || 0) * 100)} tone="bg-emerald-400" />
                <ScoreBar label="Crop health" value={state.satellite.crop_health} tone="bg-cyan-400" />
              </> : <DataState>Crop monitoring data is unavailable.</DataState>}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md bg-white/10 p-3">Drought<br /><strong>{state.satellite?.drought_detection ? "Detected" : "Clear"}</strong></div>
                <div className="rounded-md bg-white/10 p-3">Flood<br /><strong>{state.satellite?.flood_detection ? "Detected" : "Clear"}</strong></div>
                <div className="rounded-md bg-white/10 p-3">Stage<br /><strong>{state.satellite?.growth_stage}</strong></div>
                <div className="rounded-md bg-white/10 p-3">Land<br /><strong>{state.satellite?.land_classification}</strong></div>
              </div>
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center gap-3">
              <Landmark className="text-rose-300" size={22} />
              <h2 className="text-xl font-semibold text-white">Government Dashboard</h2>
            </div>
            <div className="mt-5 grid gap-3">
              <Stat title="Crop diversity" value={state.government?.crop_diversity == null ? "Unavailable" : `${state.government.crop_diversity}/100`} icon={Globe2} tone="text-emerald-300" />
              <Stat title="Food security" value={state.government?.food_security == null ? "Unavailable" : `${state.government.food_security}/100`} icon={Leaf} tone="text-sky-300" />
              <Stat title="Water usage risk" value={state.government?.water_usage == null ? "Unavailable" : `${state.government.water_usage}/100`} icon={Waves} tone="text-cyan-300" />
            </div>
          </Panel>
        </section>
      </div>
    </main>
  );
}
