export default function GlowBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-[#2B0A3D] rounded-full blur-[100px] opacity-60"></div>
      <div className="absolute bottom-[10%] right-[-10%] w-[600px] h-[600px] bg-[#160027] rounded-full blur-[120px] opacity-70"></div>
      <div className="absolute top-[40%] left-[-10%] w-[300px] h-[300px] bg-[#7aff88]/5 rounded-full blur-[80px]"></div>
    </div>
  );
}
