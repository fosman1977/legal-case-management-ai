import React, { useState, useEffect } from 'react';
import { Case } from '../types';

interface CaseFormProps {
  initialCase?: Case;
  onSave: (caseData: Case) => void;
  onCancel: () => void;
}

export const CaseForm: React.FC<CaseFormProps> = ({ initialCase, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Case>>({
    title: '',
    courtReference: '',
    client: '',
    opponent: '',
    court: '',
    hearingDate: '',
    judge: '',
    status: 'preparation'
  });

  useEffect(() => {
    if (initialCase) {
      setFormData(initialCase);
    }
  }, [initialCase]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const caseData: Case = {
      ...formData,
      id: initialCase?.id || Date.now().toString(),
      createdAt: initialCase?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Case;

    onSave(caseData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <form className="case-form" onSubmit={handleSubmit}>
      <h3>{initialCase ? 'Edit Case' : 'New Case'}</h3>
      
      <div className="form-group">
        <label htmlFor="title">Case Title</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          placeholder="e.g., Smith v Jones"
        />
      </div>

      <div className="form-group">
        <label htmlFor="courtReference">Court Reference</label>
        <input
          type="text"
          id="courtReference"
          name="courtReference"
          value={formData.courtReference}
          onChange={handleChange}
          required
          placeholder="e.g., 2024 HC 1234"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="client">Client</label>
          <input
            type="text"
            id="client"
            name="client"
            value={formData.client}
            onChange={handleChange}
            required
            placeholder="Your client's name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="opponent">Opponent</label>
          <input
            type="text"
            id="opponent"
            name="opponent"
            value={formData.opponent}
            onChange={handleChange}
            required
            placeholder="Opposing party"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="court">Court</label>
          <input
            type="text"
            id="court"
            name="court"
            value={formData.court}
            onChange={handleChange}
            required
            placeholder="e.g., High Court, Queen's Bench Division"
          />
        </div>

        <div className="form-group">
          <label htmlFor="judge">Judge</label>
          <input
            type="text"
            id="judge"
            name="judge"
            value={formData.judge}
            onChange={handleChange}
            placeholder="e.g., Mr Justice Smith"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="hearingDate">Hearing Date</label>
          <input
            type="date"
            id="hearingDate"
            name="hearingDate"
            value={formData.hearingDate}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="preparation">In Preparation</option>
            <option value="ready">Ready for Hearing</option>
            <option value="concluded">Concluded</option>
          </select>
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {initialCase ? 'Update Case' : 'Create Case'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
};