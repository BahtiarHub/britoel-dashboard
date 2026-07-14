import * as React from "react";
import { cn } from "@/lib/utils";

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-[inset_0_1px_2px_rgba(0,45,86,0.025)] transition-[border-color,box-shadow] focus-visible:border-[#00529c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00529c]/15",
        className,
      )}
      {...props}
    />
  );
}
