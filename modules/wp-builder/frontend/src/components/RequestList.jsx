function RequestList({
  requests,
  onViewDetail,
  onRefresh,
  onDeleteRequest,
  title = 'Mes demandes',
  emptyTitle = 'Aucune demande',
  emptyDescription = 'Créez votre première demande de site WordPress',
}) {
  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      waiting_validation: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    const labels = {
      pending: 'En attente',
      processing: 'En cours',
      waiting_validation: 'Validation requise',
      approved: 'Approuvé',
      completed: 'Terminé',
      failed: 'Échec',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-lg font-medium mb-2">{emptyTitle}</h3>
        <p className="text-gray-500 dark:text-gray-400">
          {emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <button
          onClick={onRefresh}
          className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        >
          ↻ Actualiser
        </button>
      </div>

      <div className="space-y-3">
        {requests.map((request) => (
          <div
            key={request.requestId}
            onClick={() => onViewDetail(request.requestId)}
            className="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-medium">{request.input?.site_name || 'Sans nom'}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {request.input?.site_type || 'Site vitrine'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(request.status)}
                {onDeleteRequest && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRequest(request.requestId);
                    }}
                    className="px-2 py-1 text-xs bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
              <span>ID: {request.requestId.slice(0, 8)}...</span>
              <span>{formatDate(request.createdAt || request.created_at)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RequestList;
