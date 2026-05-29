export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute inset-0 z-0">
        {/* Soft Teal Top-Left Glow */}
        <div className="absolute -top-[40%] -left-[20%] h-[80%] w-[80%] rounded-full bg-[radial-gradient(circle,_rgba(15,118,110,0.15)_0%,_transparent_70%)] blur-[80px]" />
        {/* Soft Indigo Bottom-Right Glow */}
        <div className="absolute -bottom-[30%] -right-[10%] h-[70%] w-[70%] rounded-full bg-[radial-gradient(circle,_rgba(59,130,246,0.1)_0%,_transparent_70%)] blur-[80px]" />
        {/* Elegant Dotted Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-[0.25]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-center">
        {children}
      </div>
    </main>
  );
}