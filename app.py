import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import requests

st.set_page_config(page_title="HeatMap Vaccination France", layout="wide")

st.title(" HeatMap Vaccination Grippe - France")
st.markdown("*Analyse des besoins en vaccins antigrippaux par région*")

# ---------------------------
# Chargement des données
# ---------------------------
@st.cache_data
def load_data():
    """Charge toutes les données nécessaires"""
    data = {}
    
    # 1. Données SurSaUD régionales (grippe)
    try:
        df_sursaud = pd.read_csv("data/cleaned/sursaud_regional_cleaned.csv")
        df_sursaud['date_debut_semaine'] = pd.to_datetime(df_sursaud['date_debut_semaine'])
        data['sursaud'] = df_sursaud
    except Exception as e:
        st.warning(f"Données SurSaUD non disponibles: {e}")
        data['sursaud'] = None
    
    # 2. Données IQVIA (vaccination)
    try:
        df_iqvia = pd.read_csv("data/cleaned/iqvia_doses_cleaned.csv")
        df_iqvia['date'] = pd.to_datetime(df_iqvia['date'])
        data['iqvia'] = df_iqvia
    except Exception as e:
        st.warning(f"Données IQVIA non disponibles: {e}")
        data['iqvia'] = None
    
    # 3. Prédictions Prophet
    try:
        df_pred = pd.read_csv("data/processed/predictions_2026_2027.csv")
        df_pred['ds'] = pd.to_datetime(df_pred['ds'])
        data['predictions'] = df_pred
    except Exception as e:
        st.warning(f"Prédictions non disponibles: {e}")
        data['predictions'] = None
    
    return data

@st.cache_data
def load_france_geojson():
    """Charge le GeoJSON des régions françaises"""
    url = "https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions.geojson"
    try:
        r = requests.get(url, timeout=10)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        st.error(f"Impossible de charger le GeoJSON: {e}")
        return None

# ---------------------------
# Interface utilisateur
# ---------------------------
data = load_data()
geojson = load_france_geojson()

if geojson is None:
    st.stop()

# Sidebar - Paramètres
st.sidebar.title("Paramètres")

# Choix du type de données
data_type = st.sidebar.selectbox(
    "Type de données à visualiser",
    ["Prédictions Prophet", "Données SurSaUD (grippe)", "Données IQVIA (vaccination)", "Données mockées"]
)

# ---------------------------
# Traitement selon le type de données
# ---------------------------
if data_type == "Prédictions Prophet" and data['predictions'] is not None:
    df_pred = data['predictions']
    
    # Sélection de la date
    dates = sorted(df_pred['ds'].dt.date.unique())
    if dates:
        date_sel = st.sidebar.selectbox("Date", dates, index=len(dates)-1)
        df_day = df_pred[df_pred['ds'].dt.date == date_sel].copy()
        
        # Régionalisation des prédictions nationales
        # Poids régionaux basés sur la population (approximatifs)
        region_weights = {
            "Île-de-France": 0.18,
            "Auvergne-Rhône-Alpes": 0.12,
            "Occitanie": 0.10,
            "Provence-Alpes-Côte d'Azur": 0.08,
            "Hauts-de-France": 0.09,
            "Nouvelle-Aquitaine": 0.09,
            "Grand Est": 0.08,
            "Bretagne": 0.05,
            "Normandie": 0.05,
            "Pays de la Loire": 0.06,
            "Centre-Val de Loire": 0.04,
            "Bourgogne-Franche-Comté": 0.04,
            "Corse": 0.01
        }
        
        # Créer les données régionales
        regional_data = []
        for region, weight in region_weights.items():
            regional_data.append({
                'region': region,
                'prediction': df_day['yhat'].iloc[0] * weight if len(df_day) > 0 else 0,
                'date': date_sel
            })
        
        df_map = pd.DataFrame(regional_data)
        color_col = 'prediction'
        title_suffix = f"Prédictions Prophet - {date_sel}"

elif data_type == "Données SurSaUD (grippe)" and data['sursaud'] is not None:
    df_sursaud = data['sursaud']
    
    # Sélection de la semaine
    weeks = sorted(df_sursaud['semaine'].unique())
    week_sel = st.sidebar.selectbox("Semaine", weeks, index=len(weeks)-1)
    
    # Sélection de la métrique
    metric_options = ['taux_urgences_grippe', 'taux_hospitalisations_grippe', 'taux_sos_medecins_grippe']
    metric_sel = st.sidebar.selectbox("Métrique", metric_options)
    
    # Agrégation par région (moyenne des classes d'âge)
    df_agg = df_sursaud[
        (df_sursaud['semaine'] == week_sel) & 
        (df_sursaud['classe_age'] == 'Tous âges')
    ].groupby('region')[metric_sel].mean().reset_index()
    
    df_map = df_agg.rename(columns={metric_sel: 'valeur'})
    color_col = 'valeur'
    title_suffix = f"SurSaUD - {metric_sel} - {week_sel}"

elif data_type == "Données IQVIA (vaccination)" and data['iqvia'] is not None:
    df_iqvia = data['iqvia']
    
    # Sélection de la campagne
    campaigns = sorted(df_iqvia['campagne'].unique())
    campaign_sel = st.sidebar.selectbox("Campagne", campaigns, index=len(campaigns)-1)
    
    # Sélection du groupe d'âge
    age_groups = sorted(df_iqvia['groupe_age'].unique())
    age_sel = st.sidebar.selectbox("Groupe d'âge", age_groups)
    
    # Agrégation par campagne et groupe d'âge
    df_agg = df_iqvia[
        (df_iqvia['campagne'] == campaign_sel) & 
        (df_iqvia['groupe_age'] == age_sel) &
        (df_iqvia['variable'] == 'DOSES(J07E1)')
    ].groupby('date')['valeur'].sum().reset_index()
    
    # Pour la carte, on utilise les données nationales réparties par région
    total_doses = df_agg['valeur'].sum()
    region_weights = {
        "Île-de-France": 0.18, "Auvergne-Rhône-Alpes": 0.12, "Occitanie": 0.10,
        "Provence-Alpes-Côte d'Azur": 0.08, "Hauts-de-France": 0.09, "Nouvelle-Aquitaine": 0.09,
        "Grand Est": 0.08, "Bretagne": 0.05, "Normandie": 0.05, "Pays de la Loire": 0.06,
        "Centre-Val de Loire": 0.04, "Bourgogne-Franche-Comté": 0.04, "Corse": 0.01
    }
    
    regional_data = []
    for region, weight in region_weights.items():
        regional_data.append({
            'region': region,
            'valeur': total_doses * weight
        })
    
    df_map = pd.DataFrame(regional_data)
    color_col = 'valeur'
    title_suffix = f"IQVIA - {campaign_sel} - {age_sel}"

else:
    # Données mockées
    st.sidebar.info("Utilisation de données mockées")
    
    region_data = {
        "Île-de-France": 85000, "Auvergne-Rhône-Alpes": 65000, "Occitanie": 55000,
        "Provence-Alpes-Côte d'Azur": 45000, "Hauts-de-France": 50000, "Nouvelle-Aquitaine": 48000,
        "Grand Est": 42000, "Bretagne": 35000, "Normandie": 30000, "Pays de la Loire": 32000,
        "Centre-Val de Loire": 25000, "Bourgogne-Franche-Comté": 28000, "Corse": 8000
    }
    
    df_map = pd.DataFrame([
        {'region': region, 'valeur': value} 
        for region, value in region_data.items()
    ])
    color_col = 'valeur'
    title_suffix = "Données mockées"

# ---------------------------
# Carte choroplèthe
# ---------------------------
if not df_map.empty:
    # Harmonisation des noms de régions
    region_mapping = {
        "Île-de-France": "Île-de-France",
        "Auvergne-Rhône-Alpes": "Auvergne-Rhône-Alpes", 
        "Occitanie": "Occitanie",
        "Provence-Alpes-Côte d'Azur": "Provence-Alpes-Côte d'Azur",
        "Hauts-de-France": "Hauts-de-France",
        "Nouvelle-Aquitaine": "Nouvelle-Aquitaine",
        "Grand Est": "Grand Est",
        "Bretagne": "Bretagne",
        "Normandie": "Normandie",
        "Pays de la Loire": "Pays de la Loire",
        "Centre-Val de Loire": "Centre-Val de Loire",
        "Bourgogne-Franche-Comté": "Bourgogne-Franche-Comté",
        "Corse": "Corse"
    }
    
    df_map['region_mapped'] = df_map['region'].map(region_mapping)
    
    # Création de la carte
    fig = px.choropleth_mapbox(
        df_map,
        geojson=geojson,
        featureidkey="properties.nom",
        locations="region_mapped",
        color=color_col,
        color_continuous_scale="Reds",
        range_color=(df_map[color_col].min(), df_map[color_col].max()),
        mapbox_style="carto-positron",
        zoom=4.5,
        center={"lat": 46.2276, "lon": 2.2137},
        opacity=0.7,
        labels={color_col: "Valeur"},
        hover_name="region",
        title=f"🗺️ HeatMap Vaccination Grippe - {title_suffix}"
    )
    
    fig.update_layout(
        margin=dict(l=0, r=0, t=60, b=0), 
        height=600,
        title_x=0.5
    )
    
    st.plotly_chart(fig, use_container_width=True)
    
    # ---------------------------
    # Métriques et tableaux
    # ---------------------------
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("Total", f"{df_map[color_col].sum():,.0f}")
    with col2:
        st.metric("Moyenne", f"{df_map[color_col].mean():,.0f}")
    with col3:
        st.metric("Max", f"{df_map[color_col].max():,.0f}")
    with col4:
        st.metric("Min", f"{df_map[color_col].min():,.0f}")
    
    # Top 5 régions
    st.subheader("🏆 Top 5 régions")
    top_regions = df_map.nlargest(5, color_col)
    st.dataframe(
        top_regions[['region', color_col]].reset_index(drop=True),
        use_container_width=True
    )
    
    # Graphique en barres
    st.subheader("📊 Répartition par région")
    fig_bar = px.bar(
        df_map.sort_values(color_col, ascending=True),
        x=color_col,
        y='region',
        orientation='h',
        title="Valeurs par région"
    )
    fig_bar.update_layout(height=500)
    st.plotly_chart(fig_bar, use_container_width=True)

else:
    st.warning("Aucune donnée disponible pour la visualisation.")

# ---------------------------
# Informations sur les données
# ---------------------------
with st.expander("ℹ️ Informations sur les données"):
    st.markdown("""
    **Sources de données utilisées :**
    - **SurSaUD** : Indicateurs sanitaires régionaux (urgences, hospitalisations, SOS Médecins)
    - **IQVIA** : Données de vaccination (doses, actes) par campagne et groupe d'âge
    - **Prédictions Prophet** : Modèle de prévision des besoins en vaccins
    
    **Méthodologie :**
    - Les prédictions nationales sont réparties par région selon des poids démographiques
    - Les données SurSaUD sont agrégées par région et classe d'âge
    - Les données IQVIA sont sommées par campagne et groupe d'âge
    """)

# ---------------------------
# Export des données
# ---------------------------
if not df_map.empty:
    csv = df_map.to_csv(index=False).encode('utf-8')
    st.download_button(
        label="📥 Télécharger les données (CSV)",
        data=csv,
        file_name=f"heatmap_vaccination_{datetime.now().strftime('%Y%m%d')}.csv",
        mime="text/csv"
    )