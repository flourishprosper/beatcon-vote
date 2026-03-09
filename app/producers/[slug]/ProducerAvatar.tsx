"use client";

import { useState } from "react";

type ProducerAvatarProps = {
  imageUrl: string | null;
  stageName: string;
  className?: string;
};

const placeholderClassName =
  "flex h-28 w-28 items-center justify-center rounded-full bg-zinc-200 text-3xl font-bold text-zinc-400 sm:h-36 sm:w-36";

export function ProducerAvatar({
  imageUrl,
  stageName,
  className = "h-28 w-28 rounded-full object-cover ring-2 ring-zinc-200 sm:h-36 sm:w-36",
}: ProducerAvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = imageUrl && !failed;

  if (showImage) {
    return (
      <img
        src={imageUrl}
        alt={stageName}
        className={className}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className={placeholderClassName} aria-hidden>
      {stageName.charAt(0).toUpperCase()}
    </div>
  );
}
