import React from "react";

/** Hero with logo parallax/tilt + soft glow */
export default function Hero3D({
  title="Welcome to",
  brand="CodeRank",
  subtitle="Practice coding challenges, earn XP, level up your skills, and climb the leaderboard.",
  logo="/logo.png",
  cta="Start Coding",
  onCta
}){
  const frame = React.useRef(null);
  const [rot, setRot] = React.useState({rx:0, ry:0});
  const onMove = (e) => {
    const el = frame.current; if(!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width/2, cy = r.top + r.height/2;
    const dx = (e.clientX - cx) / (r.width/2);
    const dy = (e.clientY - cy) / (r.height/2);
    setRot({ rx: dy*8, ry: dx*12 });
  };
  return (
    <div className="relative mx-auto max-w-3xl mt-16 text-center animate-pop">
      <div className="absolute -inset-40 bg-[radial-gradient(circle_at_center,rgba(124,58,237,.18),transparent_60%)] pointer-events-none"></div>
      <div ref={frame} onMouseMove={onMove} onMouseLeave={()=>setRot({rx:0,ry:0})} style={{perspective:"1000px"}}>
        <div className="inline-block will-change-transform"
             style={{ transform:`rotateX(${rot.rx}deg) rotateY(${rot.ry}deg)`}}>
          <img src={logo} alt="CodeRank" className="mx-auto h-28 w-28 object-contain glow-lg" />
        </div>
      </div>
      <h1 className="mt-6 text-3xl sm:text-4xl font-extrabold">
        <span className="text-zinc-200">{title} </span>
        <span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">{brand}</span>
      </h1>
      {subtitle && <p className="mt-2 text-zinc-400">{subtitle}</p>}
      <button onClick={onCta} className="btn-3d mt-6 px-5 py-2 rounded-xl bg-violet-600 text-white hover:brightness-110">
        {cta}
      </button>
    </div>
  );
}
