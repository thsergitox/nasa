#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Construye un gazetteer global (Tierra) desde GeoNames.

Por defecto usa cities500.zip (ciudades >500 hab.); puedes alternar a allCountries.zip
si quieres TODO el gazetteer (muy grande).

Salidas:
- gazetteer_earth.json   (índice por nombre normalizado)
- gazetteer_earth.geojson (FeatureCollection de puntos)

Campos clave de GeoNames (TSV):
geonameid, name, asciiname, alternatenames, latitude, longitude, feature class,
feature code, country code, cc2, admin1, admin2, admin3, admin4, population, elevation,
dem, timezone, modification date

Licencia GeoNames (CC BY): atribuye a https://www.geonames.org/
"""

import csv
import io
import json
import zipfile
import ssl
import urllib.request
import unicodedata
import re

# --- CONFIG --- #
USE_ALL = False  # False = cities500.zip (rápido); True = allCountries.zip (completo, MUY grande)

URL = (
    "https://download.geonames.org/export/dump/allCountries.zip"
    if USE_ALL else
    "https://download.geonames.org/export/dump/cities500.zip"
)

OUT_JSON = "gazetteer_earth.json"
OUT_GEOJSON = "gazetteer_earth.geojson"

# Filtrado mínimo (si usas allCountries puedes, por ejemplo, quedarte con ciudades/países/áreas admin)
# fclass 'P' = poblado; 'A' = área administrativa; 'T' = terreno; 'H' = hidro; 'S' = estructura etc.
KEEP_FCLASSES = None  # e.g., {"P","A"} para reducir; None = mantener todo lo que llegue del archivo

# --- Utils --- #
def http_get(url: str) -> bytes:
    ctx = ssl.create_default_context()
    try:
        with urllib.request.urlopen(url, context=ctx) as r:
            return r.read()
    except Exception:
        # fallback sin verificación estricta (útil en entornos cerrados)
        ctx = ssl._create_unverified_context()
        with urllib.request.urlopen(url, context=ctx) as r:
            return r.read()

def normalize_name(s: str) -> str:
    if not s:
        return ""
    s = unicodedata.normalize("NFKD", s)
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    s = s.lower().strip()
    s = re.sub(r"\s+", " ", s)
    return s

def to_float(x):
    try:
        return float(x)
    except:
        return None

def main():
    print(f"[+] Descargando GeoNames: {URL}")
    zbytes = http_get(URL)

    print("[+] Descomprimiendo TSV...")
    with zipfile.ZipFile(io.BytesIO(zbytes)) as zf:
        # El archivo interno se llama como la URL (sin .zip)
        internal_name = None
        for n in zf.namelist():
            if n.endswith(".txt"):
                internal_name = n
                break
        if not internal_name:
            raise RuntimeError("No se encontró .txt dentro del ZIP")

        raw = zf.read(internal_name).decode("utf-8")

    # GeoNames TSV no trae cabecera; definimos columnas:
    # https://download.geonames.org/export/dump/readme.txt
    cols = [
        "geonameid","name","asciiname","alternatenames","latitude","longitude",
        "feature_class","feature_code","country_code","cc2","admin1","admin2","admin3","admin4",
        "population","elevation","dem","timezone","moddate"
    ]

    idx = {}
    features = []

    print("[+] Parseando registros...")
    reader = csv.reader(io.StringIO(raw), delimiter="\t")
    for row in reader:
        if len(row) < len(cols):
            continue
        rec = dict(zip(cols, row))

        fclass = rec["feature_class"]
        if KEEP_FCLASSES and fclass not in KEEP_FCLASSES:
            continue

        name = rec["name"] or rec["asciiname"]
        if not name:
            continue

        lat = to_float(rec["latitude"])
        lon = to_float(rec["longitude"])
        if lat is None or lon is None:
            continue

        country = rec["country_code"] or ""
        fcode = rec["feature_code"] or ""
        pop = rec["population"] or "0"
        try:
            pop = int(pop)
        except:
            pop = 0

        # Índice por nombre normalizado (puedes también indexar asciiname y alternatenames)
        key = normalize_name(name)
        # Si ya existe, preferimos el de mayor población (para desambiguar nombres comunes)
        if key in idx:
            if pop <= idx[key].get("population", 0):
                # conserva el más poblado
                pass
            else:
                idx[key] = {
                    "name": name,
                    "lat": lat,
                    "lon": lon,
                    "country": country,
                    "fclass": fclass,
                    "fcode": fcode,
                    "population": pop
                }
        else:
            idx[key] = {
                "name": name,
                "lat": lat,
                "lon": lon,
                "country": country,
                "fclass": fclass,
                "fcode": fcode,
                "population": pop
            }

        # GeoJSON Feature (puedes filtrar aquí si quieres solo capitales o > X pob.)
        feat = {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [lon, lat]},
            "properties": {
                "name": name,
                "country": country,
                "fclass": fclass,
                "fcode": fcode,
                "population": pop
            }
        }
        features.append(feat)

    fc = {"type": "FeatureCollection", "features": features}

    print(f"[+] Escribiendo {OUT_JSON} y {OUT_GEOJSON} ...")
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(idx, f, ensure_ascii=False, indent=2)
    with open(OUT_GEOJSON, "w", encoding="utf-8") as f:
        json.dump(fc, f, ensure_ascii=False)

    print("[✔] Listo. Recuerda atribuir a GeoNames (https://www.geonames.org/).")

if __name__ == "__main__":
    main()
