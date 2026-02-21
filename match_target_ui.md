# INSTRUCTIONS TO MATCH TARGET UI EXACTLY
## SENTINEL-DISK Pro - Design Replication Guide

**GOAL: Make your UI look like the target screenshots**
**PRIORITY: CRITICAL - This is what wins hackathons**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## CHANGE #1: HEADER REDESIGN (HIGHEST IMPACT)

CURRENT (Your UI):
- Title in main area: "Health Monitor"
- No SanDisk branding
- No tagline

TARGET (What judges want to see):
┌────────────────────────────────────────────────────────────────┐
│ SanDisk | [●] Sentinel-DISK Pro          [A] Admin  🔔2  ⚙️  │
│             PREDICTIVE DRIVE HEALTH & OPTIMIZATION             │
├────────────────────────────────────────────────────────────────┤
│ 💙 Health Monitor  📦 Compression  ⏱ Life Extension  🎯 What-If│
├────────────────────────────────────────────────────────────────┤
│ [💾 SanDisk Extreme 1TB ▼]  [🔴 AT RISK]     [Backup Now →]  │
└────────────────────────────────────────────────────────────────┘

IMPLEMENTATION:

HTML Structure:
```jsx
<div className="app-header">
  {/* Top bar */}
  <div className="top-bar">
    <div className="brand">
      <span className="sandisk-logo">SanDisk</span>
      <span className="divider">|</span>
      <div className="product-name">
        <span className="icon">●</span>
        <span className="name">Sentinel-DISK <span className="pro">Pro</span></span>
      </div>
      <div className="tagline">PREDICTIVE DRIVE HEALTH & OPTIMIZATION</div>
    </div>
    
    <div className="top-nav">
      <button className="admin-btn">
        <span className="avatar">A</span> Admin ▼
      </button>
      <button className="notification-btn">
        🔔 <span className="badge">2</span>
      </button>
      <button className="settings-btn">⚙️</button>
    </div>
  </div>
  
  {/* Tab navigation */}
  <nav className="main-tabs">
    <a href="#health" className="tab active">
      <Heart /> Health Monitor
    </a>
    <a href="#compression" className="tab">
      <Package /> Compression Analytics
    </a>
    <a href="#extension" className="tab">
      <TrendingUp /> Life Extension
    </a>
    <a href="#simulator" className="tab">
      <Target /> What-If Simulator
    </a>
  </nav>
  
  {/* Drive selector bar */}
  <div className="drive-bar">
    <select className="drive-selector">
      <option>💾 SanDisk Extreme 1TB</option>
    </select>
    <span className="risk-badge at-risk">🔴 AT RISK</span>
    <button className="backup-btn primary">Backup Now →</button>
  </div>
</div>
```

CSS:
```css
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #0A0E1A;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sandisk-logo {
  font-size: 24px;
  font-weight: 700;
  color: #DC2626;  /* SanDisk red */
  letter-spacing: -0.5px;
}

.divider {
  color: rgba(255,255,255,0.2);
  font-size: 24px;
}

.product-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.product-name .icon {
  color: #3B82F6;
  font-size: 14px;
}

.product-name .name {
  font-size: 18px;
  font-weight: 600;
  color: #F1F5F9;
}

.product-name .pro {
  font-weight: 400;
  color: #94A3B8;
}

.tagline {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #64748B;
  position: absolute;
  top: 38px;
  left: 190px;
}

.top-nav {
  display: flex;
  gap: 16px;
}

.admin-btn,
.notification-btn,
.settings-btn {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 8px 16px;
  color: #E2E8F0;
  cursor: pointer;
  transition: all 0.2s;
}

.admin-btn:hover,
.notification-btn:hover,
.settings-btn:hover {
  background: rgba(255,255,255,0.1);
}

.notification-btn {
  position: relative;
}

.notification-btn .badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #DC2626;
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
}

.main-tabs {
  display: flex;
  gap: 8px;
  padding: 0 32px;
  background: rgba(255,255,255,0.02);
}

.tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  color: #94A3B8;
  text-decoration: none;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 500;
}

.tab:hover {
  color: #E2E8F0;
  background: rgba(255,255,255,0.05);
}

.tab.active {
  color: #3B82F6;
  border-bottom-color: #3B82F6;
  background: rgba(59, 130, 246, 0.1);
}

.drive-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 32px;
  background: rgba(255,255,255,0.02);
}

.drive-selector {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 8px 16px;
  color: #E2E8F0;
  font-size: 14px;
  min-width: 240px;
}

.risk-badge {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.risk-badge.at-risk {
  background: rgba(220, 38, 38, 0.2);
  color: #DC2626;
  border: 1px solid rgba(220, 38, 38, 0.4);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.backup-btn {
  margin-left: auto;
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  color: white;
  padding: 10px 24px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  transition: all 0.2s;
}

.backup-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## CHANGE #2: PREDICTIVE HEALTH TIMELINE CHART

This is THE MOST IMPORTANT VISUAL in your dashboard.

TARGET DESIGN:
- Blue line (historical data) → transitions to Orange/Red (prediction)
- Green "SAFE - ZONE" label at top of chart
- Red "CRITICAL" label at bottom
- Shaded danger zone below threshold
- Large tooltip showing "62 Days Predicted Failure"

RECHARTS IMPLEMENTATION:

```jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
         ResponsiveContainer, ReferenceLine, ReferenceArea, Label } from 'recharts';

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
    <div className="health-timeline-card">
      <div className="card-header">
        <h3>AI Health Timeline</h3>
        <button className="card-menu">⋯</button>
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 40, right: 40, left: 20, bottom: 20 }}>
          {/* Grid */}
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          
          {/* Axes */}
          <XAxis 
            dataKey="date" 
            stroke="#64748B"
            fontSize={12}
            interval="preserveStartEnd"
          />
          <YAxis 
            stroke="#64748B"
            fontSize={12}
            domain={[0, 100]}
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
              fontWeight: 600
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
              fontWeight: 600
            }}
          />
          
          {/* Critical Badge on right side */}
          <text
            x="95%"
            y={400}
            textAnchor="end"
            fill="#DC2626"
            fontSize={11}
            fontWeight={600}
          >
            CRITICAL
          </text>
          
          {/* Historical Line (Blue) */}
          <Line
            type="monotone"
            dataKey="health"
            stroke="#3B82F6"
            strokeWidth={3}
            dot={false}
            data={data.filter(d => d.type === 'historical')}
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
                  <g>
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
                      y2={props.cy + 50}
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
          />
          
          <Tooltip content={<CustomTooltip />} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
```

CSS for tooltips:
```css
.custom-tooltip {
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.failure-tooltip {
  background: rgba(220, 38, 38, 0.95);
  border-color: rgba(254, 226, 226, 0.3);
  text-align: center;
  padding: 16px 24px;
}

.tooltip-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.tooltip-title {
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin-bottom: 4px;
}

.tooltip-subtitle {
  font-size: 14px;
  color: rgba(255,255,255,0.9);
}

.tooltip-date {
  font-size: 12px;
  color: #94A3B8;
  margin-bottom: 4px;
}

.tooltip-health {
  font-size: 16px;
  font-weight: 600;
  color: #F1F5F9;
  margin-bottom: 4px;
}

.tooltip-type {
  font-size: 11px;
  color: #64748B;
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## CHANGE #3: WRITE OPTIMIZATION IMPACT CARD

TARGET LAYOUT:
┌──────────────────────────────────┐
│  Write Optimization Impact       │
│                                  │
│  Writes Reduced                  │
│  48% [█████████████░░░░]         │
│                                  │
│  Estimated Wear Saved            │
│  22% 🍃                          │
│                                  │
│  [Circular gauge: 63%]           │
│  TBW REMAINING                   │
│                                  │
│  Adaptive Mode >                 │
│                                  │
│  ⚡ Algorithm Active [ON]        │
│  Auto-adjust [ON]                │
└──────────────────────────────────┘

IMPLEMENTATION:

```jsx
const WriteOptimizationCard = ({ 
  writesReduced = 48, 
  wearSaved = 22,
  tbwRemaining = 63,
  algorithmActive = true,
  autoAdjust = true
}) => {
  return (
    <div className="write-optimization-card">
      <div className="card-header">
        <h3>Write Optimization Impact</h3>
        <button className="card-menu">⋯</button>
      </div>
      
      <div className="metrics-section">
        {/* Writes Reduced */}
        <div className="metric">
          <div className="metric-header">
            <span className="metric-label">Writes Reduced</span>
            <span className="metric-value">{writesReduced}%</span>
          </div>
          
          {/* Bar chart showing daily writes */}
          <div className="mini-bar-chart">
            {Array.from({ length: 14 }).map((_, i) => (
              <div 
                key={i}
                className="bar"
                style={{ 
                  height: `${40 + Math.random() * 60}%`,
                  background: i < 10 ? '#64748B' : '#3B82F6'
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Wear Saved */}
        <div className="metric">
          <div className="metric-header">
            <span className="metric-label">Estimated Wear Saved</span>
            <span className="metric-value">{wearSaved}% 🍃</span>
          </div>
        </div>
        
        {/* TBW Gauge */}
        <div className="tbw-gauge-container">
          <svg width="200" height="200" viewBox="0 0 200 200">
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="rgba(100, 116, 139, 0.2)"
              strokeWidth="16"
            />
            
            {/* Progress circle */}
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="#10B981"
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={`${tbwRemaining * 5.03} ${(100 - tbwRemaining) * 5.03}`}
              transform="rotate(-90 100 100)"
              style={{
                filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))'
              }}
            />
            
            {/* Center text */}
            <text
              x="100"
              y="100"
              textAnchor="middle"
              dy="0.3em"
              fontSize="48"
              fontWeight="700"
              fill="#10B981"
            >
              {tbwRemaining}%
            </text>
          </svg>
          
          <div className="gauge-label">TBW REMAINING</div>
        </div>
        
        {/* Adaptive Mode */}
        <button className="adaptive-mode-btn">
          Adaptive Mode <span className="arrow">›</span>
        </button>
        
        {/* Controls */}
        <div className="controls">
          <div className="control-row">
            <span className="control-label">
              <span className="icon">⚡</span> Algorithm Active
            </span>
            <label className="toggle">
              <input type="checkbox" checked={algorithmActive} />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div className="control-row">
            <span className="control-label">Auto-adjust</span>
            <button className={`toggle-btn ${autoAdjust ? 'on' : 'off'}`}>
              {autoAdjust ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

CSS:
```css
.write-optimization-card {
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 16px;
  padding: 24px;
}

.metric {
  margin-bottom: 24px;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.metric-label {
  font-size: 13px;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-value {
  font-size: 32px;
  font-weight: 700;
  color: #3B82F6;
}

.mini-bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 60px;
}

.mini-bar-chart .bar {
  flex: 1;
  background: #64748B;
  border-radius: 2px 2px 0 0;
  transition: all 0.3s;
}

.mini-bar-chart .bar:hover {
  opacity: 0.8;
}

.tbw-gauge-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 24px 0;
}

.gauge-label {
  margin-top: 12px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1px;
  color: #64748B;
}

.adaptive-mode-btn {
  width: 100%;
  padding: 12px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  color: #3B82F6;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  margin-bottom: 16px;
  transition: all 0.2s;
}

.adaptive-mode-btn:hover {
  background: rgba(59, 130, 246, 0.15);
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.control-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.control-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #E2E8F0;
}

.control-label .icon {
  font-size: 16px;
}

/* Toggle switch */
.toggle {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(100, 116, 139, 0.3);
  transition: .3s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
}

.toggle input:checked + .toggle-slider {
  background-color: #3B82F6;
}

.toggle input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

/* ON/OFF button */
.toggle-btn {
  padding: 4px 16px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn.on {
  background: rgba(16, 185, 129, 0.2);
  color: #10B981;
}

.toggle-btn.off {
  background: rgba(239, 68, 68, 0.2);
  color: #EF4444;
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## CHANGE #4: AI ACTION FEED

TARGET DESIGN:
```
AI Action Feed                                              >
─────────────────────────────────────────────────────────────
🔵 Compression Intensity Increased                   12:00 PM
🟢 Risk Model Updated                                6:00 AM
⚠️ Temp Spike Detected (48°C)                       Yesterday
```

IMPLEMENTATION:

```jsx
const AIActionFeed = () => {
  const actions = [
    {
      icon: '🔵',
      text: 'Compression Intensity Increased',
      time: '12:00 PM',
      type: 'info'
    },
    {
      icon: '🟢',
      text: 'Risk Model Updated',
      time: '6:00 AM',
      type: 'success'
    },
    {
      icon: '⚠️',
      text: 'Temp Spike Detected (48°C)',
      time: 'Yesterday',
      type: 'warning'
    }
  ];
  
  return (
    <div className="action-feed-card">
      <div className="card-header">
        <h3>AI Action Feed</h3>
        <button className="expand-btn">›</button>
      </div>
      
      <div className="action-list">
        {actions.map((action, i) => (
          <div key={i} className={`action-item ${action.type}`}>
            <span className="action-icon">{action.icon}</span>
            <span className="action-text">{action.text}</span>
            <span className="action-time">{action.time}</span>
            <span className="status-dot"></span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

CSS:
```css
.action-feed-card {
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 16px;
  padding: 24px;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.action-item {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  transition: all 0.2s;
}

.action-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.action-icon {
  font-size: 20px;
}

.action-text {
  font-size: 14px;
  color: #E2E8F0;
}

.action-time {
  font-size: 12px;
  color: #64748B;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10B981;
}

.action-item.warning .status-dot {
  background: #F59E0B;
}

.action-item.info .status-dot {
  background: #3B82F6;
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## PRIORITY ORDER

IMPLEMENT IN THIS ORDER:

**DAY 1 (4 hours) - CRITICAL:**
1. Header redesign (SanDisk branding + horizontal tabs)
2. Health Timeline chart with prediction zones
3. Risk badge ("AT RISK") visible

**DAY 2 (3 hours) - HIGH:**
4. Write Optimization Impact card
5. AI Action Feed
6. Color strategy (red for critical, green for safe)

**DAY 3 (2 hours) - POLISH:**
7. Spacing adjustments
8. Loading states
9. Hover effects

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## TESTING

Before considering done:

[ ] SanDisk logo visible in header
[ ] Horizontal tab navigation works
[ ] Health timeline shows prediction with zones
[ ] Risk badge animates (pulse effect)
[ ] Write Optimization card has gauge + toggles
[ ] Action feed shows recent activities
[ ] All colors match target (red/orange/green/blue)
[ ] Spacing feels generous, not cramped

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GOAL: Make judges say "This looks like SanDisk built it"

NOT: "Students built this for a hackathon"
