*Comment prédire les besoins en vaccins antigrippaux et optimiser leur distribution pour améliorer l’accès aux soins ?*

Un **système open-source de décision en santé publique** qui exploite les données ouvertes (INSEE, SPF, IQVIA, Météo France) pour :

- anticiper les pics de demande vaccinale,
- identifier les zones sous-vaccinées,
- et recommander une distribution plus équitable des doses.

Ce n’est pas juste un modèle IA, mais une **infrastructure de veille et de planification prédictive**.


# Principe
Étape 1 — National: entraîner/prédire au niveau national (série la plus stable).

Étape 2 — Allocation régionale: répartir chaque prédiction hebdo nationale vers les régions via des “clés d’allocation” combinant:
population régionale (INSEE),
signal épidémique SurSaUD (ex. taux d’urgences grippe, moyennes/percentiles),
historique IQVIA (couverture/doses si dispo par région).

Étape 3 — Allocation départementale: repartir la prédiction régionale vers les départements via des clés intra-région (population départementale + signal SurSaUD dépt).

Réconciliation: garantir que la somme régionale = national, et somme départementale = régional, chaque semaine (scaling multiplicatif).


| Axe                    | Description                                     | Output attendu                             |
| ---------------------- | ----------------------------------------------- | ------------------------------------------ |
|  **Prédiction**      | Estimer la demande vaccinale future par région  | Modèle prédictif ML (Prophet / XGBoost)    |
|  **Distribution**    | Recommander une répartition optimale des stocks | Simulation logistique (ratio besoin/stock) |
|  **Accès aux soins** | Identifier les zones sous-couvertes             | Heatmap géographique (carte France)        |
|  **Analyse**         | Explorer corrélations multi-facteurs            | Dashboard interactif                       |


### **1.Données**

Sources principales (open data) :

- **IQVIA** → distribution de vaccins & actes pharmacie
- **SPF IAS®** → indicateurs avancés épidémiques
- **ODISSE / SPF** → couvertures vaccinales
- **SOS Médecins & Urgences** → activité grippe-like
- **INSEE** → population, âge, densité, accès soins

### 2. Modélisation

- Corrélation spatio-temporelle : incidence ↔ vaccination ↔ climat ↔ mobilité
- Prédiction temporelle (Prophet / LSTM)
- Clustering territorial (KMeans / DBSCAN)
- Évaluation : MAE / RMSE + visualisation comparative

### **3. Visualisation**

- Tableau de bord (Plotly Dash / Streamlit)
- Carte France (GeoPandas + Folium)
- Graphiques temporels et heatmaps corrélées
- Section explicative : “Pourquoi cette région est critique ?”

# Multi-Agent Epidemic Intelligence (A2A + MoE)


| Agent                | Rôle                                 | Données                      | Exemple de sortie                         |
| -------------------- | ------------------------------------ | ---------------------------- | ----------------------------------------- |
|  **EpiAgent**      | Analyse les signaux épidémiques      | IAS®, Urgences, SOS Médecins | “Hausse de 25 % des cas grippe en IDF”    |
|  **WeatherAgent**  | Évalue l’impact climatique           | Température, humidité        | “Semaine froide → transmission favorisée” |
|  **SocioAgent**    | Mesure la vulnérabilité territoriale | INSEE, DREES                 | “65 % population à risque non vaccinée”   |
|  **LogisticAgent** | Observe la distribution vaccinale    | IQVIA, ARS                   | “Rupture potentielle en région PACA”      |

Ces agents **évaluent localement** leurs variables, puis **échangent leurs signaux** via un protocole **A2A (Agent-to-Agent)** :

> chaque agent communique des “alertes contextuelles” aux autres (ex. _hausse grippe_ → _alerte logistique_).

 **Objectif :** construire une **intelligence collective distribuée** — pas un modèle unique, mais un ensemble d’experts autonomes qui s’influencent.

# A2A — Agent-to-Agent Communication
Les agents communiquent entre eux pour former une vision cohérente de la situation sanitaire.
```
EpiAgent → hausse grippe à Lyon
↓
WeatherAgent → confirme température basse
↓
LogisticAgent → identifie stock critique
↓
SocioAgent → zone vulnérable âgée + peu vaccinée
↓
DecisionAgent → alerte “tension régionale”
```


# Core concept
- un **ETL intelligent** (nettoyage, harmonisation, fusion spatio-temporelle),
- un **modèle prédictif hybride** (ML + Deep Learning),
- une **visualisation dynamique** pour la compréhension et l’action.

```
+-----------------------------------------------------+
|                 ETL / Data Ingestion               |
|-----------------------------------------------------|
| Sources : INSEE, SPF, IQVIA, Météo France, IAS®     |
| • Extraction automatique via API / CSV              |
| • Nettoyage & harmonisation (Pandas / Polars)       |
| • Agrégation hebdomadaire par région (DuckDB)       |
+-----------------------------------------------------+
                              ↓
+-----------------------------------------------------+
|               ML Predictive Models                |
|-----------------------------------------------------|
| - Prophet : tendance temporelle (prévision grippe)  |
| - XGBoost : corrélations multi-facteurs             |
| - LSTM (PyTorch) : dépendances temporelles complexes|
| - DBSCAN / HDBSCAN : clustering spatio-temporel     |
| • Sélection dynamique des experts (MoE gating)      |
+-----------------------------------------------------+
                              ↓
+-----------------------------------------------------+
|              Visualization & Intelligence          |
|-----------------------------------------------------|
| - Carte interactive France (Folium / Plotly)        |
| - Heatmaps : prévisions régionales de tension       |
| - Graphiques temporels : réalité vs prédiction      |
| - Explicabilité : corrélation entre variables       |
+-----------------------------------------------------+
```


## **Pipeline IA (ETL → ML → Viz)**

1. **ETL ingestion (Data pipeline)**
    
    - Extraction : IQVIA, SPF, INSEE (Data.gouv APIs)
    - Transformation : nettoyage, normalisation (région, semaine)
    - Load : base locale (DuckDB / Parquet)
2. **Feature engineering**
    
    - Variables : incidence grippe, température, taux vaccination, mobilité, densité
    - Lags temporels (t-1, t-2, t-3 semaines)
    - Encodage spatial (région / latitude-longitude)

3. **Modélisation prédictive**
    
    - Prophet pour la composante temporelle
        
    - XGBoost pour les variables exogènes
        
    - LSTM (PyTorch) pour les dépendances séquentielles
        
    - DBSCAN pour détecter des clusters anormaux (zones critiques)
        
4. **Fusion / Mixture of Experts (MoE)**
    
    - Chaque modèle = “expert”
        
    - Un “gating layer” sélectionne les modèles selon la qualité des signaux régionaux
        
5. **Visualisation**
    
    - Dashboard Streamlit / Plotly
        
    - Heatmap par région + prévision 3 semaines
        
    - Panneau explicatif (“hausse due à température + grippe + faible couverture”)


```
/gandalf_backend
│
├── app/
│   ├── __init__.py
│   ├── main.py              # Entrée FastAPI (uvicorn app:app)
│   ├── config.py            # Configuration globale (env, paths, API keys)
│   │
│   ├── core/                # Domaine “pur” : logique métier
│   │   ├── domain/
│   │   │   ├── models/      # Entités métier (Vaccination, Region, Forecast)
│   │   │   ├── services/    # Logique métier pure (ForecastService, AgentSystem)
│   │   │   └── repositories/# Interfaces abstraites vers la persistance
│   │   ├── application/
│   │   │   ├── use_cases/   # Cas d’usage (PredictVaccinationNeed, GetRegionalTension)
│   │   │   └── dto/         # Objets de transfert (DTOs)
│   │   ├── infrastructure/
│   │   │   ├── adapters/    # Implémentations concrètes (CSVReader, DataGovAPI)
│   │   │   ├── persistence/ # Requêtes DuckDB / SQLAlchemy
│   │   │   └── ml/          # Modèles ML (ProphetModel, XGBoostModel, LSTMModel)
│   │   └── presentation/
│   │       ├── api/         # Routes FastAPI
│   │       └── schemas/     # Pydantic schemas
│   │
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   │
│   ├── utils/
│   │   ├── logger.py
│   │   ├── exceptions.py
│   │   └── settings.py
│   │
│   └── notebooks/           # Analyses exploratoires / visualisations
│
├── requirements.txt
├── README.md
└── pyproject.toml
```


lL fusionne des données épidémiologiques, démographiques et climatiques dans un pipeline IA complet (ETL → ML → Viz).  
Basé sur une **architecture Mixture-of-Experts (Prophet, XGBoost, LSTM)** et un protocole **Agent-to-Agent (A2A)**, il permet aux décideurs de **visualiser, comprendre et anticiper les tensions vaccinales régionales** avant qu’elles ne surviennent.


---
## **Architecture du modèle prédictif**

### **Étape 1 : Data ingestion & intégration**

**Objectif :** collecter, agréger et synchroniser les sources de données hétérogènes
**Données typiques :**

- IQVIA → doses & actes par région
- IAS® → indicateurs avancés sanitaires
- INSEE → population, densité, part 65+
- Météo France → température, humidité
- SOS Médecins / Urgences → activité grippe
```
import pandas as pd
import duckdb
import requests
```

### **Étape 2 : Préparation et Nettoyage**

**Objectif :** rendre les données exploitables par un modèle.
**Techniques :**

- Gestion des valeurs manquantes (fillna, dropna)
- Transformation de types (astype, category)
- Normalisation / standardisation (StandardScaler, MinMaxScaler)
- Agrégation temporelle (resample('W') pour hebdomadaire)

**Concepts clés :**

- Qualité des données (Data Quality)
- Temporal alignment (alignement temporel)
- Feature consistency (mêmes colonnes et unités)

### **Étape 3 : Feature Engineering**

**Objectif :** enrichir le dataset avec des variables explicatives pertinentes.

**Concepts clés :**

- Normalisation de formats (CSV, JSON, API)
- Fusion (merge, join)
- Synchronisation temporelle (pd.to_datetime, resample)

  

**Exemples de features :**

- rolling_7j : moyenne mobile des doses
- lag_7 : valeur de la semaine précédente
- progression_pct : variation %
- température_moyenne
- population_65p
- IAS_score



### **Étape 4 : Modélisation prédictive**

|**Type de modèle**|**Cas d’usage**|**Librairie**|
|---|---|---|
|RandomForestRegressor|Prédiction hebdo de doses|scikit-learn|
|XGBoost|Importance des variables|xgboost|
|Prophet|Séries temporelles|prophet|
|LSTM / GRU|Modèle séquentiel|torch, keras|
|HDBSCAN|Clustering régional|hdbscan|


**Objectif :** entraîner un modèle qui apprend les relations entre les variables.
## Modele Predictif 

##  **Données cœur (base du modèle prédictif)**

| **Catégorie**                          | **Source**                    | **Variables clés**                                     | **Rôle dans le modèle**                                    |
| -------------------------------------- | ----------------------------- | ------------------------------------------------------ | ---------------------------------------------------------- |
| 💉 **Activité vaccinale**              | **IQVIA – doses & actes**     | date, région, groupe d’âge, nombre_actes, nombre_doses | Série temporelle de la vaccination → variable _à prédire_  |
|  **Ciblage population à risque**     | **INSEE / Assurance Maladie** | population_65+, part_ALD, densité_médicale             | Poids des groupes à risque → ajustement de la demande      |
|  **Couverture vaccinale historique** | **ODISSE / SPF**              | taux_couverture, campagne, région                      | Niveau d’immunisation → inertie / saturation de la demande |
|  **Calendrier de campagne**          | **Santé Publique France**     | date_début, date_fin, semaine_campagne                 | Cadre temporel des pics de vaccination                     |
Ces données permettent de **modéliser la demande vaccinale passée et future**.
Tu peux déjà bâtir un **modèle Prophet ou XGBoost** solide rien qu’avec ces quatre blocs.

## **Données exogènes (améliorent la précision)**

Ces données **n’expliquent pas directement** la vaccination,
mais elles **corrèlent fortement** avec la dynamique des épidémies et des campagnes.

| **Catégorie**                                 | **Source**                     | **Variables clés**                               | **Utilité**                                                        |
| --------------------------------------------- | ------------------------------ | ------------------------------------------------ | ------------------------------------------------------------------ |
|  **Indicateurs sanitaires (IAS / SurSaUD)** | Santé Publique France          | taux_urgence_grippe, taux_SOS_Médecins, IAS_taux | Signal épidémique : détecte les pics de grippe                     |
|  **Conditions climatiques**                | Météo France                   | température_moyenne, humidité, pluie, vent       | Le froid et l’humidité favorisent les virus respiratoires          |
|  **Mobilité et comportements**              | Google Mobility / SNCF / INSEE | flux_transport, mobilité_régionale               | Influence la diffusion du virus et la fréquentation des pharmacies |
|  **Disponibilité en pharmacie**             | IQVIA (distribution)           | stock_disponible, livraisons                     | Détermine la contrainte d’approvisionnement                        |
|  **Densité médicale et officinale**         | DREES / INSEE                  | nb_pharmacies_par_habitant, nb_médecins          |                                                                    |
Ces variables permettent d’expliquer **les fluctuations régionales** ou **les anomalies locales** dans la vaccination.



## **Données géographiques et socio-économiques**

| **Catégorie**                     | **Source**                    | **Variables clés**                             | **Utilité**                                            |
| --------------------------------- | ----------------------------- | ---------------------------------------------- | ------------------------------------------------------ |
|  **Région / Département**      | INSEE / SPF                   | code_region, densité_population, revenu_médian | Conditions locales d’accès et comportements sanitaires |
|  **Accessibilité géographique** | INSEE / IGN                   | distance_moyenne_officine, temps_accès_soin    | Mesure les “déserts vaccinaux”                         |
|  **Professionnels de santé** | DREES / Ordre des pharmaciens | nb_infirmiers, nb_pharmaciens, nb_médecins     | Capacité opérationnelle de vaccination                 |


| **Objectif**                                        | **Description**                                             | **Type de modèle** |
| --------------------------------------------------- | ----------------------------------------------------------- | ------------------ |
| **Prévoir les besoins en vaccins**                  | Nombre de doses à distribuer la semaine suivante par région | Régression         |
| **Prévoir les actes de vaccination**                | Volume d’actes quotidiens ou hebdomadaires                  | Séries temporelles |
| **Anticiper les pics d’activité grippe / urgences** | Corrélation grippe ↔ météo ↔ vaccination ↔ mobilité         | Multivarié         |
| **Identifier les zones sous-vaccinées**             | Probabilité qu’une région n’atteigne pas 75%                | Classification     |

### **a)**  **Données internes (IQVIA)**

- doses : nombre de doses distribuées chaque jour/semaine
- actes : nombre d’actes de vaccination en pharmacie
- groupe_population : 65+ / -65 ans
- region : localisation
- cumul_actes : cumul de la campagne
- progression_pct : croissance par rapport à la semaine précédente

#### **Santé publique :**

- IAS® (Indicateur Avancé Sanitaire) → signaux de grippe en temps réel
- passages_urgences_grippe → activité liée à la grippe
- actes_sos_medecins → indicateur de tension

#### **Démographie :**

- population_regionale (INSEE)
- densité_population
- part_65+

#### **Météo :**

- température_moyenne
- humidité_relative
- anomalies météo (vagues de froid → hausse vaccination)
  
#### **Mobilité :**
- flux_mobilité (SNCF, Google Mobility Reports)
- trafic_urbain (effet confinement, vacances, etc.)



|**Type de modèle**|**Exemple de sortie**|**Cas d’usage**|
|---|---|---|
|**Régression (RF, XGBoost)**|Nombre de doses à distribuer|Planification logistique|
|**Time Series (Prophet, LSTM)**|Prévision temporelle des actes|Anticiper les pics de vaccination|
|**Classification**|Probabilité d’atteindre le seuil 75%|Identifier les zones à risque|
|**Spatio-temporel (Graph)**|Carte prédictive de la couverture|Communication publique & allocation|
|**Anomaly detection**|Écart entre prévu et observé|Alerte rupture / sous-performance|


<img width="1853" height="1189" alt="evolution-urgence" src="https://github.com/user-attachments/assets/e4294416-0b2e-49be-9336-07ab297228ca" />
<img width="1583" height="1190" alt="evolution-region" src="https://github.com/user-attachments/assets/5f94c3d7-982a-43f4-92b6-3d0d54cf00dc" />
<img width="1589" height="1190" alt="evolution-grippe" src="https://github.com/user-attachments/assets/140fc1dd-4543-4b82-a415-48a400322851" />
<img width="1590" height="1189" alt="departement" src="https://github.com/user-attachments/assets/ee8575d3-5bfa-4c32-b5f4-16e8162f5f65" />


