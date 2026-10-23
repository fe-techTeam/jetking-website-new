'use client';

import { usePathname } from 'next/navigation';
import { Phone } from 'lucide-react';
import { track } from '@/lib/analytics';
import { FaWhatsapp } from 'react-icons/fa';

const CALL_NUMBER = '07666830000';
const WHATSAPP_URL = 'https://api.whatsapp.com/send/?phone=919326023091&text&type=phone_number&app_absent=0';

/**
 * Desktop floating Call + WhatsApp buttons, bottom-right. Hidden below `lg`, where
 * MobileContactBar already offers the same actions.
 */
export function FloatingContact() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-6 right-6 z-40 hidden flex-col gap-3 lg:flex">
      <a
        href={`tel:${CALL_NUMBER}`}
        aria-label="Call Jetking"
        onClick={() => track('phone_clicked', { surface: 'floating-contact', path: pathname })}
        className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--theme-accent)] text-white shadow-lg transition-transform hover:scale-105 hover:bg-[var(--theme-accent-hover)] motion-reduce:transition-none"
      >
        <Phone className="h-6 w-6" strokeWidth={2.25} aria-hidden="true" />
      </a>
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Jetking on WhatsApp"
        onClick={() => track('whatsapp_clicked', { surface: 'floating-contact', path: pathname })}
        className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 hover:bg-[#1ebe5a] motion-reduce:transition-none"
      >
        <FaWhatsapp className="h-8 w-8" aria-hidden="true" />
      </a>
    </div>
  );
}
