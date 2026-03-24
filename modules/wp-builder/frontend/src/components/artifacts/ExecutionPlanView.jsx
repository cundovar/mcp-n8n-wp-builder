import ArtifactSummaryCard from './ArtifactSummaryCard';
import GenericArtifactJsonView from './GenericArtifactJsonView';

function ExecutionPlanView({ artifact, showRaw = true }) {
  // `execution_plan` et `execution_report` n'ont pas la meme structure.
  // On garde un seul composant, mais on bifurque selon `artifact_type`.
  const payload = artifact?.payload?.payload || artifact?.payload || {};

  if (artifact?.artifact_type === 'execution_report') {
    const stepsCompleted = payload.steps_completed || [];
    const stepsFailed = payload.steps_failed || [];
    const compensated = payload.steps_compensated || [];

    return (
      <div className="space-y-4">
        <ArtifactSummaryCard
          items={[
            { label: 'Statut', value: payload.status || '-' },
            { label: 'Etapes OK', value: stepsCompleted.length },
            { label: 'Etapes KO', value: stepsFailed.length },
            { label: 'Compensations', value: compensated.length },
          ]}
        />

        <section className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-4">
          <h4 className="font-semibold mb-3">Resume d'execution</h4>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Execution</p>
              <p className="font-medium">{payload.execution_id || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Duree</p>
              <p className="font-medium">{payload.duration_ms ?? '-'}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Action suivante</p>
              <p className="font-medium">{payload.next_action || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Site</p>
              <p className="font-medium">{payload.site_url || '-'}</p>
            </div>
          </div>
          {payload.summary && <p className="text-sm mt-4">{payload.summary}</p>}
        </section>

        <section className="grid md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-4">
            <h4 className="font-semibold mb-3">Etapes completes</h4>
            <div className="space-y-2">
              {stepsCompleted.map((step, index) => (
                <div key={step.step_id || index} className="rounded bg-gray-50 dark:bg-gray-900/30 p-3">
                  <p className="text-sm font-medium">{step.action || step.step_id}</p>
                  <p className="text-xs text-gray-500 mt-1">{step.result || '-'}</p>
                </div>
              ))}
              {stepsCompleted.length === 0 && <p className="text-sm text-gray-500">Aucune etape terminee.</p>}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-4">
            <h4 className="font-semibold mb-3">Etapes en erreur</h4>
            <div className="space-y-2">
              {stepsFailed.map((step, index) => (
                <div key={step.step_id || index} className="rounded bg-gray-50 dark:bg-gray-900/30 p-3">
                  <p className="text-sm font-medium">{step.action || step.step_id}</p>
                  <p className="text-xs text-red-600 mt-1">{step.error || '-'}</p>
                </div>
              ))}
              {stepsFailed.length === 0 && <p className="text-sm text-gray-500">Aucune erreur.</p>}
            </div>
          </div>
        </section>

        {showRaw && <GenericArtifactJsonView artifact={artifact} />}
      </div>
    );
  }

  const steps = payload.steps || [];
  const dependencies = payload.dependencies || [];
  const expectedOutputs = payload.expected_outputs || [];

  return (
    <div className="space-y-4">
      <ArtifactSummaryCard
        items={[
          { label: 'Mode', value: payload.execution_mode || '-' },
          { label: 'Etapes', value: steps.length },
          { label: 'Dependances', value: dependencies.length },
          { label: 'Sorties', value: expectedOutputs.length },
        ]}
      />

      <section className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-4">
        <h4 className="font-semibold mb-3">Etapes prevues</h4>
        <div className="space-y-2">
          {steps.map((step) => (
            <div key={step.step_key} className="rounded bg-gray-50 dark:bg-gray-900/30 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{step.description || step.step_key}</p>
                <span className="text-xs text-gray-500">#{step.order}</span>
              </div>
            </div>
          ))}
          {steps.length === 0 && <p className="text-sm text-gray-500">Aucune etape.</p>}
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-4">
          <h4 className="font-semibold mb-3">Dependances</h4>
          <ul className="list-disc list-inside text-sm space-y-1">
            {dependencies.map((item, index) => (
              <li key={index}>{item.name || item.type || item.step_id || JSON.stringify(item)}</li>
            ))}
            {dependencies.length === 0 && <li>Aucune dependance.</li>}
          </ul>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-4">
          <h4 className="font-semibold mb-3">Sorties attendues</h4>
          <ul className="list-disc list-inside text-sm space-y-1">
            {expectedOutputs.map((item, index) => (
              <li key={index}>{item.name || item.type || item.description || JSON.stringify(item)}</li>
            ))}
            {expectedOutputs.length === 0 && <li>Aucune sortie attendue.</li>}
          </ul>
        </div>
      </section>

      {showRaw && <GenericArtifactJsonView artifact={artifact} />}
    </div>
  );
}

export default ExecutionPlanView;
