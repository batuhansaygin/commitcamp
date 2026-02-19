"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Swords } from "lucide-react";
import { CreateDuelDialog } from "./create-duel-dialog";
import type { Challenge } from "@/lib/types/challenges";

interface DuelsHeaderProps {
  challenges: Challenge[];
}

export function DuelsHeader({ challenges }: DuelsHeaderProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)}>
        <Swords className="w-4 h-4" />
        Create Duel
      </Button>

      <CreateDuelDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        challenges={challenges}
      />
    </>
  );
}
