import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Calendar,
  Shield,
  Eye,
  EyeOff,
  Plus,
  X,
  Edit2,
  Trash2,
  Check,
  ChevronsUpDown,
  Image as ImageIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  AlertCircle,
  Lightbulb,
  Filter,
  Grid,
  List,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Brain,
  Percent,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Save,
  Upload,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Link,
  Download,
  HardDrive,
  FolderSync,
  ToggleLeft,
  ToggleRight,
  Wallet,
  LineChart,
  Clock,
  CalendarDays,
  Calculator,
  CornerDownLeft,
  GripVertical,
  Expand,
  SlidersHorizontal,
  ArrowUpDown,
  Sun,
  Moon,
  PanelLeft,
  Flame,
  ClipboardPaste,
  ZoomIn,
  Send,
  ImagePlus,
  StickyNote,
} from 'lucide-react';

// Types
type TradingAccountType = 'CFD' | 'LIVE' | 'FUTURES';

interface Account {
  id: string;
  name: string;
  startingBalance: number;
  type: 'Eval' | 'Phase 1' | 'Phase 2' | 'Funded' | 'Custom Challenge';
  customTypeName?: string;
  propFirm: string;
  createdAt: string;
  hasProfitTarget?: boolean;
  profitTarget?: number;
  maxDrawdown?: number;
  tradingAccountType?: TradingAccountType;
  highestBalance?: number;
  maxDrawdownAllowance?: number;
  fixedMinBalance?: number;
}

interface TradeImage {
  id: string;
  url: string;
  type: 'url' | 'base64';
}

interface TimeframeChart {
  name: string;
  images: TradeImage[];
  notes: string;
}

interface Trade {
  id: string;
  accountId: string;
  symbol: string;
  profitLoss: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  slPoints: number;
  tpPoints: number;
  setupTypes: string[];
  confluences: string[];
  mistakes: string[];
  rulesFollowed: 'followed' | 'broken';
  timeframes: TimeframeChart[];
  executionImages: TradeImage[];
  riskAmount: number;
  mistakesAnalysis: string;
  lessonsLearned: string;
  emotions?: string[]; // Emotions experienced during the trade (Discipline & Psychology Review)
  notes?: string; // Free-form psychological / session observation notes
  timestamp: string;
  date: string;
  startTime?: string;
  endTime?: string;
  absoluteTradeNumber: number; // Assigned at creation, never changes
  trackingNumber?: string; // Manual Trade # (e.g. Notion log ref, day marker)
  session?: SessionOption; // Trading session the trade was taken in
}

type RuleSeverity = 'critical' | 'warning' | 'guide';
type RulePillar = 'risk' | 'execution' | 'psychology';

interface Rule {
  id: string;
  category: string;
  title: string;
  description: string;
  severity: RuleSeverity;
  pillar: RulePillar;
}

interface ChatMessage {
  id: string;
  text: string;
  timestamp: string;
}

interface MarketNotice {
  id: string;
  title: string;
  imageUrl: string;
  timestamp: string;
  messages: ChatMessage[];
}

interface ScenarioRow {
  id: string;
  scenario: string;
  tags: string[];
  lesson: string;
}

interface WikiEntry {
  id: string;
  title: string;
  content: string;
  category: string;
}

interface SetupType {
  id: string;
  name: string;
}

interface Confluence {
  id: string;
  name: string;
}

interface Mistake {
  id: string;
  name: string;
}

type SessionOption = 'NYC' | 'London' | 'Asia' | 'Pre-market Open';
type ViewType = 'dashboard' | 'trades' | 'discipline' | 'playbook' | 'notices' | 'wiki' | 'calendar';
type GalleryView = 'list' | 'preview' | 'gallery';
type TradeFilter = 'all' | 'profit' | 'loss' | 'breakeven';
type TradeSortField = 'date' | 'pnl' | 'symbol' | 'rr';
type SortOrder = 'asc' | 'desc';

// Timeframes with Execution/Result first
const TIMEFRAMES = ['Execution/Result', 'Daily', '4H', '1H', '30M', '15M', '5M', '1M'] as const;

const ACCOUNT_TYPES = ['Eval', 'Phase 1', 'Phase 2', 'Funded', 'Custom Challenge'] as const;
const TRADING_ACCOUNT_TYPES: TradingAccountType[] = ['CFD', 'LIVE', 'FUTURES'];

const PRESET_SYMBOLS = [
  { name: 'NASDAQ (NQ)', value: 'NQ' },
  { name: 'ES (S&P 500)', value: 'ES' },
  { name: 'Gold (XAUUSD)', value: 'XAUUSD' },
];

const SESSION_OPTIONS: SessionOption[] = ['NYC', 'London', 'Asia', 'Pre-market Open'];

// Preset emotion tags for the Discipline & Psychology Review modal
const EMOTION_OPTIONS = ['Calm', 'FOMO', 'Revenge Trading', 'Greed', 'Impatient', 'Anxious', 'Confident', 'Hesitant'];


// Short lowercase labels for compact card badges (e.g. "nyc", "pre-market")
const SESSION_SHORT_LABEL: Record<SessionOption, string> = {
  'NYC': 'nyc',
  'London': 'london',
  'Asia': 'asia',
  'Pre-market Open': 'pre-market',
};

// ---- Rules Playbook: the 3 command-center columns ----
const RULE_PILLARS: RulePillar[] = ['risk', 'execution', 'psychology'];

const RULE_PILLAR_META: Record<RulePillar, { label: string; icon: string; accent: string; iconBg: string }> = {
  risk: { label: 'Risk & Capital Rules', icon: '🛡️', accent: 'border-t-sky-500', iconBg: 'bg-sky-500/10' },
  execution: { label: 'Execution Rules', icon: '⚡', accent: 'border-t-amber-500', iconBg: 'bg-amber-500/10' },
  psychology: { label: 'Psychology Rules', icon: '🧠', accent: 'border-t-violet-500', iconBg: 'bg-violet-500/10' },
};

// ---- Rules Playbook: severity tiers ----
const RULE_SEVERITIES: RuleSeverity[] = ['critical', 'warning', 'guide'];

const RULE_SEVERITY_META: Record<RuleSeverity, { label: string; dot: string; badge: string }> = {
  critical: { label: 'Critical', dot: 'bg-red-500', badge: 'bg-red-500/15 text-red-400 border border-red-500/20' },
  warning: { label: 'Warning', dot: 'bg-amber-400', badge: 'bg-amber-400/15 text-amber-400 border border-amber-400/20' },
  guide: { label: 'Guide', dot: 'bg-sky-400', badge: 'bg-sky-400/15 text-sky-400 border border-sky-400/20' },
};

// Loosely matches a Discipline Tracker "mistake" tag against a Rule title,
// so the Playbook can passively count violations without any manual
// checkboxes. Case/whitespace-insensitive, and tolerant of the tag being a
// shorthand version of the rule (or vice versa).
const tagMatchesRuleTitle = (tag: string, ruleTitle: string): boolean => {
  const a = tag.trim().toLowerCase();
  const b = ruleTitle.trim().toLowerCase();
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
};

// Utility functions
// Fixed palette for known scenario tags so recurring labels (loss, FOMO,
// overtrade, etc.) stay visually consistent across the table. Anything
// outside this list still gets a color via a deterministic hash so new
// tags never fall back to plain gray-on-gray.
const SCENARIO_TAG_STYLES: Record<string, string> = {
  overtrade: 'bg-red-500/10 text-red-400 border-red-500/30',
  chase: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  loss: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
  fomo: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  discipline: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  win: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  patience: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  revenge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
};

const SCENARIO_TAG_FALLBACK_PALETTE = [
  'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  'bg-amber-500/10 text-amber-400 border-amber-500/30',
  'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  'bg-pink-500/10 text-pink-400 border-pink-500/30',
  'bg-lime-500/10 text-lime-400 border-lime-500/30',
];

const getScenarioTagStyle = (tag: string) => {
  const key = tag.trim().toLowerCase();
  if (SCENARIO_TAG_STYLES[key]) return SCENARIO_TAG_STYLES[key];
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return SCENARIO_TAG_FALLBACK_PALETTE[hash % SCENARIO_TAG_FALLBACK_PALETTE.length];
};

const generateId = () => Math.random().toString(36).substr(2, 9);

// ============================================================
// DATA SCHEMA VERSIONING & MIGRATION
//
// All persisted data (localStorage AND exported backup .json files) passes
// through migrateStoredData() before it ever reaches React state. This is
// what makes it safe to keep upgrading the app: an old backup made months
// ago can always be imported into whatever the current code looks like.
//
// HOW TO USE THIS WHEN YOU UPGRADE THE APP LATER:
// 1. Add/rename/remove a field on Account, Trade, Rule, etc.
// 2. Bump DATA_SCHEMA_VERSION by 1.
// 3. In the matching normalize*() function below, add a default/fallback
//    for the new field (and, if you renamed something, map the old field
//    name to the new one there too).
// That's it — both localStorage loads and backup-file imports will now
// always produce fully-shaped, current-version objects, so nothing in the
// UI ever crashes on a field that "isn't there yet" in older data.
// ============================================================
const DATA_SCHEMA_VERSION = 4;

const createEmptyTimeframes = (): TimeframeChart[] =>
  TIMEFRAMES.map(tf => ({ name: tf, images: [], notes: '' }));

const normalizeTradeImage = (img: any): TradeImage => ({
  id: typeof img?.id === 'string' ? img.id : generateId(),
  url: typeof img?.url === 'string' ? img.url : '',
  type: img?.type === 'base64' ? 'base64' : 'url',
});

const normalizeTimeframeChart = (tf: any): TimeframeChart => ({
  name: typeof tf?.name === 'string' ? tf.name : '',
  images: Array.isArray(tf?.images) ? tf.images.map(normalizeTradeImage) : [],
  notes: typeof tf?.notes === 'string' ? tf.notes : '',
});

const normalizeAccount = (a: any): Account => ({
  id: typeof a?.id === 'string' ? a.id : generateId(),
  name: typeof a?.name === 'string' ? a.name : 'Untitled Account',
  startingBalance: typeof a?.startingBalance === 'number' ? a.startingBalance : 0,
  type: (ACCOUNT_TYPES as readonly string[]).includes(a?.type) ? a.type : 'Eval',
  customTypeName: typeof a?.customTypeName === 'string' ? a.customTypeName : undefined,
  propFirm: typeof a?.propFirm === 'string' ? a.propFirm : '',
  createdAt: typeof a?.createdAt === 'string' ? a.createdAt : new Date().toISOString(),
  hasProfitTarget: typeof a?.hasProfitTarget === 'boolean' ? a.hasProfitTarget : undefined,
  profitTarget: typeof a?.profitTarget === 'number' ? a.profitTarget : undefined,
  maxDrawdown: typeof a?.maxDrawdown === 'number' ? a.maxDrawdown : undefined,
  tradingAccountType: TRADING_ACCOUNT_TYPES.includes(a?.tradingAccountType) ? a.tradingAccountType : undefined,
  highestBalance: typeof a?.highestBalance === 'number' ? a.highestBalance : undefined,
  maxDrawdownAllowance: typeof a?.maxDrawdownAllowance === 'number' ? a.maxDrawdownAllowance : undefined,
  fixedMinBalance: typeof a?.fixedMinBalance === 'number' ? a.fixedMinBalance : undefined,
});

const normalizeTrade = (t: any, fallbackTradeNumber: number): Trade => ({
  id: typeof t?.id === 'string' ? t.id : generateId(),
  accountId: typeof t?.accountId === 'string' ? t.accountId : '',
  symbol: typeof t?.symbol === 'string' ? t.symbol : '',
  profitLoss: typeof t?.profitLoss === 'number' ? t.profitLoss : 0,
  entryPrice: typeof t?.entryPrice === 'number' ? t.entryPrice : 0,
  stopLoss: typeof t?.stopLoss === 'number' ? t.stopLoss : 0,
  takeProfit: typeof t?.takeProfit === 'number' ? t.takeProfit : 0,
  slPoints: typeof t?.slPoints === 'number' ? t.slPoints : 0,
  tpPoints: typeof t?.tpPoints === 'number' ? t.tpPoints : 0,
  setupTypes: Array.isArray(t?.setupTypes) ? t.setupTypes : [],
  confluences: Array.isArray(t?.confluences) ? t.confluences : [],
  mistakes: Array.isArray(t?.mistakes) ? t.mistakes : [],
  rulesFollowed: t?.rulesFollowed === 'broken' ? 'broken' : 'followed',
  timeframes: Array.isArray(t?.timeframes) && t.timeframes.length > 0
    ? t.timeframes.map(normalizeTimeframeChart)
    : createEmptyTimeframes(),
  executionImages: Array.isArray(t?.executionImages) ? t.executionImages.map(normalizeTradeImage) : [],
  riskAmount: typeof t?.riskAmount === 'number' ? t.riskAmount : 0,
  mistakesAnalysis: typeof t?.mistakesAnalysis === 'string' ? t.mistakesAnalysis : '',
  lessonsLearned: typeof t?.lessonsLearned === 'string' ? t.lessonsLearned : '',
  emotions: Array.isArray(t?.emotions) ? t.emotions : undefined,
  notes: typeof t?.notes === 'string' ? t.notes : undefined,
  timestamp: typeof t?.timestamp === 'string' ? t.timestamp : new Date().toISOString(),
  date: typeof t?.date === 'string' ? t.date : (typeof t?.timestamp === 'string' ? t.timestamp.split('T')[0] : new Date().toISOString().split('T')[0]),
  startTime: typeof t?.startTime === 'string' ? t.startTime : undefined,
  endTime: typeof t?.endTime === 'string' ? t.endTime : undefined,
  absoluteTradeNumber: typeof t?.absoluteTradeNumber === 'number' && t.absoluteTradeNumber > 0 ? t.absoluteTradeNumber : fallbackTradeNumber,
  trackingNumber: typeof t?.trackingNumber === 'string' ? t.trackingNumber : undefined,
  session: SESSION_OPTIONS.includes(t?.session) ? t.session : undefined,
});

const normalizeTrades = (rawTrades: any[]): Trade[] => {
  // Trades missing absoluteTradeNumber get one assigned chronologically,
  // exactly like the old one-off migration used to — but now it's just
  // one case handled by the general-purpose normalizer.
  const sortedByTime = [...rawTrades].sort((a, b) => {
    const at = new Date(a?.timestamp ?? 0).getTime();
    const bt = new Date(b?.timestamp ?? 0).getTime();
    return at - bt;
  });
  const numberByRef = new Map<any, number>();
  sortedByTime.forEach((t, idx) => numberByRef.set(t, idx + 1));
  return rawTrades.map(t => normalizeTrade(t, numberByRef.get(t) ?? 1));
};

const normalizeStringField = (v: any, fallback = ''): string => (typeof v === 'string' ? v : fallback);

// Best-effort bucketing for rules saved before the pillar field existed —
// looks at category/title/description for obvious keywords, and falls
// back to 'execution' (the broadest catch-all bucket) if nothing matches.
const guessRulePillar = (r: any): RulePillar => {
  const text = `${r?.category || ''} ${r?.title || ''} ${r?.description || ''}`.toLowerCase();
  if (/risk|capital|drawdown|position size|loss limit|leverage|exposure/.test(text)) return 'risk';
  if (/psycholog|emotion|mindset|cool[- ]?off|walk away|revenge|fomo|discipline/.test(text)) return 'psychology';
  return 'execution';
};

const normalizeRule = (r: any): Rule => ({
  id: typeof r?.id === 'string' ? r.id : generateId(),
  category: normalizeStringField(r?.category),
  title: normalizeStringField(r?.title),
  description: normalizeStringField(r?.description),
  severity: RULE_SEVERITIES.includes(r?.severity) ? r.severity : 'warning',
  pillar: RULE_PILLARS.includes(r?.pillar) ? r.pillar : guessRulePillar(r),
});

const normalizeChatMessage = (m: any): ChatMessage => ({
  id: typeof m?.id === 'string' ? m.id : generateId(),
  text: normalizeStringField(m?.text),
  timestamp: typeof m?.timestamp === 'string' ? m.timestamp : new Date().toISOString(),
});

const normalizeNotice = (n: any): MarketNotice => {
  const timestamp = typeof n?.timestamp === 'string' ? n.timestamp : new Date().toISOString();
  // Older backups stored a single static "description" string per notice.
  // Fold that into the chat log as the first entry so nothing is lost.
  const legacyDescription = normalizeStringField(n?.description);
  const messages = Array.isArray(n?.messages)
    ? n.messages.map(normalizeChatMessage)
    : legacyDescription
      ? [{ id: generateId(), text: legacyDescription, timestamp }]
      : [];
  return {
    id: typeof n?.id === 'string' ? n.id : generateId(),
    title: normalizeStringField(n?.title),
    imageUrl: normalizeStringField(n?.imageUrl),
    timestamp,
    messages,
  };
};

const normalizeScenarioTags = (tags: any): string[] =>
  Array.isArray(tags) ? tags.filter((t: any) => typeof t === 'string' && t.trim()) : [];

const normalizeScenario = (s: any): ScenarioRow => ({
  id: typeof s?.id === 'string' ? s.id : generateId(),
  scenario: normalizeStringField(s?.scenario),
  tags: normalizeScenarioTags(s?.tags),
  lesson: normalizeStringField(s?.lesson),
});

const normalizeWiki = (w: any): WikiEntry => ({
  id: typeof w?.id === 'string' ? w.id : generateId(),
  title: normalizeStringField(w?.title),
  content: normalizeStringField(w?.content),
  category: normalizeStringField(w?.category),
});

const normalizeNamedItem = (item: any): { id: string; name: string } => ({
  id: typeof item?.id === 'string' ? item.id : generateId(),
  name: normalizeStringField(item?.name),
});

interface StoredData {
  version: number;
  accounts: Account[];
  trades: Trade[];
  rules: Rule[];
  notices: MarketNotice[];
  noticeScenarios: ScenarioRow[];
  wikiEntries: WikiEntry[];
  setupTypes: SetupType[];
  confluences: Confluence[];
  mistakesList: Mistake[];
  customSymbols: string[];
}

// Single entry point: throw any raw parsed JSON (old backup, new backup,
// current localStorage, whatever) at this, and get back a fully-shaped,
// current-schema object. Never throws on missing/malformed fields —
// worst case, individual fields fall back to safe empty defaults.
const migrateStoredData = (raw: any): StoredData => {
  const data = raw && typeof raw === 'object' ? raw : {};
  return {
    version: DATA_SCHEMA_VERSION,
    accounts: Array.isArray(data.accounts) ? data.accounts.map(normalizeAccount) : [],
    trades: Array.isArray(data.trades) ? normalizeTrades(data.trades) : [],
    rules: Array.isArray(data.rules) ? data.rules.map(normalizeRule) : [],
    notices: Array.isArray(data.notices) ? data.notices.map(normalizeNotice) : [],
    noticeScenarios: Array.isArray(data.noticeScenarios) ? data.noticeScenarios.map(normalizeScenario) : [],
    wikiEntries: Array.isArray(data.wikiEntries) ? data.wikiEntries.map(normalizeWiki) : [],
    setupTypes: Array.isArray(data.setupTypes) ? data.setupTypes.map(normalizeNamedItem) : [],
    confluences: Array.isArray(data.confluences) ? data.confluences.map(normalizeNamedItem) : [],
    mistakesList: Array.isArray(data.mistakesList) ? data.mistakesList.map(normalizeNamedItem) : [],
    customSymbols: Array.isArray(data.customSymbols) ? data.customSymbols.filter((s: any) => typeof s === 'string') : [],
  };
};

// Combines a user-chosen calendar date (YYYY-MM-DD) with the exact live system clock
// time (hours, minutes, seconds, milliseconds) at the moment this is called. Used so a
// trade's sort-critical `timestamp` always reflects precisely when it was saved/edited,
// even when logging a trade for a past date — giving same-day entries a stable, natural
// chronological order without any manual intervention.
const buildLiveTimestamp = (dateStr: string): string => {
  const now = new Date();
  const [year, month, day] = (dateStr || '').split('-').map(Number);
  const combined = (year && month && day)
    ? new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds())
    : now;
  return combined.toISOString();
};


const formatCurrency = (value: number, blur: boolean = false) => {
  if (blur) return '****';
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatCurrencyAbsolute = (value: number, blur: boolean = false) => {
  if (blur) return '****';
  return `$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// ============================================================
// STRICT NUMERIC VALIDATION - Only allows numbers, single decimal, single negative
// ============================================================

/**
 * Strips all non-numeric characters except valid decimal point and negative sign.
 * Rules:
 * - Only digits 0-9 allowed
 * - Single decimal point allowed (not at start)
 * - Single negative sign allowed ONLY at the very beginning
 * - All letters and special symbols are completely stripped
 */
const sanitizeNumericInput = (value: string, allowNegative: boolean = false): string => {
  let result = '';
  let hasDecimal = false;
  let hasNegative = false;

  for (let i = 0; i < value.length; i++) {
    const char = value[i];

    // Handle negative sign - only at the very beginning, only one allowed
    if (char === '-' && allowNegative && i === 0 && !hasNegative) {
      result += char;
      hasNegative = true;
      continue;
    }

    // Handle decimal point - only one allowed
    if (char === '.' && !hasDecimal) {
      result += char;
      hasDecimal = true;
      continue;
    }

    // Only digits 0-9 are allowed
    if (/[0-9]/.test(char)) {
      result += char;
    }
    // All other characters (letters, symbols, spaces) are completely ignored
  }

  return result;
};

/**
 * Parse sanitized numeric string to number.
 * Returns 0 for empty or invalid strings.
 */
const parseFormattedPrice = (value: string): number => {
  const sanitized = sanitizeNumericInput(value, true);
  if (!sanitized || sanitized === '-' || sanitized === '.') return 0;
  return parseFloat(sanitized) || 0;
};

/**
 * Format number for display in input fields.
 */
const formatPriceInput = (value: number): string => {
  if (value === 0) return '';
  return value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 5 });
};

const formatDate = (dateStr: string) => {
  const date = dateStr.length <= 10 ? new Date(`${dateStr}T00:00:00`) : new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const cn = (...classes: (string | boolean | undefined)[]) =>
  classes.filter(Boolean).join(' ');

// ---- Trade duration display helpers (Trade Detail Modal only) ----
// Pure, read-only formatting utilities that operate on the already-saved
// `startTime` / `endTime` strings (stored as "HH:MM", 24h). These do not
// mutate `trades`, do not participate in save/update logic, and exist
// solely to support rendering in the trade preview/detail modal.
const formatTimeDisplay = (time?: string): string | null => {
  if (!time) return null;
  const [hStr, mStr] = time.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:${String(m).padStart(2, '0')} ${period}`;
};

// Returns total minutes between startTime and endTime ("HH:MM" 24h strings).
// If endTime is earlier than startTime, assumes the trade crossed midnight.
const calculateTradeDurationMinutes = (startTime?: string, endTime?: string): number | null => {
  if (!startTime || !endTime) return null;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  if ([sh, sm, eh, em].some(n => Number.isNaN(n))) return null;
  let diffMinutes = (eh * 60 + em) - (sh * 60 + sm);
  if (diffMinutes < 0) diffMinutes += 24 * 60; // trade spanned midnight
  return diffMinutes;
};

// Formats a minute count into a compact label, e.g. "10 mins" or "1h 15m".
const formatTradeDuration = (minutes: number | null): string | null => {
  if (minutes === null) return null;
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'}`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return remMinutes === 0 ? `${hours}h` : `${hours}h ${remMinutes}m`;
};

// Manual "Trade #" badge — user-entered reference (e.g. Notion log ID, day marker).
// Kept intentionally minimal (dark chip, thin border) so it sits quietly alongside
// the rules-followed indicator instead of competing for attention.
const TrackingBadge: React.FC<{ value?: string; size?: 'sm' | 'md' }> = ({ value, size = 'md' }) => {
  if (!value) return null;
  const isSm = size === 'sm';
  return (
    <span
      className={cn(
        'inline-flex items-center flex-shrink-0 rounded bg-zinc-900 border border-zinc-800 font-mono font-medium text-zinc-300 tracking-wide',
        isSm ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
      )}
    >
      #{value}
    </span>
  );
};

// Compact session tag (e.g. "nyc", "london") — pairs with TrackingBadge for a
// quick-glance, Notion-style overview on trade cards.
const SessionBadge: React.FC<{ value?: SessionOption | string; size?: 'sm' | 'md' }> = ({ value, size = 'md' }) => {
  if (!value) return null;
  const isSm = size === 'sm';
  const label = SESSION_SHORT_LABEL[value as SessionOption] || value.toLowerCase();
  return (
    <span
      className={cn(
        'inline-flex items-center rounded bg-zinc-900 border border-zinc-800 font-mono font-medium text-zinc-500 tracking-wide',
        isSm ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
      )}
    >
      {label}
    </span>
  );
};

// ============================================================
// CALCULATOR VALIDATION - Same strict rules as input fields
// ============================================================

/**
 * Validates calculator input value - strips any invalid characters.
 * Used when calculator buttons are pressed or when syncing to input fields.
 */
const sanitizeCalculatorValue = (value: string, allowNegative: boolean = true): string => {
  return sanitizeNumericInput(value, allowNegative);
};

// Tracks viewport width so we can compute responsive column counts
function useViewportWidth() {
  const [width, setWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1280));
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return width;
}

// Reusable hook: closes a dropdown/popover when clicking outside its ref'd container
function useClickOutside(ref: React.RefObject<HTMLElement>, onOutsideClick: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onOutsideClick();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [active, onOutsideClick, ref]);
}

// Draggable Popup Calculator Component
interface CalculatorProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onEnter: () => void;
  initialPosition: { top: number; left: number };
  allowNegative?: boolean;
  theme?: 'light' | 'dark';
}

const PopupCalculator: React.FC<CalculatorProps> = ({ value, onChange, onClose, onEnter, initialPosition, allowNegative = true, theme = 'dark' }) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const calculatorRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.left,
      y: e.clientY - position.top,
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        left: Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - 220)),
        top: Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - 280)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calculatorRef.current && !calculatorRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Calculator input handler - enforces strict numeric validation
  const handleInput = (val: string) => {
    if (val === 'C') {
      onChange('');
    } else if (val === 'backspace') {
      // Remove last character and re-sanitize
      const newValue = sanitizeCalculatorValue(value.slice(0, -1), allowNegative);
      onChange(newValue);
    } else if (val === '.') {
      // Only add decimal if not already present
      if (!value.includes('.')) {
        const newValue = sanitizeCalculatorValue(value + '.', allowNegative);
        onChange(newValue);
      }
    } else if (val === '-') {
      // Toggle negative sign - only at beginning
      if (allowNegative) {
        if (value.startsWith('-')) {
          onChange(value.slice(1));
        } else if (value === '' || !value.includes('-')) {
          onChange('-' + value);
        }
      }
    } else {
      // Digit pressed - sanitize and append
      const newValue = sanitizeCalculatorValue(value + val, allowNegative);
      onChange(newValue);
    }
  };

  const handleEnter = () => {
    onEnter();
    onClose();
  };

  return (
    <div
      ref={calculatorRef}
      className={cn(
        "fixed z-[100] rounded-xl shadow-2xl p-2 w-52 select-none transition-colors",
        theme === 'dark' ? 'bg-zinc-900 border border-zinc-700' : 'bg-white border border-zinc-200'
      )}
      style={{ top: position.top, left: position.left, cursor: isDragging ? 'grabbing' : 'default' }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        onMouseDown={handleMouseDown}
        className={cn(
          "flex items-center justify-between mb-2 px-1 py-1 rounded cursor-grab transition-colors",
          theme === 'dark' ? 'hover:bg-zinc-800/50' : 'hover:bg-zinc-100'
        )}
      >
        <div className="flex items-center gap-2">
          <GripVertical className={cn("w-3 h-3", theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400')} />
          <Calculator className={cn("w-3 h-3", theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400')} />
          <span className={cn("text-xs", theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400')}>Calculator</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={cn(
            "p-0.5 transition-colors rounded",
            theme === 'dark' ? 'text-zinc-500 hover:text-white hover:bg-zinc-700' : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200'
          )}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className={cn(
        "rounded-lg px-3 py-2 mb-2 text-right font-mono text-lg min-h-[40px] overflow-hidden",
        theme === 'dark' ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-900'
      )}>
        {value || '0'}
      </div>
      <div className="grid grid-cols-3 gap-1 mb-1">
        {['7', '8', '9', '4', '5', '6', '1', '2', '3', (allowNegative ? '-' : '0'), '0', '.'].map(btn => (
          <button
            type="button"
            key={btn}
            onClick={() => handleInput(btn)}
            className={cn(
              "h-10 rounded-lg font-medium transition-colors",
              theme === 'dark'
                ? 'bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-white'
                : 'bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 text-zinc-900'
            )}
          >
            {btn}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1">
        <button
          type="button"
          onClick={() => handleInput('C')}
          className="h-8 bg-red-500/20 hover:bg-red-500/30 active:bg-red-500/40 text-red-500 rounded-lg font-medium transition-colors"
        >
          C
        </button>
        <button
          type="button"
          onClick={() => handleInput('backspace')}
          className={cn(
            "h-8 rounded-lg font-medium transition-colors flex items-center justify-center",
            theme === 'dark'
              ? 'bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-500 text-white'
              : 'bg-zinc-200 hover:bg-zinc-300 active:bg-zinc-400 text-zinc-900'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleEnter}
          className="h-8 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
        >
          <CornerDownLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Modern Time Input with full clickable container
interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

const TimeInput: React.FC<TimeInputProps> = ({ value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [h, m] = value ? value.split(':') : ['', ''];
  const hour = h || '00';
  const minute = m || '00';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const setHour = (newHour: string) => onChange(`${newHour}:${minute}`);
  const setMinute = (newMinute: string) => onChange(`${hour}:${newMinute}`);

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  return (
    <div ref={wrapRef} className="relative">
      <label className="block text-xs text-zinc-400 mb-1.5">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-full bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-center hover:border-zinc-700 focus:outline-none focus:border-zinc-600 transition-colors group select-none overflow-hidden"
      >
        <div className="flex items-center pl-4 pr-2 text-zinc-400 group-hover:text-zinc-300 transition-colors">
          <Clock className="w-4 h-4" />
        </div>
        <div className="flex-1 py-3 pl-1 text-left">
          <span className={cn('text-sm', value ? 'text-white' : 'text-zinc-500')}>
            {value || 'Select time'}
          </span>
        </div>
        {value ? (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(''); }}
            className="px-3 py-3 text-zinc-500 hover:text-red-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </span>
        ) : (
          <div className="pr-4 py-3 text-zinc-600">
            <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl z-30 p-2 flex gap-2 w-full min-w-[180px]">
          <div className="flex-1">
            <div className="text-[10px] text-zinc-500 text-center mb-1">Hour</div>
            <div className="h-40 overflow-y-auto rounded-lg bg-zinc-900/50">
              {hours.map(hh => (
                <button
                  key={hh}
                  type="button"
                  onClick={() => setHour(hh)}
                  className={cn(
                    'w-full text-center px-2 py-1.5 text-sm hover:bg-zinc-700 transition-colors',
                    hour === hh ? 'text-white bg-zinc-700 font-medium' : 'text-zinc-400'
                  )}
                >
                  {hh}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <div className="text-[10px] text-zinc-500 text-center mb-1">Min</div>
            <div className="h-40 overflow-y-auto rounded-lg bg-zinc-900/50">
              {minutes.map(mm => (
                <button
                  key={mm}
                  type="button"
                  onClick={() => setMinute(mm)}
                  className={cn(
                    'w-full text-center px-2 py-1.5 text-sm hover:bg-zinc-700 transition-colors',
                    minute === mm ? 'text-white bg-zinc-700 font-medium' : 'text-zinc-400'
                  )}
                >
                  {mm}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Modern Date Input with full clickable container
interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

const DateInput: React.FC<DateInputProps> = ({ value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? new Date(value + 'T00:00:00') : null;
  const [viewMonth, setViewMonth] = useState(() => {
    const d = selectedDate || new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openCalendar = () => {
    const d = selectedDate || new Date();
    setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    setIsOpen(!isOpen);
  };

  const toISODate = (d: Date) => {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${da}`;
  };

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const firstOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const startOffset = firstOfMonth.getDay();
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const today = new Date();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));

  return (
    <div ref={wrapRef} className="relative">
      <label className="block text-xs text-zinc-400 mb-1.5">{label}</label>
      <button
        type="button"
        onClick={openCalendar}
        className="relative w-full bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-center hover:border-zinc-700 focus:outline-none focus:border-zinc-600 transition-colors group select-none overflow-hidden"
      >
        <div className="flex items-center pl-4 pr-2 text-zinc-400 group-hover:text-zinc-300 transition-colors">
          <CalendarDays className="w-4 h-4" />
        </div>
        <div className="flex-1 py-3 pl-1 text-left">
          <span className={cn('text-sm', value ? 'text-white' : 'text-zinc-500')}>
            {value ? new Date(value + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select date'}
          </span>
        </div>
        <div className="pr-4 py-3 text-zinc-600">
          <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl z-30 p-3 w-64">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
              className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-white">
              {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button
              type="button"
              onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
              className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="text-center text-[10px] text-zinc-500 py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => (
              <button
                key={i}
                type="button"
                disabled={!d}
                onClick={() => { if (d) { onChange(toISODate(d)); setIsOpen(false); } }}
                className={cn(
                  'aspect-square text-xs rounded-lg flex items-center justify-center transition-colors',
                  !d ? 'invisible' :
                  selectedDate && isSameDay(d, selectedDate) ? 'bg-white text-zinc-900 font-medium' :
                  isSameDay(d, today) ? 'text-white border border-zinc-600' :
                  'text-zinc-300 hover:bg-zinc-700'
                )}
              >
                {d ? d.getDate() : ''}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => { onChange(toISODate(new Date())); setIsOpen(false); }}
            className="w-full mt-2 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>
      )}
    </div>
  );
};

// Multi-Select Dropdown Component
interface MultiSelectDropdownProps {
  label: string;
  options: { id: string; name: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  onAddNew?: (name: string) => void;
  onDeleteOption?: (id: string, name: string) => void;
  placeholder?: string;
  colorScheme?: 'default' | 'red';
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  options,
  selected,
  onChange,
  onAddNew,
  onDeleteOption,
  placeholder = 'None yet',
  colorScheme = 'default',
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState('');
  const addInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding) addInputRef.current?.focus();
  }, [isAdding]);

  const toggleItem = (name: string) => {
    if (selected.includes(name)) {
      onChange(selected.filter(s => s !== name));
    } else {
      onChange([...selected, name]);
    }
  };

  const handleAddNew = () => {
    if (newItem.trim() && onAddNew) {
      const trimmed = newItem.trim();
      onAddNew(trimmed);
      onChange([...selected, trimmed]);
      setNewItem('');
      setIsAdding(false);
    }
  };

  const activeClasses = colorScheme === 'red'
    ? 'bg-red-500 text-white border-red-500'
    : 'bg-white text-zinc-900 border-white';
  const inactiveClasses = colorScheme === 'red'
    ? 'bg-zinc-800/60 text-zinc-400 border-zinc-700/80 hover:border-red-500/50 hover:text-red-300 hover:bg-zinc-800'
    : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/80 hover:border-zinc-500 hover:text-zinc-200 hover:bg-zinc-800';

  return (
    <div>
      <label className="block text-xs text-zinc-400 mb-2">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.length === 0 && !onAddNew && (
          <span className="text-xs text-zinc-600 py-1.5">{placeholder}</span>
        )}
        {options.map(opt => {
          const isSelected = selected.includes(opt.name);
          return (
            <div key={opt.id} className="group relative">
              <button
                type="button"
                onClick={() => toggleItem(opt.name)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 flex items-center gap-1',
                  onDeleteOption && 'pr-6',
                  isSelected ? activeClasses : inactiveClasses
                )}
              >
                {isSelected && <Check className="w-3 h-3" />}
                <span className="truncate max-w-[140px]">{opt.name}</span>
              </button>
              {onDeleteOption && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDeleteOption(opt.id, opt.name);
                  }}
                  title={`Delete "${opt.name}"`}
                  className={cn(
                    'absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded-full transition-all duration-150',
                    'opacity-0 group-hover:opacity-100 focus:opacity-100',
                    isSelected ? 'hover:bg-black/20 text-current' : 'hover:bg-zinc-700 text-zinc-500 hover:text-white'
                  )}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        {onAddNew && (
          isAdding ? (
            <div className="flex items-center gap-1">
              <input
                ref={addInputRef}
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); handleAddNew(); }
                  if (e.key === 'Escape') { setIsAdding(false); setNewItem(''); }
                }}
                onBlur={() => { if (!newItem.trim()) setIsAdding(false); }}
                placeholder="New..."
                className="w-24 bg-zinc-800 border border-zinc-600 rounded-full px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleAddNew}
                className="p-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-full text-zinc-300 hover:text-white transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 transition-all duration-150 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          )
        )}
      </div>
    </div>
  );
};

// Small free-text tag input — lets a user type a custom value (e.g. an emotion not in the
// preset list) and add it as a removable chip. Complements MultiSelectDropdown for fields
// that need ad-hoc, non-persisted tags rather than a shared global option list.
interface EditableTagInputProps {
  values: string[];
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
  placeholder?: string;
  colorScheme?: 'default' | 'violet' | 'red';
}

const EditableTagInput: React.FC<EditableTagInputProps> = ({ values, onAdd, onRemove, placeholder = 'Add custom...', colorScheme = 'default' }) => {
  const [draft, setDraft] = useState('');

  const chipClasses = colorScheme === 'violet'
    ? 'bg-violet-500/15 text-violet-300 border-violet-500/30'
    : colorScheme === 'red'
    ? 'bg-red-500/15 text-red-300 border-red-500/30'
    : 'bg-zinc-800 text-zinc-300 border-zinc-700';

  const submit = () => {
    const trimmed = draft.trim();
    if (trimmed) {
      onAdd(trimmed);
      setDraft('');
    }
  };

  return (
    <div className="mt-2 space-y-2">
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map(v => (
            <span key={v} className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border', chipClasses)}>
              {v}
              <button type="button" onClick={() => onRemove(v)} className="hover:opacity-70">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
        onBlur={submit}
        placeholder={placeholder}
        className="w-full bg-zinc-800/60 border border-dashed border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
      />
    </div>
  );
};

// Compact Timeframe Chart Input with dropdown menu
interface TimeframeChartInputProps {
  timeframe: string;
  images: TradeImage[];
  notes: string;
  onAddImage: (url: string) => void;
  onUploadImage: (file: File) => void;
  onRemoveImage: (imageId: string) => void;
  onReorderImages: (fromIndex: number, toIndex: number) => void;
  onPreviewImage: (url: string) => void;
  onNotesChange: (notes: string) => void;
  isExecution?: boolean;
}

const TimeframeChartInput: React.FC<TimeframeChartInputProps> = ({
  timeframe,
  images,
  notes,
  onAddImage,
  onUploadImage,
  onRemoveImage,
  onReorderImages,
  onPreviewImage,
  onNotesChange,
  isExecution = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  // Drag-and-drop reorder state — purely local UI state for showing which
  // thumbnail is being dragged / hovered over. Actual reordering happens via
  // onReorderImages, which updates the trade's timeframes state.
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  // Brief inline feedback when a "Paste Link" attempt fails (empty/blocked
  // clipboard, or clipboard content that doesn't look like an image link).
  const [pasteFeedback, setPasteFeedback] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUrlSubmit = () => {
    const url = prompt('Enter image URL:');
    if (url?.trim()) {
      onAddImage(url.trim());
    }
    setShowMenu(false);
  };

  // Reads the user's most recently copied text and, if it looks like an
  // image link, adds it straight away via the same onAddImage handler used
  // by the "Image URL" button — skipping the manual prompt + Ctrl+V step.
  // Clipboard access is read-only text and only ever feeds the existing
  // add-image-url state handler; nothing else about the trade is touched.
  const handleQuickPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text?.trim()) {
        setPasteFeedback('Clipboard is empty');
        setTimeout(() => setPasteFeedback(null), 2000);
        return;
      }
      const trimmed = text.trim();
      const isImage = /\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i.test(trimmed) || trimmed.includes('tradingview.com/x/');
      if (isImage) {
        onAddImage(trimmed);
        setShowMenu(false);
      } else {
        setPasteFeedback('Clipboard link doesn\'t look like an image');
        setTimeout(() => setPasteFeedback(null), 2000);
      }
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
      setPasteFeedback('Clipboard access blocked');
      setTimeout(() => setPasteFeedback(null), 2000);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUploadImage(file);
    setShowMenu(false);
    e.target.value = '';
  };

  // ---- Native HTML5 drag-and-drop reordering ----
  // Each thumbnail carries its own index + the owning timeframe name via
  // dataTransfer, so a drop is only honored when it lands back inside the
  // same timeframe block (dragging between "Daily" and "1H", for example,
  // is a no-op). This only reorders the images array for this timeframe —
  // it never touches any other trade field.
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('draggedIndex', index.toString());
    e.dataTransfer.setData('category', timeframe);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const draggedIdx = parseInt(e.dataTransfer.getData('draggedIndex'), 10);
    const originCategory = e.dataTransfer.getData('category');
    setDraggedIndex(null);
    setDragOverIndex(null);
    if (originCategory !== timeframe) return; // only reorder within the same timeframe block
    if (Number.isNaN(draggedIdx)) return;
    onReorderImages(draggedIdx, targetIndex);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className={cn(
      'bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/50',
      isExecution && 'md:col-span-2'
    )}>
      <div className="flex items-center justify-between mb-2">
        <h4 className={cn('text-sm font-semibold', isExecution ? 'text-white' : 'text-zinc-300')}>
          {timeframe}
        </h4>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">{images.length}</span>
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleQuickPaste();
              }}
              className="p-1.5 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors"
              title="Quick Paste from Clipboard"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
            </button>
            {pasteFeedback && (
              <div className="absolute right-0 top-full mt-1 px-2 py-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-20 whitespace-nowrap">
                <p className="text-[11px] text-amber-400">{pasteFeedback}</p>
              </div>
            )}
          </div>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-zinc-400 hover:text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-20 overflow-hidden min-w-[160px]">
                <button
                  type="button"
                  onClick={handleUrlSubmit}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
                >
                  <Link className="w-3.5 h-3.5" />
                  Image URL
                </button>
                <label className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  Upload File
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {images.length > 0 && (
        <div className={cn('grid gap-1.5 mb-2', isExecution ? 'grid-cols-3' : 'grid-cols-2')}>
          {images.map((img, index) => (
            <div
              key={img.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                'relative rounded-lg overflow-hidden group cursor-grab active:cursor-grabbing transition-all',
                draggedIndex === index && 'opacity-40',
                dragOverIndex === index && draggedIndex !== index && 'ring-2 ring-sky-400'
              )}
            >
              <img
                src={img.url}
                alt={timeframe}
                draggable={false}
                className={cn('w-full object-cover pointer-events-none', isExecution ? 'h-16' : 'h-12')}
              />
              <button
                type="button"
                onClick={() => onPreviewImage(img.url)}
                className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 opacity-0 group-hover:opacity-100 transition-all"
                title="View full size"
              >
                <Eye className="w-4 h-4 text-white drop-shadow" />
              </button>
              {isExecution && index === 0 && (
                <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 rounded text-[9px] font-semibold text-sky-300 uppercase tracking-wide">
                  Cover
                </span>
              )}
              <button
                type="button"
                onClick={() => onRemoveImage(img.id)}
                className="absolute top-1 right-1 p-1 bg-black/60 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <textarea
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder={`Notes...`}
        rows={isExecution ? 2 : 1}
        className="w-full bg-zinc-700/50 border border-zinc-600/50 rounded-lg px-2 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-none"
      />
    </div>
  );
};

// Detect symbol type for point calculation
const detectSymbolType = (symbol: string): 'INDEX' | 'GOLD' | 'MANUAL' => {
  const s = symbol.toUpperCase();
  if (s.includes('NQ') || s.includes('NASDAQ') || s === 'ES' || s.includes('ES (') || s.includes('S&P') || s.includes('SPX')) return 'INDEX';
  if (s.includes('XAU') || s.includes('GOLD')) return 'GOLD';
  return 'MANUAL';
};

const calculatePoints = (symbol: string, price: number, ref: number): number => {
  if (price === 0 || ref === 0) return 0;
  const diff = Math.abs(price - ref);
  const type = detectSymbolType(symbol);
  switch (type) {
    case 'INDEX':
      return Math.round(diff);
    case 'GOLD':
      return Math.round(diff * 10) / 10;
    default:
      return 0;
  }
};

// Compress base64 image
const compressImage = (base64: string, maxWidth: number = 800): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = img.width / img.height;
      const width = Math.min(img.width, maxWidth);
      const height = width / ratio;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      } else {
        resolve(base64);
      }
    };
    img.onerror = () => resolve(base64);
  });
};

// Calculate account metrics
interface AccountMetrics {
  currentBalance: number;
  highestBalance: number;
  threshold: number;
  drawdownAmount: number;
  drawdownProgress: number;
  profitProgress: number;
  isBreached: boolean;
  isLocked: boolean;
  lockThreshold?: number;
}

const calculateAccountMetrics = (
  account: Account,
  accountTrades: Trade[]
): AccountMetrics => {
  const startingBalance = account.startingBalance;
  const accountPnL = accountTrades.reduce((s, t) => s + t.profitLoss, 0);
  const currentBalance = startingBalance + accountPnL;

  const tradingType = account.tradingAccountType || 'LIVE';
  const maxDrawdownAllowance = account.maxDrawdownAllowance || 0;

  let threshold = 0;
  let drawdownAmount = 0;
  let drawdownProgress = 0;
  let isBreached = false;
  let isLocked = false;
  let lockThreshold: number | undefined;

  let highestBalance = startingBalance;

  if (tradingType === 'FUTURES' && maxDrawdownAllowance > 0) {
    const sortedTrades = [...accountTrades].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const tradesByDate = new Map<string, Trade[]>();
    for (const trade of sortedTrades) {
      const date = trade.date;
      if (!tradesByDate.has(date)) {
        tradesByDate.set(date, []);
      }
      tradesByDate.get(date)!.push(trade);
    }

    let runningBalance = startingBalance;
    let eodPeak = startingBalance;
    const dates = Array.from(tradesByDate.keys()).sort();

    for (const date of dates) {
      const dayTrades = tradesByDate.get(date)!;
      let intradayPeak = runningBalance;

      for (const trade of dayTrades) {
        runningBalance += trade.profitLoss;
        intradayPeak = Math.max(intradayPeak, runningBalance);
      }

      const currentThreshold = Math.max(eodPeak - maxDrawdownAllowance, startingBalance - maxDrawdownAllowance);
      if (runningBalance <= currentThreshold) {
        isBreached = true;
      }

      eodPeak = Math.max(eodPeak, intradayPeak);

      const profitCapTrigger = startingBalance + maxDrawdownAllowance;
      if (eodPeak >= profitCapTrigger) {
        isLocked = true;
        lockThreshold = startingBalance;
      }
    }

    highestBalance = Math.max(eodPeak, runningBalance, account.highestBalance || startingBalance);

    if (isLocked) {
      threshold = startingBalance;
    } else {
      const initialThreshold = startingBalance - maxDrawdownAllowance;
      threshold = Math.max(highestBalance - maxDrawdownAllowance, initialThreshold);
    }

    drawdownAmount = highestBalance - currentBalance;
    drawdownProgress = Math.min((drawdownAmount / maxDrawdownAllowance) * 100, 100);

    if (currentBalance <= threshold) {
      isBreached = true;
    }

  } else if (tradingType === 'CFD') {
    const fixedMin = account.fixedMinBalance || 0;
    threshold = fixedMin;
    drawdownAmount = Math.max(0, startingBalance - currentBalance);

    if (fixedMin > 0) {
      const allowance = startingBalance - fixedMin;
      drawdownProgress = allowance > 0
        ? Math.min((drawdownAmount / allowance) * 100, 100)
        : 0;
    }

    isBreached = currentBalance <= fixedMin;
    highestBalance = Math.max(startingBalance, currentBalance);

  } else {
    threshold = 0;
    drawdownAmount = Math.max(0, startingBalance - currentBalance);
    drawdownProgress = startingBalance > 0
      ? Math.min((drawdownAmount / startingBalance) * 100, 100)
      : 0;
    isBreached = currentBalance <= 0;
    highestBalance = Math.max(startingBalance, currentBalance);
  }

  const profitProgress = account.profitTarget && account.profitTarget > 0
    ? Math.min((accountPnL / account.profitTarget) * 100, 100)
    : 0;

  return {
    currentBalance,
    highestBalance,
    threshold,
    drawdownAmount,
    drawdownProgress,
    profitProgress,
    isBreached,
    isLocked,
    lockThreshold,
  };
};

// Reusable modal backdrop
const ModalBackdrop: React.FC<{
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}> = ({ onClose, children, className }) => {
  const mouseDownOnBackdropRef = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    mouseDownOnBackdropRef.current = e.target === e.currentTarget;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (mouseDownOnBackdropRef.current && e.target === e.currentTarget) {
      onClose();
    }
    mouseDownOnBackdropRef.current = false;
  };

  return (
    <div
      className={className}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {children}
    </div>
  );
};

// ============================================================
// STRICT NUMERIC INPUT COMPONENT
// ============================================================

interface NumericInputProps {
  value: string;
  onChange: (value: string, numericValue: number) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  allowNegative?: boolean;
  label?: string;
}

const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder = '0',
  className = '',
  allowNegative = false,
  label,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    // STRICT VALIDATION: Strip everything except digits, decimal, and negative (if allowed)
    const sanitized = sanitizeNumericInput(rawValue, allowNegative);
    const numericValue = parseFormattedPrice(sanitized);
    onChange(sanitized, numericValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const controlKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End', 'Enter', 'Escape'];
    if (controlKeys.includes(e.key)) return;
    if (e.ctrlKey || e.metaKey) return;
    if (e.key === '.' || e.key === ',') return;
    if (allowNegative && e.key === '-') return;
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    const pattern = allowNegative ? /^-?[0-9.,]*$/ : /^[0-9.,]*$/;
    if (!pattern.test(text)) {
      e.preventDefault();
    }
  };

  return (
    <div className="w-full">
      {label && <label className="block text-xs text-zinc-400 mb-1.5">{label}</label>}
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        className={cn(
          'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-zinc-600',
          className
        )}
      />
    </div>
  );
};

function App() {
  // State
  const [view, setView] = useState<ViewType>('dashboard');
  const [privacyMode, setPrivacyMode] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // PHASE 0 (Mobile Instrumentation): tracks whether the off-canvas mobile
  // sidebar drawer is open. Fully independent from `sidebarCollapsed`, which
  // remains the desktop-only expand/collapse control.
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [galleryView, setGalleryView] = useState<GalleryView>('gallery');
  const [tradeFilter, setTradeFilter] = useState<TradeFilter>('all');
  const [tradeSortField, setTradeSortField] = useState<TradeSortField>('date');
  const [tradeSortOrder, setTradeSortOrder] = useState<SortOrder>('desc');
  const viewportWidth = useViewportWidth();
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(['all']);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  // Calculator state
  const [calculatorState, setCalculatorState] = useState<{
    show: boolean;
    fieldId: string;
    value: string;
    position: { top: number; left: number };
    allowNegative: boolean;
  }>({ show: false, fieldId: '', value: '', position: { top: 0, left: 0 }, allowNegative: false });

  const activeInputRef = useRef<HTMLInputElement | null>(null);

  const resetCalculator = useCallback(() => {
    setCalculatorState({ show: false, fieldId: '', value: '', position: { top: 0, left: 0 }, allowNegative: false });
  }, []);

  const handleNumberInputFocus = (e: React.FocusEvent<HTMLInputElement>, fieldId: string, currentValue: string, allowNegative: boolean = false) => {
    const rect = e.target.getBoundingClientRect();
    activeInputRef.current = e.target;

    const CALC_WIDTH = 220;
    const CALC_HEIGHT = 280;
    const MARGIN = 10;

    const spaceBelow = window.innerHeight - rect.bottom;
    let top: number;
    if (spaceBelow >= CALC_HEIGHT + MARGIN) {
      top = rect.bottom + 4;
    } else {
      const aboveTop = rect.top - CALC_HEIGHT - 4;
      top = aboveTop >= MARGIN ? aboveTop : Math.max(MARGIN, window.innerHeight - CALC_HEIGHT - MARGIN);
    }

    setCalculatorState({
      show: true,
      fieldId,
      value: currentValue,
      position: {
        top,
        left: Math.max(MARGIN, Math.min(rect.left, window.innerWidth - CALC_WIDTH - MARGIN)),
      },
      allowNegative,
    });
  };

  // Calculator change handler - enforces strict validation
  const handleCalculatorChange = (value: string) => {
    // The calculator already sanitizes input, but double-check here
    const sanitized = sanitizeCalculatorValue(value, calculatorState.allowNegative);
    setCalculatorState(prev => ({ ...prev, value: sanitized }));
    updateFieldFromCalculator(calculatorState.fieldId, sanitized);
  };

  const updateFieldFromCalculator = (fieldId: string, value: string) => {
    const numVal = parseFormattedPrice(value);

    if (fieldId.startsWith('trade-')) {
      const key = fieldId.replace('trade-', '');
      setPriceInputs(prev => ({ ...prev, [key]: value }));

      if (key === 'entryPrice') {
        setNewTrade(prev => ({
          ...prev,
          entryPrice: numVal,
          slPoints: calculatePoints(prev.symbol || '', numVal, prev.stopLoss || 0),
          tpPoints: calculatePoints(prev.symbol || '', numVal, prev.takeProfit || 0),
        }));
      } else if (key === 'stopLoss') {
        setNewTrade(prev => ({
          ...prev,
          stopLoss: numVal,
          slPoints: calculatePoints(prev.symbol || '', prev.entryPrice || 0, numVal),
        }));
      } else if (key === 'takeProfit') {
        setNewTrade(prev => ({
          ...prev,
          takeProfit: numVal,
          tpPoints: calculatePoints(prev.symbol || '', prev.entryPrice || 0, numVal),
        }));
      } else if (key === 'profitLoss') {
        setNewTrade(prev => ({ ...prev, profitLoss: numVal }));
      } else if (key === 'riskAmount') {
        setNewTrade(prev => ({ ...prev, riskAmount: numVal }));
      } else if (key === 'trackingNumber') {
        setNewTrade(prev => ({ ...prev, trackingNumber: value }));
      }
    } else if (fieldId.startsWith('account-')) {
      const key = fieldId.replace('account-', '');
      if (key === 'startingBalance') {
        setNewAccount(prev => ({ ...prev, startingBalance: numVal, highestBalance: numVal }));
      } else if (key === 'profitTarget') {
        setNewAccount(prev => ({ ...prev, profitTarget: numVal }));
      } else if (key === 'maxDrawdownAllowance') {
        setNewAccount(prev => ({ ...prev, maxDrawdownAllowance: numVal }));
      } else if (key === 'fixedMinBalance') {
        setNewAccount(prev => ({ ...prev, fixedMinBalance: numVal }));
      }
    } else if (fieldId.startsWith('editaccount-')) {
      const key = fieldId.replace('editaccount-', '');
      if (key === 'startingBalance') {
        setEditingAccount(prev => ({ ...prev, startingBalance: numVal }));
      } else if (key === 'profitTarget') {
        setEditingAccount(prev => ({ ...prev, profitTarget: numVal }));
      } else if (key === 'maxDrawdownAllowance') {
        setEditingAccount(prev => ({ ...prev, maxDrawdownAllowance: numVal }));
      } else if (key === 'fixedMinBalance') {
        setEditingAccount(prev => ({ ...prev, fixedMinBalance: numVal }));
      }
    }
  };

  const handleCalculatorEnter = useCallback(() => {
    if (activeInputRef.current) {
      const form = activeInputRef.current.closest('form');
      if (form) {
        const inputs = Array.from(form.querySelectorAll<HTMLElement>('input, select, textarea'));
        const currentIndex = inputs.indexOf(activeInputRef.current);
        if (currentIndex < inputs.length - 1) {
          inputs[currentIndex + 1].focus();
        }
      }
    }
  }, []);

  const closeCalculator = useCallback(() => {
    setCalculatorState(prev => ({ ...prev, show: false }));
  }, []);

  // Data state
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [notices, setNotices] = useState<MarketNotice[]>([]);
  const [noticeScenarios, setNoticeScenarios] = useState<ScenarioRow[]>([]);
  const [wikiEntries, setWikiEntries] = useState<WikiEntry[]>([]);
  const [setupTypes, setSetupTypes] = useState<SetupType[]>([]);
  const [confluences, setConfluences] = useState<Confluence[]>([]);
  const [mistakesList, setMistakesList] = useState<Mistake[]>([]);
  const [customSymbols, setCustomSymbols] = useState<string[]>([]);

  // Modal state
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showEditAccount, setShowEditAccount] = useState<string | null>(null);
  const [showAddTrade, setShowAddTrade] = useState(false);
  const [showEditTrade, setShowEditTrade] = useState(false);
  const [showTradeDetail, setShowTradeDetail] = useState<string | null>(null);
  const [detailNotesDraft, setDetailNotesDraft] = useState<{ mistakesAnalysis: string; lessonsLearned: string }>({ mistakesAnalysis: '', lessonsLearned: '' });
  const [detailRulesFollowedDraft, setDetailRulesFollowedDraft] = useState<'followed' | 'broken'>('followed');
  const [showDisciplineReview, setShowDisciplineReview] = useState<string | null>(null);
  const [disciplineReviewDraft, setDisciplineReviewDraft] = useState<{ emotions: string[]; mistakes: string[]; notes: string }>({ emotions: [], mistakes: [], notes: '' });
  const [showAddRule, setShowAddRule] = useState(false);
  const [showAddNotice, setShowAddNotice] = useState(false);
  const [activeNoticeId, setActiveNoticeId] = useState<string | null>(null);
  const [noticeDraftMessage, setNoticeDraftMessage] = useState('');
  const [showAddScenario, setShowAddScenario] = useState(false);
  const [newScenario, setNewScenario] = useState<{ scenario: string; tags: string; lesson: string }>({ scenario: '', tags: '', lesson: '' });
  const [showAddWiki, setShowAddWiki] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const [showExpandGallery, setShowExpandGallery] = useState(false);
  const [executionImageIndex, setExecutionImageIndex] = useState(0);
  const [timeframeImageIndices, setTimeframeImageIndices] = useState<Record<string, number>>({});

  const [showTradeTimeFields, setShowTradeTimeFields] = useState(false);
  const [showTradePriceLevels, setShowTradePriceLevels] = useState(false);

  // Dropdown state
  const [showAccountTypeDropdown, setShowAccountTypeDropdown] = useState(false);
  const [showTradingAccountTypeDropdown, setShowTradingAccountTypeDropdown] = useState(false);
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false);
  const [symbolCustomInput, setSymbolCustomInput] = useState('');
  const [showSessionDropdown, setShowSessionDropdown] = useState(false);
  const [showTradeControlsPanel, setShowTradeControlsPanel] = useState(false);

  // Trade selection (for bulk delete on Trade History page)
  const [tradeSelectMode, setTradeSelectMode] = useState(false);
  const [selectedTradeIds, setSelectedTradeIds] = useState<string[]>([]);
  const [showDeleteSelectedConfirm, setShowDeleteSelectedConfirm] = useState(false);
  const [accountPendingDelete, setAccountPendingDelete] = useState<string | null>(null);

  const noticeImageInputRef = useRef<HTMLInputElement>(null);
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const tradingAccountTypeDropdownRef = useRef<HTMLDivElement>(null);
  const accountTypeDropdownRef = useRef<HTMLDivElement>(null);
  const symbolDropdownRef = useRef<HTMLDivElement>(null);
  const sessionDropdownRef = useRef<HTMLDivElement>(null);
  const tradeControlsPanelRef = useRef<HTMLDivElement>(null);

  useClickOutside(accountDropdownRef, useCallback(() => setShowAccountDropdown(false), []), showAccountDropdown);
  useClickOutside(tradingAccountTypeDropdownRef, useCallback(() => setShowTradingAccountTypeDropdown(false), []), showTradingAccountTypeDropdown);
  useClickOutside(accountTypeDropdownRef, useCallback(() => setShowAccountTypeDropdown(false), []), showAccountTypeDropdown);
  useClickOutside(symbolDropdownRef, useCallback(() => setShowSymbolDropdown(false), []), showSymbolDropdown);
  useClickOutside(sessionDropdownRef, useCallback(() => setShowSessionDropdown(false), []), showSessionDropdown);
  useClickOutside(tradeControlsPanelRef, useCallback(() => setShowTradeControlsPanel(false), []), showTradeControlsPanel);

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // Form state
  const [newAccount, setNewAccount] = useState<Partial<Account>>({
    name: '',
    startingBalance: 10000,
    type: 'Eval',
    propFirm: '',
    hasProfitTarget: false,
    profitTarget: 0,
    maxDrawdown: 0,
    tradingAccountType: 'LIVE',
    highestBalance: 10000,
    maxDrawdownAllowance: 0,
    fixedMinBalance: 0,
  });
  const [editingAccount, setEditingAccount] = useState<Partial<Account>>({});

  const initializeEmptyTimeframes = (): TimeframeChart[] => {
    return TIMEFRAMES.map(tf => ({
      name: tf,
      images: [],
      notes: '',
    }));
  };

  const [newTrade, setNewTrade] = useState<Partial<Trade>>({
    symbol: '',
    profitLoss: 0,
    entryPrice: 0,
    stopLoss: 0,
    takeProfit: 0,
    setupTypes: [],
    confluences: [],
    mistakes: [],
    rulesFollowed: 'followed',
    timeframes: initializeEmptyTimeframes(),
    executionImages: [],
    riskAmount: 0,
    mistakesAnalysis: '',
    lessonsLearned: '',
    accountId: '',
    date: new Date().toLocaleDateString('en-CA'), // Initialize with today's local date
  });

  const [priceInputs, setPriceInputs] = useState({
    entryPrice: '',
    stopLoss: '',
    takeProfit: '',
    profitLoss: '',
    riskAmount: '',
  });

  const [newRule, setNewRule] = useState<Partial<Rule>>({ category: '', title: '', description: '', severity: 'warning', pillar: 'risk' });
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [newNotice, setNewNotice] = useState<{ title: string; imageUrl: string }>({ title: '', imageUrl: '' });
  const [newNoticeNote, setNewNoticeNote] = useState('');
  const [newWiki, setNewWiki] = useState<Partial<WikiEntry>>({ title: '', content: '', category: '' });

  const [selectedTimeframeTab, setSelectedTimeframeTab] = useState<string>('Execution/Result');

  // R:R calculation
  const calculatedRR = useMemo(() => {
    const pnl = newTrade.profitLoss || 0;
    const risk = newTrade.riskAmount || 0;
    if (risk === 0) return null;
    return pnl / risk;
  }, [newTrade.profitLoss, newTrade.riskAmount]);

  // Load from localStorage
  // Every load goes through migrateStoredData() so data saved by an older
  // version of the app (missing fields, old shapes, etc.) always comes out
  // fully-formed for whatever the CURRENT code expects. See the
  // "DATA SCHEMA VERSIONING & MIGRATION" block near the top of this file.
  useEffect(() => {
    const stored = localStorage.getItem('tradingJournal');
    if (stored) {
      try {
        const raw = JSON.parse(stored);
        const migrated = migrateStoredData(raw);
        setAccounts(migrated.accounts);
        setTrades(migrated.trades);
        setRules(migrated.rules);
        setNotices(migrated.notices);
        setNoticeScenarios(migrated.noticeScenarios);
        setWikiEntries(migrated.wikiEntries);
        setSetupTypes(migrated.setupTypes);
        setConfluences(migrated.confluences);
        setMistakesList(migrated.mistakesList);
        setCustomSymbols(migrated.customSymbols);
        // Write the migrated (current-schema, versioned) shape straight
        // back to localStorage so the migration only has to run once.
        localStorage.setItem('tradingJournal', JSON.stringify(migrated));
      } catch (e) {
        console.error('Failed to load data:', e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    const data: StoredData = { version: DATA_SCHEMA_VERSION, accounts, trades, rules, notices, noticeScenarios, wikiEntries, setupTypes, confluences, mistakesList, customSymbols };
    try {
      localStorage.setItem('tradingJournal', JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save data:', e);
    }
  }, [accounts, trades, rules, notices, noticeScenarios, wikiEntries, setupTypes, confluences, mistakesList, customSymbols]);

  // Initialize selected account
  useEffect(() => {
    if (accounts.length > 0 && !newTrade.accountId) {
      setNewTrade(prev => ({ ...prev, accountId: accounts[0].id }));
    }
  }, [accounts, newTrade.accountId]);

  // Smart "Trade #" suggestion: pre-fills the next sequential number for the
  // selected account (existing trade count for that account + 1) whenever the
  // Add/Edit Trade modal opens, and live-recalculates the moment the Account
  // dropdown is switched to a different account. Only reacts to the modal
  // opening or the account changing — never to trackingNumber itself — so any
  // manual value the user types (or tweaks via the calculator) is always left
  // alone until the account selection actually changes again.
  const tradeNumberAccountRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const modalOpen = showAddTrade || showEditTrade;
    if (!modalOpen) {
      tradeNumberAccountRef.current = undefined;
      return;
    }
    const accountId = newTrade.accountId;
    if (!accountId) return;

    const justOpened = tradeNumberAccountRef.current === undefined;
    const accountChanged = !justOpened && tradeNumberAccountRef.current !== accountId;

    // Editing an existing trade: on first open, keep its own saved Trade #
    // instead of clobbering it with a fresh suggestion. Switching the account
    // afterward still recalculates live, same as the Add flow.
    if (justOpened && showEditTrade) {
      tradeNumberAccountRef.current = accountId;
      return;
    }

    if (justOpened || accountChanged) {
      const countForAccount = trades.filter(t =>
        t.accountId === accountId && (!editingTrade || t.id !== editingTrade.id)
      ).length;
      setNewTrade(prev => ({ ...prev, trackingNumber: String(countForAccount + 1) }));
    }
    tradeNumberAccountRef.current = accountId;
  }, [newTrade.accountId, showAddTrade, showEditTrade]);

  // Reset image indices
  useEffect(() => {
    if (showTradeDetail) {
      setExecutionImageIndex(0);
      setTimeframeImageIndices({});
      setSelectedTimeframeTab('Execution/Result');
      const t = trades.find(tr => tr.id === showTradeDetail);
      if (t) {
        setDetailNotesDraft({ mistakesAnalysis: t.mistakesAnalysis || '', lessonsLearned: t.lessonsLearned || '' });
        setDetailRulesFollowedDraft(t.rulesFollowed);
      }
    }
  }, [showTradeDetail]);

  // Populate Discipline & Psychology Review draft when opened
  useEffect(() => {
    if (showDisciplineReview) {
      const t = trades.find(tr => tr.id === showDisciplineReview);
      if (t) {
        setDisciplineReviewDraft({
          emotions: t.emotions || [],
          mistakes: t.mistakes || [],
          notes: t.notes || '',
        });
      }
    }
  }, [showDisciplineReview]);

  // Update highest balance
  useEffect(() => {
    setAccounts(prevAccounts => prevAccounts.map(account => {
      const accountTrades = trades.filter(t => t.accountId === account.id);
      if (accountTrades.length === 0) return account;

      const tradingType = account.tradingAccountType || 'LIVE';
      let highestBalance = account.startingBalance;

      if (tradingType === 'FUTURES') {
        const sortedTrades = [...accountTrades].sort((a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        const tradesByDate = new Map<string, Trade[]>();
        for (const trade of sortedTrades) {
          const date = trade.date;
          if (!tradesByDate.has(date)) {
            tradesByDate.set(date, []);
          }
          tradesByDate.get(date)!.push(trade);
        }

        let runningBalance = account.startingBalance;
        let eodPeak = account.startingBalance;
        const dates = Array.from(tradesByDate.keys()).sort();

        for (const date of dates) {
          const dayTrades = tradesByDate.get(date)!;
          let intradayPeak = runningBalance;

          for (const trade of dayTrades) {
            runningBalance += trade.profitLoss;
            intradayPeak = Math.max(intradayPeak, runningBalance);
          }

          eodPeak = Math.max(eodPeak, intradayPeak);
        }

        highestBalance = Math.max(eodPeak, runningBalance, account.highestBalance || account.startingBalance);
      } else {
        let peak = account.startingBalance;
        let equity = account.startingBalance;
        const sortedTrades = [...accountTrades].sort((a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        for (const trade of sortedTrades) {
          equity += trade.profitLoss;
          if (equity > peak) peak = equity;
        }

        const currentBalance = account.startingBalance + accountTrades.reduce((s, t) => s + t.profitLoss, 0);
        highestBalance = Math.max(peak, currentBalance, account.highestBalance || account.startingBalance);
      }

      if (highestBalance !== account.highestBalance) {
        return { ...account, highestBalance };
      }
      return account;
    }));
  }, [trades]);

  // Calculated values
  const filteredTrades = useMemo(() => {
    let filtered = trades;
    if (!selectedAccounts.includes('all')) {
      filtered = filtered.filter(t => selectedAccounts.includes(t.accountId));
    }
    if (tradeFilter !== 'all') {
      if (tradeFilter === 'profit') filtered = filtered.filter(t => t.profitLoss > 0);
      else if (tradeFilter === 'loss') filtered = filtered.filter(t => t.profitLoss < 0);
      else filtered = filtered.filter(t => Math.abs(t.profitLoss) < 10);
    }
    const dir = tradeSortOrder === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (tradeSortField) {
        case 'pnl':
          return (a.profitLoss - b.profitLoss) * dir;
        case 'symbol':
          return a.symbol.localeCompare(b.symbol) * dir;
        case 'rr': {
          const rrA = a.riskAmount > 0 ? a.profitLoss / a.riskAmount : 0;
          const rrB = b.riskAmount > 0 ? b.profitLoss / b.riskAmount : 0;
          return (rrA - rrB) * dir;
        }
        case 'date':
        default: {
          const timeA = new Date(a.timestamp).getTime();
          const timeB = new Date(b.timestamp).getTime();
          if (timeA !== timeB) return (timeA - timeB) * dir;
          // Layer 2 tie-breaker: exact same date-time timestamp — fall back to the
          // manually entered Trade # (trackingNumber). Entries without a valid numeric
          // Trade # sort last regardless of direction.
          const numA = parseInt(a.trackingNumber || '', 10);
          const numB = parseInt(b.trackingNumber || '', 10);
          const validA = Number.isFinite(numA);
          const validB = Number.isFinite(numB);
          if (!validA && !validB) return 0;
          if (!validA) return 1;
          if (!validB) return -1;
          return (numA - numB) * dir;
        }
      }
    });
  }, [trades, selectedAccounts, tradeFilter, tradeSortField, tradeSortOrder]);

  // Returns the trade's permanent chronological identity number — its absolute creation
  // position in the master trades array. This is intentionally independent of the current
  // sort field/order and of any active filters, so the badge on a given trade's card never
  // changes just because the list was re-sorted (Date asc/desc, P&L, R:R, etc.) or filtered.
  // Toggling Ascending/Descending only changes which card sits on top — the newest trade
  // naturally carries the highest number (it was created last) and the oldest the lowest,
  // so the badge and its card always travel together.
  const getDisplayTradeNumber = (trade: Trade): number => {
    return trade.absoluteTradeNumber || 0;
  };

  const stats = useMemo(() => {
    const filtered = filteredTrades;
    const totalPnL = filtered.reduce((sum, t) => sum + t.profitLoss, 0);
    const wins = filtered.filter(t => t.profitLoss > 0);
    const losses = filtered.filter(t => t.profitLoss <= 0);
    const winRate = filtered.length > 0 ? (wins.length / filtered.length) * 100 : 0;
    const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.profitLoss, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.profitLoss, 0) / losses.length) : 0;
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0;

    const totalStarting = selectedAccounts.includes('all')
      ? accounts.reduce((s, a) => s + a.startingBalance, 0)
      : accounts.filter(a => selectedAccounts.includes(a.id)).reduce((s, a) => s + a.startingBalance, 0);
    const growth = totalStarting > 0 ? (totalPnL / totalStarting) * 100 : 0;

    return { totalTrades: filtered.length, totalPnL, winRate, profitFactor, avgWin, avgLoss, growth, wins: wins.length, losses: losses.length };
  }, [filteredTrades, accounts, selectedAccounts]);

  const equityData = useMemo(() => {
    let cumulative = selectedAccounts.includes('all')
      ? accounts.reduce((s, a) => s + a.startingBalance, 0)
      : accounts.filter(a => selectedAccounts.includes(a.id)).reduce((s, a) => s + a.startingBalance, 0);

    return filteredTrades.slice().reverse().map(t => {
      cumulative += t.profitLoss;
      return cumulative;
    });
  }, [filteredTrades, accounts, selectedAccounts]);

  // Passive Playbook tracking: for every rule, count how many logged trades
  // carry a Discipline Tracker "mistake" tag that matches it. No manual
  // checkboxes anywhere — this just scans data you already entered while
  // reviewing trades.
  const ruleViolationCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const rule of rules) {
      let count = 0;
      for (const trade of trades) {
        if ((trade.mistakes || []).some(tag => tagMatchesRuleTitle(tag, rule.title))) count++;
      }
      counts[rule.id] = count;
    }
    return counts;
  }, [rules, trades]);

  const calendarDays = useMemo(() => {
    const { year, month } = calendarMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push({ day: null, trades: [], pnl: 0 });
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayTrades = filteredTrades.filter(t => t.date === dateStr);
      const pnl = dayTrades.reduce((s, t) => s + t.profitLoss, 0);
      days.push({ day: d, trades: dayTrades, pnl });
    }
    return days;
  }, [calendarMonth, filteredTrades]);

  // Handlers
  const handleAddAccount = () => {
    if (!newAccount.name) return;
    const account: Account = {
      id: generateId(),
      name: newAccount.name,
      startingBalance: newAccount.startingBalance || 10000,
      type: newAccount.type as Account['type'],
      customTypeName: newAccount.type === 'Custom Challenge' ? newAccount.customTypeName : undefined,
      propFirm: newAccount.propFirm || '',
      createdAt: new Date().toISOString(),
      hasProfitTarget: newAccount.hasProfitTarget || false,
      profitTarget: newAccount.profitTarget || 0,
      maxDrawdown: newAccount.maxDrawdown || 0,
      tradingAccountType: newAccount.tradingAccountType || 'LIVE',
      highestBalance: newAccount.startingBalance || 10000,
      maxDrawdownAllowance: newAccount.maxDrawdownAllowance || 0,
      fixedMinBalance: newAccount.fixedMinBalance || 0,
    };
    setAccounts([...accounts, account]);
    setNewAccount({
      name: '',
      startingBalance: 10000,
      type: 'Eval',
      propFirm: '',
      hasProfitTarget: false,
      profitTarget: 0,
      maxDrawdown: 0,
      tradingAccountType: 'LIVE',
      highestBalance: 10000,
      maxDrawdownAllowance: 0,
      fixedMinBalance: 0,
    });
    resetCalculator();
    setShowAddAccount(false);
  };

  const handleUpdateAccount = () => {
    if (!editingAccount.id || !editingAccount.name) return;
    setAccounts(accounts.map(a => a.id === editingAccount.id ? { ...a, ...editingAccount } as Account : a));
    setEditingAccount({});
    resetCalculator();
    setShowEditAccount(null);
  };

  const handleDeleteAccount = (id: string) => {
    setAccountPendingDelete(id);
  };

  const confirmDeleteAccount = () => {
    if (!accountPendingDelete) return;
    const id = accountPendingDelete;
    setAccounts(accounts.filter(a => a.id !== id));
    setTrades(trades.filter(t => t.accountId !== id));
    if (selectedAccounts.includes(id)) {
      setSelectedAccounts(selectedAccounts.filter(a => a !== id));
    }
    setAccountPendingDelete(null);
  };

  const handleAddTrade = () => {
    if (!newTrade.accountId || !newTrade.symbol) return;
    const chosenDate = newTrade.date || new Date().toISOString().split('T')[0];
    const nextTradeNumber = trades.length > 0
      ? Math.max(...trades.map(t => t.absoluteTradeNumber || 0)) + 1
      : 1;
    const trade: Trade = {
      id: generateId(),
      accountId: newTrade.accountId,
      symbol: newTrade.symbol?.toUpperCase() || '',
      profitLoss: Number(newTrade.profitLoss) || 0,
      entryPrice: Number(newTrade.entryPrice) || 0,
      stopLoss: Number(newTrade.stopLoss) || 0,
      takeProfit: Number(newTrade.takeProfit) || 0,
      slPoints: calculatePoints(newTrade.symbol || '', Number(newTrade.entryPrice) || 0, Number(newTrade.stopLoss) || 0),
      tpPoints: calculatePoints(newTrade.symbol || '', Number(newTrade.entryPrice) || 0, Number(newTrade.takeProfit) || 0),
      setupTypes: newTrade.setupTypes || [],
      confluences: newTrade.confluences || [],
      mistakes: newTrade.mistakes || [],
      rulesFollowed: newTrade.rulesFollowed as 'followed' | 'broken',
      timeframes: newTrade.timeframes || initializeEmptyTimeframes(),
      executionImages: newTrade.executionImages || [],
      riskAmount: Number(newTrade.riskAmount) || 0,
      mistakesAnalysis: newTrade.mistakesAnalysis || '',
      lessonsLearned: newTrade.lessonsLearned || '',
      timestamp: buildLiveTimestamp(chosenDate),
      date: chosenDate,
      startTime: newTrade.startTime,
      endTime: newTrade.endTime,
      absoluteTradeNumber: nextTradeNumber,
      trackingNumber: newTrade.trackingNumber?.trim() || '',
      session: newTrade.session,
    };
    setTrades([...trades, trade]);
    const symbolValue = newTrade.symbol?.toUpperCase() || '';
    if (symbolValue && !PRESET_SYMBOLS.some(p => p.value === symbolValue) && !customSymbols.includes(symbolValue)) {
      setCustomSymbols(prev => [...prev, symbolValue]);
    }
    resetTradeForm();
    resetCalculator();
    setShowAddTrade(false);
  };

  const openEditTrade = (trade: Trade) => {
    setNewTrade({ ...trade });
    setPriceInputs({
      entryPrice: formatPriceInput(trade.entryPrice || 0),
      stopLoss: formatPriceInput(trade.stopLoss || 0),
      takeProfit: formatPriceInput(trade.takeProfit || 0),
      profitLoss: formatPriceInput(trade.profitLoss || 0),
      riskAmount: formatPriceInput(trade.riskAmount || 0),
    });
    setShowTradeTimeFields(!!(trade.startTime || trade.endTime));
    setShowTradePriceLevels(!!(trade.entryPrice || trade.stopLoss || trade.takeProfit));
    setEditingTrade(trade);
    setShowEditTrade(true);
  };

  const handleSaveEditedTrade = () => {
    if (!editingTrade || !newTrade.accountId || !newTrade.symbol) return;
    const chosenDate = newTrade.date || editingTrade.date;
    const updated: Trade = {
      ...editingTrade,
      accountId: newTrade.accountId,
      symbol: newTrade.symbol?.toUpperCase() || '',
      profitLoss: Number(newTrade.profitLoss) || 0,
      entryPrice: Number(newTrade.entryPrice) || 0,
      stopLoss: Number(newTrade.stopLoss) || 0,
      takeProfit: Number(newTrade.takeProfit) || 0,
      slPoints: calculatePoints(newTrade.symbol || '', Number(newTrade.entryPrice) || 0, Number(newTrade.stopLoss) || 0),
      tpPoints: calculatePoints(newTrade.symbol || '', Number(newTrade.entryPrice) || 0, Number(newTrade.takeProfit) || 0),
      setupTypes: newTrade.setupTypes || [],
      confluences: newTrade.confluences || [],
      mistakes: newTrade.mistakes || [],
      rulesFollowed: newTrade.rulesFollowed as 'followed' | 'broken',
      timeframes: newTrade.timeframes || initializeEmptyTimeframes(),
      executionImages: newTrade.executionImages || [],
      riskAmount: Number(newTrade.riskAmount) || 0,
      mistakesAnalysis: newTrade.mistakesAnalysis || '',
      lessonsLearned: newTrade.lessonsLearned || '',
      // Intentionally NOT regenerated here: the original creation timestamp is what
      // drives sort order in Trade History, and it must stay frozen for the lifetime
      // of the trade. Only handleAddTrade (brand-new trades) may call
      // buildLiveTimestamp(). Editing a trade must never bump it to "now", or the
      // trade jumps to the front of the list on every save.
      timestamp: editingTrade.timestamp,
      date: chosenDate,
      startTime: newTrade.startTime,
      endTime: newTrade.endTime,
      trackingNumber: newTrade.trackingNumber?.trim() || '',
      session: newTrade.session,
    };
    setTrades(trades.map(t => t.id === editingTrade.id ? updated : t));
    const symbolValue = newTrade.symbol?.toUpperCase() || '';
    if (symbolValue && !PRESET_SYMBOLS.some(p => p.value === symbolValue) && !customSymbols.includes(symbolValue)) {
      setCustomSymbols(prev => [...prev, symbolValue]);
    }
    setEditingTrade(null);
    resetTradeForm();
    resetCalculator();
    setShowEditTrade(false);
  };

  const handleDeleteTrade = (id: string) => {
    setTrades(trades.filter(t => t.id !== id));
    setShowTradeDetail(null);
    setShowExpandGallery(false);
  };

  // Lightweight patch for post-trade notes & context criteria, editable directly from the
  // trade evaluation preview modal (does not touch the master raw trade setup fields).
  const handleSaveDetailNotes = () => {
    if (!showTradeDetail) return;
    setTrades(prev => prev.map(t => t.id === showTradeDetail
      ? { ...t, mistakesAnalysis: detailNotesDraft.mistakesAnalysis, lessonsLearned: detailNotesDraft.lessonsLearned, rulesFollowed: detailRulesFollowedDraft }
      : t
    ));
  };

  // Saves the Discipline & Psychology Review — updates only emotions, mistakes, and
  // notes on the target trade, leaving every technical field (symbol, P&L, date, etc.) untouched.
  const handleSaveDisciplineReview = () => {
    if (!showDisciplineReview) return;
    setTrades(prev => prev.map(t => t.id === showDisciplineReview
      ? { ...t, emotions: disciplineReviewDraft.emotions, mistakes: disciplineReviewDraft.mistakes, notes: disciplineReviewDraft.notes }
      : t
    ));
    setShowDisciplineReview(null);
  };

  // Trade multi-select helpers
  const toggleTradeSelectMode = () => {
    setTradeSelectMode(prev => !prev);
    setSelectedTradeIds([]);
  };

  const toggleTradeSelected = (id: string) => {
    setSelectedTradeIds(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const toggleSelectAllTrades = () => {
    if (selectedTradeIds.length === filteredTrades.length) {
      setSelectedTradeIds([]);
    } else {
      setSelectedTradeIds(filteredTrades.map(t => t.id));
    }
  };

  const handleDeleteSelectedTrades = () => {
    if (selectedTradeIds.length === 0) return;
    setShowDeleteSelectedConfirm(true);
  };

  const confirmDeleteSelectedTrades = () => {
    setTrades(prev => prev.filter(t => !selectedTradeIds.includes(t.id)));
    setSelectedTradeIds([]);
    setTradeSelectMode(false);
    setShowDeleteSelectedConfirm(false);
  };

  // Helper to get today's date in local YYYY-MM-DD format
  const getTodayLocalDate = () => new Date().toLocaleDateString('en-CA'); // Returns YYYY-MM-DD in local time

  // Theme-aware class helpers
  const tc = {
    // Background classes
    bg: theme === 'dark' ? 'bg-zinc-900' : 'bg-white',
    bgSecondary: theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-100',
    bgTertiary: theme === 'dark' ? 'bg-zinc-950' : 'bg-zinc-50',
    bgHover: theme === 'dark' ? 'hover:bg-zinc-700' : 'hover:bg-zinc-200',
    bgCard: theme === 'dark' ? 'bg-zinc-900/40' : 'bg-white',
    bgCardHover: theme === 'dark' ? 'hover:bg-zinc-900/70' : 'hover:bg-zinc-50',
    // Border classes
    border: theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200',
    borderSecondary: theme === 'dark' ? 'border-zinc-700' : 'border-zinc-300',
    borderHover: theme === 'dark' ? 'hover:border-zinc-700' : 'hover:border-zinc-300',
    // Text classes
    text: theme === 'dark' ? 'text-white' : 'text-zinc-900',
    textSecondary: theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600',
    textMuted: theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400',
    // Input classes
    input: theme === 'dark'
      ? 'bg-zinc-900/50 border-zinc-800 text-white focus:border-zinc-600'
      : 'bg-white border-zinc-200 text-zinc-900 focus:border-zinc-400',
    // Button secondary
    btnSecondary: theme === 'dark'
      ? 'bg-zinc-800 hover:bg-zinc-700 text-white'
      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900',
  };

  const resetTradeForm = () => {
    setNewTrade({
      symbol: '',
      profitLoss: 0,
      entryPrice: 0,
      stopLoss: 0,
      takeProfit: 0,
      setupTypes: [],
      confluences: [],
      mistakes: [],
      rulesFollowed: 'followed',
      timeframes: initializeEmptyTimeframes(),
      executionImages: [],
      riskAmount: 0,
      mistakesAnalysis: '',
      lessonsLearned: '',
      accountId: accounts[0]?.id || '',
      date: getTodayLocalDate(), // Fresh local date on every reset
      trackingNumber: '',
      session: undefined,
    });
    setPriceInputs({ entryPrice: '', stopLoss: '', takeProfit: '', profitLoss: '', riskAmount: '' });
    setShowTradeTimeFields(false);
    setShowTradePriceLevels(false);
  };

  const handleSaveRule = () => {
    if (!newRule.title) return;
    const severity: RuleSeverity = RULE_SEVERITIES.includes(newRule.severity as RuleSeverity) ? (newRule.severity as RuleSeverity) : 'warning';
    const pillar: RulePillar = RULE_PILLARS.includes(newRule.pillar as RulePillar) ? (newRule.pillar as RulePillar) : 'risk';
    if (editingRuleId) {
      setRules(prev => prev.map(r => r.id === editingRuleId
        ? { ...r, category: newRule.category || '', title: newRule.title!, description: newRule.description || '', severity, pillar }
        : r
      ));
    } else {
      setRules(prev => [...prev, { id: generateId(), category: newRule.category || '', title: newRule.title!, description: newRule.description || '', severity, pillar }]);
    }
    setNewRule({ category: '', title: '', description: '', severity: 'warning', pillar: 'risk' });
    setEditingRuleId(null);
    setShowAddRule(false);
  };

  const openAddRuleModal = (pillar: RulePillar = 'risk') => {
    setEditingRuleId(null);
    setNewRule({ category: '', title: '', description: '', severity: 'warning', pillar });
    setShowAddRule(true);
  };

  const openEditRuleModal = (rule: Rule) => {
    setEditingRuleId(rule.id);
    setNewRule({ ...rule });
    setShowAddRule(true);
  };

  const closeRuleModal = () => {
    setShowAddRule(false);
    setEditingRuleId(null);
    setNewRule({ category: '', title: '', description: '', severity: 'warning', pillar: 'risk' });
  };

  const handleDeleteRule = (id: string) => setRules(rules.filter(r => r.id !== id));

  const handleNoticeImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setNewNotice(prev => ({ ...prev, imageUrl: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleAddNotice = () => {
    if (!newNotice.title) return;
    const initialMessages: ChatMessage[] = newNoticeNote.trim()
      ? [{ id: generateId(), text: newNoticeNote.trim(), timestamp: new Date().toISOString() }]
      : [];
    setNotices([...notices, { id: generateId(), title: newNotice.title, imageUrl: newNotice.imageUrl || '', timestamp: new Date().toISOString(), messages: initialMessages }]);
    setNewNotice({ title: '', imageUrl: '' });
    setNewNoticeNote('');
    setShowAddNotice(false);
  };

  const handleDeleteNotice = (id: string) => {
    setNotices(notices.filter(n => n.id !== id));
    if (activeNoticeId === id) setActiveNoticeId(null);
  };

  const handleSendNoticeMessage = () => {
    const text = noticeDraftMessage.trim();
    if (!text || !activeNoticeId) return;
    setNotices(prev => prev.map(n =>
      n.id === activeNoticeId
        ? { ...n, messages: [...n.messages, { id: generateId(), text, timestamp: new Date().toISOString() }] }
        : n
    ));
    setNoticeDraftMessage('');
  };

  const handleAddScenario = () => {
    if (!newScenario.scenario.trim()) return;
    const tags = newScenario.tags.split(',').map(t => t.trim()).filter(Boolean);
    setNoticeScenarios([...noticeScenarios, { id: generateId(), scenario: newScenario.scenario.trim(), tags, lesson: newScenario.lesson.trim() }]);
    setNewScenario({ scenario: '', tags: '', lesson: '' });
    setShowAddScenario(false);
  };

  const handleDeleteScenario = (id: string) => setNoticeScenarios(noticeScenarios.filter(s => s.id !== id));

  const handleAddWiki = () => {
    if (!newWiki.title) return;
    setWikiEntries([...wikiEntries, { id: generateId(), title: newWiki.title, content: newWiki.content || '', category: newWiki.category || '' }]);
    setNewWiki({ title: '', content: '', category: '' });
    setShowAddWiki(false);
  };

  const handleDeleteWiki = (id: string) => setWikiEntries(wikiEntries.filter(w => w.id !== id));

  const handleDeleteSetupType = (id: string, name: string) => {
    setSetupTypes(prev => prev.filter(s => s.id !== id));
    setNewTrade(prev => ({ ...prev, setupTypes: (prev.setupTypes || []).filter(s => s !== name) }));
  };

  const handleDeleteConfluence = (id: string, name: string) => {
    setConfluences(prev => prev.filter(c => c.id !== id));
    setNewTrade(prev => ({ ...prev, confluences: (prev.confluences || []).filter(c => c !== name) }));
  };

  const handleDeleteMistakeType = (id: string, name: string) => {
    setMistakesList(prev => prev.filter(m => m.id !== id));
    setNewTrade(prev => ({ ...prev, mistakes: (prev.mistakes || []).filter(m => m !== name) }));
    setEditingTrade(prev => prev ? { ...prev, mistakes: prev.mistakes.filter(m => m !== name) } : prev);
  };

  // File handlers
  const handleFileUpload = async (file: File, key: string, isEditing: boolean = false) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const compressed = await compressImage(base64);
      const newImage: TradeImage = { id: generateId(), url: compressed, type: 'base64' };

      const timeframeName = key;
      if (isEditing && editingTrade) {
        setEditingTrade(prev => {
          if (!prev) return prev;
          const timeframes = prev.timeframes.map(tf => {
            if (tf.name === timeframeName) return { ...tf, images: [...tf.images, newImage] };
            return tf;
          });
          return { ...prev, timeframes };
        });
      } else {
        setNewTrade(prev => {
          const timeframes = (prev.timeframes || initializeEmptyTimeframes()).map(tf => {
            if (tf.name === timeframeName) return { ...tf, images: [...tf.images, newImage] };
            return tf;
          });
          return { ...prev, timeframes };
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddImageUrl = (url: string, key: string, isEditing: boolean = false) => {
    if (!url.trim()) return;
    const newImage: TradeImage = { id: generateId(), url: url.trim(), type: 'url' };

    const timeframeName = key;
    if (isEditing && editingTrade) {
      setEditingTrade(prev => {
        if (!prev) return prev;
        const timeframes = prev.timeframes.map(tf => {
          if (tf.name === timeframeName) return { ...tf, images: [...tf.images, newImage] };
          return tf;
        });
        return { ...prev, timeframes };
      });
    } else {
      setNewTrade(prev => {
        const timeframes = (prev.timeframes || initializeEmptyTimeframes()).map(tf => {
          if (tf.name === timeframeName) return { ...tf, images: [...tf.images, newImage] };
          return tf;
        });
        return { ...prev, timeframes };
      });
    }
  };

  const handleRemoveImage = (key: string, imageId: string, isEditing: boolean = false) => {
    const timeframeName = key;
    if (isEditing && editingTrade) {
      setEditingTrade(prev => {
        if (!prev) return prev;
        const timeframes = prev.timeframes.map(tf => {
          if (tf.name === timeframeName) return { ...tf, images: tf.images.filter(img => img.id !== imageId) };
          return tf;
        });
        return { ...prev, timeframes };
      });
    } else {
      setNewTrade(prev => {
        const timeframes = (prev.timeframes || []).map(tf => {
          if (tf.name === timeframeName) return { ...tf, images: tf.images.filter(img => img.id !== imageId) };
          return tf;
        });
        return { ...prev, timeframes };
      });
    }
  };

  // Reorders the images array for a single timeframe category (e.g. moving a
  // later screenshot to index 0 so it becomes the new cover image). Mirrors
  // the same isEditing branch pattern as handleRemoveImage/handleAddImageUrl
  // above — only the `images` array for the matching timeframe is replaced,
  // nothing else about the trade is touched.
  const handleReorderImages = (key: string, fromIndex: number, toIndex: number, isEditing: boolean = false) => {
    if (fromIndex === toIndex || Number.isNaN(fromIndex) || Number.isNaN(toIndex)) return;
    const reorder = (images: TradeImage[]): TradeImage[] => {
      if (fromIndex < 0 || fromIndex >= images.length) return images;
      const updatedImages = [...images];
      const [removed] = updatedImages.splice(fromIndex, 1);
      const clampedTarget = Math.max(0, Math.min(toIndex, updatedImages.length));
      updatedImages.splice(clampedTarget, 0, removed);
      return updatedImages;
    };

    const timeframeName = key;
    if (isEditing && editingTrade) {
      setEditingTrade(prev => {
        if (!prev) return prev;
        const timeframes = prev.timeframes.map(tf => {
          if (tf.name === timeframeName) return { ...tf, images: reorder(tf.images) };
          return tf;
        });
        return { ...prev, timeframes };
      });
    } else {
      setNewTrade(prev => {
        const timeframes = (prev.timeframes || []).map(tf => {
          if (tf.name === timeframeName) return { ...tf, images: reorder(tf.images) };
          return tf;
        });
        return { ...prev, timeframes };
      });
    }
  };

  const updateTimeframeNotes = (timeframeName: string, notes: string, isEditing: boolean = false) => {
    if (isEditing && editingTrade) {
      setEditingTrade(prev => {
        if (!prev) return prev;
        const timeframes = prev.timeframes.map(tf => {
          if (tf.name === timeframeName) return { ...tf, notes };
          return tf;
        });
        return { ...prev, timeframes };
      });
    } else {
      setNewTrade(prev => {
        const timeframes = (prev.timeframes || initializeEmptyTimeframes()).map(tf => {
          if (tf.name === timeframeName) return { ...tf, notes };
          return tf;
        });
        return { ...prev, timeframes };
      });
    }
  };

  // Backup & Restore
  // Both directions go through the same DATA_SCHEMA_VERSION / migrateStoredData
  // machinery as the localStorage load effect above, so a backup exported by
  // an older (or newer) version of the app always imports cleanly.
  const exportBackup = async () => {
    const backupData: StoredData & { exportedAt: string } = {
      version: DATA_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      accounts,
      trades,
      rules,
      notices,
      noticeScenarios,
      wikiEntries,
      setupTypes,
      confluences,
      mistakesList,
      customSymbols,
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const defaultFileName = `vsx_backup_${new Date().toISOString().split('T')[0]}.json`;

    // Prefer the browser's native "Save As" dialog (File System Access API)
    // so YOU pick the filename and folder, instead of it silently landing
    // in Downloads. Supported in Chrome, Edge, and other Chromium browsers.
    const showSaveFilePicker = (window as any).showSaveFilePicker;
    if (typeof showSaveFilePicker === 'function') {
      try {
        const handle = await showSaveFilePicker({
          suggestedName: defaultFileName,
          types: [{ description: 'VSX Backup', accept: { 'application/json': ['.json'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(jsonString);
        await writable.close();
        return;
      } catch (err: any) {
        // User closed/cancelled the Save As dialog — treat as "changed
        // their mind", not an error. Don't fall back to auto-download.
        if (err?.name === 'AbortError') return;
        // Any other failure (e.g. permission issue): fall through to the
        // classic download below rather than losing the export entirely.
      }
    }

    // Fallback for browsers without Save-As support (Firefox, Safari, etc.)
    // — this downloads straight to the default Downloads folder.
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = defaultFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = JSON.parse(event.target?.result as string);
        if (!raw || typeof raw !== 'object' || (!Array.isArray(raw.accounts) && !Array.isArray(raw.trades))) {
          alert('Invalid backup file: this does not look like a trading journal backup.');
          return;
        }
        const migrated = migrateStoredData(raw);
        setAccounts(migrated.accounts);
        setTrades(migrated.trades);
        setRules(migrated.rules);
        setNotices(migrated.notices);
        setNoticeScenarios(migrated.noticeScenarios);
        setWikiEntries(migrated.wikiEntries);
        setSetupTypes(migrated.setupTypes);
        setConfluences(migrated.confluences);
        setMistakesList(migrated.mistakesList);
        setCustomSymbols(migrated.customSymbols);
        localStorage.setItem('tradingJournal', JSON.stringify(migrated));
        alert('Backup restored successfully!');
      } catch {
        alert('Failed to parse backup file. Please ensure it is a valid JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Render helpers
  const renderStatCard = (title: string, value: string | number, icon: React.ReactNode, color: string = 'text-zinc-400') => (
    <div className={cn(
      "group rounded-2xl p-4 flex items-center gap-3 min-w-0 transition-all duration-200",
      theme === 'dark'
        ? 'bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/70'
        : 'bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
    )}>
      <div className={cn('p-2.5 rounded-xl flex-shrink-0', theme === 'dark' ? 'bg-zinc-800/60' : 'bg-zinc-100', color)}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className={cn("text-[11px] uppercase tracking-wider truncate font-medium", tc.textMuted)}>{title}</p>
        <p className={cn('text-lg font-semibold truncate tabular-nums',
          typeof value === 'string' && value.includes('+') ? 'text-emerald-500' :
          typeof value === 'string' && value.includes('-') ? 'text-red-500' :
          tc.text
        )}>
          {value}
        </p>
      </div>
    </div>
  );

  const renderEquityChart = () => {
    if (equityData.length === 0) {
      return <div className={cn("h-48 flex items-center justify-center text-sm", tc.textMuted)}>No trade data to display yet</div>;
    }

    const min = Math.min(...equityData);
    const max = Math.max(...equityData);
    const range = max - min || 1;
    const height = 180;
    const width = equityData.length * 8;
    const chartWidth = Math.max(width, 400);
    const isPositive = stats.totalPnL >= 0;
    const strokeColor = isPositive ? '#10b981' : '#ef4444';
    const gradientId = `equityFill-${isPositive ? 'up' : 'down'}`;

    const coords = equityData.map((val, i) => {
      const x = i * 8 + 4;
      const y = height - ((val - min) / range) * (height - 40) - 20;
      return [x, y] as const;
    });

    const linePath = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
    const areaPath = `${linePath} L ${coords[coords.length - 1][0]} ${height} L ${coords[0][0]} ${height} Z`;

    const midpoint = min + range / 2;
    const midY = height - ((midpoint - min) / range) * (height - 40) - 20;

    return (
      <div className="overflow-x-auto">
        <svg width={chartWidth} height={height} className="w-full">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.28" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1="0" y1={midY} x2={chartWidth} y2={midY} stroke="#3f3f46" strokeWidth="1" strokeDasharray="4" />
          <path d={areaPath} fill={`url(#${gradientId})`} />
          <path d={linePath} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {coords.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2.5" fill={strokeColor} opacity="0.85" />
          ))}
        </svg>
      </div>
    );
  };

  const renderAccountTypeBadge = (account: Account) => {
    const displayName = account.type === 'Custom Challenge' ? (account.customTypeName || 'Custom') : account.type;
    const colors: Record<string, string> = {
      'Eval': 'bg-amber-500/20 text-amber-400',
      'Phase 1': 'bg-purple-500/20 text-purple-400',
      'Phase 2': 'bg-blue-500/20 text-blue-400',
      'Funded': 'bg-emerald-500/20 text-emerald-400',
      'Custom Challenge': 'bg-zinc-500/20 text-zinc-400',
    };
    return (
      <span className={cn('text-xs px-2 py-0.5 rounded truncate max-w-[100px] inline-block', colors[account.type] || colors['Custom Challenge'])}>
        {displayName}
      </span>
    );
  };

  const renderTradingAccountTypeBadge = (account: Account) => {
    const type = account.tradingAccountType || 'LIVE';
    const colors: Record<string, string> = {
      'CFD': 'bg-orange-500/20 text-orange-400',
      'LIVE': 'bg-blue-500/20 text-blue-400',
      'FUTURES': 'bg-violet-500/20 text-violet-400',
    };
    const icons: Record<string, React.ReactNode> = {
      'CFD': <Wallet className="w-3 h-3" />,
      'LIVE': <LineChart className="w-3 h-3" />,
      'FUTURES': <TrendingUp className="w-3 h-3" />,
    };
    return (
      <span className={cn('text-xs px-2 py-0.5 rounded flex items-center gap-1', colors[type])}>
        {icons[type]}
        {type}
      </span>
    );
  };

  const renderProgressBar = (account: Account) => {
    const hasProfitTarget = account.hasProfitTarget && account.profitTarget && account.profitTarget > 0;
    const tradingType = account.tradingAccountType || 'LIVE';

    const hasDrawdown = tradingType === 'LIVE' ||
      (account.maxDrawdownAllowance && account.maxDrawdownAllowance > 0) ||
      (tradingType === 'CFD' && account.fixedMinBalance && account.fixedMinBalance > 0);

    if (!hasProfitTarget && !hasDrawdown) return null;

    const accountTrades = trades.filter(t => t.accountId === account.id);
    const metrics = calculateAccountMetrics(account, accountTrades);
    const netProfit = metrics.currentBalance - account.startingBalance;

    const showProfitBar = netProfit >= 0 && hasProfitTarget;
    const showDrawdownBar = netProfit < 0 && hasDrawdown;

    return (
      <div className="mt-3">
        {showProfitBar && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-zinc-500 flex items-center gap-1.5">
                <Target className="w-3 h-3 text-emerald-400" />
                Progress to Target
              </span>
              <span className={cn('text-xs font-medium', metrics.profitProgress >= 100 ? 'text-emerald-400' : metrics.profitProgress >= 50 ? 'text-zinc-400' : 'text-zinc-500')}>
                {privacyMode ? '****' : `${metrics.profitProgress.toFixed(1)}%`}
              </span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500', metrics.profitProgress >= 100 ? 'bg-emerald-500' : metrics.profitProgress >= 50 ? 'bg-blue-500' : 'bg-zinc-500')}
                style={{ width: `${Math.max(metrics.profitProgress, 0)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-zinc-600">Current: {privacyMode ? '****' : formatCurrencyAbsolute(metrics.currentBalance)}</span>
              <span className="text-[10px] text-zinc-600">Target: {privacyMode ? '****' : formatCurrencyAbsolute(account.profitTarget!)}</span>
            </div>
          </div>
        )}

        {showDrawdownBar && (
          <div>
            <div className="flex items-center justify-between mb-2">
              {renderTradingAccountTypeBadge(account)}
              {metrics.isLocked && (
                <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded">Locked</span>
              )}
              {metrics.isBreached && (
                <span className="text-[10px] px-2 py-0.5 bg-red-500/20 text-red-400 rounded flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Breached
                </span>
              )}
            </div>

            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-zinc-500 flex items-center gap-1.5">
                <TrendingDown className="w-3 h-3 text-red-400" />
                {tradingType === 'FUTURES' ? 'Trailing Drawdown' :
                 tradingType === 'LIVE' ? 'Drawdown from Capital' : 'Drawdown Usage'}
              </span>
              <span className={cn('text-xs font-medium', metrics.isBreached ? 'text-red-400' : metrics.drawdownProgress > 70 ? 'text-amber-400' : 'text-zinc-400')}>
                {privacyMode ? '****' : `${metrics.drawdownProgress.toFixed(1)}%`}
              </span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden relative">
              <div className="absolute right-[30%] top-0 bottom-0 w-px bg-amber-500/30" />
              <div
                className={cn('h-full rounded-full transition-all duration-500',
                  metrics.isBreached ? 'bg-red-500' :
                  metrics.drawdownProgress > 70 ? 'bg-amber-500' : 'bg-red-400'
                )}
                style={{ width: `${metrics.drawdownProgress}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-zinc-600">
                Current: {privacyMode ? '****' : formatCurrencyAbsolute(metrics.currentBalance)}
              </span>
              <span className="text-[10px] text-zinc-600">
                {tradingType === 'LIVE' ? 'Floor: $0.00' : `Liquidation Level: ${privacyMode ? '****' : formatCurrencyAbsolute(metrics.threshold)}`}
              </span>
            </div>
          </div>
        )}

        {!showProfitBar && !showDrawdownBar && hasProfitTarget && hasDrawdown && (
          <div className="text-xs text-zinc-500 italic">
            Add trades to see progress
          </div>
        )}
      </div>
    );
  };

  // Shared sidebar content, rendered into two completely separate DOM trees
  // (mobile drawer vs. desktop permanent sidebar) so there is no longer any
  // single set of classes where mobile and desktop states can collide.
  // `isMobile` forces the content into its always-expanded (label-visible)
  // mobile appearance and swaps in the X-close control; on desktop, layout
  // follows `sidebarCollapsed` exactly as before.
  const renderSidebarContent = (isMobile: boolean) => {
    const collapsed = !isMobile && sidebarCollapsed;
    return (
      <div className="flex flex-col h-full w-full justify-between p-4">
        {/* TOP GROUP: logo/header row + primary nav items, strictly stacked */}
        <div className="flex flex-col gap-1 w-full min-h-0">
          <div className={cn("pb-4 mb-2 border-b w-full", theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200')}>
            <div className={cn("flex items-center", collapsed ? "flex-col gap-2" : "justify-between")}>
              <div className={cn("flex items-center gap-3 min-w-0", collapsed && "justify-center")}>
                <div className={cn(
                  "relative w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  theme === 'dark' ? 'bg-gradient-to-br from-zinc-800 to-zinc-900 border border-emerald-500/20' : 'bg-gradient-to-br from-zinc-100 to-zinc-200'
                )}>
                  <Activity className={cn(
                    "w-[18px] h-[18px]",
                    theme === 'dark' ? 'text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.55)]' : 'text-emerald-600'
                  )} />
                </div>
                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <h1 className={cn("font-bold text-lg uppercase tracking-wider leading-none truncate", theme === 'dark' ? 'text-white' : 'text-zinc-900')}>
                      VSX
                    </h1>
                    <p className={cn("text-[10px] font-medium uppercase tracking-widest truncate mt-0.5", theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500')}>
                      Trading Journal
                    </p>
                  </div>
                )}
              </div>
              {isMobile ? (
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  aria-label="Close menu"
                  className={cn(
                    "p-1.5 rounded-lg transition-colors flex-shrink-0",
                    theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                  )}
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(prev => !prev)}
                  title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors flex-shrink-0",
                    theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                  )}
                >
                  {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          <nav className="flex flex-col gap-1 w-full overflow-y-auto overflow-x-hidden min-h-0">
            {[
              { id: 'dashboard' as ViewType, icon: LayoutDashboard, label: 'Dashboard' },
              { id: 'trades' as ViewType, icon: TrendingUp, label: 'Trade History' },
              { id: 'discipline' as ViewType, icon: Shield, label: 'Discipline Tracker' },
              { id: 'playbook' as ViewType, icon: BookOpen, label: 'Rules Playbook' },
              { id: 'notices' as ViewType, icon: FileText, label: 'Market Notices' },
              { id: 'wiki' as ViewType, icon: Lightbulb, label: 'Knowledge Wiki' },
              { id: 'calendar' as ViewType, icon: Calendar, label: 'Performance Calendar' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id);
                  setIsMobileSidebarOpen(false);
                }}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm',
                  collapsed && 'justify-center px-0',
                  view === item.id
                    ? theme === 'dark' ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-900'
                    : theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-800/50' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            ))}
          </nav>
        </div>

        {/* BOTTOM GROUP: theme/privacy + data backup, pinned to the bottom, strictly stacked */}
        <div className="flex flex-col gap-4 mt-auto w-full">
          <div className={cn("flex flex-col gap-1 w-full pt-4 border-t", theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200')}>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={collapsed ? (theme === 'dark' ? 'Light Theme' : 'Dark Theme') : undefined}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm',
                collapsed && 'justify-center px-0',
                theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-800/50' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              )}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 flex-shrink-0" /> : <Moon className="w-4 h-4 flex-shrink-0" />}
              {!collapsed && <span className="truncate">{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>}
            </button>
            <button
              onClick={() => setPrivacyMode(!privacyMode)}
              title={collapsed ? (privacyMode ? 'Privacy Mode On' : 'Privacy Mode Off') : undefined}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm',
                collapsed && 'justify-center px-0',
                privacyMode
                  ? 'bg-amber-500/10 text-amber-500'
                  : theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-800/50' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              )}
            >
              {privacyMode ? <EyeOff className="w-4 h-4 flex-shrink-0" /> : <Eye className="w-4 h-4 flex-shrink-0" />}
              {!collapsed && <span className="truncate">{privacyMode ? 'Privacy Mode On' : 'Privacy Mode Off'}</span>}
            </button>
          </div>

          <div className={cn("flex flex-col gap-1.5 w-full pt-4 border-t", theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200')}>
            {!collapsed && (
              <div className="flex items-center gap-2 px-3 py-1.5 mb-1">
                <HardDrive className={cn("w-4 h-4 flex-shrink-0", theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400')} />
                <span className={cn("text-xs uppercase tracking-wider truncate", theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400')}>
                  Data Backup
                </span>
              </div>
            )}
            <button
              onClick={() => setIsExportConfirmOpen(true)}
              title={collapsed ? 'Export Journal Backup' : undefined}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm",
                collapsed && 'justify-center px-0',
                theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900'
              )}
            >
              <Download className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="truncate">Export Journal Backup</span>}
            </button>
            <label
              title={collapsed ? 'Import & Restore Backup' : undefined}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm cursor-pointer",
                collapsed && 'justify-center px-0',
                theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900'
              )}
            >
              <FolderSync className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="truncate">Import & Restore Backup</span>}
              <input type="file" accept=".json,application/json" className="hidden" onChange={importBackup} />
            </label>
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="space-y-6 min-w-0">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="min-w-0">
          <h2 className={cn("text-2xl font-bold truncate", tc.text)}>Dashboard</h2>
          <p className={cn("text-sm truncate", tc.textMuted)}>Account performance overview</p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="relative" ref={accountDropdownRef}>
            <button
              onClick={() => setShowAccountDropdown(!showAccountDropdown)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                theme === 'dark'
                  ? 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                  : 'bg-zinc-100 border border-zinc-200 text-zinc-700 hover:bg-zinc-200'
              )}
            >
              <Filter className="w-4 h-4 flex-shrink-0" />
              <span className="truncate max-w-[120px]">{selectedAccounts.includes('all') ? 'All Accounts' : `${selectedAccounts.length} Selected`}</span>
              <ChevronsUpDown className="w-4 h-4 flex-shrink-0" />
            </button>

            {showAccountDropdown && (
              <div className={cn(
                "absolute left-0 mt-2 min-w-[200px] w-64 rounded-lg shadow-xl z-50 p-2",
                theme === 'dark' ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-zinc-200'
              )}>
                <button
                  onClick={() => setSelectedAccounts(['all'])}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded text-sm truncate transition-colors',
                    selectedAccounts.includes('all')
                      ? theme === 'dark' ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-900'
                      : theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800' : 'text-zinc-600 hover:bg-zinc-100'
                  )}
                >
                  All Accounts
                </button>
                <div className={cn("my-2", theme === 'dark' ? 'border-t border-zinc-800' : 'border-t border-zinc-200')} />
                {accounts.map(acc => (
                  <button
                    key={acc.id}
                    onClick={() => {
                      if (selectedAccounts.includes('all')) {
                        setSelectedAccounts([acc.id]);
                      } else if (selectedAccounts.includes(acc.id)) {
                        const newSelection = selectedAccounts.filter(a => a !== acc.id);
                        setSelectedAccounts(newSelection.length === 0 ? ['all'] : newSelection);
                      } else {
                        setSelectedAccounts([...selectedAccounts, acc.id]);
                      }
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded text-sm flex items-center justify-between transition-colors',
                      selectedAccounts.includes(acc.id)
                        ? theme === 'dark' ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-900'
                        : theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800' : 'text-zinc-600 hover:bg-zinc-100'
                    )}
                  >
                    <span className="truncate flex-1 mr-2">{acc.name}</span>
                    {renderAccountTypeBadge(acc)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => { resetCalculator(); setShowAddAccount(true); }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors flex-shrink-0",
              theme === 'dark'
                ? 'bg-zinc-800 hover:bg-zinc-700 text-white'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900'
            )}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Account</span>
          </button>
        </div>
      </div>

      {/* Hero overview: Total P&L, with the Discipline Tracker as a slim status banner beneath it */}
      <div className="flex flex-col gap-4">
        {/* Total P&L */}
        <div className={cn(
          "relative overflow-hidden border rounded-2xl p-6 transition-colors duration-300 min-w-0",
          theme === 'dark'
            ? 'bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-900/60 border-zinc-800'
            : 'bg-gradient-to-br from-white via-zinc-50 to-zinc-100 border-zinc-200'
        )}>
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.06] via-transparent to-emerald-500/[0.05] pointer-events-none" />
          <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-6">
            <div className="min-w-0">
              <p className={cn("text-xs uppercase tracking-wider font-medium mb-2", tc.textMuted)}>Total Profit &amp; Loss</p>
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className={cn('text-4xl font-bold tracking-tight tabular-nums', stats.totalPnL >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                  {formatCurrency(stats.totalPnL, privacyMode)}
                </span>
                <span className={cn('flex items-center gap-1 text-sm font-medium px-2.5 py-1 rounded-lg flex-shrink-0', stats.growth >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500')}>
                  {stats.growth >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {stats.growth >= 0 ? '+' : ''}{stats.growth.toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 flex-shrink-0">
              <div className={cn("px-3 py-2 rounded-xl min-w-[84px]", theme === 'dark' ? 'bg-zinc-800/50' : 'bg-zinc-100')}>
                <p className={cn("text-[10px] uppercase tracking-wider", tc.textMuted)}>Trades</p>
                <p className={cn("text-sm font-semibold tabular-nums", tc.text)}>{stats.totalTrades}</p>
              </div>
              <div className={cn("px-3 py-2 rounded-xl min-w-[84px]", theme === 'dark' ? 'bg-zinc-800/50' : 'bg-zinc-100')}>
                <p className={cn("text-[10px] uppercase tracking-wider", tc.textMuted)}>Win Rate</p>
                <p className={cn("text-sm font-semibold tabular-nums", tc.text)}>{stats.winRate.toFixed(1)}%</p>
              </div>
              <div className={cn("px-3 py-2 rounded-xl min-w-[84px]", theme === 'dark' ? 'bg-zinc-800/50' : 'bg-zinc-100')}>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Profit Factor</p>
                <p className="text-sm font-semibold text-white tabular-nums">{isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) : 'N/A'}</p>
              </div>
            </div>
          </div>
          <div className="relative">
            {renderEquityChart()}
          </div>
        </div>

        {/* Discipline Tracker — slim, high-contrast status banner. Discipline is the most
            critical behavioral metric, so it gets a glowing accent treatment rather than
            competing for space as a tall card. */}
        {(() => {
          const followed = filteredTrades.filter(t => t.rulesFollowed === 'followed').length;
          const broken = filteredTrades.filter(t => t.rulesFollowed === 'broken').length;
          const totalRuled = followed + broken;
          const followRate = totalRuled > 0 ? (followed / totalRuled) * 100 : 0;
          const isHealthy = totalRuled > 0 && followRate >= 60;
          const isDanger = totalRuled > 0 && followRate < 60;
          return (
            <div
              className={cn(
                'relative flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-2xl border border-l-4 bg-zinc-900/40 border-zinc-800/80 px-5 py-3.5 min-w-0 transition-all duration-300',
                isHealthy && 'border-l-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.12)]',
                isDanger && 'border-l-amber-500 shadow-[0_0_18px_rgba(245,158,11,0.10)]'
              )}
            >
              {/* Left: label + headline follow rate */}
              <div className="flex items-center gap-5 min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Brain className="w-4 h-4 text-violet-400 flex-shrink-0" />
                  <h3 className="text-sm font-semibold text-white tracking-tight truncate">Discipline</h3>
                </div>

                <div className="flex items-baseline gap-1.5 flex-shrink-0">
                  <span className={cn('text-2xl font-bold tabular-nums leading-none', isHealthy ? 'text-emerald-400' : isDanger ? 'text-amber-400' : 'text-white')}>
                    {followRate.toFixed(0)}%
                  </span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider whitespace-nowrap">follow rate</span>
                </div>

                {/* Thin inline progress bar fills remaining space on wider screens */}
                <div className="hidden sm:block flex-1 max-w-[220px] h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', isHealthy ? 'bg-emerald-500' : isDanger ? 'bg-amber-500' : 'bg-zinc-600')}
                    style={{ width: `${followRate}%` }}
                  />
                </div>
              </div>

              {/* Right: minimal status pills + Full button */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-xs font-semibold tabular-nums">{followed}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400">
                  <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="text-xs font-semibold tabular-nums">{broken}</span>
                </div>
                <button
                  onClick={() => setView('discipline')}
                  className="group flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors flex-shrink-0 pl-2.5 pr-2 py-1 rounded-full ml-1"
                >
                  <span>Full</span>
                  <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {renderStatCard('Avg Win', formatCurrency(stats.avgWin, privacyMode), <TrendingUp className="w-4 h-4" />, 'text-emerald-400')}
        {renderStatCard('Avg Loss', formatCurrency(-stats.avgLoss, privacyMode), <TrendingDown className="w-4 h-4" />, 'text-red-400')}
        {renderStatCard('Total Trades', stats.totalTrades, <Activity className="w-4 h-4" />)}
        {renderStatCard('Win Rate', `${stats.winRate.toFixed(1)}%`, <Percent className="w-4 h-4" />)}
      </div>

      {/* Accounts */}
      <div>
        <h3 className={cn("text-xs font-semibold uppercase tracking-wider mb-3", tc.textMuted)}>Accounts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(account => {
            const accountTrades = trades.filter(t => t.accountId === account.id);
            const accountPnL = accountTrades.reduce((s, t) => s + t.profitLoss, 0);
            const isPositive = accountPnL >= 0;
            const metrics = calculateAccountMetrics(account, accountTrades);

            return (
              <div key={account.id} className={cn(
                'group relative rounded-2xl p-4 min-w-0 overflow-hidden transition-all duration-200',
                theme === 'dark'
                  ? 'bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/70'
                  : 'bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50',
                metrics.isBreached && 'border-red-500/30'
              )}>
                <div className={cn('absolute left-0 top-0 bottom-0 w-1', metrics.isBreached ? 'bg-red-500' : isPositive ? 'bg-emerald-500/60' : 'bg-red-500/60')} />
                <div className="pl-2">
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className={cn("font-semibold truncate mb-1", tc.text)}>{account.name}</h3>
                      <p className={cn("text-xs truncate", tc.textMuted)}>{account.propFirm || 'No prop firm'}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => {
                          setEditingAccount(account);
                          resetCalculator();
                          setShowEditAccount(account.id);
                        }}
                        className={cn("p-1 opacity-0 group-hover:opacity-100 transition-opacity", theme === 'dark' ? 'text-zinc-600 hover:text-white' : 'text-zinc-400 hover:text-zinc-900')}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(account.id)}
                        className="p-1 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {renderAccountTypeBadge(account)}
                    </div>
                  </div>

                  {renderProgressBar(account)}

                  <div className="mb-3 mt-3">
                    <div className="flex items-baseline justify-between mb-1.5">
                      <span className={cn("text-xs", tc.textMuted)}>P&amp;L</span>
                      <span className={cn('text-sm font-semibold tabular-nums', isPositive ? 'text-emerald-500' : 'text-red-500')}>
                        {formatCurrency(accountPnL, privacyMode)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider truncate">Starting</p>
                      <p className="text-xs text-zinc-300 truncate tabular-nums">{privacyMode ? '****' : `$${account.startingBalance.toLocaleString()}`}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider truncate">Current</p>
                      <p className="text-xs text-zinc-300 truncate tabular-nums">{privacyMode ? '****' : `$${metrics.currentBalance.toLocaleString()}`}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider truncate">Trades</p>
                      <p className="text-xs text-zinc-300 truncate tabular-nums">{accountTrades.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {accounts.length === 0 && (
            <div className="col-span-full text-center text-zinc-600 py-8 border border-dashed border-zinc-800 rounded-2xl">
              No accounts yet. Add your first account to get started.
            </div>
          )}
        </div>
      </div>

      {/* Recent trades */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-lg font-semibold text-white tracking-tight">Recent Trades</h3>
          <button onClick={() => { resetTradeForm(); resetCalculator(); setShowAddTrade(true); }} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add Trade</span>
          </button>
        </div>
        <div className="space-y-2">
          {filteredTrades.slice(0, 5).map(trade => {
            const account = accounts.find(a => a.id === trade.accountId);
            const isWin = trade.profitLoss >= 0;
            return (
              <div key={trade.id} onClick={() => { setShowTradeDetail(trade.id); setShowExpandGallery(false); }} className="relative flex items-center justify-between p-3 pl-4 bg-zinc-800/30 rounded-xl hover:bg-zinc-800/60 cursor-pointer transition-colors min-w-0 overflow-hidden">
                <div className={cn('absolute left-0 top-0 bottom-0 w-0.5', isWin ? 'bg-emerald-500/60' : 'bg-red-500/60')} />
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', isWin ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400')}>
                    {isWin ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white truncate">{trade.symbol}</p>
                    <p className="text-xs text-zinc-500 truncate">{account?.name} | {trade.setupTypes.join(', ') || 'No setup'}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className={cn('font-mono font-medium tabular-nums', isWin ? 'text-emerald-400' : 'text-red-400')}>
                    {formatCurrency(trade.profitLoss, privacyMode)}
                  </p>
                  <p className="text-xs text-zinc-500">{formatDate(trade.date)}</p>
                </div>
              </div>
            );
          })}
          {filteredTrades.length === 0 && (
            <p className="text-center text-zinc-600 py-8">No trades yet. Add your first trade to get started.</p>
          )}
        </div>
        {filteredTrades.length > 5 && (
          <button onClick={() => setView('trades')} className="w-full flex items-center justify-center gap-2 py-2.5 mt-4 text-sm text-zinc-400 hover:text-white bg-zinc-800/40 hover:bg-zinc-800 rounded-xl transition-colors">
            <span>View All Trades ({filteredTrades.length})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  const SORT_FIELD_LABELS = { date: 'Date', pnl: 'P&L', rr: 'R:R' } as const;
  type GallerySize = 'small' | 'medium' | 'large';
  const GALLERY_SIZE_LABELS: Record<GallerySize, string> = { small: 'Small', medium: 'Medium', large: 'Large' };
  const GALLERY_SIZE_COLUMNS: Record<GallerySize, { base: number; sm: number; md: number; lg: number; xl: number }> = {
    small: { base: 2, sm: 3, md: 4, lg: 4, xl: 6 },
    medium: { base: 1, sm: 1, md: 2, lg: 3, xl: 4 },
    large: { base: 1, sm: 1, md: 2, lg: 3, xl: 3 },
  };
  const [gallerySize, setGallerySize] = useState<GallerySize>('small');
  const galleryColumnCount = (() => {
    const cols = GALLERY_SIZE_COLUMNS[gallerySize];
    if (viewportWidth >= 1280) return cols.xl;
    if (viewportWidth >= 1024) return cols.lg;
    if (viewportWidth >= 768) return cols.md;
    if (viewportWidth >= 640) return cols.sm;
    return cols.base;
  })();
  const activeTradeFilterCount = (selectedAccounts.includes('all') ? 0 : 1) + (tradeFilter !== 'all' ? 1 : 0);
  const resetTradeControls = () => {
    setSelectedAccounts(['all']);
    setTradeFilter('all');
    setTradeSortField('date');
    setTradeSortOrder('desc');
  };

  const renderTradeHistory = () => (
    <div className="relative space-y-6 min-w-0">
      <div className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden", theme === 'light' && 'opacity-30')}>
        <div className="absolute -top-24 -left-32 w-[32rem] h-[32rem] rounded-full bg-emerald-500/[0.07] blur-[110px]" />
        <div className="absolute top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full bg-red-500/[0.06] blur-[110px]" />
        <div className="absolute bottom-0 left-1/4 w-[24rem] h-[24rem] rounded-full bg-violet-500/[0.05] blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(16,185,129,0.08),transparent_38%),radial-gradient(circle_at_85%_10%,rgba(239,68,68,0.06),transparent_35%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_90%_80%_at_50%_0%,black_50%,transparent_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:3px_3px] opacity-40" />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="min-w-0">
          <h2 className={cn("text-2xl font-bold truncate", tc.text)}>Trade History</h2>
          <p className={cn("text-sm truncate", tc.textMuted)}>{filteredTrades.length} trades</p>
        </div>
        <div className="flex items-center flex-wrap gap-2 flex-shrink-0">
          <div className="relative" ref={tradeControlsPanelRef}>
            <button
              type="button"
              onClick={() => setShowTradeControlsPanel(!showTradeControlsPanel)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-300 hover:bg-zinc-700 transition-colors',
                showTradeControlsPanel && 'bg-zinc-700 border-zinc-600 text-white'
              )}
            >
              <SlidersHorizontal className="w-4 h-4 flex-shrink-0" />
              <span>Filters & View</span>
              {activeTradeFilterCount > 0 && (
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-[10px] font-bold flex-shrink-0">
                  {activeTradeFilterCount}
                </span>
              )}
              <ChevronDown className={cn('w-4 h-4 flex-shrink-0 transition-transform', showTradeControlsPanel && 'rotate-180')} />
            </button>

            {showTradeControlsPanel && (
              <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 p-4 space-y-4 max-h-[80vh] overflow-y-auto">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Result</p>
                  <div className="flex items-center bg-zinc-800 rounded-lg p-1">
                    {[
                      { id: 'all' as TradeFilter, label: 'All' },
                      { id: 'profit' as TradeFilter, label: 'Profit' },
                      { id: 'loss' as TradeFilter, label: 'Loss' },
                      { id: 'breakeven' as TradeFilter, label: 'B/E' },
                    ].map(item => (
                      <button key={item.id} onClick={() => setTradeFilter(item.id)} className={cn('flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors', tradeFilter === item.id ? 'bg-white text-black' : 'text-zinc-400 hover:text-white')}>
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-zinc-800" />

                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Sort By</p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-zinc-800 rounded-lg p-1 flex-1">
                      {(Object.keys(SORT_FIELD_LABELS) as TradeSortField[]).map(field => (
                        <button key={field} onClick={() => setTradeSortField(field)} className={cn('flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors', tradeSortField === field ? 'bg-white text-black' : 'text-zinc-400 hover:text-white')}>
                          {SORT_FIELD_LABELS[field]}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setTradeSortOrder(tradeSortOrder === 'asc' ? 'desc' : 'asc')}
                      title={tradeSortOrder === 'asc' ? 'Ascending' : 'Descending'}
                      className="flex items-center justify-center p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 hover:text-white transition-colors flex-shrink-0"
                    >
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1.5">
                    {SORT_FIELD_LABELS[tradeSortField as keyof typeof SORT_FIELD_LABELS] ?? 'Date'} &middot; {tradeSortOrder === 'asc' ? 'Ascending' : 'Descending'}
                  </p>
                </div>

                <div className="border-t border-zinc-800" />

                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">View</p>
                  <div className="flex items-center bg-zinc-800 rounded-lg p-1">
                    {[
                      { id: 'list' as GalleryView, icon: List, label: 'List' },
                      { id: 'preview' as GalleryView, icon: LayoutGrid, label: 'Preview' },
                      { id: 'gallery' as GalleryView, icon: Grid, label: 'Gallery' },
                    ].map(item => (
                      <button key={item.id} onClick={() => setGalleryView(item.id)} className={cn('flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-medium transition-colors', galleryView === item.id ? 'bg-white text-black' : 'text-zinc-400 hover:text-white')}>
                        <item.icon className="w-3.5 h-3.5" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {galleryView === 'gallery' && (
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Card Size</p>
                    <div className="flex items-center bg-zinc-800 rounded-lg p-1">
                      {(Object.keys(GALLERY_SIZE_LABELS) as GallerySize[]).map(size => (
                        <button type="button" key={size} onClick={() => setGallerySize(size)} className={cn('flex-1 py-1.5 rounded text-xs font-medium transition-colors', gallerySize === size ? 'bg-white text-black' : 'text-zinc-400 hover:text-white')}>
                          {GALLERY_SIZE_LABELS[size]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-zinc-800" />

                <button onClick={resetTradeControls} className="w-full py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                  Reset filters & sorting
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={toggleTradeSelectMode}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors border',
              tradeSelectMode
                ? 'bg-white text-black border-white hover:bg-zinc-200'
                : theme === 'dark'
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                  : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200'
            )}
          >
            <Check className="w-4 h-4" />
            <span>{tradeSelectMode ? 'Cancel' : 'Select'}</span>
          </button>

          <button onClick={() => { resetTradeForm(); resetCalculator(); setShowAddTrade(true); }} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add Trade</span>
          </button>
        </div>
      </div>

      {tradeSelectMode && (
        <div className={cn(
          'flex items-center justify-between flex-wrap gap-3 px-4 py-3 rounded-xl border sticky top-0 z-20',
          theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        )}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSelectAllTrades}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200'
              )}
            >
              {selectedTradeIds.length === filteredTrades.length && filteredTrades.length > 0 ? 'Deselect All' : 'Select All'}
            </button>
            <span className={cn('text-sm', tc.textMuted)}>{selectedTradeIds.length} selected</span>
          </div>
          <button
            type="button"
            onClick={handleDeleteSelectedTrades}
            disabled={selectedTradeIds.length === 0}
            className="flex items-center gap-2 px-4 py-1.5 bg-red-500/90 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Selected
          </button>
        </div>
      )}

      {galleryView === 'list' && (
        <div className="relative bg-gradient-to-b from-zinc-900/70 to-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/0 via-zinc-500/60 to-red-500/0" />
          <div className="trade-table-scroll w-full overflow-x-auto block clear-both">
            <table className="w-full min-w-[950px]" style={{ minWidth: '950px' }}>
              <thead>
                <tr className="border-b border-zinc-800 text-left bg-zinc-900/40">
                  {tradeSelectMode && <th className="px-4 py-3 w-10"></th>}
                  <th className="px-4 py-3 text-xs text-zinc-500 uppercase tracking-wider w-10">#</th>
                  <th className="px-4 py-3 text-xs text-zinc-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-xs text-zinc-500 uppercase tracking-wider">Symbol</th>
                  <th className="px-4 py-3 text-xs text-zinc-500 uppercase tracking-wider">Account</th>
                  <th className="px-4 py-3 text-xs text-zinc-500 uppercase tracking-wider">Setup</th>
                  <th className="px-4 py-3 text-xs text-zinc-500 uppercase tracking-wider">Session</th>
                  <th className="px-4 py-3 text-xs text-zinc-500 uppercase tracking-wider">Trade #</th>
                  <th className="px-4 py-3 text-xs text-zinc-500 uppercase tracking-wider">Rules</th>
                  <th className="px-4 py-3 text-xs text-zinc-500 uppercase tracking-wider text-right">R:R</th>
                  <th className="px-4 py-3 text-xs text-zinc-500 uppercase tracking-wider text-right">P&L</th>
                  <th className="px-4 py-3 text-xs text-zinc-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/70">
                {filteredTrades.map((trade) => {
                  const account = accounts.find(a => a.id === trade.accountId);
                  const isWin = trade.profitLoss >= 0;
                  const rowRR = trade.riskAmount > 0 ? trade.profitLoss / trade.riskAmount : null;
                  const isSelected = selectedTradeIds.includes(trade.id);
                  return (
                    <tr
                      key={trade.id}
                      className={cn(
                        'relative group cursor-pointer transition-colors',
                        isSelected ? 'bg-white/[0.06]' : (isWin ? 'hover:bg-emerald-500/[0.05]' : 'hover:bg-red-500/[0.05]')
                      )}
                      onClick={() => tradeSelectMode ? toggleTradeSelected(trade.id) : setShowTradeDetail(trade.id)}
                    >
                      {tradeSelectMode && (
                        <td className="px-4 py-3" onClick={(e) => { e.stopPropagation(); toggleTradeSelected(trade.id); }}>
                          <span className={cn(
                            'flex items-center justify-center w-5 h-5 rounded border transition-colors',
                            isSelected ? 'bg-white border-white text-black' : 'border-zinc-600 text-transparent hover:border-zinc-400'
                          )}>
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-3 relative">
                        <span className={cn('absolute left-0 top-0 bottom-0 w-[3px] opacity-0 group-hover:opacity-100 transition-opacity', isWin ? 'bg-emerald-400' : 'bg-red-400')} />
                        <span className="text-sm text-zinc-500 font-mono">{getDisplayTradeNumber(trade)}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-400 whitespace-nowrap">{formatDate(trade.date)}</td>
                      <td className="px-4 py-3 text-sm text-white font-semibold tracking-tight truncate max-w-[100px]">{trade.symbol}</td>
                      <td className="px-4 py-3 text-sm text-zinc-400 truncate max-w-[120px]">{account?.name}</td>
                      <td className="px-4 py-3 text-sm text-zinc-400 truncate max-w-[100px]">{trade.setupTypes.join(', ') || '-'}</td>
                      <td className="px-4 py-3 text-sm text-zinc-400">
                        {trade.session ? (SESSION_SHORT_LABEL[trade.session] || trade.session.toLowerCase()) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <TrackingBadge value={trade.trackingNumber} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs px-2 py-0.5 rounded flex items-center gap-1 w-fit', trade.rulesFollowed === 'followed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400')}>
                          {trade.rulesFollowed === 'followed' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          <span className="truncate">{trade.rulesFollowed}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-right whitespace-nowrap">
                        {rowRR !== null ? (
                          <span className={cn('px-1.5 py-0.5 rounded border', rowRR >= 1 ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : rowRR >= 0 ? 'text-zinc-300 border-zinc-700 bg-zinc-800/60' : 'text-red-400 border-red-500/30 bg-red-500/10')}>
                            {rowRR >= 1 ? '+' : ''}{rowRR.toFixed(2)}R
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-right font-bold whitespace-nowrap">
                        <span className={isWin ? 'text-emerald-400' : 'text-red-400'}>{formatCurrency(trade.profitLoss, privacyMode)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={(e) => { e.stopPropagation(); openEditTrade(trade); }} className="p-1 text-zinc-600 hover:text-white transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {galleryView === 'preview' && (
        <div className="trade-table-scroll overflow-x-auto w-full">
        <div className="space-y-2.5 min-w-[850px]">
          {filteredTrades.map((trade) => {
            const account = accounts.find(a => a.id === trade.accountId);
            const coverImage = trade.executionImages[0]?.url || trade.timeframes.flatMap(tf => tf.images)[0]?.url;
            const isWin = trade.profitLoss >= 0;
            const rowRR = trade.riskAmount > 0 ? trade.profitLoss / trade.riskAmount : null;
            const isSelected = selectedTradeIds.includes(trade.id);
            return (
              <div
                key={trade.id}
                onClick={() => tradeSelectMode ? toggleTradeSelected(trade.id) : setShowTradeDetail(trade.id)}
                className={cn(
                  'group relative flex gap-4 p-4 pl-5 bg-gradient-to-r from-zinc-900/70 to-zinc-900/30 border rounded-xl cursor-pointer transition-all duration-200 min-w-0 overflow-hidden hover:-translate-y-0.5',
                  isSelected ? 'border-white/60' : (isWin ? 'border-zinc-800 hover:border-emerald-500/40 hover:shadow-[0_8px_24px_-8px_rgba(16,185,129,0.25)]' : 'border-zinc-800 hover:border-red-500/40 hover:shadow-[0_8px_24px_-8px_rgba(239,68,68,0.25)]')
                )}
              >
                <div className={cn('absolute left-0 top-0 bottom-0 w-1', isWin ? 'bg-gradient-to-b from-emerald-500/70 to-emerald-500/20' : 'bg-gradient-to-b from-red-500/70 to-red-500/20')} />
                <div className={cn('absolute top-0 left-5 right-0 h-[2px]', isWin ? 'bg-gradient-to-r from-emerald-500/0 via-emerald-400/60 to-emerald-500/0' : 'bg-gradient-to-r from-red-500/0 via-red-400/60 to-red-500/0')} />

                {tradeSelectMode && (
                  <div
                    className="absolute top-3 right-3 z-10"
                    onClick={(e) => { e.stopPropagation(); toggleTradeSelected(trade.id); }}
                  >
                    <span className={cn(
                      'flex items-center justify-center w-6 h-6 rounded border transition-colors bg-zinc-950/80',
                      isSelected ? 'bg-white border-white text-black' : 'border-zinc-600 text-transparent hover:border-zinc-400'
                    )}>
                      <Check className="w-4 h-4" />
                    </span>
                  </div>
                )}

                <div className="w-24 h-16 bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden border border-zinc-800 relative">
                  <span className="absolute top-1 left-1 z-10 flex items-center justify-center w-4 h-4 rounded bg-black/70 backdrop-blur-sm text-[9px] font-mono text-zinc-300">
                    {getDisplayTradeNumber(trade)}
                  </span>
                  <span className={cn('absolute top-1 right-1 z-10 w-1.5 h-1.5 rounded-full', isWin ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.8)]')} />
                  {coverImage ? (
                    <img src={coverImage} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-zinc-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-1.5">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-white truncate tracking-tight">{trade.symbol}</h4>
                      <p className="text-xs text-zinc-500 truncate">{account?.name} · {formatDate(trade.date)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {rowRR !== null && (
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded border whitespace-nowrap', rowRR >= 1 ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : rowRR >= 0 ? 'text-zinc-300 border-zinc-700 bg-zinc-800/60' : 'text-red-400 border-red-500/30 bg-red-500/10')}>
                          {rowRR >= 1 ? '+' : ''}{rowRR.toFixed(2)}R
                        </span>
                      )}
                      <p className={cn('font-mono font-bold', isWin ? 'text-emerald-400' : 'text-red-400')}>
                        {formatCurrency(trade.profitLoss, privacyMode)}
                      </p>
                    </div>
                  </div>
                  <div className="h-px bg-zinc-800/70 mb-2" />
                  <div className="flex items-center gap-2 flex-wrap">
                    {trade.setupTypes.length > 0 ? trade.setupTypes.slice(0, 2).map(s => (
                      <span key={s} className="px-2 py-0.5 bg-zinc-800/80 border border-zinc-700/50 rounded text-xs text-zinc-300 truncate max-w-[80px]">{s}</span>
                    )) : (
                      <span className="text-xs text-zinc-600 italic">No setup tagged</span>
                    )}
                    <span className={cn('text-xs px-2 py-0.5 rounded flex items-center gap-1', trade.rulesFollowed === 'followed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400')}>
                      {trade.rulesFollowed === 'followed' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    </span>
                    {trade.session && <SessionBadge value={trade.session} size="sm" />}
                    {trade.trackingNumber && <TrackingBadge value={trade.trackingNumber} size="sm" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        </div>
      )}

      {galleryView === 'gallery' && (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${galleryColumnCount}, minmax(0, 1fr))` }}>
          {filteredTrades.map((trade) => {
            const account = accounts.find(a => a.id === trade.accountId);
            const coverImage = trade.executionImages[0]?.url || trade.timeframes.flatMap(tf => tf.images)[0]?.url;
            const cardRR = trade.riskAmount > 0 ? trade.profitLoss / trade.riskAmount : null;
            const isWin = trade.profitLoss >= 0;
            const isSelected = selectedTradeIds.includes(trade.id);
            return (
              <div
                key={trade.id}
                onClick={() => tradeSelectMode ? toggleTradeSelected(trade.id) : setShowTradeDetail(trade.id)}
                className={cn(
                  'group relative bg-gradient-to-b from-zinc-900/70 to-zinc-900/30 border rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-0.5 min-w-0',
                  isSelected ? 'border-white/60' : (isWin ? 'border-zinc-800 hover:border-emerald-500/40 hover:shadow-[0_8px_24px_-8px_rgba(16,185,129,0.25)]' : 'border-zinc-800 hover:border-red-500/40 hover:shadow-[0_8px_24px_-8px_rgba(239,68,68,0.25)]')
                )}
              >
                <div className={cn('absolute top-0 left-0 right-0 h-[2px] z-10', isWin ? 'bg-gradient-to-r from-emerald-500/0 via-emerald-400 to-emerald-500/0' : 'bg-gradient-to-r from-red-500/0 via-red-400 to-red-500/0')} />

                {tradeSelectMode && (
                  <div
                    className="absolute top-2 right-2 z-20"
                    onClick={(e) => { e.stopPropagation(); toggleTradeSelected(trade.id); }}
                  >
                    <span className={cn(
                      'flex items-center justify-center w-6 h-6 rounded border transition-colors bg-zinc-950/80',
                      isSelected ? 'bg-white border-white text-black' : 'border-zinc-600 text-transparent hover:border-zinc-400'
                    )}>
                      <Check className="w-4 h-4" />
                    </span>
                  </div>
                )}

                <div className="aspect-video bg-zinc-800 flex items-center justify-center relative overflow-hidden">
                  <span className="absolute top-2 left-2 z-10 flex items-center justify-center w-5 h-5 rounded bg-black/70 backdrop-blur-sm text-[10px] font-mono text-zinc-300">
                    {getDisplayTradeNumber(trade)}
                  </span>
                  <span className={cn('absolute top-2 right-2 z-10 w-2 h-2 rounded-full', isWin ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]')} />
                  {coverImage ? (
                    <img src={coverImage} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-zinc-600">
                      <ImageIcon className="w-8 h-8" />
                      <span className="text-xs">No image</span>
                    </div>
                  )}
                </div>

                <div className="p-3.5 min-w-0 overflow-hidden">
                  <div className="mb-1.5 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-white truncate tracking-tight">{trade.symbol}</h4>
                      <p className="text-xs text-zinc-500 truncate">{account?.name}</p>
                    </div>
                    {trade.trackingNumber && <TrackingBadge value={trade.trackingNumber} size="sm" />}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
                    {trade.session && <SessionBadge value={trade.session} size="sm" />}
                    <span className={cn('text-xs px-2 py-0.5 rounded flex items-center gap-1', trade.rulesFollowed === 'followed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400')}>
                      {trade.rulesFollowed === 'followed' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2.5">
                    <p className="text-[11px] text-zinc-500 whitespace-nowrap">{formatDate(trade.date)}</p>
                    <div className="flex-1 h-px bg-gradient-to-r from-zinc-800 to-transparent" />
                  </div>

                  <div className="flex items-center justify-between gap-1.5 mb-2.5 min-w-0 flex-wrap">
                    <span className={cn('text-sm sm:text-base font-mono font-bold tracking-tight truncate min-w-0', isWin ? 'text-emerald-400' : 'text-red-400')}>
                      {formatCurrency(trade.profitLoss, privacyMode)}
                    </span>
                    {cardRR !== null && (
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded border flex-shrink-0 whitespace-nowrap', cardRR >= 1 ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : cardRR >= 0 ? 'text-zinc-300 border-zinc-700 bg-zinc-800/60' : 'text-red-400 border-red-500/30 bg-red-500/10')}>
                        {cardRR >= 1 ? '+' : ''}{cardRR.toFixed(2)}R
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-wrap pt-2.5 border-t border-zinc-800/70">
                    {trade.setupTypes.length > 0 ? trade.setupTypes.slice(0, 2).map(s => (
                      <span key={s} className="px-2 py-0.5 bg-zinc-800/80 border border-zinc-700/50 rounded text-xs text-zinc-300 truncate max-w-[70px]">{s}</span>
                    )) : (
                      <span className="text-xs text-zinc-600 italic">No setup tagged</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredTrades.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto rounded-full bg-zinc-800 flex items-center justify-center mb-4">
            <TrendingUp className="w-8 h-8 text-zinc-600" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No trades found</h3>
          <p className="text-zinc-500 mb-4">Add your first trade or adjust your filters</p>
          <button onClick={() => { resetTradeForm(); setShowAddTrade(true); }} className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors">
            <Plus className="w-4 h-4" />
            Add Trade
          </button>
        </div>
      )}
    </div>
  );

  const renderDisciplineTracker = () => {
    const followedTrades = filteredTrades.filter(t => t.rulesFollowed === 'followed');
    const brokenTrades = filteredTrades.filter(t => t.rulesFollowed === 'broken');

    // Psychology analytics: for each Emotion tag logged in the last 7 days, tally
    // how often it shows up, the aggregate P&L tied to trades carrying that tag
    // (the "financial damage/gain" of that state of mind), and the win rate of
    // trades tagged with it. Mistakes get the same P&L-impact treatment across
    // all filtered trades (not time-boxed — a bad habit's cost matters however
    // long ago it started).
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeekTrades = filteredTrades.filter(t => new Date(t.date) >= weekAgo);

    const emotionStatsMap: Record<string, { count: number; pnl: number; wins: number }> = {};
    thisWeekTrades.forEach(t => (t.emotions || []).forEach(e => {
      if (!emotionStatsMap[e]) emotionStatsMap[e] = { count: 0, pnl: 0, wins: 0 };
      emotionStatsMap[e].count += 1;
      emotionStatsMap[e].pnl += t.profitLoss;
      if (t.profitLoss > 0) emotionStatsMap[e].wins += 1;
    }));
    const topEmotions = Object.entries(emotionStatsMap)
      .map(([emotion, s]) => ({ emotion, count: s.count, pnl: s.pnl, winRate: s.count > 0 ? (s.wins / s.count) * 100 : 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
    const maxEmotionCount = topEmotions[0]?.count || 1;

    const mistakeStatsMap: Record<string, { count: number; pnl: number }> = {};
    filteredTrades.forEach(t => (t.mistakes || []).forEach(m => {
      if (!mistakeStatsMap[m]) mistakeStatsMap[m] = { count: 0, pnl: 0 };
      mistakeStatsMap[m].count += 1;
      mistakeStatsMap[m].pnl += t.profitLoss;
    }));
    const topMistakes = Object.entries(mistakeStatsMap)
      .map(([mistake, s]) => ({ mistake, count: s.count, pnl: s.pnl }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
    const maxMistakeCount = topMistakes[0]?.count || 1;

    // Current Discipline Streak: consecutive "Rules Followed" trades counting
    // back from the most recently logged trade (by actual creation time, not
    // whatever the Trade History sort dropdown happens to be set to), stopping
    // the instant a "Rules Broken" trade is hit.
    const chronoTrades = [...filteredTrades].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    let disciplineStreak = 0;
    for (let i = chronoTrades.length - 1; i >= 0; i--) {
      if (chronoTrades[i].rulesFollowed === 'followed') disciplineStreak++;
      else break;
    }

    // Small pill row shown under a trade's P&L in the log: every logged emotion
    // (violet) then every mistake (red) — all of them, not just the first couple,
    // wrapping onto as many lines as needed since each trade row now has the
    // full row width to itself.
    const renderPsychBadges = (trade: Trade) => {
      const emotions = trade.emotions || [];
      const mistakes = trade.mistakes || [];
      if (emotions.length === 0 && mistakes.length === 0) return null;
      return (
        <div className="flex flex-wrap gap-1.5 justify-end">
          {emotions.map(e => (
            <span key={`e-${e}`} className="px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-300 text-xs font-medium leading-normal">
              {e}
            </span>
          ))}
          {mistakes.map(m => (
            <span key={`m-${m}`} className="px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/25 text-red-300 text-xs font-medium leading-normal">
              {m}
            </span>
          ))}
        </div>
      );
    };

    return (
      <div className="space-y-4 min-w-0">
        <div>
          <h2 className="text-2xl font-bold text-white truncate">Discipline Tracker</h2>
          <p className="text-zinc-500 text-sm truncate">Monitor your rule adherence</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {renderStatCard('Rules Followed', followedTrades.length, <CheckCircle2 className="w-4 h-4" />, 'text-emerald-400')}
          {renderStatCard('Rules Broken', brokenTrades.length, <XCircle className="w-4 h-4" />, 'text-red-400')}
          {renderStatCard('Follow Rate', `${((followedTrades.length / (followedTrades.length + brokenTrades.length)) * 100 || 0).toFixed(1)}%`, <Target className="w-4 h-4" />)}
          {renderStatCard('Avg Loss (Broken)', brokenTrades.length > 0 ? formatCurrency(brokenTrades.reduce((s, t) => s + t.profitLoss, 0) / brokenTrades.length, privacyMode) : '$0.00', <AlertCircle className="w-4 h-4" />, 'text-red-400')}
        </div>

        {/* Rule Adherence Log — full width so trades have room to show every emotion/mistake tag, not just the first couple */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 min-w-0">
          <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-zinc-400 flex-shrink-0" />
            <span className="truncate">Rule Adherence Log</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-zinc-800/70 flex-shrink-0">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400 truncate">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Followed
                </span>
                <span className="text-xs font-mono text-zinc-400 flex-shrink-0 px-2 py-0.5 rounded bg-zinc-800/60">{followedTrades.length}</span>
              </div>
              <div className="space-y-2 flex-1 overflow-y-auto max-h-[420px] pr-1">
                {followedTrades.map(trade => {
                  const account = accounts.find(a => a.id === trade.accountId);
                  return (
                    <div key={trade.id} onClick={() => setShowDisciplineReview(trade.id)} className="p-3 bg-zinc-800/30 rounded-lg hover:bg-zinc-800/50 cursor-pointer transition-colors min-w-0">
                      <div className="flex items-start justify-between gap-3 min-w-0">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <TrackingBadge value={trade.trackingNumber} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-white truncate">{trade.symbol}</p>
                            <p className="text-xs text-zinc-400 truncate">{account?.name} | {formatDate(trade.date)}</p>
                          </div>
                        </div>
                        <p className={cn('font-mono font-medium text-sm flex-shrink-0', trade.profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                          {formatCurrency(trade.profitLoss, privacyMode)}
                        </p>
                      </div>
                      {(trade.emotions?.length || trade.mistakes?.length) ? (
                        <div className="mt-2 pt-2 border-t border-zinc-800/60">
                          {renderPsychBadges(trade)}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
                {followedTrades.length === 0 && (
                  <div className="h-full min-h-[280px] flex flex-col items-center justify-center gap-2 text-center">
                    <CheckCircle2 className="w-7 h-7 text-zinc-700" />
                    <p className="text-sm text-zinc-600">No trades with rules followed</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col min-w-0 md:pl-6 md:border-l md:border-zinc-800/70">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-zinc-800/70 flex-shrink-0">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-red-400 truncate">
                  <XCircle className="w-4 h-4 flex-shrink-0" /> Broken
                </span>
                <span className="text-xs font-mono text-zinc-400 flex-shrink-0 px-2 py-0.5 rounded bg-zinc-800/60">{brokenTrades.length}</span>
              </div>
              <div className="space-y-2 flex-1 overflow-y-auto max-h-[420px] pr-1">
                {brokenTrades.map(trade => {
                  const account = accounts.find(a => a.id === trade.accountId);
                  return (
                    <div key={trade.id} onClick={() => setShowDisciplineReview(trade.id)} className="p-3 bg-zinc-800/30 rounded-lg hover:bg-zinc-800/50 cursor-pointer transition-colors min-w-0">
                      <div className="flex items-start justify-between gap-3 min-w-0">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <TrackingBadge value={trade.trackingNumber} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-white truncate">{trade.symbol}</p>
                            <p className="text-xs text-zinc-400 truncate">{account?.name} | {formatDate(trade.date)}</p>
                          </div>
                        </div>
                        <p className={cn('font-mono font-medium text-sm flex-shrink-0', trade.profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                          {formatCurrency(trade.profitLoss, privacyMode)}
                        </p>
                      </div>
                      {(trade.emotions?.length || trade.mistakes?.length) ? (
                        <div className="mt-2 pt-2 border-t border-zinc-800/60">
                          {renderPsychBadges(trade)}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
                {brokenTrades.length === 0 && (
                  <div className="h-full min-h-[280px] flex flex-col items-center justify-center gap-2 text-center">
                    <XCircle className="w-7 h-7 text-zinc-700" />
                    <p className="text-sm text-zinc-600">No trades with rules broken</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Psychology & Behavioral Analytics — moved below the log, full width, two columns */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 min-w-0">
          <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4 text-violet-400 flex-shrink-0" />
            <span className="truncate">Psychology & Behavioral Analytics</span>
          </h3>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 mb-5">
            <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center flex-shrink-0">
              <Flame className="w-5 h-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-zinc-400 uppercase tracking-wider truncate">Current Discipline Streak</p>
              <p className="text-lg font-bold text-white truncate">{disciplineStreak} trade{disciplineStreak !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-violet-400 mb-3 flex items-center gap-1.5">
                <Brain className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Top Emotions This Week</span>
              </h4>
              {topEmotions.length === 0 ? (
                <p className="text-sm text-zinc-500 py-1">No emotions logged this week</p>
              ) : (
                <div className="space-y-3">
                  {topEmotions.map(({ emotion, count, pnl, winRate }) => {
                    const isProfit = pnl >= 0;
                    return (
                      <div key={emotion} className="min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-sm text-zinc-300 truncate">{emotion}</span>
                          <span className={cn('text-sm font-mono font-medium flex-shrink-0', isProfit ? 'text-emerald-400' : 'text-red-400')}>
                            {formatCurrency(pnl, privacyMode)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full', isProfit ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : 'bg-gradient-to-r from-red-600 to-orange-400')}
                              style={{ width: `${(count / maxEmotionCount) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-zinc-500 font-mono flex-shrink-0">{winRate.toFixed(0)}% WR</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="md:pl-6 md:border-l md:border-zinc-800/70">
              <h4 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Top Mistakes Committed</span>
              </h4>
              {topMistakes.length === 0 ? (
                <p className="text-sm text-zinc-500 py-1">No mistakes logged yet</p>
              ) : (
                <div className="space-y-3">
                  {topMistakes.map(({ mistake, count, pnl }) => (
                    <div key={mistake} className="min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-sm text-zinc-300 truncate">{mistake}</span>
                        <span className="text-sm font-mono font-medium text-red-400 flex-shrink-0">
                          {formatCurrency(pnl, privacyMode)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-red-600 to-orange-400"
                            style={{ width: `${(count / maxMistakeCount) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-zinc-500 font-mono flex-shrink-0">{count}x</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPlaybook = () => (
    <div className="space-y-4 min-w-0">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="min-w-0">
          <h2 className={cn("text-2xl font-bold truncate", theme === 'dark' ? 'text-white' : 'text-zinc-900')}>Rules Playbook</h2>
          <p className="text-zinc-500 text-sm truncate">Your command center — logged trades passively track violations, no checklists required</p>
        </div>
        <button onClick={() => openAddRuleModal('risk')} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors flex-shrink-0">
          <Plus className="w-4 h-4" />
          <span>Add Rule</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
        {RULE_PILLARS.map(pillar => {
          const meta = RULE_PILLAR_META[pillar];
          const pillarRules = rules.filter(r => r.pillar === pillar);
          return (
            <div
              key={pillar}
              className={cn(
                "rounded-xl border-t-4 flex flex-col min-w-0",
                meta.accent,
                theme === 'dark' ? 'bg-zinc-900/40 border-x border-b border-zinc-800' : 'bg-white border-x border-b border-zinc-200'
              )}
            >
              <div className={cn("flex items-center justify-between gap-2 px-3 py-2.5 border-b", theme === 'dark' ? 'border-zinc-800/60' : 'border-zinc-200')}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn("w-6 h-6 rounded-md flex items-center justify-center text-sm flex-shrink-0", meta.iconBg)}>{meta.icon}</span>
                  <h3 className={cn("text-sm font-bold truncate", theme === 'dark' ? 'text-white' : 'text-zinc-900')}>{meta.label}</h3>
                  <span className="text-[10px] text-zinc-500 flex-shrink-0">{pillarRules.length}</span>
                </div>
                <button
                  onClick={() => openAddRuleModal(pillar)}
                  title={`Add ${meta.label}`}
                  className={cn("p-1 rounded transition-colors flex-shrink-0", theme === 'dark' ? 'text-zinc-500 hover:text-white hover:bg-zinc-800' : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100')}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3 space-y-2 flex-1">
                {pillarRules.length === 0 ? (
                  <button
                    onClick={() => openAddRuleModal(pillar)}
                    className={cn(
                      "w-full text-center py-6 px-2 text-xs rounded-lg border border-dashed transition-colors",
                      theme === 'dark' ? 'text-zinc-600 hover:text-zinc-400 border-zinc-800 hover:border-zinc-700' : 'text-zinc-400 hover:text-zinc-600 border-zinc-300 hover:border-zinc-400'
                    )}
                  >
                    + Add your first rule
                  </button>
                ) : pillarRules.map(rule => {
                  const violations = ruleViolationCounts[rule.id] || 0;
                  const severityMeta = RULE_SEVERITY_META[rule.severity];
                  return (
                    <div
                      key={rule.id}
                      className={cn(
                        "group relative rounded-lg p-2.5 border transition-colors",
                        theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700' : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="min-w-0 flex-1 flex items-center gap-1.5">
                          <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", severityMeta.dot)} title={severityMeta.label} />
                          <h4 className={cn("text-sm font-semibold truncate", theme === 'dark' ? 'text-white' : 'text-zinc-900')}>{rule.title}</h4>
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditRuleModal(rule)} className={cn("p-1 rounded", theme === 'dark' ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-zinc-900')}>
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteRule(rule.id)} className="p-1 rounded text-zinc-500 hover:text-red-400">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {rule.description && (
                        <p className={cn("text-xs line-clamp-2 mb-2", theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500')}>{rule.description}</p>
                      )}

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", severityMeta.badge)}>{severityMeta.label}</span>
                        {rule.category && (
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded truncate max-w-[8rem]", theme === 'dark' ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-200 text-zinc-600')}>{rule.category}</span>
                        )}
                        {violations > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20 font-semibold flex items-center gap-0.5">
                            ⚠️ Violated {violations}x
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderNotices = () => {
    const activeNotice = notices.find(n => n.id === activeNoticeId) || null;

    return (
      <div className="space-y-10 min-w-0">
        {/* Gallery */}
        <div className="space-y-4 min-w-0">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="min-w-0">
              <h2 className="text-2xl font-bold text-white truncate">Market Notices</h2>
              <p className="text-zinc-500 text-sm truncate">Document market observations and scenarios</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {notices.map(notice => (
              <div
                key={notice.id}
                className="group relative text-left rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-all cursor-pointer min-w-0"
                onClick={() => setActiveNoticeId(notice.id)}
              >
                <div className="aspect-video w-full overflow-hidden bg-zinc-800 flex items-center justify-center">
                  {notice.imageUrl ? (
                    <img
                      src={notice.imageUrl}
                      alt={notice.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-zinc-700" />
                  )}
                </div>
                <div className="flex items-center justify-between px-3 py-2.5 border-t border-zinc-800 gap-2">
                  <span className="text-sm text-zinc-200 truncate">{notice.title}</span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); setActiveNoticeId(notice.id); }}
                      className="p-1 text-zinc-500 hover:text-zinc-200 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteNotice(notice.id); }}
                      className="p-1 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {notice.messages.length > 0 && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] text-zinc-300">
                    <StickyNote className="w-3 h-3" />
                    {notice.messages.length}
                  </div>
                )}
              </div>
            ))}

            {/* Add Notice card */}
            <button
              onClick={() => setShowAddNotice(true)}
              className="flex flex-col items-center justify-center gap-2 aspect-video rounded-xl border border-dashed border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span className="text-sm">New Notice</span>
            </button>
          </div>
        </div>

        {/* Scenarios & Lessons table */}
        <div className="min-w-0">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-sm uppercase tracking-wider text-zinc-500">Scenarios &amp; Lessons</h2>
            <button
              onClick={() => setShowAddScenario(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs transition-colors flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Row</span>
            </button>
          </div>

          {noticeScenarios.length > 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wider text-zinc-500">
                    <th className="px-4 py-3 w-12 font-medium">#</th>
                    <th className="px-4 py-3 font-medium">Scenario</th>
                    <th className="px-4 py-3 w-64 font-medium">Result / Tags</th>
                    <th className="px-4 py-3 font-medium">Lesson</th>
                    <th className="px-4 py-3 w-10 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {noticeScenarios.map((row, idx) => (
                    <tr
                      key={row.id}
                      className="group border-b border-zinc-800/70 last:border-b-0 hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-zinc-500 align-top">{idx + 1}</td>
                      <td className="px-4 py-3 text-zinc-300 align-top">{row.scenario}</td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-wrap gap-1.5">
                          {row.tags.map(tag => (
                            <span
                              key={tag}
                              className={cn("px-2 py-0.5 rounded-full text-xs border", getScenarioTagStyle(tag))}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 align-top">{row.lesson}</td>
                      <td className="px-4 py-3 align-top">
                        <button
                          onClick={() => handleDeleteScenario(row.id)}
                          className="p-1 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 rounded-xl border border-zinc-800 bg-zinc-900/50">
              <p className="text-zinc-500 text-sm mb-3">No scenarios logged yet</p>
              <button
                onClick={() => setShowAddScenario(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Scenario
              </button>
            </div>
          )}
        </div>

        {/* Slide-out drawer: chart + observation chat log */}
        {activeNotice && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => { setActiveNoticeId(null); setNoticeDraftMessage(''); }}
            />
            <div className="relative w-full max-w-md h-full bg-zinc-900 border-l border-zinc-800 flex flex-col shadow-2xl min-w-0">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 flex-shrink-0">
                <h3 className="text-sm font-medium text-white truncate pr-2">{activeNotice.title}</h3>
                <button
                  onClick={() => { setActiveNoticeId(null); setNoticeDraftMessage(''); }}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {activeNotice.imageUrl && (
                <div className="relative border-b border-zinc-800 bg-zinc-950 flex-shrink-0">
                  <img
                    src={activeNotice.imageUrl}
                    alt={activeNotice.title}
                    className="w-full max-h-64 object-contain cursor-zoom-in"
                    onClick={() => setLightboxImage(activeNotice.imageUrl)}
                  />
                  <button
                    onClick={() => setLightboxImage(activeNotice.imageUrl)}
                    className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-zinc-300 hover:text-white transition-colors"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex flex-col flex-1 min-h-0">
                <div className="px-4 py-2.5 border-b border-zinc-800 flex-shrink-0">
                  <span className="text-xs uppercase tracking-wider text-zinc-500">Observation Chat Log</span>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {activeNotice.messages.length === 0 && (
                    <p className="text-sm text-zinc-600 italic">
                      No observations yet. Start logging what you notice about this setup.
                    </p>
                  )}
                  {activeNotice.messages.map(msg => (
                    <div key={msg.id} className="rounded-lg border border-zinc-800 bg-zinc-800/40 px-3 py-2">
                      <p className="text-sm text-zinc-200 whitespace-pre-wrap break-words">{msg.text}</p>
                      <span className="block mt-1 text-[11px] text-zinc-500">{formatDate(msg.timestamp)}</span>
                    </div>
                  ))}
                </div>

                <div className="p-3 border-t border-zinc-800 flex items-end gap-2 flex-shrink-0">
                  <textarea
                    value={noticeDraftMessage}
                    onChange={(e) => setNoticeDraftMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendNoticeMessage();
                      }
                    }}
                    placeholder="What are you noticing right now?"
                    rows={1}
                    className="flex-1 resize-none bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 max-h-28"
                  />
                  <button
                    onClick={handleSendNoticeMessage}
                    disabled={!noticeDraftMessage.trim()}
                    className="p-2.5 rounded-lg bg-zinc-100 text-zinc-900 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderWiki = () => (
    <div className="space-y-6 min-w-0">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-white truncate">Knowledge Wiki</h2>
          <p className="text-zinc-500 text-sm truncate">Personal reference for trading concepts</p>
        </div>
        <button onClick={() => setShowAddWiki(true)} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors flex-shrink-0">
          <Plus className="w-4 h-4" />
          <span>Add Entry</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wikiEntries.map(entry => (
          <div key={entry.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 group min-w-0">
            <div className="flex items-start justify-between mb-2 gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-white truncate">{entry.title}</h3>
                {entry.category && <span className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded mt-1 inline-block truncate">{entry.category}</span>}
              </div>
              <button onClick={() => handleDeleteWiki(entry.id)} className="p-1 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-zinc-400 line-clamp-3">{entry.content}</p>
          </div>
        ))}
      </div>

      {wikiEntries.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto rounded-full bg-zinc-800 flex items-center justify-center mb-4">
            <Lightbulb className="w-8 h-8 text-zinc-600" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No wiki entries yet</h3>
          <p className="text-zinc-500 mb-4">Build your personal trading knowledge base</p>
          <button onClick={() => setShowAddWiki(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors">
            <Plus className="w-4 h-4" />
            Add Entry
          </button>
        </div>
      )}
    </div>
  );

  const renderCalendar = () => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Pad the month out to full weeks so we can render a Topstep-style grid
    // with a "Week" recap column at the end of every row.
    const paddedDays = [...calendarDays];
    while (paddedDays.length % 7 !== 0) paddedDays.push({ day: null as number | null, trades: [] as Trade[], pnl: 0 });
    const weeks: typeof paddedDays[] = [];
    for (let i = 0; i < paddedDays.length; i += 7) weeks.push(paddedDays.slice(i, i + 7));

    const { year, month } = calendarMonth;
    const monthTrades = filteredTrades.filter(t => {
      const date = new Date(`${t.date}T00:00:00`);
      return date.getFullYear() === year && date.getMonth() === month;
    });
    const totalPnL = monthTrades.reduce((s, t) => s + t.profitLoss, 0);
    const wins = monthTrades.filter(t => t.profitLoss > 0).length;
    const losses = monthTrades.filter(t => t.profitLoss < 0).length;
    const tradingDays = calendarDays.filter(d => d.day !== null && d.trades.length > 0).length;
    const winningDays = calendarDays.filter(d => d.day !== null && d.pnl > 0).length;
    const losingDays = calendarDays.filter(d => d.day !== null && d.pnl < 0).length;
    const winRate = (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 0;

    return (
      <div className="space-y-6 min-w-0">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold text-white truncate">Performance Calendar</h2>
            <p className="text-zinc-500 text-sm truncate">Daily P&L overview</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => { setCalendarMonth(prev => prev.month === 0 ? { year: prev.year - 1, month: 11 } : { ...prev, month: prev.month - 1 }); }} className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg">
              <span className="font-medium text-white whitespace-nowrap">{monthNames[calendarMonth.month]} {calendarMonth.year}</span>
            </div>
            <button onClick={() => { setCalendarMonth(prev => prev.month === 11 ? { year: prev.year + 1, month: 0 } : { ...prev, month: prev.month + 1 }); }} className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero summary bar — big net P&L front and center like a prop-firm dashboard, stats trailing */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 flex flex-wrap items-center gap-x-8 gap-y-4">
          <div className="flex items-center gap-3 pr-8 border-r border-zinc-800/80">
            <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', totalPnL >= 0 ? 'bg-emerald-500/15 border border-emerald-500/25' : 'bg-red-500/15 border border-red-500/25')}>
              <DollarSign className={cn('w-5 h-5', totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400')} />
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Net P&L This Month</p>
              <p className={cn('text-2xl font-bold font-mono', totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {formatCurrency(totalPnL, privacyMode)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Trading Days</p>
              <p className="text-lg font-semibold text-white">{tradingDays}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Winning Days</p>
              <p className="text-lg font-semibold text-emerald-400">{winningDays}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Losing Days</p>
              <p className="text-lg font-semibold text-red-400">{losingDays}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Win Rate</p>
              <p className="text-lg font-semibold text-white">{winRate.toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Trades</p>
              <p className="text-lg font-semibold text-white">{monthTrades.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
          <div className="grid grid-cols-8 gap-2 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-xs text-zinc-500 font-medium py-2">{day}</div>
            ))}
            <div className="text-center text-xs text-zinc-500 font-medium py-2">Week</div>
          </div>

          <div className="space-y-2">
            {weeks.map((week, wi) => {
              const weekRealDays = week.filter(d => d.day !== null);
              const weekPnl = weekRealDays.reduce((s, d) => s + d.pnl, 0);
              const weekTradingDays = weekRealDays.filter(d => d.trades.length > 0).length;
              const hasWeekData = weekTradingDays > 0;
              return (
                <div key={wi} className="grid grid-cols-8 gap-2">
                  {week.map((day, di) => (
                    <div
                      key={di}
                      className={cn(
                        'rounded-xl p-2.5 min-h-[92px] flex flex-col justify-between min-w-0 transition-colors',
                        day.day === null ? 'bg-transparent' :
                        day.trades.length === 0 ? 'bg-zinc-800/30 border border-zinc-800/60' :
                        day.pnl > 0 ? 'bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 cursor-pointer' :
                        day.pnl < 0 ? 'bg-red-500/15 border border-red-500/30 hover:bg-red-500/25 cursor-pointer' :
                        'bg-zinc-800/40 border border-zinc-700/60'
                      )}
                    >
                      {day.day !== null && (
                        <>
                          <span className="text-xs text-zinc-500 font-medium">{day.day}</span>
                          {day.trades.length > 0 ? (
                            <div className="min-w-0">
                              <p className={cn('text-sm font-bold font-mono truncate', day.pnl > 0 ? 'text-emerald-400' : day.pnl < 0 ? 'text-red-400' : 'text-zinc-300')}>
                                {formatCurrency(day.pnl, privacyMode)}
                              </p>
                              <p className="text-[10px] text-zinc-500 mt-0.5">{day.trades.length} trade{day.trades.length !== 1 ? 's' : ''}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-700">—</span>
                          )}
                        </>
                      )}
                    </div>
                  ))}

                  {/* Week recap cell */}
                  <div className={cn(
                    'rounded-xl p-2.5 min-h-[92px] flex flex-col items-center justify-center min-w-0 border',
                    !hasWeekData ? 'bg-zinc-900/40 border-zinc-800/50' :
                    weekPnl > 0 ? 'bg-emerald-500/10 border-emerald-500/25' :
                    weekPnl < 0 ? 'bg-red-500/10 border-red-500/25' :
                    'bg-zinc-800/40 border-zinc-700/60'
                  )}>
                    {hasWeekData ? (
                      <>
                        <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Week {wi + 1}</p>
                        <p className={cn('text-sm font-bold font-mono truncate', weekPnl > 0 ? 'text-emerald-400' : weekPnl < 0 ? 'text-red-400' : 'text-zinc-300')}>
                          {formatCurrency(weekPnl, privacyMode)}
                        </p>
                        <p className="text-[10px] text-zinc-600">{weekTradingDays} day{weekTradingDays !== 1 ? 's' : ''}</p>
                      </>
                    ) : (
                      <span className="text-xs text-zinc-700">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-zinc-800/70 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/40 border border-emerald-500/50" /> Profit
            </span>
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500/40 border border-red-500/50" /> Loss
            </span>
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-zinc-800/60 border border-zinc-700/60" /> No trades
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Discipline & Psychology Review modal — a dedicated editable modal opened from the
  // Discipline Tracker's Rules Followed / Rules Broken cards. Focuses strictly on the
  // psychological side of a trade (emotions, mistakes, notes) and never touches technical
  // fields like Symbol, P&L, Entry/SL/TP, or Date.
  const renderDisciplinePsychologyReviewModal = () => {
    const trade = trades.find(t => t.id === showDisciplineReview);
    if (!trade) return null;
    const account = accounts.find(a => a.id === trade.accountId);

    const toggleEmotion = (emotion: string) => {
      setDisciplineReviewDraft(prev => ({
        ...prev,
        emotions: prev.emotions.includes(emotion)
          ? prev.emotions.filter(e => e !== emotion)
          : [...prev.emotions, emotion],
      }));
    };

    return (
      <ModalBackdrop
        onClose={() => setShowDisciplineReview(null)}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4 py-8"
      >
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Brain className="w-5 h-5 text-violet-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-white truncate">Discipline & Psychology Review</h3>
                <p className="text-xs text-zinc-500 truncate">
                  {trade.symbol} · {account?.name} · {formatDate(trade.date)}
                </p>
              </div>
            </div>
            <button onClick={() => setShowDisciplineReview(null)} className="p-1 text-zinc-400 hover:text-white flex-shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            <div className="flex items-center gap-2">
              {trade.rulesFollowed === 'followed' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Rule Followed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                  <XCircle className="w-3.5 h-3.5" /> Rule Broken
                </span>
              )}
              <span className={cn('font-mono text-sm font-medium', trade.profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {formatCurrency(trade.profitLoss, privacyMode)}
              </span>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-2">Emotions Tracker</label>
              <div className="flex flex-wrap gap-1.5">
                {EMOTION_OPTIONS.map(emotion => {
                  const isSelected = disciplineReviewDraft.emotions.includes(emotion);
                  return (
                    <button
                      key={emotion}
                      type="button"
                      onClick={() => toggleEmotion(emotion)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 flex items-center gap-1',
                        isSelected
                          ? 'bg-violet-500 text-white border-violet-500'
                          : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/80 hover:border-violet-500/50 hover:text-violet-300 hover:bg-zinc-800'
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      {emotion}
                    </button>
                  );
                })}
              </div>
              <EditableTagInput
                values={disciplineReviewDraft.emotions.filter(e => !EMOTION_OPTIONS.includes(e))}
                onAdd={(value) => setDisciplineReviewDraft(prev => ({ ...prev, emotions: [...prev.emotions, value] }))}
                onRemove={(value) => setDisciplineReviewDraft(prev => ({ ...prev, emotions: prev.emotions.filter(e => e !== value) }))}
                placeholder="Type a custom emotion and press Enter..."
                colorScheme="violet"
              />
            </div>

            <div>
              <MultiSelectDropdown
                label="Mistakes Analysis"
                options={mistakesList}
                selected={disciplineReviewDraft.mistakes}
                onChange={(selected) => setDisciplineReviewDraft(prev => ({ ...prev, mistakes: selected }))}
                onAddNew={(name) => setMistakesList(prev => [...prev, { id: generateId(), name }])}
                onDeleteOption={handleDeleteMistakeType}
                placeholder="No mistakes logged"
                colorScheme="red"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-2">Performance Evaluation Summary</label>
              <textarea
                value={disciplineReviewDraft.notes}
                onChange={(e) => setDisciplineReviewDraft(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="What was going through your mind? Any psychological patterns or session observations worth remembering..."
                rows={5}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-600 placeholder-zinc-600 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDisciplineReview(null)}
                className="px-4 py-2.5 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDisciplineReview}
                className="flex items-center gap-2 px-5 py-2.5 bg-violet-500 hover:bg-violet-400 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Review
              </button>
            </div>
          </div>
        </div>
      </ModalBackdrop>
    );
  };

  // Trade detail modal
  const renderTradeDetailModal = () => {
    const trade = trades.find(t => t.id === showTradeDetail);
    if (!trade) return null;
    const account = accounts.find(a => a.id === trade.accountId);

    const execTf = trade.timeframes.find(tf => tf.name === 'Execution/Result');
    const executionImages = execTf?.images || [];
    const hasMultipleExec = executionImages.length > 1;

    const otherTimeframes = trade.timeframes.filter(tf => tf.name !== 'Execution/Result');
    const tradeRR = trade.riskAmount > 0 ? trade.profitLoss / trade.riskAmount : null;

    // Read-only duration breakdown for display purposes only — does not touch
    // the core trades array or any save/update handlers.
    const tradeStartDisplay = formatTimeDisplay(trade.startTime);
    const tradeEndDisplay = formatTimeDisplay(trade.endTime);
    const tradeDurationMinutes = calculateTradeDurationMinutes(trade.startTime, trade.endTime);
    const tradeDurationLabel = formatTradeDuration(tradeDurationMinutes);

    return (
      <ModalBackdrop
        onClose={() => { setShowTradeDetail(null); setShowExpandGallery(false); }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4 py-8"
      >
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between z-10">
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-bold text-white truncate">{trade.symbol}</h3>
              <p className="text-sm text-zinc-500 truncate">{account?.name} | {formatDate(trade.date)}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowExpandGallery(true)}
                className="p-2 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800"
                title="Expand Gallery"
              >
                <Expand className="w-5 h-5" />
              </button>
              <button onClick={() => { setShowTradeDetail(null); openEditTrade(trade); }} className="p-2 text-zinc-400 hover:text-white transition-colors">
                <Edit2 className="w-5 h-5" />
              </button>
              <button onClick={() => handleDeleteTrade(trade.id)} className="p-2 text-zinc-400 hover:text-red-400 transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
              <button onClick={() => setShowTradeDetail(null)} className="p-2 text-zinc-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {executionImages.length > 0 && (
              <div className="relative bg-zinc-800/50 rounded-xl overflow-hidden border border-zinc-800">
                <div className="group aspect-video relative">
                  <img
                    src={executionImages[executionImageIndex]?.url}
                    alt="Execution"
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setLightboxImage(executionImages[executionImageIndex]?.url)}
                  />
                  {hasMultipleExec && (
                    <>
                      <button
                        onClick={() => setExecutionImageIndex(prev => prev === 0 ? executionImages.length - 1 : prev - 1)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/50 hover:bg-black/75 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setExecutionImageIndex(prev => prev === executionImages.length - 1 ? 0 : prev + 1)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/50 hover:bg-black/75 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {executionImages.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setExecutionImageIndex(idx)}
                            className={cn(
                              'h-1.5 rounded-full transition-all duration-200',
                              idx === executionImageIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'
                            )}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
                {execTf?.notes && (
                  <div className="p-4 border-t border-zinc-800">
                    <p className="text-xs text-zinc-500 mb-1">Execution Notes</p>
                    <p className="text-sm text-zinc-300">{execTf.notes}</p>
                  </div>
                )}
              </div>
            )}

            <div className={cn('w-full flex items-center justify-center gap-3 py-4 px-4 rounded-xl border', trade.profitLoss >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20')}>
              <span className="text-sm text-zinc-400">P&L</span>
              <span className={cn('text-2xl font-bold', trade.profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {formatCurrency(trade.profitLoss, privacyMode)}
              </span>
            </div>

            {(tradeStartDisplay || tradeEndDisplay) && (
              <div className="flex flex-wrap items-center gap-3 bg-zinc-800/30 border border-zinc-800 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Clock className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                  <span className="text-sm text-zinc-300 whitespace-nowrap">
                    <span className="text-zinc-500">Start</span>{' '}
                    <span className="text-white font-medium">{tradeStartDisplay || '—'}</span>
                    <span className="text-zinc-600 mx-2">→</span>
                    <span className="text-zinc-500">End</span>{' '}
                    <span className="text-white font-medium">{tradeEndDisplay || '—'}</span>
                  </span>
                </div>
                {tradeDurationLabel && (
                  <span className="ml-auto px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30 whitespace-nowrap">
                    Duration: {tradeDurationLabel}
                  </span>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-zinc-800/50 rounded-lg p-3 min-w-0">
                <p className="text-xs text-zinc-500 mb-1 truncate">Symbol</p>
                <p className="text-sm text-white font-medium truncate">{trade.symbol}</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3 min-w-0">
                <p className="text-xs text-zinc-500 mb-1 truncate">Entry</p>
                <p className="text-sm text-white font-medium truncate">{formatPriceInput(trade.entryPrice)}</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3 min-w-0">
                <p className="text-xs text-zinc-500 mb-1 truncate">Stop Loss</p>
                <p className="text-sm text-white font-medium truncate">{formatPriceInput(trade.stopLoss)} <span className="text-zinc-500">({trade.slPoints} pts)</span></p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3 min-w-0">
                <p className="text-xs text-zinc-500 mb-1 truncate">Take Profit</p>
                <p className="text-sm text-white font-medium truncate">{formatPriceInput(trade.takeProfit)} <span className="text-zinc-500">({trade.tpPoints} pts)</span></p>
              </div>
            </div>

            {(trade.riskAmount > 0 || tradeRR !== null) && (
              <div className="flex flex-wrap gap-3">
                {trade.riskAmount > 0 && (
                  <div className="bg-zinc-800/50 rounded-lg p-3 inline-block">
                    <p className="text-xs text-zinc-500 mb-1">Risk Amount</p>
                    <p className="text-sm text-white font-medium">{formatCurrencyAbsolute(trade.riskAmount)}</p>
                  </div>
                )}
                {tradeRR !== null && (
                  <div className="bg-zinc-800/50 rounded-lg p-3 inline-block">
                    <p className="text-xs text-zinc-500 mb-1">Risk:Reward</p>
                    <p className={cn('text-sm font-medium', tradeRR >= 1 ? 'text-emerald-400' : tradeRR >= 0 ? 'text-white' : 'text-red-400')}>
                      {tradeRR >= 1 ? '+' : ''}{tradeRR.toFixed(2)}R
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {trade.setupTypes.map(s => (
                <span key={s} className="px-3 py-1.5 bg-zinc-800 rounded-lg text-sm text-zinc-300 truncate max-w-[150px]">{s}</span>
              ))}
              {trade.confluences.map(c => (
                <span key={c} className="px-3 py-1.5 bg-zinc-700 rounded-lg text-sm text-zinc-300 truncate max-w-[150px]">{c}</span>
              ))}
              <button
                type="button"
                onClick={() => setDetailRulesFollowedDraft(prev => prev === 'followed' ? 'broken' : 'followed')}
                className={cn('px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-colors', detailRulesFollowedDraft === 'followed' ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30')}
                title="Click to toggle rule adherence"
              >
                {detailRulesFollowedDraft === 'followed' ? <Check className="w-4 h-4 flex-shrink-0" /> : <X className="w-4 h-4 flex-shrink-0" />}
                <span className="truncate">Rules {detailRulesFollowedDraft}</span>
              </button>
            </div>

            {trade.mistakes.length > 0 && (
              <div>
                <h4 className="text-sm text-zinc-500 mb-2">Mistakes Made</h4>
                <div className="flex flex-wrap gap-2">
                  {trade.mistakes.map(m => (
                    <span key={m} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm truncate max-w-[150px]">{m}</span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-white">Post-Trade Performance Notes</h4>
                {detailRulesFollowedDraft !== trade.rulesFollowed && (
                  <button
                    type="button"
                    onClick={handleSaveDetailNotes}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-zinc-200 text-black rounded-lg text-xs font-medium transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-800/30 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Mistakes Analysis</span>
                  </h5>
                  <div className="w-full min-h-[6.5rem] bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2 text-sm whitespace-pre-wrap cursor-default">
                    {trade.mistakesAnalysis
                      ? <span className="text-zinc-300">{trade.mistakesAnalysis}</span>
                      : <span className="text-zinc-600">What went wrong on this trade...</span>}
                  </div>
                </div>
                <div className="bg-zinc-800/30 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-emerald-400 mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Lessons Learned</span>
                  </h5>
                  <div className="w-full min-h-[6.5rem] bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2 text-sm whitespace-pre-wrap cursor-default">
                    {trade.lessonsLearned
                      ? <span className="text-zinc-300">{trade.lessonsLearned}</span>
                      : <span className="text-zinc-600">What to take away from this trade...</span>}
                  </div>
                </div>
              </div>
            </div>

            {otherTimeframes.filter(tf => tf.images.length > 0 || tf.notes).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-white mb-3">Timeframe Charts</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {otherTimeframes.filter(tf => tf.images.length > 0 || tf.notes).map(tf => {
                    const tfKey = `${trade.id}-${tf.name}`;
                    const tfIndex = timeframeImageIndices[tfKey] || 0;
                    const hasMultipleTfImages = tf.images.length > 1;
                    const activeImg = tf.images[tfIndex] || tf.images[0];
                    return (
                      <div
                        key={tf.name}
                        className="bg-zinc-800/50 rounded-lg overflow-hidden border border-zinc-800"
                      >
                        {activeImg && (
                          <div className="group relative aspect-video">
                            <img
                              src={activeImg.url}
                              alt={tf.name}
                              className="w-full h-full object-cover cursor-pointer hover:opacity-90"
                              onClick={() => setLightboxImage(activeImg.url)}
                            />
                            {hasMultipleTfImages && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTimeframeImageIndices(prev => ({ ...prev, [tfKey]: tfIndex === 0 ? tf.images.length - 1 : tfIndex - 1 }));
                                  }}
                                  className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 hover:bg-black/75 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                >
                                  <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTimeframeImageIndices(prev => ({ ...prev, [tfKey]: tfIndex === tf.images.length - 1 ? 0 : tfIndex + 1 }));
                                  }}
                                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 hover:bg-black/75 backdrop-blur-sm rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                >
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
                                  {tf.images.map((_, idx) => (
                                    <span
                                      key={idx}
                                      className={cn(
                                        'h-1 rounded-full transition-all duration-200',
                                        idx === tfIndex ? 'w-3 bg-white' : 'w-1 bg-white/40'
                                      )}
                                    />
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                        <div className="p-2">
                          <p className="text-xs font-medium text-zinc-300 mb-1">{tf.name}</p>
                          {tf.notes && (
                            <p className="text-xs text-zinc-500 line-clamp-2">{tf.notes}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </ModalBackdrop>
    );
  };

  // Expand Gallery Overlay
  const renderExpandGallery = () => {
    const trade = trades.find(t => t.id === showTradeDetail);
    if (!trade || !showExpandGallery) return null;

    const allImages = trade.timeframes.flatMap(tf => tf.images.map(img => ({ ...img, timeframe: tf.name })));
    const count = allImages.length;

    const gridCols =
      count <= 4 ? 'grid-cols-1 sm:grid-cols-2' :
      count <= 6 ? 'grid-cols-2 sm:grid-cols-3' :
      count <= 9 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' :
      'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5';

    return (
      <ModalBackdrop
        onClose={() => setShowExpandGallery(false)}
        className="fixed inset-0 bg-black/95 z-[60] flex flex-col p-4 md:p-8"
      >
        <button onClick={() => setShowExpandGallery(false)} className="absolute top-4 right-4 p-2 bg-zinc-800 rounded-full text-white hover:bg-zinc-700 z-10">
          <X className="w-6 h-6" />
        </button>

        {count === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-zinc-500">No images to display</p>
          </div>
        )}

        {count === 1 && (
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <div className="relative group cursor-pointer max-w-full max-h-full" onClick={(e) => { e.stopPropagation(); setLightboxImage(allImages[0].url); }}>
              <img src={allImages[0].url} alt={allImages[0].timeframe} className="max-w-full max-h-[85vh] object-contain rounded-xl bg-zinc-900" />
              <span className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/70 rounded-lg text-xs text-white">{allImages[0].timeframe}</span>
            </div>
          </div>
        )}

        {count === 2 && (
          <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 gap-4 place-items-center">
            {allImages.map(img => (
              <div key={img.id} className="relative group cursor-pointer max-w-full max-h-full" onClick={(e) => { e.stopPropagation(); setLightboxImage(img.url); }}>
                <img src={img.url} alt={img.timeframe} className="max-w-full max-h-[80vh] object-contain rounded-xl bg-zinc-900" />
                <span className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/70 rounded-lg text-xs text-white">{img.timeframe}</span>
              </div>
            ))}
          </div>
        )}

        {count > 2 && (
          <div className="flex-1 min-h-0 overflow-y-auto flex items-center">
            <div className={cn('grid gap-3 w-full', gridCols)}>
              {allImages.map(img => (
                <div key={img.id} className="relative group cursor-pointer" onClick={(e) => { e.stopPropagation(); setLightboxImage(img.url); }}>
                  <img src={img.url} alt={img.timeframe} className="w-full aspect-video object-cover rounded-lg bg-zinc-800" />
                  <span className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-xs text-white">{img.timeframe}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </ModalBackdrop>
    );
  };

  // Account Modal
  const renderAccountModal = () => {
    const isEditing = showEditAccount !== null;
    const currentAccount = isEditing ? editingAccount : newAccount;

    return (
      (showAddAccount || showEditAccount !== null) && (
        <ModalBackdrop
          onClose={() => {
            isEditing ? setShowEditAccount(null) : setShowAddAccount(false);
            resetCalculator();
          }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4 py-8"
        >
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-bold text-white truncate">{isEditing ? 'Edit Account' : 'Add Trading Account'}</h3>
              <button onClick={() => { isEditing ? setShowEditAccount(null) : setShowAddAccount(false); resetCalculator(); }} className="p-1 text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Account Name</label>
                <input
                  type="text"
                  value={currentAccount.name || ''}
                  onChange={(e) => isEditing ? setEditingAccount(prev => ({ ...prev, name: e.target.value })) : setNewAccount(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My Funded Account"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Starting Balance</label>
                <NumericInput
                  value={formatPriceInput(currentAccount.startingBalance || 0)}
                  onChange={(sanitized, numericValue) => {
                    if (isEditing) {
                      setEditingAccount(prev => ({ ...prev, startingBalance: numericValue, highestBalance: numericValue }));
                    } else {
                      setNewAccount(prev => ({ ...prev, startingBalance: numericValue, highestBalance: numericValue }));
                    }
                  }}
                  onFocus={(e) => handleNumberInputFocus(e, isEditing ? 'editaccount-startingBalance' : 'account-startingBalance', formatPriceInput(currentAccount.startingBalance || 0), false)}
                  placeholder="10,000"
                  allowNegative={false}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Type</label>
                  <div className="relative" ref={tradingAccountTypeDropdownRef}>
                    <button
                      onClick={() => setShowTradingAccountTypeDropdown(!showTradingAccountTypeDropdown)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-zinc-600 flex items-center justify-between"
                    >
                      <span className="truncate flex items-center gap-2">
                        {renderTradingAccountTypeBadge({ tradingAccountType: currentAccount.tradingAccountType || 'LIVE' } as Account)}
                        <span>{currentAccount.tradingAccountType || 'LIVE'}</span>
                      </span>
                      <ChevronDown className="w-4 h-4 flex-shrink-0" />
                    </button>
                    {showTradingAccountTypeDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-10">
                        {TRADING_ACCOUNT_TYPES.map(type => (
                          <button
                            key={type}
                            onClick={() => {
                              if (isEditing) {
                                setEditingAccount(prev => ({ ...prev, tradingAccountType: type }));
                              } else {
                                setNewAccount(prev => ({ ...prev, tradingAccountType: type }));
                              }
                              setShowTradingAccountTypeDropdown(false);
                            }}
                            className={cn(
                              'w-full text-left px-3 py-2.5 text-sm hover:bg-zinc-700 transition-colors flex items-center gap-2',
                              currentAccount.tradingAccountType === type ? 'text-white bg-zinc-700' : 'text-zinc-400'
                            )}
                          >
                            {renderTradingAccountTypeBadge({ tradingAccountType: type } as Account)}
                            <span>{type}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Status</label>
                  <div className="relative" ref={accountTypeDropdownRef}>
                    <button
                      onClick={() => setShowAccountTypeDropdown(!showAccountTypeDropdown)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-zinc-600 flex items-center justify-between"
                    >
                      <span className="truncate">
                        {currentAccount.type === 'Custom Challenge' ? (currentAccount.customTypeName || 'Custom Challenge') : currentAccount.type}
                      </span>
                      <ChevronDown className="w-4 h-4 flex-shrink-0" />
                    </button>
                    {showAccountTypeDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-10 max-h-48 overflow-y-auto">
                        {ACCOUNT_TYPES.map(type => (
                          <button
                            key={type}
                            onClick={() => {
                              if (isEditing) {
                                setEditingAccount(prev => ({ ...prev, type }));
                              } else {
                                setNewAccount(prev => ({ ...prev, type }));
                              }
                              if (type !== 'Custom Challenge') {
                                setShowAccountTypeDropdown(false);
                              }
                            }}
                            className={cn(
                              'w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 transition-colors',
                              currentAccount.type === type ? 'text-white bg-zinc-700' : 'text-zinc-400'
                            )}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {currentAccount.type === 'Custom Challenge' && (
                    <input
                      type="text"
                      value={currentAccount.customTypeName || ''}
                      onChange={(e) => isEditing ? setEditingAccount(prev => ({ ...prev, customTypeName: e.target.value })) : setNewAccount(prev => ({ ...prev, customTypeName: e.target.value }))}
                      placeholder="Custom type name"
                      className="w-full mt-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-600"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Prop Firm Name</label>
                <input
                  type="text"
                  value={currentAccount.propFirm || ''}
                  onChange={(e) => isEditing ? setEditingAccount(prev => ({ ...prev, propFirm: e.target.value })) : setNewAccount(prev => ({ ...prev, propFirm: e.target.value }))}
                  placeholder="FTMO, FundedNext, etc."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-zinc-600"
                />
              </div>

              {currentAccount.tradingAccountType !== 'LIVE' && (
                <div className="border-t border-zinc-800 pt-4">
                  {currentAccount.tradingAccountType === 'CFD' ? (
                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">Minimum Balance Threshold ($)</label>
                      <NumericInput
                        value={formatPriceInput(currentAccount.fixedMinBalance || 0)}
                        onChange={(sanitized, numericValue) => {
                          if (isEditing) {
                            setEditingAccount(prev => ({ ...prev, fixedMinBalance: numericValue }));
                          } else {
                            setNewAccount(prev => ({ ...prev, fixedMinBalance: numericValue }));
                          }
                        }}
                        onFocus={(e) => handleNumberInputFocus(e, isEditing ? 'editaccount-fixedMinBalance' : 'account-fixedMinBalance', formatPriceInput(currentAccount.fixedMinBalance || 0), false)}
                        placeholder="4,500"
                        allowNegative={false}
                      />
                    </div>
                  ) : currentAccount.tradingAccountType === 'FUTURES' && (
                    <div>
                      <label className="block text-sm text-zinc-400 mb-2">Max Loss Limit ($)</label>
                      <NumericInput
                        value={formatPriceInput(currentAccount.maxDrawdownAllowance || 0)}
                        onChange={(sanitized, numericValue) => {
                          if (isEditing) {
                            setEditingAccount(prev => ({ ...prev, maxDrawdownAllowance: numericValue }));
                          } else {
                            setNewAccount(prev => ({ ...prev, maxDrawdownAllowance: numericValue }));
                          }
                        }}
                        onFocus={(e) => handleNumberInputFocus(e, isEditing ? 'editaccount-maxDrawdownAllowance' : 'account-maxDrawdownAllowance', formatPriceInput(currentAccount.maxDrawdownAllowance || 0), false)}
                        placeholder="2,000"
                        allowNegative={false}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-zinc-800 pt-4">
                <button
                  onClick={() => {
                    if (isEditing) {
                      setEditingAccount(prev => ({ ...prev, hasProfitTarget: !prev.hasProfitTarget }));
                    } else {
                      setNewAccount(prev => ({ ...prev, hasProfitTarget: !prev.hasProfitTarget }));
                    }
                  }}
                  className="flex items-center gap-3 text-sm text-zinc-300 hover:text-white transition-colors"
                >
                  {currentAccount.hasProfitTarget ? (
                    <ToggleRight className="w-8 h-8 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-zinc-500" />
                  )}
                  <span>Set Profit Target Goal</span>
                </button>

                {currentAccount.hasProfitTarget && (
                  <div className="mt-3">
                    <label className="block text-sm text-zinc-400 mb-2">Profit Target Amount ($)</label>
                    <NumericInput
                      value={formatPriceInput(currentAccount.profitTarget || 0)}
                      onChange={(sanitized, numericValue) => {
                        if (isEditing) {
                          setEditingAccount(prev => ({ ...prev, profitTarget: numericValue }));
                        } else {
                          setNewAccount(prev => ({ ...prev, profitTarget: numericValue }));
                        }
                      }}
                      onFocus={(e) => handleNumberInputFocus(e, isEditing ? 'editaccount-profitTarget' : 'account-profitTarget', formatPriceInput(currentAccount.profitTarget || 0), false)}
                      placeholder="5,000"
                      allowNegative={false}
                    />
                  </div>
                )}
              </div>

              <button
                onClick={isEditing ? handleUpdateAccount : handleAddAccount}
                className="w-full py-2.5 bg-white hover:bg-zinc-200 text-black rounded-lg text-sm font-medium transition-colors"
              >
                {isEditing ? 'Update Account' : 'Add Account'}
              </button>
            </div>
          </div>

          {calculatorState.show && (
            <PopupCalculator
              value={calculatorState.value}
              onChange={handleCalculatorChange}
              onClose={closeCalculator}
              onEnter={handleCalculatorEnter}
              initialPosition={calculatorState.position}
              allowNegative={calculatorState.allowNegative}
              theme={theme}
            />
          )}
        </ModalBackdrop>
      )
    );
  };

  // Add Trade Modal with STRICT numeric validation
  const renderAddTradeModal = () => (
    showAddTrade && (
      <ModalBackdrop
        onClose={() => { setShowAddTrade(false); resetCalculator(); }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4 py-8"
      >
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between z-20">
            <h3 className="text-xl font-bold text-white truncate">Add New Trade</h3>
            <button onClick={() => { setShowAddTrade(false); resetCalculator(); }} className="p-2 text-zinc-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form className="p-6 space-y-4">
            {/* Row 1: Account + Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Account</label>
                <select
                  value={newTrade.accountId || ''}
                  onChange={(e) => setNewTrade(prev => ({ ...prev, accountId: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-zinc-600"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <DateInput
                  value={newTrade.date || getTodayLocalDate()}
                  onChange={(value) => setNewTrade(prev => ({ ...prev, date: value }))}
                  label="Date"
                />
                <button
                  type="button"
                  onClick={() => setShowTradeTimeFields(v => !v)}
                  className="mt-1.5 w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"
                >
                  <Clock className="w-3.5 h-3.5" />
                  {showTradeTimeFields ? 'Hide start / end time' : 'Add start / end time'}
                  <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showTradeTimeFields && 'rotate-180')} />
                </button>
              </div>
            </div>

            {showTradeTimeFields && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TimeInput
                  value={newTrade.startTime || ''}
                  onChange={(value) => setNewTrade(prev => ({ ...prev, startTime: value }))}
                  label="Start Time"
                />
                <TimeInput
                  value={newTrade.endTime || ''}
                  onChange={(value) => setNewTrade(prev => ({ ...prev, endTime: value }))}
                  label="End Time"
                />
              </div>
            )}

            {/* Row 2: Symbol + Session + Trade # - sit side-by-side */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Symbol</label>
                <div className="relative" ref={symbolDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowSymbolDropdown(!showSymbolDropdown)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-zinc-600 flex items-center justify-between"
                  >
                    <span className={cn(newTrade.symbol ? 'text-white' : 'text-zinc-500')}>
                      {newTrade.symbol || 'Select...'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-zinc-400" />
                  </button>
                  {showSymbolDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-30 max-h-40 overflow-y-auto">
                      {PRESET_SYMBOLS.map(sym => (
                        <button
                          type="button"
                          key={sym.value}
                          onClick={() => { setNewTrade(prev => ({ ...prev, symbol: sym.value })); setShowSymbolDropdown(false); }}
                          className={cn('w-full text-left px-3 py-2 text-sm hover:bg-zinc-700', newTrade.symbol === sym.value ? 'text-white bg-zinc-700' : 'text-zinc-400')}
                        >
                          {sym.name}
                        </button>
                      ))}
                      {customSymbols.length > 0 && (
                        <>
                          <div className="border-t border-zinc-700 my-1" />
                          {customSymbols.map(sym => (
                            <button type="button" key={sym} onClick={() => { setNewTrade(prev => ({ ...prev, symbol: sym })); setShowSymbolDropdown(false); }}
                              className={cn('w-full text-left px-3 py-2 text-sm hover:bg-zinc-700', newTrade.symbol === sym ? 'text-white bg-zinc-700' : 'text-zinc-400')}>
                              {sym}
                            </button>
                          ))}
                        </>
                      )}
                      <div className="border-t border-zinc-700 p-2">
                        <input type="text" value={symbolCustomInput} onChange={(e) => setSymbolCustomInput(e.target.value.toUpperCase())}
                          placeholder="Add custom..."
                          className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1.5 text-xs text-white placeholder-zinc-400 focus:outline-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && symbolCustomInput.trim()) {
                              setNewTrade(prev => ({ ...prev, symbol: symbolCustomInput.trim() }));
                              if (!customSymbols.includes(symbolCustomInput.trim())) setCustomSymbols(prev => [...prev, symbolCustomInput.trim()]);
                              setSymbolCustomInput('');
                              setShowSymbolDropdown(false);
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Session</label>
                <div className="relative" ref={sessionDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowSessionDropdown(!showSessionDropdown)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-zinc-600 flex items-center justify-between"
                  >
                    <span className={cn(newTrade.session ? 'text-white' : 'text-zinc-500')}>
                      {newTrade.session || 'Select...'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-zinc-400" />
                  </button>
                  {showSessionDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-30 max-h-40 overflow-y-auto">
                      {SESSION_OPTIONS.map(opt => (
                        <button
                          type="button"
                          key={opt}
                          onClick={() => { setNewTrade(prev => ({ ...prev, session: opt })); setShowSessionDropdown(false); }}
                          className={cn('w-full text-left px-3 py-2 text-sm hover:bg-zinc-700', newTrade.session === opt ? 'text-white bg-zinc-700' : 'text-zinc-400')}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Trade #</label>
                <NumericInput
                  value={newTrade.trackingNumber || ''}
                  onChange={(sanitized) => setNewTrade(prev => ({ ...prev, trackingNumber: sanitized }))}
                  onFocus={(e) => handleNumberInputFocus(e, 'trade-trackingNumber', newTrade.trackingNumber || '', false)}
                  placeholder="e.g. 14, 15, 18"
                  allowNegative={false}
                  className="focus:border-emerald-500/50"
                />
              </div>
            </div>

            {/* Row 2: P&L + Risk - STRICT numeric inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">P&L ($)</label>
                <NumericInput
                  value={priceInputs.profitLoss}
                  onChange={(sanitized, numericValue) => {
                    setPriceInputs(prev => ({ ...prev, profitLoss: sanitized }));
                    setNewTrade(prev => ({ ...prev, profitLoss: numericValue }));
                  }}
                  onFocus={(e) => handleNumberInputFocus(e, 'trade-profitLoss', priceInputs.profitLoss, true)}
                  placeholder="0"
                  allowNegative={true}
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Risk ($)</label>
                <NumericInput
                  value={priceInputs.riskAmount}
                  onChange={(sanitized, numericValue) => {
                    setPriceInputs(prev => ({ ...prev, riskAmount: sanitized }));
                    setNewTrade(prev => ({ ...prev, riskAmount: numericValue }));
                  }}
                  onFocus={(e) => handleNumberInputFocus(e, 'trade-riskAmount', priceInputs.riskAmount, false)}
                  onBlur={() => setPriceInputs(prev => ({ ...prev, riskAmount: formatPriceInput(newTrade.riskAmount || 0) }))}
                  placeholder="0"
                  allowNegative={false}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowTradePriceLevels(v => !v)}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"
            >
              <Target className="w-3.5 h-3.5" />
              {showTradePriceLevels ? 'Hide entry / stop loss / take profit' : 'Add entry / stop loss / take profit'}
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showTradePriceLevels && 'rotate-180')} />
            </button>

            {showTradePriceLevels && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Entry</label>
                  <NumericInput
                    value={priceInputs.entryPrice}
                    onChange={(sanitized, numericValue) => {
                      setPriceInputs(prev => ({ ...prev, entryPrice: sanitized }));
                      setNewTrade(prev => ({
                        ...prev,
                        entryPrice: numericValue,
                        slPoints: calculatePoints(prev.symbol || '', numericValue, prev.stopLoss || 0),
                        tpPoints: calculatePoints(prev.symbol || '', numericValue, prev.takeProfit || 0),
                      }));
                    }}
                    onFocus={(e) => handleNumberInputFocus(e, 'trade-entryPrice', priceInputs.entryPrice, false)}
                    onBlur={() => setPriceInputs(prev => ({ ...prev, entryPrice: formatPriceInput(newTrade.entryPrice || 0) }))}
                    placeholder="0"
                    allowNegative={false}
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Stop Loss</label>
                  <NumericInput
                    value={priceInputs.stopLoss}
                    onChange={(sanitized, numericValue) => {
                      setPriceInputs(prev => ({ ...prev, stopLoss: sanitized }));
                      setNewTrade(prev => ({ ...prev, stopLoss: numericValue, slPoints: calculatePoints(prev.symbol || '', prev.entryPrice || 0, numericValue) }));
                    }}
                    onFocus={(e) => handleNumberInputFocus(e, 'trade-stopLoss', priceInputs.stopLoss, false)}
                    onBlur={() => setPriceInputs(prev => ({ ...prev, stopLoss: formatPriceInput(newTrade.stopLoss || 0) }))}
                    placeholder="0"
                    allowNegative={false}
                  />
                  {newTrade.slPoints !== undefined && newTrade.slPoints > 0 && <p className="text-[10px] text-zinc-500 mt-0.5">{newTrade.slPoints} pts</p>}
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Take Profit</label>
                  <NumericInput
                    value={priceInputs.takeProfit}
                    onChange={(sanitized, numericValue) => {
                      setPriceInputs(prev => ({ ...prev, takeProfit: sanitized }));
                      setNewTrade(prev => ({ ...prev, takeProfit: numericValue, tpPoints: calculatePoints(prev.symbol || '', prev.entryPrice || 0, numericValue) }));
                    }}
                    onFocus={(e) => handleNumberInputFocus(e, 'trade-takeProfit', priceInputs.takeProfit, false)}
                    onBlur={() => setPriceInputs(prev => ({ ...prev, takeProfit: formatPriceInput(newTrade.takeProfit || 0) }))}
                    placeholder="0"
                    allowNegative={false}
                  />
                  {newTrade.tpPoints !== undefined && newTrade.tpPoints > 0 && <p className="text-[10px] text-zinc-500 mt-0.5">{newTrade.tpPoints} pts</p>}
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">R:R Ratio</label>
                  <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-3 text-sm">
                    {calculatedRR !== null ? (
                      <span className={cn('font-medium', calculatedRR >= 1 ? 'text-emerald-400' : calculatedRR >= 0 ? 'text-zinc-400' : 'text-red-400')}>
                        {calculatedRR.toFixed(2)}R
                      </span>
                    ) : (
                      <span className="text-zinc-500">--</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Row 4: Rules Adherence + Setup Types */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Rules Adherence</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTrade(prev => ({ ...prev, rulesFollowed: 'followed' }))}
                    className={cn('flex-1 flex items-center justify-center gap-1.5 px-3 py-3 rounded-lg text-sm transition-colors',
                      newTrade.rulesFollowed === 'followed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700')}
                  >
                    <Check className="w-3.5 h-3.5" /> Followed
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTrade(prev => ({ ...prev, rulesFollowed: 'broken' }))}
                    className={cn('flex-1 flex items-center justify-center gap-1.5 px-3 py-3 rounded-lg text-sm transition-colors',
                      newTrade.rulesFollowed === 'broken' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700')}
                  >
                    <X className="w-3.5 h-3.5" /> Broken
                  </button>
                </div>
              </div>
              <MultiSelectDropdown
                label="Setup Types"
                options={setupTypes}
                selected={newTrade.setupTypes || []}
                onChange={(selected) => setNewTrade(prev => ({ ...prev, setupTypes: selected }))}
                onAddNew={(name) => setSetupTypes(prev => [...prev, { id: generateId(), name }])}
                onDeleteOption={handleDeleteSetupType}
                placeholder="Select setup types..."
              />
            </div>

            <MultiSelectDropdown
              label="Confluences"
              options={confluences}
              selected={newTrade.confluences || []}
              onChange={(selected) => setNewTrade(prev => ({ ...prev, confluences: selected }))}
              onAddNew={(name) => setConfluences(prev => [...prev, { id: generateId(), name }])}
              onDeleteOption={handleDeleteConfluence}
              placeholder="Select confluences..."
            />

            <MultiSelectDropdown
              label="Mistakes Made"
              options={mistakesList}
              selected={newTrade.mistakes || []}
              onChange={(selected) => setNewTrade(prev => ({ ...prev, mistakes: selected }))}
              onAddNew={(name) => setMistakesList(prev => [...prev, { id: generateId(), name }])}
              onDeleteOption={handleDeleteMistakeType}
              placeholder="Select mistakes..."
              colorScheme="red"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Mistakes Analysis</label>
                <textarea
                  value={newTrade.mistakesAnalysis || ''}
                  onChange={(e) => setNewTrade(prev => ({ ...prev, mistakesAnalysis: e.target.value }))}
                  placeholder="What went wrong?"
                  rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600 placeholder-zinc-600 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Lessons Learned</label>
                <textarea
                  value={newTrade.lessonsLearned || ''}
                  onChange={(e) => setNewTrade(prev => ({ ...prev, lessonsLearned: e.target.value }))}
                  placeholder="What did you learn?"
                  rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600 placeholder-zinc-600 resize-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Chart Screenshots</label>
              <p className="text-xs text-zinc-500 mb-3">Attach images for each timeframe</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {TIMEFRAMES.map(tf => {
                  const tfData = (newTrade.timeframes || []).find(t => t.name === tf) || { name: tf, images: [], notes: '' };
                  return (
                    <TimeframeChartInput
                      key={tf}
                      timeframe={tf}
                      images={tfData.images || []}
                      notes={tfData.notes || ''}
                      onAddImage={(url) => handleAddImageUrl(url, tf)}
                      onUploadImage={(file) => handleFileUpload(file, tf)}
                      onRemoveImage={(imageId) => handleRemoveImage(tf, imageId)}
                      onReorderImages={(fromIndex, toIndex) => handleReorderImages(tf, fromIndex, toIndex)}
                      onPreviewImage={(url) => setLightboxImage(url)}
                      onNotesChange={(notes) => updateTimeframeNotes(tf, notes)}
                      isExecution={tf === 'Execution/Result'}
                    />
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => { setShowAddTrade(false); resetCalculator(); }}
                className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddTrade}
                className="flex items-center gap-2 px-5 py-2 bg-white hover:bg-zinc-200 text-black rounded-lg text-sm font-medium transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Trade
              </button>
            </div>
          </form>

          {calculatorState.show && (
            <PopupCalculator
              value={calculatorState.value}
              onChange={handleCalculatorChange}
              onClose={closeCalculator}
              onEnter={handleCalculatorEnter}
              initialPosition={calculatorState.position}
              allowNegative={calculatorState.allowNegative}
              theme={theme}
            />
          )}
        </div>
      </ModalBackdrop>
    )
  );

  // Edit Trade Modal - SAME strict validation
  const renderEditTradeModal = () => (
    showEditTrade && editingTrade && (
      <ModalBackdrop
        onClose={() => { setShowEditTrade(false); setEditingTrade(null); resetTradeForm(); resetCalculator(); }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4 py-8"
      >
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between z-20">
            <h3 className="text-xl font-bold text-white truncate">Edit Trade</h3>
            <button onClick={() => { setShowEditTrade(false); setEditingTrade(null); resetTradeForm(); resetCalculator(); }} className="p-2 text-zinc-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form className="p-6 space-y-4">
            {/* Row 1: Account + Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Account</label>
                <select
                  value={newTrade.accountId || ''}
                  onChange={(e) => setNewTrade(prev => ({ ...prev, accountId: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-zinc-600"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <DateInput
                  value={newTrade.date || getTodayLocalDate()}
                  onChange={(value) => setNewTrade(prev => ({ ...prev, date: value }))}
                  label="Date"
                />
                <button
                  type="button"
                  onClick={() => setShowTradeTimeFields(v => !v)}
                  className="mt-1.5 w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"
                >
                  <Clock className="w-3.5 h-3.5" />
                  {showTradeTimeFields ? 'Hide start / end time' : 'Add start / end time'}
                  <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showTradeTimeFields && 'rotate-180')} />
                </button>
              </div>
            </div>

            {showTradeTimeFields && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TimeInput
                  value={newTrade.startTime || ''}
                  onChange={(value) => setNewTrade(prev => ({ ...prev, startTime: value }))}
                  label="Start Time"
                />
                <TimeInput
                  value={newTrade.endTime || ''}
                  onChange={(value) => setNewTrade(prev => ({ ...prev, endTime: value }))}
                  label="End Time"
                />
              </div>
            )}

            {/* Row 2: Symbol + Session + Trade # - sit side-by-side */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Symbol</label>
                <div className="relative" ref={symbolDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowSymbolDropdown(!showSymbolDropdown)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-zinc-600 flex items-center justify-between"
                  >
                    <span className={cn(newTrade.symbol ? 'text-white' : 'text-zinc-500')}>
                      {newTrade.symbol || 'Select...'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-zinc-400" />
                  </button>
                  {showSymbolDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-30 max-h-40 overflow-y-auto">
                      {PRESET_SYMBOLS.map(sym => (
                        <button
                          type="button"
                          key={sym.value}
                          onClick={() => { setNewTrade(prev => ({ ...prev, symbol: sym.value })); setShowSymbolDropdown(false); }}
                          className={cn('w-full text-left px-3 py-2 text-sm hover:bg-zinc-700', newTrade.symbol === sym.value ? 'text-white bg-zinc-700' : 'text-zinc-400')}
                        >
                          {sym.name}
                        </button>
                      ))}
                      {customSymbols.length > 0 && (
                        <>
                          <div className="border-t border-zinc-700 my-1" />
                          {customSymbols.map(sym => (
                            <button type="button" key={sym} onClick={() => { setNewTrade(prev => ({ ...prev, symbol: sym })); setShowSymbolDropdown(false); }}
                              className={cn('w-full text-left px-3 py-2 text-sm hover:bg-zinc-700', newTrade.symbol === sym ? 'text-white bg-zinc-700' : 'text-zinc-400')}>
                              {sym}
                            </button>
                          ))}
                        </>
                      )}
                      <div className="border-t border-zinc-700 p-2">
                        <input type="text" value={symbolCustomInput} onChange={(e) => setSymbolCustomInput(e.target.value.toUpperCase())}
                          placeholder="Add custom..."
                          className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1.5 text-xs text-white placeholder-zinc-400 focus:outline-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && symbolCustomInput.trim()) {
                              setNewTrade(prev => ({ ...prev, symbol: symbolCustomInput.trim() }));
                              if (!customSymbols.includes(symbolCustomInput.trim())) setCustomSymbols(prev => [...prev, symbolCustomInput.trim()]);
                              setSymbolCustomInput('');
                              setShowSymbolDropdown(false);
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Session</label>
                <div className="relative" ref={sessionDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowSessionDropdown(!showSessionDropdown)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-zinc-600 flex items-center justify-between"
                  >
                    <span className={cn(newTrade.session ? 'text-white' : 'text-zinc-500')}>
                      {newTrade.session || 'Select...'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-zinc-400" />
                  </button>
                  {showSessionDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-30 max-h-40 overflow-y-auto">
                      {SESSION_OPTIONS.map(opt => (
                        <button
                          type="button"
                          key={opt}
                          onClick={() => { setNewTrade(prev => ({ ...prev, session: opt })); setShowSessionDropdown(false); }}
                          className={cn('w-full text-left px-3 py-2 text-sm hover:bg-zinc-700', newTrade.session === opt ? 'text-white bg-zinc-700' : 'text-zinc-400')}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Trade #</label>
                <NumericInput
                  value={newTrade.trackingNumber || ''}
                  onChange={(sanitized) => setNewTrade(prev => ({ ...prev, trackingNumber: sanitized }))}
                  onFocus={(e) => handleNumberInputFocus(e, 'trade-trackingNumber', newTrade.trackingNumber || '', false)}
                  placeholder="e.g. 14, 15, 18"
                  allowNegative={false}
                  className="focus:border-emerald-500/50"
                />
              </div>
            </div>

            {/* P&L + Risk - STRICT numeric validation */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">P&L ($)</label>
                <NumericInput
                  value={priceInputs.profitLoss}
                  onChange={(sanitized, numericValue) => {
                    setPriceInputs(prev => ({ ...prev, profitLoss: sanitized }));
                    setNewTrade(prev => ({ ...prev, profitLoss: numericValue }));
                  }}
                  onFocus={(e) => handleNumberInputFocus(e, 'trade-profitLoss', priceInputs.profitLoss, true)}
                  placeholder="0"
                  allowNegative={true}
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Risk ($)</label>
                <NumericInput
                  value={priceInputs.riskAmount}
                  onChange={(sanitized, numericValue) => {
                    setPriceInputs(prev => ({ ...prev, riskAmount: sanitized }));
                    setNewTrade(prev => ({ ...prev, riskAmount: numericValue }));
                  }}
                  onFocus={(e) => handleNumberInputFocus(e, 'trade-riskAmount', priceInputs.riskAmount, false)}
                  onBlur={() => setPriceInputs(prev => ({ ...prev, riskAmount: formatPriceInput(newTrade.riskAmount || 0) }))}
                  placeholder="0"
                  allowNegative={false}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowTradePriceLevels(v => !v)}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"
            >
              <Target className="w-3.5 h-3.5" />
              {showTradePriceLevels ? 'Hide entry / stop loss / take profit' : 'Add entry / stop loss / take profit'}
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showTradePriceLevels && 'rotate-180')} />
            </button>

            {showTradePriceLevels && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Entry</label>
                  <NumericInput
                    value={priceInputs.entryPrice}
                    onChange={(sanitized, numericValue) => {
                      setPriceInputs(prev => ({ ...prev, entryPrice: sanitized }));
                      setNewTrade(prev => ({
                        ...prev,
                        entryPrice: numericValue,
                        slPoints: calculatePoints(prev.symbol || '', numericValue, prev.stopLoss || 0),
                        tpPoints: calculatePoints(prev.symbol || '', numericValue, prev.takeProfit || 0),
                      }));
                    }}
                    onFocus={(e) => handleNumberInputFocus(e, 'trade-entryPrice', priceInputs.entryPrice, false)}
                    onBlur={() => setPriceInputs(prev => ({ ...prev, entryPrice: formatPriceInput(newTrade.entryPrice || 0) }))}
                    placeholder="0"
                    allowNegative={false}
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Stop Loss</label>
                  <NumericInput
                    value={priceInputs.stopLoss}
                    onChange={(sanitized, numericValue) => {
                      setPriceInputs(prev => ({ ...prev, stopLoss: sanitized }));
                      setNewTrade(prev => ({ ...prev, stopLoss: numericValue, slPoints: calculatePoints(prev.symbol || '', prev.entryPrice || 0, numericValue) }));
                    }}
                    onFocus={(e) => handleNumberInputFocus(e, 'trade-stopLoss', priceInputs.stopLoss, false)}
                    onBlur={() => setPriceInputs(prev => ({ ...prev, stopLoss: formatPriceInput(newTrade.stopLoss || 0) }))}
                    placeholder="0"
                    allowNegative={false}
                  />
                  {newTrade.slPoints !== undefined && newTrade.slPoints > 0 && <p className="text-[10px] text-zinc-500 mt-0.5">{newTrade.slPoints} pts</p>}
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Take Profit</label>
                  <NumericInput
                    value={priceInputs.takeProfit}
                    onChange={(sanitized, numericValue) => {
                      setPriceInputs(prev => ({ ...prev, takeProfit: sanitized }));
                      setNewTrade(prev => ({ ...prev, takeProfit: numericValue, tpPoints: calculatePoints(prev.symbol || '', prev.entryPrice || 0, numericValue) }));
                    }}
                    onFocus={(e) => handleNumberInputFocus(e, 'trade-takeProfit', priceInputs.takeProfit, false)}
                    onBlur={() => setPriceInputs(prev => ({ ...prev, takeProfit: formatPriceInput(newTrade.takeProfit || 0) }))}
                    placeholder="0"
                    allowNegative={false}
                  />
                  {newTrade.tpPoints !== undefined && newTrade.tpPoints > 0 && <p className="text-[10px] text-zinc-500 mt-0.5">{newTrade.tpPoints} pts</p>}
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">R:R Ratio</label>
                  <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-3 text-sm">
                    {calculatedRR !== null ? (
                      <span className={cn('font-medium', calculatedRR >= 1 ? 'text-emerald-400' : calculatedRR >= 0 ? 'text-zinc-400' : 'text-red-400')}>
                        {calculatedRR.toFixed(2)}R
                      </span>
                    ) : (
                      <span className="text-zinc-500">--</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Rules Adherence</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTrade(prev => ({ ...prev, rulesFollowed: 'followed' }))}
                    className={cn('flex-1 flex items-center justify-center gap-1.5 px-3 py-3 rounded-lg text-sm transition-colors',
                      newTrade.rulesFollowed === 'followed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700')}
                  >
                    <Check className="w-3.5 h-3.5" /> Followed
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTrade(prev => ({ ...prev, rulesFollowed: 'broken' }))}
                    className={cn('flex-1 flex items-center justify-center gap-1.5 px-3 py-3 rounded-lg text-sm transition-colors',
                      newTrade.rulesFollowed === 'broken' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700')}
                  >
                    <X className="w-3.5 h-3.5" /> Broken
                  </button>
                </div>
              </div>
              <MultiSelectDropdown
                label="Setup Types"
                options={setupTypes}
                selected={newTrade.setupTypes || []}
                onChange={(selected) => setNewTrade(prev => ({ ...prev, setupTypes: selected }))}
                onAddNew={(name) => setSetupTypes(prev => [...prev, { id: generateId(), name }])}
                onDeleteOption={handleDeleteSetupType}
                placeholder="Select setup types..."
              />
            </div>

            <MultiSelectDropdown
              label="Confluences"
              options={confluences}
              selected={newTrade.confluences || []}
              onChange={(selected) => setNewTrade(prev => ({ ...prev, confluences: selected }))}
              onAddNew={(name) => setConfluences(prev => [...prev, { id: generateId(), name }])}
              onDeleteOption={handleDeleteConfluence}
              placeholder="Select confluences..."
            />

            <MultiSelectDropdown
              label="Mistakes Made"
              options={mistakesList}
              selected={newTrade.mistakes || []}
              onChange={(selected) => setNewTrade(prev => ({ ...prev, mistakes: selected }))}
              onAddNew={(name) => setMistakesList(prev => [...prev, { id: generateId(), name }])}
              onDeleteOption={handleDeleteMistakeType}
              placeholder="Select mistakes..."
              colorScheme="red"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Mistakes Analysis</label>
                <textarea
                  value={newTrade.mistakesAnalysis || ''}
                  onChange={(e) => setNewTrade(prev => ({ ...prev, mistakesAnalysis: e.target.value }))}
                  placeholder="What went wrong?"
                  rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600 placeholder-zinc-600 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Lessons Learned</label>
                <textarea
                  value={newTrade.lessonsLearned || ''}
                  onChange={(e) => setNewTrade(prev => ({ ...prev, lessonsLearned: e.target.value }))}
                  placeholder="What did you learn?"
                  rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600 placeholder-zinc-600 resize-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Chart Screenshots</label>
              <p className="text-xs text-zinc-500 mb-3">Attach images for each timeframe</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {TIMEFRAMES.map(tf => {
                  const tfData = (newTrade.timeframes || []).find(t => t.name === tf) || { name: tf, images: [], notes: '' };
                  return (
                    <TimeframeChartInput
                      key={tf}
                      timeframe={tf}
                      images={tfData.images || []}
                      notes={tfData.notes || ''}
                      onAddImage={(url) => handleAddImageUrl(url, tf)}
                      onUploadImage={(file) => handleFileUpload(file, tf)}
                      onRemoveImage={(imageId) => handleRemoveImage(tf, imageId)}
                      onReorderImages={(fromIndex, toIndex) => handleReorderImages(tf, fromIndex, toIndex)}
                      onPreviewImage={(url) => setLightboxImage(url)}
                      onNotesChange={(notes) => updateTimeframeNotes(tf, notes)}
                      isExecution={tf === 'Execution/Result'}
                    />
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => { setShowEditTrade(false); setEditingTrade(null); resetTradeForm(); resetCalculator(); }}
                className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditedTrade}
                className="flex items-center gap-2 px-5 py-2 bg-white hover:bg-zinc-200 text-black rounded-lg text-sm font-medium transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </form>

          {calculatorState.show && (
            <PopupCalculator
              value={calculatorState.value}
              onChange={handleCalculatorChange}
              onClose={closeCalculator}
              onEnter={handleCalculatorEnter}
              initialPosition={calculatorState.position}
              allowNegative={calculatorState.allowNegative}
              theme={theme}
            />
          )}
        </div>
      </ModalBackdrop>
    )
  );

  // Simple modals
  const renderAddRuleModal = () => (
    showAddRule && (
      <ModalBackdrop
        onClose={closeRuleModal}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4 py-8"
      >
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white truncate">{editingRuleId ? 'Edit Trading Rule' : 'Add Trading Rule'}</h3>
            <button onClick={closeRuleModal} className="p-1 text-zinc-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Pillar</label>
              <div className="grid grid-cols-3 gap-2">
                {RULE_PILLARS.map(pillar => {
                  const meta = RULE_PILLAR_META[pillar];
                  const active = (newRule.pillar || 'risk') === pillar;
                  return (
                    <button
                      key={pillar}
                      type="button"
                      onClick={() => setNewRule(prev => ({ ...prev, pillar }))}
                      className={cn(
                        "flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg border text-xs font-medium transition-colors",
                        active ? 'bg-white text-black border-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                      )}
                    >
                      <span className="text-base leading-none">{meta.icon}</span>
                      <span className="truncate">{meta.label.replace(' Rules', '')}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">Severity</label>
              <div className="grid grid-cols-3 gap-2">
                {RULE_SEVERITIES.map(severity => {
                  const meta = RULE_SEVERITY_META[severity];
                  const active = (newRule.severity || 'warning') === severity;
                  return (
                    <button
                      key={severity}
                      type="button"
                      onClick={() => setNewRule(prev => ({ ...prev, severity }))}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border text-xs font-medium transition-colors",
                        active ? meta.badge : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                      )}
                    >
                      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", meta.dot)} />
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">Rule Title</label>
              <input type="text" value={newRule.title || ''} onChange={(e) => setNewRule(prev => ({ ...prev, title: e.target.value }))} placeholder="Never Move Stop Loss" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-zinc-600" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Lesson Learned <span className="text-zinc-600">(shown as small muted subtext)</span></label>
              <textarea value={newRule.description || ''} onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))} placeholder="Moving SL cost me a $450 loss last Friday. Wait for the retest." rows={3} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-zinc-600 resize-none" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Category <span className="text-zinc-600">(optional label)</span></label>
              <input type="text" value={newRule.category || ''} onChange={(e) => setNewRule(prev => ({ ...prev, category: e.target.value }))} placeholder="e.g. Prop Firm Rule" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-zinc-600" />
            </div>
            <button type="button" onClick={handleSaveRule} className="w-full py-2.5 bg-white hover:bg-zinc-200 text-black rounded-lg text-sm font-medium transition-colors">{editingRuleId ? 'Save Changes' : 'Add Rule'}</button>
          </div>
        </div>
      </ModalBackdrop>
    )
  );

  const renderAddNoticeModal = () => (
    showAddNotice && (
      <ModalBackdrop
        onClose={() => setShowAddNotice(false)}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4 py-8"
      >
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white truncate">Add Market Notice</h3>
            <button onClick={() => setShowAddNotice(false)} className="p-1 text-zinc-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Chart Image</label>
              <button
                type="button"
                onClick={() => noticeImageInputRef.current?.click()}
                className="w-full aspect-video rounded-lg border border-dashed border-zinc-700 hover:border-zinc-500 flex flex-col items-center justify-center gap-2 text-zinc-500 hover:text-zinc-300 transition-all overflow-hidden bg-zinc-950"
              >
                {newNotice.imageUrl ? (
                  <img src={newNotice.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <ImagePlus className="w-5 h-5" />
                    <span className="text-xs">Upload chart image</span>
                  </>
                )}
              </button>
              <input ref={noticeImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleNoticeImagePick} />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Title</label>
              <input type="text" value={newNotice.title || ''} onChange={(e) => setNewNotice(prev => ({ ...prev, title: e.target.value }))} placeholder="Market Observation" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-zinc-600" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Initial Observation (optional)</label>
              <textarea value={newNoticeNote} onChange={(e) => setNewNoticeNote(e.target.value)} placeholder="What are you noticing about this setup..." rows={3} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-zinc-600 resize-none" />
              <p className="text-xs text-zinc-600 mt-1.5">This becomes the first entry in the setup's Observation Chat Log. You can add more anytime.</p>
            </div>
            <button type="button" onClick={handleAddNotice} disabled={!newNotice.title.trim()} className="w-full py-2.5 bg-white hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed text-black rounded-lg text-sm font-medium transition-colors">Add Notice</button>
          </div>
        </div>
      </ModalBackdrop>
    )
  );

  const renderAddScenarioModal = () => (
    showAddScenario && (
      <ModalBackdrop
        onClose={() => setShowAddScenario(false)}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4 py-8"
      >
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white truncate">Add Scenario</h3>
            <button onClick={() => setShowAddScenario(false)} className="p-1 text-zinc-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Scenario</label>
              <textarea value={newScenario.scenario} onChange={(e) => setNewScenario(prev => ({ ...prev, scenario: e.target.value }))} placeholder="What happened..." rows={3} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-zinc-600 resize-none" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Tags</label>
              <input type="text" value={newScenario.tags} onChange={(e) => setNewScenario(prev => ({ ...prev, tags: e.target.value }))} placeholder="overtrade, chase, FOMO" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-zinc-600" />
              <p className="text-xs text-zinc-600 mt-1.5">Comma-separated. Each becomes a colored pill.</p>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Lesson</label>
              <textarea value={newScenario.lesson} onChange={(e) => setNewScenario(prev => ({ ...prev, lesson: e.target.value }))} placeholder="What to do differently next time..." rows={2} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-zinc-600 resize-none" />
            </div>
            <button type="button" onClick={handleAddScenario} disabled={!newScenario.scenario.trim()} className="w-full py-2.5 bg-white hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed text-black rounded-lg text-sm font-medium transition-colors">Add Scenario</button>
          </div>
        </div>
      </ModalBackdrop>
    )
  );

  const renderAddWikiModal = () => (
    showAddWiki && (
      <ModalBackdrop
        onClose={() => setShowAddWiki(false)}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4 py-8"
      >
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white truncate">Add Knowledge Entry</h3>
            <button onClick={() => setShowAddWiki(false)} className="p-1 text-zinc-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Title</label>
              <input type="text" value={newWiki.title || ''} onChange={(e) => setNewWiki(prev => ({ ...prev, title: e.target.value }))} placeholder="Order Block Concept" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-zinc-600" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Category</label>
              <input type="text" value={newWiki.category || ''} onChange={(e) => setNewWiki(prev => ({ ...prev, category: e.target.value }))} placeholder="Price Action" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-zinc-600" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Content</label>
              <textarea value={newWiki.content || ''} onChange={(e) => setNewWiki(prev => ({ ...prev, content: e.target.value }))} placeholder="Explain the concept..." rows={5} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-zinc-600 resize-none" />
            </div>
            <button type="button" onClick={handleAddWiki} className="w-full py-2.5 bg-white hover:bg-zinc-200 text-black rounded-lg text-sm font-medium transition-colors">Add Entry</button>
          </div>
        </div>
      </ModalBackdrop>
    )
  );

  // Confirm bulk delete of selected trades
  const renderDeleteSelectedConfirm = () => (
    showDeleteSelectedConfirm && (
      <ModalBackdrop
        onClose={() => setShowDeleteSelectedConfirm(false)}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
      >
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Delete trades?</h3>
          </div>
          <p className="text-sm text-zinc-400 mb-6">
            You're about to permanently delete {selectedTradeIds.length} selected trade{selectedTradeIds.length > 1 ? 's' : ''}. This cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowDeleteSelectedConfirm(false)}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDeleteSelectedTrades}
              className="px-4 py-2 bg-red-500/90 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </ModalBackdrop>
    )
  );

  // Confirm deleting a single account (and all its trades)
  const renderDeleteAccountConfirm = () => {
    if (!accountPendingDelete) return null;
    const account = accounts.find(a => a.id === accountPendingDelete);
    const tradeCount = trades.filter(t => t.accountId === accountPendingDelete).length;
    return (
      <ModalBackdrop
        onClose={() => setAccountPendingDelete(null)}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
      >
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Delete "{account?.name || 'this account'}"?</h3>
          </div>
          <p className="text-sm text-zinc-400 mb-6">
            This permanently deletes the account{tradeCount > 0 ? ` and all ${tradeCount} trade${tradeCount > 1 ? 's' : ''} logged under it` : ''}. This cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setAccountPendingDelete(null)}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDeleteAccount}
              className="px-4 py-2 bg-red-500/90 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </ModalBackdrop>
    );
  };

  // Lightbox
  const renderLightbox = () => (
    lightboxImage && (
      <ModalBackdrop
        onClose={() => setLightboxImage(null)}
        className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4"
      >
        <button onClick={() => setLightboxImage(null)} className="absolute top-4 right-4 p-2 bg-zinc-800 rounded-full text-white hover:bg-zinc-700">
          <X className="w-6 h-6" />
        </button>
        <img src={lightboxImage} alt="" className="max-w-full max-h-full object-contain rounded-lg" />
      </ModalBackdrop>
    )
  );

  return (
    <div className={cn("h-screen flex overflow-hidden transition-colors duration-300", theme === 'dark' ? 'bg-zinc-950' : 'bg-zinc-50 theme-light-fix')}>
      <style>{`
        * {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        *::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
        html, body {
          scroll-behavior: smooth;
        }
        /* Trade History (List / Preview) tables force horizontal scroll on
           narrow screens — restore a slim, themed scrollbar here so users
           actually see there's more content instead of it silently clipping. */
        .trade-table-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(161,161,170,0.45) transparent;
        }
        .trade-table-scroll::-webkit-scrollbar {
          display: block;
          height: 8px;
          width: 8px;
        }
        .trade-table-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .trade-table-scroll::-webkit-scrollbar-thumb {
          background-color: rgba(161,161,170,0.45);
          border-radius: 9999px;
        }
        .trade-table-scroll::-webkit-scrollbar-thumb:hover {
          background-color: rgba(161,161,170,0.7);
        }

        /* ---- Light theme color fixes ----
           Many panels/cards/text below were originally styled dark-only.
           These overrides remap the dark zinc palette to light-appropriate
           colors whenever the root wrapper carries .theme-light-fix. */
        .theme-light-fix [class~="bg-zinc-900"] { background-color: #ffffff !important; }
        .theme-light-fix [class~="border-zinc-800"] { border-color: #e4e4e7 !important; }
        .theme-light-fix [class~="text-zinc-300"] { color: #3f3f46 !important; }
        .theme-light-fix [class~="border-zinc-700"] { border-color: #d4d4d8 !important; }
        .theme-light-fix [class~="hover:bg-zinc-800/50"]:hover { background-color: #e4e4e7 !important; }
        .theme-light-fix [class~="text-zinc-400"] { color: #52525b !important; }
        .theme-light-fix [class~="hover:bg-zinc-700"]:hover { background-color: #e4e4e7 !important; }
        .theme-light-fix [class~="bg-zinc-800"] { background-color: #f4f4f5 !important; }
        .theme-light-fix [class~="bg-zinc-600"] { background-color: #e4e4e7 !important; }
        .theme-light-fix [class~="bg-zinc-700"] { background-color: #f4f4f5 !important; }
        .theme-light-fix [class~="hover:bg-zinc-600"]:hover { background-color: #d4d4d8 !important; }
        .theme-light-fix [class~="bg-zinc-900/50"] { background-color: #ffffff !important; }
        .theme-light-fix [class~="hover:border-zinc-700"]:hover { border-color: #a1a1aa !important; }
        .theme-light-fix [class~="border-zinc-600"] { border-color: #d4d4d8 !important; }
        .theme-light-fix [class~="hover:text-zinc-300"]:hover { color: #27272a !important; }
        .theme-light-fix [class~="bg-zinc-800/60"] { background-color: #f4f4f5 !important; }
        .theme-light-fix [class~="border-zinc-700/80"] { border-color: #d4d4d8 !important; }
        .theme-light-fix [class~="hover:bg-zinc-800"]:hover { background-color: #e4e4e7 !important; }
        .theme-light-fix [class~="hover:text-zinc-200"]:hover { color: #18181b !important; }
        .theme-light-fix [class~="bg-zinc-800/50"] { background-color: #f4f4f5 !important; }
        .theme-light-fix [class~="border-zinc-700/50"] { border-color: #d4d4d8 !important; }
        .theme-light-fix [class~="bg-zinc-700/50"] { background-color: #f4f4f5 !important; }
        .theme-light-fix [class~="border-zinc-600/50"] { border-color: #d4d4d8 !important; }
        .theme-light-fix [class~="bg-zinc-950"] { background-color: #fafafa !important; }
        .theme-light-fix [class~="bg-zinc-900/40"] { background-color: #ffffff !important; }
        .theme-light-fix [class~="hover:bg-zinc-900/70"]:hover { background-color: #fafafa !important; }
        .theme-light-fix [class~="border-zinc-800/80"] { border-color: #e4e4e7 !important; }
        .theme-light-fix [class~="from-zinc-700"] { --tw-gradient-from: #e4e4e7 !important; }
        .theme-light-fix [class~="to-zinc-800"] { --tw-gradient-to: #f4f4f5 !important; }
        .theme-light-fix [class~="from-zinc-900"] { --tw-gradient-from: #f4f4f5 !important; }
        .theme-light-fix [class~="via-zinc-900/90"] { --tw-gradient-stops: #f4f4f5 !important; }
        .theme-light-fix [class~="to-zinc-900/60"] { --tw-gradient-to: #f4f4f5 !important; }
        .theme-light-fix [class~="bg-zinc-800/30"] { background-color: #f4f4f5 !important; }
        .theme-light-fix [class~="hover:bg-zinc-800/60"]:hover { background-color: #e4e4e7 !important; }
        .theme-light-fix [class~="bg-zinc-800/40"] { background-color: #f4f4f5 !important; }
        .theme-light-fix [class~="from-zinc-900/70"] { --tw-gradient-from: #f4f4f5 !important; }
        .theme-light-fix [class~="to-zinc-900/30"] { --tw-gradient-to: #f4f4f5 !important; }
        .theme-light-fix [class~="bg-zinc-950/80"] { background-color: #fafafa !important; }
        .theme-light-fix [class~="bg-zinc-800/70"] { background-color: #f4f4f5 !important; }
        .theme-light-fix [class~="bg-zinc-800/80"] { background-color: #f4f4f5 !important; }
        .theme-light-fix [class~="from-zinc-800"] { --tw-gradient-from: #f4f4f5 !important; }
        .theme-light-fix [class~="border-zinc-800/70"] { border-color: #e4e4e7 !important; }
        .theme-light-fix [class~="border-zinc-800/60"] { border-color: #e4e4e7 !important; }
        .theme-light-fix [class~="border-zinc-700/60"] { border-color: #d4d4d8 !important; }
        .theme-light-fix [class~="border-zinc-800/50"] { border-color: #e4e4e7 !important; }
        .theme-light-fix [class~="bg-zinc-900/60"] { background-color: #ffffff !important; }
        .theme-light-fix [class~="text-white"] { color: #18181b !important; }
        .theme-light-fix [class~="hover:text-white"]:hover { color: #18181b !important; }
        .theme-light-fix [class~="border-zinc-500"] { border-color: #d4d4d8 !important; }
        .theme-light-fix [class~="hover:border-zinc-500"]:hover { border-color: #71717a !important; }
        .theme-light-fix [class~="bg-zinc-500"] { background-color: #d4d4d8 !important; }
      `}</style>

      {/* MOBILE SIDEBAR (Drawer Mode) — its own isolated tree; only ever exists in the DOM while isMobileSidebarOpen is true, and only below md. */}
      {isMobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-hidden="true"
          />
          {/* Actual Mobile Sidebar Panel */}
          <aside className={cn(
            "relative w-64 h-full flex flex-col",
            theme === 'dark' ? 'bg-zinc-900 border-r border-zinc-800' : 'bg-white border-r border-zinc-200'
          )}>
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}

      {/* DESKTOP SIDEBAR (Permanent Layout) — separate tree, entirely unaware of isMobileSidebarOpen. Always rendered at md+; width follows sidebarCollapsed only. */}
      <aside className={cn(
        "hidden md:flex md:flex-col md:h-screen md:sticky md:top-0 md:flex-shrink-0 md:overflow-hidden transition-all duration-300",
        theme === 'dark' ? 'bg-zinc-900 border-r border-zinc-800' : 'bg-white border-r border-zinc-200',
        sidebarCollapsed ? "md:w-[72px]" : "md:w-64"
      )}>
        {renderSidebarContent(false)}
      </aside>

      <main className={cn("flex-1 overflow-y-auto min-w-0 transition-colors duration-300", theme === 'dark' ? 'text-white' : 'text-zinc-900')}>
        {/* MOBILE STICKY TOP BAR: hidden at md+ where the permanent sidebar is always visible; provides the hamburger trigger on every page on mobile. */}
        <div className={cn(
          "md:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b backdrop-blur-sm",
          theme === 'dark' ? 'bg-zinc-900/95 border-zinc-800' : 'bg-white/95 border-zinc-200'
        )}>
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            aria-label="Open menu"
            className={cn(
              "p-2 -ml-2 rounded-lg transition-colors",
              theme === 'dark' ? 'text-zinc-300 hover:text-white hover:bg-zinc-800' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            )}
          >
            <PanelLeft className="w-5 h-5" />
          </button>
          <span className={cn("font-bold text-base uppercase tracking-wider", theme === 'dark' ? 'text-white' : 'text-zinc-900')}>
            VSX
          </span>
        </div>

        <div className="p-6">
          {view === 'dashboard' && renderDashboard()}
          {view === 'trades' && renderTradeHistory()}
          {view === 'discipline' && renderDisciplineTracker()}
          {view === 'playbook' && renderPlaybook()}
          {view === 'notices' && renderNotices()}
          {view === 'wiki' && renderWiki()}
          {view === 'calendar' && renderCalendar()}
        </div>
      </main>

      {renderAccountModal()}
      {renderAddTradeModal()}
      {renderEditTradeModal()}
      {renderTradeDetailModal()}
      {renderDisciplinePsychologyReviewModal()}
      {renderExpandGallery()}
      {renderAddRuleModal()}
      {renderAddNoticeModal()}
      {renderAddScenarioModal()}
      {renderAddWikiModal()}
      {renderDeleteSelectedConfirm()}
      {renderDeleteAccountConfirm()}
      {renderLightbox()}

      {isExportConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm mx-4 rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
            <div className="p-5">
              <h2 className="text-base font-semibold text-white">
                Export Journal Backup?
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                This will create a backup file of your current journal data.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-zinc-800 px-5 py-3">
              <button
                onClick={() => setIsExportConfirmOpen(false)}
                className="px-3 py-1.5 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  exportBackup();
                  setIsExportConfirmOpen(false);
                }}
                className="px-3 py-1.5 rounded-lg text-sm bg-zinc-100 text-zinc-900 hover:bg-white transition-all font-medium"
              >
                Confirm Export
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
