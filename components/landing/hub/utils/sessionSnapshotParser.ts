type ResponseStyle = "concise" | "coach" | "operator";
type RiskStance = "guarded" | "balanced" | "aggressive";
type PersonaPresetId = "mystic" | "analyst" | "mentor";
type LlmWorkflowTask = "chat" | "generate" | "summarize" | "qa";
type LlmDepth = "quick" | "balanced" | "deep";
type PromptLibraryCategory = "trading" | "content" | "ops";

export interface ParsedPromptLibraryItem {
  id: string;
  title: string;
  category: PromptLibraryCategory;
  value: string;
}

export interface ParsedMemoryCard {
  id: string;
  scope: "short" | "long";
  title: string;
  content: string;
  updatedAt: number;
  confidence: number;
}

export interface ParsedSessionPreset {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  guideName: string;
  responseStyle: ResponseStyle;
  riskStance: RiskStance;
  focusSymbol: string;
  sessionIntent: string;
  personaPreset: PersonaPresetId;
  workflowTask: LlmWorkflowTask;
  workflowDepth: LlmDepth;
  workflowCreativity: number;
}

export interface ParsedWorkspaceSettingsSnapshot {
  guideName: string;
  responseStyle: ResponseStyle;
  riskStance: RiskStance;
  focusSymbol: string;
  sessionIntent: string;
  personaPreset: PersonaPresetId;
  workflowTask: LlmWorkflowTask;
  workflowDepth: LlmDepth;
  workflowCreativity: number;
}

export interface ParsedWorkspaceSnapshotPayload {
  settings: ParsedWorkspaceSettingsSnapshot;
  customPromptPacks: ParsedPromptLibraryItem[];
  memoryCards: ParsedMemoryCard[];
  sessionPresets: ParsedSessionPreset[];
}

export interface ParsedWorkspaceSnapshot {
  id: string;
  name: string;
  version: number;
  createdAt: number;
  payload: ParsedWorkspaceSnapshotPayload;
}

export interface ParsedSessionSettings {
  guideName?: string;
  responseStyle?: ResponseStyle;
  riskStance?: RiskStance;
  focusSymbol?: string;
  sessionIntent?: string;
  personaPreset?: PersonaPresetId;
  workflowTask?: LlmWorkflowTask;
  workflowDepth?: LlmDepth;
  workflowCreativity?: number;
}

export interface ParsedSessionSnapshot {
  settings?: ParsedSessionSettings;
  customPromptPacks?: ParsedPromptLibraryItem[];
  memoryCards?: ParsedMemoryCard[];
  sessionPresets?: ParsedSessionPreset[];
}

function makeId(prefix: "custom" | "memory" | "preset") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeSettings(input: Partial<ParsedSessionPreset>): ParsedSessionSettings {
  return {
    ...(typeof input.guideName === "string" && input.guideName.trim()
      ? { guideName: input.guideName.trim().slice(0, 24) }
      : {}),
    ...(input.responseStyle === "concise" || input.responseStyle === "coach" || input.responseStyle === "operator"
      ? { responseStyle: input.responseStyle }
      : {}),
    ...(input.riskStance === "guarded" || input.riskStance === "balanced" || input.riskStance === "aggressive"
      ? { riskStance: input.riskStance }
      : {}),
    ...(typeof input.focusSymbol === "string"
      ? { focusSymbol: input.focusSymbol.slice(0, 12) }
      : {}),
    ...(typeof input.sessionIntent === "string"
      ? { sessionIntent: input.sessionIntent.slice(0, 72) }
      : {}),
    ...(input.personaPreset === "mystic" || input.personaPreset === "analyst" || input.personaPreset === "mentor"
      ? { personaPreset: input.personaPreset }
      : {}),
    ...(input.workflowTask === "chat" || input.workflowTask === "generate" || input.workflowTask === "summarize" || input.workflowTask === "qa"
      ? { workflowTask: input.workflowTask }
      : {}),
    ...(input.workflowDepth === "quick" || input.workflowDepth === "balanced" || input.workflowDepth === "deep"
      ? { workflowDepth: input.workflowDepth }
      : {}),
    ...(typeof input.workflowCreativity === "number"
      ? { workflowCreativity: Math.max(20, Math.min(100, Math.round(input.workflowCreativity))) }
      : {}),
  };
}

export function normalizePromptLibraryItems(input: unknown): ParsedPromptLibraryItem[] {
  if (!Array.isArray(input)) return [];
  return input
    .slice(0, 24)
    .map((item) => {
      const partial = item as Partial<ParsedPromptLibraryItem>;
      return {
        id: typeof partial.id === "string" ? partial.id : makeId("custom"),
        title: String(partial.title ?? "Custom Prompt").slice(0, 40),
        category: partial.category === "trading" || partial.category === "content" || partial.category === "ops" ? partial.category : "ops",
        value: String(partial.value ?? "").slice(0, 500),
      };
    })
    .filter((item) => item.value.trim().length > 0);
}

export function normalizeMemoryCards(input: unknown): ParsedMemoryCard[] {
  if (!Array.isArray(input)) return [];
  return input
    .slice(0, 12)
    .map((card): ParsedMemoryCard => {
      const partial = card as Partial<ParsedMemoryCard>;
      const scope: ParsedMemoryCard["scope"] = partial.scope === "long" ? "long" : "short";
      return {
        id: typeof partial.id === "string" ? partial.id : makeId("memory"),
        scope,
        title: String(partial.title ?? "Memory").slice(0, 40),
        content: String(partial.content ?? "").slice(0, 160),
        updatedAt: typeof partial.updatedAt === "number" ? partial.updatedAt : Date.now(),
        confidence: typeof partial.confidence === "number" ? Math.min(100, Math.max(1, partial.confidence)) : 70,
      };
    })
    .filter((card) => card.content.trim().length > 0);
}

export function normalizeSessionPresets(input: unknown): ParsedSessionPreset[] {
  if (!Array.isArray(input)) return [];
  return input
    .slice(0, 20)
    .map((preset) => {
      const partial = preset as Partial<ParsedSessionPreset>;
      return {
        id: typeof partial.id === "string" ? partial.id : makeId("preset"),
        name: String(partial.name ?? "Session Preset").slice(0, 42),
        createdAt: typeof partial.createdAt === "number" ? partial.createdAt : Date.now(),
        updatedAt: typeof partial.updatedAt === "number" ? partial.updatedAt : Date.now(),
        guideName: String(partial.guideName ?? "Trader").slice(0, 24),
        responseStyle: partial.responseStyle === "concise" || partial.responseStyle === "coach" || partial.responseStyle === "operator"
          ? partial.responseStyle
          : "coach",
        riskStance: partial.riskStance === "guarded" || partial.riskStance === "balanced" || partial.riskStance === "aggressive"
          ? partial.riskStance
          : "balanced",
        focusSymbol: String(partial.focusSymbol ?? "SOL").slice(0, 12),
        sessionIntent: String(partial.sessionIntent ?? "Build disciplined consistency").slice(0, 72),
        personaPreset: partial.personaPreset === "mystic" || partial.personaPreset === "analyst" || partial.personaPreset === "mentor"
          ? partial.personaPreset
          : "mystic",
        workflowTask: partial.workflowTask === "chat" || partial.workflowTask === "generate" || partial.workflowTask === "summarize" || partial.workflowTask === "qa"
          ? partial.workflowTask
          : "chat",
        workflowDepth: partial.workflowDepth === "quick" || partial.workflowDepth === "balanced" || partial.workflowDepth === "deep"
          ? partial.workflowDepth
          : "balanced",
        workflowCreativity:
          typeof partial.workflowCreativity === "number"
            ? Math.max(20, Math.min(100, Math.round(partial.workflowCreativity)))
            : 65,
      };
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function normalizeWorkspaceSnapshots(input: unknown): ParsedWorkspaceSnapshot[] {
  if (!Array.isArray(input)) return [];
  return input
    .slice(0, 16)
    .filter((item) =>
      Boolean(item)
      && typeof (item as Partial<ParsedWorkspaceSnapshot>).id === "string"
      && typeof (item as Partial<ParsedWorkspaceSnapshot>).name === "string"
      && typeof (item as Partial<ParsedWorkspaceSnapshot>).version === "number"
      && typeof (item as Partial<ParsedWorkspaceSnapshot>).createdAt === "number"
      && typeof (item as Partial<ParsedWorkspaceSnapshot>).payload === "object"
      && (item as Partial<ParsedWorkspaceSnapshot>).payload !== null,
    )
    .map((item) => item as ParsedWorkspaceSnapshot)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function parseImportedSessionSnapshot(raw: string): ParsedSessionSnapshot | null {
  try {
    const parsed = JSON.parse(raw) as {
      settings?: Partial<ParsedSessionPreset>;
      customPromptPacks?: Array<Partial<ParsedPromptLibraryItem>>;
      memoryCards?: Array<Partial<ParsedMemoryCard>>;
      sessionPresets?: Array<Partial<ParsedSessionPreset>>;
    };

    const result: ParsedSessionSnapshot = {};

    if (parsed.settings && typeof parsed.settings === "object") {
      result.settings = normalizeSettings(parsed.settings);
    }

    if (Array.isArray(parsed.customPromptPacks)) {
      result.customPromptPacks = normalizePromptLibraryItems(parsed.customPromptPacks);
    }

    if (Array.isArray(parsed.memoryCards)) {
      result.memoryCards = normalizeMemoryCards(parsed.memoryCards);
    }

    if (Array.isArray(parsed.sessionPresets)) {
      result.sessionPresets = normalizeSessionPresets(parsed.sessionPresets);
    }

    return result;
  } catch {
    return null;
  }
}
