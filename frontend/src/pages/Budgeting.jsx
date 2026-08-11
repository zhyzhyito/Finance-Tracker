import React, { useState, useEffect } from 'react';
import { supabase, getProfile } from '../services/supabaseClient';
import { ShieldCheck, AlertTriangle, CheckCircle } from 'lucide-react';

export default function Budgeting({ user, userId }) {
  const activeUserId = userId || (user && user.id);

  const [loading, setLoading] = useState(true);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (activeUserId) {
      loadBudgetData();
    }
  }, [activeUserId]);

  const loadBudgetData = async () => {
    setLoading(true);

    const profile = await getProfile(activeUserId);
    if (profile && profile.monthly_income) {
      setMonthlyIncome(profile.monthly_income);
    }

    const { data, error } = await supabase
      .from('ft_transactions')
      .select('*')
      .eq('user_id', activeUserId);

    if (!error && data) {
      setTransactions(data);
    }

    setLoading(false);
  };

  const targets = {
    Needs: monthlyIncome * 0.50,
    Wants: monthlyIncome * 0.30,
    Savings: monthlyIncome * 0.20,
  };

  const expenses = transactions.filter((t) => t.transaction_type === 'expense' || !t.transaction_type);

  const actuals = {
    Needs: expenses
      .filter((t) => t.category === 'Needs' || t.category === 'Bills' || t.category === 'Food')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0),
    Wants: expenses
      .filter((t) => t.category === 'Wants' || t.category === 'Transport')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0),
    Savings: expenses
      .filter((t) => t.category === 'Savings')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0),
  };

  const roundUpSavings = transactions.reduce((sum, t) => sum + Number(t.round_up_amount || 0), 0);
  const totalSavingsActual = actuals.Savings + roundUpSavings;

  if (loading) {
    return <div style={{ color: '#fff', textAlign: 'center', padding: '50px 20px' }}>Loading Budget Tracker...</div>;
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '16px', color: '#e2e8f0', boxSizing: 'border-box' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: 'clamp(20px, 4vw, 24px)' }}>50/30/20 Rule Budget Planner</h1>
        <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
          Keep your expenses balanced using the 50% Needs, 30% Wants, and 20% Savings distribution.
        </p>
      </div>

      {/* Salary Summary Card */}
      <div className="glass-card" style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>Base Monthly Salary Basis:</span>
          <h2 style={{ margin: '4px 0 0 0', fontSize: 'clamp(22px, 5vw, 28px)', color: '#38bdf8' }}>
            ₱{monthlyIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h2>
        </div>
        <div style={{ fontSize: '13px', color: '#cbd5e1', background: '#0f172a', padding: '10px 15px', borderRadius: '8px', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
          Target Breakdown: <strong style={{ color: '#38bdf8' }}>₱{(targets.Needs).toLocaleString()} Needs</strong> | <strong style={{ color: '#f43f5e' }}>₱{(targets.Wants).toLocaleString()} Wants</strong> | <strong style={{ color: '#22c55e' }}>₱{(targets.Savings).toLocaleString()} Savings</strong>
        </div>
      </div>

      {/* Category Budget Progress Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        
        {/* Needs Card */}
        <div className="glass-card" style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', borderTop: '4px solid #38bdf8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#38bdf8' }}>Needs (50%)</h3>
            {actuals.Needs > targets.Needs ? (
              <AlertTriangle size={20} color="#ef4444" title="Over Budget" />
            ) : (
              <CheckCircle size={20} color="#22c55e" title="Within Budget" />
            )}
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 15px 0' }}>Food, Bills, Utilities, Rent, Essentials</p>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
            <span>Spent / Target:</span>
            <span style={{ fontWeight: 'bold', color: actuals.Needs > targets.Needs ? '#ef4444' : '#fff' }}>
              ₱{actuals.Needs.toLocaleString()} / ₱{targets.Needs.toLocaleString()}
            </span>
          </div>

          <div style={{ background: '#0f172a', borderRadius: '6px', height: '10px', overflow: 'hidden', marginBottom: '10px' }}>
            <div style={{
              width: `${Math.min(100, targets.Needs ? (actuals.Needs / targets.Needs) * 100 : 0)}%`,
              background: actuals.Needs > targets.Needs ? '#ef4444' : '#38bdf8',
              height: '100%',
              transition: 'width 0.4s ease'
            }} />
          </div>

          <span style={{ fontSize: '11px', color: '#64748b' }}>
            {targets.Needs - actuals.Needs >= 0 
              ? `₱${(targets.Needs - actuals.Needs).toLocaleString()} remaining in Needs budget.`
              : `Over budget by ₱${(actuals.Needs - targets.Needs).toLocaleString()}!`
            }
          </span>
        </div>

        {/* Wants Card */}
        <div className="glass-card" style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', borderTop: '4px solid #f43f5e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#f43f5e' }}>Wants (30%)</h3>
            {actuals.Wants > targets.Wants ? (
              <AlertTriangle size={20} color="#ef4444" title="Over Budget" />
            ) : (
              <CheckCircle size={20} color="#22c55e" title="Within Budget" />
            )}
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 15px 0' }}>Dining Out, Entertainment, Shopping, Transport</p>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
            <span>Spent / Target:</span>
            <span style={{ fontWeight: 'bold', color: actuals.Wants > targets.Wants ? '#ef4444' : '#fff' }}>
              ₱{actuals.Wants.toLocaleString()} / ₱{targets.Wants.toLocaleString()}
            </span>
          </div>

          <div style={{ background: '#0f172a', borderRadius: '6px', height: '10px', overflow: 'hidden', marginBottom: '10px' }}>
            <div style={{
              width: `${Math.min(100, targets.Wants ? (actuals.Wants / targets.Wants) * 100 : 0)}%`,
              background: actuals.Wants > targets.Wants ? '#ef4444' : '#f43f5e',
              height: '100%',
              transition: 'width 0.4s ease'
            }} />
          </div>

          <span style={{ fontSize: '11px', color: '#64748b' }}>
            {targets.Wants - actuals.Wants >= 0 
              ? `₱${(targets.Wants - actuals.Wants).toLocaleString()} remaining in Wants budget.`
              : `Over budget by ₱${(actuals.Wants - targets.Wants).toLocaleString()}!`
            }
          </span>
        </div>

        {/* Savings Card */}
        <div className="glass-card" style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', borderTop: '4px solid #22c55e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#22c55e' }}>Savings (20%)</h3>
            <CheckCircle size={20} color="#22c55e" />
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 15px 0' }}>Emergency Fund, Investments, Round-Up Savings</p>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
            <span>Saved / Target:</span>
            <span style={{ fontWeight: 'bold', color: '#22c55e' }}>
              ₱{totalSavingsActual.toLocaleString()} / ₱{targets.Savings.toLocaleString()}
            </span>
          </div>

          <div style={{ background: '#0f172a', borderRadius: '6px', height: '10px', overflow: 'hidden', marginBottom: '10px' }}>
            <div style={{
              width: `${Math.min(100, targets.Savings ? (totalSavingsActual / targets.Savings) * 100 : 0)}%`,
              background: '#22c55e',
              height: '100%',
              transition: 'width 0.4s ease'
            }} />
          </div>

          <span style={{ fontSize: '11px', color: '#38bdf8' }}>
            Includes +₱{roundUpSavings.toLocaleString()} from auto round-up savings.
          </span>
        </div>

      </div>

      {/* Financial Health Advice Card */}
      <div className="glass-card" style={{ background: '#1e293b', padding: '20px', borderRadius: '12px' }}>
        <h3 style={{ marginTop: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={18} color="#38bdf8" /> Smart Financial Advice
        </h3>

        <ul style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6', margin: '10px 0 0 0', paddingLeft: '20px' }}>
          {actuals.Needs > targets.Needs && (
            <li style={{ color: '#f87171' }}>
              <strong>High Needs Spending:</strong> Try reviewing your recurring bills or utility costs.
            </li>
          )}
          {actuals.Wants > targets.Wants && (
            <li style={{ color: '#f87171' }}>
              <strong>Over Spending on Wants:</strong> Consider cutting back on non-essential online shopping or dining out this month.
            </li>
          )}
          {totalSavingsActual < targets.Savings && (
            <li style={{ color: '#f59e0b' }}>
              <strong>Increase Savings:</strong> Try setting aside money right after receiving your salary (Pay yourself first) before spending the rest.
            </li>
          )}
          {actuals.Needs <= targets.Needs && actuals.Wants <= targets.Wants && (
            <li style={{ color: '#4ade80' }}>
              <strong>Great Financial Health!</strong> Your spending is well balanced this month. Keep up the good habit!
            </li>
          )}
        </ul>
      </div>

    </div>
  );
}