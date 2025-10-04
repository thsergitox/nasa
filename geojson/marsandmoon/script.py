#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Descarga KMZ del USGS Gazetteer (Moon/Mars), extrae KML y construye:
 - gazetteer_moon.json / gazetteer_mars.json (índice por nombre)
 - gazetteer_moon.geojson / gazetteer_mars.geojson (FeatureCollection)

Sin dependencias externas: usa solo requests, zipfile, xml.etree.
"""

import io
import json
import math
import re
import unicodedata
import zipfile
from urllib.parse import urlparse
from xml.etree import ElementTree as ET

import sys
import ssl
import urllib.request

# --- CONFIG: fuentes oficiales (center points) ---
SOURCES = [
    {
        "body": "Moon",
        # KMZ de puntos centrales (planetocéntrico, longitudes Este)
        "url": "https://asc-planetarynames-data.s3.us-west-2.amazonaws.com/MOON_nomenclature_center_pts.kmz",
        "out_json": "gazetteer_moon.json",
        "out_geojson": "gazetteer_moon.geojson",
    },
    {
        "body": "Mars",
        "url": "https://asc-planetarynames-data.s3.us-west-2.amazonaws.com/MARS_nomenclature_center_pts.kmz",
        "out_json": "gazetteer_mars.json",
        "out_geojson": "gazetteer_mars.geojson",
    },
]

# --- Utilidades ---

def http_get(url: str) -> bytes:
    # Simple downloader compatible con https (sin cert verification estricta por si falla en algunos entornos)
    ctx = ssl.create_default_context()
    try:
        with urllib.request.urlopen(url, context=ctx) as r:
            return r.read()
    except Exception:
        # fallback sin verificación (no recomendado en prod, pero útil en entornos de hackathon)
        ctx = ssl._create_unverified_context()
        with urllib.request.urlopen(url, context=ctx) as r:
            return r.read()

def strip_html_tags(text: str) -> str:
    if not text:
        return ""
    return re.sub(r"<[^>]*>", " ", text)

def normalize_name(name: str) -> str:
    # lower, quita acentos/diacríticos y espacios repetidos
    s = unicodedata.normalize("NFKD", name)
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    s = s.lower()
    s = re.sub(r"\s+", " ", s).strip()
    return s

def lon_360_to_180(lon_east_0_360: float) -> float:
    """Convierte 0–360E a rango [-180, 180)."""
    x = ((lon_east_0_360 + 180.0) % 360.0) - 180.0
    # normaliza -180 a 180 para consistencia
    if x == -180.0:
        x = 180.0
    return x

def parse_coordinates(coord_text: str):
    """
    Devuelve lista de (lon,lat) como floats a partir de una cadena KML:
    "lon,lat[,alt] lon,lat ..." (separados por espacios)
    """
    coords = []
    if not coord_text:
        return coords
    for tok in coord_text.strip().split():
        parts = tok.split(",")
        if len(parts) >= 2:
            try:
                lon = float(parts[0])
                lat = float(parts[1])
                coords.append((lon, lat))
            except ValueError:
                pass
    return coords

def centroid_xy(points):
    if not points:
        return None
    # centroide simple (media aritmética; suficiente para polígonos chicos)
    x = sum(p[0] for p in points) / len(points)
    y = sum(p[1] for p in points) / len(points)
    return (x, y)

def kml_iter_placemarks(root):
    # namespaces frecuentes en KML
    ns = {
        "kml": "http://www.opengis.net/kml/2.2",
        "gx": "http://www.google.com/kml/ext/2.2"
    }
    # busca en cualquier profundidad
    for pm in root.findall(".//kml:Placemark", ns):
        yield pm, ns

def text_or_none(elem, tag, ns):
    node = elem.find(f"kml:{tag}", ns)
    return node.text if node is not None else None

def find_extendeddata_value(pm, ns, field_names):
    """
    Busca en ExtendedData/Data/value alguno de los posibles nombres de campo.
    Devuelve el primero encontrado.
    """
    ext = pm.find(".//kml:ExtendedData", ns)
    if ext is None:
        return None
    # <Data name="..."><value>...</value></Data>
    for data in ext.findall(".//kml:Data", ns):
        name_attr = data.attrib.get("name", "")
        if name_attr in field_names:
            val = data.findtext("kml:value", default="", namespaces=ns)
            if val:
                return val
    return None

def extract_feature_type(pm, ns):
    # distintas fuentes pueden etiquetar tipo como "feature_type", "descriptor", etc.
    candidates = ["feature_type", "descriptor", "descriptor_term", "type"]
    # intenta ExtendedData primero
    val = find_extendeddata_value(pm, ns, candidates)
    if val:
        return val.strip()
    # como fallback, intenta parsear del <description>
    desc = text_or_none(pm, "description", ns)
    if desc:
        desc_clean = strip_html_tags(desc)
        m = re.search(r"(Feature\s*Type|Descriptor\s*Term)\s*[:\-]\s*([A-Za-z]+)", desc_clean, re.I)
        if m:
            return m.group(2).strip()
    return None

def build_outputs(kml_bytes: bytes, body: str):
    """
    Devuelve (index_dict, geojson_feature_collection)
    index_dict: { normalized_name: { body, lat, lon, lon_180, feature_type, raw_name } }
    """
    root = ET.fromstring(kml_bytes)
    features = []
    index = {}

    for pm, ns in kml_iter_placemarks(root):
        name = text_or_none(pm, "name", ns) or ""
        name = name.strip()
        if not name:
            continue

        # Coordenadas: preferimos Point. Si no, Polygon (centroide).
        lon, lat = None, None

        point = pm.find(".//kml:Point/kml:coordinates", ns)
        if point is not None and point.text:
            pts = parse_coordinates(point.text)
            if pts:
                lon, lat = pts[0]

        if lon is None or lat is None:
            # Intentar Polygon outerBoundary
            poly = pm.find(".//kml:Polygon//kml:outerBoundaryIs//kml:LinearRing/kml:coordinates", ns)
            if poly is not None and poly.text:
                pts = parse_coordinates(poly.text)
                c = centroid_xy(pts)
                if c:
                    lon, lat = c

        if lon is None or lat is None:
            # Intentar LineString (poco común para gazetteer; tomamos el punto medio)
            line = pm.find(".//kml:LineString/kml:coordinates", ns)
            if line is not None and line.text:
                pts = parse_coordinates(line.text)
                if pts:
                    lon, lat = pts[len(pts)//2]

        if lon is None or lat is None:
            continue  # sin geometría utilizable

        # Tipo de rasgo (si está disponible)
        ftype = extract_feature_type(pm, ns)

        # Normaliza nombre
        key = normalize_name(name)

        # Convierte lon 0–360E a lon -180..180 (por si tu visor lo necesita)
        lon_180 = lon_360_to_180(lon)

        # Arma propiedades
        props = {
            "body": body,
            "name": name,
            "feature_type": ftype,
            "lat": lat,
            "lon_east_0_360": lon,
            "lon_westneg_180": lon_180
        }

        # Index
        index[key] = {
            "body": body,
            "lat": lat,
            "lon": lon,         # almacenamos la versión 0–360E nativa del KML
            "lon_180": lon_180, # y también la convertida a -180..180
            "feature_type": ftype,
            "raw_name": name
        }

        # GeoJSON Feature (usamos lon_180 para interoperar con librerías web comunes)
        feat = {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [lon_180, lat]},
            "properties": props
        }
        features.append(feat)

    fc = {"type": "FeatureCollection", "features": features}
    return index, fc

def kmz_to_kml_bytes(kmz_bytes: bytes) -> bytes:
    with zipfile.ZipFile(io.BytesIO(kmz_bytes)) as zf:
        # típicamente el archivo principal se llama doc.kml
        # pero por si acaso, tomamos el primer .kml
        for name in zf.namelist():
            if name.lower().endswith(".kml"):
                return zf.read(name)
    raise RuntimeError("No se encontró .kml dentro del KMZ")

def main():
    for src in SOURCES:
        body = src["body"]
        url = src["url"]
        print(f"[+] Descargando {body}: {url}")
        kmz = http_get(url)
        kml = kmz_to_kml_bytes(kmz)

        print(f"[+] Parseando KML de {body}...")
        index, fc = build_outputs(kml, body)

        # Guardar archivos
        with open(src["out_json"], "w", encoding="utf-8") as f:
            json.dump(index, f, ensure_ascii=False, indent=2)
        with open(src["out_geojson"], "w", encoding="utf-8") as f:
            json.dump(fc, f, ensure_ascii=False)

        print(f"[✔] {body}: {src['out_json']} y {src['out_geojson']} escritos.")

    print("\nListo. Sube los JSON al frontend y crea un índice por nombre para búsquedas NL.")

if __name__ == "__main__":
    main()
