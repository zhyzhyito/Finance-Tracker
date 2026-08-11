import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { ShieldCheck } from 'lucide-react';

export default function Auth({ onAuthSuccess, setSession, onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Helper para tawagin kung alinmang callback function ang naipasa mula sa App.jsx
  const triggerAuthSuccess = (userData, sessionData) => {
    if (typeof onAuthSuccess === 'function') {
      onAuthSuccess(userData);
    } else if (typeof setSession === 'function') {
      setSession(sessionData);
    } else if (typeof onLoginSuccess === 'function') {
      onLoginSuccess(userData);
    }
  };

  const handleAuth = async (e, modeIsSignUp) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const email = modeIsSignUp ? signUpEmail : loginEmail;
    const password = modeIsSignUp ? signUpPassword : loginPassword;

    try {
      if (modeIsSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: null
          }
        });

        if (error) {
          setErrorMsg(error.message);
        } else if (data?.user) {
          try {
            await supabase.from('ft_profiles').insert([{ id: data.user.id, monthly_income: 0 }]);
          } catch (profileErr) {
            console.error('Profile creation notice:', profileErr);
          }
          triggerAuthSuccess(data.user, data.session);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setErrorMsg(error.message);
        } else if (data?.user) {
          triggerAuthSuccess(data.user, data.session);
        }
      }
    } catch (err) {
      console.error('Auth execution error:', err);
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-cards-container">
        
        {/* ================= LOG IN CARD ================= */}
        <div 
          className={`glass-card auth-card ${!isSignUp ? 'active-card' : 'inactive-card-left'}`}
          onClick={() => {
            if (isSignUp) {
              setIsSignUp(false);
              setErrorMsg('');
            }
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <ShieldCheck size={48} color="#38bdf8" />
            <h2 style={{ margin: '10px 0 5px 0' }}>Finance Tracker</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
              Log in to your account
            </p>
          </div>

          {!isSignUp && errorMsg && (
            <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', padding: '10px', borderRadius: '8px', color: '#fca5a5', fontSize: '13px', marginBottom: '15px' }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={(e) => handleAuth(e, false)} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input
              type="email"
              placeholder="Email Address"
              className="glass-input"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="glass-input"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
            />
            <button 
              type="submit" 
              className="glass-button" 
              disabled={loading || isSignUp}
            >
              {loading && !isSignUp ? 'Processing...' : 'Log In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#94a3b8' }}>
            Wala pang account?
            <span
              onClick={(e) => {
                e.stopPropagation();
                setIsSignUp(true);
                setErrorMsg('');
              }}
              style={{ color: '#38bdf8', cursor: 'pointer', marginLeft: '6px', fontWeight: 'bold' }}
            >
              Sign Up
            </span>
          </div>
        </div>

        {/* ================= SIGN UP CARD ================= */}
        <div 
          className={`glass-card auth-card ${isSignUp ? 'active-card' : 'inactive-card-right'}`}
          onClick={() => {
            if (!isSignUp) {
              setIsSignUp(true);
              setErrorMsg('');
            }
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <ShieldCheck size={48} color="#38bdf8" />
            <h2 style={{ margin: '10px 0 5px 0' }}>Finance Tracker</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
              Create a new account
            </p>
          </div>

          {isSignUp && errorMsg && (
            <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', padding: '10px', borderRadius: '8px', color: '#fca5a5', fontSize: '13px', marginBottom: '15px' }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={(e) => handleAuth(e, true)} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input
              type="email"
              placeholder="Email Address"
              className="glass-input"
              value={signUpEmail}
              onChange={(e) => setSignUpEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="glass-input"
              value={signUpPassword}
              onChange={(e) => setSignUpPassword(e.target.value)}
              required
            />
            <button 
              type="submit" 
              className="glass-button" 
              disabled={loading || !isSignUp}
            >
              {loading && isSignUp ? 'Processing...' : 'Sign Up'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#94a3b8' }}>
            May account ka na?
            <span
              onClick={(e) => {
                e.stopPropagation();
                setIsSignUp(false);
                setErrorMsg('');
              }}
              style={{ color: '#38bdf8', cursor: 'pointer', marginLeft: '6px', fontWeight: 'bold' }}
            >
              Log In
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}