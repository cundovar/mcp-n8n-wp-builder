import { useState, useEffect } from 'react';
import RequestForm from './components/RequestForm';
import RequestList from './components/RequestList';
import RequestDetail from './components/RequestDetail';
import PipelineView from './components/PipelineView';
import ArtifactsView from './components/ArtifactsView';
import ValidationView from './components/ValidationView';
import RevisionsView from './components/RevisionsView';
import ExecutionView from './components/ExecutionView';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedArtifactType, setSelectedArtifactType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('list');

  const validationRequests = requests.filter(
    (request) => request.status === 'waiting_validation'
  );

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${API_URL}/requests`);
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Erreur chargement:', error);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.requestId) {
        setView('list');
        fetchRequests();
      }
    } catch (error) {
      console.error('Erreur création:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (requestId) => {
    try {
      const res = await fetch(`${API_URL}/requests/${requestId}`);
      const data = await res.json();
      setSelectedRequest(data);
      setView('detail');
    } catch (error) {
      console.error('Erreur détail:', error);
    }
  };

  const handleViewPipeline = async (requestId) => {
    try {
      const res = await fetch(`${API_URL}/requests/${requestId}`);
      const data = await res.json();
      setSelectedRequest(data);
      setView('pipeline');
    } catch (error) {
      console.error('Erreur pipeline:', error);
    }
  };

  const handleApproveValidation = async (requestId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/requests/${requestId}/approve`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Validation impossible');
      }

      await fetchRequests();
      await handleViewDetail(requestId);
    } catch (error) {
      console.error('Erreur validation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = async (requestId) => {
    const confirmed = window.confirm(
      'Supprimer cette demande ?\n\nCette action supprimera aussi les artefacts, validations et exécutions associés.'
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/requests/${requestId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Suppression impossible');
      }

      // Si la demande supprimée était ouverte, revenir à la liste
      if (selectedRequest?.requestId === requestId) {
        setSelectedRequest(null);
        setView('list');
      }

      await fetchRequests();
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-2">
            WP Site Builder
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400">
            Générez des sites WordPress avec l'IA
          </p>
        </header>

        <nav className="flex gap-2 mb-6 justify-center">
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-lg transition ${
              view === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'
            }`}
          >
            Mes demandes ({requests.length})
          </button>
          <button
            onClick={() => setView('validations')}
            className={`px-4 py-2 rounded-lg transition ${
              view === 'validations'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
            }`}
          >
            Validations ({validationRequests.length})
          </button>
          <button
            onClick={() => setView('form')}
            className={`px-4 py-2 rounded-lg transition ${
              view === 'form'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'
            }`}
          >
            + Nouvelle demande
          </button>
        </nav>

        <main className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          {validationRequests.length > 0 && view !== 'detail' && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
              {validationRequests.length} demande{validationRequests.length > 1 ? 's' : ''} en attente de validation.
            </div>
          )}

          {view === 'form' && (
            <RequestForm onSubmit={handleSubmit} loading={loading} />
          )}
          {view === 'list' && (
            <RequestList
              requests={requests}
              onViewDetail={handleViewDetail}
              onRefresh={fetchRequests}
              onDeleteRequest={handleDeleteRequest}
            />
          )}
          {view === 'validations' && (
            <RequestList
              title="Demandes à valider"
              emptyTitle="Aucune validation en attente"
              emptyDescription="Les briefs à approuver apparaîtront ici."
              requests={validationRequests}
              onViewDetail={handleViewDetail}
              onRefresh={fetchRequests}
              onDeleteRequest={handleDeleteRequest}
            />
          )}
          {view === 'detail' && selectedRequest && (
            <RequestDetail
              request={selectedRequest}
              onBack={() => setView('list')}
              onApproveValidation={handleApproveValidation}
              onViewValidation={() => setView('validation')}
              onViewPipeline={() => setView('pipeline')}
              onViewArtifacts={() => {
                setSelectedArtifactType(null);
                setView('artifacts');
              }}
              onViewExecution={() => setView('execution')}
              onDeleteRequest={handleDeleteRequest}
              loading={loading}
            />
          )}
          {view === 'pipeline' && selectedRequest && (
            <PipelineView
              request={selectedRequest}
              onBack={() => setView('detail')}
              onViewArtifact={(type) => {
                setSelectedArtifactType(type);
                setView('artifacts');
              }}
            />
          )}
          {view === 'artifacts' && selectedRequest && (
            <ArtifactsView
              request={selectedRequest}
              onBack={() => setView('pipeline')}
              initialArtifactType={selectedArtifactType}
              onViewRevisions={(type) => {
                setSelectedArtifactType(type);
                setView('revisions');
              }}
            />
          )}
          {view === 'revisions' && selectedRequest && (
            <RevisionsView
              request={selectedRequest}
              onBack={() => setView('artifacts')}
              initialArtifactType={selectedArtifactType}
            />
          )}
          {view === 'validation' && selectedRequest && (
            <ValidationView
              request={selectedRequest}
              onBack={() => setView('detail')}
              onValidationComplete={async () => {
                await fetchRequests();
                await handleViewDetail(selectedRequest.requestId);
              }}
              onViewRevisions={(type) => {
                setSelectedArtifactType(type);
                setView('revisions');
              }}
            />
          )}
          {view === 'execution' && selectedRequest && (
            <ExecutionView
              request={selectedRequest}
              onBack={() => setView('detail')}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
