import React, { useState, useEffect } from 'react';
import { 
  getProfile, 
  updateMonthlyIncome, 
  getTransactions, 
  addTransaction, 
  deleteTransaction 
} from '../services/supabaseClient';
import { processTransactionRoundUp } from '../services/api';
import { 
  Wallet, 
  TrendingDown, 
  PiggyBank, 
  Activity, 
  PlusCircle, 
  Trash2, 
  PieChart as PieIcon, 
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function Dashboard({ session, user, userId }) {
  const activeUserId = session?.user?.id || user?.id || userId;

  const [income, setIncome] = useState(0);
  const [tempIncome, setTempIncome] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Needs');
  const [transactionType, setTransactionType] = useState('expense');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  // Custom Error States
  const [errors, setErrors] = useState({ description: false, amount: false, salary: false });

  useEffect(() => {
    if (activeUserId) {
      fetchData();
    }
  }, [activeUserId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const profile = await getProfile(activeUserId);
      if (profile && profile.monthly_income) {
        setIncome(profile.monthly_income);
        setTempIncome(profile.monthly_income);
      }
      const txList = await getTransactions(activeUserId);
      if (txList) setTransactions(txList);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleIncomeSave = async (e) => {
    e.preventDefault();
    if (!tempIncome || parseFloat(tempIncome) < 0) {
      setErrors(prev => ({ ...prev, salary: true }));
      return;
    }

    try {
      const val = parseFloat(tempIncome) || 0;
      await updateMonthlyIncome(activeUserId, val);
      setIncome(val);
      setErrors(prev => ({ ...prev, salary: false }));
      alert('Monthly base income updated successfully!');
    } catch (err) {
      alert('Failed to update base income: ' + err.message);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();

    // Check custom errors
    const newErrors = {
      description: !description.trim(),
      amount: !amount || parseFloat(amount) <= 0
    };

    setErrors(prev => ({ ...prev, ...newErrors }));

    if (newErrors.description || newErrors.amount || !activeUserId) return;

    setSubmitting(true);
    let roundUpAmount = 0;

    if (transactionType === 'expense') {
      try {
        const res = await processTransactionRoundUp(parseFloat(amount));
        if (res) roundUpAmount = res.round_up_amount || 0;
      } catch (err) {
        console.error('Round-up calculation error:', err);
      }
    }

    try {
      const payload = {
        user_id: activeUserId,
        title: description.trim(),
        amount: parseFloat(amount),
        category: transactionType === 'income' ? 'Income' : category,
        transaction_type: transactionType,
        round_up_amount: roundUpAmount,
        created_at: transactionDate ? new Date(transactionDate).toISOString() : new Date().toISOString()
      };

      const newTx = await addTransaction(payload);
      if (newTx) {
        setTransactions(prev => [newTx, ...prev]);
      } else {
        await fetchData();
      }
      setDescription('');
      setAmount('');
      setErrors({ description: false, amount: false, salary: false });
    } catch (err) {
      alert('Error adding transaction: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      alert('Error deleting record: ' + err.message);
    }
  };

  const additionalIncome = transactions
    .filter(t => t.transaction_type === 'income')
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);

  const totalEffectiveIncome = income + additionalIncome;

  const totalExpenses = transactions
    .filter(t => !t.transaction_type || t.transaction_type === 'expense')
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);

  const totalRoundUpSaved = transactions
    .reduce((acc, t) => acc + Number(t.round_up_amount || 0), 0);

  const remainingBalance = totalEffectiveIncome - totalExpenses;

  const expenseRatio = totalEffectiveIncome > 0 ? (totalExpenses / totalEffectiveIncome) * 100 : 0;
  const healthScore = totalEffectiveIncome === 0 ? 0 : Math.max(0, Math.min(100, Math.round(100 - expenseRatio)));

  const getHealthColor = (score) => {
    if (score >= 70) return '#10B981';
    if (score >= 40) return '#F59E0B';
    return '#EF4444';
  };

  const categoryData = [
    { name: 'Needs', value: transactions.filter(t => t.transaction_type === 'expense' && (t.category === 'Needs' || t.category === 'Bills' || t.category === 'Food')).reduce((acc, t) => acc + Number(t.amount || 0), 0) },
    { name: 'Wants', value: transactions.filter(t => t.transaction_type === 'expense' && (t.category === 'Wants' || t.category === 'Transport')).reduce((acc, t) => acc + Number(t.amount || 0), 0) },
    { name: 'Savings', value: transactions.filter(t => t.transaction_type === 'expense' && t.category === 'Savings').reduce((acc, t) => acc + Number(t.amount || 0), 0) },
  ].filter(item => item.value > 0);

  const CHART_COLORS = ['#2563EB', '#EC4899', '#8B5CF6'];

  if (loading) {
    return <div style={{ color: '#1F2223', textAlign: 'center', padding: '50px 20px', fontWeight: '500' }}>Loading Dashboard...</div>;
  }

  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '16px', boxSizing: 'border-box' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: '700', color: '#1F2223' }}>Personal Finance Dashboard</h1>
      </div>

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        
        {/* Total Income Card */}
        <div className="glass-card" style={{ background: '#FFFFFF', padding: '18px', borderRadius: '16px', borderLeft: '5px solid #2563EB', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#2563EB' }}>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>Total Income</span>
            <Wallet size={18} />
          </div>
          <h2 style={{ margin: '8px 0 0 0', fontSize: '22px', fontWeight: '700', color: '#1F2223' }}>₱{totalEffectiveIncome.toLocaleString()}</h2>
          {additionalIncome > 0 && (
            <span style={{ fontSize: '11px', color: '#10B981', fontWeight: '600' }}>+₱{additionalIncome.toLocaleString()} extra income</span>
          )}
        </div>

        {/* Total Expenses Card */}
        <div className="glass-card" style={{ background: '#FFFFFF', padding: '18px', borderRadius: '16px', borderLeft: '5px solid #EF4444', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#EF4444' }}>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>Total Expenses</span>
            <TrendingDown size={18} />
          </div>
          <h2 style={{ margin: '8px 0 0 0', fontSize: '22px', fontWeight: '700', color: '#1F2223' }}>₱{totalExpenses.toLocaleString()}</h2>
          <span style={{ fontSize: '11px', color: '#64748B' }}>Outflow transactions</span>
        </div>

        {/* Auto Round-Up Saved Card */}
        <div className="glass-card" style={{ background: '#FFFFFF', padding: '18px', borderRadius: '16px', borderLeft: '5px solid #8B5CF6', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#8B5CF6' }}>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>Round-Up Saved</span>
            <PiggyBank size={18} />
          </div>
          <h2 style={{ margin: '8px 0 0 0', fontSize: '22px', fontWeight: '700', color: '#1F2223' }}>₱{totalRoundUpSaved.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
          <span style={{ fontSize: '11px', color: '#64748B' }}>Spare change invested</span>
        </div>

        {/* Health Score Card */}
        <div className="glass-card" style={{ background: '#FFFFFF', padding: '18px', borderRadius: '16px', borderLeft: `5px solid ${getHealthColor(healthScore)}`, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: getHealthColor(healthScore) }}>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>Budget Health Score</span>
            <Activity size={18} />
          </div>
          <h2 style={{ margin: '8px 0 0 0', fontSize: '22px', fontWeight: '700', color: getHealthColor(healthScore) }}>{healthScore}%</h2>
          <span style={{ fontSize: '11px', color: '#64748B' }}>Net: ₱{remainingBalance.toLocaleString()}</span>
        </div>

      </div>

      {/* Salary Config & Recharts Pie Chart Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        
        {/* Salary Input Box */}
        <div className="glass-card" style={{ background: '#FFFFFF', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <h3 style={{ marginTop: 0, fontSize: '16px', fontWeight: '700', color: '#1F2223' }}>Set Base Monthly Salary</h3>
          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px', lineHeight: '1.4' }}>
            Set your regular monthly income as the basis for the 50/30/20 budget calculation.
          </p>
          <form onSubmit={handleIncomeSave} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input
                type="number"
                placeholder="Enter base monthly salary"
                value={tempIncome}
                onChange={(e) => {
                  setTempIncome(e.target.value);
                  if (errors.salary) setErrors(prev => ({ ...prev, salary: false }));
                }}
                style={{ flex: '1 1 180px', padding: '10px 14px', borderRadius: '10px', border: errors.salary ? '1.5px solid #EF4444' : '1px solid #CBD5E1', background: errors.salary ? '#FEF2F2' : '#F1F5F9', color: '#1F2223', fontSize: '14px', outline: 'none' }}
              />
              <button 
                type="submit" 
                className="glass-button"
                style={{ background: '#2563EB', color: '#FFFFFF', flex: '0 0 auto', padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '600' }}
              >
                Save
              </button>
            </div>
            {errors.salary && (
              <span style={{ color: '#EF4444', fontSize: '11px', fontWeight: '600' }}>* Valid salary required</span>
            )}
          </form>
        </div>

        {/* Expense Pie Chart */}
        <div className="glass-card" style={{ background: '#FFFFFF', padding: '20px', borderRadius: '16px', minHeight: '230px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <h3 style={{ marginTop: 0, fontSize: '16px', fontWeight: '700', color: '#1F2223', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieIcon size={18} color="#2563EB" /> Spending Breakdown
          </h3>
          {categoryData.length === 0 ? (
            <p style={{ color: '#94A3B8', fontSize: '13px', marginTop: '30px', textAlign: 'center' }}>
              Add expense transactions to view the spending breakdown chart.
            </p>
          ) : (
            <div style={{ width: '100%', height: '180px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={5} dataKey="value">
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₱${Number(value).toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>

      {/* Quick Add Entry & History Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        
        {/* Quick Add Form */}
        <div className="glass-card" style={{ background: '#FFFFFF', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <h3 style={{ marginTop: 0, fontSize: '16px', fontWeight: '700', color: '#1F2223', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <PlusCircle size={18} color="#10B981" /> Quick Entry
          </h3>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => setTransactionType('expense')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '13px',
                backgroundColor: transactionType === 'expense' ? '#EF4444' : '#E2E8F0',
                color: transactionType === 'expense' ? '#FFFFFF' : '#475569',
                transition: 'all 0.2s ease'
              }}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setTransactionType('income')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '13px',
                backgroundColor: transactionType === 'income' ? '#10B981' : '#E2E8F0',
                color: transactionType === 'income' ? '#FFFFFF' : '#475569',
                transition: 'all 0.2s ease'
              }}
            >
              Income
            </button>
          </div>

          <form onSubmit={handleAddTransaction} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Description Input */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <input
                type="text"
                placeholder={transactionType === 'expense' ? 'Description (e.g., Electricity, Grocery)' : 'Source (e.g., Freelance, Bonus)'}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) setErrors(prev => ({ ...prev, description: false }));
                }}
                style={{ 
                  padding: '10px 14px', 
                  borderRadius: '10px', 
                  border: errors.description ? '1.5px solid #EF4444' : '1px solid #CBD5E1', 
                  background: errors.description ? '#FEF2F2' : '#F1F5F9', 
                  color: '#1F2223', 
                  fontSize: '14px', 
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
              />
              {errors.description && (
                <span style={{ color: '#EF4444', fontSize: '11px', marginTop: '4px', fontWeight: '600' }}>
                  * Description is required
                </span>
              )}
            </div>

            {/* Amount Input */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <input
                type="number"
                step="any"
                placeholder="Amount (₱)"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount) setErrors(prev => ({ ...prev, amount: false }));
                }}
                style={{ 
                  padding: '10px 14px', 
                  borderRadius: '10px', 
                  border: errors.amount ? '1.5px solid #EF4444' : '1px solid #CBD5E1', 
                  background: errors.amount ? '#FEF2F2' : '#F1F5F9', 
                  color: '#1F2223', 
                  fontSize: '14px', 
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
              />
              {errors.amount && (
                <span style={{ color: '#EF4444', fontSize: '11px', marginTop: '4px', fontWeight: '600' }}>
                  * Valid amount required
                </span>
              )}
            </div>
            
            {transactionType === 'expense' && (
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)} 
                style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#F1F5F9', color: '#1F2223', fontSize: '14px', outline: 'none' }}
              >
                <option value="Needs">Needs (Bills, Food)</option>
                <option value="Wants">Wants (Entertainment, Shopping)</option>
                <option value="Savings">Savings / Investments</option>
              </select>
            )}

            <input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#F1F5F9', color: '#1F2223', fontSize: '14px', outline: 'none' }}
            />

            <button 
              type="submit" 
              disabled={submitting}
              style={{ background: '#10B981', color: '#FFFFFF', padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '600' }}
            >
              {submitting ? 'Saving...' : 'Submit Entry'}
            </button>
          </form>
        </div>

        {/* Transaction Activity List */}
        <div className="glass-card" style={{ background: '#FFFFFF', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <h3 style={{ marginTop: 0, fontSize: '16px', fontWeight: '700', color: '#1F2223', marginBottom: '16px' }}>Recent Activity</h3>
          
          {transactions.length === 0 ? (
            <p style={{ color: '#94A3B8', fontSize: '13px' }}>No transactions recorded yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '330px', overflowY: 'auto' }}>
              {transactions.slice(0, 7).map((t) => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '10px 14px', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {t.transaction_type === 'income' ? (
                      <ArrowUpRight size={18} color="#10B981" />
                    ) : (
                      <ArrowDownRight size={18} color="#EF4444" />
                    )}
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '13px', color: '#1F2223' }}>{t.title || t.description}</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        {t.category} • {new Date(t.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '700', fontSize: '13px', color: t.transaction_type === 'income' ? '#10B981' : '#EF4444' }}>
                        {t.transaction_type === 'income' ? '+' : '-'}₱{Number(t.amount).toLocaleString()}
                      </div>
                      {t.round_up_amount > 0 && (
                        <div style={{ fontSize: '10px', color: '#2563EB', fontWeight: '600' }}>+₱{t.round_up_amount} round-up</div>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => handleDelete(t.id)} 
                      style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px', transition: 'color 0.2s ease' }} 
                      onMouseOver={(e) => e.currentTarget.style.color = '#EF4444'} 
                      onMouseOut={(e) => e.currentTarget.style.color = '#94A3B8'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}