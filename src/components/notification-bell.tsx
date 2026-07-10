"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/actions/notifications";
import { formatDistanceToNow } from "date-fns";

type NotificationItem = {
  id: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

export function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: NotificationItem[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100"
        aria-label="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0 25.057 25.057 0 01-4.496 0z" clipRule="evenodd" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-md border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
            <span className="text-sm font-medium text-slate-700">Notifications</span>
            {unreadCount > 0 && (
              <button
                disabled={isPending}
                onClick={() => startTransition(() => markAllNotificationsRead())}
                className="text-xs text-blue-600 hover:underline disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-slate-400">No notifications yet.</p>
            )}
            {notifications.map((n) => (
              <Link
                key={n.id}
                href={n.link ?? "#"}
                onClick={() => {
                  setOpen(false);
                  if (!n.read) startTransition(() => markNotificationRead(n.id));
                }}
                className={`block border-b border-slate-50 px-3 py-2 text-sm hover:bg-slate-50 ${
                  n.read ? "text-slate-500" : "bg-blue-50/60 font-medium text-slate-800"
                }`}
              >
                <p className="line-clamp-2">{n.message}</p>
                <p className="mt-0.5 text-xs font-normal text-slate-400">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
