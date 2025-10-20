import React from "react";
import { Link } from "react-router-dom";

export default function Help() {
  return (
    <div className="p-8 space-y-6 max-w-2xl mx-auto text-zinc-300">
      <h1 className="text-2xl font-semibold text-white">Help & Support</h1>
      <p>
        Stuck somewhere? Here are some common questions and quick solutions.
      </p>

      <ul className="space-y-3 list-disc list-inside">
        <li>
          <b>How do I earn XP?</b><br />
          Solve coding problems! Each problem awards XP based on difficulty.
        </li>
        <li>
          <b>How are levels calculated?</b><br />
          Levels increase every 100 XP. For example, 200 XP = Level 3.
        </li>
        <li>
          <b>My code isn’t running?</b><br />
          Check if your function matches the required name and parameters.
        </li>
        <li>
          <b>Need more help?</b><br />
          Contact us at{" "}
          <a href="mailto:support@coderank.io" className="text-violet-400">
            support@coderank.io
          </a>
        </li>
      </ul>

      <Link to="/" className="text-violet-400 underline">
        Go Home
      </Link>
    </div>
  );
}
