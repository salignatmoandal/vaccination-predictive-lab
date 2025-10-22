import streamlit as st
import pandas as pd
import plotly.express as px
import requests

st.set_page_config(page_title="Heatmap prédictive - France", page_icon="🗺️", layout="wide")

st.title("🗺️ Heatmap prédictive — France (régions)")
st.caption("Sélectionne une semaine pour visualiser l'intensité prédite par région.")

# 1) Chargement des données
@st.cache_data
def load_predictions(path="data/processed/predictions_regionales_from_national.csv"):
    df = pd.read_csv(path)
    # attendu: colonnes ['ds','region','yhat'] ; ds = date ISO semaine
    if "ds" in df.columns:
        df["ds"] = pd.to_datetime(df["ds"])
    else:
        raise ValueError("La colonne 'ds' est manquante.")
    return df

@st.cache_data
def load_fr_regions_geojson():
    # GeoJSON public des régions (nouvelles régions) — propriété 'nom'
    url = "https://france-geojson.gregoiredavid.fr/repo/regions.geojson"
    r = requests.get(url, timeout=20)
    r.raise_for_status()
    return r.json()

try:
    df_pred = load_predictions()
except Exception as e:
    st.error(f"Impossible de charger les prédictions régionales: {e}")
    st.info("Attendu: data/processed/predictions_regionales_from_national.csv avec colonnes ['ds','region','yhat'].")
    st.stop()

geojson_regions = load_fr_regions_geojson()

# 2) Curseur temporel
dates = sorted(df_pred["ds"].dt.date.unique())
if not dates:
    st.warning("Aucune date trouvée dans les prédictions.")
    st.stop()

date_sel = st.slider("Semaine (date de référence)", min_value=dates[0], max_value=dates[-1], value=dates[0])
df_day = df_pred[df_pred["ds"].dt.date == date_sel].copy()

# 3) Harmonisation des noms si besoin (adapter si divergences de libellés)
# Exemple: df_day['region'] doit correspondre à feature 'properties.nom' du GeoJSON.
# Si nécessaire, ajouter un mapping dict ici.
df_day["region"] = df_day["region"].astype(str)

# 4) Carte choroplèthe France
if df_day.empty:
    st.warning("Aucune prédiction pour la date sélectionnée.")
else:
    fig = px.choropleth_mapbox(
        df_day,
        geojson=geojson_regions,
        featureidkey="properties.nom",
        locations="region",          # valeur dans df_day
        color="yhat",                # intensité prédite
        color_continuous_scale="Reds",
        range_color=(df_pred["yhat"].min(), df_pred["yhat"].max()),
        mapbox_style="carto-positron",
        zoom=4.5, center={"lat": 46.2276, "lon": 2.2137},  # France métropolitaine
        opacity=0.7,
        labels={"yhat": "Prédiction"},
        hover_name="region",
        title=f"Prédictions régionales — {date_sel}"
    )
    fig.update_layout(margin=dict(l=0, r=0, t=60, b=0), height=700)
    st.plotly_chart(fig, use_container_width=True)

    # 5) Tableau récap
    st.subheader("Détail par région")
    st.dataframe(
        df_day[["region", "yhat"]].sort_values("yhat", ascending=False).reset_index(drop=True),
        use_container_width=True
    )