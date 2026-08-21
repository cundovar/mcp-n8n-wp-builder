================================================================================
PLAN DE CONSTRUCTION WORDPRESS
================================================================================

Site: Atelier Martin Couverture
Type: site vitrine
ID: c0f33734-027f-41c7-8d96-d06f76b4dfce

--------------------------------------------------------------------------------
INSTRUCTIONS POUR L'IA
--------------------------------------------------------------------------------

Tu dois construire un site WordPress en suivant ce plan.
Chaque section contient des spécifications JSON à respecter.

========================================
ARCHITECTURE DU SITE
========================================

{
  "contract_version": "1.0",
  "request_id": "c0f33734-027f-41c7-8d96-d06f76b4dfce",
  "stage": "site_architecture",
  "payload": {
    "site_name": "Atelier Martin Couverture",
    "site_type": "site vitrine",
    "pages": [
      {
        "slug": "accueil",
        "title": "Accueil",
        "goal": "Présenter immédiatement Atelier Martin Couverture comme un couvreur zingueur local fiable autour de Lyon et orienter vers une demande de devis.",
        "sections": [
          {
            "type": "hero",
            "title": "Couvreur zingueur à Lyon et alentours",
            "content_brief": "Section Elementor pleine largeur avec titre clair, promesse de confiance, zone d’intervention, bouton principal Demander un devis et bouton secondaire Voir les services. Prévoir une image de toiture ou chantier en arrière-plan."
          },
          {
            "type": "trust_highlights",
            "title": "Un artisan local pour vos travaux de toiture",
            "content_brief": "Mettre en avant 3 à 4 arguments de réassurance : intervention locale, conseils personnalisés, finitions soignées, devis clair. Utiliser des colonnes Elementor avec icônes sobres."
          },
          {
            "type": "services_overview",
            "title": "Nos services de couverture et zinguerie",
            "content_brief": "Présenter les services principaux sous forme de cartes Elementor : couverture, rénovation de toiture, zinguerie, entretien et réparation. Chaque carte renvoie vers la page Services."
          },
          {
            "type": "local_seo",
            "title": "Interventions autour de Lyon",
            "content_brief": "Texte optimisé SEO local expliquant les interventions à Lyon et communes proches. Prévoir un bouton vers la page Zone d’intervention."
          },
          {
            "type": "portfolio_preview",
            "title": "Réalisations récentes",
            "content_brief": "Afficher 3 réalisations de chantiers sous forme de grille Elementor avec photos, type de travaux et commune."
          },
          {
            "type": "cta",
            "title": "Besoin d’un avis sur votre toiture ?",
            "content_brief": "Bloc d’appel à l’action avec bouton vers le formulaire de devis, rappel de la réponse locale et personnalisée."
          }
        ]
      },
      {
        "slug": "services",
        "title": "Services",
        "goal": "Détailler les prestations de couverture, zinguerie et rénovation pour aider les visiteurs à identifier leur besoin.",
        "sections": [
          {
            "type": "page_header",
            "title": "Travaux de couverture, zinguerie et rénovation",
            "content_brief": "En-tête simple avec résumé des prestations et bouton de demande de devis."
          },
          {
            "type": "service_detail",
            "title": "Couverture",
            "content_brief": "Décrire les travaux de pose, remplacement et réparation de couverture. Prévoir une mise en page Elementor en deux colonnes avec texte et visuel."
          },
          {
            "type": "service_detail",
            "title": "Rénovation de toiture",
            "content_brief": "Présenter la rénovation complète ou partielle, diagnostic, remplacement d’éléments abîmés et amélioration de l’étanchéité."
          },
          {
            "type": "service_detail",
            "title": "Zinguerie",
            "content_brief": "Expliquer les prestations liées aux gouttières, chéneaux, abergements, rives et évacuations d’eau pluviale."
          },
          {
            "type": "service_detail",
            "title": "Entretien et réparation",
            "content_brief": "Mettre en avant les interventions de nettoyage, réparation de fuites, remplacement d’éléments et contrôle préventif."
          },
          {
            "type": "process",
            "title": "Déroulé d’une intervention",
            "content_brief": "Présenter les étapes : prise de contact, diagnostic, devis, planification, intervention, contrôle de fin de chantier."
          },
          {
            "type": "cta",
            "title": "Décrivez votre projet de toiture",
            "content_brief": "Bloc Elementor avec bouton vers Contact / Devis et rappel des informations utiles à fournir."
          }
        ]
      },
      {
        "slug": "realisations",
        "title": "Réalisations",
        "goal": "Renforcer la crédibilité par des exemples concrets de chantiers réalisés autour de Lyon.",
        "sections": [
          {
            "type": "page_header",
            "title": "Nos chantiers de toiture",
            "content_brief": "Introduction rassurante sur la qualité des finitions et l’expérience terrain."
          },
          {
            "type": "portfolio_grid",
            "title": "Exemples de réalisations",
            "content_brief": "Grille Elementor filtrable ou simple avec photos, type de prestation, commune, court descriptif. Prévoir images réelles de chantiers dès disponibilité."
          },
          {
            "type": "before_after",
            "title": "Avant / après",
            "content_brief": "Prévoir un module Elementor compatible avant/après si des photos sont disponibles, sinon une section prête à alimenter plus tard."
          },
          {
            "type": "cta",
            "title": "Vous avez un projet similaire ?",
            "content_brief": "Appel à l’action vers la demande de devis."
          }
        ]
      },
      {
        "slug": "a-propos",
        "title": "À propos",
        "goal": "Humaniser l’entreprise et installer la confiance auprès de propriétaires locaux.",
        "sections": [
          {
            "type": "page_header",
            "title": "Atelier Martin Couverture",
            "content_brief": "Présenter l’entreprise, son ancrage local et son positionnement fiable, accessible et qualitatif."
          },
          {
            "type": "story",
            "title": "Un savoir-faire artisanal au service de votre toiture",
            "content_brief": "Raconter l’approche métier : conseil, précision, respect de l’habitat, suivi de chantier."
          },
          {
            "type": "values",
            "title": "Nos engagements",
            "content_brief": "Mettre en avant transparence du devis, propreté du chantier, durabilité des solutions, proximité locale."
          },
          {
            "type": "proof",
            "title": "Garanties et assurances",
            "content_brief": "Prévoir une section pour assurance décennale, certifications, années d’expérience et avis clients à compléter."
          },
          {
            "type": "cta",
            "title": "Échangeons sur votre toiture",
            "content_brief": "Bouton vers Contact / Devis."
          }
        ]
      },
      {
        "slug": "zone-intervention",
        "title": "Zone d’intervention",
        "goal": "Optimiser le référencement local et rassurer les visiteurs sur la disponibilité autour de Lyon.",
        "sections": [
          {
            "type": "page_header",
            "title": "Couvreur zingueur autour de Lyon",
            "content_brief": "Texte d’introduction SEO local indiquant que l’entreprise intervient à Lyon et dans les communes proches."
          },
          {
            "type": "local_areas",
            "title": "Communes desservies",
            "content_brief": "Prévoir une liste de zones à compléter : Lyon, Villeurbanne, Caluire-et-Cuire, Écully, Tassin-la-Demi-Lune, Bron, Vénissieux et autres communes selon confirmation."
          },
          {
            "type": "map",
            "title": "Notre secteur d’intervention",
            "content_brief": "Prévoir un emplacement pour carte Google Maps ou carte statique intégrable dans Elementor après validation de l’adresse."
          },
          {
            "type": "local_content",
            "title": "Des travaux adaptés aux maisons de la région lyonnaise",
            "content_brief": "Contenu orienté expertise locale : toitures anciennes, rénovation, intempéries, entretien préventif."
          },
          {
            "type": "cta",
            "title": "Demander un devis dans votre commune",
            "content_brief": "Bouton vers le formulaire avec mention de la zone d’intervention."
          }
        ]
      },
      {
        "slug": "contact-devis",
        "title": "Contact / Devis",
        "goal": "Convertir les visiteurs en demandes de devis qualifiées.",
        "sections": [
          {
            "type": "page_header",
            "title": "Demander un devis toiture",
            "content_brief": "Présenter une promesse de réponse claire et locale. Inviter à décrire le besoin."
          },
          {
            "type": "contact_form",
            "title": "Votre demande",
            "content_brief": "Formulaire Contact Form 7 intégré dans Elementor avec champs : nom, téléphone, email, commune, type de travaux, message, ajout de photos si possible."
          },
          {
            "type": "contact_details",
            "title": "Coordonnées",
            "content_brief": "Prévoir emplacements pour téléphone, email, adresse ou zone de rattachement, horaires et mentions de rappel."
          },
          {
            "type": "reassurance",
            "title": "Avant le devis",
            "content_brief": "Indiquer les informations utiles à préparer : type de toiture, urgence, photos, adresse du chantier, accès."
          }
        ]
      },
      {
        "slug": "mentions-legales",
        "title": "Mentions légales",
        "goal": "Prévoir la page obligatoire d’informations légales du site.",
        "sections": [
          {
            "type": "legal_content",
            "title": "Mentions légales",
            "content_brief": "Page Elementor simple à compléter avec identité de l’entreprise, responsable de publication, hébergeur, propriété intellectuelle et données personnelles."
          }
        ]
      }
    ],
    "design_direction": {
      "tone": "Fiable, local, professionnel, haut de gamme accessible, avec une écriture claire et rassurante pour des propriétaires de maisons de 35 à 65 ans autour de Lyon.",
      "colors": "Palette principale bleu ardoise pour la confiance et le sérieux, blanc cassé pour les fonds, gris doux pour les séparations, accent cuivre pour les boutons, pictogrammes et détails de zinguerie.",
      "layout": "Structure Elementor sobre et orientée conversion : sections pleine largeur, contenus en conteneurs centrés, héros visuel, blocs de services en cartes, alternance texte/image, appels à l’action réguliers, formulaires visibles et responsive mobile-first."
    },
    "technical_notes": [
      "Utiliser Astra comme thème parent et créer un thème enfant Astra obligatoire, activé dès l’installation.",
      "Configurer Elementor comme page builder principal pour toutes les pages vitrines.",
      "Construire les pages avec des sections Elementor réutilisables : hero, services, CTA, témoignages, réalisations, formulaire et blocs de réassurance.",
      "Éviter les constructeurs concurrents ou thèmes incompatibles avec Astra et Elementor.",
      "Prévoir une structure SEO locale avec titres H1 uniques, H2 orientés services et localité, slugs lisibles et maillage interne entre Accueil, Services, Zone d’intervention et Contact.",
      "Installer et configurer Yoast SEO via wordpress-seo pour les métadonnées, sitemap XML et optimisations locales de base.",
      "Utiliser Contact Form 7 pour le formulaire de demande de devis, intégré dans Elementor.",
      "Configurer WP Mail SMTP pour fiabiliser l’envoi des formulaires.",
      "Installer Safe SVG uniquement si le logo ou les pictogrammes SVG doivent être importés.",
      "Installer Duplicate Post pour faciliter la duplication de pages ou sections lors de l’intégration.",
      "Prévoir des performances compatibles avec Astra : images compressées, sections Elementor limitées aux besoins réels, pas de surcharge de plugins visuels inutiles.",
      "Collecter avant mise en ligne les coordonnées, mentions légales, assurances, garanties, photos de chantiers, avis clients et zone d’intervention exacte."
    ],
    "wordpress_stack": {
      "theme_parent": "astra",
      "theme_child_required": true,
      "page_builder": "elementor",
      "plugins_required": [
        "elementor",
        "wordpress-seo",
        "contact-form-7",
        "duplicate-post",
        "safe-svg",
        "wp-mail-smtp"
      ]
    }
  }
}

========================================
CONTENU DES PAGES
========================================

{
  "contract_version": "1.0",
  "request_id": "c0f33734-027f-41c7-8d96-d06f76b4dfce",
  "stage": "content_plan",
  "payload": {
    "pages": [
      {
        "slug": "accueil",
        "seo_title": "Accueil | Atelier Martin Couverture",
        "meta_description": "Présenter immédiatement Atelier Martin Couverture comme un couvreur zingueur local fiable autour de Lyon et orienter vers une demande de devis.. Couvreur zingueur à Lyon et alentours, Un artisan local pour vos travaux de toiture, Nos services de couverture et zinguerie, Interventions autour de Lyon, Réalisations récentes, Besoin d’un avis sur votre toiture ?.",
        "sections": [
          {
            "section_id": "accueil-section-1",
            "copy_goal": "Section Elementor pleine largeur avec titre clair, promesse de confiance, zone d’intervention, bouton principal Demander un devis et bouton secondaire Voir les services. Prévoir une image de toiture ou chantier en arrière-plan.",
            "content_blocks": [
              {
                "type": "hero",
                "title": "Couvreur zingueur à Lyon et alentours",
                "brief": "Section Elementor pleine largeur avec titre clair, promesse de confiance, zone d’intervention, bouton principal Demander un devis et bouton secondaire Voir les services. Prévoir une image de toiture ou chantier en arrière-plan."
              }
            ]
          },
          {
            "section_id": "accueil-section-2",
            "copy_goal": "Mettre en avant 3 à 4 arguments de réassurance : intervention locale, conseils personnalisés, finitions soignées, devis clair. Utiliser des colonnes Elementor avec icônes sobres.",
            "content_blocks": [
              {
                "type": "trust_highlights",
                "title": "Un artisan local pour vos travaux de toiture",
                "brief": "Mettre en avant 3 à 4 arguments de réassurance : intervention locale, conseils personnalisés, finitions soignées, devis clair. Utiliser des colonnes Elementor avec icônes sobres."
              }
            ]
          },
          {
            "section_id": "accueil-section-3",
            "copy_goal": "Présenter les services principaux sous forme de cartes Elementor : couverture, rénovation de toiture, zinguerie, entretien et réparation. Chaque carte renvoie vers la page Services.",
            "content_blocks": [
              {
                "type": "services_overview",
                "title": "Nos services de couverture et zinguerie",
                "brief": "Présenter les services principaux sous forme de cartes Elementor : couverture, rénovation de toiture, zinguerie, entretien et réparation. Chaque carte renvoie vers la page Services."
              }
            ]
          },
          {
            "section_id": "accueil-section-4",
            "copy_goal": "Texte optimisé SEO local expliquant les interventions à Lyon et communes proches. Prévoir un bouton vers la page Zone d’intervention.",
            "content_blocks": [
              {
                "type": "local_seo",
                "title": "Interventions autour de Lyon",
                "brief": "Texte optimisé SEO local expliquant les interventions à Lyon et communes proches. Prévoir un bouton vers la page Zone d’intervention."
              }
            ]
          },
          {
            "section_id": "accueil-section-5",
            "copy_goal": "Afficher 3 réalisations de chantiers sous forme de grille Elementor avec photos, type de travaux et commune.",
            "content_blocks": [
              {
                "type": "portfolio_preview",
                "title": "Réalisations récentes",
                "brief": "Afficher 3 réalisations de chantiers sous forme de grille Elementor avec photos, type de travaux et commune."
              }
            ]
          },
          {
            "section_id": "accueil-section-6",
            "copy_goal": "Bloc d’appel à l’action avec bouton vers le formulaire de devis, rappel de la réponse locale et personnalisée.",
            "content_blocks": [
              {
                "type": "cta",
                "title": "Besoin d’un avis sur votre toiture ?",
                "brief": "Bloc d’appel à l’action avec bouton vers le formulaire de devis, rappel de la réponse locale et personnalisée."
              }
            ]
          }
        ]
      },
      {
        "slug": "services",
        "seo_title": "Services | Atelier Martin Couverture",
        "meta_description": "Détailler les prestations de couverture, zinguerie et rénovation pour aider les visiteurs à identifier leur besoin.. Travaux de couverture, zinguerie et rénovation, Couverture, Rénovation de toiture, Zinguerie, Entretien et réparation, Déroulé d’une intervention, Décrivez votre projet de toiture.",
        "sections": [
          {
            "section_id": "services-section-1",
            "copy_goal": "En-tête simple avec résumé des prestations et bouton de demande de devis.",
            "content_blocks": [
              {
                "type": "page_header",
                "title": "Travaux de couverture, zinguerie et rénovation",
                "brief": "En-tête simple avec résumé des prestations et bouton de demande de devis."
              }
            ]
          },
          {
            "section_id": "services-section-2",
            "copy_goal": "Décrire les travaux de pose, remplacement et réparation de couverture. Prévoir une mise en page Elementor en deux colonnes avec texte et visuel.",
            "content_blocks": [
              {
                "type": "service_detail",
                "title": "Couverture",
                "brief": "Décrire les travaux de pose, remplacement et réparation de couverture. Prévoir une mise en page Elementor en deux colonnes avec texte et visuel."
              }
            ]
          },
          {
            "section_id": "services-section-3",
            "copy_goal": "Présenter la rénovation complète ou partielle, diagnostic, remplacement d’éléments abîmés et amélioration de l’étanchéité.",
            "content_blocks": [
              {
                "type": "service_detail",
                "title": "Rénovation de toiture",
                "brief": "Présenter la rénovation complète ou partielle, diagnostic, remplacement d’éléments abîmés et amélioration de l’étanchéité."
              }
            ]
          },
          {
            "section_id": "services-section-4",
            "copy_goal": "Expliquer les prestations liées aux gouttières, chéneaux, abergements, rives et évacuations d’eau pluviale.",
            "content_blocks": [
              {
                "type": "service_detail",
                "title": "Zinguerie",
                "brief": "Expliquer les prestations liées aux gouttières, chéneaux, abergements, rives et évacuations d’eau pluviale."
              }
            ]
          },
          {
            "section_id": "services-section-5",
            "copy_goal": "Mettre en avant les interventions de nettoyage, réparation de fuites, remplacement d’éléments et contrôle préventif.",
            "content_blocks": [
              {
                "type": "service_detail",
                "title": "Entretien et réparation",
                "brief": "Mettre en avant les interventions de nettoyage, réparation de fuites, remplacement d’éléments et contrôle préventif."
              }
            ]
          },
          {
            "section_id": "services-section-6",
            "copy_goal": "Présenter les étapes : prise de contact, diagnostic, devis, planification, intervention, contrôle de fin de chantier.",
            "content_blocks": [
              {
                "type": "process",
                "title": "Déroulé d’une intervention",
                "brief": "Présenter les étapes : prise de contact, diagnostic, devis, planification, intervention, contrôle de fin de chantier."
              }
            ]
          },
          {
            "section_id": "services-section-7",
            "copy_goal": "Bloc Elementor avec bouton vers Contact / Devis et rappel des informations utiles à fournir.",
            "content_blocks": [
              {
                "type": "cta",
                "title": "Décrivez votre projet de toiture",
                "brief": "Bloc Elementor avec bouton vers Contact / Devis et rappel des informations utiles à fournir."
              }
            ]
          }
        ]
      },
      {
        "slug": "realisations",
        "seo_title": "Réalisations | Atelier Martin Couverture",
        "meta_description": "Renforcer la crédibilité par des exemples concrets de chantiers réalisés autour de Lyon.. Nos chantiers de toiture, Exemples de réalisations, Avant / après, Vous avez un projet similaire ?.",
        "sections": [
          {
            "section_id": "realisations-section-1",
            "copy_goal": "Introduction rassurante sur la qualité des finitions et l’expérience terrain.",
            "content_blocks": [
              {
                "type": "page_header",
                "title": "Nos chantiers de toiture",
                "brief": "Introduction rassurante sur la qualité des finitions et l’expérience terrain."
              }
            ]
          },
          {
            "section_id": "realisations-section-2",
            "copy_goal": "Grille Elementor filtrable ou simple avec photos, type de prestation, commune, court descriptif. Prévoir images réelles de chantiers dès disponibilité.",
            "content_blocks": [
              {
                "type": "portfolio_grid",
                "title": "Exemples de réalisations",
                "brief": "Grille Elementor filtrable ou simple avec photos, type de prestation, commune, court descriptif. Prévoir images réelles de chantiers dès disponibilité."
              }
            ]
          },
          {
            "section_id": "realisations-section-3",
            "copy_goal": "Prévoir un module Elementor compatible avant/après si des photos sont disponibles, sinon une section prête à alimenter plus tard.",
            "content_blocks": [
              {
                "type": "before_after",
                "title": "Avant / après",
                "brief": "Prévoir un module Elementor compatible avant/après si des photos sont disponibles, sinon une section prête à alimenter plus tard."
              }
            ]
          },
          {
            "section_id": "realisations-section-4",
            "copy_goal": "Appel à l’action vers la demande de devis.",
            "content_blocks": [
              {
                "type": "cta",
                "title": "Vous avez un projet similaire ?",
                "brief": "Appel à l’action vers la demande de devis."
              }
            ]
          }
        ]
      },
      {
        "slug": "a-propos",
        "seo_title": "À propos | Atelier Martin Couverture",
        "meta_description": "Humaniser l’entreprise et installer la confiance auprès de propriétaires locaux.. Atelier Martin Couverture, Un savoir-faire artisanal au service de votre toiture, Nos engagements, Garanties et assurances, Échangeons sur votre toiture.",
        "sections": [
          {
            "section_id": "a-propos-section-1",
            "copy_goal": "Présenter l’entreprise, son ancrage local et son positionnement fiable, accessible et qualitatif.",
            "content_blocks": [
              {
                "type": "page_header",
                "title": "Atelier Martin Couverture",
                "brief": "Présenter l’entreprise, son ancrage local et son positionnement fiable, accessible et qualitatif."
              }
            ]
          },
          {
            "section_id": "a-propos-section-2",
            "copy_goal": "Raconter l’approche métier : conseil, précision, respect de l’habitat, suivi de chantier.",
            "content_blocks": [
              {
                "type": "story",
                "title": "Un savoir-faire artisanal au service de votre toiture",
                "brief": "Raconter l’approche métier : conseil, précision, respect de l’habitat, suivi de chantier."
              }
            ]
          },
          {
            "section_id": "a-propos-section-3",
            "copy_goal": "Mettre en avant transparence du devis, propreté du chantier, durabilité des solutions, proximité locale.",
            "content_blocks": [
              {
                "type": "values",
                "title": "Nos engagements",
                "brief": "Mettre en avant transparence du devis, propreté du chantier, durabilité des solutions, proximité locale."
              }
            ]
          },
          {
            "section_id": "a-propos-section-4",
            "copy_goal": "Prévoir une section pour assurance décennale, certifications, années d’expérience et avis clients à compléter.",
            "content_blocks": [
              {
                "type": "proof",
                "title": "Garanties et assurances",
                "brief": "Prévoir une section pour assurance décennale, certifications, années d’expérience et avis clients à compléter."
              }
            ]
          },
          {
            "section_id": "a-propos-section-5",
            "copy_goal": "Bouton vers Contact / Devis.",
            "content_blocks": [
              {
                "type": "cta",
                "title": "Échangeons sur votre toiture",
                "brief": "Bouton vers Contact / Devis."
              }
            ]
          }
        ]
      },
      {
        "slug": "zone-intervention",
        "seo_title": "Zone d’intervention | Atelier Martin Couverture",
        "meta_description": "Optimiser le référencement local et rassurer les visiteurs sur la disponibilité autour de Lyon.. Couvreur zingueur autour de Lyon, Communes desservies, Notre secteur d’intervention, Des travaux adaptés aux maisons de la région lyonnaise, Demander un devis dans votre commune.",
        "sections": [
          {
            "section_id": "zone-intervention-section-1",
            "copy_goal": "Texte d’introduction SEO local indiquant que l’entreprise intervient à Lyon et dans les communes proches.",
            "content_blocks": [
              {
                "type": "page_header",
                "title": "Couvreur zingueur autour de Lyon",
                "brief": "Texte d’introduction SEO local indiquant que l’entreprise intervient à Lyon et dans les communes proches."
              }
            ]
          },
          {
            "section_id": "zone-intervention-section-2",
            "copy_goal": "Prévoir une liste de zones à compléter : Lyon, Villeurbanne, Caluire-et-Cuire, Écully, Tassin-la-Demi-Lune, Bron, Vénissieux et autres communes selon confirmation.",
            "content_blocks": [
              {
                "type": "local_areas",
                "title": "Communes desservies",
                "brief": "Prévoir une liste de zones à compléter : Lyon, Villeurbanne, Caluire-et-Cuire, Écully, Tassin-la-Demi-Lune, Bron, Vénissieux et autres communes selon confirmation."
              }
            ]
          },
          {
            "section_id": "zone-intervention-section-3",
            "copy_goal": "Prévoir un emplacement pour carte Google Maps ou carte statique intégrable dans Elementor après validation de l’adresse.",
            "content_blocks": [
              {
                "type": "map",
                "title": "Notre secteur d’intervention",
                "brief": "Prévoir un emplacement pour carte Google Maps ou carte statique intégrable dans Elementor après validation de l’adresse."
              }
            ]
          },
          {
            "section_id": "zone-intervention-section-4",
            "copy_goal": "Contenu orienté expertise locale : toitures anciennes, rénovation, intempéries, entretien préventif.",
            "content_blocks": [
              {
                "type": "local_content",
                "title": "Des travaux adaptés aux maisons de la région lyonnaise",
                "brief": "Contenu orienté expertise locale : toitures anciennes, rénovation, intempéries, entretien préventif."
              }
            ]
          },
          {
            "section_id": "zone-intervention-section-5",
            "copy_goal": "Bouton vers le formulaire avec mention de la zone d’intervention.",
            "content_blocks": [
              {
                "type": "cta",
                "title": "Demander un devis dans votre commune",
                "brief": "Bouton vers le formulaire avec mention de la zone d’intervention."
              }
            ]
          }
        ]
      },
      {
        "slug": "contact-devis",
        "seo_title": "Contact / Devis | Atelier Martin Couverture",
        "meta_description": "Convertir les visiteurs en demandes de devis qualifiées.. Demander un devis toiture, Votre demande, Coordonnées, Avant le devis.",
        "sections": [
          {
            "section_id": "contact-devis-section-1",
            "copy_goal": "Présenter une promesse de réponse claire et locale. Inviter à décrire le besoin.",
            "content_blocks": [
              {
                "type": "page_header",
                "title": "Demander un devis toiture",
                "brief": "Présenter une promesse de réponse claire et locale. Inviter à décrire le besoin."
              }
            ]
          },
          {
            "section_id": "contact-devis-section-2",
            "copy_goal": "Formulaire Contact Form 7 intégré dans Elementor avec champs : nom, téléphone, email, commune, type de travaux, message, ajout de photos si possible.",
            "content_blocks": [
              {
                "type": "contact_form",
                "title": "Votre demande",
                "brief": "Formulaire Contact Form 7 intégré dans Elementor avec champs : nom, téléphone, email, commune, type de travaux, message, ajout de photos si possible."
              }
            ]
          },
          {
            "section_id": "contact-devis-section-3",
            "copy_goal": "Prévoir emplacements pour téléphone, email, adresse ou zone de rattachement, horaires et mentions de rappel.",
            "content_blocks": [
              {
                "type": "contact_details",
                "title": "Coordonnées",
                "brief": "Prévoir emplacements pour téléphone, email, adresse ou zone de rattachement, horaires et mentions de rappel."
              }
            ]
          },
          {
            "section_id": "contact-devis-section-4",
            "copy_goal": "Indiquer les informations utiles à préparer : type de toiture, urgence, photos, adresse du chantier, accès.",
            "content_blocks": [
              {
                "type": "reassurance",
                "title": "Avant le devis",
                "brief": "Indiquer les informations utiles à préparer : type de toiture, urgence, photos, adresse du chantier, accès."
              }
            ]
          }
        ]
      },
      {
        "slug": "mentions-legales",
        "seo_title": "Mentions légales | Atelier Martin Couverture",
        "meta_description": "Prévoir la page obligatoire d’informations légales du site.. Mentions légales.",
        "sections": [
          {
            "section_id": "mentions-legales-section-1",
            "copy_goal": "Page Elementor simple à compléter avec identité de l’entreprise, responsable de publication, hébergeur, propriété intellectuelle et données personnelles.",
            "content_blocks": [
              {
                "type": "legal_content",
                "title": "Mentions légales",
                "brief": "Page Elementor simple à compléter avec identité de l’entreprise, responsable de publication, hébergeur, propriété intellectuelle et données personnelles."
              }
            ]
          }
        ]
      }
    ]
  }
}

========================================
DESIGN ET STYLE
========================================

{
  "contract_version": "1.0",
  "request_id": "c0f33734-027f-41c7-8d96-d06f76b4dfce",
  "stage": "design_plan",
  "payload": {
    "design_assumptions": [
      "Les coordonnées réelles de l'entreprise ne sont pas fournies : le design prévoit des emplacements visibles pour téléphone, email, adresse et horaires à compléter.",
      "Les photos de chantiers ne sont pas fournies : le design utilise des visuels réalistes de toiture, zinguerie, ardoise, tuiles et détails de finition comme placeholders éditoriaux.",
      "La zone exacte autour de Lyon n'est pas détaillée : le design prévoit une page zone d'intervention avec communes prioritaires à compléter.",
      "Les preuves de confiance ne sont pas confirmées : le design réserve des blocs pour assurance décennale, garanties, qualifications, avis clients et années d'expérience.",
      "L'appel à l'action principal retenu est Demander un devis, avec un appel secondaire Voir nos services.",
      "Le site doit rester sobre et crédible pour des propriétaires de 35 à 65 ans : la direction visuelle évite les effets décoratifs excessifs et privilégie lisibilité, preuves et conversion."
    ],
    "brand_direction": {
      "tone": "Rassurant, précis et ancré localement, avec un vocabulaire de conseil, de diagnostic toiture, de devis clair et de finitions durables.",
      "visual_positioning": "Atelier artisanal lyonnais sérieux, haut de gamme accessible, combinant aplats bleu ardoise, fonds blanc cassé, détails cuivre et photographies de chantiers propres.",
      "palette": [
        {
          "name": "Bleu ardoise",
          "value": "#263A4A",
          "usage": "Couleur principale pour header, footer, titres majeurs, bandeaux de confiance et fonds de CTA contrastés."
        },
        {
          "name": "Blanc casse",
          "value": "#F7F3EA",
          "usage": "Fond principal des pages, sections éditoriales et zones calmes autour des contenus."
        },
        {
          "name": "Cuivre toiture",
          "value": "#B66A3C",
          "usage": "Boutons principaux, pictogrammes, liens actifs, traits de séparation et accents de zinguerie."
        },
        {
          "name": "Gris zinc",
          "value": "#6F777B",
          "usage": "Textes secondaires, descriptions de cartes, métadonnées de réalisations et légendes."
        },
        {
          "name": "Blanc pur",
          "value": "#FFFFFF",
          "usage": "Cartes, formulaires, champs, zones de contraste sur fonds bleu ardoise ou gris clair."
        },
        {
          "name": "Charbon doux",
          "value": "#1B1F22",
          "usage": "Texte courant principal, menus, intitulés de formulaire et contenus longs."
        }
      ],
      "type_scale": {
        "heading_font": "Merriweather Sans",
        "heading_weights": [
          700
        ],
        "body_font": "Inter",
        "body_weight": 400,
        "base_size": "17px",
        "scale_ratio": 1.25,
        "computed_scale": {
          "h1": "48px",
          "h2": "38px",
          "h3": "30px",
          "h4": "24px",
          "body": "17px",
          "small": "14px"
        }
      },
      "layout_principles": [
        "Utiliser des sections Elementor pleine largeur avec contenu centre limite a 1180px.",
        "Placer un CTA devis visible dans le header, le hero, les pages services et le footer.",
        "Alterner fonds blanc casse, blanc pur et bleu ardoise pour structurer la lecture sans surcharge visuelle.",
        "Employer des grilles de 3 colonnes desktop, 2 colonnes tablette et 1 colonne mobile pour les services et engagements.",
        "Mettre les preuves de confiance avant les contenus longs sur la page d'accueil.",
        "Utiliser des photos de toiture nettes, lumineuses et locales comme signal visuel principal."
      ],
      "border_radius": {
        "base": "6px",
        "small": "3px",
        "large": "8px",
        "pill": "999px"
      },
      "shadows": {
        "sm": "0 2px 8px rgba(27, 31, 34, 0.08)",
        "md": "0 10px 24px rgba(27, 31, 34, 0.12)",
        "lg": "0 18px 42px rgba(27, 31, 34, 0.16)"
      }
    },
    "spacing_system": {
      "base_unit": "8px",
      "scale": {
        "xs": "8px",
        "sm": "16px",
        "md": "24px",
        "lg": "40px",
        "xl": "64px",
        "2xl": "96px"
      },
      "section_padding": {
        "desktop": "88px 24px",
        "tablet": "72px 24px",
        "mobile": "56px 18px"
      },
      "container_max_width": "1180px",
      "column_gap": "32px"
    },
    "component_guidelines": [
      {
        "component": "Header principal",
        "elementor_widget": "Theme Builder Header + Nav Menu + Button",
        "layout": "Barre horizontale sticky de 76px avec logo a gauche, navigation centree, telephone et bouton devis a droite.",
        "styling": {
          "background": "#FFFFFF",
          "padding": "0 24px",
          "typography": "Menu Inter 15px 600, bouton Inter 15px 700"
        },
        "interaction": "Header sticky avec ombre sm au scroll, etat actif cuivre sur les liens, menu mobile plein ecran sur fond blanc.",
        "guidelines": "Afficher le telephone comme preuve de proximite et garder le bouton Demander un devis visible sur desktop et mobile.",
        "avoid": [
          "Navigation sur deux lignes",
          "Header transparent sur toutes les pages",
          "Logo trop petit sous 140px de largeur"
        ]
      },
      {
        "component": "Hero accueil",
        "elementor_widget": "Container + Heading + Text Editor + Buttons + Image Background",
        "layout": "Hero 2 colonnes desktop avec texte a gauche et photo chantier a droite, hauteur minimale 620px desktop.",
        "styling": {
          "background": "#F7F3EA",
          "padding": "96px 24px 88px",
          "typography": "H1 Merriweather Sans 48px 700 line-height 1.12, texte Inter 19px line-height 1.65"
        },
        "interaction": "Bouton principal cuivre vers devis-contact, bouton secondaire contour bleu ardoise vers services.",
        "guidelines": "Inclure la promesse locale des les 8 premiers mots et ajouter trois preuves courtes sous les boutons.",
        "avoid": [
          "Hero sombre illisible",
          "Image de stock floue",
          "Titre vague sans mention couvreur zingueur Lyon"
        ]
      },
      {
        "component": "Cartes services",
        "elementor_widget": "Icon Box ou Container + Icon + Heading + Text",
        "layout": "Grille 4 cartes desktop, 2 tablette, 1 mobile avec pictogramme Safe SVG en haut.",
        "styling": {
          "background": "#FFFFFF",
          "padding": "28px",
          "typography": "Titre H3 24px Merriweather Sans 700, texte Inter 16px line-height 1.6"
        },
        "interaction": "Hover avec bordure cuivre #B66A3C et translation Y -3px.",
        "guidelines": "Chaque carte doit contenir un benefice client concret et un lien En savoir plus vers la section ou page service.",
        "avoid": [
          "Icônes multicolores",
          "Cartes de hauteur irreguliere",
          "Texte marketing sans prestation precise"
        ]
      },
      {
        "component": "Bandeau confiance",
        "elementor_widget": "Counter ou Icon List",
        "layout": "Bandeau bleu ardoise pleine largeur avec 4 preuves en colonnes.",
        "styling": {
          "background": "#263A4A",
          "padding": "38px 24px",
          "typography": "Libelles Inter 15px 600 en #FFFFFF, details Inter 14px en rgba(255,255,255,0.78)"
        },
        "interaction": "Aucune animation obligatoire, apparition fade-in 200ms acceptable.",
        "guidelines": "Utiliser les preuves Assurance décennale, Devis détaillé, Chantier propre, Intervention autour de Lyon comme placeholders.",
        "avoid": [
          "Chiffres inventes non verifies",
          "Badges trop decoratifs",
          "Contraste texte insuffisant"
        ]
      },
      {
        "component": "Process intervention",
        "elementor_widget": "Container + Icon List ou Steps custom",
        "layout": "Timeline horizontale desktop en 5 etapes, verticale mobile avec ligne cuivre fine.",
        "styling": {
          "background": "#F7F3EA",
          "padding": "72px 24px",
          "typography": "Etape Inter 13px 700 uppercase, titre H4 24px, texte 15px"
        },
        "interaction": "Survol discret des etapes avec icone cuivre.",
        "guidelines": "Rendre le parcours lisible : contact, diagnostic, devis, chantier, controle final.",
        "avoid": [
          "Plus de 6 etapes",
          "Animations de timeline complexes",
          "Jargon technique non explique"
        ]
      },
      {
        "component": "Galerie realisations",
        "elementor_widget": "Gallery",
        "layout": "Grille masonry moderee 3 colonnes desktop, 2 tablette, 1 mobile avec filtres Couverture, Zinguerie, Renovation.",
        "styling": {
          "background": "#FFFFFF",
          "padding": "0",
          "typography": "Legendes Inter 14px 500 en #6F777B"
        },
        "interaction": "Lightbox Elementor activee, hover avec overlay bleu ardoise a 72% et titre chantier.",
        "guidelines": "Associer chaque image a une commune, un type de prestation et un court resultat.",
        "avoid": [
          "Images avant/apres non alignees",
          "Photos basse resolution",
          "Galerie sans contexte local"
        ]
      },
      {
        "component": "Formulaire devis",
        "elementor_widget": "Shortcode Contact Form 7 dans Container Elementor",
        "layout": "Formulaire 2 colonnes desktop pour champs courts, message en pleine largeur, bloc coordonnees lateral.",
        "styling": {
          "background": "#FFFFFF",
          "padding": "32px",
          "typography": "Labels Inter 14px 700, champs Inter 16px, bouton Inter 16px 700"
        },
        "interaction": "Focus champs avec bordure cuivre, bouton pleine largeur mobile, message de validation visible sous le bouton.",
        "guidelines": "Champs requis : nom, telephone, email, commune, type de prestation, message. Ajouter upload photos seulement si le serveur email est configure.",
        "avoid": [
          "Formulaire en une seule colonne trop long sur desktop",
          "Champs sans labels visibles",
          "Bouton d'envoi gris ou peu contrasté"
        ]
      },
      {
        "component": "CTA devis",
        "elementor_widget": "Call To Action ou Container + Heading + Button",
        "layout": "Bloc pleine largeur bleu ardoise avec titre, texte court, telephone et bouton cuivre.",
        "styling": {
          "background": "#263A4A",
          "padding": "56px 32px",
          "typography": "Titre H2 34px blanc, texte Inter 18px blanc 86%"
        },
        "interaction": "Bouton cuivre devient #9F5730 au hover, lien telephone cliquable.",
        "guidelines": "Placer le CTA en fin de page accueil, services, zone-intervention et footer.",
        "avoid": [
          "CTA sans numero de telephone",
          "Fond image sous le texte",
          "Deux boutons de meme importance"
        ]
      },
      {
        "component": "Footer",
        "elementor_widget": "Theme Builder Footer + Icon List + Nav Menu",
        "layout": "Footer bleu ardoise en 4 colonnes : entreprise, services, zone d'intervention, contact.",
        "styling": {
          "background": "#263A4A",
          "padding": "64px 24px 28px",
          "typography": "Titres Inter 15px 700 uppercase, liens Inter 15px 400"
        },
        "interaction": "Liens hover cuivre, telephone cliquable, email cliquable.",
        "guidelines": "Inclure liens vers Accueil, Services, Realisations, Zone d'intervention, A propos, Devis et contact, Mentions legales.",
        "avoid": [
          "Footer minimal sans coordonnees",
          "Liens en faible contraste",
          "Texte SEO local trop long"
        ]
      }
    ],
    "imagery": {
      "style": "Photographies nettes de chantiers de toiture, artisans en situation, details de zinguerie cuivre ou zinc, maisons individuelles autour de Lyon, lumiere naturelle et cadrages propres.",
      "color_treatment": "Contraste doux, temperature legerement chaude, noirs non ecrases, bleu ardoise utilise en overlay uniquement a faible opacite entre 16% et 28%.",
      "subjects": [
        "Toiture en tuiles ou ardoises vue depuis un echafaudage securise",
        "Detail de gouttiere zinc ou cuivre bien posee",
        "Artisan couvreur controlant une rive de toiture",
        "Maison individuelle avec toiture renovee",
        "Avant apres de renovation toiture",
        "Materiaux de couverture ranges proprement sur chantier"
      ],
      "aspect_ratios": {
        "hero": "16:10",
        "card": "4:3",
        "avatar": "1:1"
      },
      "avoid": [
        "Photos de gratte-ciel ou batiments industriels",
        "Images sombres de toiture sous orage",
        "Artisans sans equipement de securite",
        "Visuels trop luxueux de villa hors cible locale",
        "Banques d'images avec sourires poses en bureau"
      ]
    },
    "elementor_guidelines": {
      "global_colors": [
        {
          "title": "Primary Slate Blue",
          "color": "#263A4A"
        },
        {
          "title": "Background Warm White",
          "color": "#F7F3EA"
        },
        {
          "title": "Accent Copper",
          "color": "#B66A3C"
        },
        {
          "title": "Secondary Zinc Gray",
          "color": "#6F777B"
        },
        {
          "title": "Surface White",
          "color": "#FFFFFF"
        },
        {
          "title": "Text Charcoal",
          "color": "#1B1F22"
        }
      ],
      "global_fonts": [
        {
          "title": "Heading H1",
          "font_family": "Merriweather Sans",
          "font_weight": "700",
          "font_size": {
            "desktop": "48px",
            "tablet": "40px",
            "mobile": "34px"
          }
        },
        {
          "title": "Heading H2",
          "font_family": "Merriweather Sans",
          "font_weight": "700",
          "font_size": {
            "desktop": "38px",
            "tablet": "32px",
            "mobile": "28px"
          }
        },
        {
          "title": "Heading H3",
          "font_family": "Merriweather Sans",
          "font_weight": "700",
          "font_size": {
            "desktop": "30px",
            "tablet": "26px",
            "mobile": "23px"
          }
        },
        {
          "title": "Body",
          "font_family": "Inter",
          "font_weight": "400",
          "font_size": {
            "desktop": "17px",
            "tablet": "16px",
            "mobile": "16px"
          }
        },
        {
          "title": "Button",
          "font_family": "Inter",
          "font_weight": "700",
          "font_size": {
            "desktop": "15px",
            "tablet": "15px",
            "mobile": "15px"
          }
        }
      ],
      "section_patterns": [
        {
          "pattern_name": "Hero devis local",
          "structure": "Container pleine largeur fond #F7F3EA, inner container 1180px, 2 colonnes 52/48, titre H1, texte, deux boutons, preuves courtes, image 16:10 avec radius 8px.",
          "used_on_pages": [
            "accueil"
          ]
        },
        {
          "pattern_name": "En-tete page sobre",
          "structure": "Section fond #F7F3EA, container 900px, titre H1 centre gauche, texte introductif 20px, fil d'Ariane optionnel.",
          "used_on_pages": [
            "services",
            "realisations",
            "zone-intervention",
            "a-propos",
            "devis-contact"
          ]
        },
        {
          "pattern_name": "Grille prestations",
          "structure": "Section fond #FFFFFF, container 1180px, titre H2, intro courte, grille cartes avec Icon Box, gap 32px.",
          "used_on_pages": [
            "accueil",
            "services"
          ]
        },
        {
          "pattern_name": "Detail service alterne",
          "structure": "Container 1180px en 2 colonnes image/texte alternees, image 4:3, liste de benefices, lien CTA texte cuivre.",
          "used_on_pages": [
            "services"
          ]
        },
        {
          "pattern_name": "Bandeau preuves",
          "structure": "Section pleine largeur #263A4A, 4 colonnes de preuves avec icones cuivre, texte blanc et separateurs rgba(255,255,255,0.18).",
          "used_on_pages": [
            "accueil",
            "a-propos",
            "devis-contact"
          ]
        },
        {
          "pattern_name": "Timeline intervention",
          "structure": "Section #F7F3EA avec 5 etapes numerotees, ligne cuivre 2px desktop, empilement vertical mobile.",
          "used_on_pages": [
            "accueil"
          ]
        },
        {
          "pattern_name": "Bloc SEO local",
          "structure": "Section #FFFFFF, container 960px, H2, texte SEO local, liste communes en colonnes, lien vers page zone-intervention.",
          "used_on_pages": [
            "accueil",
            "zone-intervention"
          ]
        },
        {
          "pattern_name": "Galerie chantier contextualisee",
          "structure": "Section #FFFFFF, filtres Elementor, grille 3 colonnes, captions commune + prestation + resultat.",
          "used_on_pages": [
            "realisations"
          ]
        },
        {
          "pattern_name": "Cartes etudes de cas",
          "structure": "Grille 3 cartes blanches avec image 4:3, tags cuivre, contexte, probleme, solution, commune.",
          "used_on_pages": [
            "realisations"
          ]
        },
        {
          "pattern_name": "Formulaire devis avec coordonnees",
          "structure": "Section #F7F3EA, container 1180px, colonne formulaire 65%, colonne contact 35%, cartes blanches radius 8px.",
          "used_on_pages": [
            "devis-contact"
          ]
        },
        {
          "pattern_name": "CTA final devis",
          "structure": "Section pleine largeur #263A4A, container 960px centre, H2 blanc, texte blanc 86%, bouton cuivre, telephone cliquable.",
          "used_on_pages": [
            "accueil",
            "services",
            "zone-intervention",
            "devis-contact"
          ]
        }
      ],
      "astra_child_variables": {
        "description": "Variables CSS a declarer dans le style.css du theme enfant Astra pour harmoniser Elementor, header, footer, boutons et formulaires.",
        "css_variables": [
          {
            "variable": "--amc-color-primary",
            "value": "#263A4A"
          },
          {
            "variable": "--amc-color-bg",
            "value": "#F7F3EA"
          },
          {
            "variable": "--amc-color-accent",
            "value": "#B66A3C"
          },
          {
            "variable": "--amc-color-muted",
            "value": "#6F777B"
          },
          {
            "variable": "--amc-color-surface",
            "value": "#FFFFFF"
          },
          {
            "variable": "--amc-color-text",
            "value": "#1B1F22"
          },
          {
            "variable": "--amc-font-heading",
            "value": "\"Merriweather Sans\", Arial, sans-serif"
          },
          {
            "variable": "--amc-font-body",
            "value": "\"Inter\", Arial, sans-serif"
          },
          {
            "variable": "--amc-radius-base",
            "value": "6px"
          },
          {
            "variable": "--amc-radius-large",
            "value": "8px"
          },
          {
            "variable": "--amc-container",
            "value": "1180px"
          },
          {
            "variable": "--amc-section-padding",
            "value": "88px"
          },
          {
            "variable": "--amc-shadow-sm",
            "value": "0 2px 8px rgba(27, 31, 34, 0.08)"
          },
          {
            "variable": "--amc-shadow-md",
            "value": "0 10px 24px rgba(27, 31, 34, 0.12)"
          }
        ]
      }
    }
  }
}

========================================
CONFIGURATION WORDPRESS
========================================

{
  "contract_version": "1.0",
  "request_id": "c0f33734-027f-41c7-8d96-d06f76b4dfce",
  "stage": "wordpress_plan",
  "payload": {
    "pages_to_create": [
      {
        "slug": "accueil",
        "title": "Accueil",
        "template": "default",
        "seo_title": "Accueil | Atelier Martin Couverture"
      },
      {
        "slug": "services",
        "title": "Services",
        "template": "default",
        "seo_title": "Services | Atelier Martin Couverture"
      },
      {
        "slug": "realisations",
        "title": "Réalisations",
        "template": "default",
        "seo_title": "Réalisations | Atelier Martin Couverture"
      },
      {
        "slug": "zone-intervention",
        "title": "Zone d'intervention",
        "template": "default",
        "seo_title": "Zone d'intervention | Atelier Martin Couverture"
      },
      {
        "slug": "a-propos",
        "title": "À propos",
        "template": "default",
        "seo_title": "À propos | Atelier Martin Couverture"
      },
      {
        "slug": "devis-contact",
        "title": "Devis et contact",
        "template": "default",
        "seo_title": "Devis et contact | Atelier Martin Couverture"
      }
    ],
    "menus_to_create": [
      {
        "name": "Primary",
        "location": "primary",
        "items": [
          {
            "label": "Accueil",
            "target_slug": "accueil"
          },
          {
            "label": "Services",
            "target_slug": "services"
          },
          {
            "label": "Réalisations",
            "target_slug": "realisations"
          },
          {
            "label": "Zone d'intervention",
            "target_slug": "zone-intervention"
          },
          {
            "label": "À propos",
            "target_slug": "a-propos"
          },
          {
            "label": "Devis et contact",
            "target_slug": "devis-contact"
          }
        ]
      }
    ],
    "plugins_to_install": [
      "elementor",
      "wordpress-seo",
      "contact-form-7",
      "duplicate-post",
      "safe-svg",
      "wp-mail-smtp"
    ],
    "theme_strategy": {
      "mode": "astra-child-elementor",
      "parent_theme": "astra",
      "child_theme": {
        "required": true,
        "name": "astra-child",
        "slug": "astra-child",
        "activate": true
      },
      "page_builder": "elementor",
      "preferred_palette": [
        {
          "name": "Bleu ardoise",
          "value": "#263A4A",
          "usage": "Couleur principale pour header, footer, titres majeurs, bandeaux de confiance et fonds de CTA contrastés."
        },
        {
          "name": "Blanc casse",
          "value": "#F7F3EA",
          "usage": "Fond principal des pages, sections éditoriales et zones calmes autour des contenus."
        },
        {
          "name": "Cuivre toiture",
          "value": "#B66A3C",
          "usage": "Boutons principaux, pictogrammes, liens actifs, traits de séparation et accents de zinguerie."
        },
        {
          "name": "Gris zinc",
          "value": "#6F777B",
          "usage": "Textes secondaires, descriptions de cartes, métadonnées de réalisations et légendes."
        },
        {
          "name": "Blanc pur",
          "value": "#FFFFFF",
          "usage": "Cartes, formulaires, champs, zones de contraste sur fonds bleu ardoise ou gris clair."
        },
        {
          "name": "Charbon doux",
          "value": "#1B1F22",
          "usage": "Texte courant principal, menus, intitulés de formulaire et contenus longs."
        }
      ],
      "layout_principles": [
        "Utiliser des sections Elementor pleine largeur avec contenu centre limite a 1180px.",
        "Placer un CTA devis visible dans le header, le hero, les pages services et le footer.",
        "Alterner fonds blanc casse, blanc pur et bleu ardoise pour structurer la lecture sans surcharge visuelle.",
        "Employer des grilles de 3 colonnes desktop, 2 colonnes tablette et 1 colonne mobile pour les services et engagements.",
        "Mettre les preuves de confiance avant les contenus longs sur la page d'accueil.",
        "Utiliser des photos de toiture nettes, lumineuses et locales comme signal visuel principal."
      ],
      "spacing_system": {
        "base_unit": "8px",
        "scale": {
          "xs": "8px",
          "sm": "16px",
          "md": "24px",
          "lg": "40px",
          "xl": "64px",
          "2xl": "96px"
        },
        "section_padding": {
          "desktop": "88px 24px",
          "tablet": "72px 24px",
          "mobile": "56px 18px"
        },
        "container_max_width": "1180px",
        "column_gap": "32px"
      },
      "elementor_globals": {
        "colors": [
          {
            "title": "Primary Slate Blue",
            "color": "#263A4A"
          },
          {
            "title": "Background Warm White",
            "color": "#F7F3EA"
          },
          {
            "title": "Accent Copper",
            "color": "#B66A3C"
          },
          {
            "title": "Secondary Zinc Gray",
            "color": "#6F777B"
          },
          {
            "title": "Surface White",
            "color": "#FFFFFF"
          },
          {
            "title": "Text Charcoal",
            "color": "#1B1F22"
          }
        ],
        "fonts": [
          {
            "title": "Heading H1",
            "font_family": "Merriweather Sans",
            "font_weight": "700",
            "font_size": {
              "desktop": "48px",
              "tablet": "40px",
              "mobile": "34px"
            }
          },
          {
            "title": "Heading H2",
            "font_family": "Merriweather Sans",
            "font_weight": "700",
            "font_size": {
              "desktop": "38px",
              "tablet": "32px",
              "mobile": "28px"
            }
          },
          {
            "title": "Heading H3",
            "font_family": "Merriweather Sans",
            "font_weight": "700",
            "font_size": {
              "desktop": "30px",
              "tablet": "26px",
              "mobile": "23px"
            }
          },
          {
            "title": "Body",
            "font_family": "Inter",
            "font_weight": "400",
            "font_size": {
              "desktop": "17px",
              "tablet": "16px",
              "mobile": "16px"
            }
          },
          {
            "title": "Button",
            "font_family": "Inter",
            "font_weight": "700",
            "font_size": {
              "desktop": "15px",
              "tablet": "15px",
              "mobile": "15px"
            }
          }
        ]
      },
      "section_patterns": [
        {
          "pattern_name": "Hero devis local",
          "structure": "Container pleine largeur fond #F7F3EA, inner container 1180px, 2 colonnes 52/48, titre H1, texte, deux boutons, preuves courtes, image 16:10 avec radius 8px.",
          "used_on_pages": [
            "accueil"
          ]
        },
        {
          "pattern_name": "En-tete page sobre",
          "structure": "Section fond #F7F3EA, container 900px, titre H1 centre gauche, texte introductif 20px, fil d'Ariane optionnel.",
          "used_on_pages": [
            "services",
            "realisations",
            "zone-intervention",
            "a-propos",
            "devis-contact"
          ]
        },
        {
          "pattern_name": "Grille prestations",
          "structure": "Section fond #FFFFFF, container 1180px, titre H2, intro courte, grille cartes avec Icon Box, gap 32px.",
          "used_on_pages": [
            "accueil",
            "services"
          ]
        },
        {
          "pattern_name": "Detail service alterne",
          "structure": "Container 1180px en 2 colonnes image/texte alternees, image 4:3, liste de benefices, lien CTA texte cuivre.",
          "used_on_pages": [
            "services"
          ]
        },
        {
          "pattern_name": "Bandeau preuves",
          "structure": "Section pleine largeur #263A4A, 4 colonnes de preuves avec icones cuivre, texte blanc et separateurs rgba(255,255,255,0.18).",
          "used_on_pages": [
            "accueil",
            "a-propos",
            "devis-contact"
          ]
        },
        {
          "pattern_name": "Timeline intervention",
          "structure": "Section #F7F3EA avec 5 etapes numerotees, ligne cuivre 2px desktop, empilement vertical mobile.",
          "used_on_pages": [
            "accueil"
          ]
        },
        {
          "pattern_name": "Bloc SEO local",
          "structure": "Section #FFFFFF, container 960px, H2, texte SEO local, liste communes en colonnes, lien vers page zone-intervention.",
          "used_on_pages": [
            "accueil",
            "zone-intervention"
          ]
        },
        {
          "pattern_name": "Galerie chantier contextualisee",
          "structure": "Section #FFFFFF, filtres Elementor, grille 3 colonnes, captions commune + prestation + resultat.",
          "used_on_pages": [
            "realisations"
          ]
        },
        {
          "pattern_name": "Cartes etudes de cas",
          "structure": "Grille 3 cartes blanches avec image 4:3, tags cuivre, contexte, probleme, solution, commune.",
          "used_on_pages": [
            "realisations"
          ]
        },
        {
          "pattern_name": "Formulaire devis avec coordonnees",
          "structure": "Section #F7F3EA, container 1180px, colonne formulaire 65%, colonne contact 35%, cartes blanches radius 8px.",
          "used_on_pages": [
            "devis-contact"
          ]
        },
        {
          "pattern_name": "CTA final devis",
          "structure": "Section pleine largeur #263A4A, container 960px centre, H2 blanc, texte blanc 86%, bouton cuivre, telephone cliquable.",
          "used_on_pages": [
            "accueil",
            "services",
            "zone-intervention",
            "devis-contact"
          ]
        }
      ],
      "astra_child_variables": {
        "description": "Variables CSS a declarer dans le style.css du theme enfant Astra pour harmoniser Elementor, header, footer, boutons et formulaires.",
        "css_variables": [
          {
            "variable": "--amc-color-primary",
            "value": "#263A4A"
          },
          {
            "variable": "--amc-color-bg",
            "value": "#F7F3EA"
          },
          {
            "variable": "--amc-color-accent",
            "value": "#B66A3C"
          },
          {
            "variable": "--amc-color-muted",
            "value": "#6F777B"
          },
          {
            "variable": "--amc-color-surface",
            "value": "#FFFFFF"
          },
          {
            "variable": "--amc-color-text",
            "value": "#1B1F22"
          },
          {
            "variable": "--amc-font-heading",
            "value": "\"Merriweather Sans\", Arial, sans-serif"
          },
          {
            "variable": "--amc-font-body",
            "value": "\"Inter\", Arial, sans-serif"
          },
          {
            "variable": "--amc-radius-base",
            "value": "6px"
          },
          {
            "variable": "--amc-radius-large",
            "value": "8px"
          },
          {
            "variable": "--amc-container",
            "value": "1180px"
          },
          {
            "variable": "--amc-section-padding",
            "value": "88px"
          },
          {
            "variable": "--amc-shadow-sm",
            "value": "0 2px 8px rgba(27, 31, 34, 0.08)"
          },
          {
            "variable": "--amc-shadow-md",
            "value": "0 10px 24px rgba(27, 31, 34, 0.12)"
          }
        ]
      },
      "component_guidelines": [
        {
          "component": "Header principal",
          "elementor_widget": "Theme Builder Header + Nav Menu + Button",
          "layout": "Barre horizontale sticky de 76px avec logo a gauche, navigation centree, telephone et bouton devis a droite.",
          "styling": {
            "background": "#FFFFFF",
            "padding": "0 24px",
            "typography": "Menu Inter 15px 600, bouton Inter 15px 700"
          },
          "interaction": "Header sticky avec ombre sm au scroll, etat actif cuivre sur les liens, menu mobile plein ecran sur fond blanc.",
          "guidelines": "Afficher le telephone comme preuve de proximite et garder le bouton Demander un devis visible sur desktop et mobile.",
          "avoid": [
            "Navigation sur deux lignes",
            "Header transparent sur toutes les pages",
            "Logo trop petit sous 140px de largeur"
          ]
        },
        {
          "component": "Hero accueil",
          "elementor_widget": "Container + Heading + Text Editor + Buttons + Image Background",
          "layout": "Hero 2 colonnes desktop avec texte a gauche et photo chantier a droite, hauteur minimale 620px desktop.",
          "styling": {
            "background": "#F7F3EA",
            "padding": "96px 24px 88px",
            "typography": "H1 Merriweather Sans 48px 700 line-height 1.12, texte Inter 19px line-height 1.65"
          },
          "interaction": "Bouton principal cuivre vers devis-contact, bouton secondaire contour bleu ardoise vers services.",
          "guidelines": "Inclure la promesse locale des les 8 premiers mots et ajouter trois preuves courtes sous les boutons.",
          "avoid": [
            "Hero sombre illisible",
            "Image de stock floue",
            "Titre vague sans mention couvreur zingueur Lyon"
          ]
        },
        {
          "component": "Cartes services",
          "elementor_widget": "Icon Box ou Container + Icon + Heading + Text",
          "layout": "Grille 4 cartes desktop, 2 tablette, 1 mobile avec pictogramme Safe SVG en haut.",
          "styling": {
            "background": "#FFFFFF",
            "padding": "28px",
            "typography": "Titre H3 24px Merriweather Sans 700, texte Inter 16px line-height 1.6"
          },
          "interaction": "Hover avec bordure cuivre #B66A3C et translation Y -3px.",
          "guidelines": "Chaque carte doit contenir un benefice client concret et un lien En savoir plus vers la section ou page service.",
          "avoid": [
            "Icônes multicolores",
            "Cartes de hauteur irreguliere",
            "Texte marketing sans prestation precise"
          ]
        },
        {
          "component": "Bandeau confiance",
          "elementor_widget": "Counter ou Icon List",
          "layout": "Bandeau bleu ardoise pleine largeur avec 4 preuves en colonnes.",
          "styling": {
            "background": "#263A4A",
            "padding": "38px 24px",
            "typography": "Libelles Inter 15px 600 en #FFFFFF, details Inter 14px en rgba(255,255,255,0.78)"
          },
          "interaction": "Aucune animation obligatoire, apparition fade-in 200ms acceptable.",
          "guidelines": "Utiliser les preuves Assurance décennale, Devis détaillé, Chantier propre, Intervention autour de Lyon comme placeholders.",
          "avoid": [
            "Chiffres inventes non verifies",
            "Badges trop decoratifs",
            "Contraste texte insuffisant"
          ]
        },
        {
          "component": "Process intervention",
          "elementor_widget": "Container + Icon List ou Steps custom",
          "layout": "Timeline horizontale desktop en 5 etapes, verticale mobile avec ligne cuivre fine.",
          "styling": {
            "background": "#F7F3EA",
            "padding": "72px 24px",
            "typography": "Etape Inter 13px 700 uppercase, titre H4 24px, texte 15px"
          },
          "interaction": "Survol discret des etapes avec icone cuivre.",
          "guidelines": "Rendre le parcours lisible : contact, diagnostic, devis, chantier, controle final.",
          "avoid": [
            "Plus de 6 etapes",
            "Animations de timeline complexes",
            "Jargon technique non explique"
          ]
        },
        {
          "component": "Galerie realisations",
          "elementor_widget": "Gallery",
          "layout": "Grille masonry moderee 3 colonnes desktop, 2 tablette, 1 mobile avec filtres Couverture, Zinguerie, Renovation.",
          "styling": {
            "background": "#FFFFFF",
            "padding": "0",
            "typography": "Legendes Inter 14px 500 en #6F777B"
          },
          "interaction": "Lightbox Elementor activee, hover avec overlay bleu ardoise a 72% et titre chantier.",
          "guidelines": "Associer chaque image a une commune, un type de prestation et un court resultat.",
          "avoid": [
            "Images avant/apres non alignees",
            "Photos basse resolution",
            "Galerie sans contexte local"
          ]
        },
        {
          "component": "Formulaire devis",
          "elementor_widget": "Shortcode Contact Form 7 dans Container Elementor",
          "layout": "Formulaire 2 colonnes desktop pour champs courts, message en pleine largeur, bloc coordonnees lateral.",
          "styling": {
            "background": "#FFFFFF",
            "padding": "32px",
            "typography": "Labels Inter 14px 700, champs Inter 16px, bouton Inter 16px 700"
          },
          "interaction": "Focus champs avec bordure cuivre, bouton pleine largeur mobile, message de validation visible sous le bouton.",
          "guidelines": "Champs requis : nom, telephone, email, commune, type de prestation, message. Ajouter upload photos seulement si le serveur email est configure.",
          "avoid": [
            "Formulaire en une seule colonne trop long sur desktop",
            "Champs sans labels visibles",
            "Bouton d'envoi gris ou peu contrasté"
          ]
        },
        {
          "component": "CTA devis",
          "elementor_widget": "Call To Action ou Container + Heading + Button",
          "layout": "Bloc pleine largeur bleu ardoise avec titre, texte court, telephone et bouton cuivre.",
          "styling": {
            "background": "#263A4A",
            "padding": "56px 32px",
            "typography": "Titre H2 34px blanc, texte Inter 18px blanc 86%"
          },
          "interaction": "Bouton cuivre devient #9F5730 au hover, lien telephone cliquable.",
          "guidelines": "Placer le CTA en fin de page accueil, services, zone-intervention et footer.",
          "avoid": [
            "CTA sans numero de telephone",
            "Fond image sous le texte",
            "Deux boutons de meme importance"
          ]
        },
        {
          "component": "Footer",
          "elementor_widget": "Theme Builder Footer + Icon List + Nav Menu",
          "layout": "Footer bleu ardoise en 4 colonnes : entreprise, services, zone d'intervention, contact.",
          "styling": {
            "background": "#263A4A",
            "padding": "64px 24px 28px",
            "typography": "Titres Inter 15px 700 uppercase, liens Inter 15px 400"
          },
          "interaction": "Liens hover cuivre, telephone cliquable, email cliquable.",
          "guidelines": "Inclure liens vers Accueil, Services, Realisations, Zone d'intervention, A propos, Devis et contact, Mentions legales.",
          "avoid": [
            "Footer minimal sans coordonnees",
            "Liens en faible contraste",
            "Texte SEO local trop long"
          ]
        }
      ],
      "imagery": {
        "style": "Photographies nettes de chantiers de toiture, artisans en situation, details de zinguerie cuivre ou zinc, maisons individuelles autour de Lyon, lumiere naturelle et cadrages propres.",
        "color_treatment": "Contraste doux, temperature legerement chaude, noirs non ecrases, bleu ardoise utilise en overlay uniquement a faible opacite entre 16% et 28%.",
        "subjects": [
          "Toiture en tuiles ou ardoises vue depuis un echafaudage securise",
          "Detail de gouttiere zinc ou cuivre bien posee",
          "Artisan couvreur controlant une rive de toiture",
          "Maison individuelle avec toiture renovee",
          "Avant apres de renovation toiture",
          "Materiaux de couverture ranges proprement sur chantier"
        ],
        "aspect_ratios": {
          "hero": "16:10",
          "card": "4:3",
          "avatar": "1:1"
        },
        "avoid": [
          "Photos de gratte-ciel ou batiments industriels",
          "Images sombres de toiture sous orage",
          "Artisans sans equipement de securite",
          "Visuels trop luxueux de villa hors cible locale",
          "Banques d'images avec sourires poses en bureau"
        ]
      }
    },
    "settings_to_apply": [
      {
        "key": "blog_public",
        "value": "0"
      },
      {
        "key": "permalink_structure",
        "value": "/%postname%/"
      },
      {
        "key": "timezone_string",
        "value": "Europe/Paris"
      }
    ],
    "forms_to_create": [
      {
        "name": "Contact",
        "target_page": "contact",
        "fields": [
          "name",
          "email",
          "message"
        ]
      }
    ],
    "seo_actions": [
      {
        "slug": "accueil",
        "seo_title": "Accueil | Atelier Martin Couverture",
        "meta_description": "Présenter immédiatement l'expertise locale de l'artisan couvreur zingueur et orienter les visiteurs vers une demande de devis.. Couvreur zingueur autour de Lyon, Nos prestations toiture, Un artisan local de confiance, Une intervention simple et maîtrisée, Interventions autour de Lyon, Besoin d'un avis toiture ?."
      },
      {
        "slug": "services",
        "seo_title": "Services | Atelier Martin Couverture",
        "meta_description": "Détailler les prestations de couverture, zinguerie et rénovation afin de rassurer et qualifier les demandes entrantes.. Services de couverture et zinguerie, Couverture, Zinguerie, Rénovation de toiture, Entretien et réparation, Recevoir un devis détaillé."
      },
      {
        "slug": "realisations",
        "seo_title": "Réalisations | Atelier Martin Couverture",
        "meta_description": "Valoriser les chantiers réalisés et renforcer la crédibilité par des preuves visuelles.. Nos réalisations toiture, Avant / après et chantiers terminés, Exemples de projets, Avis clients."
      },
      {
        "slug": "zone-intervention",
        "seo_title": "Zone d'intervention | Atelier Martin Couverture",
        "meta_description": "Optimiser le référencement local et clarifier le périmètre d'intervention autour de Lyon.. Couvreur autour de Lyon, Communes desservies, Notre secteur, Votre commune est-elle couverte ?."
      },
      {
        "slug": "a-propos",
        "seo_title": "À propos | Atelier Martin Couverture",
        "meta_description": "Humaniser l'entreprise et installer la confiance auprès des propriétaires locaux.. Atelier Martin Couverture, Une approche artisanale et soignée, Nos engagements, Garanties et assurances."
      },
      {
        "slug": "devis-contact",
        "seo_title": "Devis et contact | Atelier Martin Couverture",
        "meta_description": "Convertir les visiteurs en demandes de devis qualifiées.. Demander un devis toiture, Votre projet, Coordonnées, Réponse claire et devis détaillé."
      }
    ]
  }
}

========================================
ETAPES D'EXECUTION
========================================

{
  "contract_version": "1.0",
  "request_id": "c0f33734-027f-41c7-8d96-d06f76b4dfce",
  "stage": "execution_plan",
  "payload": {
    "validated": false,
    "execution_mode": "dry_run",
    "steps": [
      {
        "step_key": "prepare_environment",
        "order": 1,
        "description": "Prepare WordPress environment and baseline settings"
      },
      {
        "step_key": "create_pages",
        "order": 2,
        "description": "Create 6 pages from plan"
      },
      {
        "step_key": "configure_navigation",
        "order": 3,
        "description": "Create menus and assign locations"
      },
      {
        "step_key": "install_plugins",
        "order": 4,
        "description": "Install plugins: elementor, wordpress-seo, contact-form-7, duplicate-post, safe-svg, wp-mail-smtp"
      },
      {
        "step_key": "apply_theme_strategy",
        "order": 5,
        "description": "Apply theme strategy and visual settings"
      },
      {
        "step_key": "inject_content",
        "order": 6,
        "description": "Inject structured content for 6 pages"
      },
      {
        "step_key": "configure_forms_and_seo",
        "order": 7,
        "description": "Configure forms and SEO metadata"
      },
      {
        "step_key": "verify_outputs",
        "order": 8,
        "description": "Run final verification checks before human validation"
      }
    ],
    "dependencies": [
      {
        "artifact_type": "wordpress_plan",
        "version": 2
      },
      {
        "artifact_type": "design_plan",
        "version": 2
      }
    ],
    "expected_outputs": [
      {
        "type": "wordpress_pages",
        "count": 6
      },
      {
        "type": "menus",
        "count": 1
      },
      {
        "type": "forms",
        "count": 1
      },
      {
        "type": "seo_entries",
        "count": 6
      }
    ]
  }
}

================================================================================
FIN DU PLAN
================================================================================