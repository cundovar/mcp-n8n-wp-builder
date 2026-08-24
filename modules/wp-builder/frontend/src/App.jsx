import { useCallback, useEffect, useState } from 'react';
import AppShell from './components/AppShell';
import ArtifactsView from './components/ArtifactsView';
import ExecutionView from './components/ExecutionView';
import PipelineView from './components/PipelineView';
import RequestDetail from './components/RequestDetail';
import RequestForm from './components/RequestForm';
import RequestList from './components/RequestList';
import RevisionsView from './components/RevisionsView';
import ValidationView from './components/ValidationView';
import FeedbackBanner from './components/ui/FeedbackBanner';
import { apiRequest } from './lib/api';
import { getRequestStatus } from './lib/status';

const TOP_LEVEL_ROUTES = {
  list: '#/projects',
  validations: '#/validations',
  form: '#/new',
};

function readRoute() {
  const parts = window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'new') return { view: 'form', requestId: null };
  if (parts[0] === 'validations') return { view: 'validations', requestId: null };
  if (parts[0] === 'requests' && parts[1]) {
    return { view: parts[2] || 'detail', requestId: parts[1] };
  }
  return { view: 'list', requestId: null };
}

function App() {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedArtifactType, setSelectedArtifactType] = useState(null);
  const [route, setRoute] = useState(readRoute);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validationRequests = requests.filter((request) => {
    const status = getRequestStatus(request);
    return ['waiting_validation', 'awaiting_staging_approval', 'changes_requested', 'awaiting_publish_approval', 'failed'].includes(status);
  });

  const fetchRequests = useCallback(async () => {
    try {
      const data = await apiRequest('/requests');
      setRequests(data.requests || []);
      setError(null);
    } catch (requestError) {
      setError(`Impossible de charger les projets : ${requestError.message}`);
    }
  }, []);

  const fetchRequest = useCallback(async (requestId) => {
    try {
      const data = await apiRequest(`/requests/${requestId}`);
      setSelectedRequest(data);
      setError(null);
    } catch (requestError) {
      setSelectedRequest(null);
      setError(`Impossible d’ouvrir ce projet : ${requestError.message}`);
    }
  }, []);

  useEffect(() => {
    if (!window.location.hash) window.history.replaceState(null, '', TOP_LEVEL_ROUTES.list);
    const handleHashChange = () => setRoute(readRoute());
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    fetchRequests();
    const interval = window.setInterval(fetchRequests, 5000);
    return () => window.clearInterval(interval);
  }, [fetchRequests]);

  useEffect(() => {
    if (route.requestId) fetchRequest(route.requestId);
    else setSelectedRequest(null);
  }, [fetchRequest, route.requestId]);

  const navigate = (view, requestId = route.requestId) => {
    if (TOP_LEVEL_ROUTES[view]) window.location.hash = TOP_LEVEL_ROUTES[view];
    else if (requestId) window.location.hash = `#/requests/${requestId}/${view}`;
  };

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      await fetchRequests();
      navigate(data.requestId ? 'detail' : 'list', data.requestId);
    } catch (requestError) {
      setError(`La création a échoué : ${requestError.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveValidation = async (requestId) => {
    setLoading(true);
    setError(null);
    try {
      await apiRequest(`/requests/${requestId}/approve`, { method: 'POST' });
      await Promise.all([fetchRequests(), fetchRequest(requestId)]);
    } catch (requestError) {
      setError(`La validation a échoué : ${requestError.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = async (requestId) => {
    const confirmed = window.confirm('Supprimer ce projet et toutes ses données associées ? Cette action est définitive.');
    if (!confirmed) return;

    setLoading(true);
    setError(null);
    try {
      await apiRequest(`/requests/${requestId}`, { method: 'DELETE' });
      await fetchRequests();
      navigate('list');
    } catch (requestError) {
      setError(`La suppression a échoué : ${requestError.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openArtifact = (type) => {
    setSelectedArtifactType(type || null);
    navigate('artifacts');
  };

  const renderProjectView = () => {
    if (!selectedRequest) {
      return (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-sm text-slate-500">Chargement du projet…</p>
        </div>
      );
    }

    const commonBack = () => navigate('list');
    switch (route.view) {
      case 'pipeline':
        return <PipelineView request={selectedRequest} onBack={() => navigate('detail')} onViewArtifact={openArtifact} />;
      case 'artifacts':
        return <ArtifactsView request={selectedRequest} onBack={() => navigate('pipeline')} initialArtifactType={selectedArtifactType} onViewRevisions={(type) => { setSelectedArtifactType(type); navigate('revisions'); }} />;
      case 'revisions':
        return <RevisionsView request={selectedRequest} onBack={() => navigate('artifacts')} initialArtifactType={selectedArtifactType} />;
      case 'validation':
        return <ValidationView request={selectedRequest} onBack={() => navigate('detail')} onValidationComplete={async () => { await Promise.all([fetchRequests(), fetchRequest(selectedRequest.requestId)]); navigate('detail'); }} onViewRevisions={(type) => { setSelectedArtifactType(type); navigate('revisions'); }} />;
      case 'execution':
        return <ExecutionView request={selectedRequest} onBack={() => navigate('detail')} />;
      default:
        return <RequestDetail request={selectedRequest} onBack={commonBack} onApproveValidation={handleApproveValidation} onViewValidation={() => navigate('validation')} onViewPipeline={() => navigate('pipeline')} onViewArtifacts={() => openArtifact(null)} onViewExecution={() => navigate('execution')} onDeleteRequest={handleDeleteRequest} loading={loading} />;
    }
  };

  return (
    <AppShell view={route.view} requestCount={requests.length} validationCount={validationRequests.length} onNavigate={navigate}>
      <div className="mx-auto max-w-7xl space-y-5">
        {error ? <FeedbackBanner onRetry={route.requestId ? () => fetchRequest(route.requestId) : fetchRequests} onDismiss={() => setError(null)}>{error}</FeedbackBanner> : null}

        {route.view === 'form' ? <RequestForm onSubmit={handleSubmit} loading={loading} /> : null}
        {route.view === 'list' ? <RequestList requests={requests} onViewDetail={(id) => navigate('detail', id)} onRefresh={fetchRequests} onDeleteRequest={handleDeleteRequest} /> : null}
        {route.view === 'validations' ? <RequestList title="Actions requises" emptyTitle="Aucune action requise" emptyDescription="Les validations, corrections et incidents apparaîtront ici." requests={validationRequests} onViewDetail={(id) => navigate('detail', id)} onRefresh={fetchRequests} onDeleteRequest={handleDeleteRequest} /> : null}
        {route.requestId ? renderProjectView() : null}
      </div>
    </AppShell>
  );
}

export default App;
