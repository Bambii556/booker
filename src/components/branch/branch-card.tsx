"use client";

import Link from "next/link";
import { MapPin, Clock, CalendarPlus } from "lucide-react";
import type { Branch } from "@/lib/db/schema";

interface BranchCardProps {
  branch: Branch;
}

export function BranchCard({ branch }: BranchCardProps) {
  return (
    <div className="group relative bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all flex flex-col">
      <Link
        href={`/branches/appointments/${branch.id}`}
        className="absolute inset-0 z-10 rounded-2xl"
        aria-label={`Book appointment at ${branch.name}`}
      />

      {/* Top accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-primary/40 via-primary to-primary/40 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* Branch name */}
        <div>
          <h3 className="font-bold text-base text-foreground leading-snug">{branch.name}</h3>
        </div>

        {/* Details */}
        <div className="space-y-2 flex-1">
          <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary/60" />
            <span className="leading-snug">{branch.address}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0 text-primary/60" />
            <span>Open {branch.openingTime.slice(0, 5)} – {branch.closingTime.slice(0, 5)}</span>
          </div>
        </div>

        {/* CTA button */}
        <div className="pt-1">
          <div className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-primary/8 group-hover:bg-primary group-hover:text-white text-primary text-sm font-semibold transition-all border border-primary/20 group-hover:border-primary">
            <CalendarPlus className="h-4 w-4" />
            Book appointment
          </div>
        </div>
      </div>
    </div>
  );
}
