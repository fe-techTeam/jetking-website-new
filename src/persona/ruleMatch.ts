import type { PersonaRule, RuleCondition } from '@/lib/content/types';
import type { PersonaId } from '@/persona/types';

/**
 * CMS IF/THEN rule matcher (Layer 2).
 *
 * Allowed condition fields are a fixed enum in code. Marketing edits rules and
 * variants in the Admin CMS without deploys; adding a new field type requires code.
 */

export interface RuleContext {
  persona: PersonaId;
  locationCity?: string;
  interest?: string;
  returning: boolean;
  visitCount: number;
  utmCampaign?: string;
  utmSource?: string;
  device?: 'mobile' | 'desktop';
  path?: string;
  /** organic_search | paid_search | social | campaign | referral | direct */
  channel?: string;
}

function asString(value: RuleCondition['value']): string {
  if (Array.isArray(value)) return value.join(',');
  return String(value);
}

function readField(ctx: RuleContext, field: RuleCondition['field']): string | number | boolean | undefined {
  switch (field) {
    case 'location.city':
      return ctx.locationCity;
    case 'interest':
      return ctx.interest;
    case 'returning':
      return ctx.returning;
    case 'utm.campaign':
      return ctx.utmCampaign;
    case 'utm.source':
      return ctx.utmSource;
    case 'device':
      return ctx.device;
    case 'persona':
      return ctx.persona;
    case 'path':
      return ctx.path;
    case 'visitCount':
      return ctx.visitCount;
    case 'channel':
      return ctx.channel;
    default:
      return undefined;
  }
}

export function matchCondition(ctx: RuleContext, condition: RuleCondition): boolean {
  const actual = readField(ctx, condition.field);
  const expected = condition.value;

  switch (condition.op) {
    case 'eq':
      if (typeof expected === 'boolean') return Boolean(actual) === expected;
      return String(actual ?? '').toLowerCase() === asString(expected).toLowerCase();
    case 'neq':
      return String(actual ?? '').toLowerCase() !== asString(expected).toLowerCase();
    case 'contains':
      return String(actual ?? '')
        .toLowerCase()
        .includes(asString(expected).toLowerCase());
    case 'gte':
      return Number(actual) >= Number(expected);
    case 'lte':
      return Number(actual) <= Number(expected);
    case 'in': {
      const list = Array.isArray(expected) ? expected : asString(expected).split(',');
      return list.map((v) => String(v).toLowerCase()).includes(String(actual ?? '').toLowerCase());
    }
    default:
      return false;
  }
}

export function matchRule(ctx: RuleContext, rule: PersonaRule): boolean {
  if (!rule.enabled) return false;
  if (rule.conditions.length === 0) return false;
  if (rule.matchAll) return rule.conditions.every((c) => matchCondition(ctx, c));
  return rule.conditions.some((c) => matchCondition(ctx, c));
}

/** Highest priority matching rule wins. */
export function selectHomepageVariantId(
  ctx: RuleContext,
  rules: PersonaRule[],
  fallbackId = 'default',
): string {
  const sorted = [...rules].filter((r) => r.enabled).sort((a, b) => b.priority - a.priority);
  for (const rule of sorted) {
    if (matchRule(ctx, rule)) return rule.homepageVariantId;
  }
  return fallbackId;
}
