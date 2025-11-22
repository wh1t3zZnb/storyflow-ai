import React from 'react';
import { X, Check, AlertCircle, Info } from 'lucide-react';

export const AlertModal = ({ isOpen, onClose, title = '提示', message, type = 'info' }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
            <div className="glass-panel modal" style={{ maxWidth: '400px', width: '90%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    {type === 'error' ? (
                        <AlertCircle size={24} className="text-accent" style={{ color: '#ef4444' }} />
                    ) : (
                        <Info size={24} className="text-accent" />
                    )}
                    <h3 style={{ fontSize: '18px', fontWeight: 600 }}>{title}</h3>
                </div>
                <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-primary)', marginBottom: '24px', whiteSpace: 'pre-wrap' }}>
                    {message}
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-primary" onClick={onClose} style={{ minWidth: '80px', justifyContent: 'center' }}>
                        知道了
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ConfirmModal = ({ isOpen, onClose, onConfirm, title = '确认', message, confirmText = '确认', cancelText = '取消', isDangerous = false }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
            <div className="glass-panel modal" style={{ maxWidth: '400px', width: '90%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <AlertCircle size={24} className="text-accent" style={{ color: isDangerous ? '#ef4444' : 'var(--accent)' }} />
                    <h3 style={{ fontSize: '18px', fontWeight: 600 }}>{title}</h3>
                </div>
                <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-primary)', marginBottom: '24px', whiteSpace: 'pre-wrap' }}>
                    {message}
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button className="btn btn-ghost" onClick={onClose}>
                        {cancelText}
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => { onConfirm(); onClose(); }}
                        style={{
                            backgroundColor: isDangerous ? '#ef4444' : undefined,
                            borderColor: isDangerous ? '#ef4444' : undefined
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
