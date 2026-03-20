import { useState } from 'react';

const defaultPages = ['Accueil', 'À propos', 'Services', 'Contact'];
const defaultFeatures = ['Formulaire de contact', 'SEO optimisé', 'Responsive design'];

function RequestForm({ onSubmit, loading }) {
  const [formData, setFormData] = useState({
    site_name: '',
    site_type: 'site vitrine',
    objective: '',
    pages: [...defaultPages],
    features: [...defaultFeatures],
    design_style: 'moderne',
    primary_color: '#3B82F6',
  });

  const [newPage, setNewPage] = useState('');
  const [newFeature, setNewFeature] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addPage = () => {
    if (newPage.trim() && !formData.pages.includes(newPage.trim())) {
      setFormData((prev) => ({ ...prev, pages: [...prev.pages, newPage.trim()] }));
      setNewPage('');
    }
  };

  const removePage = (page) => {
    setFormData((prev) => ({ ...prev, pages: prev.pages.filter((p) => p !== page) }));
  };

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData((prev) => ({ ...prev, features: [...prev.features, newFeature.trim()] }));
      setNewFeature('');
    }
  };

  const removeFeature = (feature) => {
    setFormData((prev) => ({ ...prev, features: prev.features.filter((f) => f !== feature) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Nouvelle demande de site</h2>

      {/* Nom du site */}
      <div>
        <label className="block text-sm font-medium mb-1">Nom du site *</label>
        <input
          type="text"
          name="site_name"
          value={formData.site_name}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="Mon Super Site"
        />
      </div>

      {/* Type de site */}
      <div>
        <label className="block text-sm font-medium mb-1">Type de site</label>
        <select
          name="site_type"
          value={formData.site_type}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="site vitrine">Site vitrine</option>
          <option value="blog">Blog</option>
          <option value="e-commerce">E-commerce</option>
          <option value="portfolio">Portfolio</option>
          <option value="landing page">Landing Page</option>
        </select>
      </div>

      {/* Objectif */}
      <div>
        <label className="block text-sm font-medium mb-1">Objectif du site</label>
        <textarea
          name="objective"
          value={formData.objective}
          onChange={handleChange}
          rows={3}
          className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="Décrire l'objectif principal du site..."
        />
      </div>

      {/* Pages */}
      <div>
        <label className="block text-sm font-medium mb-2">Pages</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.pages.map((page) => (
            <span
              key={page}
              className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
            >
              {page}
              <button
                type="button"
                onClick={() => removePage(page)}
                className="ml-2 text-blue-600 dark:text-blue-300 hover:text-red-500"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newPage}
            onChange={(e) => setNewPage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPage())}
            className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Ajouter une page..."
          />
          <button
            type="button"
            onClick={addPage}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
          >
            +
          </button>
        </div>
      </div>

      {/* Fonctionnalités */}
      <div>
        <label className="block text-sm font-medium mb-2">Fonctionnalités</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.features.map((feature) => (
            <span
              key={feature}
              className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm"
            >
              {feature}
              <button
                type="button"
                onClick={() => removeFeature(feature)}
                className="ml-2 text-green-600 dark:text-green-300 hover:text-red-500"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
            className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Ajouter une fonctionnalité..."
          />
          <button
            type="button"
            onClick={addFeature}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
          >
            +
          </button>
        </div>
      </div>

      {/* Style et couleur */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Style de design</label>
          <select
            name="design_style"
            value={formData.design_style}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="moderne">Moderne</option>
            <option value="minimaliste">Minimaliste</option>
            <option value="corporate">Corporate</option>
            <option value="créatif">Créatif</option>
            <option value="élégant">Élégant</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Couleur principale</label>
          <div className="flex gap-2">
            <input
              type="color"
              name="primary_color"
              value={formData.primary_color}
              onChange={handleChange}
              className="h-10 w-16 rounded cursor-pointer"
            />
            <input
              type="text"
              value={formData.primary_color}
              onChange={(e) => setFormData((prev) => ({ ...prev, primary_color: e.target.value }))}
              className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !formData.site_name}
        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
      >
        {loading ? 'Envoi en cours...' : 'Lancer la génération'}
      </button>
    </form>
  );
}

export default RequestForm;
