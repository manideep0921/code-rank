import React from "react";
export default class ErrorBoundary extends React.Component {
  constructor(p){ super(p); this.state={hasError:false,err:null}; }
  static getDerivedStateFromError(error){ return {hasError:true,err:error}; }
  componentDidCatch(error,info){ console.error("[ErrorBoundary]", error, info); }
  render(){
    if(this.state.hasError){
      return (
        <div className="p-6">
          <h1 className="text-xl font-semibold text-red-400">Something went wrong.</h1>
          <pre className="mt-3 p-3 bg-zinc-900 border border-zinc-800 rounded text-xs overflow-auto">{String(this.state.err)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
