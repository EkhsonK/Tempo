import React from 'react';

interface ChartData {
    label: string;
    value: number;
    color: string;
}

interface DoughnutChartProps {
    data: ChartData[];
}

const DoughnutChart: React.FC<DoughnutChartProps> = ({ data }) => {
    const totalValue = data.reduce((sum, item) => sum + item.value, 0);
    const radius = 85; // Slightly larger for a thinner look
    const circumference = 2 * Math.PI * radius;
    const strokeWidth = 18; // Thinner, more elegant stroke

    let accumulatedAngle = 0;

    // Empty State
    if (totalValue === 0) {
        return (
            <div className="relative w-full h-full flex items-center justify-center">
                <svg viewBox="0 0 200 200" className="w-full h-full">
                    <circle cx="100" cy="100" r={radius} fill="transparent" stroke="currentColor" strokeOpacity="0.1" strokeWidth={strokeWidth} className="text-brand-text-primary" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-brand-text-secondary opacity-50">0%</span>
                </div>
            </div>
        );
    }
    
    // Sort data so largest segments are rendered first/predictably if needed, 
    // but usually preserving order is better for color consistency.
    
    return (
        <div className="relative w-full h-full">
            <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                {/* Track Background */}
                <circle cx="100" cy="100" r={radius} fill="transparent" stroke="currentColor" strokeOpacity="0.05" strokeWidth={strokeWidth} className="text-brand-text-primary" />
                
                {data.map((item, index) => {
                    const arcLength = (item.value / totalValue) * circumference;
                    // Add a tiny gap between segments by subtracting slightly from arcLength
                    const gap = totalValue > 1 ? 4 : 0; 
                    const drawLength = Math.max(0, arcLength - gap);
                    
                    const offset = (accumulatedAngle / totalValue) * circumference;
                    accumulatedAngle += item.value;

                    return (
                        <circle
                            key={index}
                            cx="100"
                            cy="100"
                            r={radius}
                            fill="transparent"
                            stroke={item.color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={`${drawLength} ${circumference}`}
                            strokeDashoffset={-offset}
                            strokeLinecap="round" 
                            className="transition-all duration-1000 ease-out"
                        />
                    );
                })}
            </svg>
            
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-extrabold text-brand-text-primary leading-none">{totalValue}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary mt-1">Задач</span>
            </div>
        </div>
    );
};

export default DoughnutChart;