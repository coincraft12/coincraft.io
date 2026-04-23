'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function ProfilePhoto() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-24 h-24 rounded-full border-2 border-cc-accent/40 overflow-hidden relative hover:border-cc-accent transition-colors cursor-pointer"
      >
        <Image src="/ej-profile.jpg" alt="EJ Kim" fill className="object-cover object-top" quality={100} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div className="relative w-72 h-72 rounded-2xl overflow-hidden border-2 border-cc-accent/40 shadow-2xl">
            <Image src="/ej-profile.jpg" alt="EJ Kim" fill className="object-cover object-top" quality={100} />
          </div>
        </div>
      )}
    </>
  );
}
