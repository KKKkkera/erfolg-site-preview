"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MediaPickerDialog } from "@/components/admin/media/media-picker-dialog";
import { updateSettings } from "@/server/actions/admin/settings";

export type SettingFieldDef = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "url" | "media";
  placeholder?: string;
  description?: string;
};

export function SettingsCardForm({
  title,
  description,
  fields,
  initial,
  s3Configured,
}: {
  title: string;
  description?: string;
  fields: SettingFieldDef[];
  initial: Record<string, unknown>;
  s3Configured: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<Record<string, string>>(() => {
    const obj: Record<string, string> = {};
    for (const f of fields) {
      const v = initial[f.key];
      obj[f.key] =
        v == null ? "" : typeof v === "string" ? v : JSON.stringify(v);
    }
    return obj;
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const payload: Record<string, unknown> = {};
    for (const f of fields) {
      const raw = (values[f.key] ?? "").trim();
      payload[f.key] = raw === "" ? null : raw;
    }
    startTransition(async () => {
      const res = await updateSettings(payload);
      if (res.ok) {
        toast.success("Сохранено");
      } else {
        toast.error(res.message || "Ошибка");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label htmlFor={f.key}>{f.label}</Label>
              {f.type === "textarea" ? (
                <Textarea
                  id={f.key}
                  rows={3}
                  value={values[f.key] ?? ""}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [f.key]: e.target.value }))
                  }
                  disabled={pending}
                  placeholder={f.placeholder}
                />
              ) : f.type === "media" ? (
                <div className="flex items-center gap-2">
                  <Input
                    id={f.key}
                    type="text"
                    value={values[f.key] ?? ""}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        [f.key]: e.target.value,
                      }))
                    }
                    disabled={pending}
                    placeholder={f.placeholder ?? "https://…"}
                  />
                  <MediaPickerDialog
                    triggerLabel="Из медиатеки"
                    s3Configured={s3Configured}
                    origin="setting"
                    onSelect={(asset) =>
                      setValues((prev) => ({ ...prev, [f.key]: asset.url }))
                    }
                  />
                </div>
              ) : (
                <Input
                  id={f.key}
                  type={f.type === "url" ? "url" : "text"}
                  value={values[f.key] ?? ""}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [f.key]: e.target.value }))
                  }
                  disabled={pending}
                  placeholder={f.placeholder}
                />
              )}
              {f.description ? (
                <p className="text-xs text-muted-foreground">{f.description}</p>
              ) : null}
              <p className="text-[10px] text-muted-foreground">
                ключ: <code>{f.key}</code>
              </p>
            </div>
          ))}
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Сохранить
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
