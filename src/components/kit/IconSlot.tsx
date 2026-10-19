import { isValidElement, type ComponentType, type ReactNode } from 'react';

/** Either a Lucide-style icon component or a ready-made element (e.g. a local SVG glyph). */
export type IconInput = ComponentType<{ className?: string; strokeWidth?: number }> | ReactNode;

export function IconSlot({ icon, className, strokeWidth }: { icon: IconInput; className?: string; strokeWidth?: number }) {
  if (isValidElement(icon)) return icon;
  if (!icon) return null;
  const Icon = icon as ComponentType<{ className?: string; strokeWidth?: number }>;
  return <Icon className={className} strokeWidth={strokeWidth} />;
}
