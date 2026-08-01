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
  Box,
  Search,
  ArrowLeft,
  Database,
  Settings,
  Scale,
  type LucideIcon,
} from 'lucide-react';

// Types
type TradingAccountType = 'CFD' | 'LIVE' | 'FUTURES' | 'DEMO';

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
  color: TagColor;
}

interface Confluence {
  id: string;
  name: string;
  color: TagColor;
}

interface Mistake {
  id: string;
  name: string;
  color: TagColor;
}

interface EmotionTag {
  id: string;
  name: string;
  color: TagColor;
}

// Notion-style tag color system — shared by Setup Types, Confluences, and
// Mistakes Made tags. Each preset pairs a subtle tinted chip style (used for
// selected badges/options) with a solid dot swatch (used in the color picker
// and dropdown checkbox).
type TagColor = 'gray' | 'blue' | 'purple' | 'green' | 'yellow' | 'orange' | 'red' | 'pink';

interface TagColorStyle {
  id: TagColor;
  label: string;
  swatch: string; // solid dot used in the color picker + active checkbox
  chip: string; // subtle tinted badge used for selected chips/options
}

const TAG_COLOR_PALETTE: TagColorStyle[] = [
  { id: 'gray', label: 'Gray', swatch: 'bg-zinc-400', chip: 'bg-[#1f202c] text-zinc-300 border border-[#303245]' },
  { id: 'blue', label: 'Blue', swatch: 'bg-blue-500', chip: 'bg-blue-950/40 text-blue-300 border border-blue-500/50' },
  { id: 'purple', label: 'Purple', swatch: 'bg-purple-500', chip: 'bg-purple-950/40 text-purple-300 border border-purple-500/50' },
  { id: 'green', label: 'Green', swatch: 'bg-emerald-500', chip: 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/50' },
  { id: 'yellow', label: 'Yellow', swatch: 'bg-yellow-500', chip: 'bg-yellow-950/40 text-yellow-300 border border-yellow-500/50' },
  { id: 'orange', label: 'Orange', swatch: 'bg-orange-500', chip: 'bg-orange-950/40 text-orange-300 border border-orange-500/50' },
  { id: 'red', label: 'Red', swatch: 'bg-rose-500', chip: 'bg-rose-950/40 text-rose-300 border border-rose-500/50' },
  { id: 'pink', label: 'Pink', swatch: 'bg-pink-500', chip: 'bg-pink-950/40 text-pink-300 border border-pink-500/50' },
];

const DEFAULT_TAG_COLOR: TagColor = 'gray';

const getTagColorStyle = (color?: string): TagColorStyle =>
  TAG_COLOR_PALETTE.find(c => c.id === color) || TAG_COLOR_PALETTE[0];

type SessionOption = 'NYC' | 'London' | 'Asia' | 'Pre-market Open';
type ViewType = 'dashboard' | 'trades' | 'discipline' | 'lifeDiscipline' | 'playbook' | 'notices' | 'wiki' | 'calendar';
type GalleryView = 'list' | 'preview' | 'gallery';
type TradeFilter = 'all' | 'profit' | 'loss' | 'breakeven';
type TradeSortField = 'date' | 'pnl' | 'symbol' | 'rr';
type SortOrder = 'asc' | 'desc';

// Timeframes with Execution/Result first
const TIMEFRAMES = ['Execution/Result', 'Daily', '4H', '1H', '30M', '15M', '5M', '1M'] as const;

const ACCOUNT_TYPES = ['Eval', 'Phase 1', 'Phase 2', 'Funded', 'Custom Challenge'] as const;
const TRADING_ACCOUNT_TYPES: TradingAccountType[] = ['CFD', 'LIVE', 'FUTURES', 'DEMO'];

const PRESET_SYMBOLS = [
  { name: 'NASDAQ (NQ)', value: 'NQ' },
  { name: 'ES (S&P 500)', value: 'ES' },
  { name: 'Gold (XAUUSD)', value: 'XAUUSD' },
];

const SESSION_OPTIONS: SessionOption[] = ['NYC', 'London', 'Asia', 'Pre-market Open'];

// ---- Life Discipline Hub: daily habit checklist config ----
// Each group renders as its own card of checkboxes. A day only counts as
// "complete" on the Challenge Progress Grid when every item across every
// group is checked for that date.
interface HabitGroupConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  items: string[];
}

const LIFE_DISCIPLINE_CHALLENGE_LENGTH = 100;

const LIFE_DISCIPLINE_HABIT_GROUPS: HabitGroupConfig[] = [
  { id: 'morning', label: 'Morning Routine', icon: Sun, items: ['Brush teeth twice a day', 'Face wash / Skincare', 'Hydrate'] },
  { id: 'night', label: 'Night Routine', icon: Moon, items: ['Night shower', 'Brush teeth', 'Moisturize'] },
  { id: 'physical', label: 'Physical & Mental Focus', icon: Activity, items: ['Gym / Workout', 'Clean eating', 'Sleep on time'] },
];

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
  critical: { label: 'Critical', dot: 'bg-rose-500', badge: 'bg-rose-500/15 text-rose-400 border border-rose-500/20' },
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
  overtrade: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
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

const normalizeNamedItem = (item: any, defaultColor: TagColor = DEFAULT_TAG_COLOR): { id: string; name: string; color: TagColor } => ({
  id: typeof item?.id === 'string' ? item.id : generateId(),
  name: normalizeStringField(item?.name),
  color: TAG_COLOR_PALETTE.some(c => c.id === item?.color) ? item.color : defaultColor,
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
  emotionsList: EmotionTag[];
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
    setupTypes: Array.isArray(data.setupTypes) ? data.setupTypes.map((item: any) => normalizeNamedItem(item, 'gray')) : [],
    confluences: Array.isArray(data.confluences) ? data.confluences.map((item: any) => normalizeNamedItem(item, 'gray')) : [],
    mistakesList: Array.isArray(data.mistakesList) ? data.mistakesList.map((item: any) => normalizeNamedItem(item, 'red')) : [],
    emotionsList: Array.isArray(data.emotionsList) && data.emotionsList.length > 0
      ? data.emotionsList.map((item: any) => normalizeNamedItem(item, 'purple'))
      : EMOTION_OPTIONS.map(name => ({ id: generateId(), name, color: 'purple' as TagColor })),
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
  const prefix = value >= 0 ? '+' : '-';
  return `${prefix}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatCurrencyAbsolute = (value: number, blur: boolean = false) => {
  if (blur) return '****';
  return `$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Compact currency for very tight spaces (e.g. mobile calendar day cells) where
// a full "+$252,303.00" simply won't fit in a ~40px cell. Abbreviates thousands/
// millions instead of truncating mid-number.
const formatCurrencyCompact = (value: number, blur: boolean = false) => {
  if (blur) return '****';
  const prefix = value >= 0 ? '+' : '-';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${prefix}$${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `${prefix}$${(abs / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}k`;
  return `${prefix}$${abs.toFixed(0)}`;
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
        theme !== 'light' ? 'bg-zinc-900 border border-zinc-700' : 'bg-white border border-zinc-200'
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
          theme !== 'light' ? 'hover:bg-zinc-800/50' : 'hover:bg-zinc-100'
        )}
      >
        <div className="flex items-center gap-2">
          <GripVertical className={cn("w-3 h-3", theme !== 'light' ? 'text-zinc-600' : 'text-zinc-400')} />
          <Calculator className={cn("w-3 h-3", theme !== 'light' ? 'text-zinc-500' : 'text-zinc-400')} />
          <span className={cn("text-xs", theme !== 'light' ? 'text-zinc-500' : 'text-zinc-400')}>Calculator</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={cn(
            "p-0.5 transition-colors rounded",
            theme !== 'light' ? 'text-zinc-500 hover:text-white hover:bg-zinc-700' : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200'
          )}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className={cn(
        "rounded-lg px-3 py-2 mb-2 text-right font-mono text-lg min-h-[40px] overflow-hidden",
        theme !== 'light' ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-900'
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
              theme !== 'light'
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
          className="h-8 bg-rose-500/20 hover:bg-rose-500/30 active:bg-rose-500/40 text-rose-500 rounded-lg font-medium transition-colors"
        >
          C
        </button>
        <button
          type="button"
          onClick={() => handleInput('backspace')}
          className={cn(
            "h-8 rounded-lg font-medium transition-colors flex items-center justify-center",
            theme !== 'light'
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
        className="relative w-full bg-zinc-800 border border-zinc-700 rounded-xl flex items-center hover:border-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors group select-none overflow-hidden"
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
            className="px-3 py-3 text-zinc-500 hover:text-rose-400 transition-colors"
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
        className="relative w-full bg-zinc-800 border border-zinc-700 rounded-xl flex items-center hover:border-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors group select-none overflow-hidden"
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
  colorScheme?: 'default' | 'red' | 'emerald' | 'rose';
  layout?: 'flex' | 'grid';
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
  layout = 'flex',
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const isGrid = layout === 'grid';

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

  const confirmDelete = () => {
    if (deleteConfirm && onDeleteOption) {
      onDeleteOption(deleteConfirm.id, deleteConfirm.name);
    }
    setDeleteConfirm(null);
  };

  const activeClasses = colorScheme === 'red'
    ? cn('bg-rose-500 text-white border-rose-500', isGrid && 'ring-1 ring-rose-400/50 shadow-[0_0_10px_-2px_rgba(239,68,68,0.6)]')
    : colorScheme === 'emerald'
      ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/80'
      : colorScheme === 'rose'
        ? 'bg-rose-950/40 text-rose-300 border border-rose-500/80'
        : cn('bg-white text-zinc-900 border-white', isGrid && 'ring-1 ring-emerald-400/50 shadow-[0_0_10px_-2px_rgba(16,185,129,0.5)]');
  const inactiveClasses = colorScheme === 'red'
    ? 'bg-zinc-800/60 text-zinc-400 border-zinc-700/80 hover:border-rose-500/50 hover:text-rose-300 hover:bg-zinc-800'
    : colorScheme === 'emerald' || colorScheme === 'rose'
      ? 'bg-[#1a1b23] text-zinc-400 border-[#232429] hover:border-gray-600 hover:text-zinc-200'
      : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/80 hover:border-zinc-500 hover:text-zinc-200 hover:bg-zinc-800';

  return (
    <div>
      <label className="block text-xs text-zinc-400 mb-2">{label}</label>
      <div className={isGrid ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2' : 'flex flex-wrap gap-2'}>
        {options.length === 0 && !onAddNew && (
          <span className="text-xs text-zinc-600 py-1.5">{placeholder}</span>
        )}
        {options.map(opt => {
          const isSelected = selected.includes(opt.name);
          return (
            <div key={opt.id} className={cn('group relative', isGrid && 'w-full')}>
              <button
                type="button"
                onClick={() => toggleItem(opt.name)}
                className={cn(
                  'text-xs font-medium border transition-all duration-150 flex items-center gap-1',
                  isGrid ? 'w-full h-9 px-3 rounded-lg justify-center' : 'px-3 py-1.5 rounded-full',
                  onDeleteOption && 'pr-6',
                  isSelected ? activeClasses : inactiveClasses
                )}
              >
                {isSelected && <Check className="w-3 h-3 shrink-0" />}
                <span>{opt.name}</span>
              </button>
              {onDeleteOption && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDeleteConfirm({ id: opt.id, name: opt.name });
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
            <div className={cn('flex items-center gap-1', isGrid && 'col-span-full sm:col-span-1')}>
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
                className={cn(
                  'bg-zinc-800 border border-zinc-600 px-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500',
                  isGrid ? 'flex-1 h-9 rounded-lg' : 'w-24 py-1.5 rounded-full'
                )}
              />
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleAddNew}
                className={cn('bg-zinc-700 hover:bg-zinc-600 text-zinc-300 hover:text-white transition-colors', isGrid ? 'h-9 w-9 rounded-lg flex items-center justify-center shrink-0' : 'p-1.5 rounded-full')}
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className={cn(
                'text-xs font-medium border border-dashed transition-all duration-150 flex items-center gap-1',
                isGrid
                  ? 'w-full h-9 px-3 rounded-lg justify-center border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-300'
                  : 'px-3 py-1.5 rounded-full border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300'
              )}
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          )
        )}
      </div>

      {deleteConfirm && (
        <ModalBackdrop
          onClose={() => setDeleteConfirm(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4"
        >
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/15 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete Tag?</h3>
            </div>
            <p className="text-sm text-zinc-400 mb-6">
              Are you sure you want to remove "{deleteConfirm.name}" from your default list? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-500/90 hover:bg-rose-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}
    </div>
  );
};

// Notion-style color palette popup — shown when the person clicks a tag's
// color dot inside a TagSelectDropdown option row. Renders as a fixed-position
// popover anchored to the dot so it always escapes the dropdown's scroll
// clipping, and closes on outside click or Escape.
interface TagColorPickerProps {
  anchorRect: DOMRect;
  currentColor: TagColor;
  onSelect: (color: TagColor) => void;
  onClose: () => void;
}

const TagColorPicker: React.FC<TagColorPickerProps> = ({ anchorRect, currentColor, onSelect, onClose }) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  useClickOutside(popoverRef, onClose, true);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Keep the popover on-screen: prefer opening below the dot, but flip
  // above if it would run off the bottom of the viewport.
  const popoverWidth = 176;
  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 768;
  const estimatedHeight = 258;
  const left = Math.min(anchorRect.left, viewportW - popoverWidth - 8);
  const top = anchorRect.bottom + 6 + estimatedHeight > viewportH
    ? Math.max(8, anchorRect.top - estimatedHeight - 6)
    : anchorRect.bottom + 6;

  return (
    <div
      ref={popoverRef}
      onClick={(e) => e.stopPropagation()}
      style={{ position: 'fixed', top, left, width: popoverWidth }}
      className="z-[100] bg-zinc-800 border border-zinc-700 rounded-lg shadow-2xl p-1.5"
    >
      <p className="px-2 pt-1 pb-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">Tag Color</p>
      <div className="flex flex-col gap-0.5">
        {TAG_COLOR_PALETTE.map(c => (
          <button
            key={c.id}
            type="button"
            onClick={() => { onSelect(c.id); onClose(); }}
            className={cn(
              'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-left transition-colors',
              c.id === currentColor ? 'bg-zinc-700 text-white' : 'text-zinc-300 hover:bg-zinc-700/70'
            )}
          >
            <span className={cn('w-3 h-3 rounded-full shrink-0', c.swatch)} />
            <span className="flex-1">{c.label}</span>
            {c.id === currentColor && <Check className="w-3.5 h-3.5 shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  );
};

// Compact multi-select dropdown for tag fields — closed state looks like the
// Symbol/Session inputs and shows selected tags as removable badges inline,
// each tinted with that tag's own saved color; open state is a checklist
// with a per-option Notion-style color dot, an "Add Custom Tag" row, and
// delete-with-confirm.
interface TagSelectDropdownProps {
  label: string;
  options: { id: string; name: string; color?: TagColor }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  onAddNew?: (name: string) => void;
  onDeleteOption?: (id: string, name: string) => void;
  onColorChange?: (id: string, color: TagColor) => void;
  placeholder?: string;
  colorScheme?: 'emerald' | 'rose';
}

const TagSelectDropdown: React.FC<TagSelectDropdownProps> = ({
  label,
  options,
  selected,
  onChange,
  onAddNew,
  onDeleteOption,
  onColorChange,
  placeholder = 'Select...',
  colorScheme = 'emerald',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [colorPickerFor, setColorPickerFor] = useState<{ id: string; rect: DOMRect } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  useClickOutside(containerRef, useCallback(() => { setIsOpen(false); setIsAdding(false); }, []), isOpen);

  useEffect(() => {
    if (isAdding) addInputRef.current?.focus();
  }, [isAdding]);

  // Legacy/fallback color when an option has no saved color yet.
  const schemeFallback: TagColor = colorScheme === 'rose' ? 'red' : 'green';

  // Look up a tag's saved color by name (selected tags are stored as plain
  // strings on the trade, so the color always comes from the live options list).
  const colorForName = (name: string): TagColor =>
    (options.find(o => o.name === name)?.color as TagColor) || schemeFallback;

  const toggleItem = (name: string) => {
    if (selected.includes(name)) {
      onChange(selected.filter(s => s !== name));
    } else {
      onChange([...selected, name]);
    }
  };

  const removeItem = (name: string, e: React.SyntheticEvent) => {
    e.stopPropagation();
    onChange(selected.filter(s => s !== name));
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

  const confirmDelete = () => {
    if (deleteConfirm && onDeleteOption) {
      onDeleteOption(deleteConfirm.id, deleteConfirm.name);
    }
    setDeleteConfirm(null);
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs text-zinc-400 mb-1.5">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(v => !v)}
        className="w-full min-h-[46px] bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600 flex items-center justify-between gap-2"
      >
        {selected.length === 0 ? (
          <span className="text-zinc-500">{placeholder}</span>
        ) : (
          <div className="flex flex-wrap gap-1.5 flex-1">
            {selected.map(name => (
              <span
                key={name}
                className={cn('inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md text-xs font-medium', getTagColorStyle(colorForName(name)).chip)}
              >
                <span className="truncate max-w-[140px]">{name}</span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => removeItem(name, e)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') removeItem(name, e); }}
                  className="hover:bg-black/20 rounded p-0.5 shrink-0"
                >
                  <X className="w-3 h-3" />
                </span>
              </span>
            ))}
          </div>
        )}
        <ChevronDown className={cn('w-4 h-4 text-zinc-400 shrink-0 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-30 max-h-60 overflow-y-auto">
          {options.length === 0 && (
            <p className="px-3 py-2.5 text-xs text-zinc-500">No options yet</p>
          )}
          {options.map(opt => {
            const isSelected = selected.includes(opt.name);
            const optColorStyle = getTagColorStyle(opt.color || schemeFallback);
            return (
              <div
                key={opt.id}
                onClick={() => toggleItem(opt.name)}
                className="group flex items-center justify-between gap-2 px-3 py-2 hover:bg-zinc-700 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 text-sm min-w-0">
                  <div className={cn(
                    'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                    isSelected ? cn(optColorStyle.swatch, 'border-transparent') : 'border-zinc-600'
                  )}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className={cn('truncate', isSelected ? 'text-white' : 'text-zinc-300')}>{opt.name}</span>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  {onColorChange && (
                    <button
                      type="button"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        setColorPickerFor(cur => (cur?.id === opt.id ? null : { id: opt.id, rect }));
                      }}
                      title="Change tag color"
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded hover:bg-zinc-600 transition-all shrink-0 flex items-center justify-center"
                    >
                      <span className={cn('w-3 h-3 rounded-full block', optColorStyle.swatch)} />
                    </button>
                  )}
                  {onDeleteOption && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleteConfirm({ id: opt.id, name: opt.name });
                      }}
                      title={`Delete "${opt.name}"`}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded hover:bg-zinc-600 text-zinc-500 hover:text-white transition-all shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {colorPickerFor && onColorChange && (
            <TagColorPicker
              anchorRect={colorPickerFor.rect}
              currentColor={(options.find(o => o.id === colorPickerFor.id)?.color as TagColor) || DEFAULT_TAG_COLOR}
              onSelect={(color) => onColorChange(colorPickerFor.id, color)}
              onClose={() => setColorPickerFor(null)}
            />
          )}

          {onAddNew && (
            <div className="border-t border-zinc-700">
              {isAdding ? (
                <div className="flex items-center gap-1.5 px-3 py-2">
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
                    placeholder="New tag name..."
                    className="flex-1 min-w-0 bg-zinc-900 border border-zinc-600 rounded-md px-2 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                  />
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleAddNew}
                    className="p-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-md text-zinc-300 hover:text-white transition-colors shrink-0"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAdding(true)}
                  className="w-full flex items-center gap-1.5 px-3 py-2.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Custom Tag
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {deleteConfirm && (
        <ModalBackdrop
          onClose={() => setDeleteConfirm(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4"
        >
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/15 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete Tag?</h3>
            </div>
            <p className="text-sm text-zinc-400 mb-6">
              Are you sure you want to remove "{deleteConfirm.name}" from your default list? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-500/90 hover:bg-rose-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}
    </div>
  );
};
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

  // All ad-hoc tag chips (Emotions, quick Mistakes, etc.) now share one
  // consistent dark-slate pill style — no more clashing per-scheme accent
  // colors (violet/red) so tags look uniform across the whole app.
  const chipClasses = 'bg-[#1f202c] text-zinc-300 border-[#303245]';

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
  // Notes are collapsed by default to keep the grid compact; if a note was
  // already written for this timeframe, start expanded so it isn't hidden.
  const [showNotes, setShowNotes] = useState(!!notes.trim());

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
    <div className="bg-zinc-800/60 rounded-xl p-3 border border-zinc-700/80">
      <div className="flex items-center justify-between gap-1 mb-2">
        <h4 title={timeframe} className={cn('text-sm font-semibold truncate min-w-0', isExecution ? 'text-white' : 'text-zinc-300')}>
          {timeframe}
        </h4>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-zinc-500 shrink-0">{images.length}</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowNotes(v => !v); }}
            className={cn(
              'flex items-center gap-1 p-1.5 rounded-lg transition-colors shrink-0',
              showNotes ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:bg-zinc-700 hover:text-white',
              notes.trim() && !showNotes && 'text-sky-400'
            )}
            title={showNotes ? 'Hide note' : 'Add note'}
          >
            <StickyNote className="w-3.5 h-3.5" />
            <ChevronDown className={cn('w-3 h-3 transition-transform', showNotes && 'rotate-180')} />
          </button>
          <div className="relative shrink-0">
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
          <div className="relative shrink-0" ref={menuRef}>
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
        <div className="flex items-center gap-2 overflow-x-auto py-1 mb-2">
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
                'relative shrink-0 h-20 w-36 rounded-lg overflow-hidden group cursor-grab active:cursor-grabbing transition-all bg-black/40 border border-white/10',
                draggedIndex === index && 'opacity-40',
                dragOverIndex === index && draggedIndex !== index && 'ring-2 ring-sky-400'
              )}
            >
              <img
                src={img.url}
                alt={timeframe}
                draggable={false}
                className="w-full h-full object-cover pointer-events-none"
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

      {showNotes && (
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Notes..."
          autoFocus
          className="w-full min-h-[80px] bg-zinc-700/50 border border-zinc-600/50 rounded-lg px-2 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 resize-y"
        />
      )}
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
  const [theme, setTheme] = useState<'light' | 'dark' | 'minecraft'>('dark');

  // Ref to the main scrollable workspace container. Used to reset scroll
  // position back to the top whenever the active page/tab changes, so
  // switching between sidebar links (e.g. Trade History -> Dashboard ->
  // Trade History) always lands the user at the top of the fresh view
  // instead of preserving the previous page's scroll offset.
  const mainScrollRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [view]);

  // Keep the actual <body> background in sync with the active theme. Without
  // this, the browser's default white background can peek through as a gap
  // (e.g. mobile browser chrome resizing viewport height) since our app
  // container is sized with h-dvh rather than covering the true document.
  useEffect(() => {
    document.body.style.backgroundColor = theme === 'light' ? '#fafafa' : theme === 'minecraft' ? '#2b2b2b' : '#0b0c0e';
  }, [theme]);
  const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Sleek Settings Modal — houses everything that used to live as loose
  // clutter at the bottom of the sidebar (theme/privacy + data backup).
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsModalTab, setSettingsModalTab] = useState<'appearance' | 'backup'>('appearance');
  // PHASE 0 (Mobile Instrumentation): tracks whether the off-canvas mobile
  // sidebar drawer is open. Fully independent from `sidebarCollapsed`, which
  // remains the desktop-only expand/collapse control.
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [galleryView, setGalleryView] = useState<GalleryView>('gallery');
  const [tradeSubView, setTradeSubView] = useState<'overview' | 'database'>('overview');
  const [dbSearch, setDbSearch] = useState('');
  const [dbAccountFilter, setDbAccountFilter] = useState<string>('all');
  const [dbSessionFilter, setDbSessionFilter] = useState<string>('all');
  const [dbOutcomeFilter, setDbOutcomeFilter] = useState<TradeFilter>('all');
  const [dbRulesFilter, setDbRulesFilter] = useState<'all' | 'followed' | 'broken'>('all');
  const [dbPage, setDbPage] = useState(0);
  const [dbViewMode, setDbViewMode] = useState<'table' | 'gallery'>('table');
  const DB_PAGE_SIZE = 25;
  const [tradeFilter, setTradeFilter] = useState<TradeFilter>('all');
  const [tradeSortField, setTradeSortField] = useState<TradeSortField>('date');
  const [tradeSortOrder, setTradeSortOrder] = useState<SortOrder>('desc');
  const viewportWidth = useViewportWidth();
  const equityChartContainerRef = useRef<HTMLDivElement>(null);
  const [equityChartWidth, setEquityChartWidth] = useState(800);
  useEffect(() => {
    const el = equityChartContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) setEquityChartWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
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
    // Previously this tried to auto-advance focus to "the next field" in the
    // form, but the next *visible* field is often in a completely different
    // section (e.g. Risk ($) -> Setup Types, once Entry/SL/TP is collapsed
    // and the file inputs are skipped), which still yanked the modal down to
    // wherever that section happened to sit. Enter on the calculator should
    // just confirm the value and close the popup in place — no focus jump,
    // no scroll, nothing. The field that was being edited simply keeps its
    // value and stays right where the user is looking.
    if (activeInputRef.current) {
      // Re-focus the field itself (no-op if it's already focused) purely so
      // the blinking cursor / focus ring stays put after the popup closes,
      // with zero scrolling.
      activeInputRef.current.focus({ preventScroll: true });
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
  const [emotionsList, setEmotionsList] = useState<EmotionTag[]>(() =>
    EMOTION_OPTIONS.map(name => ({ id: generateId(), name, color: 'purple' as TagColor }))
  );
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
  // 2-pane split-view modal opened from Rule Adherence Log items — left pane is
  // a static, read-only trade preview; right pane toggles between a read-only
  // psychology summary and the editable review form, sharing the same
  // disciplineReviewDraft state as the Pending Review "+ Review" flow above.
  const [showRuleReviewModal, setShowRuleReviewModal] = useState<string | null>(null);
  const [isEditingRuleReview, setIsEditingRuleReview] = useState(false);
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
  const [rulesAdherenceError, setRulesAdherenceError] = useState(false);

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
  const [tradePendingDelete, setTradePendingDelete] = useState<string | null>(null);

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

  // Discipline Tracker — Streak Progress Grid lookback window (30/60/90 trades)
  const [streakGridWindow, setStreakGridWindow] = useState<30 | 60 | 90>(30);

  // Discipline Tracker — Mini Discipline Calendar month, independent of the
  // main Performance Calendar's month so browsing one doesn't affect the other.
  const [disciplineCalendarMonth, setDisciplineCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // Discipline Tracker — Mini Discipline Calendar day popover: the date string
  // (YYYY-MM-DD) of the currently open day flyout, or null when closed.
  const [openDisciplineDay, setOpenDisciplineDay] = useState<string | null>(null);
  const disciplineCalendarGridRef = useRef<HTMLDivElement>(null);
  useClickOutside(disciplineCalendarGridRef, useCallback(() => setOpenDisciplineDay(null), []), openDisciplineDay !== null);

  // Discipline Tracker — Psychology & Behavioral Analytics timeframe filters.
  // The Emotions and Mistakes cards each track their own independent
  // timeframe so the user can compare e.g. "This Week" emotions against
  // "All-Time" mistakes; the section's Global Timeframe dropdown is a master
  // toggle that snaps both cards to the same value when changed.
  type DisciplineAnalyticsTimeframe = 'week' | 'month' | 'lastMonth' | '3months' | 'all';
  const [emotionsTimeframe, setEmotionsTimeframe] = useState<DisciplineAnalyticsTimeframe>('month');
  const [mistakesTimeframe, setMistakesTimeframe] = useState<DisciplineAnalyticsTimeframe>('month');
  const disciplineAnalyticsTimeframeOptions: { value: DisciplineAnalyticsTimeframe; label: string }[] = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: '3months', label: 'Last 3 Months' },
    { value: 'all', label: 'All-Time' },
  ];

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
    symbol: 'NQ',
    profitLoss: 0,
    entryPrice: 0,
    stopLoss: 0,
    takeProfit: 0,
    setupTypes: [],
    confluences: [],
    mistakes: [],
    rulesFollowed: undefined,
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
        setEmotionsList(migrated.emotionsList);
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
    const data: StoredData = { version: DATA_SCHEMA_VERSION, accounts, trades, rules, notices, noticeScenarios, wikiEntries, setupTypes, confluences, mistakesList, emotionsList, customSymbols };
    try {
      localStorage.setItem('tradingJournal', JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save data:', e);
    }
  }, [accounts, trades, rules, notices, noticeScenarios, wikiEntries, setupTypes, confluences, mistakesList, emotionsList, customSymbols]);

  // ---- Life Discipline Hub persistence ----
  // Kept in its own localStorage key, deliberately separate from the trading
  // journal's versioned schema/migration pipeline above — this is a simple,
  // self-contained habit tracker and shouldn't need to migrate alongside it.
  // Shape: { startDate: 'YYYY-MM-DD', checks: { 'YYYY-MM-DD': boolean[][] } }
  // checks[date][groupIndex][itemIndex] mirrors LIFE_DISCIPLINE_HABIT_GROUPS.
  const [lifeDisciplineStartDate, setLifeDisciplineStartDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [lifeDisciplineChecks, setLifeDisciplineChecks] = useState<Record<string, boolean[][]>>({});

  useEffect(() => {
    const stored = localStorage.getItem('lifeDisciplineData');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.startDate) setLifeDisciplineStartDate(parsed.startDate);
        if (parsed?.checks) setLifeDisciplineChecks(parsed.checks);
      } catch (e) {
        console.error('Failed to load Life Discipline Hub data:', e);
      }
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('lifeDisciplineData', JSON.stringify({ startDate: lifeDisciplineStartDate, checks: lifeDisciplineChecks }));
    } catch (e) {
      console.error('Failed to save Life Discipline Hub data:', e);
    }
  }, [lifeDisciplineStartDate, lifeDisciplineChecks]);

  // Toggle a single habit checkbox for a given date.
  const toggleLifeDisciplineItem = (dateKey: string, groupIdx: number, itemIdx: number) => {
    setLifeDisciplineChecks(prev => {
      const existing = prev[dateKey] || LIFE_DISCIPLINE_HABIT_GROUPS.map(g => g.items.map(() => false));
      const nextForDate = existing.map((group, gI) =>
        gI === groupIdx ? group.map((val, iI) => (iI === itemIdx ? !val : val)) : group
      );
      return { ...prev, [dateKey]: nextForDate };
    });
  };

  // A date "counts" as complete only once every checkbox across every group is checked.
  const isLifeDisciplineDayComplete = (dateKey: string) => {
    const dayChecks = lifeDisciplineChecks[dateKey];
    if (!dayChecks) return false;
    return LIFE_DISCIPLINE_HABIT_GROUPS.every((group, gI) =>
      group.items.every((_, iI) => dayChecks[gI]?.[iI])
    );
  };

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
    const reviewTradeId = showDisciplineReview || showRuleReviewModal;
    if (reviewTradeId) {
      const t = trades.find(tr => tr.id === reviewTradeId);
      if (t) {
        setDisciplineReviewDraft({
          emotions: t.emotions || [],
          mistakes: t.mistakes || [],
          notes: t.notes || '',
        });
      }
    }
  }, [showDisciplineReview, showRuleReviewModal]);

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
  // Account-filtered trades only, before the outcome (win/loss/breakeven) filter
  // is applied. Used by the stats bar so its WINS/LOSSES/BE counts always
  // reflect the full picture, even while one of them is actively selected as
  // a filter below.
  const accountFilteredTrades = useMemo(() => {
    if (selectedAccounts.includes('all')) return trades;
    return trades.filter(t => selectedAccounts.includes(t.accountId));
  }, [trades, selectedAccounts]);

  const filteredTrades = useMemo(() => {
    let filtered = accountFilteredTrades;
    if (tradeFilter !== 'all') {
      if (tradeFilter === 'profit') filtered = filtered.filter(t => t.profitLoss >= 10);
      else if (tradeFilter === 'loss') filtered = filtered.filter(t => t.profitLoss <= -10);
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
  }, [accountFilteredTrades, tradeFilter, tradeSortField, tradeSortOrder]);

  // Database sub-page: applies its own independent filter set on top of the
  // already account/outcome-filtered trades, then paginates the result.
  const dbFilteredTrades = useMemo(() => {
    let result = filteredTrades;
    if (dbSearch.trim()) {
      const q = dbSearch.trim().toLowerCase();
      result = result.filter(t =>
        t.symbol.toLowerCase().includes(q) ||
        (t.trackingNumber || '').toLowerCase().includes(q) ||
        String(t.absoluteTradeNumber).includes(q) ||
        (t.setupTypes || []).some(s => s.toLowerCase().includes(q)) ||
        (t.confluences || []).some(c => c.toLowerCase().includes(q)) ||
        (t.mistakes || []).some(m => m.toLowerCase().includes(q)) ||
        (t.notes || '').toLowerCase().includes(q) ||
        t.date.toLowerCase().includes(q)
      );
    }
    if (dbAccountFilter !== 'all') result = result.filter(t => t.accountId === dbAccountFilter);
    if (dbSessionFilter !== 'all') result = result.filter(t => t.session === dbSessionFilter);
    if (dbOutcomeFilter !== 'all') {
      if (dbOutcomeFilter === 'profit') result = result.filter(t => t.profitLoss > 0);
      else if (dbOutcomeFilter === 'loss') result = result.filter(t => t.profitLoss < 0);
      else result = result.filter(t => Math.abs(t.profitLoss) < 10);
    }
    if (dbRulesFilter !== 'all') result = result.filter(t => t.rulesFollowed === dbRulesFilter);
    return result;
  }, [filteredTrades, dbSearch, dbAccountFilter, dbSessionFilter, dbOutcomeFilter, dbRulesFilter]);

  const dbPageCount = Math.max(1, Math.ceil(dbFilteredTrades.length / DB_PAGE_SIZE));
  const dbPagedTrades = useMemo(() => {
    const start = dbPage * DB_PAGE_SIZE;
    return dbFilteredTrades.slice(start, start + DB_PAGE_SIZE);
  }, [dbFilteredTrades, dbPage]);

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

    // Current Rules/Discipline Streak: consecutive "Rules Followed" trades
    // counting back from the most recently logged trade, stopping the
    // instant a "Rules Broken" trade is hit.
    const chronoTrades = [...filtered].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    let disciplineStreak = 0;
    for (let i = chronoTrades.length - 1; i >= 0; i--) {
      if (chronoTrades[i].rulesFollowed === 'followed') disciplineStreak++;
      else break;
    }

    return { totalTrades: filtered.length, totalPnL, winRate, profitFactor, avgWin, avgLoss, growth, wins: wins.length, losses: losses.length, disciplineStreak };
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
    if (newTrade.rulesFollowed !== 'followed' && newTrade.rulesFollowed !== 'broken') {
      setRulesAdherenceError(true);
      return;
    }
    setRulesAdherenceError(false);
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
    setRulesAdherenceError(false);
    setEditingTrade(trade);
    setShowEditTrade(true);
  };

  const handleSaveEditedTrade = () => {
    if (!editingTrade || !newTrade.accountId || !newTrade.symbol) return;
    if (newTrade.rulesFollowed !== 'followed' && newTrade.rulesFollowed !== 'broken') {
      setRulesAdherenceError(true);
      return;
    }
    setRulesAdherenceError(false);
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
    setTradePendingDelete(id);
  };

  const confirmDeleteTrade = () => {
    if (!tradePendingDelete) return;
    const id = tradePendingDelete;
    setTrades(prev => prev.filter(t => t.id !== id));
    setSelectedTradeIds(prev => prev.filter(t => t !== id));
    setTradePendingDelete(null);
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
  // When saved from the Rule Adherence Log's split-view modal, the modal stays open and
  // the right pane just drops back to read-only mode; from the standalone review modal
  // (Pending Review's "+ Review" button), saving closes the modal as before.
  const handleSaveDisciplineReview = () => {
    const targetId = showRuleReviewModal || showDisciplineReview;
    if (!targetId) return;
    setTrades(prev => prev.map(t => t.id === targetId
      ? { ...t, emotions: disciplineReviewDraft.emotions, mistakes: disciplineReviewDraft.mistakes, notes: disciplineReviewDraft.notes }
      : t
    ));
    if (showRuleReviewModal) {
      setIsEditingRuleReview(false);
    } else {
      setShowDisciplineReview(null);
    }
  };

  // Discards any in-progress edits in the split-view modal's right pane and
  // reverts to the trade's last-saved emotions/mistakes/notes before dropping
  // back to read-only mode. The left pane (trade preview) is never touched.
  const handleCancelRuleReviewEdit = () => {
    const t = trades.find(tr => tr.id === showRuleReviewModal);
    if (t) {
      setDisciplineReviewDraft({
        emotions: t.emotions || [],
        mistakes: t.mistakes || [],
        notes: t.notes || '',
      });
    }
    setIsEditingRuleReview(false);
  };

  const closeRuleReviewModal = () => {
    setShowRuleReviewModal(null);
    setIsEditingRuleReview(false);
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
    bg: theme !== 'light' ? 'bg-zinc-900' : 'bg-white',
    bgSecondary: theme !== 'light' ? 'bg-zinc-800' : 'bg-zinc-100',
    bgTertiary: theme !== 'light' ? 'bg-zinc-950' : 'bg-zinc-50',
    bgHover: theme !== 'light' ? 'hover:bg-zinc-700' : 'hover:bg-zinc-200',
    bgCard: theme !== 'light' ? 'bg-zinc-900/40' : 'bg-white',
    bgCardHover: theme !== 'light' ? 'hover:bg-zinc-900/70' : 'hover:bg-zinc-50',
    // Border classes
    border: theme !== 'light' ? 'border-zinc-800' : 'border-zinc-200',
    borderSecondary: theme !== 'light' ? 'border-zinc-700' : 'border-zinc-300',
    borderHover: theme !== 'light' ? 'hover:border-zinc-700' : 'hover:border-zinc-300',
    // Text classes
    text: theme !== 'light' ? 'text-white' : 'text-zinc-900',
    textSecondary: theme !== 'light' ? 'text-zinc-400' : 'text-zinc-600',
    textMuted: theme !== 'light' ? 'text-zinc-500' : 'text-zinc-400',
    // Input classes
    input: theme !== 'light'
      ? 'bg-zinc-900/50 border-zinc-800 text-white focus:border-zinc-600'
      : 'bg-white border-zinc-200 text-zinc-900 focus:border-zinc-400',
    // Button secondary
    btnSecondary: theme !== 'light'
      ? 'bg-zinc-800 hover:bg-zinc-700 text-white'
      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900',
  };

  const resetTradeForm = () => {
    setNewTrade({
      symbol: 'NQ',
      profitLoss: 0,
      entryPrice: 0,
      stopLoss: 0,
      takeProfit: 0,
      setupTypes: [],
      confluences: [],
      mistakes: [],
      rulesFollowed: undefined,
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
    setRulesAdherenceError(false);
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

  // Tag color handlers — update a tag's saved color attribute; every place
  // that renders the tag (badges, chips, option rows) looks the color up
  // from setupTypes/confluences/mistakesList, so this updates it everywhere.
  const handleChangeSetupTypeColor = (id: string, color: TagColor) => {
    setSetupTypes(prev => prev.map(s => (s.id === id ? { ...s, color } : s)));
  };

  const handleChangeConfluenceColor = (id: string, color: TagColor) => {
    setConfluences(prev => prev.map(c => (c.id === id ? { ...c, color } : c)));
  };

  const handleChangeMistakeColor = (id: string, color: TagColor) => {
    setMistakesList(prev => prev.map(m => (m.id === id ? { ...m, color } : m)));
  };

  const handleDeleteEmotion = (id: string, name: string) => {
    setEmotionsList(prev => prev.filter(e => e.id !== id));
    setDisciplineReviewDraft(prev => ({ ...prev, emotions: prev.emotions.filter(e => e !== name) }));
  };

  const handleChangeEmotionColor = (id: string, color: TagColor) => {
    setEmotionsList(prev => prev.map(e => (e.id === id ? { ...e, color } : e)));
  };

  // Looks up a tag's saved color by name so every emotion/mistake badge
  // anywhere in the app (Discipline & Psychology Review modal, Rule
  // Adherence Log, Analytics Breakdown, Mini Discipline Calendar, Trade
  // Detail modal) pulls from the exact same color source — emotionsList /
  // mistakesList — instead of a hardcoded uniform badge color.
  const colorForEmotion = (name: string): TagColor =>
    (emotionsList.find(e => e.name === name)?.color as TagColor) || 'purple';
  const colorForMistake = (name: string): TagColor =>
    (mistakesList.find(m => m.name === name)?.color as TagColor) || 'red';

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
      emotionsList,
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
        setEmotionsList(migrated.emotionsList);
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
      theme !== 'light'
        ? 'bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/70'
        : 'bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
    )}>
      <div className={cn('p-2.5 rounded-xl flex-shrink-0', theme !== 'light' ? 'bg-zinc-800/60' : 'bg-zinc-100', color)}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className={cn("text-[11px] uppercase tracking-wider truncate font-medium", tc.textMuted)}>{title}</p>
        <p className={cn('text-lg font-semibold truncate tabular-nums',
          typeof value === 'string' && value.includes('+') ? 'text-emerald-500' :
          typeof value === 'string' && value.includes('-') ? 'text-rose-500' :
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
    const chartWidth = Math.max(equityChartWidth, 200);
    const isPositive = stats.totalPnL >= 0;
    const strokeColor = isPositive ? '#10b981' : '#ef4444';
    const gradientId = `equityFill-${isPositive ? 'up' : 'down'}`;

    const step = chartWidth / Math.max(equityData.length - 1, 1);
    const coords = equityData.map((val, i) => {
      const x = equityData.length === 1 ? chartWidth / 2 : i * step;
      const y = height - ((val - min) / range) * (height - 40) - 20;
      return [x, y] as const;
    });

    const linePath = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
    const areaPath = `${linePath} L ${coords[coords.length - 1][0]} ${height} L ${coords[0][0]} ${height} Z`;

    const midpoint = min + range / 2;
    const midY = height - ((midpoint - min) / range) * (height - 40) - 20;

    return (
      <div className="w-full">
        <svg viewBox={`0 0 ${chartWidth} ${height}`} width="100%" height={height} className="w-full block">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.28" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1="0" y1={midY} x2={chartWidth} y2={midY} stroke="#3f3f46" strokeWidth="1" strokeDasharray="4" vectorEffect="non-scaling-stroke" />
          <path d={areaPath} fill={`url(#${gradientId})`} />
          <path d={linePath} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          {coords.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2.5" fill={strokeColor} opacity="0.85" vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
      </div>
    );
  };

  const renderAccountTypeBadge = (account: Account) => {
    // LIVE trading accounts have no challenge "Status" (the field is hidden
    // in the Add/Edit Account form for them), so show "Live" here instead of
    // whatever the underlying `type` happens to default to.
    if (account.tradingAccountType === 'LIVE') {
      return (
        <span className="text-xs px-2 py-0.5 rounded truncate max-w-[100px] inline-block bg-blue-500/20 text-blue-400">
          Live
        </span>
      );
    }
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
      'DEMO': 'bg-zinc-500/20 text-zinc-400',
    };
    const icons: Record<string, React.ReactNode> = {
      'CFD': <Wallet className="w-3 h-3" />,
      'LIVE': <LineChart className="w-3 h-3" />,
      'FUTURES': <TrendingUp className="w-3 h-3" />,
      'DEMO': <Box className="w-3 h-3" />,
    };
    return (
      <span className={cn('text-xs px-2 py-0.5 rounded inline-flex items-center gap-1 w-fit', colors[type])}>
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
              <span className={cn('text-xs font-medium', metrics.profitProgress >= 90 ? 'text-emerald-400' : 'text-zinc-400')}>
                {privacyMode ? '****' : `${metrics.profitProgress.toFixed(1)}%`}
              </span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500 bg-emerald-500',
                  metrics.profitProgress >= 90 && 'shadow-[0_0_10px_2px_rgba(16,185,129,0.75)]'
                )}
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
            {(metrics.isLocked || metrics.isBreached) && (
              <div className="flex items-center gap-2 mb-2">
                {metrics.isLocked && (
                  <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded">Locked</span>
                )}
                {metrics.isBreached && (
                  <span className="text-[10px] px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Breached
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-zinc-500 flex items-center gap-1.5">
                <TrendingDown className="w-3 h-3 text-red-500" />
                {tradingType === 'FUTURES' ? 'Trailing Drawdown' :
                 tradingType === 'LIVE' ? 'Drawdown from Capital' : 'Drawdown Usage'}
              </span>
              <span className={cn('text-xs font-medium', metrics.drawdownProgress > 70 ? 'text-red-500' : 'text-zinc-400')}>
                {privacyMode ? '****' : `${metrics.drawdownProgress.toFixed(1)}%`}
              </span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden relative">
              <div className="absolute right-[30%] top-0 bottom-0 w-px bg-amber-500/30" />
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500 bg-red-600',
                  metrics.drawdownProgress > 70 && 'shadow-[0_0_10px_2px_rgba(239,68,68,0.8)]'
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
      <div className="flex flex-col h-full w-full justify-between px-3.5 py-4">
        {/* TOP GROUP: logo/header row + primary nav items, strictly stacked */}
        <div className="flex flex-col gap-1 w-full min-h-0">
          <div className={cn("pb-4 mb-2 border-b w-full", theme !== 'light' ? 'border-zinc-800' : 'border-zinc-200')}>
            <div className={cn("flex items-center", collapsed ? "flex-col gap-2" : "justify-between")}>
              <div className={cn("flex items-center gap-3 min-w-0", collapsed && "justify-center")}>
                <div className={cn(
                  "relative w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  theme !== 'light' ? 'bg-gradient-to-br from-zinc-800 to-zinc-900 border border-emerald-500/20' : 'bg-gradient-to-br from-zinc-100 to-zinc-200'
                )}>
                  <Activity className={cn(
                    "w-[18px] h-[18px]",
                    theme !== 'light' ? 'text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.55)]' : 'text-emerald-600'
                  )} />
                </div>
                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <h1 className={cn("font-bold text-lg uppercase tracking-wider leading-none truncate", theme !== 'light' ? 'text-white' : 'text-zinc-900')}>
                      VSX
                    </h1>
                    <p className={cn("text-[10px] font-medium uppercase tracking-widest truncate mt-0.5", theme !== 'light' ? 'text-zinc-500' : 'text-zinc-500')}>
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
                    theme !== 'light' ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
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
                    theme !== 'light' ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                  )}
                >
                  {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          <nav className="flex flex-col w-full overflow-y-auto overflow-x-hidden min-h-0">
            {[
              {
                header: 'TRADING',
                headerClassName: 'text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-3.5 mt-6 mb-2',
                items: [
                  { id: 'dashboard' as ViewType, icon: LayoutDashboard, label: 'Dashboard' },
                  { id: 'trades' as ViewType, icon: TrendingUp, label: 'Trade History' },
                  { id: 'calendar' as ViewType, icon: Calendar, label: 'Performance Calendar' },
                ],
              },
              {
                header: 'PROCESS',
                headerClassName: 'text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-3.5 mt-6 mb-2',
                items: [
                  { id: 'discipline' as ViewType, icon: Shield, label: 'Discipline Tracker' },
                  { id: 'playbook' as ViewType, icon: BookOpen, label: 'Rules Playbook' },
                  { id: 'lifeDiscipline' as ViewType, icon: Flame, label: 'Life Discipline Hub' },
                ],
              },
              {
                header: 'RESOURCES',
                headerClassName: 'text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-3.5 mt-6 mb-2',
                items: [
                  { id: 'notices' as ViewType, icon: FileText, label: 'Market Notices' },
                  { id: 'wiki' as ViewType, icon: Lightbulb, label: 'Knowledge Wiki' },
                ],
              },
            ].map(section => (
              <div key={section.header} className="flex flex-col gap-1 w-full">
                {!collapsed && (
                  <span className={section.headerClassName}>{section.header}</span>
                )}
                <div className="flex flex-col gap-1 w-full">
                  {section.items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.id !== 'trades') setTradeSubView('overview');
                        setView(item.id);
                        setIsMobileSidebarOpen(false);
                      }}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm',
                        collapsed && 'justify-center px-0',
                        view === item.id
                          ? theme !== 'light' ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-900'
                          : theme !== 'light' ? 'text-zinc-400 hover:text-white hover:bg-zinc-800/50' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                      )}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* BOTTOM GROUP: single compact settings footer row, pinned to the bottom */}
        <div
          onClick={() => {
            setIsSettingsModalOpen(true);
            setIsMobileSidebarOpen(false);
          }}
          title={collapsed ? 'Settings' : undefined}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg hover:bg-white/5 cursor-pointer mt-auto border-t border-white/5"
        >
          <Settings className={cn('w-4 h-4 flex-shrink-0', theme !== 'light' ? 'text-zinc-400' : 'text-zinc-500')} />
          {!collapsed && (
            <span className={cn('text-sm font-medium truncate', theme !== 'light' ? 'text-zinc-300' : 'text-zinc-700')}>
              Settings
            </span>
          )}
        </div>
      </div>
    );
  };

  // Sleek dark "obsidian" Settings Modal — consolidates what used to be
  // loose sidebar clutter (theme/privacy toggles + backup actions) into two
  // clean tabs.
  const renderSettingsModal = () => {
    if (!isSettingsModalOpen) return null;

    const themeLabel = theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'Minecraft';
    const nextThemeLabel = theme === 'dark' ? 'Light' : theme === 'light' ? 'Minecraft' : 'Dark';

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={() => setIsSettingsModalOpen(false)}
      >
        <div
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl max-w-lg w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                <Settings className="w-4 h-4 text-zinc-300" />
              </div>
              <h2 className="text-base font-semibold text-white">Settings</h2>
            </div>
            <button
              onClick={() => setIsSettingsModalOpen(false)}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
              aria-label="Close settings"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mb-5 p-1 rounded-xl bg-zinc-800/60 border border-zinc-800">
            <button
              onClick={() => setSettingsModalTab('appearance')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                settingsModalTab === 'appearance'
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              <Sun className="w-3.5 h-3.5" />
              Appearance & Privacy
            </button>
            <button
              onClick={() => setSettingsModalTab('backup')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                settingsModalTab === 'backup'
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              <HardDrive className="w-3.5 h-3.5" />
              Data Backup
            </button>
          </div>

          {/* TAB 1: Appearance & Privacy */}
          {settingsModalTab === 'appearance' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl bg-zinc-800/50 border border-zinc-800">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    {theme === 'dark' ? <Moon className="w-4 h-4 text-zinc-300" /> : theme === 'light' ? <Sun className="w-4 h-4 text-amber-400" /> : <Box className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">Theme</p>
                    <p className="text-xs text-zinc-500 truncate">Currently {themeLabel} — switch to {nextThemeLabel}</p>
                  </div>
                </div>
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'minecraft' : 'dark')}
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-700 text-white hover:bg-zinc-600 transition-all"
                >
                  {nextThemeLabel}
                </button>
              </div>

              <div className="flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl bg-zinc-800/50 border border-zinc-800">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    {privacyMode ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4 text-zinc-300" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">Privacy Mode</p>
                    <p className="text-xs text-zinc-500 truncate">Blur sensitive figures across the journal</p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={privacyMode}
                  onClick={() => setPrivacyMode(!privacyMode)}
                  className={cn(
                    'relative flex-shrink-0 w-10 h-6 rounded-full transition-colors',
                    privacyMode ? 'bg-amber-500' : 'bg-zinc-700'
                  )}
                >
                  <span className={cn(
                    'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                    privacyMode && 'translate-x-4'
                  )} />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Data Backup */}
          {settingsModalTab === 'backup' && (
            <div className="flex flex-col gap-3">
              <div className="px-4 py-3.5 rounded-xl bg-zinc-800/50 border border-zinc-800">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    <Download className="w-4 h-4 text-zinc-300" />
                  </div>
                  <p className="text-sm font-medium text-white">Export Journal Backup</p>
                </div>
                <p className="text-xs text-zinc-500 mb-3 leading-relaxed">
                  Download a complete snapshot of your accounts, trades, rules, and notes as a single JSON file you can store safely or move to another device.
                </p>
                <button
                  onClick={() => setIsExportConfirmOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-zinc-700 text-white hover:bg-zinc-600 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Export Backup
                </button>
              </div>

              <div className="px-4 py-3.5 rounded-xl bg-zinc-800/50 border border-zinc-800">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    <FolderSync className="w-4 h-4 text-zinc-300" />
                  </div>
                  <p className="text-sm font-medium text-white">Import & Restore Backup</p>
                </div>
                <p className="text-xs text-zinc-500 mb-3 leading-relaxed">
                  Restore your journal from a previously exported backup file. This will replace your current data, so make sure it's the file you intend to load.
                </p>
                <label className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-zinc-700 text-white hover:bg-zinc-600 transition-all cursor-pointer">
                  <FolderSync className="w-4 h-4" />
                  Choose File to Import
                  <input type="file" accept=".json,application/json" className="hidden" onChange={importBackup} />
                </label>
              </div>
            </div>
          )}
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
                theme !== 'light'
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
                theme !== 'light' ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-zinc-200'
              )}>
                <button
                  onClick={() => setSelectedAccounts(['all'])}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded text-sm truncate transition-colors',
                    selectedAccounts.includes('all')
                      ? theme !== 'light' ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-900'
                      : theme !== 'light' ? 'text-zinc-400 hover:bg-zinc-800' : 'text-zinc-600 hover:bg-zinc-100'
                  )}
                >
                  All Accounts
                </button>
                <div className={cn("my-2", theme !== 'light' ? 'border-t border-zinc-800' : 'border-t border-zinc-200')} />
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
                        ? theme !== 'light' ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-900'
                        : theme !== 'light' ? 'text-zinc-400 hover:bg-zinc-800' : 'text-zinc-600 hover:bg-zinc-100'
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
              theme !== 'light'
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
          "relative overflow-hidden border rounded-2xl p-4 sm:p-6 transition-colors duration-300 min-w-0",
          theme !== 'light'
            ? 'bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-900/60 border-zinc-800'
            : 'bg-gradient-to-br from-white via-zinc-50 to-zinc-100 border-zinc-200'
        )}>
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.06] via-transparent to-emerald-500/[0.05] pointer-events-none" />
          <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-6">
            <div className="min-w-0">
              <p className={cn("text-xs uppercase tracking-wider font-medium mb-2", tc.textMuted)}>Total Profit &amp; Loss</p>
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className={cn('text-3xl sm:text-4xl font-bold tracking-tight tabular-nums', stats.totalPnL >= 0 ? 'text-emerald-500' : 'text-rose-500')}>
                  {formatCurrency(stats.totalPnL, privacyMode)}
                </span>
                <span className={cn('flex items-center gap-1 text-sm font-medium px-2.5 py-1 rounded-lg flex-shrink-0', stats.growth >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-500')}>
                  {stats.growth >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {stats.growth >= 0 ? '+' : ''}{stats.growth.toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 flex-shrink-0">
              <div className={cn("px-3 py-2 rounded-xl min-w-[84px]", theme !== 'light' ? 'bg-zinc-800/50' : 'bg-zinc-100')}>
                <p className={cn("text-[10px] uppercase tracking-wider", tc.textMuted)}>Trades</p>
                <p className={cn("text-sm font-semibold tabular-nums", tc.text)}>{stats.totalTrades}</p>
              </div>
              <div className={cn("px-3 py-2 rounded-xl min-w-[84px]", theme !== 'light' ? 'bg-zinc-800/50' : 'bg-zinc-100')}>
                <p className={cn("text-[10px] uppercase tracking-wider", tc.textMuted)}>Win Rate</p>
                <p className={cn("text-sm font-semibold tabular-nums", tc.text)}>{stats.winRate.toFixed(1)}%</p>
              </div>
              <div className={cn("px-3 py-2 rounded-xl min-w-[84px]", theme !== 'light' ? 'bg-zinc-800/50' : 'bg-zinc-100')}>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Profit Factor</p>
                <p className="text-sm font-semibold text-white tabular-nums">{isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) : 'N/A'}</p>
              </div>
            </div>
          </div>
          <div ref={equityChartContainerRef} className="relative">
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
                'relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-l-4 bg-zinc-900/40 border-zinc-800/80 p-4 sm:px-5 sm:py-3.5 min-w-0 transition-all duration-300',
                isHealthy && 'border-l-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.12)]',
                isDanger && 'border-l-amber-500 shadow-[0_0_18px_rgba(245,158,11,0.10)]'
              )}
            >
              {/* Left: label + headline follow rate — its own flex-wrap group so the
                  percentage/label/progress-bar cluster wraps onto a second line
                  instead of overflowing into the badges on narrow screens. */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 min-w-0 w-full sm:w-auto sm:flex-1">
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
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400">
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
        {renderStatCard('Avg Loss', formatCurrency(-stats.avgLoss, privacyMode), <TrendingDown className="w-4 h-4" />, 'text-rose-400')}

        {/* Win / Loss Ratio — replaces the redundant Total Trades count with
            an actionable breakdown of wins vs. losses, dual-color coded. */}
        <div className={cn(
          "group rounded-2xl p-4 flex items-center gap-3 min-w-0 transition-all duration-200",
          theme !== 'light'
            ? 'bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/70'
            : 'bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
        )}>
          <div className={cn('p-2.5 rounded-xl flex-shrink-0', theme !== 'light' ? 'bg-zinc-800/60' : 'bg-zinc-100')}>
            <Scale className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className={cn("text-[11px] uppercase tracking-wider truncate font-medium", tc.textMuted)}>Win / Loss Ratio</p>
            <p className="text-lg font-semibold truncate tabular-nums flex items-baseline gap-1.5">
              <span>
                <span className="text-emerald-500">{stats.wins}W</span>
                <span className={cn("mx-1", tc.textMuted)}>-</span>
                <span className="text-rose-500">{stats.losses}L</span>
              </span>
              <span className={cn("text-[10px] font-normal truncate", tc.textMuted)}>
                ({stats.totalTrades} · {stats.winRate.toFixed(1)}%)
              </span>
            </p>
          </div>
        </div>

        {/* Rules Streak — replaces Win Rate (already shown in the Equity
            Chart summary badges above) with the current run of 100%
            rule-compliant trades, the more actionable discipline signal. */}
        <div className={cn(
          "group rounded-2xl p-4 flex items-center gap-3 min-w-0 transition-all duration-200",
          theme !== 'light'
            ? 'bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/70'
            : 'bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
        )}>
          <div className={cn(
            'p-2.5 rounded-xl flex-shrink-0',
            stats.disciplineStreak > 0
              ? 'bg-amber-500/10 text-amber-400'
              : theme !== 'light' ? 'bg-zinc-800/60 text-zinc-400' : 'bg-zinc-100 text-zinc-400'
          )}>
            <Flame className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className={cn("text-[11px] uppercase tracking-wider truncate font-medium", tc.textMuted)}>Rules Streak</p>
            <div className="flex items-center gap-1.5 min-w-0">
              <p className={cn('text-lg font-semibold truncate tabular-nums', tc.text)}>
                {stats.disciplineStreak} {stats.disciplineStreak === 1 ? 'Trade' : 'Trades'}
              </p>
              {stats.disciplineStreak > 0 && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              )}
            </div>
          </div>
        </div>
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
                theme !== 'light'
                  ? 'bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/70'
                  : 'bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50',
                metrics.isBreached && 'border-rose-500/30'
              )}>
                <div className={cn('absolute left-0 top-0 bottom-0 w-1', metrics.isBreached ? 'bg-rose-500' : isPositive ? 'bg-emerald-500/60' : 'bg-rose-500/60')} />
                <div className="pl-2">
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className={cn("font-semibold truncate mb-1", tc.text)}>{account.name}</h3>
                      <p className={cn("text-xs truncate", tc.textMuted)}>{account.propFirm || 'No prop firm'}</p>
                      <div className="mt-1.5">
                        {renderTradingAccountTypeBadge(account)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => {
                          setEditingAccount(account);
                          resetCalculator();
                          setShowEditAccount(account.id);
                        }}
                        className={cn("p-1 opacity-0 group-hover:opacity-100 transition-opacity", theme !== 'light' ? 'text-zinc-600 hover:text-white' : 'text-zinc-400 hover:text-zinc-900')}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(account.id)}
                        className="p-1 text-zinc-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
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
                      <span className={cn('text-sm font-semibold tabular-nums', isPositive ? 'text-emerald-500' : 'text-rose-500')}>
                        {formatCurrency(accountPnL, privacyMode)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
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
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 sm:p-6">
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
                <div className={cn('absolute left-0 top-0 bottom-0 w-0.5', isWin ? 'bg-emerald-500/60' : 'bg-rose-500/60')} />
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', isWin ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400')}>
                    {isWin ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white truncate">{trade.symbol}</p>
                    <p className="text-xs text-zinc-500 truncate">{account?.name} | {trade.setupTypes.join(', ') || 'No setup'}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className={cn('font-mono font-medium tabular-nums', isWin ? 'text-emerald-400' : 'text-rose-400')}>
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

  // ---- Notion-style Trade History ----
  // Two sub-views share the same sidebar entry (no new menu items):
  // 1. "overview" — a lightweight inline page: a 6-card featured gallery on
  //    top, then a 5-row "RECENT ENTRIES" preview with an "Open Full Database"
  //    button that swaps to the database sub-view.
  // 2. "database" — a full-width Notion-spreadsheet view with breadcrumbs, a
  //    filter bar (search / account / session / outcome / rules), a dense
  //    table of all trades, and pagination.

  const recentTrades = filteredTrades;
  const recentPreviewTrades = filteredTrades.slice(0, 10);

  const renderFeaturedCard = (trade: Trade) => {
    const account = accounts.find(a => a.id === trade.accountId);
    const coverImage = trade.executionImages[0]?.url || trade.timeframes.flatMap(tf => tf.images)[0]?.url;
    const isWin = trade.profitLoss >= 0;
    const isBreakeven = Math.abs(trade.profitLoss) < 10;
    const isSelected = selectedTradeIds.includes(trade.id);
    const outcomeCardClass = isBreakeven
      ? 'bg-zinc-800/50 group-hover:bg-zinc-800/70'
      : isWin
        ? 'bg-emerald-900 border-t-0 shadow-none group-hover:bg-emerald-800'
        : 'bg-rose-900 border-t-0 shadow-none group-hover:bg-rose-800';
    // Dynamic outcome border — same exact color as the fill so the border
    // line and the card body read as one solid color, strengthening on hover.
    const outcomeBorderClass = isBreakeven
      ? 'border-zinc-700 hover:border-zinc-500'
      : isWin
        ? 'border-emerald-800 hover:border-emerald-600'
        : 'border-rose-800 hover:border-rose-600';

    // CRITICAL: while in select mode, a click anywhere on the card (including the
    // checkbox overlay) must ONLY toggle selection — it must never open the Trade
    // Details modal. Trade Details can only open when select mode is OFF.
    const handleCardClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (tradeSelectMode) {
        toggleTradeSelected(trade.id);
        return;
      }
      setShowTradeDetail(trade.id);
    };

    const handleCheckboxClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleTradeSelected(trade.id);
    };

    return (
      <div
        key={trade.id}
        onClick={handleCardClick}
        className={cn(
          "group h-full flex flex-col border rounded-xl overflow-hidden cursor-pointer bg-[#16181e] transition-all duration-200 ease-out min-w-0 shadow-[0_10px_30px_rgba(0,0,0,0.8)]",
          tradeSelectMode
            ? isSelected
              ? 'border-indigo-400/80 ring-2 ring-indigo-400/40'
              : 'border-zinc-800/70 hover:border-zinc-600'
            : cn(outcomeBorderClass, 'hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(0,0,0,0.9)]')
        )}
      >
        <div className="aspect-video bg-zinc-800 flex items-center justify-center relative overflow-hidden flex-shrink-0">
          <span className="absolute top-2 left-2 z-10 flex items-center justify-center w-5 h-5 rounded bg-black/60 text-[10px] font-mono font-bold text-zinc-300 border border-white/10 backdrop-blur-md shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
            {getDisplayTradeNumber(trade)}
          </span>
          {tradeSelectMode && (
            <button
              type="button"
              onClick={handleCheckboxClick}
              className={cn(
                'absolute top-2 right-2 z-20 flex items-center justify-center w-5 h-5 rounded-md border transition-colors',
                isSelected ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-black/50 border-white/40 text-transparent hover:border-white/70'
              )}
              aria-label={isSelected ? 'Unselect trade' : 'Select trade'}
            >
              <Check className="w-3 h-3" />
            </button>
          )}
          {coverImage ? (
            <img src={coverImage} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-zinc-600">
              <ImageIcon className="w-7 h-7" />
              <span className="text-[10px]">No image</span>
            </div>
          )}
          {/* Badge row at the bottom of the thumbnail */}
          <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-end gap-1.5 px-2.5 py-1.5 bg-gradient-to-t from-black/80 to-transparent">
            <span className={cn('flex items-center justify-center w-4 h-4 rounded text-[9px] font-bold', trade.rulesFollowed === 'followed' ? 'bg-emerald-500 text-emerald-950' : 'bg-rose-500 text-rose-950')}>
              {trade.rulesFollowed === 'followed' ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
            </span>
          </div>
          {tradeSelectMode && isSelected && (
            <div className="absolute inset-0 bg-indigo-500/10 z-[5] pointer-events-none" />
          )}
        </div>
        <div className={cn('p-3.5 min-w-0 flex-1 flex flex-col transition-colors duration-200', outcomeCardClass)}>
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold truncate tracking-tight text-sm min-w-0 text-white">{trade.symbol}</h4>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className={cn('text-sm font-mono font-bold tracking-tight whitespace-nowrap', isBreakeven ? 'text-zinc-300' : isWin ? 'text-green-300' : 'text-red-300')}>
                {formatCurrency(trade.profitLoss, privacyMode)}
              </span>
              {trade.trackingNumber && <TrackingBadge value={trade.trackingNumber} size="sm" />}
            </div>
          </div>
          <p className="text-xs text-zinc-300 truncate mt-0.5">{account?.name}</p>
          {/* Fixed-height row so cards without a session still take up the same
              vertical space as cards that have one — keeps every card (and every
              grid row) the exact same height. */}
          <div className="flex items-center mt-2 min-h-[20px]">
            {trade.session && <SessionBadge value={trade.session} size="sm" />}
          </div>
          {/* Fixed-height footer row so cards without setup badges still match
              the height of cards that have them. */}
          <div className="flex items-center justify-between gap-2 mt-auto pt-2 min-h-[26px] min-w-0">
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
              {trade.setupTypes.slice(0, 1).map(s => (
                <span key={s} className="px-1.5 py-0.5 bg-zinc-800/80 border border-zinc-700/50 rounded text-[10px] text-zinc-300 whitespace-nowrap">{s}</span>
              ))}
            </div>
            <span className="text-[11px] text-zinc-400 font-medium whitespace-nowrap flex-shrink-0">{formatDate(trade.date)}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderOverviewView = () => (
    <div className="space-y-8 min-w-0">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="min-w-0">
          <h2 className={cn("text-2xl font-bold truncate", tc.text)}>Trade History</h2>
          <p className={cn("text-sm mt-1 font-normal truncate", tc.textMuted)}>Analyze your trade execution history</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* All Accounts — same global account filter used on the Dashboard */}
          <div className="relative" ref={accountDropdownRef}>
            <button
              onClick={() => setShowAccountDropdown(!showAccountDropdown)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                theme !== 'light'
                  ? 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                  : 'bg-zinc-100 border border-zinc-200 text-zinc-700 hover:bg-zinc-200'
              )}
            >
              <Filter className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline truncate max-w-[120px]">{selectedAccounts.includes('all') ? 'All Accounts' : `${selectedAccounts.length} Selected`}</span>
              <ChevronsUpDown className="w-4 h-4 flex-shrink-0" />
            </button>

            {showAccountDropdown && (
              <div className={cn(
                "absolute left-0 mt-2 min-w-[200px] w-64 rounded-lg shadow-xl z-50 p-2",
                theme !== 'light' ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-zinc-200'
              )}>
                <button
                  onClick={() => setSelectedAccounts(['all'])}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded text-sm truncate transition-colors',
                    selectedAccounts.includes('all')
                      ? theme !== 'light' ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-900'
                      : theme !== 'light' ? 'text-zinc-400 hover:bg-zinc-800' : 'text-zinc-600 hover:bg-zinc-100'
                  )}
                >
                  All Accounts
                </button>
                <div className={cn("my-2", theme !== 'light' ? 'border-t border-zinc-800' : 'border-t border-zinc-200')} />
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
                        ? theme !== 'light' ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-900'
                        : theme !== 'light' ? 'text-zinc-400 hover:bg-zinc-800' : 'text-zinc-600 hover:bg-zinc-100'
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
            type="button"
            onClick={toggleTradeSelectMode}
            className={cn(
              'flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm transition-colors border',
              tradeSelectMode
                ? 'bg-white text-black border-white hover:bg-zinc-200'
                : theme !== 'light'
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                  : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200'
            )}
          >
            <Check className="w-4 h-4" />
            <span className="hidden sm:inline">{tradeSelectMode ? 'Cancel' : 'Select'}</span>
          </button>
          <button onClick={() => { resetTradeForm(); resetCalculator(); setShowAddTrade(true); }} className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Trade</span>
          </button>
        </div>
      </div>

      {tradeSelectMode && (
        <div className={cn(
          'flex items-center justify-between flex-wrap gap-3 px-4 py-3 rounded-xl border sticky top-0 z-20',
          theme !== 'light' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        )}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSelectAllTrades}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                theme !== 'light' ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200'
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
            className="flex items-center gap-2 px-4 py-1.5 bg-rose-500/90 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Selected ({selectedTradeIds.length})
          </button>
        </div>
      )}

      {/* METRICS INDICATOR BAR — compact summary stats, directly above the gallery.
          WINS / LOSSES / BE are clickable and toggle `tradeFilter` to narrow the
          gallery + table below to just that outcome; clicking the active one again
          clears it back to 'all'. TOTAL is informational only, not clickable. */}
      <div className={cn(
        "flex items-center justify-between bg-zinc-900/40 border border-zinc-800/80 rounded-xl px-5 py-3 mb-4",
        theme === 'light' && 'bg-white border-zinc-200'
      )}>
        <span className="text-xs font-medium tracking-wide">
          <span className="text-zinc-500">TOTAL:</span>{' '}
          <span className={cn("font-semibold tabular-nums", tc.text)}>{accountFilteredTrades.length}</span>
        </span>
        <button
          type="button"
          onClick={() => setTradeFilter(prev => prev === 'profit' ? 'all' : 'profit')}
          className={cn(
            "text-xs font-medium tracking-wide px-2 py-1 -my-1 rounded-lg transition-colors",
            tradeFilter === 'profit' ? 'bg-emerald-500/10 ring-1 ring-emerald-500/40' : 'hover:bg-white/5'
          )}
        >
          <span className="text-zinc-500">WINS:</span>{' '}
          <span className="text-emerald-400 font-semibold tabular-nums">{accountFilteredTrades.filter(t => t.profitLoss >= 10).length}</span>
        </button>
        <button
          type="button"
          onClick={() => setTradeFilter(prev => prev === 'loss' ? 'all' : 'loss')}
          className={cn(
            "text-xs font-medium tracking-wide px-2 py-1 -my-1 rounded-lg transition-colors",
            tradeFilter === 'loss' ? 'bg-rose-500/10 ring-1 ring-rose-500/40' : 'hover:bg-white/5'
          )}
        >
          <span className="text-zinc-500">LOSSES:</span>{' '}
          <span className="text-rose-400 font-semibold tabular-nums">{accountFilteredTrades.filter(t => t.profitLoss <= -10).length}</span>
        </button>
        <button
          type="button"
          onClick={() => setTradeFilter(prev => prev === 'breakeven' ? 'all' : 'breakeven')}
          className={cn(
            "text-xs font-medium tracking-wide px-2 py-1 -my-1 rounded-lg transition-colors",
            tradeFilter === 'breakeven' ? 'bg-amber-500/10 ring-1 ring-amber-500/40' : 'hover:bg-white/5'
          )}
        >
          <span className="text-zinc-500">BE:</span>{' '}
          <span className="text-amber-400 font-semibold tabular-nums">{accountFilteredTrades.filter(t => Math.abs(t.profitLoss) < 10).length}</span>
        </button>
        <span className="text-xs font-medium tracking-wide">
          <span className="text-zinc-500">WIN RATE:</span>{' '}
          <span className={cn("font-semibold tabular-nums", tc.text)}>
            {(() => {
              const wins = accountFilteredTrades.filter(t => t.profitLoss >= 10).length;
              const losses = accountFilteredTrades.filter(t => t.profitLoss <= -10).length;
              const decided = wins + losses;
              return decided > 0 ? `${((wins / decided) * 100).toFixed(1)}%` : '—';
            })()}
          </span>
        </span>
      </div>
      {tradeFilter !== 'all' && (
        <div className="flex items-center gap-2 -mt-2 mb-4">
          <span className="text-xs text-zinc-500">
            Showing only {tradeFilter === 'profit' ? 'wins' : tradeFilter === 'loss' ? 'losses' : 'breakeven trades'}
          </span>
          <button
            type="button"
            onClick={() => setTradeFilter('all')}
            className="text-xs text-zinc-400 hover:text-white underline underline-offset-2"
          >
            Clear
          </button>
        </div>
      )}

      {/* TOP SECTION — Featured Gallery Grid (scrollable frame, all trades) */}
      {recentTrades.length > 0 && (
        <div>
          {/* Frame — matches the Discipline Tracker card tone/border exactly. The frame IS the
              scroll container: cards scroll edge-to-edge against its inner walls, no nested wrapper. */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl max-h-[520px] overflow-y-auto overscroll-contain scroll-smooth p-5 shadow-[0_20px_45px_rgba(0,0,0,0.5),inset_0_2px_12px_rgba(0,0,0,0.25)] scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {recentTrades.map(renderFeaturedCard)}
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM SECTION — Recent Entry Log Preview */}
      <div className="!mt-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Recent Entries</h3>
          <button
            type="button"
            onClick={() => setTradeSubView('database')}
            className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Expand className="w-3.5 h-3.5" />
            Open Full Database
          </button>
        </div>

        <div className={cn(
          "rounded-xl overflow-hidden",
          theme !== 'light' ? 'bg-zinc-900/40 border border-zinc-800/80' : 'bg-white border border-zinc-200'
        )}>
          {recentPreviewTrades.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead>
                  <tr className="border-b border-white/5 text-left">
                    <th className="px-3 py-2.5 text-[11px] text-zinc-500 uppercase tracking-wider font-medium">#</th>
                    <th className="px-3 py-2.5 text-[11px] text-zinc-500 uppercase tracking-wider font-medium">Date</th>
                    <th className="px-3 py-2.5 text-[11px] text-zinc-500 uppercase tracking-wider font-medium">Account</th>
                    <th className="px-3 py-2.5 text-[11px] text-zinc-500 uppercase tracking-wider font-medium">Symbol</th>
                    <th className="px-3 py-2.5 text-[11px] text-zinc-500 uppercase tracking-wider font-medium">Side</th>
                    <th className="px-3 py-2.5 text-[11px] text-zinc-500 uppercase tracking-wider font-medium">Session</th>
                    <th className="px-3 py-2.5 text-[11px] text-zinc-500 uppercase tracking-wider font-medium">Setups</th>
                    <th className="px-3 py-2.5 text-[11px] text-zinc-500 uppercase tracking-wider font-medium text-right">R-Multiple</th>
                    <th className="px-3 py-2.5 text-[11px] text-zinc-500 uppercase tracking-wider font-medium text-right">P&amp;L</th>
                    <th className="px-3 py-2.5 text-[11px] text-zinc-500 uppercase tracking-wider font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPreviewTrades.map(trade => {
                    const account = accounts.find(a => a.id === trade.accountId);
                    const isWin = trade.profitLoss >= 0;
                    const rowRR = trade.riskAmount > 0 ? trade.profitLoss / trade.riskAmount : null;
                    const side = trade.profitLoss >= 0 ? 'LONG' : 'SHORT';
                    const isRowSelected = selectedTradeIds.includes(trade.id);

                    // CRITICAL: while in select mode, clicking the row (or its checkbox)
                    // must ONLY toggle selection and must never open Trade Details.
                    const handleRowClick = (e: React.MouseEvent) => {
                      e.stopPropagation();
                      if (tradeSelectMode) {
                        toggleTradeSelected(trade.id);
                        return;
                      }
                      setShowTradeDetail(trade.id);
                    };

                    return (
                      <tr
                        key={trade.id}
                        onClick={handleRowClick}
                        className={cn(
                          "border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors",
                          tradeSelectMode && isRowSelected && "bg-indigo-500/10"
                        )}
                      >
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {tradeSelectMode && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); toggleTradeSelected(trade.id); }}
                                className={cn(
                                  'flex items-center justify-center w-4 h-4 rounded border transition-colors flex-shrink-0',
                                  isRowSelected ? 'bg-indigo-500 border-indigo-400 text-white' : 'border-zinc-600 text-transparent hover:border-zinc-400'
                                )}
                                aria-label={isRowSelected ? 'Unselect trade' : 'Select trade'}
                              >
                                <Check className="w-2.5 h-2.5" />
                              </button>
                            )}
                            <span className="inline-flex items-center justify-center min-w-[1.5rem] px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/50 text-[11px] font-mono font-semibold text-zinc-300">
                              {getDisplayTradeNumber(trade)}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-sm text-zinc-400 whitespace-nowrap">{formatDate(trade.date)}</td>
                        <td className="px-3 py-2.5 text-sm text-zinc-400 whitespace-nowrap truncate max-w-[160px]">
                          {account ? account.name : '-'}
                        </td>
                        <td className="px-3 py-2.5 text-sm text-white font-semibold truncate max-w-[100px]">{trade.symbol}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide',
                            isWin ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-500'
                          )}>
                            {side}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-zinc-500 whitespace-nowrap">
                          {trade.session ? (SESSION_SHORT_LABEL[trade.session] || trade.session.toLowerCase()) : '-'}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 flex-wrap max-w-[220px]">
                            {trade.setupTypes.length > 0 ? trade.setupTypes.slice(0, 2).map(s => (
                              <span key={s} className="px-1.5 py-0.5 bg-zinc-800/80 border border-zinc-700/50 rounded text-[10px] text-zinc-300 whitespace-nowrap">{s}</span>
                            )) : <span className="text-xs text-zinc-600">-</span>}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-xs font-medium text-right whitespace-nowrap">
                          {rowRR !== null ? (
                            <span className={cn('px-1.5 py-0.5 rounded border', rowRR >= 1 ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : rowRR >= 0 ? 'text-zinc-300 border-zinc-700 bg-zinc-800/60' : 'text-rose-500 border-rose-500/30 bg-rose-500/10')}>
                              {rowRR >= 1 ? '+' : ''}{rowRR.toFixed(2)}R
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-3 py-2.5 text-sm font-mono text-right font-bold whitespace-nowrap">
                          <span className={isWin ? 'text-emerald-400' : 'text-rose-500'}>{formatCurrency(trade.profitLoss, privacyMode)}</span>
                        </td>
                        <td className="px-3 py-2.5 text-right whitespace-nowrap">
                          {!tradeSelectMode && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); openEditTrade(trade); }}
                              className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                              title="Edit trade"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="w-14 h-14 mx-auto rounded-full bg-zinc-800 flex items-center justify-center mb-3">
                <TrendingUp className="w-7 h-7 text-zinc-600" />
              </div>
              <h3 className="text-base font-medium text-white mb-1.5">No trades yet</h3>
              <p className="text-zinc-500 mb-3 text-sm">Add your first trade to get started</p>
              <button onClick={() => { resetTradeForm(); setShowAddTrade(true); }} className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors">
                <Plus className="w-4 h-4" />
                Add Trade
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderDatabaseView = () => {
    const activeDbFilterCount =
      (dbSearch.trim() ? 1 : 0) +
      (dbAccountFilter !== 'all' ? 1 : 0) +
      (dbSessionFilter !== 'all' ? 1 : 0) +
      (dbOutcomeFilter !== 'all' ? 1 : 0) +
      (dbRulesFilter !== 'all' ? 1 : 0);

    const resetDbFilters = () => {
      setDbSearch('');
      setDbAccountFilter('all');
      setDbSessionFilter('all');
      setDbOutcomeFilter('all');
      setDbRulesFilter('all');
      setDbPage(0);
    };

    return (
      <div className="space-y-5 min-w-0">
        {/* Breadcrumbs + back button */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-sm min-w-0">
            <button
              type="button"
              onClick={() => setTradeSubView('overview')}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 hover:text-white transition-all text-xs font-medium cursor-pointer flex-shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back to Overview</span>
            </button>
            <span className="text-zinc-700">/</span>
            <span className="text-white font-medium truncate">All Trades Database</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* All Accounts — same global account filter used on the Dashboard,
                exposed here too since it already drives dbFilteredTrades via
                filteredTrades -> accountFilteredTrades. */}
            <div className="relative" ref={accountDropdownRef}>
              <button
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700"
              >
                <Filter className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline truncate max-w-[120px]">{selectedAccounts.includes('all') ? 'All Accounts' : `${selectedAccounts.length} Selected`}</span>
                <ChevronsUpDown className="w-4 h-4 flex-shrink-0" />
              </button>

              {showAccountDropdown && (
                <div className="absolute right-0 sm:left-0 mt-2 min-w-[200px] w-64 rounded-lg shadow-xl z-50 p-2 bg-zinc-900 border border-zinc-800">
                  <button
                    onClick={() => setSelectedAccounts(['all'])}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded text-sm truncate transition-colors',
                      selectedAccounts.includes('all') ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800'
                    )}
                  >
                    All Accounts
                  </button>
                  <div className="my-2 border-t border-zinc-800" />
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
                        selectedAccounts.includes(acc.id) ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800'
                      )}
                    >
                      <span className="truncate flex-1 mr-2">{acc.name}</span>
                      {renderAccountTypeBadge(acc)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Table / Gallery view toggle */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-zinc-800 border border-zinc-700 flex-shrink-0">
              <button
                type="button"
                onClick={() => setDbViewMode('table')}
                title="Table view"
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-md transition-colors',
                  dbViewMode === 'table' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
                )}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setDbViewMode('gallery')}
                title="Gallery view"
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-md transition-colors',
                  dbViewMode === 'gallery' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <button onClick={() => { resetTradeForm(); resetCalculator(); setShowAddTrade(true); }} className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors flex-shrink-0">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Trade</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 flex-wrap p-3 bg-zinc-900/40 border border-zinc-800/80 rounded-xl">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={dbSearch}
              onChange={(e) => { setDbSearch(e.target.value); setDbPage(0); }}
              placeholder="Search trades..."
              className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>
          <select
            value={dbAccountFilter}
            onChange={(e) => { setDbAccountFilter(e.target.value); setDbPage(0); }}
            className="px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-indigo-500/50 transition-colors cursor-pointer"
          >
            <option value="all">All Accounts</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <select
            value={dbSessionFilter}
            onChange={(e) => { setDbSessionFilter(e.target.value); setDbPage(0); }}
            className="px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-indigo-500/50 transition-colors cursor-pointer"
          >
            <option value="all">All Sessions</option>
            {SESSION_OPTIONS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={dbOutcomeFilter}
            onChange={(e) => { setDbOutcomeFilter(e.target.value as TradeFilter); setDbPage(0); }}
            className="px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-indigo-500/50 transition-colors cursor-pointer"
          >
            <option value="all">All Outcomes</option>
            <option value="profit">Profit</option>
            <option value="loss">Loss</option>
            <option value="breakeven">Breakeven</option>
          </select>
          <select
            value={dbRulesFilter}
            onChange={(e) => { setDbRulesFilter(e.target.value as 'all' | 'followed' | 'broken'); setDbPage(0); }}
            className="px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-indigo-500/50 transition-colors cursor-pointer"
          >
            <option value="all">All Rules</option>
            <option value="followed">Rules Followed</option>
            <option value="broken">Rules Broken</option>
          </select>
          {activeDbFilterCount > 0 && (
            <button
              type="button"
              onClick={resetDbFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-zinc-400 hover:text-white transition-colors flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              Clear ({activeDbFilterCount})
            </button>
          )}
        </div>

        {/* Result count */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-zinc-500">
            {dbFilteredTrades.length} {dbFilteredTrades.length === 1 ? 'trade' : 'trades'}
          </p>
        </div>

        {/* Full-page table / gallery */}
        {dbPagedTrades.length > 0 ? (
          dbViewMode === 'gallery' ? (
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {dbPagedTrades.map(trade => renderFeaturedCard(trade))}
              </div>

              {/* Pagination */}
              {dbPageCount > 1 && (
                <div className="flex items-center justify-between px-1 pt-4 mt-4 border-t border-white/10 flex-wrap gap-2">
                  <p className="text-xs text-zinc-500">
                    Page {dbPage + 1} of {dbPageCount} · {dbFilteredTrades.length} total
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDbPage(p => Math.max(0, p - 1))}
                      disabled={dbPage === 0}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Prev
                    </button>
                    <span className="text-xs text-zinc-500 px-2">{dbPage + 1} / {dbPageCount}</span>
                    <button
                      type="button"
                      onClick={() => setDbPage(p => Math.min(dbPageCount - 1, p + 1))}
                      disabled={dbPage >= dbPageCount - 1}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead>
                  <tr className="border-b border-zinc-800/70 text-left bg-white/[0.02]">
                    <th className="px-3 py-2.5 text-[11px] text-zinc-500 uppercase tracking-wider font-medium">Outcome</th>
                    <th className="px-3 py-2.5 text-[11px] text-zinc-500 uppercase tracking-wider font-medium">Date</th>
                    <th className="px-3 py-2.5 text-[11px] text-zinc-500 uppercase tracking-wider font-medium">Trade #</th>
                    <th className="px-3 py-2.5 text-[11px] text-zinc-500 uppercase tracking-wider font-medium">Session</th>
                    <th className="px-3 py-2.5 text-[11px] text-zinc-500 uppercase tracking-wider font-medium">Position</th>
                    <th className="px-3 py-2.5 text-[11px] text-zinc-500 uppercase tracking-wider font-medium text-right">Net P&L</th>
                    <th className="px-3 py-2.5 text-[11px] text-zinc-500 uppercase tracking-wider font-medium text-right">R Multiple</th>
                    <th className="px-3 py-2.5 text-[11px] text-zinc-500 uppercase tracking-wider font-medium text-right">Risk ($)</th>
                    <th className="px-3 py-2.5 text-[11px] text-zinc-500 uppercase tracking-wider font-medium">Symbol</th>
                    <th className="px-3 py-2.5 text-[11px] text-zinc-500 uppercase tracking-wider font-medium">Strategy</th>
                    <th className="px-3 py-2.5 text-[11px] text-zinc-500 uppercase tracking-wider font-medium">Account</th>
                  </tr>
                </thead>
                <tbody>
                  {dbPagedTrades.map(trade => {
                    const account = accounts.find(a => a.id === trade.accountId);
                    const isWin = trade.profitLoss >= 0;
                    const isBreakeven = Math.abs(trade.profitLoss) < 10;
                    const rowRR = trade.riskAmount > 0 ? trade.profitLoss / trade.riskAmount : null;
                    const position = trade.profitLoss >= 0 ? 'Long' : 'Short';
                    return (
                      <tr
                        key={trade.id}
                        onClick={() => setShowTradeDetail(trade.id)}
                        className="border-b border-zinc-800/70 hover:bg-white/[0.02] cursor-pointer transition-colors"
                      >
                        <td className="px-3 py-2.5">
                          <span className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide',
                            isBreakeven ? 'bg-zinc-700/40 text-zinc-300' : isWin ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/10 text-rose-500'
                          )}>
                            {isBreakeven ? 'B/E' : isWin ? 'Win' : 'Loss'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-sm text-zinc-400 whitespace-nowrap">{formatDate(trade.date)}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-sm text-zinc-500 font-mono flex-shrink-0">{getDisplayTradeNumber(trade)}</span>
                            {trade.trackingNumber && <TrackingBadge value={trade.trackingNumber} size="sm" />}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-sm text-zinc-400">
                          {trade.session ? (SESSION_SHORT_LABEL[trade.session] || trade.session.toLowerCase()) : '-'}
                        </td>
                        <td className="px-3 py-2.5 text-sm text-zinc-400">{position}</td>
                        <td className="px-3 py-2.5 text-sm font-mono text-right font-bold whitespace-nowrap">
                          <span className={isWin ? 'text-emerald-400' : 'text-rose-500'}>{formatCurrency(trade.profitLoss, privacyMode)}</span>
                        </td>
                        <td className="px-3 py-2.5 text-xs font-medium text-right whitespace-nowrap">
                          {rowRR !== null ? (
                            <span className={cn('px-1.5 py-0.5 rounded border', rowRR >= 1 ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : rowRR >= 0 ? 'text-zinc-300 border-zinc-700 bg-zinc-800/60' : 'text-rose-500 border-rose-500/30 bg-rose-500/10')}>
                              {rowRR >= 1 ? '+' : ''}{rowRR.toFixed(2)}R
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-3 py-2.5 text-sm text-zinc-400 text-right whitespace-nowrap">
                          {trade.riskAmount > 0 ? formatCurrencyAbsolute(trade.riskAmount, privacyMode) : '-'}
                        </td>
                        <td className="px-3 py-2.5 text-sm text-white font-semibold truncate max-w-[100px]">{trade.symbol}</td>
                        <td className="px-3 py-2.5 text-sm text-zinc-400 truncate max-w-[120px]">{trade.setupTypes.join(', ') || '-'}</td>
                        <td className="px-3 py-2.5 text-sm text-zinc-400 truncate max-w-[120px]">{account?.name || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {dbPageCount > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 flex-wrap gap-2">
                <p className="text-xs text-zinc-500">
                  Page {dbPage + 1} of {dbPageCount} · {dbFilteredTrades.length} total
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDbPage(p => Math.max(0, p - 1))}
                    disabled={dbPage === 0}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Prev
                  </button>
                  <span className="text-xs text-zinc-500 px-2">{dbPage + 1} / {dbPageCount}</span>
                  <button
                    type="button"
                    onClick={() => setDbPage(p => Math.min(dbPageCount - 1, p + 1))}
                    disabled={dbPage >= dbPageCount - 1}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
          )
        ) : (
          <div className="text-center py-12 bg-zinc-900/40 border border-zinc-800/80 rounded-xl">
            <div className="w-14 h-14 mx-auto rounded-full bg-zinc-800 flex items-center justify-center mb-3">
              <Database className="w-7 h-7 text-zinc-600" />
            </div>
            <h3 className="text-base font-medium text-white mb-1.5">No trades match your filters</h3>
            <p className="text-zinc-500 mb-3 text-sm">Try adjusting or clearing your filters</p>
            <button onClick={resetDbFilters} className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors">
              Clear Filters
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderTradeHistory = () => (
    <div className="space-y-6 min-w-0">
      {tradeSubView === 'overview' ? renderOverviewView() : renderDatabaseView()}
    </div>
  );

  // ---- Life Discipline Hub ----
  // A separate, self-contained daily-habit checklist + N-day challenge grid.
  // Intentionally decoupled from the trading journal's trade/rule data.
  const renderLifeDisciplineHub = () => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const todayChecks = lifeDisciplineChecks[todayKey] || LIFE_DISCIPLINE_HABIT_GROUPS.map(g => g.items.map(() => false));

    const totalItems = LIFE_DISCIPLINE_HABIT_GROUPS.reduce((sum, g) => sum + g.items.length, 0);
    const checkedItems = todayChecks.reduce((sum, group) => sum + group.filter(Boolean).length, 0);
    const todayComplete = checkedItems === totalItems;

    // Build the Day 1..N grid against the stored challenge start date.
    const start = new Date(lifeDisciplineStartDate + 'T00:00:00');
    const today = new Date(todayKey + 'T00:00:00');
    const gridDays = Array.from({ length: LIFE_DISCIPLINE_CHALLENGE_LENGTH }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateKey = d.toISOString().slice(0, 10);
      const isFuture = d.getTime() > today.getTime();
      const isToday = d.getTime() === today.getTime();
      const complete = isLifeDisciplineDayComplete(dateKey);
      let status: 'upcoming' | 'complete' | 'failed' | 'pending';
      if (isFuture) status = 'upcoming';
      else if (complete) status = 'complete';
      else if (isToday) status = 'pending';
      else status = 'failed';
      return { day: i + 1, dateKey, status };
    });

    const completedCount = gridDays.filter(d => d.status === 'complete').length;
    const failedCount = gridDays.filter(d => d.status === 'failed').length;

    const statusStyles: Record<string, string> = {
      complete: 'bg-emerald-500 border-emerald-400 text-white',
      failed: 'bg-rose-500/90 border-rose-400 text-white',
      pending: 'bg-amber-500/20 border-amber-500/50 text-amber-300',
      upcoming: theme !== 'light' ? 'bg-zinc-800/50 border-zinc-800 text-zinc-600' : 'bg-zinc-100 border-zinc-200 text-zinc-400',
    };

    return (
      <div className="space-y-4 min-w-0">
        {/* PAGE HEADER */}
        <div>
          <h2 className="text-2xl font-bold text-white truncate flex items-center gap-2">
            <Flame className="w-6 h-6 text-amber-400 flex-shrink-0" />
            Life Discipline Hub
          </h2>
          <p className="text-zinc-500 text-sm truncate">Tracking daily execution, one habit at a time</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderStatCard('Today\'s Progress', `${checkedItems}/${totalItems}`, <CheckCircle2 className="w-4 h-4" />, todayComplete ? 'text-emerald-400' : 'text-amber-400')}
          {renderStatCard('Days Completed', completedCount, <Flame className="w-4 h-4" />, 'text-emerald-400')}
          {renderStatCard('Days Failed', failedCount, <XCircle className="w-4 h-4" />, 'text-rose-400')}
        </div>

        {/* DAILY CHECKLIST SECTION */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 min-w-0">
          <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-zinc-400 flex-shrink-0" />
            <span className="truncate">Daily Checklist — {formatDate(todayKey)}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {LIFE_DISCIPLINE_HABIT_GROUPS.map((group, gI) => {
              const groupChecks = todayChecks[gI] || group.items.map(() => false);
              const groupComplete = groupChecks.every(Boolean);
              const GroupIcon = group.icon;
              return (
                <div
                  key={group.id}
                  className={cn(
                    'rounded-xl border p-4 transition-colors',
                    groupComplete ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-zinc-800/30 border-zinc-800/70'
                  )}
                >
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-zinc-800/60">
                    <GroupIcon className={cn('w-4 h-4 flex-shrink-0', groupComplete ? 'text-emerald-400' : 'text-zinc-400')} />
                    <span className="text-sm font-semibold text-white truncate">{group.label}</span>
                    {groupComplete && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 ml-auto" />}
                  </div>
                  <div className="space-y-2">
                    {group.items.map((item, iI) => {
                      const checked = !!groupChecks[iI];
                      return (
                        <label
                          key={iI}
                          className="flex items-center gap-2.5 cursor-pointer group select-none"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleLifeDisciplineItem(todayKey, gI, iI)}
                            className="sr-only peer"
                          />
                          <span
                            className={cn(
                              'w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors',
                              checked ? 'bg-emerald-500 border-emerald-400' : 'border-zinc-600 group-hover:border-zinc-400'
                            )}
                          >
                            {checked && <Check className="w-3.5 h-3.5 text-white" />}
                          </span>
                          <span className={cn('text-sm transition-colors', checked ? 'text-zinc-300 line-through decoration-zinc-600' : 'text-zinc-300')}>
                            {item}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DYNAMIC CHALLENGE PROGRESS GRID */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 min-w-0">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              <span className="truncate">{LIFE_DISCIPLINE_CHALLENGE_LENGTH}-Day Challenge Progress</span>
            </h3>
            <div className="flex items-center gap-3 text-xs text-zinc-400 flex-wrap">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Complete</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500/90" /> Failed</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500/20 border border-amber-500/50" /> Today</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-zinc-800 border border-zinc-700" /> Upcoming</span>
            </div>
          </div>

          <div className="grid grid-cols-10 sm:grid-cols-10 md:grid-cols-[repeat(20,minmax(0,1fr))] gap-1.5">
            {gridDays.map(({ day, status }) => (
              <div
                key={day}
                title={`Day ${day}`}
                className={cn(
                  'aspect-square rounded-md border flex items-center justify-center text-[10px] font-mono font-medium transition-colors',
                  statusStyles[status]
                )}
              >
                {day}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDisciplineTracker = () => {
    const followedTrades = filteredTrades.filter(t => t.rulesFollowed === 'followed');
    const brokenTrades = filteredTrades.filter(t => t.rulesFollowed === 'broken');

    // Psychology analytics: for each Emotion tag logged within the selected
    // timeframe, tally how often it shows up, the aggregate P&L tied to
    // trades carrying that tag (the "financial damage/gain" of that state of
    // mind), and the win rate of trades tagged with it. Mistakes get the same
    // P&L-impact treatment, filtered by its own independent timeframe.
    // "This Month" and "Last Month" are true calendar-month boundaries (not a
    // rolling 30-day window), so on the 1st of the month "This Month" only
    // shows that day's trades instead of still pulling in the prior month.
    const filterTradesByTimeframe = (trades: Trade[], timeframe: DisciplineAnalyticsTimeframe): Trade[] => {
      if (timeframe === 'all') return trades;
      const now = new Date();
      if (timeframe === 'week') {
        const cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() - 7);
        return trades.filter(t => new Date(t.date) >= cutoff);
      }
      if (timeframe === 'month') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return trades.filter(t => new Date(t.date) >= monthStart);
      }
      if (timeframe === 'lastMonth') {
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return trades.filter(t => {
          const d = new Date(t.date);
          return d >= lastMonthStart && d < thisMonthStart;
        });
      }
      // 3months: rolling 90-day-ish window (3 calendar months back from today)
      const cutoff = new Date(now);
      cutoff.setMonth(cutoff.getMonth() - 3);
      return trades.filter(t => new Date(t.date) >= cutoff);
    };
    const emotionsTimeframeTrades = filterTradesByTimeframe(filteredTrades, emotionsTimeframe);
    const mistakesTimeframeTrades = filterTradesByTimeframe(filteredTrades, mistakesTimeframe);

    const emotionStatsMap: Record<string, { count: number; pnl: number; wins: number }> = {};
    emotionsTimeframeTrades.forEach(t => (t.emotions || []).forEach(e => {
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
    mistakesTimeframeTrades.forEach(t => (t.mistakes || []).forEach(m => {
      if (!mistakeStatsMap[m]) mistakeStatsMap[m] = { count: 0, pnl: 0 };
      mistakeStatsMap[m].count += 1;
      mistakeStatsMap[m].pnl += t.profitLoss;
    }));
    const topMistakes = Object.entries(mistakeStatsMap)
      .map(([mistake, s]) => ({ mistake, count: s.count, pnl: s.pnl }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
    const maxMistakeCount = topMistakes[0]?.count || 1;

    // Global Timeframe dropdown counts as "active" (i.e. reflects both cards)
    // only when the two cards already agree — the moment either card is
    // changed independently, the master dropdown just shows its own value
    // without silently overriding the other card.
    const globalAnalyticsTimeframe = emotionsTimeframe === mistakesTimeframe ? emotionsTimeframe : null;
    const setGlobalAnalyticsTimeframe = (tf: DisciplineAnalyticsTimeframe) => {
      setEmotionsTimeframe(tf);
      setMistakesTimeframe(tf);
    };

    // Trades Needing Review — recent trades with no emotion or mistake tags
    // logged yet, newest first, so the discipline queue surfaces what's left
    // to tag before it gets buried in history.
    const pendingReviewTrades = [...filteredTrades]
      .filter(t => (!t.emotions || t.emotions.length === 0) && (!t.mistakes || t.mistakes.length === 0))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);

    // Current Discipline Streak — based on actual TRADING DAYS, not individual
    // trades, so a rest day (weekend, no trades logged) never breaks the chain.
    // A trading day only counts as "Compliant" when every trade logged that
    // date followed the rules; one broken-rule trade makes the whole day break
    // the streak. Days are ordered chronologically by calendar date, and only
    // dates with at least one logged trade are considered "trading days" —
    // gaps between them (weekends, days off) are simply skipped over.
    const tradingDaysMap: Record<string, Trade[]> = {};
    filteredTrades.forEach(t => {
      (tradingDaysMap[t.date] = tradingDaysMap[t.date] || []).push(t);
    });
    const tradingDayCompliance = Object.entries(tradingDaysMap)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([date, dayTrades]) => ({
        date,
        compliant: dayTrades.every(t => t.rulesFollowed === 'followed'),
      }));

    let disciplineStreak = 0;
    for (let i = tradingDayCompliance.length - 1; i >= 0; i--) {
      if (tradingDayCompliance[i].compliant) disciplineStreak++;
      else break;
    }

    // Best Streak: the longest run of consecutive compliant trading days
    // anywhere in the filtered history, not just the current active run.
    let bestStreak = 0;
    {
      let run = 0;
      tradingDayCompliance.forEach(d => {
        if (d.compliant) {
          run++;
          bestStreak = Math.max(bestStreak, run);
        } else {
          run = 0;
        }
      });
    }
    const totalCompliantDays = tradingDayCompliance.filter(d => d.compliant).length;

    // Streak Progress — milestone tier the current streak of compliant
    // trading days has unlocked, shown in the card's bottom stats footer.
    const streakTiers: Array<{ days: number; label: string }> = [
      { days: 7, label: 'Novice' },
      { days: 30, label: 'Consistent' },
      { days: 60, label: 'Master' },
      { days: 90, label: 'Elite Fund Manager' },
    ];
    const activeStreakTier = [...streakTiers].reverse().find(t => disciplineStreak >= t.days);

    // Streak Progress pill grid — column count and gap scale with the selected
    // window so 30/60/90 each lay out as a clean, evenly-divided grid (3, 5,
    // and 6 full rows respectively) that stretches to fill the card with no
    // leftover empty space and no overflow.
    const streakPillGridConfig: Record<30 | 60 | 90, { cols: number; gap: string }> = {
      30: { cols: 10, gap: 'gap-2' },
      60: { cols: 12, gap: 'gap-1.5' },
      90: { cols: 15, gap: 'gap-1' },
    };
    const { cols: streakPillCols, gap: streakPillGap } = streakPillGridConfig[streakGridWindow];
    const streakPillRows = Math.ceil(streakGridWindow / streakPillCols);

    // Mini Discipline Calendar — its own month browser (independent of the
    // Performance Calendar page), laid out Monday-first. Each day cell reflects
    // whether every trade logged that day followed the rules, any trade broke a
    // rule, or nothing was logged at all.
    const miniMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const { year: miniYear, month: miniMonth } = disciplineCalendarMonth;
    const miniFirstDayJs = new Date(miniYear, miniMonth, 1).getDay(); // 0 = Sun
    const miniFirstDay = (miniFirstDayJs + 6) % 7; // 0 = Mon ... 6 = Sun
    const miniDaysInMonth = new Date(miniYear, miniMonth + 1, 0).getDate();
    const miniCalendarDays: Array<{ day: number | null; date: string | null; trades: Trade[] }> = [];
    for (let i = 0; i < miniFirstDay; i++) miniCalendarDays.push({ day: null, date: null, trades: [] });
    for (let d = 1; d <= miniDaysInMonth; d++) {
      const dateStr = `${miniYear}-${String(miniMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      miniCalendarDays.push({ day: d, date: dateStr, trades: filteredTrades.filter(t => t.date === dateStr) });
    }

    // Win Rate on Compliant Days — the win rate of trades logged on days where
    // every single trade that day followed the rules (a "clean" day), across
    // all filtered history (not limited to the mini-calendar's visible month).
    const tradesByDate: Record<string, Trade[]> = {};
    filteredTrades.forEach(t => {
      (tradesByDate[t.date] = tradesByDate[t.date] || []).push(t);
    });
    const compliantDayTrades: Trade[] = Object.values(tradesByDate)
      .filter(dayTrades => dayTrades.every(t => t.rulesFollowed === 'followed'))
      .flat();
    const compliantDayWinRate = compliantDayTrades.length > 0
      ? (compliantDayTrades.filter(t => t.profitLoss > 0).length / compliantDayTrades.length) * 100
      : 0;

    // Popover account label — shows just the clean base name (e.g. "Main")
    // when no other account shares that prefix, and falls back to the full
    // "Base - Identifier" name whenever two or more accounts share a prefix
    // (e.g. "Main - 101" vs "Main - 202") so they stay distinguishable.
    const formatAccountName = (account: Account | undefined): string => {
      if (!account) return '';
      const baseOf = (name: string) => (name.includes(' - ') ? name.split(' - ')[0].trim() : name.trim());
      const base = baseOf(account.name);
      const sharedPrefixCount = accounts.filter(a => baseOf(a.name) === base).length;
      return sharedPrefixCount > 1 ? account.name : base;
    };

    // Small pill row shown under a trade's P&L in the log: every logged emotion
    // then every mistake — all of them, not just the first couple, wrapping onto
    // as many lines as needed since each trade row now has the full row width to
    // itself. Each badge is tinted with that tag's own saved color (same
    // dictionary as the Discipline & Psychology Review modal's dropdowns) instead
    // of a uniform violet/red fallback.
    const renderPsychBadges = (trade: Trade) => {
      const emotions = trade.emotions || [];
      const mistakes = trade.mistakes || [];
      if (emotions.length === 0 && mistakes.length === 0) return null;
      return (
        <div className="flex flex-wrap gap-1.5 justify-end">
          {emotions.map(e => (
            <span key={`e-${e}`} className={cn('px-2 py-0.5 rounded-full text-xs font-medium leading-normal', getTagColorStyle(colorForEmotion(e)).chip)}>
              {e}
            </span>
          ))}
          {mistakes.map(m => (
            <span key={`m-${m}`} className={cn('px-2 py-0.5 rounded-full text-xs font-medium leading-normal', getTagColorStyle(colorForMistake(m)).chip)}>
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
          {renderStatCard('Rules Broken', brokenTrades.length, <XCircle className="w-4 h-4" />, 'text-rose-400')}
          {renderStatCard('Follow Rate', `${((followedTrades.length / (followedTrades.length + brokenTrades.length)) * 100 || 0).toFixed(1)}%`, <Target className="w-4 h-4" />)}
          {renderStatCard('Avg Loss (Broken)', brokenTrades.length > 0 ? formatCurrency(brokenTrades.reduce((s, t) => s + t.profitLoss, 0) / brokenTrades.length, privacyMode) : '$0.00', <AlertCircle className="w-4 h-4" />, 'text-rose-400')}
        </div>

        {/* Discipline Analytics — Trades Needing Review + Streak Progress + Mini Discipline Calendar, unified 3-column row, equal height */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch mb-6">
          {/* Trades Needing Review — thin left column, sleek compact list of unreviewed trades */}
          <div className="lg:col-span-3 h-full flex flex-col bg-[#121318] border border-white/10 rounded-xl p-4 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-3 flex-shrink-0">
              <h3 className="text-xs font-semibold text-white flex items-center gap-1.5 truncate">
                <span>⚠️</span>
                <span className="truncate">Pending Review</span>
              </h3>
              {pendingReviewTrades.length > 0 && (
                <span className="text-[10px] font-mono font-semibold text-amber-300 flex-shrink-0 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-amber-500/15 border border-amber-500/30">
                  {pendingReviewTrades.length}
                </span>
              )}
            </div>

            {pendingReviewTrades.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <span className="text-xs font-medium text-zinc-500 px-3 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700/50 whitespace-nowrap">
                  🎉 0 Pending
                </span>
              </div>
            ) : (
              <div
                className="overflow-y-auto space-y-2.5 max-h-[290px] pr-1 overscroll-contain"
                onWheel={(e) => e.stopPropagation()}
              >
                {pendingReviewTrades.map(trade => {
                  const account = accounts.find(a => a.id === trade.accountId);
                  const startLabel = formatTimeDisplay(trade.startTime);
                  const endLabel = formatTimeDisplay(trade.endTime);
                  const timeLabel = startLabel && endLabel
                    ? `${startLabel} – ${endLabel}`
                    : startLabel || endLabel;
                  return (
                    <div
                      key={trade.id}
                      onClick={() => { setShowTradeDetail(trade.id); setShowExpandGallery(false); }}
                      className="p-2.5 bg-zinc-800/30 border border-zinc-700/40 rounded-lg hover:bg-zinc-800/50 hover:border-zinc-600/50 cursor-pointer transition-colors min-w-0"
                    >
                      {/* Top row: trade #, symbol, PnL */}
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {trade.trackingNumber && <TrackingBadge value={trade.trackingNumber} size="sm" />}
                          <span className="text-xs font-semibold text-white truncate">{trade.symbol}</span>
                        </div>
                        <span className={cn('text-xs font-mono font-semibold flex-shrink-0', trade.profitLoss > 0 ? 'text-emerald-400' : trade.profitLoss < 0 ? 'text-rose-400' : 'text-zinc-400')}>
                          {formatCurrency(trade.profitLoss, privacyMode)}
                        </span>
                      </div>

                      {/* Account name */}
                      <p className="text-[11px] text-zinc-400 truncate mt-1">{formatAccountName(account) || account?.name || '—'}</p>

                      {/* Session + date/time row */}
                      <div className="flex items-center gap-1.5 mt-1.5 min-w-0">
                        {trade.session && <SessionBadge value={trade.session} size="sm" />}
                        <span className="text-[10px] text-zinc-500 font-mono truncate">
                          {formatDate(trade.date)}
                          {timeLabel && <span className="text-zinc-600"> · {timeLabel}</span>}
                        </span>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); setShowDisciplineReview(trade.id); }}
                        className="mt-2 w-full flex items-center justify-center gap-1 px-2 py-1 rounded-md bg-violet-500/15 border border-violet-500/30 text-violet-300 text-[10px] font-medium hover:bg-violet-500/25 transition-colors"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        Review
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Streak Progress Grid — center column */}
          <div className="lg:col-span-5 bg-[#121318] border border-white/10 rounded-xl p-5 min-w-0 h-full flex flex-col">
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-4 flex-shrink-0">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2 truncate">
                  <Flame className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  STREAK PROGRESS
                </h3>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {([30, 60, 90] as const).map(w => (
                    <button
                      key={w}
                      onClick={() => setStreakGridWindow(w)}
                      className={cn(
                        'px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors',
                        streakGridWindow === w
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                          : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'
                      )}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4 flex-shrink-0">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-zinc-500">Current Streak</p>
                  <p className="text-lg font-bold text-emerald-400 truncate">
                    {disciplineStreak} {disciplineStreak === 1 ? 'Day' : 'Days'} Clean
                  </p>
                </div>
                <div className="w-px h-8 bg-white/10 flex-shrink-0" />
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-zinc-500">Best Streak</p>
                  <p className="text-lg font-bold text-zinc-300 truncate">
                    {bestStreak} {bestStreak === 1 ? 'Day' : 'Days'}
                  </p>
                </div>
              </div>

              {/* GitHub-style contribution pills — one per trading day within the
                  selected 30/60/90 window, laid out as a fixed-row CSS grid that
                  stretches to fill the card's remaining width and height exactly
                  (10x3 / 12x5 / 15x6), so there's never empty space below or a
                  need to scroll. Green pills fill in from the left for each
                  consecutive compliant trading day in the current streak; the
                  rest stay muted dark as the remaining target days. If the
                  streak breaks, the fill simply resets back to 0 and starts
                  filling fresh green pills from the left again — never red. */}
              <div
                className={cn('grid flex-1 min-h-0', streakPillGap)}
                style={{
                  gridTemplateColumns: `repeat(${streakPillCols}, 1fr)`,
                  gridTemplateRows: `repeat(${streakPillRows}, 1fr)`,
                }}
              >
                {Array.from({ length: streakGridWindow }, (_, i) => {
                  const filled = i < disciplineStreak;
                  return (
                    <div
                      key={i}
                      title={filled ? `Day ${i + 1}: Compliant Trading Day` : `Day ${i + 1}: Target`}
                      className={cn(
                        'w-full h-full rounded-md border transition-colors',
                        filled
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                          : 'bg-zinc-800/40 border-zinc-700/40'
                      )}
                    />
                  );
                })}
              </div>
            </div>

            {/* Subtle stat summary row — pinned to the bottom to match the calendar's legend footer */}
            <div className="flex items-center gap-6 pt-3 mt-3 border-t border-white/5 text-xs text-zinc-400 flex-shrink-0">
              <span>Total Compliant Days: <span className="text-zinc-200 font-semibold">{totalCompliantDays}</span></span>
              <span>Milestone Tier: <span className="text-amber-400 font-semibold">{activeStreakTier ? activeStreakTier.label : 'Unranked'}</span></span>
            </div>
          </div>

          {/* Mini Discipline Calendar — right column, compact and sleek */}
          <div className="lg:col-span-4 bg-[#121318] border border-white/10 rounded-xl p-5 min-w-0 h-full flex flex-col justify-between select-none">
            <div>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2 truncate">
                  <Shield className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  MINI DISCIPLINE CALENDAR
                </h3>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setDisciplineCalendarMonth(prev => prev.month === 0 ? { year: prev.year - 1, month: 11 } : { ...prev, month: prev.month - 1 })}
                    className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-medium text-zinc-300 whitespace-nowrap min-w-[92px] text-center">
                    {miniMonthNames[miniMonth]} {miniYear}
                  </span>
                  <button
                    onClick={() => setDisciplineCalendarMonth(prev => prev.month === 11 ? { year: prev.year + 1, month: 0 } : { ...prev, month: prev.month + 1 })}
                    className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div ref={disciplineCalendarGridRef} className="grid grid-cols-7 gap-1 select-none">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                  <div key={`${d}-${i}`} className="text-center text-[10px] text-zinc-500 font-medium py-1">
                    {d}
                  </div>
                ))}
                {miniCalendarDays.map((cell, i) => {
                  if (cell.day === null || cell.date === null) return <div key={`empty-${i}`} className="h-9 select-none" />;
                  const cellDate = cell.date;
                  const hasTrades = cell.trades.length > 0;
                  const followedCount = cell.trades.filter(t => t.rulesFollowed === 'followed').length;
                  const brokenCount = cell.trades.length - followedCount;
                  const anyBroken = hasTrades && brokenCount > 0;
                  const allFollowed = hasTrades && brokenCount === 0;
                  const tooltip = hasTrades
                    ? `${miniMonthNames[miniMonth].slice(0, 3)} ${cell.day}: ${cell.trades.length} Trade${cell.trades.length !== 1 ? 's' : ''}${anyBroken ? `, ${brokenCount} Rule${brokenCount !== 1 ? 's' : ''} Broken` : ', All Rules Followed'}`
                    : `${miniMonthNames[miniMonth].slice(0, 3)} ${cell.day}: No Trades`;
                  const isOpen = openDisciplineDay === cellDate;
                  const alignRight = i % 7 >= 4; // Fri/Sat/Sun columns — flip the flyout so it doesn't overflow the card's right edge
                  return (
                    <div key={i} className="relative">
                      <div
                        title={tooltip}
                        onClick={() => hasTrades && setOpenDisciplineDay(prev => prev === cellDate ? null : cellDate)}
                        className={cn(
                          'w-full aspect-square select-none h-9 flex flex-col items-center justify-center gap-0.5 rounded-md border transition-colors',
                          hasTrades ? 'cursor-pointer hover:scale-105 transition-transform' : 'cursor-default',
                          allFollowed && 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
                          anyBroken && 'bg-rose-500/10 border-rose-500/30 text-rose-300',
                          !hasTrades && 'border-white/5 bg-white/[0.02] hover:bg-white/5 text-zinc-500'
                        )}
                      >
                        <span className="text-xs font-medium">{cell.day}</span>
                        {hasTrades && (
                          <span className={cn('w-1 h-1 rounded-full', anyBroken ? 'bg-rose-400' : 'bg-emerald-400')} />
                        )}
                      </div>

                      {isOpen && (
                        <div
                          className={cn(
                            'absolute z-50 top-full mt-1.5 w-72 max-w-[calc(100vw-2rem)] bg-[#181920] border border-white/15 rounded-xl p-3.5 shadow-2xl',
                            alignRight ? 'right-0' : 'left-0'
                          )}
                        >
                          {/* Header — date + rule adherence badge */}
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-sm font-semibold text-white truncate">
                              {miniMonthNames[miniMonth]} {cell.day}, {miniYear}
                            </span>
                            <span
                              className={cn(
                                'flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap flex-shrink-0',
                                anyBroken ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300' : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                              )}
                            >
                              <span className={cn('w-1.5 h-1.5 rounded-full', anyBroken ? 'bg-rose-400' : 'bg-emerald-400')} />
                              {anyBroken ? `${brokenCount} Rule${brokenCount !== 1 ? 's' : ''} Broken` : '100% Compliant'}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 mb-3">
                            {cell.trades.length} Trade{cell.trades.length !== 1 ? 's' : ''} logged
                          </p>

                          {/* Daily trades list */}
                          <div className="border-t border-white/10 pt-3 mt-2 max-h-56 overflow-y-auto overscroll-contain">
                            {cell.trades.map(t => {
                              const tradeAccount = accounts.find(a => a.id === t.accountId);
                              return (
                                <div key={t.id} className="bg-[#1e1f29]/60 border border-white/10 rounded-xl p-3 pb-3 mb-2.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-semibold text-white truncate">
                                      {t.symbol}
                                      {t.session && <span className="text-zinc-500 font-normal"> · {t.session}</span>}
                                      {tradeAccount && (
                                        <>
                                          <span className="mx-1.5 text-zinc-500">|</span>
                                          <span className="text-sky-400 font-medium text-xs">
                                            {formatAccountName(tradeAccount)}
                                          </span>
                                        </>
                                      )}
                                    </span>
                                    <span className={cn('text-xs font-bold font-mono flex-shrink-0', t.profitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                                      {formatCurrency(t.profitLoss, privacyMode)}
                                    </span>
                                  </div>
                                  {((t.mistakes && t.mistakes.length > 0) || (t.emotions && t.emotions.length > 0)) && (
                                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                                      {(t.emotions || []).map(e => (
                                        <span key={`e-${e}`} className={cn('px-1.5 py-0.5 rounded-full text-[10px] font-medium', getTagColorStyle(colorForEmotion(e)).chip)}>
                                          {e}
                                        </span>
                                      ))}
                                      {(t.mistakes || []).map(m => (
                                        <span key={`m-${m}`} className={cn('px-1.5 py-0.5 rounded-full text-[10px] font-medium', getTagColorStyle(colorForMistake(m)).chip)}>
                                          {m}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Footer action — jump to this day's trades in Trade History */}
                          <button
                            onClick={() => {
                              setView('trades');
                              setTradeSubView('database');
                              setDbSearch(cellDate);
                              setDbPage(0);
                              setOpenDisciplineDay(null);
                            }}
                            className="w-full flex items-center justify-center gap-1.5 mt-2 pt-3 border-t border-white/10 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                          >
                            View in Trade History
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend footer — aligned horizontally with the Streak card's bottom stat row */}
            <div className="flex items-center justify-between pt-3 mt-auto border-t border-white/5 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                100% Followed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" />
                Rule Broken
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-zinc-600 flex-shrink-0" />
                No Trades
              </span>
            </div>
          </div>
        </div>

        {/* Psychology & Behavioral Analytics — now positioned above the log, full width, two columns */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 min-w-0">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2 truncate">
              <Brain className="w-4 h-4 text-violet-400 flex-shrink-0" />
              <span className="truncate">Psychology & Behavioral Analytics</span>
            </h3>
            <select
              value={globalAnalyticsTimeframe ?? ''}
              onChange={(e) => setGlobalAnalyticsTimeframe(e.target.value as DisciplineAnalyticsTimeframe)}
              title="Global Timeframe — updates both cards at once"
              className="px-2.5 py-1 bg-zinc-900 border border-white/10 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/50 transition-colors cursor-pointer flex-shrink-0"
            >
              {globalAnalyticsTimeframe === null && <option value="" disabled>Mixed</option>}
              {disciplineAnalyticsTimeframeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 mb-5">
            <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center flex-shrink-0">
              <Flame className="w-5 h-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-zinc-400 uppercase tracking-wider truncate">Current Discipline Streak</p>
              <p className="text-lg font-bold text-white truncate">{disciplineStreak} trade{disciplineStreak !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-zinc-800/20 border border-zinc-800/60 rounded-xl p-4 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h4 className="text-sm font-semibold text-violet-400 flex items-center gap-1.5 min-w-0">
                  <Brain className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">Top Emotions & State Breakdown</span>
                </h4>
                <select
                  value={emotionsTimeframe}
                  onChange={(e) => setEmotionsTimeframe(e.target.value as DisciplineAnalyticsTimeframe)}
                  className="px-2.5 py-1 bg-zinc-900 border border-white/10 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/50 transition-colors cursor-pointer flex-shrink-0"
                >
                  {disciplineAnalyticsTimeframeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {topEmotions.length === 0 ? (
                <p className="text-sm text-zinc-500 py-1">No emotions logged in this timeframe</p>
              ) : (
                <div className="space-y-3">
                  {topEmotions.map(({ emotion, count, pnl, winRate }) => {
                    const isProfit = pnl >= 0;
                    return (
                      <div key={emotion} className="min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium truncate', getTagColorStyle(colorForEmotion(emotion)).chip)}>
                            {emotion}
                          </span>
                          <span className={cn('text-sm font-mono font-medium flex-shrink-0', isProfit ? 'text-emerald-400' : 'text-rose-400')}>
                            {formatCurrency(pnl, privacyMode)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full', isProfit ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : 'bg-gradient-to-r from-rose-600 to-orange-400')}
                              style={{ width: `${(count / maxEmotionCount) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-zinc-500 font-mono flex-shrink-0">{count}x · {winRate.toFixed(0)}% WR</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-zinc-800/20 border border-zinc-800/60 rounded-xl p-4 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h4 className="text-sm font-semibold text-rose-400 flex items-center gap-1.5 min-w-0">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">Top Mistakes Committed</span>
                </h4>
                <select
                  value={mistakesTimeframe}
                  onChange={(e) => setMistakesTimeframe(e.target.value as DisciplineAnalyticsTimeframe)}
                  className="px-2.5 py-1 bg-zinc-900 border border-white/10 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/50 transition-colors cursor-pointer flex-shrink-0"
                >
                  {disciplineAnalyticsTimeframeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {topMistakes.length === 0 ? (
                <p className="text-sm text-zinc-500 py-1">No mistakes logged in this timeframe</p>
              ) : (
                <div className="space-y-3">
                  {topMistakes.map(({ mistake, count, pnl }) => (
                    <div key={mistake} className="min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium truncate', getTagColorStyle(colorForMistake(mistake)).chip)}>
                          {mistake}
                        </span>
                        <span className="text-sm font-mono font-medium text-rose-400 flex-shrink-0">
                          {formatCurrency(pnl, privacyMode)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-rose-600 to-orange-400"
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

        {/* Rule Adherence Log — full width so trades have room to show every emotion/mistake tag, not just the first couple */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 min-w-0">
          <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-zinc-400 flex-shrink-0" />
            <span className="truncate">Rule Adherence Log</span>
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="flex flex-col w-full min-w-0">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-zinc-800/70 flex-shrink-0">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400 truncate">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Followed
                </span>
                <span className="text-xs font-mono text-zinc-400 flex-shrink-0 px-2 py-0.5 rounded bg-zinc-800/60">{followedTrades.length}</span>
              </div>
              <div className="space-y-2 flex-1 overflow-y-auto max-h-[420px] pr-1 overscroll-contain" onWheel={(e) => e.stopPropagation()}>
                {followedTrades.map(trade => {
                  const account = accounts.find(a => a.id === trade.accountId);
                  return (
                    <div key={trade.id} onClick={() => { setShowRuleReviewModal(trade.id); setIsEditingRuleReview(false); }} className="p-3 bg-zinc-800/30 rounded-lg hover:bg-zinc-800/50 cursor-pointer transition-colors min-w-0 border-l-2 border-emerald-500/70">
                      <div className="flex items-start justify-between gap-3 min-w-0">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <TrackingBadge value={trade.trackingNumber} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-white truncate">{trade.symbol}</p>
                            <p className="text-xs text-zinc-400 truncate">{account?.name} | {formatDate(trade.date)}</p>
                          </div>
                        </div>
                        <p className={cn('font-mono font-medium text-sm flex-shrink-0', trade.profitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
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

            <div className="flex flex-col w-full min-w-0">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-zinc-800/70 flex-shrink-0">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-rose-400 truncate">
                  <XCircle className="w-4 h-4 flex-shrink-0" /> Broken
                </span>
                <span className="text-xs font-mono text-zinc-400 flex-shrink-0 px-2 py-0.5 rounded bg-zinc-800/60">{brokenTrades.length}</span>
              </div>
              <div className="space-y-2 flex-1 overflow-y-auto max-h-[420px] pr-1 overscroll-contain" onWheel={(e) => e.stopPropagation()}>
                {brokenTrades.map(trade => {
                  const account = accounts.find(a => a.id === trade.accountId);
                  return (
                    <div key={trade.id} onClick={() => { setShowRuleReviewModal(trade.id); setIsEditingRuleReview(false); }} className="p-3 bg-zinc-800/30 rounded-lg hover:bg-zinc-800/50 cursor-pointer transition-colors min-w-0 border-l-2 border-rose-500/70">
                      <div className="flex items-start justify-between gap-3 min-w-0">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <TrackingBadge value={trade.trackingNumber} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-white truncate">{trade.symbol}</p>
                            <p className="text-xs text-zinc-400 truncate">{account?.name} | {formatDate(trade.date)}</p>
                          </div>
                        </div>
                        <p className={cn('font-mono font-medium text-sm flex-shrink-0', trade.profitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
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
      </div>
    );
  };

  const renderPlaybook = () => (
    <div className="space-y-4 min-w-0">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="min-w-0">
          <h2 className={cn("text-2xl font-bold truncate", theme !== 'light' ? 'text-white' : 'text-zinc-900')}>Rules Playbook</h2>
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
                theme !== 'light' ? 'bg-zinc-900/40 border-x border-b border-zinc-800' : 'bg-white border-x border-b border-zinc-200'
              )}
            >
              <div className={cn("flex items-center justify-between gap-2 px-3 py-2.5 border-b", theme !== 'light' ? 'border-zinc-800/60' : 'border-zinc-200')}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn("w-6 h-6 rounded-md flex items-center justify-center text-sm flex-shrink-0", meta.iconBg)}>{meta.icon}</span>
                  <h3 className={cn("text-sm font-bold truncate", theme !== 'light' ? 'text-white' : 'text-zinc-900')}>{meta.label}</h3>
                  <span className="text-[10px] text-zinc-500 flex-shrink-0">{pillarRules.length}</span>
                </div>
                <button
                  onClick={() => openAddRuleModal(pillar)}
                  title={`Add ${meta.label}`}
                  className={cn("p-1 rounded transition-colors flex-shrink-0", theme !== 'light' ? 'text-zinc-500 hover:text-white hover:bg-zinc-800' : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100')}
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
                      theme !== 'light' ? 'text-zinc-600 hover:text-zinc-400 border-zinc-800 hover:border-zinc-700' : 'text-zinc-400 hover:text-zinc-600 border-zinc-300 hover:border-zinc-400'
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
                        theme !== 'light' ? 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700' : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="min-w-0 flex-1 flex items-center gap-1.5">
                          <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", severityMeta.dot)} title={severityMeta.label} />
                          <h4 className={cn("text-sm font-semibold truncate", theme !== 'light' ? 'text-white' : 'text-zinc-900')}>{rule.title}</h4>
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditRuleModal(rule)} className={cn("p-1 rounded", theme !== 'light' ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-zinc-900')}>
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteRule(rule.id)} className="p-1 rounded text-zinc-500 hover:text-rose-400">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {rule.description && (
                        <p className={cn("text-xs line-clamp-2 mb-2", theme !== 'light' ? 'text-zinc-500' : 'text-zinc-500')}>{rule.description}</p>
                      )}

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", severityMeta.badge)}>{severityMeta.label}</span>
                        {rule.category && (
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded truncate max-w-[8rem]", theme !== 'light' ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-200 text-zinc-600')}>{rule.category}</span>
                        )}
                        {violations > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/20 font-semibold flex items-center gap-0.5">
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
                      className="p-1 text-zinc-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
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
                          className="p-1 text-zinc-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
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
              <button onClick={() => handleDeleteWiki(entry.id)} className="p-1 text-zinc-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
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
    const tradingDays = calendarDays.filter(d => d.day !== null && d.trades.length > 0).length;
    const winningDays = calendarDays.filter(d => d.day !== null && d.pnl > 0).length;
    const losingDays = calendarDays.filter(d => d.day !== null && d.pnl < 0).length;
    // Win Rate here is DAY-level, not trade-level: it's the share of trading
    // days that closed green vs. red (breakeven days excluded), matching how
    // prop-firm style calendars usually frame monthly consistency.
    const winRate = (winningDays + losingDays) > 0 ? (winningDays / (winningDays + losingDays)) * 100 : 0;

    return (
      <div className="space-y-6 min-w-0">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold text-white truncate">Performance Calendar</h2>
            <p className="text-zinc-500 text-sm truncate">Daily P&L overview</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
            {/* All Accounts — same global account filter used on the Dashboard */}
            <div className="relative" ref={accountDropdownRef}>
              <button
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700"
              >
                <Filter className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline truncate max-w-[120px]">{selectedAccounts.includes('all') ? 'All Accounts' : `${selectedAccounts.length} Selected`}</span>
                <ChevronsUpDown className="w-4 h-4 flex-shrink-0" />
              </button>

              {showAccountDropdown && (
                <div className="absolute left-0 mt-2 min-w-[200px] w-64 rounded-lg shadow-xl z-50 p-2 bg-zinc-900 border border-zinc-800">
                  <button
                    onClick={() => setSelectedAccounts(['all'])}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded text-sm truncate transition-colors',
                      selectedAccounts.includes('all') ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800'
                    )}
                  >
                    All Accounts
                  </button>
                  <div className="my-2 border-t border-zinc-800" />
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
                        selectedAccounts.includes(acc.id) ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800'
                      )}
                    >
                      <span className="truncate flex-1 mr-2">{acc.name}</span>
                      {renderAccountTypeBadge(acc)}
                    </button>
                  ))}
                </div>
              )}
            </div>

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
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center gap-x-4 sm:gap-x-8 gap-y-4">
          <div className="flex items-center gap-3 pr-4 sm:pr-8 border-r border-zinc-800/80">
            <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', totalPnL >= 0 ? 'bg-emerald-500/15 border border-emerald-500/25' : 'bg-rose-500/15 border border-rose-500/25')}>
              <DollarSign className={cn('w-5 h-5', totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400')} />
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Net P&L This Month</p>
              <p className={cn('text-2xl font-bold font-mono', totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                {formatCurrency(totalPnL, privacyMode)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-8 gap-y-3">
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
              <p className="text-lg font-semibold text-rose-400">{losingDays}</p>
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

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-3 sm:p-4">
          {/* Desktop/tablet: original 8-column grid (7 days + Week recap column) */}
          <div className="hidden md:block">
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
                          day.pnl < 0 ? 'bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500/25 cursor-pointer' :
                          'bg-zinc-800/40 border border-zinc-700/60'
                        )}
                      >
                        {day.day !== null && (
                          <>
                            <span className="text-xs text-zinc-500 font-medium">{day.day}</span>
                            {day.trades.length > 0 ? (
                              <div className="min-w-0">
                                <p className={cn('text-sm font-bold font-mono truncate', day.pnl > 0 ? 'text-emerald-400' : day.pnl < 0 ? 'text-rose-400' : 'text-zinc-300')}>
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
                      weekPnl < 0 ? 'bg-rose-500/10 border-rose-500/25' :
                      'bg-zinc-800/40 border-zinc-700/60'
                    )}>
                      {hasWeekData ? (
                        <>
                          <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Week {wi + 1}</p>
                          <p className={cn('text-sm font-bold font-mono truncate', weekPnl > 0 ? 'text-emerald-400' : weekPnl < 0 ? 'text-rose-400' : 'text-zinc-300')}>
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
          </div>

          {/* Mobile: 7-column grid sized for narrow screens. The Week recap moves
              from an 8th squeezed column into a compact summary line under each
              week's row, so day cells stay readable instead of shrinking to ~30px. */}
          <div className="md:hidden">
            <div className="grid grid-cols-7 gap-1">
              {dayNames.map(day => (
                <div key={day} className="text-center text-[10px] text-zinc-500 font-medium py-1 truncate">{day.slice(0, 2)}</div>
              ))}
            </div>

            <div className="space-y-1 mt-1">
              {weeks.map((week, wi) => {
                const weekRealDays = week.filter(d => d.day !== null);
                const weekPnl = weekRealDays.reduce((s, d) => s + d.pnl, 0);
                const weekTradingDays = weekRealDays.filter(d => d.trades.length > 0).length;
                const hasWeekData = weekTradingDays > 0;
                return (
                  <div key={wi} className="space-y-0.5">
                    <div className="grid grid-cols-7 gap-1">
                      {week.map((day, di) => (
                        <div
                          key={di}
                          className={cn(
                            'rounded-lg p-1 min-h-[44px] flex flex-col justify-between min-w-0 transition-colors',
                            day.day === null ? 'bg-transparent' :
                            day.trades.length === 0 ? 'bg-zinc-800/30 border border-zinc-800/60' :
                            day.pnl > 0 ? 'bg-emerald-500/15 border border-emerald-500/30' :
                            day.pnl < 0 ? 'bg-rose-500/15 border border-rose-500/30' :
                            'bg-zinc-800/40 border border-zinc-700/60'
                          )}
                        >
                          {day.day !== null && (
                            <>
                              <span className="text-[9px] text-zinc-500 font-medium">{day.day}</span>
                              {day.trades.length > 0 ? (
                                <p className={cn('text-[9px] font-bold font-mono truncate leading-tight', day.pnl > 0 ? 'text-emerald-400' : day.pnl < 0 ? 'text-rose-400' : 'text-zinc-300')}>
                                  {formatCurrencyCompact(day.pnl, privacyMode)}
                                </p>
                              ) : (
                                <span className="text-[9px] text-zinc-700">—</span>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    {hasWeekData && (
                      <div className="flex items-center justify-between px-1 text-[10px]">
                        <span className="text-zinc-500">Week {wi + 1} · {weekTradingDays} day{weekTradingDays !== 1 ? 's' : ''}</span>
                        <span className={cn('font-mono font-semibold', weekPnl > 0 ? 'text-emerald-400' : weekPnl < 0 ? 'text-rose-400' : 'text-zinc-400')}>
                          {formatCurrency(weekPnl, privacyMode)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-zinc-800/70 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/40 border border-emerald-500/50" /> Profit
            </span>
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500/40 border border-rose-500/50" /> Loss
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
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                  <XCircle className="w-3.5 h-3.5" /> Rule Broken
                </span>
              )}
              <span className={cn('font-mono text-sm font-medium', trade.profitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                {formatCurrency(trade.profitLoss, privacyMode)}
              </span>
            </div>

            <div>
              <TagSelectDropdown
                label="Emotions Tracker"
                options={emotionsList}
                selected={disciplineReviewDraft.emotions}
                onChange={(selected) => setDisciplineReviewDraft(prev => ({ ...prev, emotions: selected }))}
                onAddNew={(name) => setEmotionsList(prev => [...prev, { id: generateId(), name, color: 'purple' }])}
                onDeleteOption={handleDeleteEmotion}
                onColorChange={handleChangeEmotionColor}
                placeholder="Select Emotions..."
                colorScheme="rose"
              />
            </div>

            <div>
              <TagSelectDropdown
                label="Mistakes Analysis"
                options={mistakesList}
                selected={disciplineReviewDraft.mistakes}
                onChange={(selected) => setDisciplineReviewDraft(prev => ({ ...prev, mistakes: selected }))}
                onAddNew={(name) => setMistakesList(prev => [...prev, { id: generateId(), name, color: 'red' }])}
                onDeleteOption={handleDeleteMistakeType}
                onColorChange={handleChangeMistakeColor}
                placeholder="Select Mistakes..."
                colorScheme="rose"
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

  // 2-Pane Split-View modal opened from Rule Adherence Log items. Left column is a
  // static, read-only Trade Preview (chart, P&L, entry/exit, duration) that never
  // changes regardless of the right column's state. Right column defaults to a
  // read-only Psychology Review summary with an "Edit Review" toggle that swaps
  // ONLY that column into the editable emotions/mistakes/notes form — the left
  // column's JSX never depends on isEditingRuleReview, so it stays mounted and
  // untouched (no scroll reset, no re-render) while the right column toggles.
  const renderRuleAdherenceReviewModal = () => {
    const trade = trades.find(t => t.id === showRuleReviewModal);
    if (!trade) return null;
    const account = accounts.find(a => a.id === trade.accountId);

    const execTf = trade.timeframes.find(tf => tf.name === 'Execution/Result');
    const executionImage = execTf?.images?.[0];
    const tradeStartDisplay = formatTimeDisplay(trade.startTime);
    const tradeEndDisplay = formatTimeDisplay(trade.endTime);
    const tradeDurationMinutes = calculateTradeDurationMinutes(trade.startTime, trade.endTime);
    const tradeDurationLabel = formatTradeDuration(tradeDurationMinutes);

    return (
      <ModalBackdrop
        onClose={closeRuleReviewModal}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4 py-8"
      >
        <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={closeRuleReviewModal}
            className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-zinc-800/90 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#121318] p-6 rounded-2xl border border-white/10 max-h-[85vh] overflow-y-auto">
            {/* ================= LEFT COLUMN — Trade Preview (static) ================= */}
            <div className="min-w-0 flex flex-col gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  {trade.trackingNumber && <TrackingBadge value={trade.trackingNumber} size="sm" />}
                  <h3 className="text-lg font-bold text-white truncate">{trade.symbol}</h3>
                </div>
                <p className="text-xs text-zinc-500 truncate mt-0.5">
                  {account?.name} · {formatDate(trade.date)}
                  {trade.session && <span> · {trade.session}</span>}
                </p>
              </div>

              <div className="relative bg-zinc-800/50 rounded-xl overflow-hidden border border-zinc-800 aspect-video flex items-center justify-center flex-shrink-0">
                {executionImage ? (
                  <img
                    src={executionImage.url}
                    alt="Execution"
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setLightboxImage(executionImage.url)}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-zinc-600">
                    <ImageIcon className="w-7 h-7" />
                    <span className="text-xs">No chart image</span>
                  </div>
                )}
              </div>

              <div className={cn('w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border flex-shrink-0', trade.profitLoss >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20')}>
                <span className="text-xs text-zinc-400">P&amp;L</span>
                <span className={cn('text-xl font-bold', trade.profitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                  {formatCurrency(trade.profitLoss, privacyMode)}
                </span>
              </div>

              {(tradeStartDisplay || tradeEndDisplay) && (
                <div className="flex flex-wrap items-center gap-2 bg-zinc-800/30 border border-zinc-800 rounded-xl px-3 py-2.5 flex-shrink-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Clock className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                    <span className="text-xs text-zinc-300 whitespace-nowrap">
                      <span className="text-zinc-500">Start</span>{' '}
                      <span className="text-white font-medium">{tradeStartDisplay || '—'}</span>
                      <span className="text-zinc-600 mx-1.5">→</span>
                      <span className="text-zinc-500">End</span>{' '}
                      <span className="text-white font-medium">{tradeEndDisplay || '—'}</span>
                    </span>
                  </div>
                  {tradeDurationLabel && (
                    <span className="ml-auto px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30 whitespace-nowrap">
                      {tradeDurationLabel}
                    </span>
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-zinc-800/50 rounded-lg p-2.5 min-w-0">
                  <p className="text-[10px] text-zinc-500 mb-0.5 truncate">Entry</p>
                  <p className="text-xs text-white font-medium truncate">{formatPriceInput(trade.entryPrice)}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-2.5 min-w-0">
                  <p className="text-[10px] text-zinc-500 mb-0.5 truncate">Stop Loss</p>
                  <p className="text-xs text-white font-medium truncate">{formatPriceInput(trade.stopLoss)}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-2.5 min-w-0">
                  <p className="text-[10px] text-zinc-500 mb-0.5 truncate">Take Profit</p>
                  <p className="text-xs text-white font-medium truncate">{formatPriceInput(trade.takeProfit)}</p>
                </div>
              </div>
            </div>

            {/* ================= RIGHT COLUMN — Psychology Review (toggles) ================= */}
            <div className="min-w-0 flex flex-col gap-4 md:border-l md:border-white/10 md:pl-6">
              <div className="flex items-center justify-between gap-3 flex-shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-violet-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white truncate">Psychology Review</h3>
                </div>
                {!isEditingRuleReview && (
                  <button
                    type="button"
                    onClick={() => setIsEditingRuleReview(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 hover:text-white transition-all text-xs font-medium cursor-pointer flex-shrink-0"
                  >
                    <span>✏️</span> Edit Review
                  </button>
                )}
              </div>

              {trade.rulesFollowed === 'followed' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium w-fit flex-shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Rule Followed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium w-fit flex-shrink-0">
                  <XCircle className="w-3.5 h-3.5" /> Rule Broken
                </span>
              )}

              {isEditingRuleReview ? (
                <>
                  <div>
                    <TagSelectDropdown
                      label="Emotions Tracker"
                      options={emotionsList}
                      selected={disciplineReviewDraft.emotions}
                      onChange={(selected) => setDisciplineReviewDraft(prev => ({ ...prev, emotions: selected }))}
                      onAddNew={(name) => setEmotionsList(prev => [...prev, { id: generateId(), name, color: 'purple' }])}
                      onDeleteOption={handleDeleteEmotion}
                      onColorChange={handleChangeEmotionColor}
                      placeholder="Select Emotions..."
                      colorScheme="rose"
                    />
                  </div>

                  <div>
                    <TagSelectDropdown
                      label="Mistakes Analysis"
                      options={mistakesList}
                      selected={disciplineReviewDraft.mistakes}
                      onChange={(selected) => setDisciplineReviewDraft(prev => ({ ...prev, mistakes: selected }))}
                      onAddNew={(name) => setMistakesList(prev => [...prev, { id: generateId(), name, color: 'red' }])}
                      onDeleteOption={handleDeleteMistakeType}
                      onColorChange={handleChangeMistakeColor}
                      placeholder="Select Mistakes..."
                      colorScheme="rose"
                    />
                  </div>

                  <div className="flex-1 min-h-0 flex flex-col">
                    <label className="block text-xs text-zinc-400 mb-2">Performance Evaluation Summary</label>
                    <textarea
                      value={disciplineReviewDraft.notes}
                      onChange={(e) => setDisciplineReviewDraft(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="What was going through your mind? Any psychological patterns or session observations worth remembering..."
                      rows={5}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-600 placeholder-zinc-600 resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={handleCancelRuleReviewEdit}
                      className="px-4 py-2.5 text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                      Cancel Edit
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
                </>
              ) : (
                <>
                  <div>
                    <p className="text-xs text-zinc-400 mb-2">Emotions Tracker</p>
                    {(trade.emotions || []).length === 0 ? (
                      <p className="text-xs text-zinc-600">No emotions logged</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {(trade.emotions || []).map(e => (
                          <span key={e} className={cn('px-2.5 py-1 rounded-full text-xs font-medium', getTagColorStyle(colorForEmotion(e)).chip)}>
                            {e}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-zinc-400 mb-2">Mistakes Analysis</p>
                    {(trade.mistakes || []).length === 0 ? (
                      <p className="text-xs text-zinc-600">No mistakes logged</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {(trade.mistakes || []).map(m => (
                          <span key={m} className={cn('px-2.5 py-1 rounded-full text-xs font-medium', getTagColorStyle(colorForMistake(m)).chip)}>
                            {m}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-h-0 flex flex-col">
                    <p className="text-xs text-zinc-400 mb-2">Performance Evaluation Summary</p>
                    <div className="flex-1 min-h-[6.5rem] bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm whitespace-pre-wrap">
                      {trade.notes
                        ? <span className="text-zinc-300">{trade.notes}</span>
                        : <span className="text-zinc-600">No performance notes logged yet.</span>}
                    </div>
                  </div>
                </>
              )}
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
              <button onClick={() => handleDeleteTrade(trade.id)} className="p-2 text-zinc-400 hover:text-rose-400 transition-colors">
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

            <div className={cn('w-full flex items-center justify-center gap-3 py-4 px-4 rounded-xl border', trade.profitLoss >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20')}>
              <span className="text-sm text-zinc-400">P&L</span>
              <span className={cn('text-2xl font-bold', trade.profitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
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
                    <p className={cn('text-sm font-medium', tradeRR >= 1 ? 'text-emerald-400' : tradeRR >= 0 ? 'text-white' : 'text-rose-400')}>
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
                className={cn('px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-colors', detailRulesFollowedDraft === 'followed' ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30')}
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
                    <span key={m} className={cn('px-3 py-1.5 rounded-lg text-sm truncate max-w-[150px]', getTagColorStyle(colorForMistake(m)).chip)}>{m}</span>
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
                  <h5 className="text-sm font-medium text-rose-400 mb-2 flex items-center gap-2">
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

              <div className={cn('grid gap-3', currentAccount.tradingAccountType === 'LIVE' ? 'grid-cols-1' : 'grid-cols-2')}>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Type</label>
                  <div className="relative" ref={tradingAccountTypeDropdownRef}>
                    <button
                      onClick={() => setShowTradingAccountTypeDropdown(!showTradingAccountTypeDropdown)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-zinc-600 flex items-center justify-between"
                    >
                      <span className="truncate flex items-center gap-2">
                        {renderTradingAccountTypeBadge({ tradingAccountType: currentAccount.tradingAccountType || 'LIVE' } as Account)}
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
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {currentAccount.tradingAccountType !== 'LIVE' && (
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
                )}
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
            {/* ================= SECTION 1: Trade Execution & Metrics ================= */}
            <div className="bg-zinc-800 border border-zinc-700 p-4 rounded-xl space-y-3 shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset]">
              <div className="flex items-center gap-2 pb-1">
                <span className="text-[10px] font-bold text-cyan-400 font-mono tracking-widest">01</span>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Trade Execution &amp; Metrics</h4>
              </div>
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
              <div className="grid grid-cols-3 gap-4">
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
                            className="w-full bg-[#242631] border border-zinc-600 rounded px-2 py-1.5 text-xs text-white placeholder-zinc-400 focus:outline-none"
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

              {/* Row 2: P&L + Risk + R:R Ratio - STRICT numeric inputs, RR always visible */}
              <div className="grid grid-cols-3 gap-4">
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
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">R:R Ratio</label>
                  <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-3 text-sm">
                    {calculatedRR !== null ? (
                      <span className={cn('font-medium', calculatedRR >= 1 ? 'text-emerald-400' : calculatedRR >= 0 ? 'text-zinc-400' : 'text-rose-400')}>
                        {calculatedRR.toFixed(2)}R
                      </span>
                    ) : (
                      <span className="text-zinc-500">--</span>
                    )}
                  </div>
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                </div>
              )}
            </div>

            {/* ================= HIGHLIGHTED BANNER: Rules Adherence ================= */}
            <div className={cn(
              'bg-[#161822] border-2 p-4 rounded-xl text-center space-y-3 transition-all',
              newTrade.rulesFollowed === 'followed'
                ? 'bg-emerald-950/30 border-emerald-500/60'
                : newTrade.rulesFollowed === 'broken'
                  ? 'bg-rose-950/30 border-rose-500/60'
                  : 'border-slate-700/80'
            )}>
              <div className="flex items-center justify-center gap-2">
                <Shield className="w-4 h-4 text-slate-200" />
                <h4 className="text-sm font-bold uppercase tracking-widest text-slate-200">Rules Adherence</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setNewTrade(prev => ({ ...prev, rulesFollowed: prev.rulesFollowed === 'followed' ? undefined : 'followed' })); setRulesAdherenceError(false); }}
                  className={cn('w-full flex items-center justify-center gap-1.5 px-3 py-3 rounded-lg text-sm font-medium border transition-colors',
                    newTrade.rulesFollowed === 'followed'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : rulesAdherenceError
                        ? 'bg-zinc-800/60 text-zinc-400 border-rose-500/50 hover:bg-zinc-800 hover:border-rose-500/70'
                        : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/80 hover:bg-zinc-800 hover:border-zinc-600')}
                >
                  <Check className="w-3.5 h-3.5" /> Followed
                </button>
                <button
                  type="button"
                  onClick={() => { setNewTrade(prev => ({ ...prev, rulesFollowed: prev.rulesFollowed === 'broken' ? undefined : 'broken' })); setRulesAdherenceError(false); }}
                  className={cn('w-full flex items-center justify-center gap-1.5 px-3 py-3 rounded-lg text-sm font-medium border transition-colors',
                    newTrade.rulesFollowed === 'broken'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : rulesAdherenceError
                        ? 'bg-zinc-800/60 text-zinc-400 border-rose-500/50 hover:bg-zinc-800 hover:border-rose-500/70'
                        : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/80 hover:bg-zinc-800 hover:border-zinc-600')}
                >
                  <X className="w-3.5 h-3.5" /> Broken
                </button>
              </div>
              {rulesAdherenceError && (
                <p className="text-xs text-rose-400">Please select whether rules were Followed or Broken</p>
              )}
            </div>

            {/* ================= SECTION 2: Strategy & Tagging ================= */}
            <div className="bg-zinc-800 border border-zinc-700 p-4 rounded-xl space-y-3 shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset]">
              <div className="flex items-center gap-2 pb-1">
                <span className="text-[10px] font-bold text-cyan-400 font-mono tracking-widest">02</span>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Strategy &amp; Tagging</h4>
              </div>
              {/* Tag groups: Setup Types + Confluences side by side, Mistakes Made full width below */}
              <div className="grid grid-cols-2 gap-4">
                <TagSelectDropdown
                  label="Setup Types"
                  options={setupTypes}
                  selected={newTrade.setupTypes || []}
                  onChange={(selected) => setNewTrade(prev => ({ ...prev, setupTypes: selected }))}
                  onAddNew={(name) => setSetupTypes(prev => [...prev, { id: generateId(), name, color: 'gray' }])}
                  onDeleteOption={handleDeleteSetupType}
                  onColorChange={handleChangeSetupTypeColor}
                  placeholder="Select Setup Types..."
                  colorScheme="emerald"
                />
                <TagSelectDropdown
                  label="Confluences"
                  options={confluences}
                  selected={newTrade.confluences || []}
                  onChange={(selected) => setNewTrade(prev => ({ ...prev, confluences: selected }))}
                  onAddNew={(name) => setConfluences(prev => [...prev, { id: generateId(), name, color: 'gray' }])}
                  onDeleteOption={handleDeleteConfluence}
                  onColorChange={handleChangeConfluenceColor}
                  placeholder="Select Confluences..."
                  colorScheme="emerald"
                />
              </div>

              <TagSelectDropdown
                label="Mistakes Made"
                options={mistakesList}
                selected={newTrade.mistakes || []}
                onChange={(selected) => setNewTrade(prev => ({ ...prev, mistakes: selected }))}
                onAddNew={(name) => setMistakesList(prev => [...prev, { id: generateId(), name, color: 'red' }])}
                onDeleteOption={handleDeleteMistakeType}
                onColorChange={handleChangeMistakeColor}
                placeholder="Select Mistakes Made..."
                colorScheme="rose"
              />
            </div>

            {/* ================= SECTION 3: Chart Screenshots ================= */}
            <div className="bg-zinc-800 border border-zinc-700 p-4 rounded-xl space-y-3 shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset]">
              <div className="flex items-center gap-2 pb-1">
                <span className="text-[10px] font-bold text-cyan-400 font-mono tracking-widest">03</span>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Chart Screenshots</h4>
              </div>
              <p className="text-xs text-zinc-500">Attach images for each timeframe</p>
              <div className="grid grid-cols-2 gap-3">
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

            {/* ================= SECTION 4: Post-Trade Reflection ================= */}
            <div className="bg-zinc-800 border border-zinc-700 p-4 rounded-xl space-y-3 shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset]">
              <div className="flex items-center gap-2 pb-1">
                <span className="text-[10px] font-bold text-cyan-400 font-mono tracking-widest">04</span>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Post-Trade Reflection</h4>
              </div>
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
            {/* ================= SECTION 1: Trade Execution & Metrics ================= */}
            <div className="bg-zinc-800 border border-zinc-700 p-4 rounded-xl space-y-3 shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset]">
              <div className="flex items-center gap-2 pb-1">
                <span className="text-[10px] font-bold text-cyan-400 font-mono tracking-widest">01</span>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Trade Execution &amp; Metrics</h4>
              </div>
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
              <div className="grid grid-cols-3 gap-4">
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
                            className="w-full bg-[#242631] border border-zinc-600 rounded px-2 py-1.5 text-xs text-white placeholder-zinc-400 focus:outline-none"
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

              {/* Row 2: P&L + Risk + R:R Ratio - STRICT numeric inputs, RR always visible */}
              <div className="grid grid-cols-3 gap-4">
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
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">R:R Ratio</label>
                  <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-3 text-sm">
                    {calculatedRR !== null ? (
                      <span className={cn('font-medium', calculatedRR >= 1 ? 'text-emerald-400' : calculatedRR >= 0 ? 'text-zinc-400' : 'text-rose-400')}>
                        {calculatedRR.toFixed(2)}R
                      </span>
                    ) : (
                      <span className="text-zinc-500">--</span>
                    )}
                  </div>
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                </div>
              )}
            </div>

            {/* ================= HIGHLIGHTED BANNER: Rules Adherence ================= */}
            <div className={cn(
              'bg-[#161822] border-2 p-4 rounded-xl text-center space-y-3 transition-all',
              newTrade.rulesFollowed === 'followed'
                ? 'bg-emerald-950/30 border-emerald-500/60'
                : newTrade.rulesFollowed === 'broken'
                  ? 'bg-rose-950/30 border-rose-500/60'
                  : 'border-slate-700/80'
            )}>
              <div className="flex items-center justify-center gap-2">
                <Shield className="w-4 h-4 text-slate-200" />
                <h4 className="text-sm font-bold uppercase tracking-widest text-slate-200">Rules Adherence</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setNewTrade(prev => ({ ...prev, rulesFollowed: prev.rulesFollowed === 'followed' ? undefined : 'followed' })); setRulesAdherenceError(false); }}
                  className={cn('w-full flex items-center justify-center gap-1.5 px-3 py-3 rounded-lg text-sm font-medium border transition-colors',
                    newTrade.rulesFollowed === 'followed'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : rulesAdherenceError
                        ? 'bg-zinc-800/60 text-zinc-400 border-rose-500/50 hover:bg-zinc-800 hover:border-rose-500/70'
                        : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/80 hover:bg-zinc-800 hover:border-zinc-600')}
                >
                  <Check className="w-3.5 h-3.5" /> Followed
                </button>
                <button
                  type="button"
                  onClick={() => { setNewTrade(prev => ({ ...prev, rulesFollowed: prev.rulesFollowed === 'broken' ? undefined : 'broken' })); setRulesAdherenceError(false); }}
                  className={cn('w-full flex items-center justify-center gap-1.5 px-3 py-3 rounded-lg text-sm font-medium border transition-colors',
                    newTrade.rulesFollowed === 'broken'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : rulesAdherenceError
                        ? 'bg-zinc-800/60 text-zinc-400 border-rose-500/50 hover:bg-zinc-800 hover:border-rose-500/70'
                        : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/80 hover:bg-zinc-800 hover:border-zinc-600')}
                >
                  <X className="w-3.5 h-3.5" /> Broken
                </button>
              </div>
              {rulesAdherenceError && (
                <p className="text-xs text-rose-400">Please select whether rules were Followed or Broken</p>
              )}
            </div>

            {/* ================= SECTION 2: Strategy & Tagging ================= */}
            <div className="bg-zinc-800 border border-zinc-700 p-4 rounded-xl space-y-3 shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset]">
              <div className="flex items-center gap-2 pb-1">
                <span className="text-[10px] font-bold text-cyan-400 font-mono tracking-widest">02</span>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Strategy &amp; Tagging</h4>
              </div>
              {/* Tag groups: Setup Types + Confluences side by side, Mistakes Made full width below */}
              <div className="grid grid-cols-2 gap-4">
                <TagSelectDropdown
                  label="Setup Types"
                  options={setupTypes}
                  selected={newTrade.setupTypes || []}
                  onChange={(selected) => setNewTrade(prev => ({ ...prev, setupTypes: selected }))}
                  onAddNew={(name) => setSetupTypes(prev => [...prev, { id: generateId(), name, color: 'gray' }])}
                  onDeleteOption={handleDeleteSetupType}
                  onColorChange={handleChangeSetupTypeColor}
                  placeholder="Select Setup Types..."
                  colorScheme="emerald"
                />
                <TagSelectDropdown
                  label="Confluences"
                  options={confluences}
                  selected={newTrade.confluences || []}
                  onChange={(selected) => setNewTrade(prev => ({ ...prev, confluences: selected }))}
                  onAddNew={(name) => setConfluences(prev => [...prev, { id: generateId(), name, color: 'gray' }])}
                  onDeleteOption={handleDeleteConfluence}
                  onColorChange={handleChangeConfluenceColor}
                  placeholder="Select Confluences..."
                  colorScheme="emerald"
                />
              </div>

              <TagSelectDropdown
                label="Mistakes Made"
                options={mistakesList}
                selected={newTrade.mistakes || []}
                onChange={(selected) => setNewTrade(prev => ({ ...prev, mistakes: selected }))}
                onAddNew={(name) => setMistakesList(prev => [...prev, { id: generateId(), name, color: 'red' }])}
                onDeleteOption={handleDeleteMistakeType}
                onColorChange={handleChangeMistakeColor}
                placeholder="Select Mistakes Made..."
                colorScheme="rose"
              />
            </div>

            {/* ================= SECTION 3: Chart Screenshots ================= */}
            <div className="bg-zinc-800 border border-zinc-700 p-4 rounded-xl space-y-3 shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset]">
              <div className="flex items-center gap-2 pb-1">
                <span className="text-[10px] font-bold text-cyan-400 font-mono tracking-widest">03</span>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Chart Screenshots</h4>
              </div>
              <p className="text-xs text-zinc-500">Attach images for each timeframe</p>
              <div className="grid grid-cols-2 gap-3">
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

            {/* ================= SECTION 4: Post-Trade Reflection ================= */}
            <div className="bg-zinc-800 border border-zinc-700 p-4 rounded-xl space-y-3 shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset]">
              <div className="flex items-center gap-2 pb-1">
                <span className="text-[10px] font-bold text-cyan-400 font-mono tracking-widest">04</span>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Post-Trade Reflection</h4>
              </div>
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

  // Reusable trade delete confirmation modal — covers BOTH triggers:
  //  1) Individual delete (single trade, via tradePendingDelete)
  //  2) Bulk delete (Select Mode "Delete Selected (X)", via showDeleteSelectedConfirm)
  // Neither trigger deletes anything until the user explicitly confirms here.
  const renderDeleteTradeConfirm = () => {
    const isBulk = showDeleteSelectedConfirm;
    const isSingle = !isBulk && !!tradePendingDelete;
    if (!isBulk && !isSingle) return null;

    const count = isBulk ? selectedTradeIds.length : 1;
    const title = count > 1 ? `Delete ${count} Trades` : 'Delete Trade';
    const body = 'Are you sure you want to delete this trade history entry? This action cannot be undone.';
    const bulkBody = 'Are you sure you want to delete these trade history entries? This action cannot be undone.';

    const handleCancel = () => {
      setShowDeleteSelectedConfirm(false);
      setTradePendingDelete(null);
    };

    const handleConfirm = () => {
      if (isBulk) {
        confirmDeleteSelectedTrades();
      } else {
        confirmDeleteTrade();
      }
    };

    return (
      <ModalBackdrop
        onClose={handleCancel}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
      >
        <div className="bg-[#121318] border border-white/10 rounded-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-rose-500/15 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-5 h-5 text-rose-400" />
            </div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
          </div>
          <p className="text-sm text-zinc-400 mb-6">
            {count > 1 ? bulkBody : body}
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </ModalBackdrop>
    );
  };

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
            <div className="w-10 h-10 rounded-full bg-rose-500/15 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-5 h-5 text-rose-400" />
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
              className="px-4 py-2 bg-rose-500/90 hover:bg-rose-500 text-white rounded-lg text-sm font-medium transition-colors"
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
    <div className={cn("h-screen w-full flex overflow-hidden bg-[#0b0c0e] text-white", theme === 'minecraft' && 'theme-minecraft')}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');

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
          margin: 0;
          padding: 0;
          height: 100%;
          scroll-behavior: smooth;
          /* Matches the dark root background so mobile elastic/rubber-band
             overscroll never reveals the browser's default white canvas
             underneath tall pages (e.g. the 100-day grid). */
          background-color: #0b0c0e;
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

        /* ---- Minecraft theme ----
           The base markup is authored with dark zinc-* utility classes.
           Rather than thread a third branch through every ternary in the
           file, we reskin those same classes here (same pattern as the
           light-fix block above) whenever the root wrapper carries
           .theme-minecraft. Every theme === 'dark' check in the component
           tree was widened to theme !== 'light', so Minecraft mode renders
           the existing dark-styled markup, and this stylesheet retextures it
           into a Minecraft inventory-GUI look. */

        .theme-minecraft, .theme-minecraft * {
          font-family: 'VT323', monospace !important;
          letter-spacing: 0.02em;
        }
        .theme-minecraft [class*="rounded"] { border-radius: 0 !important; }
        .theme-minecraft [class*="blur"] { filter: none !important; }
        .theme-minecraft [class*="backdrop-blur"] { backdrop-filter: none !important; }
        .theme-minecraft * { transition-duration: 60ms !important; }

        /* Main page canvas: pixelated deepslate/stone grid, not a flat color */
        .theme-minecraft {
          background-color: #2b2b2b;
          background-image:
            repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 4px, transparent 4px, transparent 16px),
            repeating-linear-gradient(90deg, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 4px, transparent 4px, transparent 16px),
            repeating-linear-gradient(45deg, #363636 0px, #363636 16px, #2f2f2f 16px, #2f2f2f 32px);
        }
        .theme-minecraft [class~="bg-zinc-950"],
        .theme-minecraft [class~="bg-zinc-950/80"] {
          background-color: #2b2b2b !important;
          background-image:
            repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 4px, transparent 4px, transparent 16px),
            repeating-linear-gradient(90deg, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 4px, transparent 4px, transparent 16px),
            repeating-linear-gradient(45deg, #363636 0px, #363636 16px, #2f2f2f 16px, #2f2f2f 32px) !important;
        }

        /* Cards / panels / sidebar: solid stone slab with a 2px beveled edge
           (light highlight top-left, dark shadow bottom-right) */
        .theme-minecraft [class~="bg-zinc-900"],
        .theme-minecraft [class~="bg-zinc-900/40"],
        .theme-minecraft [class~="bg-zinc-900/50"],
        .theme-minecraft [class~="bg-zinc-900/60"],
        .theme-minecraft [class~="bg-zinc-900/70"],
        .theme-minecraft [class~="bg-zinc-900/95"],
        .theme-minecraft [class~="bg-zinc-800"],
        .theme-minecraft [class~="bg-zinc-800/30"],
        .theme-minecraft [class~="bg-zinc-800/40"],
        .theme-minecraft [class~="bg-zinc-800/50"],
        .theme-minecraft [class~="bg-zinc-800/60"],
        .theme-minecraft [class~="bg-zinc-800/70"],
        .theme-minecraft [class~="bg-zinc-800/80"],
        .theme-minecraft [class~="bg-zinc-700"],
        .theme-minecraft [class~="bg-zinc-700/50"],
        .theme-minecraft [class~="bg-zinc-600"],
        .theme-minecraft [class*="from-zinc-"],
        .theme-minecraft [class*="to-zinc-"],
        .theme-minecraft [class*="via-zinc-"] {
          background-color: #4a4a4a !important;
          background-image: none !important;
          border-color: transparent !important;
          box-shadow:
            inset 2px 2px 0 0 #7a7a7a,
            inset -2px -2px 0 0 #1e1e1e !important;
        }

        /* Standalone borders (no bg override above) still read as a bevel */
        .theme-minecraft [class~="border-zinc-800"],
        .theme-minecraft [class~="border-zinc-800/50"],
        .theme-minecraft [class~="border-zinc-800/60"],
        .theme-minecraft [class~="border-zinc-800/70"],
        .theme-minecraft [class~="border-zinc-800/80"],
        .theme-minecraft [class~="border-zinc-700"],
        .theme-minecraft [class~="border-zinc-700/50"],
        .theme-minecraft [class~="border-zinc-700/60"],
        .theme-minecraft [class~="border-zinc-700/80"],
        .theme-minecraft [class~="border-zinc-600"],
        .theme-minecraft [class~="border-zinc-600/50"],
        .theme-minecraft [class~="border-zinc-500"] {
          border-color: #1e1e1e !important;
          border-style: solid !important;
        }

        /* Inputs render as a recessed Minecraft text-field slot */
        .theme-minecraft input,
        .theme-minecraft select,
        .theme-minecraft textarea {
          background-color: #2b2b2b !important;
          border: none !important;
          border-radius: 0 !important;
          color: #ffffff !important;
          box-shadow:
            inset 2px 2px 0 0 #1e1e1e,
            inset -2px -2px 0 0 #6b6b6b !important;
        }

        /* Buttons: blocky Minecraft menu-button styling with a hard 3D
           drop shadow, brightening border + white text on hover */
        .theme-minecraft button {
          border-radius: 0 !important;
          background-color: #4a4a4a;
          box-shadow:
            inset 2px 2px 0 0 #7a7a7a,
            inset -2px -2px 0 0 #1e1e1e,
            3px 3px 0 0 #000000;
        }
        .theme-minecraft button:hover {
          color: #ffffff !important;
          box-shadow:
            inset 2px 2px 0 0 #a3a3a3,
            inset -2px -2px 0 0 #1e1e1e,
            0 0 0 2px #e6e6e6,
            3px 3px 0 0 #000000;
        }
        .theme-minecraft button:active {
          box-shadow:
            inset 2px 2px 0 0 #1e1e1e,
            inset -2px -2px 0 0 #7a7a7a;
          transform: translate(2px, 2px);
        }

        /* Text palette: chat off-white / light gray labels, Diamond Blue and
           Emerald Green for important + active states */
        .theme-minecraft [class~="text-white"] { color: #ffffff !important; }
        .theme-minecraft [class~="text-zinc-300"],
        .theme-minecraft [class~="text-zinc-400"],
        .theme-minecraft [class~="text-zinc-500"] { color: #aaaaaa !important; }
        .theme-minecraft [class*="text-emerald"],
        .theme-minecraft [class*="text-green"] { color: #55ff55 !important; }
        .theme-minecraft [class*="text-blue"],
        .theme-minecraft [class*="text-cyan"],
        .theme-minecraft [class*="text-violet"],
        .theme-minecraft [class*="text-indigo"] { color: #55ffff !important; }
        .theme-minecraft [class*="text-red"],
        .theme-minecraft [class*="text-rose"] { color: #ff5555 !important; }
        .theme-minecraft [class*="text-amber"],
        .theme-minecraft [class*="text-yellow"] { color: #ffff55 !important; }

        /* Headings, stat numbers and button labels lean on the pixel font
           at a slightly larger size so they read the way Minecraft's GUI
           text does (VT323 is narrow/small at 1:1) */
        .theme-minecraft h1, .theme-minecraft h2, .theme-minecraft h3,
        .theme-minecraft h4, .theme-minecraft button, .theme-minecraft [class*="text-2xl"],
        .theme-minecraft [class*="text-3xl"], .theme-minecraft [class*="text-xl"] {
          font-family: 'VT323', monospace !important;
          letter-spacing: 0.04em;
        }

        /* Scrollbar reskin so it doesn't look like a stray glassy sliver */
        .theme-minecraft ::-webkit-scrollbar-thumb {
          background-color: #6b6b6b !important;
          border-radius: 0 !important;
        }
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
            "relative w-56 h-full flex flex-col",
            theme !== 'light' ? 'bg-zinc-900 border-r border-zinc-800' : 'bg-white border-r border-zinc-200'
          )}>
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}

      {/* DESKTOP SIDEBAR (Permanent Layout) - FIXED HEIGHT, PINNED TO VIEWPORT */}
      <aside className={cn(
        "hidden md:flex flex-col h-screen sticky top-0 flex-shrink-0 overflow-hidden transition-all duration-300",
        theme !== 'light' ? 'bg-zinc-900 border-r border-zinc-800' : 'bg-white border-r border-zinc-200',
        sidebarCollapsed ? "w-[72px]" : "w-56"
      )}>
        {renderSidebarContent(false)}
      </aside>

      {/* MAIN WORKSPACE - ISOLATED SCROLL */}
      <main ref={mainScrollRef} className={cn("flex-1 min-w-0 h-screen overflow-y-auto flex flex-col transition-colors duration-300", theme !== 'light' ? 'bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-900')}>
        {/* MOBILE STICKY TOP BAR */}
        <div className={cn(
          "md:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b backdrop-blur-sm",
          theme !== 'light' ? 'bg-zinc-900/95 border-zinc-800' : 'bg-white/95 border-zinc-200'
        )}>
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            aria-label="Open menu"
            className={cn(
              "p-2 -ml-2 rounded-lg transition-colors",
              theme !== 'light' ? 'text-zinc-300 hover:text-white hover:bg-zinc-800' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            )}
          >
            <PanelLeft className="w-5 h-5" />
          </button>
          <span className={cn("font-bold text-base uppercase tracking-wider", theme !== 'light' ? 'text-white' : 'text-zinc-900')}>
            VSX
          </span>
        </div>

        <div className="pt-4 pr-4 pb-4 pl-3 sm:pt-6 sm:pr-6 sm:pb-6 sm:pl-4">
          {view === 'dashboard' && renderDashboard()}
          {view === 'trades' && renderTradeHistory()}
          {view === 'discipline' && renderDisciplineTracker()}
          {view === 'lifeDiscipline' && renderLifeDisciplineHub()}
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
      {renderRuleAdherenceReviewModal()}
      {renderExpandGallery()}
      {renderAddRuleModal()}
      {renderAddNoticeModal()}
      {renderAddScenarioModal()}
      {renderAddWikiModal()}
      {renderDeleteTradeConfirm()}
      {renderDeleteAccountConfirm()}
      {renderLightbox()}
      {renderSettingsModal()}

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
