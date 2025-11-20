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
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const strokeWidth = 25;

    let accumulatedAngle = 0;

    if (totalValue === 0) {
        return (
            <svg viewBox="0 0 200 200" className="w-full h-full">
                <circle cx="100" cy="100" r={radius} fill="transparent" stroke="var(--brand-gray-700)" strokeWidth={strokeWidth} />
                <text x="50%" y="50%" textAnchor="middle" dy=".3em" fontSize="30" fill="var(--brand-text-secondary)" className="font-bold">0</text>
            </svg>
        );
    }
    
    return (
        <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
            <circle cx="100" cy="100" r={radius} fill="transparent" stroke="var(--brand-gray-700)" strokeWidth={strokeWidth} />
            {data.map((item, index) => {
                const arcLength = (item.value / totalValue) * circumference;
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
                        strokeDasharray={`${arcLength} ${circumference}`}
                        strokeDashoffset={-offset}
                        className="transition-all duration-500"
                    >
                        <title>{`${item.label}: ${item.value}`}</title>
                    </circle>
                );
            })}
             <text x="50%" y="50%" textAnchor="middle" dy=".3em" fontSize="30" fill="var(--brand-text-primary)" className="font-bold transform rotate-90 origin-center">{totalValue}</text>
        </svg>
    );
};

export default DoughnutChart;
