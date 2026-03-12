"use client";

interface ChartProps {
	data: { date: string; count: number }[];
	label: string;
}

export function SignupChart({ data, label }: ChartProps) {
	if (!data || data.length === 0) {
		return (
			<div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
				No {label.toLowerCase()} data yet
			</div>
		);
	}

	const maxCount = Math.max(...data.map((d) => d.count), 1);

	return (
		<div>
			<div className="flex items-end gap-[2px] h-48">
				{data.map((d) => (
					<div
						key={d.date}
						className="group relative flex-1 min-w-[4px]"
						style={{ height: "100%" }}
					>
						<div
							className="absolute bottom-0 w-full rounded-t bg-primary/80 hover:bg-primary transition-colors"
							style={{ height: `${(d.count / maxCount) * 100}%`, minHeight: d.count > 0 ? "2px" : "0" }}
						/>
						<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-md whitespace-nowrap z-10">
							{d.date}: {d.count}
						</div>
					</div>
				))}
			</div>
			<div className="mt-2 flex justify-between text-xs text-muted-foreground">
				<span>{data[0]?.date}</span>
				<span>{data[data.length - 1]?.date}</span>
			</div>
		</div>
	);
}
