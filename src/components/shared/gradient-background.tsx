export function GradientBackground() {
	return (
		<div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
			<div className="absolute -left-[20%] -top-[30%] h-[500px] w-[500px] animate-morphBlob1 rounded-full bg-purple/20 blur-[100px]" />
			<div className="absolute -right-[10%] top-[10%] h-[400px] w-[400px] animate-morphBlob2 rounded-full bg-purple-light/15 blur-[80px]" />
			<div className="absolute bottom-[10%] left-[30%] h-[350px] w-[350px] animate-morphBlob3 rounded-full bg-purple/10 blur-[90px]" />
		</div>
	);
}
