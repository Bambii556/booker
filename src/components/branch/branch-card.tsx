"use client";

import Link from "next/link";
import { MapPin, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Branch } from "@/lib/db/schema";

interface BranchCardProps {
  branch: Branch;
}

export function BranchCard({ branch }: BranchCardProps) {
  return (
    <Card hoverable className="group relative">
      <Link
        href={`/appointments/${branch.id}`}
        className="absolute inset-0 z-10"
        aria-label={`Book appointment at ${branch.name}`}
      />
      <CardHeader>
        <CardTitle className="flex items-center justify-between pr-8">
          <span>{branch.name}</span>
          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{branch.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>
              {branch.openingTime.slice(0, 5)} -{" "}
              {branch.closingTime.slice(0, 5)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
