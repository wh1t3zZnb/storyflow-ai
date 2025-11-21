import React, { useState, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';

export default function EditableCell({ value, onSave, type = 'text', multiline = false }) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    onSave(tempValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setTempValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div style={{ position: 'relative', width: '100%' }}>
        {multiline ? (
          <textarea
            ref={inputRef}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            style={{ width: '100%', minHeight: '60px', resize: 'none' }}
          />
        ) : (
          <input
            ref={inputRef}
            type={type}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
          />
        )}
        <div style={{ position: 'absolute', right: '4px', bottom: '4px' }}>
          <button onMouseDown={handleSave} style={{ padding: '2px', background: 'var(--success)', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer', display: 'flex' }}>
            <Check size={12} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      style={{ cursor: 'pointer', padding: '4px', minHeight: '24px', display: 'flex', alignItems: 'center' }}
      className="editable-cell-hover"
    >
      {value || <span className="text-secondary" style={{ fontStyle: 'italic', fontSize: '12px' }}>点击编辑...</span>}
    </div>
  );
}