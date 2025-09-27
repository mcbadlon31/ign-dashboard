
"use client";
import { useEffect } from "react";
import { postWithQueue, flushQueue } from "@/lib/offlineQueue";

export default function FetchShim(){
  useEffect(()=>{
    const orig = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      try {
        const url = typeof input === 'string' ? input : (input as URL).toString();
        if (init?.method === 'POST' && url.includes('/api/')) {
          const body = init.body ? (typeof init.body === 'string' ? init.body : JSON.stringify(init.body)) : '{}';
          try {
            const parsed = JSON.parse(body);
            const r = await postWithQueue(url, parsed, Object.assign({}, init.headers||{} as any, { 'X-IGN-OFFLINE-REPLAY': '0' }));
            return r as any;
          } catch {
            // non-JSON body: just try normal fetch
            return await orig(input as any, init);
          }
        }
        return await orig(input as any, init);
      } catch (e) {
        return await orig(input as any, init);
      }
    };
    (window as any).flushOfflineQueue = flushQueue;
  }, []);
  return null;
}
