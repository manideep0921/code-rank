// backend/routes/problemDetail.js
import express from "express";
import pool from "../config/db.js";

const router = express.Router();

/**
 * Problem metadata (statement, samples, starters)
 * Keep I/O SIMPLE (stdin -> stdout) to align with your run/judge.
 * Keys must match the `slug` column in DB.
 */
const META = {
  // ===== existing =====
  "print-hello": {
    statement: `Print "Hello, CodeRank!" to stdout.`,
    samples: [{ input: "", output: "Hello, CodeRank!" }],
    starters: {
      javascript: `// Print "Hello, CodeRank!"
console.log("Hello, CodeRank!");`,
      python: `# Print "Hello, CodeRank!"
print("Hello, CodeRank!")`,
    },
  },
  "sum-two-ints": {
    statement: `Read two integers from stdin and print their sum.`,
    samples: [{ input: "3 4", output: "7" }],
    starters: {
      javascript: `// Read two ints and print sum
const fs = require("fs");
const [a,b] = fs.readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
console.log(a + b);`,
      python: `# Read two ints and print sum
import sys
a,b = map(int, sys.stdin.read().strip().split())
print(a+b)`,
    },
  },
  "find-factorial": {
    statement: `Given n (0 ≤ n ≤ 12), print n!`,
    samples: [{ input: "5", output: "120" }],
    starters: {
      javascript: `const fs = require("fs");
const n = parseInt(fs.readFileSync(0, "utf8").trim(), 10);
function fact(x){ return x<=1 ? 1 : x*fact(x-1); }
console.log(fact(n));`,
      python: `import sys
n=int(sys.stdin.read().strip())
def fact(x): return 1 if x<=1 else x*fact(x-1)
print(fact(n))`,
    },
  },
  "palindrome-check": {
    statement: `Given a string s, print "YES" if it is a palindrome, else "NO".`,
    samples: [{ input: "madam", output: "YES" }, { input: "coderank", output: "NO" }],
    starters: {
      javascript: `const fs = require("fs");
const s = fs.readFileSync(0, "utf8").trim();
const t = s.split("").reverse().join("");
console.log(s === t ? "YES" : "NO");`,
      python: `import sys
s=sys.stdin.read().strip()
print("YES" if s==s[::-1] else "NO")`,
    },
  },
  "two-sum": {
    statement: `Given n and array nums, then target, print two indices i j (0-based) such that nums[i]+nums[j]=target.`,
    samples: [{ input: "4\n2 7 11 15\n9", output: "0 1" }],
    starters: {
      javascript: `const fs = require("fs");
const data = fs.readFileSync(0,"utf8").trim().split(/\\s+/).map(Number);
let i=0,n=data[i++], nums=data.slice(i,i+n); i+=n; const target=data[i];
const seen=new Map();
for(let j=0;j<nums.length;j++){
  const need = target-nums[j];
  if(seen.has(need)){ console.log(seen.get(need), j); process.exit(0); }
  seen.set(nums[j], j);
}`,
      python: `import sys
it = iter(list(map(int, sys.stdin.read().strip().split())))
n = next(it)
nums = [next(it) for _ in range(n)]
target = next(it)
seen={}
for j,x in enumerate(nums):
    need = target-x
    if need in seen:
        print(seen[need], j)
        break
    seen[x]=j`,
    },
  },

  // ===== NEW easy =====
  "reverse-string": {
    statement: `Read a string s and print its reverse.`,
    samples: [{ input: "hello", output: "olleh" }],
    starters: {
      javascript: `const fs = require("fs");
const s = fs.readFileSync(0,"utf8").trim();
console.log(s.split("").reverse().join(""));`,
      python: `import sys
s=sys.stdin.read().strip()
print(s[::-1])`,
    },
  },
  "fizz-buzz": {
    statement: `Given n, print numbers from 1..n. For multiples of 3 print "Fizz", of 5 print "Buzz", of 15 print "FizzBuzz". Otherwise print the number. Each on new line.`,
    samples: [{ input: "5", output: "1\n2\nFizz\n4\nBuzz" }],
    starters: {
      javascript: `const fs = require("fs");
const n = parseInt(fs.readFileSync(0,"utf8").trim(),10);
for(let i=1;i<=n;i++){
  let s="";
  if(i%3===0) s+="Fizz";
  if(i%5===0) s+="Buzz";
  console.log(s||i);
}`,
      python: `import sys
n=int(sys.stdin.read().strip())
for i in range(1,n+1):
    s=""
    if i%3==0: s+="Fizz"
    if i%5==0: s+="Buzz"
    print(s or i)`,
    },
  },
  "max-of-three": {
    statement: `Read three integers and print the maximum.`,
    samples: [{ input: "5 9 -1", output: "9" }],
    starters: {
      javascript: `const fs=require("fs");
const [a,b,c] = fs.readFileSync(0,"utf8").trim().split(/\\s+/).map(Number);
console.log(Math.max(a,b,c));`,
      python: `import sys
a,b,c=map(int,sys.stdin.read().strip().split())
print(max(a,b,c))`,
    },
  },
  "count-vowels": {
    statement: `Read a lowercase string and print the count of vowels (a,e,i,o,u).`,
    samples: [{ input: "banana", output: "3" }],
    starters: {
      javascript: `const fs=require("fs");
const s=fs.readFileSync(0,"utf8").trim();
const set = new Set(["a","e","i","o","u"]);
let cnt=0; for(const ch of s) if(set.has(ch)) cnt++;
console.log(cnt);`,
      python: `import sys
s=sys.stdin.read().strip()
print(sum(ch in "aeiou" for ch in s))`,
    },
  },
  "prime-check": {
    statement: `Read integer n (0≤n≤10^6). Print "YES" if prime else "NO".`,
    samples: [{ input: "7", output: "YES" }, { input: "12", output: "NO" }],
    starters: {
      javascript: `const fs=require("fs");
const n=parseInt(fs.readFileSync(0,"utf8").trim(),10);
function isPrime(x){
  if(x<2) return false;
  if(x%2===0) return x===2;
  for(let d=3; d*d<=x; d+=2) if(x%d===0) return false;
  return true;
}
console.log(isPrime(n)?"YES":"NO");`,
      python: `import sys, math
n=int(sys.stdin.read().strip())
def is_prime(x):
    if x<2: return False
    if x%2==0: return x==2
    d=3
    while d*d<=x:
        if x%d==0: return False
        d+=2
    return True
print("YES" if is_prime(n) else "NO")`,
    },
  },

  // ===== NEW medium =====
  "fibonacci-n": {
    statement: `Given n (0≤n≤40) print the nth Fibonacci number (f(0)=0,f(1)=1).`,
    samples: [{ input: "7", output: "13" }],
    starters: {
      javascript: `const fs=require("fs");
const n=parseInt(fs.readFileSync(0,"utf8").trim(),10);
function fib(k){ if(k<2) return k; let a=0,b=1; for(let i=2;i<=k;i++){ [a,b]=[b,a+b]; } return b; }
console.log(fib(n));`,
      python: `import sys
n=int(sys.stdin.read().strip())
def fib(k):
    if k<2: return k
    a,b=0,1
    for _ in range(2,k+1):
        a,b=b,a+b
    return b
print(fib(n))`,
    },
  },
  "gcd": {
    statement: `Read two integers a b and print gcd(a,b).`,
    samples: [{ input: "12 18", output: "6" }],
    starters: {
      javascript: `const fs=require("fs");
let [a,b]=fs.readFileSync(0,"utf8").trim().split(/\\s+/).map(Number);
function gcd(x,y){ while(y){ [x,y]=[y,x%y]; } return x; }
console.log(gcd(a,b));`,
      python: `import sys, math
a,b=map(int,sys.stdin.read().strip().split())
print(math.gcd(a,b))`,
    },
  },
  "anagram-check": {
    statement: `Read two lowercase strings s t. Print "YES" if t is an anagram of s else "NO".`,
    samples: [{ input: "listen\nsilent", output: "YES" }, { input: "abc\nabz", output: "NO" }],
    starters: {
      javascript: `const fs=require("fs");
const [s,t]=fs.readFileSync(0,"utf8").trim().split(/\\n/);
const sort = x => x.split("").sort().join("");
console.log(sort(s)===sort(t)?"YES":"NO");`,
      python: `import sys
s,t=sys.stdin.read().splitlines()
print("YES" if sorted(s)==sorted(t) else "NO")`,
    },
  },
  "balanced-parentheses": {
    statement: `Given a string with '()[]{}', print "YES" if brackets are balanced, else "NO".`,
    samples: [{ input: "()[]{}", output: "YES" }, { input: "([)]", output: "NO" }],
    starters: {
      javascript: `const fs=require("fs");
const s=fs.readFileSync(0,"utf8").trim();
const map = {")":"(","]":"[","}":"{"}; const st=[];
for(const ch of s){
  if("([{".includes(ch)) st.push(ch);
  else if(")]}".includes(ch)){
    if(st.pop()!==map[ch]) return console.log("NO");
  }
}
console.log(st.length===0?"YES":"NO");`,
      python: `import sys
s=sys.stdin.read().strip()
pair={')':'(',']':'[','}':'{'}
st=[]
for ch in s:
    if ch in '([{': st.append(ch)
    elif ch in ')]}':
        if not st or st.pop()!=pair[ch]:
            print("NO"); break
else:
    print("YES" if not st else "NO")`,
    },
  },
  "binary-search": {
    statement: `Input: n, array of n sorted ints, then target. Output index (0-based) or -1 if not found.`,
    samples: [{ input: "5\n1 3 5 7 9\n7", output: "3" }, { input: "3\n2 4 6\n5", output: "-1" }],
    starters: {
      javascript: `const fs=require("fs");
const data=fs.readFileSync(0,"utf8").trim().split(/\\s+/).map(Number);
let i=0,n=data[i++],a=data.slice(i,i+n); i+=n; const t=data[i];
let lo=0,hi=n-1,ans=-1;
while(lo<=hi){ const m=(lo+hi>>1); if(a[m]===t){ ans=m; break; } if(a[m]<t) lo=m+1; else hi=m-1; }
console.log(ans);`,
      python: `import sys
it=iter(map(int,sys.stdin.read().strip().split()))
n=next(it); a=[next(it) for _ in range(n)]; t=next(it)
lo,hi,ans=0,n-1,-1
while lo<=hi:
    m=(lo+hi)//2
    if a[m]==t: ans=m; break
    if a[m]<t: lo=m+1
    else: hi=m-1
print(ans)`,
    },
  },

  // ===== NEW hard =====
  "longest-substring-unique": {
    statement: `Given a string s, print the length of the longest substring without repeating characters.`,
    samples: [{ input: "abcabcbb", output: "3" }, { input: "bbbbb", output: "1" }, { input: "pwwkew", output: "3" }],
    starters: {
      javascript: `const fs=require("fs");
const s=fs.readFileSync(0,"utf8").trim();
const seen=new Map(); let l=0,ans=0;
for(let r=0;r<s.length;r++){
  const ch=s[r];
  if(seen.has(ch) && seen.get(ch)>=l) l=seen.get(ch)+1;
  seen.set(ch,r);
  if(r-l+1>ans) ans=r-l+1;
}
console.log(ans);`,
      python: `import sys
s=sys.stdin.read().strip()
pos={}
l=0; ans=0
for r,ch in enumerate(s):
    if ch in pos and pos[ch]>=l:
        l=pos[ch]+1
    pos[ch]=r
    ans=max(ans,r-l+1)
print(ans)`,
    },
  },
  "matrix-rotate-90": {
    statement: `Given n, then an n×n matrix (rows), rotate it 90° clockwise and print the matrix (space-separated rows on new lines).`,
    samples: [{ input: "3\n1 2 3\n4 5 6\n7 8 9", output: "7 4 1\n8 5 2\n9 6 3" }],
    starters: {
      javascript: `const fs=require("fs");
const data=fs.readFileSync(0,"utf8").trim().split(/\\s+/).map(Number);
let i=0,n=data[i++]; const a=[]; for(let r=0;r<n;r++){ a.push(data.slice(i,i+n)); i+=n; }
const b=Array.from({length:n},()=>Array(n).fill(0));
for(let r=0;r<n;r++) for(let c=0;c<n;c++) b[c][n-1-r]=a[r][c];
for(const row of b) console.log(row.join(" "));`,
      python: `import sys
it=iter(map(int,sys.stdin.read().strip().split()))
n=next(it); a=[[next(it) for _ in range(n)] for __ in range(n)]
b=[[0]*n for _ in range(n)]
for r in range(n):
    for c in range(n):
        b[c][n-1-r]=a[r][c]
for row in b:
    print(*row)`,
    },
  },
  "merge-intervals": {
    statement: `Given m followed by m intervals [l r] (inclusive), merge overlapping and print merged intervals each on new line "l r" sorted by l.`,
    samples: [{ input: "4\n1 3\n2 6\n8 10\n15 18", output: "1 6\n8 10\n15 18" }],
    starters: {
      javascript: `const fs=require("fs");
const data=fs.readFileSync(0,"utf8").trim().split(/\\s+/).map(Number);
let i=0,m=data[i++]; const arr=[];
for(let k=0;k<m;k++){ const l=data[i++], r=data[i++]; arr.push([l,r]); }
arr.sort((x,y)=>x[0]-y[0]);
const out=[];
for(const it of arr){
  if(!out.length || out[out.length-1][1] < it[0]) out.push([it[0],it[1]]);
  else out[out.length-1][1] = Math.max(out[out.length-1][1], it[1]);
}
for(const [l,r] of out) console.log(l, r);`,
      python: `import sys
it=iter(map(int,sys.stdin.read().strip().split()))
m=next(it); arr=[[next(it), next(it)] for _ in range(m)]
arr.sort()
out=[]
for l,r in arr:
    if not out or out[-1][1] < l:
        out.append([l,r])
    else:
        out[-1][1]=max(out[-1][1], r)
for l,r in out:
    print(l, r)`,
    },
  },
};

/* --- Built-in fallback problem (no DB record needed) --- */
const HELLO_FALLBACK = {
  id: 13,
  title: "Hello, CodeRank!",
  slug: "hello-coderank",
  difficulty: "easy",
  xp: 0,
  statement: 'Print the string "Hello, CodeRank!" to stdout.',
  samples: [{ input: "", output: "Hello, CodeRank!\n" }],
  starters: {
    python: 'print("Hello, CodeRank!")\n',
    javascript: 'console.log("Hello, CodeRank!");\n',
    java: `public class Main {
  public static void main(String[] args){
    System.out.println("Hello, CodeRank!");
  }
}
`,
    cpp: `#include <iostream>
int main(){ std::cout << "Hello, CodeRank!"; return 0; }
`,
  },
  constraints: [],
};

/**
 * GET /api/problemDetail/:idOrSlug
 * - Accepts numeric ID or slug
 * - Returns DB problem enriched with META (statement/samples/starters)
 * - Falls back to built-in "Hello, CodeRank!" if requested and not in DB
 */
router.get("/:idOrSlug", async (req, res) => {
  const { idOrSlug } = req.params;
  if (!idOrSlug) return res.status(400).json({ error: "Missing ID" });

  try {
    const isNumeric = /^\d+$/.test(idOrSlug);

    // Try DB by id or slug
    const query = isNumeric
      ? {
          text: "SELECT id, title, slug, difficulty, xp FROM public.problems WHERE id=$1",
          values: [Number(idOrSlug)],
        }
      : {
          text: "SELECT id, title, slug, difficulty, xp FROM public.problems WHERE slug=$1",
          values: [idOrSlug],
        };

    const { rows } = await pool.query(query);

    if (rows.length > 0) {
      const p = rows[0];
      const meta = META[p.slug] || {
        statement: "Problem statement coming soon.",
        samples: [],
        starters: { javascript: "// TODO", python: "# TODO" },
      };

      return res.json({
        id: p.id,
        title: p.title,
        slug: p.slug,
        difficulty: p.difficulty,
        xp: p.xp,
        statement: meta.statement,
        samples: meta.samples,
        starters: meta.starters,
        constraints: [], // placeholder for future fields
      });
    }

    // Fallback to built-in hello problem if explicitly requested
    if (idOrSlug === "13" || idOrSlug === "hello-coderank") {
      return res.json(HELLO_FALLBACK);
    }

    return res.status(404).json({ error: "Problem not found" });
  } catch (err) {
    console.error("[problemDetail] error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
