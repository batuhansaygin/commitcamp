"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { DuelCard } from "./duel-card";
import { acceptDuel, declineDuel } from "@/lib/actions/challenges";
import type { Duel } from "@/lib/types/challenges";

interface DuelsClientProps {
  duels: Duel[];
  currentUserId: string;
}

export function DuelsClient({ duels, currentUserId }: DuelsClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function handleAccept(duelId: string) {
    startTransition(async () => {
      await acceptDuel(duelId);
      router.refresh();
    });
  }

  function handleDecline(duelId: string) {
    startTransition(async () => {
      await declineDuel(duelId);
      router.refresh();
    });
  }

  return (
    <>
      {duels.map((duel) => (
        <DuelCard
          key={duel.id}
          duel={duel}
          currentUserId={currentUserId}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      ))}
    </>
  );
}
