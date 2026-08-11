import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { PiggyBank, TrendingUp, ShieldAlert, Sparkles, DollarSign } from 'lucide-react';

export default function Investments({ user, userId }) {
  const activeUserId = userId || (user && user.id);

  const [loading, setLoading] = useState(true);
  const [totalRoundUp, setTotalRoundUp] = useState(0);
  const [investmentGoal, setInvestmentGoal] = useState(10000);
  const [selectedRisk, setSelectedRisk] = useState('Moderate');

  useEffect(() => {
    if (activeUserId) {
      fetchInvestmentData();
    }
  }, [activeUserId]);

  const fetchInvestmentData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ft_transactions')
      .select('round_up_amount')
      .eq('user_id', activeUserId);

    if (!error && data) {
      const sum = data.reduce((acc, t) => acc + Number(t.round_up_amount || 0), 0);
      setTotalRoundUp(sum);
    }
    setLoading(false);
  };

  const riskPortfolios = {
    Conservative: { rate: 0.04, label: 'Low Risk (Money Market / MP2)', desc: '4-6% estimated annual return' },
    Moderate: { rate: 0.08, label: 'Moderate Risk (Index Funds / ETFs)', desc: '7-9% estimated annual return' },
    Aggressive: { rate: 0.12, label: 'High Risk (Stocks / Crypto)', desc: '10-15% estimated annual return' },
  };

  const estimatedGrowth1Yr = totalRoundUp * (1 + riskPortfolios[selectedRisk].rate);
  const estimatedGrowth5Yr = totalRoundUp * Math.pow(1 + riskPortfolios[selectedRisk].rate, 5);

  if (loading) {
    return <div style={{ color: '#fff', textAlign: 'center', padding: '50px 20px' }}>Loading Investments...</div>;
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '16px', color: '#e2e8f0', boxSizing: 'border-box' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: 'clamp(20px, 4vw, 24px)' }}>Automated Micro-Investments</h1>
        <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
          Track and grow your accumulated spare change from auto round-up transactions.
        </p>
      </div>

      {/* Top Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        
        {/* Total Round-Up Fund */}
        <div className="glass-card" style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #38bdf8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#38bdf8' }}>
            <span style={{ fontSize: '13px' }}>Accumulated Round-Up</span>
            <PiggyBank size={20} />
          </div>
          <h2 style={{ margin: '10px 0 0 0', fontSize: '24px' }}>
            ₱{totalRoundUp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Ready for auto-investing</span>
        </div>

        {/* 1-Year Projected Return */}
        <div className="glass-card" style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #22c55e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#22c55e' }}>
            <span style={{ fontSize: '13px' }}>Est. Value (1 Year)</span>
            <TrendingUp size={20} />
          </div>
          <h2 style={{ margin: '10px 0 0 0', fontSize: '24px', color: '#22c55e' }}>
            ₱{estimatedGrowth1Yr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Based on {selectedRisk} strategy</span>
        </div>

        {/* 5-Year Projected Return */}
        <div className="glass-card" style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #a855f7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#a855f7' }}>
            <span style={{ fontSize: '13px' }}>Est. Value (5 Years)</span>
            <Sparkles size={20} />
          </div>
          <h2 style={{ margin: '10px 0 0 0', fontSize: '24px', color: '#a855f7' }}>
            ₱{estimatedGrowth5Yr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Compounded growth projection</span>
        </div>

      </div>

      {/* Portfolio Strategy Selection & Goal Tracker */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        
        {/* Portfolio Selection */}
        <div className="glass-card" style={{ background: '#1e293b', padding: '20px', borderRadius: '12px' }}>
          <h3 style={{ marginTop: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={18} color="#f59e0b" /> Risk Portfolio Preference
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
            {Object.keys(riskPortfolios).map((riskKey) => (
              <div
                key={riskKey}
                onClick={() => setSelectedRisk(riskKey)}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: selectedRisk === riskKey ? '2px solid #3b82f6' : '1px solid #334155',
                  background: selectedRisk === riskKey ? '#1e3a8a22' : '#0f172a',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                className="glass-card"
              >
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: selectedRisk === riskKey ? '#60a5fa' : '#fff' }}>
                  {riskKey} Strategy
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                  {riskPortfolios[riskKey].label}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  {riskPortfolios[riskKey].desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Goal Tracker */}
        <div className="glass-card" style={{ background: '#1e293b', padding: '20px', borderRadius: '12px' }}>
          <h3 style={{ marginTop: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={18} color="#10b981" /> Investment Goal Progress
          </h3>

          <div style={{ marginTop: '15px' }}>
            <label style={{ fontSize: '12px', color: '#94a3b8' }}>Set Target Goal (₱):</label>
            <input
              type="number"
              value={investmentGoal}
              onChange={(e) => setInvestmentGoal(Number(e.target.value))}
              className="glass-input"
              style={{ marginTop: '5px', marginBottom: '15px' }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
              <span>Current Progress</span>
              <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>
                {Math.min(100, Math.round((totalRoundUp / (investmentGoal || 1)) * 100))}%
              </span>
            </div>

            <div style={{ background: '#0f172a', borderRadius: '6px', height: '12px', overflow: 'hidden', marginBottom: '15px' }}>
              <div
                style={{
                  width: `${Math.min(100, (totalRoundUp / (investmentGoal || 1)) * 100)}%`,
                  background: 'linear-gradient(90deg, #38bdf8, #22c55e)',
                  height: '100%',
                  transition: 'width 0.4s ease'
                }}
              />
            </div>

            <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.5' }}>
              You still need <strong style={{ color: '#fff' }}>₱{Math.max(0, investmentGoal - totalRoundUp).toLocaleString()}</strong> to reach your investment goal. Keep logging your daily expenses to steadily grow your auto round-up fund!
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}