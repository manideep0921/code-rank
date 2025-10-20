import React from "react";

export default function About() {
  return (
    <div className="p-8 space-y-6 max-w-2xl mx-auto text-zinc-300">
      <h1 className="text-2xl font-semibold text-white">About CodeRank</h1>
      <p>
        CodeRank is a gamified coding platform that helps you improve your
        problem-solving skills through hands-on coding challenges.
      </p>
      <p>
        Earn XP, unlock badges, and level up as you solve problems in different
        languages. Designed for both beginners and advanced coders, CodeRank
        combines competitive coding and learning in a clean, focused interface.
      </p>
      <p className="text-zinc-500">
        © {new Date().getFullYear()} CodeRank. All rights reserved.
      </p>
    </div>
  );
}
