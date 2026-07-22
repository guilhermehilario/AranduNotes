import React from "react";
import { Skeleton } from "../../../components/ui/Skeleton.tsx";

export const StatsSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-4">
      {/* Stat Cards Grid Skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 3 regular stat card skeletons */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3.5 p-4 bg-white dark:bg-dark-900 rounded-2xl border border-slate-100 dark:border-dark-800"
          >
            <Skeleton variant="rounded" width={44} height={44} />
            <div className="min-w-0 flex-1 flex flex-col gap-2">
              <Skeleton variant="text" width="60%" height={12} />
              <Skeleton variant="text" width="40%" height={22} />
              <Skeleton variant="text" width="80%" height={10} />
            </div>
          </div>
        ))}

        {/* Accuracy rate card skeleton (with ring) */}
        <div className="flex items-center gap-3.5 p-4 bg-white dark:bg-dark-900 rounded-2xl border border-slate-100 dark:border-dark-800">
          <Skeleton variant="circular" width={44} height={44} />
          <div className="min-w-0 flex-1 flex flex-col gap-2">
            <Skeleton variant="text" width="65%" height={12} />
            <Skeleton variant="text" width="35%" height={22} />
            <Skeleton variant="text" width="75%" height={10} />
          </div>
        </div>
      </div>

      {/* Per-Notebook Breakdown Skeleton */}
      <div className="flex flex-col gap-2.5">
        <Skeleton variant="text" width={100} height={14} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 bg-white dark:bg-dark-900 rounded-xl border border-slate-100 dark:border-dark-800"
            >
              <Skeleton variant="circular" width={12} height={12} />
              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <Skeleton variant="text" width="70%" height={14} />
                <Skeleton variant="text" width="100%" height={6} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatsSkeleton;
