"use client";

import { useRef } from "react";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { sendMessage } from "@/lib/actions/messages";
import { Button } from "@/components/ui/button";
import { Send, Loader2, AlertCircle } from "lucide-react";

interface MessageInputProps {
  receiverUsername: string;
}

export function MessageInput({ receiverUsername }: MessageInputProps) {
  const t = useTranslations("messages");
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(
    async (prev: { error?: string }, formData: FormData) => {
      const result = await sendMessage(prev, formData);
      if (!result.error) {
        formRef.current?.reset();
      }
      return result;
    },
    {}
  );

  return (
    <div className="border-t border-border bg-background p-3">
      {state.error && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {state.error}
        </div>
      )}
      <form ref={formRef} action={action} className="flex gap-2">
        <input type="hidden" name="receiver_username" value={receiverUsername} />
        <input
          name="content"
          required
          maxLength={2000}
          autoComplete="off"
          className="flex-1 rounded-full border border-border bg-input px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder={t("inputPlaceholder")}
        />
        <Button
          type="submit"
          size="icon"
          disabled={pending}
          className="h-9 w-9 rounded-full shrink-0"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
