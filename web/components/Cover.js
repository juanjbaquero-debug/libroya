"use client";

import { useState } from "react";

export function Cover({ book, className = "" }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(book.image) && !failed;

  return (
    <div className={`overflow-hidden bg-ink text-cream ${className}`}>
      {showImage ? (
        <img
          src={book.image}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full items-end p-4">
          <p className="font-serif text-xl leading-tight">{book.title}</p>
        </div>
      )}
    </div>
  );
}
