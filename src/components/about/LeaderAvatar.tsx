import Image from 'next/image';
import type { Leader } from '@/lib/content/types';

/** Photo when supplied, otherwise an initials placeholder — never a fabricated image. */
export function LeaderAvatar({ leader }: { leader: Leader }) {
  if (leader.photoUrl) {
    return (
      <Image
        src={leader.photoUrl}
        alt={leader.name}
        fill
        sizes="128px"
        className="object-cover object-top"
      />
    );
  }

  const initials = leader.name
    .split(' ')
    .filter((word) => /^[A-Za-z]/.test(word))
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <span className="grid h-full w-full place-items-center font-display text-[22px] font-extrabold text-[var(--dc-accent-soft)] sm:text-[26px]">
      {initials || '—'}
    </span>
  );
}
