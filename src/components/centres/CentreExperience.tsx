import Image from 'next/image';
import { Camera, type LucideIcon } from 'lucide-react';

export interface ReasonTile {
  title: string;
  body: string;
  icon: LucideIcon;
  /** The picture beside the text; empty when none is available yet. */
  photoUrl?: string;
  photoAlt: string;
  /** What the missing picture should show, printed on the placeholder. */
  photoLabel: string;
}

/** A labelled stand-in for a picture that has not been supplied yet. */
function PhotoPlaceholder({ label, note, flat = false }: { label: string; note: string; flat?: boolean }) {
  return (
    <div className={`flex h-full min-h-[180px] flex-col items-center justify-center gap-2 border-2 border-dashed border-[var(--k-line-strong)] bg-[var(--k-red-wash)] p-4 text-center sm:min-h-0 ${flat ? '' : 'rounded-[20px]'}`}>
      <Camera className="h-7 w-7 text-[var(--k-red)]" strokeWidth={1.8} aria-hidden="true" />
      <p className="text-[13.5px] leading-snug font-semibold text-[var(--k-ink-2)]">{label}</p>
      <p className="text-[12px] font-bold tracking-[0.08em] text-[var(--k-red)] uppercase">{note}</p>
    </div>
  );
}

/**
 * Four reasons to walk into a centre, one card each: the picture on one half and a solid red text panel on the other,
 * so the grid reads photo | text, photo | text. The wording is the same for every centre; a centre can swap in its own
 * pictures. A missing picture shows a labelled placeholder (or, with placeholders off, just the red panel).
 */
export function CentreReasons({ tiles, showPlaceholders, placeholderNote }: { tiles: ReasonTile[]; showPlaceholders: boolean; placeholderNote: string }) {
  return (
    <ul className="grid gap-3 sm:gap-4 md:grid-cols-2">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        const showPhoto = Boolean(tile.photoUrl) || showPlaceholders;
        return (
          <li key={tile.title} className="flex flex-col overflow-hidden rounded-[20px] shadow-[var(--k-shadow)] sm:min-h-[240px] sm:flex-row">
            {showPhoto ? (
              <div className="relative aspect-[4/3] w-full shrink-0 sm:aspect-auto sm:h-auto sm:min-h-[240px] sm:w-1/2">
                {tile.photoUrl ? (
                  <Image
                    src={tile.photoUrl}
                    alt={tile.photoAlt}
                    fill
                    sizes="(min-width: 768px) 25vw, 100vw"
                    className="object-cover object-center"
                  />
                ) : (
                  <PhotoPlaceholder label={tile.photoLabel} note={placeholderNote} flat />
                )}
              </div>
            ) : null}
            <div className={`flex flex-col justify-center gap-3 bg-[var(--k-red-fill)] p-5 text-white sm:p-6 ${showPhoto ? 'sm:w-1/2' : 'w-full'}`}>
              <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15">
                <Icon className="h-6 w-6" strokeWidth={1.9} />
              </span>
              <h3 className="text-[18px] leading-snug font-extrabold !text-white sm:text-[20px]">{tile.title}</h3>
              <p className="text-[14px] leading-snug !text-white/95 sm:text-[14.5px]">{tile.body}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export interface GallerySlot {
  label: string;
  url?: string;
  alt?: string;
}

/** Up to four pictures of the centre. Slots without a picture show a labelled placeholder. */
export function CentreGallery({ slots, label, note }: { slots: GallerySlot[]; label: string; note: string }) {
  return (
    <ul aria-label={label} className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:gap-4 md:grid-cols-4">
      {slots.map((slot) => (
        <li key={slot.label} className="relative aspect-[4/3] overflow-hidden rounded-[20px]">
          {slot.url ? (
            <>
              <Image src={slot.url} alt={slot.alt || slot.label} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3.5 pt-8 pb-3 text-[13.5px] font-bold text-white">{slot.label}</span>
            </>
          ) : (
            <PhotoPlaceholder label={slot.label} note={note} />
          )}
        </li>
      ))}
    </ul>
  );
}
