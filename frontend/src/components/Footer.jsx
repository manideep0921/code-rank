import React from "react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-700 mt-12 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
      © {new Date().getFullYear()} <span className="text-indigo-600 dark:text-indigo-400 font-semibold">CodeRank</span>. All rights reserved.
    </footer>
  );
}
