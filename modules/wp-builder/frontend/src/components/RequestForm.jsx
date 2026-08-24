import { useEffect, useState } from 'react';

const STORAGE_KEY = 'wp-builder:new-request:v1';
const STEPS = ['Projet', 'Pages', 'Identité', 'Confirmation'];
const DEFAULT_FORM = {
  site_name: '',
  site_type: 'site vitrine',
  objective: '',
  target_audience: '',
  pages: ['Accueil', 'À propos', 'Services', 'Contact'],
  features: ['Formulaire de contact', 'SEO optimisé', 'Responsive design'],
  design_style: 'moderne',
  primary_color: '#2563EB',
};

const SITE_PRESETS = {
  artisan: { site_type: 'site vitrine', pages: ['Accueil', 'Services', 'Réalisations', 'À propos', 'Devis & Contact'], features: ['Formulaire de devis', 'SEO local', 'Galerie de réalisations', 'Responsive design'] },
  restaurant: { site_type: 'site vitrine', pages: ['Accueil', 'Carte', 'À propos', 'Réservation', 'Contact'], features: ['Réservation', 'Carte interactive', 'SEO local', 'Responsive design'] },
  portfolio: { site_type: 'portfolio', pages: ['Accueil', 'Projets', 'À propos', 'Contact'], features: ['Galerie de projets', 'Formulaire de contact', 'Responsive design'] },
};

function loadDraft() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    return saved && typeof saved === 'object' ? { ...DEFAULT_FORM, ...saved } : DEFAULT_FORM;
  } catch {
    return DEFAULT_FORM;
  }
}

function RequestForm({ onSubmit, loading }) {
  const [formData, setFormData] = useState(loadDraft);
  const [step, setStep] = useState(0);
  const [newPage, setNewPage] = useState('');
  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const update = (name, value) => setFormData((current) => ({ ...current, [name]: value }));
  const addItem = (field, value, clear) => {
    const normalized = value.trim();
    if (!normalized || formData[field].includes(normalized)) return;
    update(field, [...formData[field], normalized]);
    clear('');
  };
  const removeItem = (field, value) => update(field, formData[field].filter((item) => item !== value));
  const canContinue = step !== 0 || (formData.site_name.trim() && formData.objective.trim());

  const submit = (event) => {
    event.preventDefault();
    if (step < STEPS.length - 1) {
      if (canContinue) setStep((current) => current + 1);
      return;
    }
    const payload = {
      ...formData,
      design_preferences: `${formData.design_style}; couleur principale ${formData.primary_color}`,
    };
    onSubmit(payload);
    window.localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <section className="mx-auto max-w-4xl">
      <div className="mb-7">
        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Nouveau projet</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight">Préparons le futur site</h2>
        <p className="mt-2 text-slate-500">Les réponses alimentent le brief, les plans IA et la construction Elementor.</p>
      </div>

      <ol aria-label="Progression du formulaire" className="mb-7 grid grid-cols-4 gap-2">
        {STEPS.map((label, index) => (
          <li key={label} className="min-w-0">
            <div className={`h-1.5 rounded-full ${index <= step ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'}`} />
            <p className={`mt-2 truncate text-xs font-semibold ${index === step ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>{index + 1}. {label}</p>
          </li>
        ))}
      </ol>

      <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        {step === 0 ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold">Quel site construisons-nous ?</h3>
              <p className="mt-1 text-sm text-slate-500">Commence par le métier, l’objectif et le public attendu.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold">Nom du site <span className="text-red-500">*</span>
                <input name="site_name" value={formData.site_name} onChange={(event) => update('site_name', event.target.value)} required autoFocus className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950" placeholder="Atelier Martin Couverture" />
              </label>
              <label className="text-sm font-semibold">Type de site
                <select name="site_type" value={formData.site_type} onChange={(event) => update('site_type', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950">
                  <option value="site vitrine">Site vitrine</option><option value="blog">Blog</option><option value="e-commerce">E-commerce</option><option value="portfolio">Portfolio</option><option value="landing page">Landing page</option>
                </select>
              </label>
            </div>
            <label className="block text-sm font-semibold">Objectif principal <span className="text-red-500">*</span>
              <textarea name="objective" value={formData.objective} onChange={(event) => update('objective', event.target.value)} required rows={4} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950" placeholder="Présenter nos services et obtenir davantage de demandes de devis locales." />
              <span className="mt-1 block text-xs font-normal text-slate-500">Décris le résultat métier attendu, pas seulement l’apparence.</span>
            </label>
            <label className="block text-sm font-semibold">Audience cible
              <input name="target_audience" value={formData.target_audience} onChange={(event) => update('target_audience', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950" placeholder="Propriétaires de maisons autour de Lyon" />
            </label>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-7">
            <div>
              <h3 className="text-xl font-semibold">Structure et fonctionnalités</h3>
              <p className="mt-1 text-sm text-slate-500">Choisis un point de départ puis adapte les éléments à ton projet.</p>
            </div>
            <div className="flex flex-wrap gap-2" aria-label="Modèles de site">
              {Object.entries(SITE_PRESETS).map(([key, preset]) => <button key={key} type="button" onClick={() => setFormData((current) => ({ ...current, ...preset }))} className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold capitalize hover:border-blue-500 hover:text-blue-600 dark:border-slate-700">Modèle {key}</button>)}
            </div>
            <ItemEditor label="Pages attendues" items={formData.pages} value={newPage} onValue={setNewPage} onAdd={() => addItem('pages', newPage, setNewPage)} onRemove={(value) => removeItem('pages', value)} placeholder="Ajouter une page" tone="blue" />
            <ItemEditor label="Fonctionnalités" items={formData.features} value={newFeature} onValue={setNewFeature} onAdd={() => addItem('features', newFeature, setNewFeature)} onRemove={(value) => removeItem('features', value)} placeholder="Ajouter une fonctionnalité" tone="emerald" />
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-7">
            <div><h3 className="text-xl font-semibold">Direction visuelle</h3><p className="mt-1 text-sm text-slate-500">Cette direction guidera le choix du kit et le design system Elementor.</p></div>
            <fieldset>
              <legend className="text-sm font-semibold">Style souhaité</legend>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {['moderne', 'minimaliste', 'corporate', 'créatif', 'élégant'].map((style) => <label key={style} className={`cursor-pointer rounded-xl border p-3 text-center text-sm font-semibold capitalize transition ${formData.design_style === style ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40' : 'border-slate-200 hover:border-slate-400 dark:border-slate-700'}`}><input type="radio" name="design_style" value={style} checked={formData.design_style === style} onChange={(event) => update('design_style', event.target.value)} className="sr-only" />{style}</label>)}
              </div>
            </fieldset>
            <label className="block text-sm font-semibold">Couleur de départ
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-300 p-3 dark:border-slate-700">
                <input type="color" name="primary_color" value={formData.primary_color} onChange={(event) => update('primary_color', event.target.value)} aria-label="Sélectionner la couleur principale" className="h-11 w-14 cursor-pointer rounded border-0 bg-transparent" />
                <input type="text" value={formData.primary_color} onChange={(event) => update('primary_color', event.target.value)} aria-label="Code hexadécimal de la couleur" pattern="^#[0-9A-Fa-f]{6}$" className="min-w-0 flex-1 bg-transparent font-mono uppercase outline-none" />
                <span className="text-xs text-slate-500">La palette finale sera proposée dans le plan design.</span>
              </div>
            </label>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-6">
            <div><h3 className="text-xl font-semibold">Vérifie avant de lancer</h3><p className="mt-1 text-sm text-slate-500">Le site sera construit sur staging et restera bloqué avant publication.</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Summary title="Projet"><p className="font-semibold">{formData.site_name}</p><p className="mt-1 text-sm text-slate-500 capitalize">{formData.site_type}</p><p className="mt-3 text-sm">{formData.objective}</p></Summary>
              <Summary title="Audience et identité"><p className="text-sm">{formData.target_audience || 'Audience non précisée'}</p><div className="mt-3 flex items-center gap-2 text-sm capitalize"><span className="h-5 w-5 rounded-full border" style={{ backgroundColor: formData.primary_color }} />{formData.design_style} · {formData.primary_color}</div></Summary>
              <Summary title={`${formData.pages.length} pages`}><p className="text-sm text-slate-600 dark:text-slate-300">{formData.pages.join(' · ')}</p></Summary>
              <Summary title={`${formData.features.length} fonctionnalités`}><p className="text-sm text-slate-600 dark:text-slate-300">{formData.features.join(' · ')}</p></Summary>
            </div>
            <div role="note" className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200"><strong>Contrôle humain maintenu :</strong> tu valideras les plans puis le rendu visuel avant toute publication.</div>
          </div>
        ) : null}

        <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-5 dark:border-slate-800">
          <button type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0 || loading} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:invisible dark:text-slate-300 dark:hover:bg-slate-800">Retour</button>
          <button type="submit" disabled={loading || !canContinue} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{loading ? 'Création en cours…' : step === STEPS.length - 1 ? 'Créer le projet' : 'Continuer'}</button>
        </div>
      </form>
    </section>
  );
}

function ItemEditor({ label, items, value, onValue, onAdd, onRemove, placeholder, tone }) {
  const color = tone === 'emerald' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200' : 'bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200';
  return <div><p className="text-sm font-semibold">{label}</p><div className="mt-3 flex flex-wrap gap-2">{items.map((item) => <span key={item} className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm ${color}`}>{item}<button type="button" onClick={() => onRemove(item)} aria-label={`Retirer ${item}`} className="font-bold opacity-60 hover:opacity-100">×</button></span>)}</div><div className="mt-3 flex gap-2"><input value={value} onChange={(event) => onValue(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); onAdd(); } }} className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950" placeholder={placeholder} /><button type="button" onClick={onAdd} className="rounded-xl border border-slate-300 px-4 py-2.5 font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">Ajouter</button></div></div>;
}

function Summary({ title, children }) {
  return <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/50"><h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">{title}</h4>{children}</div>;
}

export default RequestForm;
