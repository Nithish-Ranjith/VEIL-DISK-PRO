import React from 'react';
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';

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
    const data = generateChartData(currentHealth, daysToFailure);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const point = payload[0].payload;

            if (point.isFailurePoint) {
                return (
                    <div className="bg-[#DC2626]/95 border border-red-200/30 text-center p-4 rounded-xl shadow-2xl backdrop-blur-sm">
                        <div className="text-3xl mb-2">⚠️</div>
                        <div className="text-2xl font-bold text-white mb-1">{daysToFailure} Days</div>
                        <div className="text-sm text-white/90">Predicted Failure</div>
                    </div>
                );
            }

            return (
                <div className="bg-[#0F172A]/95 border border-slate-400/30 p-3 rounded-xl shadow-xl backdrop-blur-sm">
                    <div className="text-xs text-slate-400 mb-1">{point.date}</div>
                    <div className="text-base font-semibold text-slate-100 mb-1">Health: {point.health}%</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                        {point.type === 'predicted' ? '📊 Forecast' : '📈 Historical'}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="card h-full flex flex-col p-5 relative overflow-hidden">
            {/* Background enhancement */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-900/5 to-transparent pointer-events-none"></div>

            <div className="flex justify-between items-start mb-6 z-10">
                <div>
                    <h3 className="text-lg font-bold text-gray-100 tracking-tight">AI Health Timeline</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">Predictive analysis based on write amplification trends</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-800/50 px-2 py-1 rounded border border-white/5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Historical
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-800/50 px-2 py-1 rounded border border-white/5">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Forecast
                    </span>
                </div>
            </div>

            <div className="flex-1 w-full min-h-0 z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorPrediction" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />

                        <XAxis
                            dataKey="date"
                            stroke="#475569"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={40}
                            dy={10}
                        />
                        <YAxis
                            stroke="#475569"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, 100]}
                            ticks={[0, 25, 50, 75, 100]}
                        />

                        {/* Critical Zone (bottom) */}
                        <ReferenceArea
                            y1={0}
                            y2={40}
                            fill="#DC2626"
                            fillOpacity={0.03}
                        />
                        <ReferenceLine
                            y={40}
                            stroke="#DC2626"
                            strokeDasharray="4 4"
                            strokeOpacity={0.3}
                            label={{
                                value: '- CRITICAL -',
                                position: 'right',
                                fill: '#DC2626',
                                fontSize: 9,
                                fontWeight: 800,
                                offset: 10,
                                opacity: 0.7
                            }}
                        />

                        {/* Safe Zone Annotations */}
                        <ReferenceLine
                            y={85}
                            stroke="#10B981"
                            strokeDasharray="0"
                            strokeOpacity={0.0}
                            label={{
                                value: 'SAFE - ZONE',
                                position: 'insideTopRight',
                                fill: '#10B981',
                                fontSize: 9,
                                fontWeight: 800,
                                opacity: 0.6,
                                dx: -10
                            }}
                        />

                        {/* Historical Area (Blue) */}
                        <Area
                            type="monotone"
                            dataKey="health"
                            stroke="#3B82F6"
                            strokeWidth={3}
                            fill="url(#colorHealth)"
                            data={data.filter(d => d.type === 'historical')}
                            isAnimationActive={true}
                            animationDuration={1500}
                        />

                        {/* Predicted Area (Orange) */}
                        <Line
                            type="monotone"
                            dataKey="health"
                            stroke="#F97316"
                            strokeWidth={3}
                            strokeDasharray="4 4"
                            dot={(props) => {
                                if (props.payload.isFailurePoint) {
                                    return (
                                        <g key={props.key}>
                                            <line x1={props.cx} y1={props.cy} x2={props.cx} y2={props.cy + 150} stroke="#DC2626" strokeWidth={1} strokeDasharray="2 2" opacity={0.5} />
                                            <circle cx={props.cx} cy={props.cy} r={4} fill="#DC2626" stroke="#fff" strokeWidth={1.5} className="animate-ping" opacity={0.5} />
                                            <circle cx={props.cx} cy={props.cy} r={4} fill="#DC2626" stroke="#fff" strokeWidth={1.5} />
                                        </g>
                                    );
                                }
                                return null;
                            }}
                            data={data.filter(d => d.type === 'predicted')}
                            isAnimationActive={true}
                            animationDuration={1500}
                            animationBegin={1000}
                        />

                        {/* Highlight Badge for Prediction */}
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default HealthTimelineChart;
