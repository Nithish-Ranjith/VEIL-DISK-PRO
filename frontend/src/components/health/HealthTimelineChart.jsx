import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';

// Generate data: historical + predicted
const generateChartData = (healthScore, daysToFailure) => {
    const data = [];
    const today = new Date();

    // Historical data (last 60 days)
    for (let i = 60; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // Gradual decline in health
        const health = 100 - ((60 - i) * (100 - healthScore) / 60);

        data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            health: Math.round(health),
            type: 'historical'
        });
    }

    // Predicted data (next 90 days or until failure)
    const predictionDays = Math.min(daysToFailure + 10, 90);
    for (let i = 1; i <= predictionDays; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);

        // Accelerating decline
        const declineRate = i / daysToFailure;
        const predictedHealth = healthScore * (1 - declineRate);

        data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            health: Math.max(0, Math.round(predictedHealth)),
            type: 'predicted',
            isFailurePoint: i === daysToFailure
        });
    }

    return data;
};

const HealthTimelineChart = ({ currentHealth = 68, daysToFailure = 62 }) => {
    const data = generateChartData(currentHealth, daysToFailure || 62);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const point = payload[0].payload;

            if (point.isFailurePoint) {
                return (
                    <div className="custom-tooltip failure-tooltip">
                        <div className="tooltip-icon">⚠️</div>
                        <div className="tooltip-title">{daysToFailure} Days</div>
                        <div className="tooltip-subtitle">Predicted Failure</div>
                    </div>
                );
            }

            return (
                <div className="custom-tooltip">
                    <div className="tooltip-date">{point.date}</div>
                    <div className="tooltip-health">Health: {point.health}%</div>
                    <div className="tooltip-type">
                        {point.type === 'predicted' ? '📊 Forecast' : '📈 Historical'}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="health-timeline-card bg-transparent h-full w-full flex flex-col p-4">
            <div className="card-header flex justify-between items-center mb-4 bg-transparent border-none p-0">
                <h3 className="text-lg font-bold text-gray-100">AI Health Timeline</h3>
                <button className="card-menu text-gray-500 hover:text-white transition-colors">⋯</button>
            </div>

            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 20, right: 40, left: -20, bottom: 0 }}>
                        {/* Grid */}
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />

                        {/* Axes */}
                        <XAxis
                            dataKey="date"
                            stroke="#64748B"
                            fontSize={12}
                            interval="preserveStartEnd"
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke="#64748B"
                            fontSize={12}
                            domain={[0, 100]}
                            tickLine={false}
                            axisLine={false}
                        />

                        {/* Safe Zone (top) */}
                        <ReferenceArea
                            y1={75}
                            y2={100}
                            fill="#10B981"
                            fillOpacity={0.1}
                        />
                        <ReferenceLine
                            y={75}
                            stroke="transparent"
                            label={{
                                value: 'SAFE - ZONE',
                                position: 'insideTopRight',
                                fill: '#10B981',
                                fontSize: 12,
                                fontWeight: 600,
                                dx: -10
                            }}
                        />

                        {/* Critical Zone (bottom) */}
                        <ReferenceArea
                            y1={0}
                            y2={35}
                            fill="#DC2626"
                            fillOpacity={0.1}
                        />
                        <ReferenceLine
                            y={35}
                            stroke="#DC2626"
                            strokeDasharray="5 5"
                            label={{
                                value: 'CRITICAL',
                                position: 'insideBottomRight',
                                fill: '#DC2626',
                                fontSize: 12,
                                fontWeight: 600,
                                dx: -10
                            }}
                        />

                        {/* Critical Badge on right side */}
                        {/* Use standard text coordinate relative to SVG if needed, but recharts ReferenceLine label works */}

                        {/* Historical Line (Blue) */}
                        <Line
                            type="monotone"
                            dataKey="health"
                            stroke="#3B82F6"
                            strokeWidth={3}
                            dot={false}
                            data={data.filter(d => d.type === 'historical')}
                            isAnimationActive={true}
                        />

                        {/* Predicted Line (Orange/Red gradient) */}
                        <Line
                            type="monotone"
                            dataKey="health"
                            stroke="#F97316"
                            strokeWidth={3}
                            strokeDasharray="5 5"
                            dot={(props) => {
                                if (props.payload.isFailurePoint) {
                                    return (
                                        <g key={props.key}>
                                            {/* Failure marker */}
                                            <circle
                                                cx={props.cx}
                                                cy={props.cy}
                                                r={8}
                                                fill="#DC2626"
                                                stroke="#FEE2E2"
                                                strokeWidth={3}
                                            />
                                            {/* Vertical line to bottom */}
                                            <line
                                                x1={props.cx}
                                                y1={props.cy}
                                                x2={props.cx}
                                                y2={props.cy + 100}
                                                stroke="#DC2626"
                                                strokeWidth={2}
                                                strokeDasharray="3 3"
                                            />
                                        </g>
                                    );
                                }
                                return null;
                            }}
                            data={data.filter(d => d.type === 'predicted')}
                            isAnimationActive={true}
                        />

                        <Tooltip content={<CustomTooltip />} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default HealthTimelineChart;
