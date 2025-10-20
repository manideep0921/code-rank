import React from "react";
export default function Card3D({ className="", children }){
  const [rot, setRot] = React.useState({rx:0, ry:0});
  const ref = React.useRef(null);
  const onMove = e => {
    const el = ref.current; if(!el) return;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width/2)) / (r.width/2);
    const dy = (e.clientY - (r.top + r.height/2)) / (r.height/2);
    setRot({ rx: dy*6, ry: dx*8 });
  };
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={()=>setRot({rx:0,ry:0})}
      className={`rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 ${className}`}
      style={{ transform:`rotateX(${rot.rx}deg) rotateY(${rot.ry}deg)`, transition:"transform .15s ease" }}>
      {children}
    </div>
  );
}
