
"use client";
import { useEffect, useMemo, useState } from "react";

type Item = { date: string; count: number };

export function ActivityHeatmap({ days=168 }:{ days?: number }){
  const [data, setData] = useState<Item[]>([]);

  useEffect(()=>{
    (async () => {
      const res = await fetch(`/api/activities/heatmap?days=${days}`);
      const json = await res.json();
      setData(json.data as Item[]);
    })();
  }, [days]);

  // group into weeks (Sun..Sat)
  const grid = useMemo(()=>{
    if (!data.length) return [];
    // Ensure starting on Sunday column for nicer layout
    const result: Item[][] = [];
    let week: Item[] = [];
    for (const item of data) {
      const dow = new Date(item.date + "T00:00:00").getDay();
      week[dow] = item;
      if (dow === 6) { // Saturday end
        result.push(week);
        week = [];
      }
    }
    if (week.length) result.push(week);
    return result;
  }, [data]);

  function color(count: number){
    if (count === 0) return "#E5E7EB";
    if (count === 1) return "#C7D2FE";
    if (count <= 3) return "#93C5FD";
    if (count <= 6) return "#60A5FA";
    return "#3B82F6";
  }

  return (
    <div className="flex gap-2 items-start">
      <div className="grid grid-cols-1 gap-1 text-[10px] text-gray-500 mt-4">
        <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-1">
          {grid.map((week, wi) => (
            <div key={wi} className="grid grid-rows-7 gap-1">
              {[0,1,2,3,4,5,6].map((d)=> {
                const item = week[d];
                const c = item ? color(item.count) : "#F3F4F6";
                const title = item ? `${item.date}: ${item.count}` : "";
                return <div key={d} title={title} className="w-3 h-3 md:w-4 md:h-4 rounded" style={{ backgroundColor: c }} />;
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="text-[10px] text-gray-500 ml-2 mt-4">Last {days} days</div>
    </div>
  );
}
