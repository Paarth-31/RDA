// // // import { Logo } from './Logo';

// // // export const Navbar = () => {
// // //   return (
// // //     // Changed: Added 'border-b', background color, and removed 'max-w-6xl mx-auto' to stretch it full width
// // //     <nav className="w-full flex items-center justify-between px-20 py-4 border-b border-white/10 bg-slate-950/50 backdrop-blur-md relative z-20">
      
// // //       {/* Left Side: Logo & Status */}
// // //       <div className="flex items-center gap-4">
// // //         <Logo className="w-32 md:w-40 h-auto" /> 
        
// // //         {/* Vertical Divider */}
// // //         <div className="h-6 w-[1px] bg-white/10 mx-2 hidden md:block"></div>
        
// // //         {/* Status Badge */}
// // //         <div className="hidden md:flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/5">
// // //           <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
// // //           <span className="font-mono text-xs text-gray-400">SYSTEM ONLINE</span>
// // //         </div>
// // //       </div>

// // //       {/* Right Side: Version Tag */}
// // //       <div className="text-xs font-mono text-gray-600 border border-border px-3 py-1 rounded-full hover:bg-white/5 transition-colors cursor-default">
// // //         v1.0.0-beta
// // //       </div>
// // //     </nav>
// // //   );
// // // };



// // // frontend/src/components/Navbar.tsx
// // import { Logo } from './Logo';

// // export const Navbar = () => {
// //   return (
// //     <nav className="w-full flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/50 backdrop-blur-md relative z-20">
      
// //       {/* LEFT: Logo & Status */}
// //       <div className="flex items-center gap-6">
// //         <Logo className="w-32 md:w-36 h-auto cursor-pointer hover:opacity-80 transition-opacity" />
        
// //         {/* Navigation Links - Hidden on Mobile */}
// //         <div className="hidden lg:flex items-center gap-6 ml-4">
// //           <a href="#" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Documentation</a>
// //           <a href="#" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Network Status</a>
// //           <a href="https://github.com" target="_blank" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">GitHub</a>
// //         </div>
// //       </div>

// //       {/* RIGHT: Status & Actions */}
// //       <div className="flex items-center gap-4">
// //         {/* Status Badge */}
// //         <div className="hidden md:flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
// //           <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
// //           <span className="font-mono text-[10px] uppercase tracking-widest text-gray-400">System Online</span>
// //         </div>

// //         {/* Action Button */}
// //         <button className="px-4 py-2 bg-white text-black text-xs font-bold rounded-lg hover:bg-gray-200 transition-all active:scale-95">
// //           Give Feedback
// //         </button>

// //         {/* Version (Now smaller and more subtle) */}
// //         <div className="hidden sm:block text-[10px] font-mono text-gray-600 px-2">
// //           v1.0-BETA
// //         </div>
// //       </div>
// //     </nav>
// //   );
// // };



// import { Logo } from './Logo';

// export const Navbar = () => {
//   return (
//     // Uses 'bg-background' (Pure Black) and 'border-border' (Subtle Gray) from your index.css
//     <nav className="w-full flex items-center justify-between px-8 py-4 border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-50">
      
//       {/* LEFT SIDE */}
//       <div className="flex items-center gap-10">
//         <Logo className="w-32 h-auto" />
        
//         <div className="hidden md:flex items-center gap-6">
//           {/* 'text-muted-foreground' makes the links look like the Discord/Vercel ones */}
//           <a href="#" className="text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors">
//             Documentation
//           </a>
//           <a href="#" className="text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors">
//             Network Status
//           </a>
//           <a href="#" className="text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors">
//             GitHub
//           </a>
//         </div>
//       </div>

//       {/* RIGHT SIDE */}
//       <div className="flex items-center gap-5">
        
//         {/* The System Live Pill */}
//         <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-border">
//           <span className="relative flex h-1.5 w-1.5">
//             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
//             <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
//           </span>
//           <span className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase">
//             System Live
//           </span>
//         </div>

//         {/* The Feedback Button - Now uses 'bg-primary' (The Linear Purple) */}
//         <button className="px-4 py-1.5 bg-primary text-primary-foreground text-[12px] font-bold rounded-md hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/10">
//           Give Feedback
//         </button>

//         <span className="hidden lg:block text-[10px] font-mono text-muted-foreground/30 tracking-tighter">
//           v1.0-BETA
//         </span>
//       </div>
//     </nav>
//   );
// };



import { Monitor, User } from "lucide-react";

export const Navbar = () => (
  <nav className="w-full flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
    <div className="flex items-center gap-8">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
          <Monitor className="text-primary w-5 h-5" />
        </div>
        <span className="text-xl font-bold tracking-tighter text-white">
          StreamLink<span className="text-primary">.</span>
        </span>
      </div>
      <div className="hidden lg:flex items-center gap-8">
        {["News", "Favorites", "Recent Sessions", "Discovered", "Invitations"].map((item) => (
          <div key={item} className="relative group cursor-pointer">
            <span className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${item === "Favorites" ? "text-white" : "text-muted-foreground hover:text-white"}`}>
              {item}
            </span>
            {/* The Cyan Underline for "Favorites" */}
            {item === "Favorites" && <div className="absolute -bottom-6 left-0 w-full h-[2px] bg-primary shadow-[0_0_10px_cyan]" />}
          </div>
        ))}
      </div>
    </div>
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_cyan]" />
        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">System Live</span>
      </div>
      <div className="flex items-center gap-2">
         <span className="text-[10px] font-mono text-muted-foreground">v1.0 PRE-E</span>
         <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-white/10">
            <User className="w-4 h-4 text-white" />
         </div>
      </div>
    </div>
  </nav>
);