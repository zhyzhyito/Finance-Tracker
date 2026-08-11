import React, { useState, useEffect, useMemo } from 'react';
import { getTransactions, deleteTransaction, addTransaction } from '../services/supabaseClient';

export default function Transactions({ session, user, userId }) {
  const activeUserId = session?.user?.id || user?.id || userId;

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Needs');
  const [type, setType] = useState('expense');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterType, setFilterType] = useState('All');
  
  // Month & Year Filter States
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [submitting, setSubmitting] = useState(false);

  // Custom Validation State
  const [errors, setErrors] = useState({ title: false, amount: false });

  const fetchTransactions = async () => {
    if (!activeUserId) return;
    setLoading(true);
    try {
      const data = await getTransactions(activeUserId);
      setTransactions(data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [activeUserId]);

  const handleAddTransaction = async (e) => {
    e.preventDefault();

    const newErrors = {
      title: !title.trim(),
      amount: !amount || parseFloat(amount) <= 0
    };

    setErrors(newErrors);

    if (newErrors.title || newErrors.amount || !activeUserId) {
      return;
    }

    setSubmitting(true);

    try {
      const newTx = {
        user_id: activeUserId,
        title: title.trim(),
        amount: parseFloat(amount),
        category: type === 'income' ? 'Income' : category,
        transaction_type: type,
        created_at: new Date().toISOString()
      };

      const added = await addTransaction(newTx);
      if (added) {
        setTransactions(prev => [added, ...prev]);
      } else {
        await fetchTransactions();
      }
      setTitle('');
      setAmount('');
      setErrors({ title: false, amount: false });
    } catch (err) {
      alert('Error adding transaction: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      alert('Failed to delete transaction: ' + err.message);
    }
  };

  // Available Years
  const availableYears = useMemo(() => {
    const years = transactions.map(t => new Date(t.created_at).getFullYear());
    const currentYear = new Date().getFullYear();
    if (!years.includes(currentYear)) years.push(currentYear);
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [transactions]);

  // Filtering Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch = (t.title || t.description || '').toLowerCase().includes(search.toLowerCase());
      const matchesCategory = filterCategory === 'All' || t.category === filterCategory;
      const matchesType = filterType === 'All' || t.transaction_type === filterType;
      
      const tDate = new Date(t.created_at);
      const matchesMonth = selectedMonth === 'All' || (tDate.getMonth() + 1).toString().padStart(2, '0') === selectedMonth;
      const matchesYear = selectedYear === 'All' || tDate.getFullYear().toString() === selectedYear;

      return matchesSearch && matchesCategory && matchesType && matchesMonth && matchesYear;
    });
  }, [transactions, search, filterCategory, filterType, selectedMonth, selectedYear]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterCategory, filterType, selectedMonth, selectedYear]);

  // CSV Export Function
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert('No transactions available to export.');
      return;
    }

    const headers = ['Title', 'Category', 'Type', 'Date', 'Amount (PHP)'];

    const rows = filteredTransactions.map(t => [
      `"${(t.title || t.description || '').replace(/"/g, '""')}"`,
      `"${t.category || ''}"`,
      `"${t.transaction_type || 'expense'}"`,
      `"${new Date(t.created_at).toLocaleDateString()}"`,
      Number(t.amount || 0).toFixed(2)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FinanceTracker_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '16px', boxSizing: 'border-box' }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: '700', color: '#1F2223' }}>Transaction Management</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748B' }}>Record new expenses or income, filter transactions, and manage your records.</p>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExportCSV}
          style={{
            background: '#2563EB',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 18px',
            fontWeight: '600',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.2)'
          }}
        >
          📥 Export CSV
        </button>
      </div>

      {/* Form Card */}
      <div className="glass-card" style={{ background: '#FFFFFF', padding: '20px', borderRadius: '16px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <h2 style={{ marginTop: 0, fontSize: '16px', fontWeight: '700', color: '#1F2223', marginBottom: '16px' }}>
          ⊕ Record New Transaction
        </h2>
        
        <form onSubmit={handleAddTransaction} noValidate style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'start' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <input
              type="text"
              placeholder="Title (e.g., Coffee, Salary)"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors(prev => ({ ...prev, title: false }));
              }}
              style={{ 
                padding: '10px 14px', 
                borderRadius: '10px', 
                border: errors.title ? '1.5px solid #EF4444' : '1px solid #CBD5E1', 
                background: errors.title ? '#FEF2F2' : '#F1F5F9', 
                color: '#1F2223', 
                fontSize: '14px', 
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
            />
            {errors.title && (
              <span style={{ color: '#EF4444', fontSize: '11px', marginTop: '4px', fontWeight: '600' }}>
                * Title is required
              </span>
            )}
          </div>

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

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={type === 'income'}
            style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#F1F5F9', color: '#1F2223', fontSize: '14px', outline: 'none', height: '42px' }}
          >
            <option value="Needs">Needs (Bills, Food)</option>
            <option value="Wants">Wants (Shopping, Fun)</option>
            <option value="Savings">Savings / Investments</option>
          </select>

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#F1F5F9', color: '#1F2223', fontSize: '14px', outline: 'none', height: '42px' }}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>

          <button
            type="submit"
            disabled={submitting}
            style={{ background: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '10px', padding: '10px 16px', fontWeight: '700', cursor: 'pointer', height: '42px', transition: 'all 0.2s ease' }}
          >
            {submitting ? 'Adding...' : 'Add Record'}
          </button>
        </form>
      </div>

      {/* Advanced Filters Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#1F2223', fontSize: '14px', outline: 'none' }}
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#1F2223', fontSize: '14px', outline: 'none' }}
        >
          <option value="All">All Categories</option>
          <option value="Needs">Needs</option>
          <option value="Wants">Wants</option>
          <option value="Savings">Savings</option>
          <option value="Income">Income</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#1F2223', fontSize: '14px', outline: 'none' }}
        >
          <option value="All">All Types</option>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>

        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#1F2223', fontSize: '14px', outline: 'none' }}
        >
          <option value="All">All Months</option>
          <option value="01">January</option>
          <option value="02">February</option>
          <option value="03">March</option>
          <option value="04">April</option>
          <option value="05">May</option>
          <option value="06">June</option>
          <option value="07">July</option>
          <option value="08">August</option>
          <option value="09">September</option>
          <option value="10">October</option>
          <option value="11">November</option>
          <option value="12">December</option>
        </select>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#1F2223', fontSize: '14px', outline: 'none' }}
        >
          <option value="All">All Years</option>
          {availableYears.map(yr => (
            <option key={yr} value={yr.toString()}>{yr}</option>
          ))}
        </select>
      </div>

      {/* Table Container */}
      <div className="glass-card" style={{ background: '#FFFFFF', borderRadius: '16px', overflow: 'hidden', padding: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B', fontSize: '13px' }}>
                <th style={{ padding: '14px 16px' }}>Title</th>
                <th style={{ padding: '14px 16px' }}>Category</th>
                <th style={{ padding: '14px 16px' }}>Type</th>
                <th style={{ padding: '14px 16px' }}>Date</th>
                <th style={{ padding: '14px 16px' }}>Amount</th>
                <th style={{ padding: '14px 16px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>Loading records...</td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>No transactions match your current filters.</td>
                </tr>
              ) : (
                currentData.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: '#1F2223' }}>{tx.title || tx.description}</td>
                    <td style={{ padding: '14px 16px', color: '#64748B', fontSize: '13px' }}>{tx.category}</td>
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: tx.transaction_type === 'income' ? '#10B981' : '#EF4444' }}>
                      {tx.transaction_type === 'income' ? '↗ Income' : '↘ Expense'}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748B', fontSize: '13px' }}>
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: '#1F2223' }}>₱{Number(tx.amount || 0).toLocaleString()}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '6px 10px', borderRadius: '6px', fontSize: '16px' }}
                        title="Delete transaction"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!loading && filteredTransactions.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderTop: '1px solid #F1F5F9', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontSize: '13px', color: '#64748B' }}>
              Showing <strong>{((currentPage - 1) * itemsPerPage) + 1}</strong> to <strong>{Math.min(currentPage * itemsPerPage, filteredTransactions.length)}</strong> of <strong>{filteredTransactions.length}</strong> records
            </span>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: currentPage === 1 ? '#F1F5F9' : '#FFFFFF',
                  color: currentPage === 1 ? '#94A3B8' : '#1F2223',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
              >
                Previous
              </button>

              <span style={{ fontSize: '13px', color: '#475569', padding: '0 8px', fontWeight: '600' }}>
                Page {currentPage} of {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: currentPage === totalPages ? '#F1F5F9' : '#FFFFFF',
                  color: currentPage === totalPages ? '#94A3B8' : '#1F2223',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}