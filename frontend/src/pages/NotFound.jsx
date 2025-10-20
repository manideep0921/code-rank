// src/pages/NotFound.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="h-[60vh] flex items-center justify-center text-center">
      <div>
        <div className="text-3xl font-semibold">404</div>
        <div className="text-zinc-400 mt-2">
          The page you&apos;re looking for doesn&apos;t exist.
        </div>
        <Link
          to="/"
          className="inline-block mt-4 underline text-violet-400 hover:text-violet-300"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
