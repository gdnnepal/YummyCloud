import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  HiOutlineWallet,
  HiOutlineArrowUpRight,
  HiOutlineArrowDownLeft,
  HiOutlineClock,
} from 'react-icons/hi2';
import TopNav from '../components/TopNav';
import useAuthStore from '../store/useAuthStore';
import api from '../services/api';

function Wallet() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    const fetchWallet = async () => {
      try {
        const [walletRes, txnRes] = await Promise.all([
          api.getWallet(),
          api.getTransactions(),
        ]);
        setBalance(Number(walletRes.balance) || 0);
        setTransactions(txnRes.transactions || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWallet();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <>
        <TopNav title={t('wallet')} showBack={true} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <span className="text-6xl mb-4">💰</span>
          <p className="text-sm text-gray-500 mb-4">Login to view your wallet</p>
          <Link to="/login" className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium text-sm">
            {t('login')}
          </Link>
        </div>
      </>
    );
  }

  return (
    <div className="pb-4">
      <TopNav title={t('wallet')} showBack={true} />

      {/* Balance Card */}
      <div className="px-4 pt-4">
        <div className="bg-gradient-to-br from-primary via-primary-dark to-primary rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute bottom-[-10px] left-[-10px] w-20 h-20 bg-white/10 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <HiOutlineWallet className="w-5 h-5 opacity-80" />
              <span className="text-sm opacity-80">Available Balance</span>
            </div>
            <h2 className="text-3xl font-bold mt-1">Rs. {balance}</h2>
            <p className="text-xs opacity-70 mt-2">Use wallet balance on your next order</p>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="px-4 mt-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Transaction History</h3>

        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl h-16 animate-pulse" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <HiOutlineWallet className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((txn) => (
              <div
                key={txn.id}
                className="flex items-center gap-3 bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  txn.type === 'credit' ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  {txn.type === 'credit' ? (
                    <HiOutlineArrowDownLeft className="w-5 h-5 text-green-600" />
                  ) : (
                    <HiOutlineArrowUpRight className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-800">{txn.title}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{txn.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold ${txn.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                    {txn.type === 'credit' ? '+' : '-'} Rs. {Number(txn.amount)}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-0.5 justify-end">
                    <HiOutlineClock className="w-3 h-3" />
                    {new Date(txn.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="px-4 mt-6">
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
          <h4 className="text-sm font-semibold text-amber-800 mb-2">💡 How Wallet Works</h4>
          <ul className="space-y-1.5 text-xs text-amber-700">
            <li>• Earn cashback on every order</li>
            <li>• Get bonus for referring friends</li>
            <li>• Use wallet balance at checkout</li>
            <li>• Wallet balance never expires</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Wallet;
