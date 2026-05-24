import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Download, CreditCard, Clock, CheckCircle, FileText, AlertTriangle, RefreshCw, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/store/useAppStore';
import { CommissionService } from '@/services/nexusApi';
import { getPlatformConfig, formatCurrency, formatDate, formatNumber, exportToCSV, generateId, generateInvoiceNumber, getCPM, estimateMonthlyRevenue, getNexusCommissionRate } from '@/lib/utils';
import type { Commission, PaymentMethod, PlatformId, Currency } from '@/types';

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: string }[] = [
  { id: 'mtn_momo', label: 'MTN MoMo', icon: '🟡' },
  { id: 'orange_money', label: 'Orange Money', icon: '🟠' },
  { id: 'card', label: 'Carte bancaire', icon: '💳' },
];

// ─── Pay Modal ────────────────────────────────────────────────────────────────

function PayModal({
  commission,
  currency,
  onPay,
  onClose,
}: {
  commission: Commission;
  currency: Currency;
  onPay: (method: PaymentMethod) => void;
  onClose: () => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>('mtn_momo');
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      const paid = await CommissionService.markAsPaid(commission, method);
      onPay(paid.paymentMethod);
      toast.success(`Commission ${paid.invoiceNumber} payée via ${method}`);
    } catch (err: any) {
      toast.error(`Paiement échoué: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Payer la commission</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><XCircle size={20} /></button>
        </div>

        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
          <div className="text-xs text-gray-500 mb-1">Montant dû</div>
          <div className="text-3xl font-bold text-white">{formatCurrency(commission.amount, currency)}</div>
          <div className="text-xs text-gray-500 mt-1">{commission.description}</div>
          <div className="text-xs text-gray-600 mt-1">Facture n° {commission.invoiceNumber}</div>
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-3 block">Méthode de paiement</label>
          <div className="space-y-2">
            {PAYMENT_METHODS.map(pm => (
              <button
                key={pm.id}
                onClick={() => setMethod(pm.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  method === pm.id
                    ? 'border-cyan-500/40 bg-cyan-500/10 text-white'
                    : 'border-white/5 text-gray-400 hover:border-white/10 hover:text-white'
                }`}
              >
                <span className="text-xl">{pm.icon}</span>
                <span className="font-medium text-sm">{pm.label}</span>
                {method === pm.id && <CheckCircle size={16} className="ml-auto text-cyan-400" />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 text-sm">Annuler</button>
          <button
            onClick={handlePay}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <CreditCard size={14} />}
            {loading ? 'Traitement...' : 'Confirmer le paiement'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Invoice Modal ────────────────────────────────────────────────────────────

function InvoiceModal({ commission, currency, onClose }: { commission: Commission; currency: Currency; onClose: () => void }) {
  const cfg = getPlatformConfig(commission.platform!);
  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">FACTURE</h2>
            <div className="text-xs text-gray-500">n° {commission.invoiceNumber}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><XCircle size={20} /></button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs text-gray-500 mb-1">Émetteur</div>
            <div className="text-white font-semibold">Nexus Platform</div>
            <div className="text-gray-400">nexus@platform.cm</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Date d'émission</div>
            <div className="text-white">{formatDate(commission.createdAt)}</div>
            {commission.paidAt && (
              <>
                <div className="text-xs text-gray-500 mt-2">Date de paiement</div>
                <div className="text-white">{formatDate(commission.paidAt)}</div>
              </>
            )}
          </div>
        </div>

        <div className="border-t border-white/10 pt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs">
                <th className="text-left pb-3">Description</th>
                <th className="text-right pb-3">Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="text-gray-300 py-2">
                  <div className="flex items-center gap-2">
                    <span>{cfg.icon}</span>
                    <span>{commission.description}</span>
                  </div>
                </td>
                <td className="text-white text-right font-semibold">{formatCurrency(commission.amount, currency)}</td>
              </tr>
            </tbody>
            <tfoot className="border-t border-white/10">
              <tr>
                <td className="text-white font-bold pt-3">Total</td>
                <td className="text-emerald-400 font-bold text-right pt-3 text-lg">{formatCurrency(commission.amount, currency)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className={`flex items-center gap-2 p-3 rounded-xl ${commission.status === 'paid' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
          {commission.status === 'paid'
            ? <CheckCircle size={14} className="text-emerald-400" />
            : <Clock size={14} className="text-amber-400" />}
          <span className={`text-sm font-medium ${commission.status === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
            {commission.status === 'paid' ? `Payé via ${PAYMENT_METHODS.find(m => m.id === commission.paymentMethod)?.label ?? 'N/A'}` : 'En attente de paiement'}
          </span>
        </div>

        <div className="flex gap-3">
          <button onClick={handlePrint} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm flex items-center justify-center gap-2 hover:border-white/20">
            <FileText size={14} />
            Imprimer
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Commission Row ───────────────────────────────────────────────────────────

function CommissionRow({
  commission,
  currency,
  onPay,
  onView,
}: {
  commission: Commission;
  currency: Currency;
  onPay: (c: Commission) => void;
  onView: (c: Commission) => void;
}) {
  const cfg = getPlatformConfig(commission.platform!);
  const isPaid = commission.status === 'paid';

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-900/60 border border-white/5 hover:border-white/10 transition-colors">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center text-lg flex-shrink-0`}>
        {cfg.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">{commission.description}</div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 flex-wrap">
          <span>{cfg.name}</span>
          <span>·</span>
          <span>{commission.period}</span>
          <span>·</span>
          <span>#{commission.invoiceNumber}</span>
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <div className={`text-sm font-bold ${isPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
          {formatCurrency(commission.amount, currency)}
        </div>
        <div className="text-xs text-gray-600">{formatDate(commission.createdAt)}</div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {isPaid ? (
          <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">
            <CheckCircle size={10} />
            Payé
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-full">
            <Clock size={10} />
            En attente
          </span>
        )}
        <button
          onClick={() => onView(commission)}
          className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
          title="Voir la facture"
        >
          <FileText size={13} />
        </button>
        {!isPaid && (
          <button
            onClick={() => onPay(commission)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            title="Payer"
          >
            <CreditCard size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CommissionHistory() {
  const { commissions, connectedAccounts, updateCommission, loadCommissions, settings } = useAppStore();
  const [payingCommission, setPayingCommission] = useState<Commission | null>(null);
  const [viewingCommission, setViewingCommission] = useState<Commission | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid'>('all');
  const [filterPlatform, setFilterPlatform] = useState<PlatformId | 'all'>('all');
  const [generating, setGenerating] = useState(false);

  useEffect(() => { loadCommissions(); }, [loadCommissions]);

  // Auto-generate commissions from connected accounts
  const handleGenerateCommissions = useCallback(async () => {
    if (connectedAccounts.length === 0) return;
    setGenerating(true);
    try {
      for (const acc of connectedAccounts) {
        await CommissionService.generateCommission(acc, Math.max(0, acc.followers - 500));
      }
      await loadCommissions();
    } catch {
      // silent
    } finally {
      setGenerating(false);
    }
  }, [connectedAccounts, loadCommissions]);

  const handlePay = useCallback(async (method: PaymentMethod) => {
    if (!payingCommission) return;
    await updateCommission(payingCommission.id, {
      status: 'paid',
      paidAt: new Date().toISOString(),
      paymentMethod: method,
    });
    setPayingCommission(null);
    await loadCommissions();
  }, [payingCommission, updateCommission, loadCommissions]);

  const filtered = useMemo(() => {
    return commissions
      .filter(c => filterStatus === 'all' || c.status === filterStatus)
      .filter(c => filterPlatform === 'all' || c.platform === filterPlatform);
  }, [commissions, filterStatus, filterPlatform]);

  const totals = useMemo(() => {
    const total = commissions.reduce((s, c) => s + c.amount, 0);
    const paid = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + c.amount, 0);
    const pending = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + c.amount, 0);
    return { total, paid, pending };
  }, [commissions]);

  // Estimated commissions from current accounts
  const estimatedCommissions = useMemo(() => {
    return connectedAccounts.map(acc => {
      const cpm = getCPM(acc.platform, acc.region || 'CM');
      const revenue = estimateMonthlyRevenue(acc.platform as any, cpm, acc.engagement ?? 3);
      const rate = getNexusCommissionRate(acc.followers as any);
      return {
        platform: acc.platform,
        username: acc.username,
        monthlyRevenue: revenue,
        commissionAmount: revenue * rate,
        commissionRate: rate,
      };
    });
  }, [connectedAccounts]);

  const uniquePlatforms = [...new Set(commissions.map(c => c.platform).filter(Boolean))] as PlatformId[];

  const handleExport = () => {
    const rows = filtered.map(c => ({
      date: c.createdAt.split('T')[0],
      facture: c.invoiceNumber,
      plateforme: c.platform,
      description: c.description,
      montant: c.amount.toFixed(2),
      devise: c.currency,
      statut: c.status,
      paiement: c.paymentMethod ?? '',
    }));
    exportToCSV(rows, 'nexus_commissions');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Historique des commissions</h1>
          <p className="text-sm text-gray-400 mt-1">{commissions.length} commission{commissions.length !== 1 ? 's' : ''} enregistrée{commissions.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateCommissions}
            disabled={generating || connectedAccounts.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl text-sm text-purple-400 font-medium transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
            {generating ? 'Calcul...' : 'Recalculer'}
          </button>
          <button
            onClick={handleExport}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-gray-400 hover:text-white transition-all disabled:opacity-50"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total commissions', value: formatCurrency(totals.total, settings.currency), color: 'text-white' },
          { label: 'Payé', value: formatCurrency(totals.paid, settings.currency), color: 'text-emerald-400' },
          { label: 'En attente', value: formatCurrency(totals.pending, settings.currency), color: 'text-amber-400' },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl bg-gray-900/60 border border-white/5 p-4">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Estimated this month */}
      {estimatedCommissions.length > 0 && (
        <div className="rounded-2xl bg-gray-900/60 border border-white/5 p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Estimations du mois en cours</h3>
          <div className="space-y-2">
            {estimatedCommissions.map((ec, i) => {
              const cfg = getPlatformConfig(ec.platform);
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <span className="text-lg">{cfg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-300">@{ec.username}</span>
                    <div className="text-xs text-gray-600">Taux Nexus: {(ec.commissionRate * 100).toFixed(0)}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-amber-400">{formatCurrency(ec.commissionAmount, settings.currency)}</div>
                    <div className="text-xs text-gray-600">sur {formatCurrency(ec.monthlyRevenue, settings.currency)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          {(['all', 'pending', 'paid'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterStatus === s ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {s === 'all' ? 'Toutes' : s === 'pending' ? 'En attente' : 'Payées'}
            </button>
          ))}
        </div>
        {uniquePlatforms.map(p => {
          const cfg = getPlatformConfig(p);
          return (
            <button
              key={p}
              onClick={() => setFilterPlatform(filterPlatform === p ? 'all' : p)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${filterPlatform === p ? `bg-gradient-to-r ${cfg.gradient} text-white` : 'text-gray-500 border border-white/5 hover:text-gray-300'}`}
            >
              {cfg.icon} {cfg.name}
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <FileText size={32} className="text-gray-700 mx-auto mb-3" />
          <div className="text-sm text-gray-500 mb-2">Aucune commission</div>
          {connectedAccounts.length > 0 && (
            <button
              onClick={handleGenerateCommissions}
              className="text-xs text-cyan-400 hover:underline"
            >
              Calculer les commissions depuis mes comptes →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => (
            <CommissionRow
              key={c.id}
              commission={c}
              currency={settings.currency}
              onPay={setPayingCommission}
              onView={setViewingCommission}
            />
          ))}
        </div>
      )}

      {payingCommission && (
        <PayModal
          commission={payingCommission}
          currency={settings.currency}
          onPay={handlePay}
          onClose={() => setPayingCommission(null)}
        />
      )}
      {viewingCommission && (
        <InvoiceModal
          commission={viewingCommission}
          currency={settings.currency}
          onClose={() => setViewingCommission(null)}
        />
      )}
    </div>
  );
}