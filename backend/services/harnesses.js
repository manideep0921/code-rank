// backend/services/harnesses.js
export function buildHarness(language, problemSlug) {
  // per-problem stdin parsing + call site + print
  const map = {
    "sum-two-ints": {
      py: `
import sys
def _read():
    data=sys.stdin.read().strip().split()
    return int(data[0]), int(data[1])
if __name__=="__main__":
    a,b=_read()
    print(solve(a,b))
`.trim(),
      js: `
const fs = require('fs');
const data = fs.readFileSync(0,'utf8').trim().split(/\\s+/);
const a = parseInt(data[0],10), b = parseInt(data[1],10);
console.log(String(solve(a,b)));
`.trim(),
    },

    "find-factorial": {
      py: `
import sys
if __name__=="__main__":
    n = int(sys.stdin.read().strip() or "0")
    print(solve(n))
`.trim(),
      js: `
const fs = require('fs');
const n = parseInt(fs.readFileSync(0,'utf8').trim()||"0",10);
console.log(String(solve(n)));
`.trim(),
    },

    "palindrome-check": {
      py: `
import sys
if __name__=="__main__":
    s = sys.stdin.read().strip()
    print(str(bool(solve(s))).lower())
`.trim(),
      js: `
const fs = require('fs');
const s = fs.readFileSync(0,'utf8').trim();
console.log(String(!!solve(s)).toLowerCase());
`.trim(),
    },
  };

  const key = problemSlug;
  const isPy = language === "python";
  const isJs = language === "javascript";
  if (!map[key]) throw new Error("Harness missing for problem: " + key);
  return isPy ? map[key].py : map[key].js;
}
