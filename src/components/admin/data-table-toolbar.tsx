"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";

export function DataSearchInput({
  value,
  onChange,
  placeholder = "Поиск…",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-9 w-full sm:w-[260px]"
    />
  );
}
