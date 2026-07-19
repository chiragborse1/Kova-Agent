import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { RowButton } from '@/components/ui/row-button';
import { useI18n } from '@/i18n';
import { Check, ChevronRight, Terminal } from '@/lib/icons';
const PROVIDER_DISPLAY = {
    'openai-codex': { order: 0, title: 'OpenAI OAuth (ChatGPT)' },
    'minimax-oauth': { order: 1, title: 'MiniMax' },
    'qwen-oauth': { order: 2, title: 'Qwen Code' },
    'xai-oauth': { order: 3, title: 'xAI Grok' },
    anthropic: { order: 4, title: 'Anthropic API Key' },
    'claude-code': { order: 5, title: 'Anthropic OAuth' }
};
const assetPath = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
export const providerTitle = (p) => PROVIDER_DISPLAY[p.id]?.title ?? p.name;
const orderOf = (p) => PROVIDER_DISPLAY[p.id]?.order ?? 99;
export const sortProviders = (providers) => [...providers].sort((a, b) => orderOf(a) - orderOf(b) || a.name.localeCompare(b.name));
function ConnectedTag() {
    const { t } = useI18n();
    return (_jsxs("span", { className: "inline-flex items-center gap-1 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary", children: [_jsx(Check, { className: "size-3" }), t.onboarding.connected] }));
}
const PROVIDER_ROW_CLASS = 'group flex w-full items-center justify-between gap-3 rounded-[6px] px-3 py-2.5 text-left transition-colors hover:bg-(--ui-control-hover-background)';
export function KeyProviderRow({ onClick }) {
    const { t } = useI18n();
    return (_jsxs(RowButton, { className: PROVIDER_ROW_CLASS, onClick: onClick, children: [_jsxs("div", { className: "min-w-0", children: [_jsx("span", { className: "text-[length:var(--conversation-text-font-size)] font-semibold", children: "OpenRouter" }), _jsx("p", { className: "mt-1 text-xs leading-5 text-muted-foreground", children: t.onboarding.openRouterPitch })] }), _jsx(ChevronRight, { className: "size-4 text-muted-foreground transition group-hover:text-foreground" })] }));
}
export function ProviderRow({ onSelect, provider }) {
    const { t } = useI18n();
    const loggedIn = provider.status?.logged_in;
    const Trail = provider.flow === 'external' ? Terminal : ChevronRight;
    return (_jsxs(RowButton, { className: PROVIDER_ROW_CLASS, onClick: () => onSelect(provider), children: [_jsxs("div", { className: "min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-[length:var(--conversation-text-font-size)] font-semibold", children: providerTitle(provider) }), loggedIn ? _jsx(ConnectedTag, {}) : null] }), _jsx("p", { className: "mt-1 text-xs leading-5 text-muted-foreground", children: t.onboarding.flowSubtitles[provider.flow] })] }), _jsx(Trail, { className: "size-4 text-muted-foreground transition group-hover:text-foreground" })] }));
}
