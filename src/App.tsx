import { useState, useEffect } from 'react';
import "./styles.css";
import { Case } from './types';
import { storage } from './utils/storage';
import { CaseList } from './components/CaseList';
import { CaseForm } from './components/CaseForm';
import { CaseDetail } from './components/CaseDetail';

export default function App() {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | undefined>();
  const [showForm, setShowForm] = useState(false);
  const [editingCase, setEditingCase] = useState<Case | undefined>();

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      const loadedCases = await storage.getCases();
      setCases(loadedCases);
      if (loadedCases.length > 0 && !selectedCaseId) {
        setSelectedCaseId(loadedCases[0].id);
      }
    } catch (error) {
      console.error('Failed to load cases:', error);
      // Fallback to sync method if async fails
      const fallbackCases = storage.getCasesSync();
      setCases(fallbackCases);
      if (fallbackCases.length > 0 && !selectedCaseId) {
        setSelectedCaseId(fallbackCases[0].id);
      }
    }
  };

  const handleSaveCase = async (caseData: Case) => {
    try {
      await storage.saveCase(caseData);
      await loadCases();
      setShowForm(false);
      setEditingCase(undefined);
      setSelectedCaseId(caseData.id);
    } catch (error) {
      console.error('Failed to save case:', error);
      alert('Failed to save case. Please try again.');
    }
  };

  const handleDeleteCase = async () => {
    if (selectedCaseId) {
      try {
        await storage.deleteCase(selectedCaseId);
        await loadCases();
        setSelectedCaseId(undefined);
      } catch (error) {
        console.error('Failed to delete case:', error);
        alert('Failed to delete case. Please try again.');
      }
    }
  };

  const handleNewCase = () => {
    setEditingCase(undefined);
    setShowForm(true);
  };

  const handleEditCase = () => {
    const caseToEdit = cases.find(c => c.id === selectedCaseId);
    if (caseToEdit) {
      setEditingCase(caseToEdit);
      setShowForm(true);
    }
  };

  const selectedCase = cases.find(c => c.id === selectedCaseId);

  return (
    <div className="App">
      <header className="app-header">
        <h1>⚖️ Barrister Case Preparation</h1>
        <p>Organize your cases for effective oral presentation</p>
      </header>

      <div className="app-content">
        <aside className="sidebar">
          <CaseList
            cases={cases}
            onSelectCase={setSelectedCaseId}
            selectedCaseId={selectedCaseId}
            onNewCase={handleNewCase}
          />
        </aside>

        <main className="main-content">
          {showForm ? (
            <CaseForm
              initialCase={editingCase}
              onSave={handleSaveCase}
              onCancel={() => {
                setShowForm(false);
                setEditingCase(undefined);
              }}
            />
          ) : selectedCase ? (
            <CaseDetail
              case={selectedCase}
              onEditCase={handleEditCase}
              onDeleteCase={handleDeleteCase}
            />
          ) : (
            <div className="welcome-message">
              <h2>Welcome to Your Case Preparation System</h2>
              <p>Create your first case to get started organizing your court presentations.</p>
              <button className="btn btn-primary btn-large" onClick={handleNewCase}>
                Create Your First Case
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
