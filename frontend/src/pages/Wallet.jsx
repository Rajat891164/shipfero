import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Search,
  History,
  CreditCard,
  Building,
  Zap,
  Info,
  TrendingUp,
  Shield,
  ChevronRight,
  X
} from 'lucide-react';
import { BillingService, unwrap } from '../services/api';

const quickAmounts = ['500', '1000', '2000', '5000'];

// Which transaction types are money-in vs money-out.
const CREDIT_TYPES = ['RECHARGE', 'COD_CREDIT', 'REFUND', 'REVERSAL'];
const formatINR = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const Wallet = () => {
  const [amount, setAmount] = useState('');
  const [searchTxn, setSearchTxn] = useState('');
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [recharging, setRecharging] = useState(false);

  const load = useCallback(() => {
    BillingService.summary().then(({ data }) => setSummary(data)).catch(() => {});
    BillingService.transactions()
      .then(({ data }) => setTransactions(unwrap(data) || []))
      .catch(() => setTransactions([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRecharge = async () => {
    if (!amount || parseFloat(amount) < 500) return;
    setRecharging(true);
    try {
      await BillingService.addFunds({ amount, description: 'Wallet recharge' });
      setAmount('');
      load();
    } catch (err) {
      alert(err.response?.data?.detail || 'Recharge failed.');
    } finally {
      setRecharging(false);
    }
  };

  const filteredTxns = transactions.filter(t =>
    !searchTxn ||
    (t.txn_id || '').toLowerCase().includes(searchTxn.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(searchTxn.toLowerCase())
  );

  return (
    <div className="space-y-7 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <WalletIcon className="w-4 h-4 text-secondary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Financial Hub</span>
          </div>
          <h2 className="text-2xl font-bold text-main">Wallet & Financials</h2>
          <p className="text-muted text-sm mt-0.5">Manage your shipping credits and view transaction history.</p>
        </div>
        <button
          className="neon-button-outline flex items-center gap-2 text-xs !py-2"
          onClick={() => alert('Downloading Financial Statement...')}
          id="wallet-download-stmt"
        >
          <Download className="w-3.5 h-3.5" /> Statements
        </button>
      </div>

      {/* Balance + Recharge Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Balance Card */}
        <div className="xl:col-span-2 glass-card p-7 relative overflow-hidden group">
          {/* Decorative orbs */}
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-secondary/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
          <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-primary/8 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Balance info */}
            <div>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">Available Balance</p>
              <h3 className="text-5xl font-bold text-main tracking-tight">
                <span className="text-2xl text-muted mr-1">₹</span>
                {summary
                  ? Number(summary.wallet_balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : '—'}
              </h3>
              <div className="flex items-center gap-2 mt-3 text-xs font-bold text-muted">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Total recharged: {summary ? formatINR(summary.total_recharged) : '—'}</span>
              </div>

              {/* Mini stats */}
              <div className="mt-7 grid grid-cols-2 gap-3">
                {[
                  { label: 'Total Spent', value: summary ? formatINR(summary.total_spent) : '—', color: 'text-error' },
                  { label: 'COD Credited', value: summary ? formatINR(summary.total_cod_credited) : '—', color: 'text-success' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="p-3.5 bg-surface-light/60 rounded-2xl hover:bg-surface-hover transition-colors">
                    <p className="text-[9px] text-muted font-bold uppercase tracking-wider mb-1.5">{label}</p>
                    <p className={`text-lg font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recharge form */}
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-main">Add Money to Wallet</h4>
              <div className="relative group/inp">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-bold text-lg pointer-events-none">₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="input-field !pl-9 !py-4 text-lg font-bold"
                  id="wallet-amount-input"
                />
                {amount && (
                  <button onClick={() => setAmount('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-main transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Quick amounts */}
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map(val => (
                  <button
                    key={val}
                    onClick={() => setAmount(val)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                      amount === val
                        ? 'bg-primary text-background shadow-neon-sm'
                        : 'bg-surface-light text-muted hover:bg-surface-hover hover:text-primary'
                    }`}
                  >
                    +₹{parseInt(val).toLocaleString()}
                  </button>
                ))}
              </div>

              <button
                className="w-full neon-button-primary !py-4 flex items-center justify-center gap-2 group/btn text-sm"
                onClick={handleRecharge}
                disabled={!amount || parseFloat(amount) < 500 || recharging}
                id="wallet-recharge-btn"
              >
                {recharging ? 'Processing…' : 'Recharge Wallet'}
                <Zap className="w-4 h-4 group-hover/btn:scale-125 group-hover/btn:text-yellow-200 transition-all duration-200" />
              </button>

              <div className="flex items-center gap-2 text-[10px] text-muted">
                <Info className="w-3 h-3 flex-shrink-0" />
                <span>Minimum recharge amount is ₹500. GST applicable.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Options */}
        <div className="glass-card p-6 space-y-5">
          <h3 className="font-bold text-main">Payment Options</h3>
          <div className="space-y-3">
            {[
              { icon: CreditCard, title: 'Card Payment',   sub: 'Visa, Mastercard, Rupay',  action: 'card' },
              { icon: Building,   title: 'Bank Transfer',  sub: 'IMPS, NEFT, RTGS',         action: 'bank' },
              { icon: Zap,        title: 'UPI Payment',    sub: 'GPay, PhonePe, Paytm',     action: 'upi' },
            ].map(({ icon: Icon, title, sub, action }) => (
              <button
                key={title}
                className="w-full p-4 bg-surface-light rounded-2xl flex items-center gap-4 hover:bg-surface-hover transition-all duration-200 group/opt text-left"
                onClick={() => alert(`Selected payment method: ${title}`)}
              >
                <div className="p-2.5 bg-secondary/10 rounded-xl text-secondary group-hover/opt:bg-secondary group-hover/opt:text-white transition-all duration-200 flex-shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-main">{title}</p>
                  <p className="text-[10px] text-muted mt-0.5">{sub}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted opacity-0 group-hover/opt:opacity-100 group-hover/opt:translate-x-0.5 transition-all duration-200" />
              </button>
            ))}
          </div>

          {/* Auto-Recharge toggle */}
          <div className="pt-4">
            <div className="flex items-center justify-between p-4 bg-error/5 rounded-2xl">
              <div>
                <p className="text-xs font-bold text-main">Auto-Recharge</p>
                <p className="text-[10px] text-muted mt-0.5">Currently <span className="text-error font-bold">Disabled</span></p>
              </div>
              <button
                className="text-[10px] text-primary font-bold hover:text-primary-dark transition-colors px-3 py-1.5 bg-primary/10 rounded-lg hover:bg-primary/20"
                onClick={() => alert('Navigating to Auto-Recharge Settings')}
              >
                ENABLE
              </button>
            </div>
          </div>

          {/* Security badge */}
          <div className="flex items-center gap-2 p-3 bg-success/5 rounded-xl">
            <Shield className="w-4 h-4 text-success flex-shrink-0" />
            <p className="text-[10px] text-muted leading-relaxed">
              Payments secured with <span className="text-success font-bold">256-bit SSL encryption</span>
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <History className="text-muted w-4 h-4" />
            <div>
              <h3 className="font-bold text-main text-sm">Recent Transactions</h3>
              <p className="text-[10px] text-muted mt-0.5">{filteredTxns.length} transactions found</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
              <input
                type="text"
                value={searchTxn}
                onChange={e => setSearchTxn(e.target.value)}
                placeholder="Search transactions..."
                className="input-field !py-2 !pl-9 text-xs w-48"
                id="wallet-txn-search"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left data-table">
            <thead>
              <tr>
                <th className="px-6">Transaction ID</th>
                <th className="px-4">Description</th>
                <th className="px-4">Date</th>
                <th className="px-4 text-right">Amount</th>
                <th className="px-4">Status</th>
                <th className="px-6 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {filteredTxns.map((txn) => {
                const isCredit = CREDIT_TYPES.includes(txn.txn_type);
                return (
                <tr key={txn.id} className="group">
                  <td className="px-6 py-4">
                    <span className="font-bold text-primary text-xs font-mono">{txn.txn_id}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isCredit ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                      }`}>
                        {isCredit
                          ? <ArrowDownRight className="w-3.5 h-3.5" />
                          : <ArrowUpRight className="w-3.5 h-3.5" />
                        }
                      </div>
                      <span className="font-medium text-main text-xs">{txn.description || txn.txn_type}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-muted text-xs">{formatDate(txn.created_at)}</td>
                  <td className={`px-4 py-4 text-right font-bold text-xs ${
                    isCredit ? 'text-success' : 'text-main'
                  }`}>
                    {isCredit ? '+' : '-'}{formatINR(txn.amount)}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      txn.status === 'SUCCESS'
                        ? 'bg-success/10 text-success'
                        : 'bg-warning/10 text-warning'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${txn.status === 'SUCCESS' ? 'bg-success' : 'bg-warning animate-pulse'}`} />
                      {txn.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      className="p-1.5 bg-surface-light rounded-lg text-muted hover:text-primary transition-all active:scale-90 opacity-0 group-hover:opacity-100"
                      onClick={() => alert(`Transaction ${txn.txn_id}`)}
                      title="View receipt"
                    >
                      <Search className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
                );
              })}
              {filteredTxns.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <History className="w-8 h-8 text-muted/30 mx-auto mb-3" />
                    <p className="text-sm font-bold text-muted">No transactions found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
